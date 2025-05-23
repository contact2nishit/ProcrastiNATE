from datetime import datetime, timedelta
from typing import List, Tuple, Literal, Dict, Union
from pydantic import BaseModel, Field
from data_models import *
import random

# ---- Constants ----
CHUNK_MINUTES = 15
SLEEP_HOURS = (23, 7)

# ---- Data Models ----

class TimeSlot(BaseModel):
    """Represents a single 15-minute time block."""
    start: datetime
    end: datetime

class ScheduledTaskInfo(BaseModel):
    """Represents how a task (assignment or chore) was scheduled."""
    effort_required: int  # in minutes
    effort_assigned: int  # in minutes
    status: Literal["fully_scheduled", "partially_scheduled", "unschedulable"]
    slots: List[TimeSlot] = Field(default_factory=list)

class AssignmentInRequest(BaseModel):
    """
    Name, due date, and effort (minutes of work) for an assignment
    """
    name: str
    effort: int # approximate minutes of work
    due: datetime

class Chore(BaseModel):
    """Represents a chore with a required effort and a flexible time window."""
    name: str
    effort: int  # in minutes
    window: Tuple[datetime, datetime]

class Meeting(BaseModel):
    """Represents a fixed meeting event that cannot be moved or overlapped."""
    start: datetime
    end: datetime

class ScheduleResult(BaseModel):
    """Captures the scheduling outcome for a full schedule pass."""
    assignments: Dict[str, ScheduledTaskInfo]
    chores: Dict[str, ScheduledTaskInfo]

# ---- Scheduling Logic ----

def generate_available_slots(meetings: List[Meeting], from_time: datetime, to_time: datetime) -> List[Tuple[datetime, datetime]]:
    """
    Generate 15-minute time slots between two timestamps, excluding:
    - Sleep time (11 PM to 7 AM)
    - Conflicts with meetings
    """
    step = timedelta(minutes=CHUNK_MINUTES)
    slots = []
    t = from_time
    while t + step <= to_time:
        if SLEEP_HOURS[0] <= t.hour or t.hour < SLEEP_HOURS[1]:
            t += step
            continue
        if not any(m.start <= t < m.end for m in meetings):
            slots.append((t, t + step))
        t += step
    return slots

def find_time_blocks(effort_minutes: int, available_slots: List[Tuple[datetime, datetime]], used_slots: set) -> List[Tuple[datetime, datetime]]:
    """
    Attempt to allocate contiguous 15-minute blocks for a task, skipping used slots.
    Returns the best available allocation, even if partial.
    """
    required_chunks = effort_minutes // CHUNK_MINUTES
    scheduled = []

    for slot in available_slots:
        if slot in used_slots:
            continue
        if not scheduled or scheduled[-1][1] == slot[0]:  # contiguous
            scheduled.append(slot)
        else:
            scheduled = [slot]
        if len(scheduled) == required_chunks:
            return scheduled
    return scheduled if scheduled else []

from collections import defaultdict

def loosely_sort_assignments(assignments: List[AssignmentInRequest], bucket_minutes: int = 240) -> List[AssignmentInRequest]:
    """
    Buckets assignments based on due date proximity and shuffles within each bucket
    to preserve prioritization but introduce scheduling diversity.
    """
    now = datetime.now()
    buckets = defaultdict(list)
    for a in assignments:
        bucket_key = int((a.due - now).total_seconds() // (bucket_minutes * 60))
        buckets[bucket_key].append(a)
    
    sorted_keys = sorted(buckets.keys())
    result = []
    for key in sorted_keys:
        group = buckets[key]
        random.shuffle(group)
        result.extend(group)
    return result


def schedule_tasks(
    meetings: List[Meeting],
    assignments: List[AssignmentInRequest],
    chores: List[Chore],
    num_schedules: int = 3
) -> List[ScheduleResult]:
    """
    Schedules assignments and chores around fixed meetings and sleep time.
    - Assignments are loosely prioritized by due date with some internal shuffling.
    - Chores are shuffled randomly per schedule.
    - Tasks can be interleaved (no need to fully complete one before starting another).
    """
    now = datetime.now()
    latest_time = max(
        [a.due for a in assignments] + [c.window[1] for c in chores]
    )
    results: List[ScheduleResult] = []

    for _ in range(num_schedules):
        used_slots = set(
            slot for m in meetings
            for slot in generate_available_slots([], m.start, m.end)
        )
        assignments_result: Dict[str, ScheduledTaskInfo] = {}
        chores_result: Dict[str, ScheduledTaskInfo] = {}

        # Loosely prioritize assignments, randomly shuffle chores
        prioritized_assignments = loosely_sort_assignments(assignments)
        randomized_chores = random.sample(chores, k=len(chores))

        task_queue: List[Tuple[Literal["assignment", "chore"], Union[AssignmentInRequest, Chore]]] = (
            [("assignment", a) for a in prioritized_assignments] +
            [("chore", c) for c in randomized_chores]
        )

        for task_type, task in task_queue:
            time_range = (now, task.due) if task_type == "assignment" else task.window
            available = generate_available_slots(meetings, *time_range)
            available = [s for s in available if s not in used_slots]

            assigned_slots = find_time_blocks(task.effort, available, used_slots)
            assigned_minutes = len(assigned_slots) * CHUNK_MINUTES
            status = (
                "fully_scheduled" if assigned_minutes == task.effort else
                "partially_scheduled" if assigned_minutes > 0 else
                "unschedulable"
            )

            for s in assigned_slots:
                used_slots.add(s)

            slot_objs = [TimeSlot(start=s[0], end=s[1]) for s in assigned_slots]
            info = ScheduledTaskInfo(
                effort_required=task.effort,
                effort_assigned=assigned_minutes,
                status=status,
                slots=slot_objs
            )

            if task_type == "assignment":
                assignments_result[task.name] = info
            else:
                chores_result[task.name] = info

        results.append(ScheduleResult(assignments=assignments_result, chores=chores_result))

    return results