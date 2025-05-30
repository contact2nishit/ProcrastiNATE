from datetime import datetime, timedelta, timezone
from typing import List, Tuple, Literal, Dict, Union
from pydantic import BaseModel, Field
from data_models import *
from collections import defaultdict
import random

# ---- Constants ----
CHUNK_MINUTES = 15
SLEEP_HOURS = (23, 7)

# ---- Helper ----

def ensure_aware(dt: datetime) -> datetime:
    """Ensure a datetime is timezone-aware in UTC"""
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)

# ---- Scheduling Logic ----

def generate_available_slots(meetings: List[Tuple[datetime, datetime]], from_time: datetime, to_time: datetime) -> List[Tuple[datetime, datetime]]:
    """Returns available time slots avoiding meetings and sleep hours"""
    from_time = ensure_aware(from_time)
    to_time = ensure_aware(to_time)

    step = timedelta(minutes=CHUNK_MINUTES)
    slots = []
    t = from_time
    while t + step <= to_time:
        # Skip sleep hours (23:00 to 07:00)
        if SLEEP_HOURS[0] <= t.hour or t.hour < SLEEP_HOURS[1]:
            t += step
            continue
        # Check if this slot conflicts with any meeting
        slot_conflicts = False
        for m_start, m_end in meetings:
            m_start = ensure_aware(m_start)
            m_end = ensure_aware(m_end)

            # Check if slot overlaps with meeting
            if not (t + step <= m_start or t >= m_end):
                slot_conflicts = True
                break

        if not slot_conflicts:
            slots.append((t, t + step))
        t += step
    return slots

def find_time_blocks(effort_minutes: int, available_slots: List[Tuple[datetime, datetime]], used_slots: set) -> List[Tuple[datetime, datetime]]:
    """Find consecutive time blocks for the required effort"""
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
    """Sort assignments loosely by due date with some randomization within time buckets"""
    now = datetime.now(timezone.utc)
    buckets = defaultdict(list)

    for a in assignments:
        due = ensure_aware(a.due)
        time_diff = (due - now).total_seconds()
        bucket_key = int(time_diff // (bucket_minutes * 60))
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
    """Generate multiple possible schedules for assignments and chores, avoiding meetings"""
    now = datetime.now(timezone.utc) if now is None else ensure_aware(now)

    due_times = [ensure_aware(a.due) for a in assignments]
    chore_end_times = [ensure_aware(c.window[1]) for c in chores]

    all_times = due_times + chore_end_times
    latest_time = max(all_times) if all_times else now + timedelta(days=1)

    all_meeting_times: List[Tuple[datetime, datetime]] = []
    for m in meetings:
        for start, end in m.start_end_times:
            all_meeting_times.append((ensure_aware(start), ensure_aware(end)))

    schedules_results = []

    for _ in range(num_schedules):
        used_slots = set()
        assignments_out = []
        chores_out = []
        conflicting_assignments = []
        conflicting_chores = []
        not_enough_time_assignments = []
        not_enough_time_chores = []

        prioritized_assignments = loosely_sort_assignments(assignments)
        randomized_chores = random.sample(chores, k=len(chores))

        task_queue: List[Tuple[Literal["assignment", "chore"], Union[AssignmentInRequest, ChoreInRequest]]] = (
            [("assignment", a) for a in prioritized_assignments] +
            [("chore", c) for c in randomized_chores]
        )

        for task_type, task in task_queue:
            if task_type == "assignment":
                time_range = (now, ensure_aware(task.due))
            else:
                w0, w1 = task.window
                time_range = (ensure_aware(w0), ensure_aware(w1))

            available = generate_available_slots(all_meeting_times, time_range[0], time_range[1])
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
