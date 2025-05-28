from util import *
from data_models import *
from datetime import datetime, timedelta, timezone
from typing import Annotated, Union
import jwt
import asyncpg
import dotenv
import os
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from pydantic import BaseModel
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from scheduler import *



dotenv.load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pool = await asyncpg.create_pool(
        dsn=DATABASE_URL,
        max_size=10,
    )
    yield
    await app.state.pool.close()

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/register")
async def register(data: RegistrationDataModel, status_code=status.HTTP_201_CREATED):
    if not data.username or not data.email or not data.pwd:
        status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Username, email, or password missing"}
    user = data.username
    mail = data.email
    pwd = data.pwd
    try:
        async with app.state.pool.acquire() as conn:
            user1 = await conn.fetchrow("SELECT user_id FROM users WHERE username = $1 OR email = $2", user, mail)
            if user1: 
                status_code = status.HTTP_409_CONFLICT
                return {"error": "An account is already registered with the given username or email"}
            hash = get_password_hash(pwd)
            await conn.execute("INSERT INTO users(username, email, password_hash) VALUES($1, $2, $3)", user, mail, hash)
            return {"message": "Account created successfully!"}
    except Exception as e:
        print(e)
        return {"message": "something is wrong"}



@app.post("/login")
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], status_code=status.HTTP_200_OK) -> Token:
    """Authenticate user and provide an access token"""
    user = await authenticate_user(form_data.username, form_data.password, app.state.pool)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.user_id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

"""@app.post("/getuser")
async def getuser(token: Annotated[str, Depends(oauth2_scheme)]) -> MessageResponseDataModel:
    try:
        # print(SECRET_KEY)
        user = await get_current_user(token.strip(), app.state.pool)
        return {"message": user.username}
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e: 
        print(e)
        return {"message": "something is wrong"}"""


@app.post("/schedule")
async def schedule(sched: ScheduleRequest, token: Annotated[str, Depends(oauth2_scheme)], status_code=status.HTTP_201_CREATED) -> ScheduleResponseFormat:
    """Sets in stone the meetings in the request, and then returns a list of possible ways to arrange times to work on assignments and chores"""
    # TODO: Major improvements needed to scheduling algo
    # TODO: Ensure assignments/chores don't conflict with other assignments/chores. Right now, only checks meetings within the same request, need to also go into DB before
    # TODO: Should be able to interleave tasks: looks like this forces all tasks to be completed before moving to next
    # TODO: Check the use of random.sample() for chores. It might pick k samples (may repeat)
    # TODO: check for conflicting meetings
    # TODO: insert link_or_loc if not None
    # TODO: clean up confusing naming
    try:
        user = await get_current_user(token, app.state.pool)
        schedules = schedule_tasks(sched.meetings, sched.assignments, sched.chores) # 3 schedules for now
        # for each meeting
            # create a meeting in response object in parallel list
        meeting_resp = []
        async with app.state.pool.acquire() as conn:
            for meeting in sched.meetings:
                recurs: bool = len(meeting.start_end_times) > 1
                meeting_id1: int = await conn.fetchval("INSERT INTO meetings(user_id, meeting_name, recurs) VALUES($1, $2, $3) RETURNING meeting_id", user.user_id, meeting.name, recurs)
                occurence_ids = []
                for times in meeting.start_end_times:
                    occurence_id: int = await conn.fetchval("INSERT INTO meeting_occurences(user_id, meeting_id, start_time, end_time) VALUES($1, $2, $3, $4) RETURNING occurence_id", user.user_id, meeting_id1, times[0], times[1])
                    occurence_ids += [occurence_id]
                meeting_response = MeetingInResponse(ocurrence_ids=occurence_ids, meeting_id=meeting_id1, name=meeting.name, start_end_times=meeting.start_end_times, link_or_loc=meeting.link_or_loc)
                meeting_resp += [meeting_response]
        return {"conflicting_meetings": [], "meetings": meeting_resp, "schedules": schedules}
    except HTTPException as http_exc:
        # Pass through known HTTP exceptions like 401
        raise http_exc
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Something went wrong on the backend, please check the logs"
        )
    

@app.post("/setSchedule")
async def set_schedule(chosen_schedule: Schedule, token: Annotated[str, Depends(oauth2_scheme)], status_code=status.HTTP_201_CREATED) -> ScheduleSetInStone:
    """Picks a "schedule" (a list of possible ways to arrange times to work on assignments and chores) and sets it in stone"""
    pass

@app.post("/markSessionCompleted")
async def mark_session_completed(complete: SessionCompletionDataModel, token: Annotated[str, Depends(oauth2_scheme)]) -> MessageResponseDataModel:
    """Mark one session of time allocated to work on an assignment (could be multiple sessions per assignment) as complete or incomplete"""
    pass

@app.post("/update")
async def update(changes: UpdateRequestDataModel, token: Annotated[str, Depends(oauth2_scheme)]) -> UpdateResponseDataModel:
    """Updates the time, name, and location/video call link of one ocurrence of a meeting. Can optionally
    also alter name, and location/video call link of all future ocurrences, but not time of all future ocurrences"""
    pass

@app.post("/delete")
async def delete(deletion: DeleteRequestDataModel, token: Annotated[str, Depends(oauth2_scheme)]) -> MessageResponseDataModel:
    """Delete one ocurrence of a meeting. Optionally, also delete all future ocurrences"""
    pass

@app.get("/fetch")
async def fetch(start_time: str, end_time: str, meetings: bool, assignments: bool, chores: bool, token: Annotated[str, Depends(oauth2_scheme)]) -> FetchResponse:
    """
    Fetches everything (chores, assignments, meetings) between start and end timestamps. Every input is a query parameter
        Args
            start_time(str): ISO-formatted timestamp
            end_time(str): ISO-formatted imestamp
            meetings(bool): Include meetings?
            assignments(bool): Include assignments?
            chores(bool): Include chores?
    """
    try:
        async with app.state.pool.acquire() as conn:
            user = await get_current_user(token, app.state.pool)
            start_time = datetime.fromisoformat(start_time)
            end_time = datetime.fromisoformat(end_time)
            if start_time > end_time:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Start time must be before end time")
            if meetings:
                meetings = await conn.fetch("""
                    SELECT mo.occurence_id, mo.meeting_id, mo.start_time, mo.end_time, m.meeting_name, m.location_or_link
                    FROM meeting_occurences mo
                    JOIN meetings m ON mo.meeting_id = m.meeting_id
                    WHERE mo.user_id = $1 AND mo.end_time > $2 AND mo.start_time < $3
                """, user.user_id, start_time, end_time)
                print(start_time, end_time, user.user_id)
                print(type(start_time))
                #meetings = await conn.fetch("SELECT meeting_id, occurence_id FROM meeting_occurences WHERE start_time>$1 AND end_time<$2", start_time, end_time)
            else:
                meetings = []
            if assignments:
                assignments = await conn.fetch("""
                    SELECT ao.occurence_id, ao.assignment_id, ao.start_time, ao.end_time, a.assignment_name, a.effort, a.deadline
                    FROM assignment_occurences ao
                    JOIN assignments a ON ao.assignment_id = a.assignment_id
                    WHERE ao.user_id = $1 AND ao.end_time > $2 AND ao.start_time < $3
                """, user.user_id, start_time, end_time)
            else:
                assignments = []
            if chores:
                chores = await conn.fetch("""
                SELECT co.occurence_id, co.chore_id, co.start_time, co.end_time, c.chore_name, c.effort, c.start_window, c.end_window
                FROM chore_occurences co
                JOIN chores c ON co.chore_id = c.chore_id
                WHERE co.user_id = $1 AND co.end_time > $2 AND co.start_time < $3
                """, user.user_id, start_time, end_time)
            else:
                chores = []
            print(meetings, assignments, chores)
            meetings_responses, assignments_responses, chore_responses = [], [], []
            for row in meetings:
                meeting_response = MeetingInResponse(
                    occurence_ids=[row['occurence_id']],
                    meetings_id=row['meeting_id'],
                    name = row.meeting_name,
                    start_end_times=[[row.start_time, row.end_time]],
                    link_or_loc = row.link_or_loc
                )
                meetings_responses.append(meeting_response)
            for row in assignments:
                assignment_response = AssignmentInResponse(
                    occurence_ids=[row['occurence_id']],
                    assignment_id=row['assignment_id'],
                    name = row.assignment_name,
                    start_end_times=[[row.start_time, row.end_time]],
                    effort = row.effort,
                    due = row.deadline,
                    # schedule=ScheduledTaskInfo(
                    #     effort_assigned = 
                    # )
                )
                assignments_responses.append(assignment_response)
            for row in chores:
                chore_response = ChoreInResponse(
                    occurence_ids=[row['occurence_id']],
                    chore_id=row['chore_id'],
                    name = row.chore_name,
                    start_end_times = [[row.start_time, row.end_time]],
                    effort = row.effort,
                    window = [row.start_window, row.end_window]
                )
            return FetchResponse(meetings=meetings, assignments=assignments, chores=chores)
    except HTTPException as e:
        raise e
    except Exception as e:
        print(e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

