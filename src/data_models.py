from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from typing import Annotated, Union


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
    id: int
    email: str | None = None

class UserInDB(User):
    hashed_password: str

class LoginData(BaseModel):
    username: str
    password: str