from datetime import datetime, timedelta, timezone
from typing import List, Tuple, Literal, Dict, Union
from pydantic import BaseModel, Field
from data_models import *
import random
from datetime import datetime, timedelta


# ---- Constants ----
CHUNK_MINUTES = 15
SLEEP_HOURS = (23, 7)

# ---- Scheduling Logic ----

def generate_available_slots(meetings: List[Tuple[datetime, datetime]], from_time: datetime, to_time: datetime) -> List[Tuple[datetime, datetime]]:
    """Returns a time slot """
    step = timedelta(minutes=CHUNK_MINUTES)
    slots = []
    t = from_time
    while t + step <= to_time:
        if SLEEP_HOURS[0] <= t.hour or t.hour < SLEEP_HOURS[1]:
            t += step
            continue
        if not any(m_start <= t < m_end for m_start, m_end in meetings):
            slots.append((t, t + step))
        t += step
    return slots

def find_time_blocks(effort_minutes: int, available_slots: List[Tuple[datetime, datetime]], used_slots: set) -> List[Tuple[datetime, datetime]]:
    required_chunks = effort_minutes // CHUNK_MINUTES
    scheduled = []
    for slot in available_slots:
        if slot in used_slots:
            continue
        if not scheduled or scheduled[-1][1] == slot[0]:
            scheduled.append(slot)
        else:
            scheduled = [slot]
        if len(scheduled) == required_chunks:
            return scheduled
    return scheduled if scheduled else []

def loosely_sort_assignments(assignments: List[AssignmentInRequest], bucket_minutes: int = 240) -> List[AssignmentInRequest]:
    # Ensure now is timezone-aware UTC
    now = datetime.now(timezone.utc)
    buckets = defaultdict(list)
    for a in assignments:
        # Ensure a.due is timezone-aware (preferably UTC)
        due = a.due
        if due.tzinfo is None:
            due = due.replace(tzinfo=timezone.utc)
        else:
            due = due.astimezone(timezone.utc)
        bucket_key = int((due - now).total_seconds() // (bucket_minutes * 60))
        buckets[bucket_key].append(a)
    sorted_keys = sorted(buckets.keys())
    result = []
    for key in sorted_keys:
        group = buckets[key]
        random.shuffle(group)
        result.extend(group)
    return result

# ---- Main scheduling function ----

def schedule_tasks(
    meetings: List[MeetingInRequest],
    assignments: List[AssignmentInRequest],
    chores: List[ChoreInRequest],
    num_schedules: int = 3,
    now: datetime = None
) -> List[Schedule]:
    # Ensure now is timezone-aware UTC
    now = now or datetime.now(timezone.utc)
    # The following line will raise ValueError if both assignments and chores are empty:
    # latest_time = max([a.due for a in assignments] + [c.window[1] for c in chores])
    # If both lists are empty, max([]) is called, which is not allowed.

    # Fix: Only call max() if the list is not empty, otherwise set a default
    due_times = []
    for a in assignments:
        due = a.due
        if due.tzinfo is None:
            due = due.replace(tzinfo=timezone.utc)
        else:
            due = due.astimezone(timezone.utc)
        due_times.append(due)
    chore_end_times = []
    for c in chores:
        end = c.window[1]
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
        else:
            end = end.astimezone(timezone.utc)
        chore_end_times.append(end)
    all_times = due_times + chore_end_times
    if all_times:
        latest_time = max(all_times)
    else:
        # fallback: just use now + 1 day or raise a meaningful error
        latest_time = now + timedelta(days=1)
        # or: raise ValueError("No assignments or chores provided to schedule_tasks")

    # creates a list of tuple of meeting start and end times
    all_meeting_times: List[Tuple[datetime, datetime]] = []
    for m in meetings:
        for interval in m.start_end_times:
            start, end = interval
            if start.tzinfo is None:
                start = start.replace(tzinfo=timezone.utc)
            else:
                start = start.astimezone(timezone.utc)
            if end.tzinfo is None:
                end = end.replace(tzinfo=timezone.utc)
            else:
                end = end.astimezone(timezone.utc)
            all_meeting_times.append((start, end))
    # TODO: Ensure assignments/chores don't conflict with other assignments/chores
    # TODO: Should be able to interleave tasks: looks like this forces all tasks to be completed before moving to next
    schedules_results = []

    # loop over number to generate
    for _ in range(num_schedules):
        # creates a set with just all the slots that are currently used by meetings
        used_slots = set(
            slot for start, end in all_meeting_times
            for slot in generate_available_slots([], start, end)
        )

        assignments_out = []
        chores_out = []

        conflicting_assignments = []
        conflicting_chores = []
        not_enough_time_assignments = []
        not_enough_time_chores = []

        # Loosely sort assignments, by due date
        prioritized_assignments = loosely_sort_assignments(assignments)
        # randomly sample chores
        randomized_chores = random.sample(chores, k=len(chores))

        # list of tuples -> 1st says assi or chore, next contains request objects
        task_queue: List[Tuple[Literal["assignment", "chore"], Union[AssignmentInRequest, ChoreInRequest]]] = (
            [("assignment", a) for a in prioritized_assignments] +
            [("chore", c) for c in randomized_chores]
        )

        for task_type, task in task_queue:
            if task_type == "assignment":
                due = task.due
                if due.tzinfo is None:
                    due = due.replace(tzinfo=timezone.utc)
                else:
                    due = due.astimezone(timezone.utc)
                time_range = (now, due)
            else:
                w0, w1 = task.window
                if w0.tzinfo is None:
                    w0 = w0.replace(tzinfo=timezone.utc)
                else:
                    w0 = w0.astimezone(timezone.utc)
                if w1.tzinfo is None:
                    w1 = w1.replace(tzinfo=timezone.utc)
                else:
                    w1 = w1.astimezone(timezone.utc)
                time_range = (w0, w1)
            # Pass in all meeting times, unpack time range tuple
            available = generate_available_slots(all_meeting_times, *time_range)
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
            schedule_info = ScheduledTaskInfo(
                effort_assigned=assigned_minutes,
                status=status,
                slots=slot_objs
            )

            if task_type == "assignment":
                result = AssignmentInPotentialSchedule(**task.model_dump(), schedule=schedule_info)
                assignments_out.append(result)
                if status == "unschedulable":
                    conflicting_assignments.append(task.name)
                elif status == "partially_scheduled":
                    not_enough_time_assignments.append(task.name)
            else:
                result = ChoreInPotentialSchedule(**task.model_dump(), schedule=schedule_info)
                chores_out.append(result)
                if status == "unschedulable":
                    conflicting_chores.append(task.name)
                elif status == "partially_scheduled":
                    not_enough_time_chores.append(task.name)

        schedule = Schedule(
            assignments=assignments_out,
            chores=chores_out,
            conflicting_assignments=conflicting_assignments,
            conflicting_chores=conflicting_chores,
            not_enough_time_assignments=not_enough_time_assignments,
            not_enough_time_chores=not_enough_time_chores
        )
        schedules_results.append(schedule)

    return schedules_results
