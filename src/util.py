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

dotenv.load_dotenv()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY") 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 3000
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


async def authenticate_user(pool, username: str, password: str):
    """Verify username and password against the database
        Args: 
            username(str): the username to check
            password(str): the password to check
            pool(app.state.pool): the asyncpg pool
        Returns:
            UserInDB or False
    """
    try:
        async with pool.acquire() as conn:
            user_data = conn.fetchrow("SELECT username, id, email, password_hash FROM users WHERE username = %s", (username,))
            if not user_data:
                return False
            username_db, user_id, email_db, hashed_password = user_data
            if not verify_password(password, hashed_password):
                return False
            return UserInDB(username=username_db, id=user_id, email=email_db, hashed_password=hashed_password)
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
async def get_current_user(token: Annotated[int, Depends(oauth2_scheme)], pool):
    """Validate the access token and return the current user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        
        if user_id is None:
            raise credentials_exception
        
        token_data = TokenData(user_id=user_id)
    except InvalidTokenError:
        raise credentials_exception
    
    try:
        with pool.acquire() as conn:
            user_data = conn.fetchrow("SELECT username, user_id, email FROM users WHERE user_id = %s", (token_data.user_id,))
            if user_data is None:
                raise credentials_exception
            return User(username=user_data[0], id=user_data[1], email=user_data[2])
    except Exception:
        raise credentials_exception

