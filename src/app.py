from db_interactions import connect, RegistrationDataModel, Token, TokenData, User, UserInDB, LoginData
from datetime import datetime, timedelta, timezone
from typing import Annotated, Union
import jwt
import dotenv
import os
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from pydantic import BaseModel

app = FastAPI()
dotenv.load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY") 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 3000

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)

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

def authenticate_user(username: str, password: str):
    """Verify username and password against the database"""
    try:
        with connect() as conn:
            with conn.cursor() as curs:
                curs.execute("SELECT username, email, password_hash FROM users WHERE username = %s", (username,))
                user_data = curs.fetchone()
                if not user_data:
                    return False
                username_db, email_db, hashed_password = user_data
                if not verify_password(password, hashed_password):
                    return False
                return UserInDB(username=username_db, email=email_db, hashed_password=hashed_password)
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

@app.post("/login", response_model=Token)
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], status_code=status.HTTP_200_OK):
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

# For protected routes, you'd use this to get the current user
async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    """Validate the access token and return the current user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        
        if username is None:
            raise credentials_exception
        
        token_data = TokenData(username=username)
    except InvalidTokenError:
        raise credentials_exception
    
    try:
        with connect() as conn:
            with conn.cursor() as curs:
                curs.execute("SELECT username, email FROM users WHERE username = %s", (token_data.username,))
                user_data = curs.fetchone()
                
                if user_data is None:
                    raise credentials_exception
                
                return User(username=user_data[0], email=user_data[1])
    except Exception:
        raise credentials_exception
