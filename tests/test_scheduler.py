import pytest
from datetime import datetime, timedelta
from scheduler import generate_available_slots, find_time_blocks, loosely_sort_assignments
from data_models import AssignmentInRequest, ChoreInRequest, MeetingInRequest

def test_generate_available_slots_basic():
    now = datetime.now().replace(hour=10, minute=0, second=0, microsecond=0)
    meetings = []
    slots = generate_available_slots(meetings, now, now + timedelta(hours=2))
    assert all(slot[0].hour >= 7 and slot[0].hour < 23 for slot in slots)
    assert len(slots) > 0

def test_find_time_blocks_exact_fit():
    # ...setup...
    pass

def test_loosely_sort_assignments_bucket_order():
    # ...setup...
    pass
