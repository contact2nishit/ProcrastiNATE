import dotenv
import os
import asyncpg
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from typing import Annotated, Union
import jwt
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from data_models import *
from collections import defaultdict

MAX_LEVEL = 100 # Maximum level a user can achieve

dotenv.load_dotenv()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY") 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 3000
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)

def partition_by_meeting_id(data: List, field: str):
    """
        Data: the list of dictionaries to partition
        field: the field to partition by
    """
    grouped = defaultdict(list)
    for item in data:
        grouped[item[field]].append(item)
    return list(grouped.values())

async def authenticate_user(username: str, password: str, pool):
    """Verify username and password against the database
        Args: 
            username(str): the username to check
            password(str): the password to check
            pool(app.state.pool): the asyncpg pool
        Returns:
            UserInDB (contains all user data including pw hash) or False
    """
    try:
        async with pool.acquire() as conn:
            user_data = await conn.fetchrow("SELECT username, user_id, email, password_hash FROM users WHERE username = $1", username)
            if not user_data:
                return False
            username_db, id, email_db, hashed_password = user_data
            if not verify_password(password, hashed_password):
                return False
            return UserInDB(username=username_db, user_id=id, email=email_db, hashed_password=hashed_password)
    except Exception as e:
        # Log the error for debugging
        print(f"Authentication error: {str(e)}")
        return False

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """Create a new JWT token for the authenticated user"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# For protected routes, you'd use this to get the current user
async def get_current_user(token: str, pool):
    # print(SECRET_KEY)
    """Validate the access token and return the current user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    # print(f"hello {token}")
    try:
        #print("before")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        #print("mid")
        user_id: int = int(payload.get("sub"))
        #print("after")
        if user_id is None:
            raise credentials_exception
        
        token_data = TokenData(user_id=user_id)
    except InvalidTokenError as e:
        print(e)
        raise credentials_exception
    
    try:
        async with pool.acquire() as conn:
            # print(f"here {user_id}")
            nom, id, mail = await conn.fetchrow("SELECT username, user_id, email FROM users WHERE user_id = $1", user_id)
            if nom is None:
                # print("here2")
                raise credentials_exception
            return User(username=nom, user_id=id, email=mail)
    except Exception as e:
        print(e)
        raise credentials_exception

def enforce_timestamp_utc(time: datetime):
    if hasattr(time, 'tzinfo') and time.tzinfo is not None:
        time = time.astimezone(timezone.utc)
    else:
        time = time.replace(tzinfo=timezone.utc)
    return time

def get_latest_time(
    meetings: List[MeetingInRequest],
    assignments: List[AssignmentInRequest],
    chores: List[ChoreInRequest]
):
    """
        Given lists of events, find the latest time that one stretches to
    """
    latest_times = []
    for a in assignments:
        latest_times.append(enforce_timestamp_utc(a.due))
    for c in chores:
        latest_times.append(enforce_timestamp_utc(c.window[1]))
    for m in meetings:
        for pair in m.start_end_times:
            latest_times.append(pair[1])
    if latest_times:
        latest_time = max(latest_times)
    else:
        latest_time = datetime.now(timezone.utc) + timedelta(days=1)
    
    return latest_time

def get_xp_for_next_level(level: int):
    '''
    Given a level, return the XP required to reach the next level.
    '''
    if level < 1:
        return 0
    elif level >= MAX_LEVEL:
        return float('inf')
    else:
        return int(100 * (level ** 1.5))
    
# def check_assignment_completed (
#     assignments: List[List[bool]],
# ) -> bool:
#     """
#     Check if all assignments in the list are completed.
#     Args:
#         assignments (List[List[bool]]): List of lists containing completion status of assignments.
#     Returns:
#         bool: True if all assignments are completed, False otherwise.
#     """
#     for assignment in assignments:
#         if not all(assignment):
#             return False
#     return True