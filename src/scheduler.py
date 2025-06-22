from datetime import datetime, timedelta, timezone
from typing import List, Tuple, Literal, Dict, Union
from pydantic import BaseModel, Field
from data_models import *
from util import *
import random
from datetime import datetime, timedelta


# ---- Constants ----
CHUNK_MINUTES = 1

# ---- Scheduling Logic ----

def generate_available_slots(meetings: List[Tuple[datetime, datetime]], from_time: datetime, to_time: datetime) -> List[Tuple[datetime, datetime]]:
    """Returns a time slot """
    step = timedelta(minutes=CHUNK_MINUTES)
    slots = []
    t = from_time
    while t + step <= to_time:
        # Fix: Exclude slots where ANY overlap with a meeting, not just t in [m_start, m_end)
        slot_start = t
        slot_end = t + step
        # A slot is available only if it does NOT overlap with any meeting
        overlaps = any(
            not (slot_end <= m_start or slot_start >= m_end)
            for m_start, m_end in meetings
        )
        if not overlaps:
            slots.append((slot_start, slot_end))
        t += step
    return slots

def find_time_blocks(
    effort_minutes: int,
    available_slots: List[Tuple[datetime, datetime]],
    used_slots: set,
    skip_prob: float = 0.0
) -> List[Tuple[datetime, datetime]]:
    """
    Try to find any set of available time slots (not necessarily contiguous) to fit the required effort (in minutes).
    If skip_prob > 0.0, at every slot whose start time is a 30-minute multiple, skip_prob is the probability
    that the algorithm skips forward and tries to schedule the next block 2 hours after.
    After a skip, do not apply the skip rule again until at least 30 minutes of scheduling has occurred.
    If skipping lands past the end, backtrack and try to fill as much as possible.
    """
    assigned_mins = 0
    scheduled = []
    i = 0
    n = len(available_slots)
    last_skip_idx = -9999  # index of last skip
    min_gap_slots = 30 // CHUNK_MINUTES  # 30 minutes worth of slots

    while i < n and assigned_mins < effort_minutes:
        slot = available_slots[i]
        if slot in used_slots:
            i += 1
            continue

        # Ignore seconds and microseconds for skip logic
        slot_start = slot[0]
        minute = slot_start.minute
        hour = slot_start.hour
        # Only use hour and minute for skip logic
        can_skip = (
            skip_prob > 0.0 and
            (minute % 30 == 0) and
            (i - last_skip_idx >= min_gap_slots)
        )
        did_skip = False
        if can_skip and random.random() < skip_prob:
            skip_time = slot_start.replace(second=0, microsecond=0) + timedelta(hours=2)
            next_idx = None
            for j in range(i + 1, n):
                # Compare only hour and minute for skip target
                candidate = available_slots[j][0]
                if (candidate.hour > skip_time.hour or (candidate.hour == skip_time.hour and candidate.minute >= skip_time.minute)) and available_slots[j] not in used_slots:
                    next_idx = j
                    break
            if next_idx is not None:
                last_skip_idx = next_idx
                i = next_idx
                did_skip = True
                continue
            # If skip would go past end, backtrack: ignore skip, just continue scheduling as normal
        # Schedule this slot
        if not scheduled or scheduled[-1][1] != slot[0]:
            scheduled.append(slot)
        else:
            scheduled[-1] = (scheduled[-1][0], slot[1])
        assigned_mins += CHUNK_MINUTES
        i += 1
        if did_skip:
            last_skip_idx = i - 1

    if assigned_mins < effort_minutes and skip_prob > 0.0:
        return find_time_blocks(effort_minutes, available_slots, used_slots, skip_prob=0.0)
    return scheduled

def loosely_sort_assignments(assignments: List[AssignmentInRequest], bucket_minutes: int = 240) -> List[AssignmentInRequest]:
    # Ensure now is timezone-aware UTC
    now = datetime.now(timezone.utc)
    buckets = defaultdict(list)
    for a in assignments:
        due = enforce_timestamp_utc(a.due)
        bucket_key = int((due - now).total_seconds() // (bucket_minutes * 60))
        buckets[bucket_key].append(a)
    sorted_keys = sorted(buckets.keys())
    result = []
    for key in sorted_keys:
        group = buckets[key]
        random.shuffle(group)  # Only shuffle within each bucket
        result.extend(group)
    return result

def calc_xp_for_slot(
    slot_start: datetime,
    slot_end: datetime,
    total_effort: int,
    due_time: datetime,
    now: datetime,
) -> int:
    """
    XP is 100 per hour if finished right now, 0 if finished at due_time.
    Scales linearly with duration and time left.
    """
    duration_min = int((slot_end - slot_start).total_seconds() // 60)
    # If due_time is in the past, XP is 0
    if due_time <= now:
        return 0
    # Time left from now to due
    total_window = (due_time - now).total_seconds()
    # Time left from slot_end to due
    slot_time_left = (due_time - slot_end).total_seconds()
    # If slot is after due, XP is 0
    if slot_time_left < 0:
        return 0
    # XP per minute if finished now
    xp_per_min = 100 / 60
    # XP scales linearly with time left
    time_factor = max(0, slot_time_left / total_window)
    # XP for this slot
    xp = xp_per_min * duration_min * time_factor
    return int(round(xp))

# ---- Main scheduling function ----

def schedule_tasks(
    meetings: List[MeetingInRequest],
    assignments: List[AssignmentInRequest],
    chores: List[ChoreInRequest],
    num_schedules: int = 3,
    end_time: datetime = None,
    now: datetime = datetime.now(timezone.utc),
    skip_p: float = 0.0
) -> List['Schedule']:
    # Ensure now is timezone-aware UTC
    """
        General flow:
            1. First get all meeting start/end times
            2. Loop over num schedules
                a. Create list of used slots and fill with meetings
                b. Init lists for schedule info
                c. Loosely sort asssignments, randomize chores
                d. Then create task queue with assignments/chores
                e. Iterate through tasks in queue
                    i. Get time ranges the task can be worked on
                    ii. Generate all available time windows not used by meetings and previous tasks in queue
                    iii. Then use find_time_blocks logic to find a block
                    iv. Add this to used slots, and figure out if enough was scheduled
    
    """
    if end_time is None:
        end_time = get_latest_time(meetings, assignments, chores)
    # Compute all meeting times
    all_meeting_times: List[Tuple[datetime, datetime]] = []
    for m in meetings:
        for interval in m.start_end_times:
            start, end = enforce_timestamp_utc(interval[0]), enforce_timestamp_utc(interval[1])
            all_meeting_times.append((start, end))

    # Find the latest relevant end time (assignment due, chore window end, meeting end)
    latest_times = []
    for a in assignments:
        latest_times.append(enforce_timestamp_utc(a.due))
    for c in chores:
        latest_times.append(enforce_timestamp_utc(c.window[1]))
    for m in all_meeting_times:
        latest_times.append(m[1])
    if latest_times:
        latest_time = max(latest_times)
    else:
        latest_time = now + timedelta(days=1)

    # Generate all available slots once for the entire scheduling window
    available = generate_available_slots(all_meeting_times, now, latest_time)

    schedules_results = []

    for _ in range(num_schedules):
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

        prioritized_assignments = loosely_sort_assignments(assignments)
        randomized_chores = random.sample(chores, k=len(chores))

        task_queue: List[Tuple[Literal["assignment", "chore"], Union[AssignmentInRequest, ChoreInRequest]]] = (
            [("assignment", a) for a in prioritized_assignments] +
            [("chore", c) for c in randomized_chores]
        )

        total_potential_xp = 0

        for task_type, task in task_queue:
            if task_type == "assignment":
                time_range = (now, enforce_timestamp_utc(task.due))
            else:
                w0, w1 = enforce_timestamp_utc(task.window[0]), enforce_timestamp_utc(task.window[1])
                time_range = (w0, w1)
            avail_for_this = [
                s for s in available
                if s not in used_slots and s[0] >= time_range[0] and s[1] <= time_range[1]
            ]
            # DO NOT shuffle avail_for_this

            assigned_slots = find_time_blocks(task.effort, avail_for_this, used_slots, skip_prob=skip_p)
            assigned_minutes = 0
            for start, end in assigned_slots:
                assigned_minutes += (end - start).total_seconds() / 60

            status = (
                "fully_scheduled" if assigned_minutes == task.effort else
                "partially_scheduled" if assigned_minutes > 0 else
                "unschedulable"
            )

            for s in assigned_slots:
                used_slots.add(s)

            slot_objs = []
            if task_type == "assignment":
                due_time = enforce_timestamp_utc(task.due)
                total_effort = task.effort
                for s in assigned_slots:
                    xp = calc_xp_for_slot(s[0], s[1], total_effort, due_time, now)
                    total_potential_xp += xp
                    slot_objs.append(TimeSlot(start=s[0], end=s[1], xp_potential=xp))
            else:
                due_time = enforce_timestamp_utc(task.window[1])
                total_effort = task.effort
                for s in assigned_slots:
                    xp = calc_xp_for_slot(s[0], s[1], total_effort, due_time, now)
                    total_potential_xp += xp
                    slot_objs.append(TimeSlot(start=s[0], end=s[1], xp_potential=xp))
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
            not_enough_time_chores=not_enough_time_chores,
            total_potential_xp=total_potential_xp
        )
        schedules_results.append(schedule)

    return schedules_results