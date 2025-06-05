# test_scheduler.py

from datetime import datetime, timedelta, timezone
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))
from scheduler import schedule_tasks
from data_models import AssignmentInRequest, ChoreInRequest, MeetingInRequest
import pytest

now = datetime.now(timezone.utc)

def create_slot(start_offset_min, duration_min):
    return (now + timedelta(minutes=start_offset_min), now + timedelta(minutes=start_offset_min + duration_min))


def test_basic_schedule():
    assignments = [AssignmentInRequest(name="Math HW", effort=30, due=now + timedelta(hours=5))]
    chores = [ChoreInRequest(name="Dishes", effort=30, window=create_slot(30, 120))]
    meetings = [MeetingInRequest(name="Team Sync", start_end_times=[create_slot(60, 60)])]

    schedule = schedule_tasks(meetings, assignments, chores, num_schedules=1)[0]
    assert all(a.schedule.status == "fully_scheduled" for a in schedule.assignments)
    assert all(c.schedule.status == "fully_scheduled" for c in schedule.chores)


def test_exact_fit_assignment():
    new_now = datetime(2025, 5, 28, 10, 30, tzinfo=timezone.utc)
    assignments = [AssignmentInRequest(name="Exact Fit", effort=30, due=new_now + timedelta(minutes=30))]
    schedule = schedule_tasks([], assignments, [], num_schedules=1, now = new_now)[0]
    assert schedule.assignments[0].schedule.effort_assigned == 30


def test_unschedulable_due_to_meetings():
    meetings = [MeetingInRequest(name="All Day", start_end_times=[create_slot(0, 240)])]
    # meeting for 4 hours
    assignments = [AssignmentInRequest(name="Blocked", effort=30, due=now + timedelta(hours=4))]
    # 30 min assignment due in 4 hours
    schedule = schedule_tasks(meetings, assignments, [], num_schedules=1)[0]
    print("gu",  schedule.assignments[0].schedule.slots)
    print("g", len(schedule.assignments[0].schedule.slots))
    assert schedule.assignments[0].schedule.status == "unschedulable"

# Removed sleep hours for now
# def test_task_during_sleep_hours():
#     fake_now = datetime(2025, 5, 28, 23, 30, tzinfo=timezone.utc)
#     assignments = [AssignmentInRequest(name="Late Night HW", effort=30, due=fake_now + timedelta(minutes=30))]
#     schedule = schedule_tasks([], assignments, [], num_schedules=1, now = fake_now)[0]
#     assert schedule.assignments[0].schedule.status == "unschedulable"


def test_partial_schedule():
    # Only 2 slots available for 4-slot task
    meetings = [MeetingInRequest(name="Morning Block", start_end_times=[create_slot(0, 120)])]
    assignments = [AssignmentInRequest(name="Big Task", effort=60, due=now + timedelta(hours=2))]
    schedule = schedule_tasks(meetings, assignments, [], num_schedules=1)[0]
    # this should be unschedulable since meeting start/end times are the same as the assignment
    assert schedule.assignments[0].schedule.status == "unschedulable"


def test_edge_case_due_boundary():
    fixed_now = datetime(2025, 5, 28, 10, 0, tzinfo=timezone.utc)
    assignments = [AssignmentInRequest(name="Boundary Case", effort=15, due=fixed_now + timedelta(minutes=15))]
    schedule = schedule_tasks([], assignments, [], num_schedules=1, now = fixed_now)[0]
    assert schedule.assignments[0].schedule.status == "fully_scheduled"


def test_overlapping_chore_assignment():
    assignments = [AssignmentInRequest(name="Assignment", effort=30, due=now + timedelta(hours=2))]
    chores = [ChoreInRequest(name="Chore", effort=30, window=create_slot(30, 60))]
    schedule = schedule_tasks([], assignments, chores, num_schedules=1)[0]

    a_slots = {(s.start, s.end) for s in schedule.assignments[0].schedule.slots}
    c_slots = {(s.start, s.end) for s in schedule.chores[0].schedule.slots}
    assert a_slots.isdisjoint(c_slots)

def test_multiple_schedules_variability():
    assignments = [
        AssignmentInRequest(name="A1", effort=15, due=now + timedelta(hours=2)),
        AssignmentInRequest(name="A2", effort=15, due=now + timedelta(hours=2))
    ]
    result = schedule_tasks([], assignments, [], num_schedules=3)
    assert len(result) == 3

def test_low_effort_due_soon():
    assignments = [
        AssignmentInRequest(name="A1", effort=7, due=now + timedelta(minutes=8))
    ]
    result = schedule_tasks([], assignments, [])
    assert result[0].assignments[0].schedule.status == "fully_scheduled"

def test_fully_blocked_schedule():
    meetings = [MeetingInRequest(name="Blocked All Day", start_end_times=[
        create_slot(0, 120), create_slot(120, 120), create_slot(240, 120)
    ])]
    assignments = [AssignmentInRequest(name="No Chance", effort=15, due=now + timedelta(hours=6))]
    schedule = schedule_tasks(meetings, assignments, [], num_schedules=1)[0]
    assert schedule.assignments[0].schedule.status == "unschedulable"

def test_assignment_and_chore_back_to_back():
    assignments = [AssignmentInRequest(name="BackToBack A", effort=15, due=now + timedelta(hours=1))]
    chores = [ChoreInRequest(name="BackToBack C", effort=15, window=create_slot(15, 60))]
    schedule = schedule_tasks([], assignments, chores, num_schedules=1)[0]

    a_end = schedule.assignments[0].schedule.slots[0].end
    c_start = schedule.chores[0].schedule.slots[0].start
    assert a_end <= c_start or c_start <= a_end

def test_many_assignments_and_chores_no_overlap():
    # 5 assignments, 5 chores, all with non-overlapping windows, plenty of time
    base = now
    assignments = [
        AssignmentInRequest(name=f"A{i}", effort=30, due=base + timedelta(hours=2 + i))
        for i in range(5)
    ]
    chores = [
        ChoreInRequest(name=f"C{i}", effort=30, window=[base + timedelta(hours=8 + i), base + timedelta(hours=9 + i)])
        for i in range(5)
    ]
    meetings = []
    schedule = schedule_tasks(meetings, assignments, chores, num_schedules=5)
    for sched in schedule:
        assert all(a.schedule.status == "fully_scheduled" for a in sched.assignments)
        assert all(c.schedule.status == "fully_scheduled" for c in sched.chores)

def test_many_assignments_and_chores_with_meetings():
    # 3 assignments, 3 chores, 2 meetings, all with enough time
    base = now
    assignments = [
        AssignmentInRequest(name=f"A{i}", effort=20, due=base + timedelta(hours=2 + i))
        for i in range(3)
    ]
    chores = [
        ChoreInRequest(name=f"C{i}", effort=20, window=[base + timedelta(hours=8 + i), base + timedelta(hours=9 + i)])
        for i in range(3)
    ]
    meetings = [
        MeetingInRequest(name="M1", start_end_times=[[base + timedelta(hours=4), base + timedelta(hours=5)]]),
        MeetingInRequest(name="M2", start_end_times=[[base + timedelta(hours=6), base + timedelta(hours=7)]])
    ]
    schedule = schedule_tasks(meetings, assignments, chores, num_schedules=3)
    for sched in schedule:
        assert all(a.schedule.status == "fully_scheduled" for a in sched.assignments)
        assert all(c.schedule.status == "fully_scheduled" for c in sched.chores)

def test_assignments_and_chores_randomized_windows():
    # 10 assignments, 10 chores, random windows, but enough time
    base = now
    assignments = [
        AssignmentInRequest(name=f"A{i}", effort=10, due=base + timedelta(hours=10 + i))
        for i in range(10)
    ]
    chores = [
        ChoreInRequest(
            name=f"C{i}",
            effort=10,
            window=[
                base + timedelta(hours=12 + i),
                base + timedelta(hours=13 + i)
            ]
        )
        for i in range(10)
    ]
    meetings = []
    schedule = schedule_tasks(meetings, assignments, chores, num_schedules=5)
    for sched in schedule:
        assert all(a.schedule.status == "fully_scheduled" for a in sched.assignments)
        assert all(c.schedule.status == "fully_scheduled" for c in sched.chores)

def test_assignments_and_chores_with_gaps():
    # Assignments and chores with gaps between their windows, no overlap, enough time
    base = now
    assignments = [
        AssignmentInRequest(name=f"A{i}", effort=15, due=base + timedelta(hours=2 + 2*i))
        for i in range(4)
    ]
    chores = [
        ChoreInRequest(name=f"C{i}", effort=15, window=[base + timedelta(hours=10 + 2*i), base + timedelta(hours=11 + 2*i)])
        for i in range(4)
    ]
    meetings = []
    schedule = schedule_tasks(meetings, assignments, chores, num_schedules=2)
    for sched in schedule:
        assert all(a.schedule.status == "fully_scheduled" for a in sched.assignments)
        assert all(c.schedule.status == "fully_scheduled" for c in sched.chores)

def test_assignments_and_chores_with_long_windows():
    # Assignments and chores with long windows, more than enough time
    base = now
    assignments = [
        AssignmentInRequest(name=f"A{i}", effort=20, due=base + timedelta(hours=24))
        for i in range(6)
    ]
    chores = [
        ChoreInRequest(name=f"C{i}", effort=20, window=[base + timedelta(hours=1), base + timedelta(hours=23)])
        for i in range(6)
    ]
    meetings = []
    schedule = schedule_tasks(meetings, assignments, chores, num_schedules=3)
    for sched in schedule:
        assert all(a.schedule.status == "fully_scheduled" for a in sched.assignments)
        assert all(c.schedule.status == "fully_scheduled" for c in sched.chores)

def test_assignments_and_chores_with_many_schedules_and_randomness():
    # 4 assignments, 4 chores, 10 schedules, check all are fully scheduled in all
    base = now
    assignments = [
        AssignmentInRequest(name=f"A{i}", effort=10, due=base + timedelta(hours=5 + i))
        for i in range(4)
    ]
    chores = [
        ChoreInRequest(name=f"C{i}", effort=10, window=[base + timedelta(hours=10 + i), base + timedelta(hours=12 + i)])
        for i in range(4)
    ]
    meetings = []
    schedule = schedule_tasks(meetings, assignments, chores, num_schedules=10)
    for sched in schedule:
        assert all(a.schedule.status == "fully_scheduled" for a in sched.assignments)
        assert all(c.schedule.status == "fully_scheduled" for c in sched.chores)

def test_assignments_and_chores_with_skip_prob():
    # 3 assignments, 3 chores, skip_prob=0.5, but enough time for all
    base = now
    assignments = [
        AssignmentInRequest(name=f"A{i}", effort=10, due=base + timedelta(hours=5 + i))
        for i in range(3)
    ]
    chores = [
        ChoreInRequest(name=f"C{i}", effort=10, window=[base + timedelta(hours=10 + i), base + timedelta(hours=12 + i)])
        for i in range(3)
    ]
    meetings = []
    schedule = schedule_tasks(meetings, assignments, chores, num_schedules=5, skip_p=0.5)
    for sched in schedule:
        assert all(a.schedule.status == "fully_scheduled" for a in sched.assignments)
        assert all(c.schedule.status == "fully_scheduled" for c in sched.chores)
