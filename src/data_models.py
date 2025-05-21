from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from typing import Annotated, Union, List

# Request data models

class RegistrationDataModel(BaseModel):
    username: str
    email: str
    pwd: str


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

class DeleteRequestDataModel(BaseModel):
    occurence_id: int
    remove_all_future: bool

class UpdateRequestDataModel(BaseModel):
    future_occurences: bool
    meeting_id: int 
    new_name: str | None = None,
    new_time: datetime | None = None
    new_loc_or_link: str | None = None,

class AssignmentInRequest(BaseModel):
    name: str
    effort: int # approximate minutes of work
    due_date: datetime

class MeetingInRequest(BaseModel):
    name: str
    start_end_times: List[List[datetime]]
    link_or_loc: str | None = None

class ChoreInRequest(BaseModel): 
    name: str
    window: List[datetime] # start/end time
    effort: int

class ScheduleRequest(BaseModel):
    assignments: List[AssignmentInRequest]
    meetings: List[MeetingInRequest]
    chores: List[ChoreInRequest]

class SessionCompletionDataModel(BaseModel):
    occurence_id: int
    completed: bool

# Response data models

class Token(BaseModel):
    access_token: str
    token_type: str

class UpdateResponseDataModel(BaseModel): 
    clashed: bool
    message: str | None = None

class MessageResponseDataModel(BaseModel):
    message: str

class MeetingInResponse(MeetingInRequest):
    ocurrence_ids: List[int]

class ChoreInResponse(ChoreInRequest):
    start_end_times: List[List[datetime]]
    ocurrence_ids: List[int]

class AssignmentInResponse(AssignmentInRequest):
    start_end_times: List[List[datetime]]
    ocurrence_ids: List[int]

class Schedule(BaseModel):
    assignments: List[AssignmentInResponse]
    chores: List[ChoreInResponse]
    # this one is used in both request and response

class ScheduleResponseFormat(BaseModel):
    conflicting_meetings: List[str]
    conflicting_assignments: List[str]
    conflicting_chores: List[str]
    not_enough_time_assignments: List[str]
    not_enough_time_chores: List[str]
    meetings: List[MeetingInResponse]
    schedules: List[Schedule]

class FetchResponse(BaseModel):
    assignments: List[AssignmentInResponse] | None = None
    chores: List[ChoreInResponse] | None = None
    meetings: List[MeetingInResponse] | None = None