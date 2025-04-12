from db_interactions import connect, RegistrationDataModel, Token, TokenData, User, UserInDB
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
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

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
                user = curs.fetchone()
                if user: 
                    status_code = status.HTTP_409_CONFLICT
                    return {"error": "already exists"}
                hash = get_password_hash(pwd)
                curs.execute("INSERT INTO users(username, email, password_hash) VALUES(%s, %s, %s)", (user, mail, hash))
                conn.commit()
                return {"message": "Account created"}
    except Exception:
        return {"message": "something is wrong"}
        

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}