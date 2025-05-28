from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from typing import Annotated, Union, List, Tuple, Literal
from collections import defaultdict

# Request data models

class RegistrationDataModel(BaseModel):
    username: str
    email: str
    pwd: str


class TokenData(BaseModel):
    user_id: int | None = None

class TimeSlot(BaseModel):
    """A block of time"""
    start: datetime
    end: datetime

class User(BaseModel):
    username: str
    user_id: int
    email: str | None = None

class UserInDB(User):
    hashed_password: str

class LoginData(BaseModel):
    username: str
    password: str

class DeleteRequestDataModel(BaseModel):
    """
    Delete the meeting with the given occurence id in the database
    remove_all_future set to true removes future ocurrences of recurring meeting
    """
    occurence_id: int
    remove_all_future: bool

class UpdateRequestDataModel(BaseModel):
    """
        future_occurences: Boolean that represents whether the changed name and changed location should apply to future 
        occurences of the same meeting (time changes will not apply for now)
        meeting_id: The meetingID is a unique numeric ID for the meeting. It is returned in the MeetingInResponse schema
        ocurrence_id: Unique ID for each ocurrence of the meeting. The ocurrence with this ID will be the only one with its time changed
        Check MeetingInResponse schema to learn more
    """
    future_occurences: bool
    meeting_id: int 
    ocurrence_id: int
    new_name: str | None = None,
    new_time: datetime | None = None
    new_loc_or_link: str | None = None,

class MeetingInRequest(BaseModel):
    """
    Name, start and end times of each ocurrence
    start_end_times is a list of lists. Each sub-list should have exactly 2 timestamps, denoting the start and end time of a specific ocurrence
    Each sub-list in the larger list corresponds to one ocurrence
    Example: [[2PM, 3PM], [4PM, 5PM]] would mean 2 ocurrences: 2-3 PM one, and the 4-5 PM one
    Link or location of meeting
    """
    name: str
    start_end_times: List[List[datetime]]
    link_or_loc: str | None = None

class AssignmentInRequest(BaseModel):
    """
    Name, due date, and effort (minutes of work) for an assignment
    """
    name: str
    effort: int # approximate minutes of work
    due: datetime


class ChoreInRequest(BaseModel): 
    """Name, window in which the chore needs to be completed, and the minutes taken to complete"""
    name: str
    window: List[datetime] # start/end time; MUST HAVE exactly 2 elements
    effort: int

class ScheduleRequest(BaseModel):
    """Request to Schedule each assignment in the list, each meeting, and each chore"""
    assignments: List[AssignmentInRequest]
    meetings: List[MeetingInRequest]
    chores: List[ChoreInRequest]

class SessionCompletionDataModel(BaseModel):
    """Mark the assignment work session with occurence_id as completed or incomplete"""
    occurence_id: int
    completed: bool

# Response data models

class Token(BaseModel):
    access_token: str
    token_type: str

class UpdateResponseDataModel(BaseModel): 
    """Contains an optional message and a boolean (clashed) representing whether the updated time clashes with something else
    If it clashed, the time will not be updated (for now)
    Can only update the time of a meeting for now
    """
    clashed: bool
    message: str | None = None

class MessageResponseDataModel(BaseModel):
    """Simple message response"""
    message: str

class ScheduledTaskInfo(BaseModel):
    """Contains info about all the occurences of a scheduled task in a specific schedule. If you see ocurrence_ids in any other schema, they're in the same order as the list in this one"""
    effort_assigned: int
    status: Literal["fully_scheduled", "partially_scheduled", "unschedulable"]
    slots: List[TimeSlot]

class MeetingInResponse(MeetingInRequest):
    """Contains a list of unique ocurrence IDs IN THE SAME ORDER as ocurrences were mentioned in the start_end_time field of MeetingInRequest
    Also has a unique ID for the meeting as a whole
    """
    ocurrence_ids: List[int]
    meeting_id: int

class ChoreInPotentialSchedule(ChoreInRequest):
    """Contains one potential way to arrange sessions of work on this chore"""
    schedule: ScheduledTaskInfo

class AssignmentInPotentialSchedule(AssignmentInRequest):
    """Contains one potential way to arrange sessions of work on this chore"""
    schedule: ScheduledTaskInfo

class ChoreInResponse(ChoreInPotentialSchedule):
    """Contains a list of unique ocurrence IDs, a unique chore ID
    These function the same way as they do. Check MeetingInRequest and MeetingInResponse for the way the start_end_times, chore_id, and ocurrence_ids are formatted
    An occurrence is one block of time set aside to work on a chore, and there can be multiple for the same assignment
    """
    chore_id: int
    ocurrence_ids: List[int]

class AssignmentInResponse(AssignmentInPotentialSchedule):
    """Contains a list of unique ocurrence IDs, a unique assignment ID
    These function the same way as they do. Check MeetingInRequest and MeetingInResponse for the way the start_end_times, chore_id, and ocurrence_ids are formatted
    An occurrence is one block of time set aside to work on an assignment, and there can be multiple for the same assignment
    """
    assignment_id: int
    ocurrence_ids: List[int]


class Schedule(BaseModel):
    """
    A schedule is a list of AssignmentInPotentialSchedule and a list of ChoreInPotentialSchedule
    Essentially, it's a list of assignments and a list of chores, where each element denotes a specific set of times
    to work on the assignment/chore
    conflicting_assignemnts: Not possible to find a schedule in which there is time to work on these assignments
    conflicting_chores: Not possible to find a schedule in which there is time to work on these chores
    not_enough_time_assignments: Can work on these for a little bit, but not enough to meet the amount of time required
    same idea for chores
    """
    assignments: List[AssignmentInPotentialSchedule]
    chores: List[ChoreInPotentialSchedule]
    conflicting_assignments: List[str]
    conflicting_chores: List[str]
    not_enough_time_assignments: List[str]
    not_enough_time_chores: List[str]

class ScheduleResponseFormat(BaseModel):
    """Main element of response: a list of schedules
    conflicting_meetings: has the string names of meetings that couldn't be scheduled at all because they conflict with other meetings
    
    """
    conflicting_meetings: List[str]
    meetings: List[MeetingInResponse]
    schedules: List[Schedule]

class ScheduleSetInStone(BaseModel): 
    """A schedule that has been set in stone in the DB, complete with ocurrece IDs"""
    assignments: List[AssignmentInResponse]
    chores: List[ChoreInResponse]

class FetchResponse(BaseModel):
    """A list of assignments, chores, and meetings, with ocurrences, ocurrence IDs, and chore/assignment/meeting IDs"""
    assignments: List[AssignmentInResponse] | None = None
    chores: List[ChoreInResponse] | None = None
    meetings: List[MeetingInResponse] | None = None