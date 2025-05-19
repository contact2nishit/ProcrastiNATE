from util import *
from data_models import *
from datetime import datetime, timedelta, timezone
from typing import Annotated, Union
import jwt
import psycopg
import dotenv
import os
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from pydantic import BaseModel

app = FastAPI()

dotenv.load_dotenv()



@app.post("/register")
async def register(data: RegistrationDataModel, status_code=status.HTTP_201_CREATED):
    if not data.username or not data.email or not data.pwd:
        status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Username, email, or password missing"}
    user = data.username
    mail = data.email
    pwd = data.pwd
    try:
        with connect() as conn:
            with conn.cursor() as curs: 
                curs.execute("SELECT id FROM users WHERE username = %s OR email = %s", (user, mail))
                user1 = curs.fetchone()
                if user1: 
                    status_code = status.HTTP_409_CONFLICT
                    return {"error": "already exists"}
                hash = get_password_hash(pwd)
                curs.execute("INSERT INTO users(username, email, password_hash) VALUES(%s, %s, %s)", (user, mail, hash))
                conn.commit()
                return {"message": "Account created"}
    except Exception:
        return {"message": "something is wrong"}



@app.post("/login")
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], status_code=status.HTTP_200_OK) -> Token:
    """Authenticate user and provide an access token"""
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/schedule")
async def schedule(sched: ScheduleRequest, status_code=status.HTTP_201_CREATED) -> ScheduleResponseFormat:
    """Sets in stone the meetings in the request, and then returns a list of possible ways to arrange times to work on assignments and chores"""
    pass

@app.post("/setSchedule")
async def set_schedule(chosen_schedule: Schedule, status_code=status.HTTP_201_CREATED) -> MessageResponseDataModel:
    """Picks a "schedule" (a list of possible ways to arrange times to work on assignments and chores) and sets it in stone"""
    pass

@app.post("/markSessionCompleted")
async def mark_session_completed(complete: SessionCompletionDataModel) -> MessageResponseDataModel:
    """Mark one session of time allocated to work on an assignment (could be multiple sessions per assignment) as complete or incomplete"""
    pass

@app.post("/update")
async def update(changes: UpdateRequestDataModel) -> UpdateResponseDataModel:
    """Updates the time, name, and location/video call link of one ocurrence of a meeting. Can optionally
    also alter name, and location/video call link of all future ocurrences, but not time of all future ocurrences"""
    pass

@app.post("/delete")
async def delete(deletion: DeleteRequestDataModel) -> MessageResponseDataModel:
    """Delete one ocurrence of a meeting. Optionally, also delete all future ocurrences"""
    pass

@app.get("/fetch")
async def fetch(start_time: str, end_time: str, meetings: bool, assignments: bool, chores: bool) -> FetchResponse:
    """
    Fetches everything (chores, assignments, meetings) between start and end timestamps. Every input is a query parameter
        Args
            start_time(str): ISO-formatted timestamp
            end_time(str): ISO-formatted imestamp
            meetings(bool): Include meetings?
            assignments(bool): Include assignments?
            chores(bool): Include chores?
    """
    pass
