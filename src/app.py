from db_interactions import connect, RegistrationDataModel, Token, TokenData, User, UserInDB
from datetime import datetime, timedelta, timezone
from typing import Annotated, Union
import jwt
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from pydantic import BaseModel

app = FastAPI()

@app.post("/register")
async def register(data: RegistrationDataModel, status_code=status.HTTP_201_CREATED):
    if not data.username or not data.email or not data.pwd:
        status_code = status.HTTP_400_BAD_REQUEST
        return {"error": "Username, email, or password missing"}
    user = data.username
    mail = data.email
    pwd = data.pwd
    with connect() as conn:
        with conn.cursor() as curs: 
                curs.execute("SELECT id FROM users WHERE username = %s OR email = %s", (username, email))
                user = curs.fetchone()
                if user: 
                    status_code = status.HTTP_409_CONFLICT
                    return {"error": "already exists"}
                hash = hashpw(password.encode('utf-8'), gensalt()).decode('utf-8')
                curs.execute("INSERT INTO users(username, email, password_hash) VALUES(%s, %s, %s)", (username, email, hash))
                conn.commit()
                return jsonify({"message": "user added"}), 201
    except Exception:
        return jsonify({"message": "something is wrong"}), 500
        

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}