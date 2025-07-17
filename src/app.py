from util import *
from data_models import *
from datetime import datetime, timedelta, timezone
from typing import Annotated, Union
import jwt
import asyncpg
import dotenv
import os
from fastapi import Depends, FastAPI, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from pydantic import BaseModel
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from scheduler import *
import httpx
from urllib.parse import urlencode
from fastapi.responses import RedirectResponse
import google.oauth2.credentials
import google_auth_oauthlib.flow
import os
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


dotenv.load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")


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
    allow_origins=["*"], 
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
            return MessageResponseDataModel(message="Account created Successfully")
    except HTTPException as e:
        raise e
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Something went wrong on the backend, please check the logs"
        )


@app.post("/login")
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], status_code=status.HTTP_200_OK) -> Token:
    """Authenticate user and provide an access token"""
    try:
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
        return LoginResponse(access_token=access_token)
    except HTTPException as e:
        raise e
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Something went wrong on the backend, please check the logs"
        )

# TODO: GOOGLE TOKEN MAY EXPIRE, USE REFRESH TOKEN

@app.get("/login/google")
async def login_google():
    # Redirect user to Google's OAuth consent screen
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
        'client_secret.json',
        scopes=[
            'https://www.googleapis.com/auth/calendar.readonly', 
            'https://www.googleapis.com/auth/calendar.events.readonly',
            'openid',
            'email',
            'profile'
        ]
    )
    flow.redirect_uri = GOOGLE_REDIRECT_URI
    authorization_url, state = flow.authorization_url(
        # Can refresh without asking
        access_type='offline',
        # Optional, enable incremental authorization. Recommended as a best practice.
        include_granted_scopes='true',
        # Optional, set prompt to 'consent' will prompt the user for consent
        prompt='consent'
    )
    return GoogleRedirectURL(redirect_url=authorization_url)

@app.get("/auth/google/callback")
async def google_callback(request: Request):

    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Missing code from Google")
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        id_token = token_data.get("id_token")

    # Get user info from id_token

    user_info = jwt.decode(id_token, options={"verify_signature": False})
    google_id = user_info["sub"]
    email = user_info.get("email")
    username = email.split("@")[0] if email else f"google_{google_id}"

    # Find or create user in DB
    async with app.state.pool.acquire() as conn:
        user_row = await conn.fetchrow("SELECT user_id FROM users WHERE google_id = $1", google_id)
        if user_row:
            user_id = user_row["user_id"]
            # Update tokens
            await conn.execute(
                "UPDATE users SET google_access_token = $1, google_refresh_token = $2 WHERE user_id = $3",
                access_token, refresh_token, user_id
            )
        else:
            # If user with same email exists, link Google account
            user_row = await conn.fetchrow("SELECT user_id FROM users WHERE email = $1", email)
            if user_row:
                user_id = user_row["user_id"]
                await conn.execute(
                    "UPDATE users SET google_id = $1, google_access_token = $2, google_refresh_token = $3, uses_google_oauth = $4 WHERE user_id = $5",
                    google_id, access_token, refresh_token, True, user_id
                )
            else:
                # Create new user
                user_id = await conn.fetchval(
                    "INSERT INTO users(username, email, google_id, google_access_token, google_refresh_token, uses_google_oauth) VALUES($1, $2, $3, $4, $5, $6) RETURNING user_id",
                    username, email, google_id, access_token, refresh_token, True
                )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    jwt_token = create_access_token(data={"sub": str(user_id)}, expires_delta=access_token_expires)
    # Hacky workaround for Expo Go: redirect to exp:// URL with token as query param
    # You must set EXPO_DEV_URL in your environment to your current exp:// URL (
    expo_dev_url = os.getenv("EXPO_DEV_URL")
    if expo_dev_url:
        # e.g., exp://192.168.1.2:19000/--/auth?token=...
        deep_link_url = f"{expo_dev_url}/--/auth?token={jwt_token}"
    else:
        # fallback to custom scheme for dev client
        deep_link_url = f"procrastinate://auth?token={jwt_token}"
    return RedirectResponse(deep_link_url)

@app.post("/googleCalendar/sync")
async def sync(token: Annotated[str, Depends(oauth2_scheme)], status_code=status.HTTP_201_CREATED) -> MessageResponseDataModel:
    """Pull all events from the user's google calendar that aren't already in the DB"""
    try:
        user = await get_current_user(token, app.state.pool)
        async with app.state.pool.acquire() as conn:
            # Get Google tokens for this user
            row = await conn.fetchrow(
                "SELECT google_access_token, google_refresh_token FROM users WHERE user_id = $1",
                user.user_id
            )
            if not row or not row["google_access_token"]:
                raise HTTPException(status_code=400, detail="User has not linked Google account.")
            access_token = row["google_access_token"]
            refresh_token = row["google_refresh_token"]

        creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            client_id=GOOGLE_CLIENT_ID,
            client_secret=GOOGLE_CLIENT_SECRET,
            token_uri="https://oauth2.googleapis.com/token",
        )
        # Refresh token if needed
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())

        service = build("calendar", "v3", credentials=creds)
        # Only fetch events with an end time in the future
        now_iso = datetime.now(timezone.utc).isoformat()
        events = []
        page_token = None
        while True:
            events_result = (
                service.events()
                .list(
                    calendarId="primary",
                    singleEvents=True,
                    orderBy="startTime",
                    maxResults=2500,  # Google API max per page
                    pageToken=page_token,
                    timeMin=now_iso,  # Only fetch events that start in the future
                )
                .execute()
            )
            items = events_result.get("items", [])
            events.extend(items)
            page_token = events_result.get("nextPageToken")
            if not page_token:
                break

        # For deduplication: fetch all meetings and their occurrences for this user
        async with app.state.pool.acquire() as conn:
            # Get all meetings for this user
            meetings = await conn.fetch(
                "SELECT meeting_id, meeting_name FROM meetings WHERE user_id = $1",
                user.user_id
            )
            meeting_name_to_id = {m['meeting_name']: m['meeting_id'] for m in meetings}

            # Get all meeting occurrences for this user, grouped by meeting_id
            occs = await conn.fetch(
                "SELECT meeting_id, start_time, end_time FROM meeting_occurences WHERE user_id = $1",
                user.user_id
            )
            occs_by_meeting = {}
            for occ in occs:
                occs_by_meeting.setdefault(occ['meeting_id'], set()).add((occ['start_time'], occ['end_time']))

            new_meetings = 0
            new_occs = 0
            for event in events:
                # Only sync events with a start and end time
                start = event.get("start", {}).get("dateTime")
                end = event.get("end", {}).get("dateTime")
                if not start or not end:
                    continue
                # Parse datetimes
                start_dt = datetime.fromisoformat(start.replace("Z", "+00:00"))
                end_dt = datetime.fromisoformat(end.replace("Z", "+00:00"))
                # Only add if at least one occurrence is in the future
                if end_dt < datetime.now(timezone.utc):
                    continue
                name = event.get("summary", "Google Event")
                location = event.get("location") or event.get("hangoutLink") or "Google Calendar"
                recurs = False  # For now, treat all as non-recurring

                # Check if meeting exists by name
                meeting_id = meeting_name_to_id.get(name)
                if meeting_id is None:
                    # Create new meeting
                    meeting_id = await conn.fetchval(
                        "INSERT INTO meetings(user_id, meeting_name, recurs, location_or_link) VALUES($1, $2, $3, $4) RETURNING meeting_id",
                        user.user_id, name, recurs, location
                    )
                    meeting_name_to_id[name] = meeting_id
                    occs_by_meeting[meeting_id] = set()
                    new_meetings += 1

                # Only add future occurrences
                occ_tuple = (start_dt, end_dt)
                if end_dt >= datetime.now(timezone.utc) and occ_tuple not in occs_by_meeting[meeting_id]:
                    await conn.execute(
                        "INSERT INTO meeting_occurences(user_id, meeting_id, start_time, end_time) VALUES($1, $2, $3, $4)",
                        user.user_id, meeting_id, start_dt, end_dt
                    )
                    occs_by_meeting[meeting_id].add(occ_tuple)
                    new_occs += 1

        return MessageResponseDataModel(message=f"Synced {new_meetings} new meetings and {new_occs} new occurrences from Google Calendar.")
    except HttpError as e:
        print(e)
        raise HTTPException(status_code=500, detail="Google Calendar API error")
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/schedule")
async def schedule(sched: ScheduleRequest, token: Annotated[str, Depends(oauth2_scheme)], status_code=status.HTTP_201_CREATED) -> ScheduleResponseFormat:
    """
    Sets in stone the meetings in the request, and then returns a list of possible ways to arrange times to work on assignments and chores.
    Now checks for conflicts with already scheduled meetings/assignments/chores.
    """
    try:
        user = await get_current_user(token, app.state.pool)
        now = datetime.now(timezone.utc)
        last_time = get_latest_time(sched.meetings, sched.assignments, sched.chores)
        # Fetch all existing meeting, assignment, and chore occurrences for this user
        async with app.state.pool.acquire() as conn:
            # Fetch all existing meeting occurrences
            meeting_rows = await conn.fetch(
                "SELECT start_time, end_time FROM meeting_occurences WHERE user_id = $1 AND (start_time < $2 OR end_time > $3)", user.user_id, last_time, now
            )
            # Fetch all existing assignment occurrences
            assignment_rows = await conn.fetch(
                "SELECT start_time, end_time FROM assignment_occurences WHERE user_id = $1 AND (start_time < $2 OR end_time > $3)", user.user_id, last_time, now
            )
            # Fetch all existing chore occurrences
            chore_rows = await conn.fetch(
                "SELECT start_time, end_time FROM chore_occurences WHERE user_id = $1 AND (start_time < $2 OR end_time > $3)", user.user_id, last_time, now
            )

        # Build a MeetingInRequest representing all existing scheduled blocks
        already_scheduled_times = []
        for row in meeting_rows:
            already_scheduled_times.append([row['start_time'], row['end_time']])
        for row in assignment_rows:
            already_scheduled_times.append([row['start_time'], row['end_time']])
        for row in chore_rows:
            already_scheduled_times.append([row['start_time'], row['end_time']])
        # Only add if there are any
        scheduled_blocker = MeetingInRequest(
            name="__already_scheduled__",
            start_end_times=already_scheduled_times,
            link_or_loc=None
        )

        
        # Call schedule_tasks with the blocker included
        schedules = schedule_tasks(
            sched.meetings + [scheduled_blocker],
            sched.assignments,
            sched.chores,
            tz_offset_minutes=getattr(sched, "tz_offset_minutes", 0)
        )

        # Now, check for conflicts between requested meetings and already scheduled blocks
        conflicting_meetings = []
        non_conflicting_meetings = []
        for meeting in sched.meetings:
            is_conflicting = False
            for occ in meeting.start_end_times:
                occ_start, occ_end = occ
                for block in already_scheduled_times:
                    block_start, block_end = block
                    # Check for overlap
                    if not (occ_end <= block_start or occ_start >= block_end):
                        is_conflicting = True
                        break
                if is_conflicting:
                    break
            if is_conflicting:
                conflicting_meetings.append(meeting.name)
            else:
                non_conflicting_meetings.append(meeting)

        # Only schedule non-conflicting meetings in the DB
        meeting_resp = []
        async with app.state.pool.acquire() as conn:
            for meeting in non_conflicting_meetings:
                lloc = "N/A" if meeting.link_or_loc is None else meeting.link_or_loc
                recurs: bool = len(meeting.start_end_times) > 1
                meeting_id1: int = await conn.fetchval(
                    "INSERT INTO meetings(user_id, meeting_name, recurs, location_or_link) VALUES($1, $2, $3, $4) RETURNING meeting_id",
                    user.user_id, meeting.name, recurs, lloc
                )
                occurence_ids = []
                for times in meeting.start_end_times:
                    start = times[0]
                    end = times[1]
                    start = enforce_timestamp_utc(start)
                    end = enforce_timestamp_utc(end)
                    occurence_id: int = await conn.fetchval(
                        "INSERT INTO meeting_occurences(user_id, meeting_id, start_time, end_time) VALUES($1, $2, $3, $4) RETURNING occurence_id",
                        user.user_id, meeting_id1, start, end
                    )
                    occurence_ids += [occurence_id]
                meeting_response = MeetingInResponse(
                    ocurrence_ids=occurence_ids,
                    meeting_id=meeting_id1,
                    name=meeting.name,
                    start_end_times=meeting.start_end_times,
                    link_or_loc=meeting.link_or_loc
                )
                meeting_resp += [meeting_response]
        return ScheduleResponseFormat(conflicting_meetings=conflicting_meetings, meetings=meeting_resp, schedules=schedules)
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
    try:
        async with app.state.pool.acquire() as conn:
            user = await get_current_user(token, app.state.pool)
            assignment_return_list:List[AssignmentInResponse] = []
            for assignment in chosen_schedule.assignments:
                print(assignment.due)
                assignment.due = enforce_timestamp_utc(assignment.due)
                print(type(assignment.due))
                print(assignment.due.tzinfo)
                assign_id = await conn.fetchval("INSERT INTO assignments(user_id, assignment_name, effort, deadline) VALUES($1, $2, $3, $4) RETURNING assignment_id", user.user_id, assignment.name, assignment.effort, assignment.due)
                occurence_ids = []
                for timeslot in assignment.schedule.slots:
                    timeslot.start = enforce_timestamp_utc(timeslot.start)
                    timeslot.end = enforce_timestamp_utc(timeslot.end)
                    occurence_id = await conn.fetchval("INSERT INTO assignment_occurences(user_id, assignment_id, start_time, end_time, xp_potential) VALUES($1, $2, $3, $4, $5) RETURNING occurence_id", user.user_id, assign_id, timeslot.start, timeslot.end, timeslot.xp_potential)
                    occurence_ids.append(occurence_id)
                assignment_return = AssignmentInResponse(
                    assignment_id = assign_id,
                    ocurrence_ids = occurence_ids,
                    name = assignment.name,
                    effort = assignment.effort,
                    due = assignment.due,
                    schedule = ScheduledTaskInfo(
                        effort_assigned = assignment.schedule.effort_assigned,
                        status = assignment.schedule.status,
                        slots = assignment.schedule.slots,
                    ),
                    completed = [False] * len(occurence_ids)
                )
                assignment_return_list.append(assignment_return)

            chore_return_list:List[ChoreInResponse] = []
            for chore in chosen_schedule.chores:
                chore.window[0] = enforce_timestamp_utc(chore.window[0])
                chore.window[1] = enforce_timestamp_utc(chore.window[1])
                assign_id = await conn.fetchval("INSERT INTO chores(chore_name, effort, start_window, end_window, user_id) VALUES($1, $2, $3, $4, $5) RETURNING chore_id", chore.name, chore.effort, chore.window[0], chore.window[1], user.user_id)
                occurence_ids = []
                for timeslot in chore.schedule.slots:
                    timeslot.start = enforce_timestamp_utc(timeslot.start)
                    timeslot.end = enforce_timestamp_utc(timeslot.end)
                    occurence_id = await conn.fetchval("INSERT INTO chore_occurences(chore_id, start_time, end_time, user_id, xp_potential) VALUES($1, $2, $3, $4, $5) RETURNING occurence_id", assign_id, timeslot.start, timeslot.end, user.user_id, timeslot.xp_potential)
                    occurence_ids.append(occurence_id)
                chore_return = ChoreInResponse(
                    chore_id = assign_id,
                    ocurrence_ids = occurence_ids,
                    name = chore.name,
                    effort = chore.effort,
                    window = chore.window,
                    schedule = ScheduledTaskInfo(
                        effort_assigned = chore.schedule.effort_assigned,
                        status = chore.schedule.status,
                        slots = chore.schedule.slots,
                    ),
                    completed = [False] * len(occurence_ids)
                )
                chore_return_list.append(chore_return)
            return ScheduleSetInStone(
                assignments = assignment_return_list,
                chores = chore_return_list,
            )     
    except HTTPException as e:
        raise e
    except Exception as e:
        print(e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@app.post("/markSessionCompleted")
async def mark_session_completed(complete: SessionCompletionDataModel, token: Annotated[str, Depends(oauth2_scheme)]) -> MessageResponseDataModel:
    """Mark one session of time allocated to work on an assignment (could be multiple sessions per assignment) as complete or incomplete"""
    prop_xp: float = complete.locked_in / 10
    try:
        async with app.state.pool.acquire() as conn:
            user = await get_current_user(token, app.state.pool)
            if complete.is_assignment:
                xp_potential: int  = await conn.fetchval('UPDATE assignment_occurences SET (completed, locked_in) = ($1, $2) WHERE occurence_id = $3 AND user_id = $4 RETURNING xp_potential', complete.completed, complete.locked_in, complete.occurence_id, user.user_id)
                if xp_potential is not None:
                    xp_gained: int = round(prop_xp * xp_potential)
                    new_xp: int = await conn.fetchval("UPDATE users SET xp = xp + $1 WHERE user_id = $2 RETURNING xp", xp_gained, user.user_id)
                    return MessageResponseDataModel(message='Successfully marked assignment as complete!', new_xp=new_xp)
                else:
                    raise HTTPException(status_code=400, detail="You picked a bad occurence id")
            else:
                xp_potential: int = await conn.fetchval('UPDATE chore_occurences SET (completed, locked_in) = ($1, $2) WHERE occurence_id = $3 AND user_id = $4 RETURNING xp_potential', complete.completed, complete.locked_in, complete.occurence_id, user.user_id)
                if xp_potential is not None:
                    xp_gained: int = round(prop_xp * xp_potential)
                    new_xp: int = await conn.fetchval("UPDATE users SET xp = xp + $1 WHERE user_id = $2 RETURNING xp", xp_gained, user.user_id)
                    return MessageResponseDataModel(message='Successfully marked chore as complete!', new_xp=new_xp)
                else:
                    raise HTTPException(status_code=400, detail="You picked a bad occurence id")
    except HTTPException as e:
        raise e
    except Exception as e:
        print(e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail = "Internal server error")

@app.post("/update")
async def update(changes: UpdateRequestDataModel, token: Annotated[str, Depends(oauth2_scheme)]) -> UpdateResponseDataModel:
    """
    Updates the time, name, and location/video call link of one occurrence of a meeting.
    Can optionally also alter name and location/video call link of all future occurrences, but not time of all future occurrences.
    """
    try:
        async with app.state.pool.acquire() as conn:
            user = await get_current_user(token, app.state.pool)
            # Update name/location for all future occurrences if requested
            if changes.future_occurences:
                # Update name/location for all future occurrences (not time)
                updates = []
                if changes.new_name:
                    await conn.execute(
                        "UPDATE meetings SET meeting_name = $1 WHERE meeting_id = $2 AND user_id = $3",
                        changes.new_name, changes.meeting_id, user.user_id
                    )
                    updates.append("name")
                if changes.new_loc_or_link:
                    await conn.execute(
                        "UPDATE meetings SET location_or_link = $1 WHERE meeting_id = $2 AND user_id = $3",
                        changes.new_loc_or_link, changes.meeting_id, user.user_id
                    )
                    updates.append("location/link")
                return UpdateResponseDataModel(clashed=False, message=f"Updated {', '.join(updates)} for all future occurrences.")
            else:
                # Only update the specific occurrence
                clashed = False
                # If new_time is provided, check for conflicts
                if changes.new_time:
                    # Check for time clash with other meetings for this user
                    clash = await conn.fetchval(
                        """
                        SELECT 1 FROM meeting_occurences
                        WHERE user_id = $1 AND meeting_id != $2
                        AND (($3, $3 + (end_time - start_time)) OVERLAPS (start_time, end_time))
                        """,
                        user.user_id, changes.meeting_id, changes.new_time
                    )
                    if clash:
                        return UpdateResponseDataModel(clashed=True, message="Time update would clash with another meeting.")
                    await conn.execute(
                        "UPDATE meeting_occurences SET start_time = $1 WHERE occurence_id = $2 AND user_id = $3",
                        changes.new_time, changes.ocurrence_id, user.user_id
                    )
                # Update name/location for this occurrence
                if changes.new_name:
                    await conn.execute(
                        "UPDATE meetings SET meeting_name = $1 WHERE meeting_id = $2 AND user_id = $3",
                        changes.new_name, changes.meeting_id, user.user_id
                    )
                if changes.new_loc_or_link:
                    await conn.execute(
                        "UPDATE meetings SET location_or_link = $1 WHERE meeting_id = $2 AND user_id = $3",
                        changes.new_loc_or_link, changes.meeting_id, user.user_id
                    )
                return UpdateResponseDataModel(clashed=False, message="Occurrence updated successfully.")
    except HTTPException as e:
        raise e
    except Exception as e:
        print(e)
        return UpdateResponseDataModel(clashed=True, message="Internal server error")

@app.post("/delete")
async def delete(deletion: DeleteRequestDataModel, token: Annotated[str, Depends(oauth2_scheme)]) -> MessageResponseDataModel:
    """
    Delete one occurrence of a meeting, assignment, or chore. For meetings, can also delete all future occurrences.
    For assignments/chores, deletes all occurrences and the parent record.
    """
    try:
        async with app.state.pool.acquire() as conn:
            user = await get_current_user(token, app.state.pool)
            if deletion.event_type == "meeting":
                if deletion.remove_all_future:
                    # Find the meeting_id and the start_time of the occurrence to delete
                    row = await conn.fetchrow(
                        "SELECT meeting_id, start_time FROM meeting_occurences WHERE occurence_id = $1 AND user_id = $2",
                        deletion.occurence_id, user.user_id
                    )
                    if not row:
                        return MessageResponseDataModel(message="Occurrence not found.")
                    meeting_id = row['meeting_id']
                    start_time = row['start_time']
                    # Delete all occurrences with start_time >= this occurrence's start_time
                    await conn.execute(
                        "DELETE FROM meeting_occurences WHERE meeting_id = $1 AND user_id = $2 AND start_time >= $3",
                        meeting_id, user.user_id, start_time
                    )
                    await conn.execute(
                        "DELETE FROM meetings WHERE meeting_id = $1 AND user_id = $2",
                        meeting_id, user.user_id,
                    )
                    return MessageResponseDataModel(message="Deleted this and all future occurrences.")
                else:
                    # Only delete the specified occurrence
                    await conn.execute(
                        "DELETE FROM meeting_occurences WHERE occurence_id = $1 AND user_id = $2",
                        deletion.occurence_id, user.user_id
                    )
                    return MessageResponseDataModel(message="Occurrence deleted.")
            elif deletion.event_type == "assignment":
                # Get assignment_id from the occurrence
                row = await conn.fetchrow(
                    "SELECT assignment_id FROM assignment_occurences WHERE occurence_id = $1 AND user_id = $2",
                    deletion.occurence_id, user.user_id
                )
                if not row:
                    return MessageResponseDataModel(message="Occurrence not found.")
                ass_id = row['assignment_id']
                # Delete all occurrences for this assignment
                await conn.execute(
                    "DELETE FROM assignment_occurences WHERE assignment_id = $1 AND user_id = $2",
                    ass_id, user.user_id
                )
                # Delete the assignment itself
                await conn.execute(
                    "DELETE FROM assignments WHERE assignment_id = $1 AND user_id = $2",
                    ass_id, user.user_id,
                )
                return MessageResponseDataModel(message="Assignment and all its occurrences deleted.")
            elif deletion.event_type == "chore":
                # Get chore_id from the occurrence
                row = await conn.fetchrow(
                    "SELECT chore_id FROM chore_occurences WHERE occurence_id = $1 AND user_id = $2",
                    deletion.occurence_id, user.user_id
                )
                if not row:
                    return MessageResponseDataModel(message="Occurrence not found.")
                chore_id = row['chore_id']
                # Delete all occurrences for this chore
                await conn.execute(
                    "DELETE FROM chore_occurences WHERE chore_id = $1 AND user_id = $2",
                    chore_id, user.user_id
                )
                # Delete the chore itself
                await conn.execute(
                    "DELETE FROM chores WHERE chore_id = $1 AND user_id = $2",
                    chore_id, user.user_id,
                )
                return MessageResponseDataModel(message="Chore and all its occurrences deleted.")
            else:
                return MessageResponseDataModel(message="Invalid event_type.")
    except HTTPException as e:
        raise e
    except Exception as e:
        print(e)
        return MessageResponseDataModel(message="Internal server error")
    
@app.post("/reschedule")
async def reschedule(re: RescheduleRequestDataModel, token: Annotated[str, Depends(oauth2_scheme)]) -> Schedule:
    """
    Reschedule just a single assignment/chore and return a new schedule for just that one (setSchedule still needed after).
    Deletes all current occurrences but not the parent assignment/chore record.
    """
    try:
        async with app.state.pool.acquire() as conn:
            user = await get_current_user(token, app.state.pool)
            now = datetime.now(timezone.utc)

            if re.event_type not in ("assignment", "chore"):
                raise HTTPException(status_code=400, detail="Invalid event_type")

            table = "assignments" if re.event_type == "assignment" else "chores"
            occ_table = "assignment_occurences" if re.event_type == "assignment" else "chore_occurences"
            id_col = "assignment_id" if re.event_type == "assignment" else "chore_id"
            name_col = "assignment_name" if re.event_type == "assignment" else "chore_name"

            obj_id = re.id
            # Fetch the parent record
            if re.event_type == "assignment":
                row = await conn.fetchrow(
                    f"SELECT {id_col}, {name_col}, effort, deadline FROM {table} WHERE user_id = $1 AND {id_col} = $2",
                    user.user_id, obj_id
                )
            else:
                row = await conn.fetchrow(
                    f"SELECT {id_col}, {name_col}, effort, start_window, end_window FROM {table} WHERE user_id = $1 AND {id_col} = $2",
                    user.user_id, obj_id
                )
            if not row:
                raise HTTPException(status_code=404, detail=f"{re.event_type.capitalize()} not found")

            obj_id = row[id_col]
            name = row[name_col]
            old_effort = row['effort']
            if re.event_type == "assignment":
                old_window_start = None
                old_window_end = old_due = row['deadline']
            else:
                old_window_start = row['start_window']
                old_window_end = row['end_window']
                old_due = None

            # Get all current occurrences for this assignment/chore
            old_occs = await conn.fetch(
                f"SELECT start_time, end_time FROM {occ_table} WHERE {id_col} = $1 AND user_id = $2",
                obj_id, user.user_id
            )
            old_slots = [[o['start_time'], o['end_time']] for o in old_occs]

            # Delete all occurrences for this assignment/chore
            await conn.execute(
                f"DELETE FROM {occ_table} WHERE {id_col} = $1 AND user_id = $2",
                obj_id, user.user_id
            )

            # Update parent record if new values provided
            if re.event_type == "assignment":
                update_fields = []
                update_values = []
                param_idx = 1
                if re.new_effort is not None:
                    update_fields.append(f"effort = ${param_idx}")
                    update_values.append(re.new_effort)
                    param_idx += 1
                if re.new_window_end is not None:
                    update_fields.append(f"deadline = ${param_idx}")
                    # Ensure deadline is a datetime, not an int
                    if isinstance(re.new_window_end, int):
                        raise HTTPException(status_code=400, detail="Deadline must be a datetime, not an integer")
                    update_values.append(re.new_window_end)
                    param_idx += 1
                if update_fields:
                    await conn.execute(
                        f"UPDATE {table} SET {', '.join(update_fields)} WHERE {id_col} = ${param_idx} AND user_id = ${param_idx+1}",
                        *(update_values + [obj_id, user.user_id])
                    )
                new_effort = re.new_effort if re.new_effort is not None else old_effort
                new_due = re.new_window_end if re.new_window_end is not None else old_due
                assignment_req = AssignmentInRequest(
                    name=name,
                    effort=new_effort,
                    due=new_due
                )
            else:
                update_fields = []
                update_values = []
                param_idx = 1
                if re.new_effort is not None:
                    update_fields.append(f"effort = ${param_idx}")
                    update_values.append(re.new_effort)
                    param_idx += 1
                if re.new_window_start is not None:
                    update_fields.append(f"start_window = ${param_idx}")
                    if isinstance(re.new_window_start, int):
                        raise HTTPException(status_code=400, detail="start_window must be a datetime, not an integer")
                    update_values.append(re.new_window_start)
                    param_idx += 1
                if re.new_window_end is not None:
                    update_fields.append(f"end_window = ${param_idx}")
                    if isinstance(re.new_window_end, int):
                        raise HTTPException(status_code=400, detail="end_window must be a datetime, not an integer")
                    update_values.append(re.new_window_end)
                    param_idx += 1
                if update_fields:
                    await conn.execute(
                        f"UPDATE {table} SET {', '.join(update_fields)} WHERE {id_col} = ${param_idx} AND user_id = ${param_idx+1}",
                        *(update_values + [obj_id, user.user_id])
                    )
                new_effort = re.new_effort if re.new_effort is not None else old_effort
                new_window_start = re.new_window_start if re.new_window_start is not None else old_window_start
                new_window_end = re.new_window_end if re.new_window_end is not None else old_window_end
                chore_req = ChoreInRequest(
                    name=name,
                    window=[new_window_start, new_window_end],
                    effort=new_effort
                )

            # Gather all other blocked times (meetings, assignments, chores)
            # If allow_overlaps is False, include old_slots as blocked times
            meetings = await conn.fetch(
                "SELECT start_time, end_time FROM meeting_occurences WHERE user_id = $1",
                user.user_id
            )
            assignments = await conn.fetch(
                "SELECT start_time, end_time FROM assignment_occurences WHERE user_id = $1" + (f" AND assignment_id != {obj_id}" if re.event_type == "assignment" else ""),
                user.user_id
            )
            chores = await conn.fetch(
                "SELECT start_time, end_time FROM chore_occurences WHERE user_id = $1" + (f" AND chore_id != {obj_id}" if re.event_type == "chore" else ""),
                user.user_id
            )
            blocked_times = []
            for r in meetings:
                blocked_times.append([r['start_time'], r['end_time']])
            for r in assignments:
                blocked_times.append([r['start_time'], r['end_time']])
            for r in chores:
                blocked_times.append([r['start_time'], r['end_time']])
            if not re.allow_overlaps:
                blocked_times.extend(old_slots)

            scheduled_blocker = MeetingInRequest(
                name="__already_scheduled__",
                start_end_times=blocked_times,
                link_or_loc=None
            )

            # Call scheduler for just this assignment/chore
            tz_offset = getattr(re, "tz_offset_minutes", 0)
            if re.event_type == "assignment":
                schedules = schedule_tasks(
                    [scheduled_blocker], [assignment_req], [], tz_offset_minutes=tz_offset
                )
            else:
                schedules = schedule_tasks(
                    [scheduled_blocker], [], [chore_req], tz_offset_minutes=tz_offset
                )
            return schedules[0]

    except HTTPException as e:
        raise e
    except Exception as e:
        print(e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@app.get("/fetch")
async def fetch(start_time: str, end_time: str, meetings: bool, assignments: bool, chores: bool, token: Annotated[str, Depends(oauth2_scheme)]) -> FetchResponse:
    """
    Fetches everything (chores, assignments, meetings) between start and end timestamps. Every input is a query parameter
        Args
            start_time(str): ISO-formatted timestamp
            end_time(str): ISO-formatted timestamp
            meetings(bool): Include meetings?
            assignments(bool): Include assignments?
            chores(bool): Include chores?
    """
    try:
        async with app.state.pool.acquire() as conn:
            user = await get_current_user(token, app.state.pool)
            start_time = datetime.fromisoformat(start_time)
            end_time = datetime.fromisoformat(end_time)
            start_time = enforce_timestamp_utc(start_time)
            end_time = enforce_timestamp_utc(end_time)
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
                    SELECT ao.occurence_id, ao.assignment_id, ao.start_time, ao.end_time, ao.completed, a.assignment_name, a.effort, a.deadline
                    FROM assignment_occurences ao
                    JOIN assignments a ON ao.assignment_id = a.assignment_id
                    WHERE ao.user_id = $1 AND ao.end_time > $2 AND ao.start_time < $3
                """, user.user_id, start_time, end_time)
            else:
                assignments = []
            if chores:
                chores = await conn.fetch("""
                SELECT co.occurence_id, co.chore_id, co.start_time, co.end_time, co.completed, c.chore_name, c.effort, c.start_window, c.end_window
                FROM chore_occurences co
                JOIN chores c ON co.chore_id = c.chore_id
                WHERE co.user_id = $1 AND co.end_time > $2 AND co.start_time < $3
                """, user.user_id, start_time, end_time)
            else:
                chores = []
            # print(meetings, assignments, chores)
            meetings_responses, assignments_responses, chores_responses = [], [], []
            
            if len(meetings) > 0:
                partitioned_meetings = partition_by_meeting_id(meetings, 'meeting_id')
                for occurence_list in partitioned_meetings:
                    meeting_start_end_times = []
                    meeting_occurence_ids = []
                    for occurence in occurence_list:
                        meeting_start_end_times += [[occurence['start_time'], occurence['end_time']]]
                        meeting_occurence_ids += [occurence['occurence_id']]
                    # print(occurence_list[0]['meeting_name'])
                    meeting_response = MeetingInResponse(
                        ocurrence_ids=meeting_occurence_ids,
                        meeting_id=occurence_list[0]['meeting_id'],
                        name = occurence_list[0]['meeting_name'],
                        start_end_times=meeting_start_end_times
                    )
                    meetings_responses.append(meeting_response)
            if len(assignments) > 0:
                partitioned_assignments = partition_by_meeting_id(assignments, 'assignment_id')
                for occurence_list in partitioned_assignments:
                    ass_start_end_times: List[TimeSlot] = []
                    ass_occurence_ids = []
                    ass_complete = []
                    effort_assigned = 0
                    for occurence in occurence_list:
                        ass_start_end_times += [TimeSlot(start=occurence['start_time'], end=occurence['end_time'])]
                        effort_assigned += (occurence['end_time'] - occurence['start_time']).total_seconds() // 60
                        ass_occurence_ids += [occurence['occurence_id']]
                        ass_complete += [occurence['completed']]
                    assignment_response = AssignmentInResponse(
                        ocurrence_ids=ass_occurence_ids,
                        assignment_id=occurence_list[0]['assignment_id'],
                        name = occurence_list[0]['assignment_name'],
                        effort=occurence_list[0]['effort'],
                        due=occurence_list[0]['deadline'],
                        schedule = ScheduledTaskInfo(
                            effort_assigned=effort_assigned,
                            status="unschedulable" if effort_assigned == 0 else ("partially_scheduled" if effort_assigned < occurence['effort'] else "fully_scheduled"),
                            slots = ass_start_end_times
                        ),
                        completed=ass_complete
                    )
                    assignments_responses.append(assignment_response)
            if len(chores) > 0:
                partitioned_chores = partition_by_meeting_id(chores, 'chore_id')
                for occurence_list in partitioned_chores:
                    chore_start_end_times: List[TimeSlot] = []
                    chore_occurence_ids = []
                    c_complete = []
                    effort_assigned = 0
                    for occurence in occurence_list:
                        chore_start_end_times += [TimeSlot(start=occurence['start_time'], end=occurence['end_time'])]
                        effort_assigned += (occurence['end_time'] - occurence['start_time']).total_seconds() // 60
                        chore_occurence_ids += [occurence['occurence_id']]
                        c_complete += [occurence['completed']]
                    chore_response = ChoreInResponse(
                        ocurrence_ids=chore_occurence_ids,
                        chore_id=occurence_list[0]['chore_id'],
                        name = occurence_list[0]['chore_name'],
                        effort=occurence_list[0]['effort'],
                        window = [occurence_list[0]['start_window'], occurence_list[0]['end_window']],
                        schedule = ScheduledTaskInfo(
                            effort_assigned=effort_assigned,
                            status="unschedulable" if effort_assigned == 0 else ("partially_scheduled" if effort_assigned < occurence['effort'] else "fully_scheduled"),
                            slots = chore_start_end_times
                        ),
                        completed=c_complete
                    )
                    chores_responses.append(chore_response)
            print((FetchResponse(meetings=meetings_responses, assignments=assignments_responses, chores=chores_responses)).json())
            return FetchResponse(meetings=meetings_responses, assignments=assignments_responses, chores=chores_responses)
    except HTTPException as e:
        raise e
    except Exception as e:
        print(e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")
