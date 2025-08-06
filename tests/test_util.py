import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))
from util import *
from data_models import AssignmentInRequest, ChoreInRequest, MeetingInRequest
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch


class TestPartitionByMeetingId:
    
    def test_empty_list(self):
        """Test partitioning an empty list"""
        result = partition_by_meeting_id([], 'id')
        assert result == []
    
    def test_single_item(self):
        """Test partitioning a list with a single item"""
        data = [{'id': 1, 'name': 'item1'}]
        result = partition_by_meeting_id(data, 'id')
        assert result == [[{'id': 1, 'name': 'item1'}]]
    
    def test_multiple_items_same_field(self):
        """Test partitioning items with the same field value"""
        data = [
            {'id': 1, 'name': 'item1'},
            {'id': 1, 'name': 'item2'},
            {'id': 1, 'name': 'item3'}
        ]
        result = partition_by_meeting_id(data, 'id')
        assert len(result) == 1
        assert len(result[0]) == 3
        assert result[0] == data
    
    def test_multiple_items_different_fields(self):
        """Test partitioning items with different field values"""
        data = [
            {'id': 1, 'name': 'item1'},
            {'id': 2, 'name': 'item2'},
            {'id': 3, 'name': 'item3'}
        ]
        result = partition_by_meeting_id(data, 'id')
        assert len(result) == 3
        for partition in result:
            assert len(partition) == 1
    
    def test_mixed_grouping(self):
        """Test partitioning with mixed grouping"""
        data = [
            {'meeting_id': 'A', 'time': '9am'},
            {'meeting_id': 'B', 'time': '10am'},
            {'meeting_id': 'A', 'time': '2pm'},
            {'meeting_id': 'C', 'time': '3pm'},
            {'meeting_id': 'B', 'time': '4pm'},
            {'meeting_id': 'A', 'time': '5pm'}
        ]
        result = partition_by_meeting_id(data, 'meeting_id')
        assert len(result) == 3
        group_sizes = {}
        for group in result:
            meeting_id = group[0]['meeting_id']
            group_sizes[meeting_id] = len(group)
        assert group_sizes['A'] == 3  # 3 items with meeting_id 'A'
        assert group_sizes['B'] == 2  # 2 items with meeting_id 'B'
        assert group_sizes['C'] == 1  # 1 item with meeting_id 'C'
    
    def test_string_field_values(self):
        """Test partitioning with string field values"""
        data = [
            {'category': 'work', 'task': 'email'},
            {'category': 'personal', 'task': 'grocery'},
            {'category': 'work', 'task': 'meeting'},
            {'category': 'personal', 'task': 'exercise'}
        ]
        result = partition_by_meeting_id(data, 'category')
        assert len(result) == 2
        work_count = personal_count = 0
        for group in result:
            if group[0]['category'] == 'work':
                work_count = len(group)
            elif group[0]['category'] == 'personal':
                personal_count = len(group)
        assert work_count == 2
        assert personal_count == 2
    
    def test_numeric_field_values(self):
        """Test partitioning with numeric field values including zero and negative"""
        data = [
            {'priority': 0, 'task': 'low'},
            {'priority': 1, 'task': 'medium1'},
            {'priority': -1, 'task': 'negative'},
            {'priority': 0, 'task': 'low2'},
            {'priority': 1, 'task': 'medium2'}
        ]
        result = partition_by_meeting_id(data, 'priority')
        assert len(result) == 3  # 0, 1, -1
        priority_counts = {}
        for group in result:
            priority = group[0]['priority']
            priority_counts[priority] = len(group)
        assert priority_counts[0] == 2
        assert priority_counts[1] == 2
        assert priority_counts[-1] == 1
    
    def test_none_field_values(self):
        """Test partitioning with None field values"""
        data = [
            {'status': None, 'task': 'undefined1'},
            {'status': 'active', 'task': 'working'},
            {'status': None, 'task': 'undefined2'},
            {'status': 'inactive', 'task': 'stopped'}
        ]
        result = partition_by_meeting_id(data, 'status')
        assert len(result) == 3 
        none_group_size = 0
        for group in result:
            if group[0]['status'] is None:
                none_group_size = len(group)
        assert none_group_size == 2
    
    def test_boolean_field_values(self):
        """Test partitioning with boolean field values"""
        data = [
            {'completed': True, 'task': 'done1'},
            {'completed': False, 'task': 'pending1'},
            {'completed': True, 'task': 'done2'},
            {'completed': False, 'task': 'pending2'}
        ]
        result = partition_by_meeting_id(data, 'completed')
        assert len(result) == 2
        for group in result:
            assert len(group) == 2
    
    def test_missing_field_key_error(self):
        """Test that KeyError is raised when field doesn't exist"""
        data = [{'id': 1, 'name': 'item1'}]
        with pytest.raises(KeyError):
            partition_by_meeting_id(data, 'nonexistent_field')
    
    def test_nested_dict_values(self):
        """Test partitioning with complex nested values causes TypeError for unhashable dict"""
        data = [
            {'user': {'id': 1, 'name': 'Alice'}, 'action': 'login'},
            {'user': {'id': 2, 'name': 'Bob'}, 'action': 'logout'},
            {'user': {'id': 1, 'name': 'Alice'}, 'action': 'purchase'}
        ]
        # This should raise TypeError because dict objects are not hashable
        with pytest.raises(TypeError, match="unhashable type: 'dict'"):
            partition_by_meeting_id(data, 'user')


# Tests for enforce_timestamp_utc function
class TestEnforceTimestampUtc:
    
    def test_naive_datetime(self):
        """Test converting naive datetime to UTC"""
        naive_time = datetime(2025, 7, 28, 12, 0, 0)
        result = enforce_timestamp_utc(naive_time)
        assert result.tzinfo == timezone.utc
        assert result.year == 2025
        assert result.month == 7
        assert result.day == 28
        assert result.hour == 12
        assert result.minute == 0
        assert result.second == 0
    
    def test_utc_datetime_unchanged(self):
        """Test that UTC datetime remains unchanged"""
        utc_time = datetime(2025, 7, 28, 12, 0, 0, tzinfo=timezone.utc)
        result = enforce_timestamp_utc(utc_time)
        assert result == utc_time
        assert result.tzinfo == timezone.utc
    
    def test_timezone_aware_conversion(self):
        """Test converting timezone-aware datetime to UTC"""
        # Create EST timezone (UTC-5)
        est = timezone(timedelta(hours=-5))
        est_time = datetime(2025, 7, 28, 12, 0, 0, tzinfo=est)
        result = enforce_timestamp_utc(est_time)
        assert result.tzinfo == timezone.utc
        # 12:00 EST should become 17:00 UTC
        assert result.hour == 17
        assert result.minute == 0
    
    def test_positive_timezone_offset(self):
        """Test converting from positive timezone offset"""
        # Create JST timezone (UTC+9)
        jst = timezone(timedelta(hours=9))
        jst_time = datetime(2025, 7, 28, 21, 30, 0, tzinfo=jst)
        result = enforce_timestamp_utc(jst_time)
        assert result.tzinfo == timezone.utc
        # 21:30 JST should become 12:30 UTC
        assert result.hour == 12
        assert result.minute == 30
    
    def test_date_boundary_crossing(self):
        """Test timezone conversion that crosses date boundaries"""
        # 2:00 AM in UTC+10 should become 4:00 PM previous day in UTC
        plus_ten = timezone(timedelta(hours=10))
        time_plus_ten = datetime(2025, 7, 28, 2, 0, 0, tzinfo=plus_ten)
        result = enforce_timestamp_utc(time_plus_ten)
        assert result.tzinfo == timezone.utc
        assert result.day == 27  # Previous day
        assert result.hour == 16  # 4 PM
    
    def test_microseconds_preserved(self):
        """Test that microseconds are preserved"""
        naive_time = datetime(2025, 7, 28, 12, 0, 0, 123456)
        result = enforce_timestamp_utc(naive_time)
        assert result.microsecond == 123456
        assert result.tzinfo == timezone.utc
    
    def test_edge_case_year_boundary(self):
        """Test conversion at year boundary"""
        # 1:00 AM Jan 1st in UTC+5 should become 8:00 PM Dec 31st previous year in UTC
        plus_five = timezone(timedelta(hours=5))
        new_year_time = datetime(2025, 1, 1, 1, 0, 0, tzinfo=plus_five)
        result = enforce_timestamp_utc(new_year_time)
        assert result.tzinfo == timezone.utc
        assert result.year == 2024
        assert result.month == 12
        assert result.day == 31
        assert result.hour == 20


# Tests for get_latest_time function
class TestGetLatestTime:
    
    def test_empty_lists(self):
        """Test with all empty lists"""
        with patch('util.datetime') as mock_datetime:
            mock_now = datetime(2025, 7, 28, 12, 0, 0, tzinfo=timezone.utc)
            mock_datetime.now.return_value = mock_now
            result = get_latest_time([], [], [])
            expected = mock_now + timedelta(days=1)
            assert result == expected
    
    def test_only_assignments(self):
        """Test with only assignments"""
        assignments = [
            AssignmentInRequest(
                name="Assignment 1",
                effort=60,
                due=datetime(2025, 7, 30, 15, 0, 0, tzinfo=timezone.utc)
            ),
            AssignmentInRequest(
                name="Assignment 2", 
                effort=90,
                due=datetime(2025, 7, 28, 10, 0, 0, tzinfo=timezone.utc)
            ),
            AssignmentInRequest(
                name="Assignment 3",
                effort=120,
                due=datetime(2025, 8, 1, 9, 0, 0, tzinfo=timezone.utc)
            )
        ]
        result = get_latest_time([], assignments, [])
        expected = datetime(2025, 8, 1, 9, 0, 0, tzinfo=timezone.utc)
        assert result == expected
    
    def test_only_chores(self):
        """Test with only chores"""
        chores = [
            ChoreInRequest(
                name="Chore 1",
                window=[
                    datetime(2025, 7, 28, 9, 0, 0, tzinfo=timezone.utc),
                    datetime(2025, 7, 28, 17, 0, 0, tzinfo=timezone.utc)
                ],
                effort=30
            ),
            ChoreInRequest(
                name="Chore 2",
                window=[
                    datetime(2025, 7, 29, 8, 0, 0, tzinfo=timezone.utc),
                    datetime(2025, 7, 29, 20, 0, 0, tzinfo=timezone.utc)
                ],
                effort=45
            )
        ]
        result = get_latest_time([], [], chores)
        expected = datetime(2025, 7, 29, 20, 0, 0, tzinfo=timezone.utc)
        assert result == expected
    
    def test_only_meetings(self):
        """Test with only meetings"""
        meetings = [
            MeetingInRequest(
                name="Meeting 1",
                start_end_times=[
                    [
                        datetime(2025, 7, 28, 10, 0, 0, tzinfo=timezone.utc),
                        datetime(2025, 7, 28, 11, 0, 0, tzinfo=timezone.utc)
                    ],
                    [
                        datetime(2025, 7, 29, 14, 0, 0, tzinfo=timezone.utc),
                        datetime(2025, 7, 29, 15, 30, 0, tzinfo=timezone.utc)
                    ]
                ],
                link_or_loc="Conference Room A"
            ),
            MeetingInRequest(
                name="Meeting 2",
                start_end_times=[
                    [
                        datetime(2025, 7, 30, 9, 0, 0, tzinfo=timezone.utc),
                        datetime(2025, 7, 30, 10, 30, 0, tzinfo=timezone.utc)
                    ]
                ],
                link_or_loc="Zoom"
            )
        ]
        result = get_latest_time(meetings, [], [])
        expected = datetime(2025, 7, 30, 10, 30, 0, tzinfo=timezone.utc)
        assert result == expected
    
    def test_mixed_events(self):
        """Test with all types of events mixed"""
        assignments = [
            AssignmentInRequest(
                name="Assignment",
                effort=60,
                due=datetime(2025, 7, 31, 23, 59, 0, tzinfo=timezone.utc)
            )
        ]
        chores = [
            ChoreInRequest(
                name="Chore",
                window=[
                    datetime(2025, 7, 28, 9, 0, 0, tzinfo=timezone.utc),
                    datetime(2025, 8, 1, 18, 0, 0, tzinfo=timezone.utc)  # Latest time
                ],
                effort=120
            )
        ]
        meetings = [
            MeetingInRequest(
                name="Meeting",
                start_end_times=[
                    [
                        datetime(2025, 7, 30, 14, 0, 0, tzinfo=timezone.utc),
                        datetime(2025, 7, 30, 16, 0, 0, tzinfo=timezone.utc)
                    ]
                ],
                link_or_loc="Office"
            )
        ]
        result = get_latest_time(meetings, assignments, chores)
        expected = datetime(2025, 8, 1, 18, 0, 0, tzinfo=timezone.utc)
        assert result == expected
    
    def test_naive_datetime_handling(self):
        """Test handling of naive datetimes in assignments and chores"""
        assignments = [
            AssignmentInRequest(
                name="Assignment with naive datetime",
                effort=60,
                due=datetime(2025, 8, 5, 12, 0, 0)  # Naive datetime
            )
        ]
        chores = [
            ChoreInRequest(
                name="Chore with naive datetime",
                window=[
                    datetime(2025, 7, 28, 9, 0, 0),  # Naive
                    datetime(2025, 8, 3, 17, 0, 0)   # Naive
                ],
                effort=90
            )
        ]
        result = get_latest_time([], assignments, chores)
        expected = datetime(2025, 8, 5, 12, 0, 0, tzinfo=timezone.utc)
        assert result == expected
    
    def test_multiple_meeting_occurrences(self):
        """Test meetings with multiple occurrences"""
        meetings = [
            MeetingInRequest(
                name="Recurring Meeting",
                start_end_times=[
                    [
                        datetime(2025, 7, 28, 10, 0, 0, tzinfo=timezone.utc),
                        datetime(2025, 7, 28, 11, 0, 0, tzinfo=timezone.utc)
                    ],
                    [
                        datetime(2025, 8, 4, 10, 0, 0, tzinfo=timezone.utc),
                        datetime(2025, 8, 4, 11, 0, 0, tzinfo=timezone.utc)
                    ],
                    [
                        datetime(2025, 8, 11, 10, 0, 0, tzinfo=timezone.utc),
                        datetime(2025, 8, 11, 11, 30, 0, tzinfo=timezone.utc)  # Latest
                    ]
                ]
            )
        ]
        result = get_latest_time(meetings, [], [])
        expected = datetime(2025, 8, 11, 11, 30, 0, tzinfo=timezone.utc)
        assert result == expected
    
    def test_single_event_each_type(self):
        """Test with one event of each type"""
        assignment = [
            AssignmentInRequest(
                name="Single Assignment",
                effort=60,
                due=datetime(2025, 7, 29, 12, 0, 0, tzinfo=timezone.utc)
            )
        ]
        chore = [
            ChoreInRequest(
                name="Single Chore",
                window=[
                    datetime(2025, 7, 28, 8, 0, 0, tzinfo=timezone.utc),
                    datetime(2025, 7, 28, 16, 0, 0, tzinfo=timezone.utc)
                ],
                effort=60
            )
        ]
        meeting = [
            MeetingInRequest(
                name="Single Meeting",
                start_end_times=[
                    [
                        datetime(2025, 7, 30, 9, 0, 0, tzinfo=timezone.utc),
                        datetime(2025, 7, 30, 10, 0, 0, tzinfo=timezone.utc)
                    ]
                ]
            )
        ]
        result = get_latest_time(meeting, assignment, chore)
        expected = datetime(2025, 7, 30, 10, 0, 0, tzinfo=timezone.utc)
        assert result == expected


class TestGetXpForNextLevel:
    
    def test_level_zero(self):
        """Test XP for level 0"""
        assert get_xp_for_next_level(0) == 0
    
    def test_negative_level(self):
        """Test XP for negative levels"""
        assert get_xp_for_next_level(-1) == 0
        assert get_xp_for_next_level(-10) == 0
        assert get_xp_for_next_level(-100) == 0
    
    def test_level_one(self):
        """Test XP for level 1"""
        expected = int(100 * (1 ** 1.5))  # 100 * 1 = 100
        assert get_xp_for_next_level(1) == expected
        assert get_xp_for_next_level(1) == 100
    
    def test_level_two(self):
        """Test XP for level 2"""
        expected = int(100 * (2 ** 1.5))  # 100 * 2.828... ≈ 282
        assert get_xp_for_next_level(2) == expected
        assert get_xp_for_next_level(2) == 282
    
    def test_level_three(self):
        """Test XP for level 3"""
        expected = int(100 * (3 ** 1.5))  # 100 * 5.196... ≈ 519
        assert get_xp_for_next_level(3) == expected
        assert get_xp_for_next_level(3) == 519
    
    def test_level_four(self):
        """Test XP for level 4"""
        expected = int(100 * (4 ** 1.5))  # 100 * 8 = 800
        assert get_xp_for_next_level(4) == expected
        assert get_xp_for_next_level(4) == 800
    
    def test_level_ten(self):
        """Test XP for level 10"""
        expected = int(100 * (10 ** 1.5))  # 100 * 31.622... ≈ 3162
        assert get_xp_for_next_level(10) == expected
        assert get_xp_for_next_level(10) == 3162
    
    def test_level_fifty(self):
        """Test XP for level 50"""
        expected = int(100 * (50 ** 1.5))  # 100 * 353.553... ≈ 35355
        assert get_xp_for_next_level(50) == expected
        assert get_xp_for_next_level(50) == 35355
    
    def test_level_ninety_nine(self):
        """Test XP for level 99 (just under max)"""
        expected = int(100 * (99 ** 1.5))
        assert get_xp_for_next_level(99) == expected
        assert get_xp_for_next_level(99) != float('inf')
    
    def test_max_level_hundred(self):
        """Test XP for max level (100)"""
        assert get_xp_for_next_level(100) == float('inf')
    
    def test_above_max_level(self):
        """Test XP for levels above maximum"""
        assert get_xp_for_next_level(101) == float('inf')
        assert get_xp_for_next_level(150) == float('inf')
        assert get_xp_for_next_level(1000) == float('inf')
    
    def test_xp_progression_increasing(self):
        """Test that XP requirements increase with level"""
        levels = [1, 2, 3, 4, 5, 10, 20, 50, 99]
        xp_values = [get_xp_for_next_level(level) for level in levels]
        # Check that each XP value is greater than the previous
        for i in range(1, len(xp_values)):
            assert xp_values[i] > xp_values[i-1]
    
    def test_xp_formula_precision(self):
        """Test precise XP calculations for specific levels"""
        # Level 16: 16^1.5 = 64, so 100 * 64 = 6400
        assert get_xp_for_next_level(16) == 6400
        # Level 25: 25^1.5 = 125, so 100 * 125 = 12500
        assert get_xp_for_next_level(25) == 12500
        # Level 36: 36^1.5 = 216, so 100 * 216 = 21600
        assert get_xp_for_next_level(36) == 21600
    
    def test_boundary_values(self):
        """Test boundary values around the max level"""
        assert get_xp_for_next_level(98) != float('inf')
        assert get_xp_for_next_level(99) != float('inf')
        assert get_xp_for_next_level(100) == float('inf')
        assert get_xp_for_next_level(101) == float('inf')
    
    def test_float_input_handling(self):
        """Test behavior with float inputs (function treats 1.5 as level 1.5, not 1)"""
        # The function accepts float but calculates 1.5^1.5
        result = get_xp_for_next_level(1.5)
        expected = int(100 * (1.5 ** 1.5))  # 100 * 1.837... ≈ 183
        assert result == expected
        assert result == 183

    def test_large_negative_level(self):
        """Test very large negative level"""
        assert get_xp_for_next_level(-999999) == 0
