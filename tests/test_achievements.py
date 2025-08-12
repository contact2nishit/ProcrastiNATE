import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timedelta, timezone
from collections import defaultdict
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))

from achievements_check import (
    check_achievements,
    check_session_achievements,
    check_level_achievements,
    check_cumulative_achievements,
    convert_utc_to_local_time
)

class TestAchievements:
    @pytest.fixture
    def default_achievements(self):
        return {
            'first_timer': False,
            'getting_the_hang_of_it': False,
            'early_bird': False,
            'night_owl': False,
            'weekend_warrior': False,
            'seven_day_streak': False,
            'daily_grinder': False,
            'consistency_king': False,
            'power_hour': False,
            'focus_beast': False,
            'redemption': False,
            'sleep_is_for_the_weak': False,
            'humble_beginner': False,
            'making_progress': False,
            'motivated': False,
            'hard_worker': False,
            'grinder_expert': False,
            'legend_of_grinding': False,
            'task_slayer_i': False,
            'task_slayer_ii': False,
            'task_slayer_iii': False,
            'task_slayer_iv': False,
            'task_slayer_v': False,
            'home_hero_i': False,
            'home_hero_ii': False,
            'home_hero_iii': False,
            'home_hero_iv': False,
            'home_hero_v': False,
            'levels': 1
        }

    def create_session(self, start_time: datetime, end_time: datetime = None, locked_in: int = 5, 
                      effort: int = 10, session_type: str = 'assignment', parent_completed: bool = False, 
                      deadline: datetime = None):
        if end_time is None:
            end_time = start_time + timedelta(hours=1)
        return {
            'type': session_type,
            'start_time': start_time,
            'end_time': end_time,
            'locked_in': locked_in,
            'effort': effort,
            'parent_completed': parent_completed,
            'deadline': deadline
        }

    def test_timezone_conversion_minutes_pst(self):
        utc_time = datetime(2024, 8, 7, 14, 30, tzinfo=timezone.utc)
        result = convert_utc_to_local_time(utc_time, -480)
        expected = utc_time + timedelta(minutes=-480)
        assert result == expected

    def test_timezone_conversion_minutes_est(self):
        utc_time = datetime(2024, 8, 7, 14, 30, tzinfo=timezone.utc)
        result = convert_utc_to_local_time(utc_time, -300)
        expected = utc_time + timedelta(minutes=-300)
        assert result == expected

    def test_timezone_conversion_minutes_zero(self):
        utc_time = datetime(2024, 8, 7, 14, 30, tzinfo=timezone.utc)
        result = convert_utc_to_local_time(utc_time, 0)
        assert result == utc_time

    @pytest.mark.asyncio
    async def test_first_timer_should_trigger(self, default_achievements):
        sessions = [self.create_session(datetime(2024, 8, 7, 14, 0, tzinfo=timezone.utc))]
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert result['first_timer'] == True

    @pytest.mark.asyncio
    async def test_first_timer_should_not_trigger_if_already_unlocked(self, default_achievements):
        default_achievements['first_timer'] = True
        sessions = [self.create_session(datetime(2024, 8, 7, 14, 0, tzinfo=timezone.utc))]
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert 'first_timer' not in result

    @pytest.mark.asyncio
    async def test_first_timer_should_not_trigger_no_sessions(self, default_achievements):
        sessions = []
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert 'first_timer' not in result

    @pytest.mark.asyncio
    async def test_getting_hang_of_it_should_trigger_three_sessions_one_day(self, default_achievements):
        base_date = datetime(2024, 8, 7, tzinfo=timezone.utc)
        sessions = [
            self.create_session(base_date.replace(hour=9)),
            self.create_session(base_date.replace(hour=14)),
            self.create_session(base_date.replace(hour=18))
        ]
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert result['getting_the_hang_of_it'] == True

    @pytest.mark.asyncio
    async def test_getting_hang_of_it_should_not_trigger_two_sessions_one_day(self, default_achievements):
        base_date = datetime(2024, 8, 7, tzinfo=timezone.utc)
        sessions = [
            self.create_session(base_date.replace(hour=9)),
            self.create_session(base_date.replace(hour=14))
        ]
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert 'getting_the_hang_of_it' not in result

    @pytest.mark.asyncio
    async def test_getting_hang_of_it_should_not_trigger_three_sessions_different_days(self, default_achievements):
        sessions = [
            self.create_session(datetime(2024, 8, 7, 9, 0, tzinfo=timezone.utc)),
            self.create_session(datetime(2024, 8, 8, 14, 0, tzinfo=timezone.utc)),
            self.create_session(datetime(2024, 8, 9, 18, 0, tzinfo=timezone.utc))
        ]
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert 'getting_the_hang_of_it' not in result

    @pytest.mark.asyncio
    async def test_early_bird_should_trigger_before_8am_local_time(self, default_achievements):
        sessions = [self.create_session(datetime(2024, 8, 7, 15, 30, tzinfo=timezone.utc))]
        result = await check_session_achievements(sessions, default_achievements, -480)
        assert result['early_bird'] == True

    @pytest.mark.asyncio
    async def test_early_bird_should_not_trigger_after_8am_local_time(self, default_achievements):
        sessions = [self.create_session(datetime(2024, 8, 7, 16, 30, tzinfo=timezone.utc))]
        result = await check_session_achievements(sessions, default_achievements, -480)
        assert 'early_bird' not in result

    @pytest.mark.asyncio
    async def test_early_bird_should_not_trigger_exactly_8am_local_time(self, default_achievements):
        sessions = [self.create_session(datetime(2024, 8, 7, 16, 0, tzinfo=timezone.utc))]
        result = await check_session_achievements(sessions, default_achievements, -480)
        assert 'early_bird' not in result

    @pytest.mark.asyncio
    async def test_night_owl_should_trigger_after_11pm_local_time(self, default_achievements):
        sessions = [self.create_session(datetime(2024, 8, 8, 7, 30, tzinfo=timezone.utc))]
        result = await check_session_achievements(sessions, default_achievements, -480)
        assert result['night_owl'] == True

    @pytest.mark.asyncio
    async def test_night_owl_should_not_trigger_before_11pm_local_time(self, default_achievements):
        sessions = [self.create_session(datetime(2024, 8, 8, 6, 30, tzinfo=timezone.utc))]
        result = await check_session_achievements(sessions, default_achievements, -480)
        assert 'night_owl' not in result

    @pytest.mark.asyncio
    async def test_night_owl_should_trigger_exactly_11pm_local_time(self, default_achievements):
        sessions = [self.create_session(datetime(2024, 8, 8, 7, 0, tzinfo=timezone.utc))]
        result = await check_session_achievements(sessions, default_achievements, -480)
        assert result['night_owl'] == True

    @pytest.mark.asyncio
    async def test_sleep_is_for_the_weak_should_trigger_between_3am_5am_local_time(self, default_achievements):
        sessions = [self.create_session(datetime(2024, 8, 7, 12, 0, tzinfo=timezone.utc))]
        result = await check_session_achievements(sessions, default_achievements, -480)
        assert result['sleep_is_for_the_weak'] == True

    @pytest.mark.asyncio
    async def test_sleep_is_for_the_weak_should_not_trigger_before_3am_local_time(self, default_achievements):
        sessions = [self.create_session(datetime(2024, 8, 7, 10, 30, tzinfo=timezone.utc))]
        result = await check_session_achievements(sessions, default_achievements, -480)
        assert 'sleep_is_for_the_weak' not in result

    @pytest.mark.asyncio
    async def test_sleep_is_for_the_weak_should_not_trigger_after_5am_local_time(self, default_achievements):
        sessions = [self.create_session(datetime(2024, 8, 7, 13, 30, tzinfo=timezone.utc))]
        result = await check_session_achievements(sessions, default_achievements, -480)
        assert 'sleep_is_for_the_weak' not in result

    @pytest.mark.asyncio
    async def test_weekend_warrior_should_trigger_five_weekend_sessions(self, default_achievements):
        saturday = datetime(2024, 8, 10, tzinfo=timezone.utc)
        sessions = [
            self.create_session(saturday.replace(hour=9)),
            self.create_session(saturday.replace(hour=11)),
            self.create_session(saturday.replace(hour=13)),
            self.create_session(saturday.replace(hour=15)),
            self.create_session(saturday.replace(hour=17))
        ]
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert result['weekend_warrior'] == True

    @pytest.mark.asyncio
    async def test_weekend_warrior_should_not_trigger_four_weekend_sessions(self, default_achievements):
        saturday = datetime(2024, 8, 10, tzinfo=timezone.utc)
        sessions = [
            self.create_session(saturday.replace(hour=9)),
            self.create_session(saturday.replace(hour=11)),
            self.create_session(saturday.replace(hour=13)),
            self.create_session(saturday.replace(hour=15))
        ]
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert 'weekend_warrior' not in result

    @pytest.mark.asyncio
    async def test_weekend_warrior_should_not_trigger_weekday_sessions(self, default_achievements):
        friday = datetime(2024, 8, 9, tzinfo=timezone.utc)
        sessions = [
            self.create_session(friday.replace(hour=9)),
            self.create_session(friday.replace(hour=11)),
            self.create_session(friday.replace(hour=13)),
            self.create_session(friday.replace(hour=15)),
            self.create_session(friday.replace(hour=17))
        ]
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert 'weekend_warrior' not in result

    @pytest.mark.asyncio
    async def test_daily_grinder_should_trigger_five_sessions_one_day(self, default_achievements):
        base_date = datetime(2024, 8, 7, tzinfo=timezone.utc)
        sessions = [
            self.create_session(base_date.replace(hour=8)),
            self.create_session(base_date.replace(hour=10)),
            self.create_session(base_date.replace(hour=12)),
            self.create_session(base_date.replace(hour=14)),
            self.create_session(base_date.replace(hour=16))
        ]
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert result['daily_grinder'] == True

    @pytest.mark.asyncio
    async def test_daily_grinder_should_not_trigger_four_sessions_one_day(self, default_achievements):
        base_date = datetime(2024, 8, 7, tzinfo=timezone.utc)
        sessions = [
            self.create_session(base_date.replace(hour=8)),
            self.create_session(base_date.replace(hour=10)),
            self.create_session(base_date.replace(hour=12)),
            self.create_session(base_date.replace(hour=14))
        ]
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert 'daily_grinder' not in result

    @pytest.mark.asyncio
    async def test_power_hour_should_trigger_60_minutes_8_locked_in(self, default_achievements):
        start_time = datetime(2024, 8, 7, 14, 0, tzinfo=timezone.utc)
        end_time = start_time + timedelta(minutes=60)
        sessions = [self.create_session(start_time, end_time, locked_in=8, effort=10)]
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert result['power_hour'] == True

    @pytest.mark.asyncio
    async def test_power_hour_should_not_trigger_59_minutes_8_locked_in(self, default_achievements):
        start_time = datetime(2024, 8, 7, 14, 0, tzinfo=timezone.utc)
        end_time = start_time + timedelta(minutes=59)
        sessions = [self.create_session(start_time, end_time, locked_in=8, effort=10)]
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert 'power_hour' not in result

    @pytest.mark.asyncio
    async def test_power_hour_should_not_trigger_60_minutes_7_locked_in(self, default_achievements):
        start_time = datetime(2024, 8, 7, 14, 0, tzinfo=timezone.utc)
        end_time = start_time + timedelta(minutes=60)
        sessions = [self.create_session(start_time, end_time, locked_in=7, effort=10)]
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert 'power_hour' not in result

    @pytest.mark.asyncio
    async def test_power_hour_should_trigger_90_minutes_10_locked_in(self, default_achievements):
        start_time = datetime(2024, 8, 7, 14, 0, tzinfo=timezone.utc)
        end_time = start_time + timedelta(minutes=90)
        sessions = [self.create_session(start_time, end_time, locked_in=10, effort=10)]
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert result['power_hour'] == True

    @pytest.mark.asyncio
    async def test_focus_beast_should_trigger_120_minutes_9_locked_in(self, default_achievements):
        start_time = datetime(2024, 8, 7, 14, 0, tzinfo=timezone.utc)
        end_time = start_time + timedelta(minutes=120)
        sessions = [self.create_session(start_time, end_time, locked_in=9, effort=10)]
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert result['focus_beast'] == True

    @pytest.mark.asyncio
    async def test_focus_beast_should_not_trigger_119_minutes_9_locked_in(self, default_achievements):
        start_time = datetime(2024, 8, 7, 14, 0, tzinfo=timezone.utc)
        end_time = start_time + timedelta(minutes=119)
        sessions = [self.create_session(start_time, end_time, locked_in=9, effort=10)]
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert 'focus_beast' not in result

    @pytest.mark.asyncio
    async def test_focus_beast_should_not_trigger_120_minutes_8_locked_in(self, default_achievements):
        start_time = datetime(2024, 8, 7, 14, 0, tzinfo=timezone.utc)
        end_time = start_time + timedelta(minutes=120)
        sessions = [self.create_session(start_time, end_time, locked_in=8, effort=10)]
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert 'focus_beast' not in result

    @pytest.mark.asyncio
    async def test_focus_beast_should_trigger_150_minutes_10_locked_in(self, default_achievements):
        start_time = datetime(2024, 8, 7, 14, 0, tzinfo=timezone.utc)
        end_time = start_time + timedelta(minutes=150)
        sessions = [self.create_session(start_time, end_time, locked_in=10, effort=10)]
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert result['focus_beast'] == True

    @pytest.mark.asyncio
    async def test_seven_day_streak_should_trigger_seven_days_80_percent(self, default_achievements):
        now = datetime.now(timezone.utc)
        today = convert_utc_to_local_time(now, 0).date()
        sessions = []
        for i in range(7):
            day = today - timedelta(days=i)
            session_time = datetime.combine(day, datetime.min.time()).replace(tzinfo=timezone.utc) + timedelta(hours=14)
            sessions.append(self.create_session(session_time, locked_in=8, effort=10))
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert result['seven_day_streak'] == True

    @pytest.mark.asyncio
    async def test_seven_day_streak_should_not_trigger_six_days_80_percent(self, default_achievements):
        today = datetime(2024, 8, 7, tzinfo=timezone.utc)
        sessions = []
        for i in range(6):
            day = today - timedelta(days=i)
            sessions.append(self.create_session(day.replace(hour=14), locked_in=8, effort=10))
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert 'seven_day_streak' not in result

    @pytest.mark.asyncio
    async def test_seven_day_streak_should_not_trigger_one_day_below_80_percent(self, default_achievements):
        today = datetime(2024, 8, 7, tzinfo=timezone.utc)
        sessions = []
        for i in range(7):
            day = today - timedelta(days=i)
            locked_in = 7 if i == 3 else 8
            sessions.append(self.create_session(day.replace(hour=14), locked_in=locked_in, effort=10))
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert 'seven_day_streak' not in result

    @pytest.mark.asyncio
    async def test_consistency_king_should_trigger_30_days_3_sessions_each(self, default_achievements):
        now = datetime.now(timezone.utc)
        today = convert_utc_to_local_time(now, 0).date()
        sessions = []
        for i in range(30):
            day = today - timedelta(days=i)
            for hour_offset in [0, 4, 8]:
                session_time = datetime.combine(day, datetime.min.time()).replace(tzinfo=timezone.utc) + timedelta(hours=14 + hour_offset)
                sessions.append(self.create_session(session_time))
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert result['consistency_king'] == True

    @pytest.mark.asyncio
    async def test_consistency_king_should_not_trigger_29_days_3_sessions_each(self, default_achievements):
        today = datetime(2024, 8, 7, tzinfo=timezone.utc)
        sessions = []
        for i in range(29):
            day = today - timedelta(days=i)
            for hour in [9, 14, 19]:
                sessions.append(self.create_session(day.replace(hour=hour)))
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert 'consistency_king' not in result

    @pytest.mark.asyncio
    async def test_consistency_king_should_not_trigger_one_day_2_sessions(self, default_achievements):
        today = datetime(2024, 8, 7, tzinfo=timezone.utc)
        sessions = []
        for i in range(30):
            day = today - timedelta(days=i)
            session_count = 2 if i == 15 else 3
            for hour in range(9, 9 + session_count):
                sessions.append(self.create_session(day.replace(hour=hour)))
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert 'consistency_king' not in result

    @pytest.mark.asyncio
    async def test_redemption_should_trigger_within_15_minutes_of_deadline(self, default_achievements):
        deadline = datetime(2024, 8, 7, 15, 0, tzinfo=timezone.utc)
        completion_time = deadline + timedelta(minutes=10)
        sessions = [
            self.create_session(
                start_time=completion_time - timedelta(hours=1),
                end_time=completion_time,
                session_type='assignment',
                deadline=deadline
            )
        ]
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert result['redemption'] == True

    @pytest.mark.asyncio
    async def test_redemption_should_not_trigger_16_minutes_after_deadline(self, default_achievements):
        deadline = datetime(2024, 8, 7, 15, 0, tzinfo=timezone.utc)
        completion_time = deadline + timedelta(minutes=16)
        sessions = [
            self.create_session(
                start_time=completion_time - timedelta(hours=1),
                end_time=completion_time,
                session_type='assignment',
                deadline=deadline
            )
        ]
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert 'redemption' not in result

    @pytest.mark.asyncio
    async def test_redemption_should_not_trigger_chore_type(self, default_achievements):
        deadline = datetime(2024, 8, 7, 15, 0, tzinfo=timezone.utc)
        completion_time = deadline + timedelta(minutes=10)
        sessions = [
            self.create_session(
                start_time=completion_time - timedelta(hours=1),
                end_time=completion_time,
                session_type='chore',
                deadline=deadline
            )
        ]
        result = await check_session_achievements(sessions, default_achievements, 0)
        assert 'redemption' not in result

    @pytest.mark.asyncio
    async def test_level_achievements_should_trigger_at_thresholds(self, default_achievements):
        result = await check_level_achievements(5, default_achievements)
        assert result['humble_beginner'] == True
        
        default_achievements['humble_beginner'] = True
        result = await check_level_achievements(10, default_achievements)
        assert result['making_progress'] == True
        
        default_achievements['making_progress'] = True
        result = await check_level_achievements(25, default_achievements)
        assert result['motivated'] == True
        
        default_achievements['motivated'] = True
        result = await check_level_achievements(50, default_achievements)
        assert result['hard_worker'] == True
        
        default_achievements['hard_worker'] = True
        result = await check_level_achievements(75, default_achievements)
        assert result['grinder_expert'] == True
        
        default_achievements['grinder_expert'] = True
        result = await check_level_achievements(100, default_achievements)
        assert result['legend_of_grinding'] == True

    @pytest.mark.asyncio
    async def test_level_achievements_should_not_trigger_below_thresholds(self, default_achievements):
        result = await check_level_achievements(4, default_achievements)
        assert 'humble_beginner' not in result
        
        result = await check_level_achievements(9, default_achievements)
        assert 'making_progress' not in result
        
        result = await check_level_achievements(24, default_achievements)
        assert 'motivated' not in result

    @pytest.mark.asyncio
    async def test_task_slayer_achievements_should_trigger_at_thresholds(self, default_achievements):
        result = await check_cumulative_achievements(10, 0, default_achievements)
        assert result['task_slayer_i'] == True
        
        default_achievements['task_slayer_i'] = True
        result = await check_cumulative_achievements(30, 0, default_achievements)
        assert result['task_slayer_ii'] == True
        
        default_achievements['task_slayer_ii'] = True
        result = await check_cumulative_achievements(100, 0, default_achievements)
        assert result['task_slayer_iii'] == True
        
        default_achievements['task_slayer_iii'] = True
        result = await check_cumulative_achievements(250, 0, default_achievements)
        assert result['task_slayer_iv'] == True
        
        default_achievements['task_slayer_iv'] = True
        result = await check_cumulative_achievements(500, 0, default_achievements)
        assert result['task_slayer_v'] == True

    @pytest.mark.asyncio
    async def test_task_slayer_achievements_should_not_trigger_below_thresholds(self, default_achievements):
        result = await check_cumulative_achievements(9, 0, default_achievements)
        assert 'task_slayer_i' not in result
        
        result = await check_cumulative_achievements(29, 0, default_achievements)
        assert 'task_slayer_ii' not in result
        
        result = await check_cumulative_achievements(99, 0, default_achievements)
        assert 'task_slayer_iii' not in result

    @pytest.mark.asyncio
    async def test_home_hero_achievements_should_trigger_at_thresholds(self, default_achievements):
        result = await check_cumulative_achievements(0, 10, default_achievements)
        assert result['home_hero_i'] == True
        
        default_achievements['home_hero_i'] = True
        result = await check_cumulative_achievements(0, 50, default_achievements)
        assert result['home_hero_ii'] == True
        
        default_achievements['home_hero_ii'] = True
        result = await check_cumulative_achievements(0, 200, default_achievements)
        assert result['home_hero_iii'] == True
        
        default_achievements['home_hero_iii'] = True
        result = await check_cumulative_achievements(0, 500, default_achievements)
        assert result['home_hero_iv'] == True
        
        default_achievements['home_hero_iv'] = True
        result = await check_cumulative_achievements(0, 1000, default_achievements)
        assert result['home_hero_v'] == True

    @pytest.mark.asyncio
    async def test_home_hero_achievements_should_not_trigger_below_thresholds(self, default_achievements):
        result = await check_cumulative_achievements(0, 9, default_achievements)
        assert 'home_hero_i' not in result
        
        result = await check_cumulative_achievements(0, 49, default_achievements)
        assert 'home_hero_ii' not in result
        
        result = await check_cumulative_achievements(0, 199, default_achievements)
        assert 'home_hero_iii' not in result

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
