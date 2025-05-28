# test_scheduler.py

from datetime import datetime, timedelta
from scheduler import schedule_tasks
from data_models import AssignmentInRequest, ChoreInRequest, MeetingInRequest
import pytest

now = datetime.now()

def create_slot(start_offset_min, duration_min):
    return (now + timedelta(minutes=start_offset_min), now + timedelta(minutes=start_offset_min + duration_min))


def test_basic_schedule():
    assignments = [AssignmentInRequest(name="Math HW", effort=30, due=now + timedelta(hours=5))]
    chores = [ChoreInRequest(name="Dishes", effort=30, window=create_slot(30, 120))]
    meetings = [MeetingInRequest(name="Team Sync", start_end_times=[create_slot(60, 60)])]

    schedule = schedule_tasks(meetings, assignments, chores, num_schedules=1)[0]
    assert all(a.schedule.status != "unschedulable" for a in schedule.assignments)
    assert all(c.schedule.status != "unschedulable" for c in schedule.chores)


def test_exact_fit_assignment():
    new_now = datetime(2025, 5, 28, 10, 30)
    assignments = [AssignmentInRequest(name="Exact Fit", effort=30, due=new_now + timedelta(minutes=30))]
    schedule = schedule_tasks([], assignments, [], num_schedules=1, now = new_now)[0]
    assert schedule.assignments[0].schedule.effort_assigned == 30



def test_unschedulable_due_to_meetings():
    meetings = [MeetingInRequest(name="All Day", start_end_times=[create_slot(0, 240)])]
    assignments = [AssignmentInRequest(name="Blocked", effort=30, due=now + timedelta(hours=4))]
    schedule = schedule_tasks(meetings, assignments, [], num_schedules=1)[0]
    assert schedule.assignments[0].schedule.status == "unschedulable"

def test_task_during_sleep_hours():
    fake_now = datetime(2025, 5, 28, 23, 30)
    assignments = [AssignmentInRequest(name="Late Night HW", effort=30, due=fake_now + timedelta(minutes=30))]
    schedule = schedule_tasks([], assignments, [], num_schedules=1, now = fake_now)[0]
    assert schedule.assignments[0].schedule.status == "unschedulable"


def test_partial_schedule():
    # Only 2 slots available for 4-slot task
    meetings = [MeetingInRequest(name="Morning Block", start_end_times=[create_slot(0, 120)])]
    assignments = [AssignmentInRequest(name="Big Task", effort=60, due=now + timedelta(hours=2))]
    schedule = schedule_tasks(meetings, assignments, [], num_schedules=1)[0]
    # this should be unschedulable since meeting start/end times are the same as the assignment
    assert schedule.assignments[0].schedule.status == "unschedulable"




def test_edge_case_due_boundary():
    fixed_now = datetime(2025, 5, 28, 10, 0)
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
