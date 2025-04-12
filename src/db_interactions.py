import dotenv
import os
import psycopg
from pydantic import BaseModel

class RegistrationDataModel(BaseModel):
    username: str
    email: str
    pwd: str

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None


class User(BaseModel):
    username: str
    email: str | None = None

class UserInDB(User):
    hashed_password: str

class LoginData(BaseModel):
    username: str
    password: str


def connect():
    dotenv.load_dotenv()
    return psycopg.connect(f'dbname={os.getenv("DB_NAME")} user={os.getenv("DB_USER")} password={os.getenv("DB_PASSWORD")} host={os.getenv("DB_HOST")} port={os.getenv("DB_PORT")}')

