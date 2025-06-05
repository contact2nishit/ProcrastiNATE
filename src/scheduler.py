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

    General flow: 
        1. Set up tracking vars
        2. While not fully assigned and within index range of available_slots:
            a. If slot not used, check if skipping is possible (p > 0 and 30 min increment but also that being on this specific slot not result of skip)
            b. If skip is true, calculate start time of the skipped slot
            c. The inner for loop finds if a slot with the start time that is 2 hours later exists
            d. If it does, mark this as the last index skipped to, i, and say skip happened, jumping to iteration with i being that
            e. If skip not possible, just schedule
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

        # Check if we can apply skip rule
        can_skip = (
            skip_prob > 0.0 and
            (slot[0].minute % 30 == 0 and slot[0].second == 0 and slot[0].microsecond == 0) and
            (i - last_skip_idx >= min_gap_slots)
        )
        did_skip = False
        if can_skip and random.random() < skip_prob:
            # Try to skip forward 2 hours (120 minutes)
            skip_time = slot[0] + timedelta(hours=2)
            # Find the next available slot at or after skip_time
            next_idx = None
            for j in range(i + 1, n):
                if available_slots[j][0] >= skip_time and available_slots[j] not in used_slots:
                    next_idx = j
                    break
            if next_idx is not None:
                last_skip_idx = next_idx
                i = next_idx
                did_skip = True
                continue
            # If skip would go past end, backtrack: ignore skip, just continue scheduling as normal
            # (do not increment i here, so we try to schedule this slot)
        # Schedule this slot
        if not scheduled or scheduled[-1][1] != slot[0]:
            scheduled.append(slot)
        else:
            scheduled[-1] = (scheduled[-1][0], slot[1])
        assigned_mins += CHUNK_MINUTES
        i += 1
        # After a skip, require at least 30 minutes of scheduling before next skip
        if did_skip:
            last_skip_idx = i - 1

    # If we ended due to a skip that landed past the end, backtrack and try to fill as much as possible
    if assigned_mins < effort_minutes and skip_prob > 0.0:
        # Try again with skip_prob=0.0 to fill as much as possible
        return find_time_blocks(effort_minutes, available_slots, used_slots, skip_prob=0.0)
    return scheduled

def loosely_sort_assignments(assignments: List[AssignmentInRequest], bucket_minutes: int = 240) -> List[AssignmentInRequest]:
    # Ensure now is timezone-aware UTC
    now = datetime.now(timezone.utc)
    buckets = defaultdict(list)
    for a in assignments:
        # Ensure a.due is timezone-aware (preferably UTC)
        due = enforce_timestamp_utc(a.due)
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
    now: datetime = datetime.now(timezone.utc),
    skip_p: float = 0.0
) -> List[Schedule]:
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
    # creates a list of tuple of meeting start and end times
    all_meeting_times: List[Tuple[datetime, datetime]] = []
    for m in meetings:
        for interval in m.start_end_times:
            start, end = enforce_timestamp_utc(interval[0]), enforce_timestamp_utc(interval[1])
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
                time_range = (now, enforce_timestamp_utc(task.due))
            else:
                w0, w1 = enforce_timestamp_utc(task.window[0]), enforce_timestamp_utc(task.window[1])
                time_range = (w0, w1)
            # Pass in all meeting times, unpack time range tuple
            available = generate_available_slots(all_meeting_times, *time_range)
            available = [s for s in available if s not in used_slots]

            assigned_slots = find_time_blocks(task.effort, available, used_slots, skip_prob=skip_p)
            assigned_minutes = 0
            for start, end in assigned_slots:
                assigned_minutes += (end - start).total_seconds() / 60

            # because of the change to gen_avail_slots, the above line will break
            # not every slot is CHUNK_MINUTES of time anymore
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
