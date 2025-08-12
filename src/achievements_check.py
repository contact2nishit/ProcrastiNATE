import requests
import json
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from typing import Optional

from data_models import SessionCompletionDataModel

async def check_achievements(conn, user_id: int, tz_offset_minutes: int = 0):
    """Check and update achievements for a user"""
    try:
        achievements = await conn.fetchrow("SELECT * FROM achievements WHERE user_id = $1", user_id)
        if not achievements:
            return {"message": "No achievements found for this user."}
        sessions_data = await get_sessions_past_month(conn, user_id)
        if not sessions_data:
            return {"message": "No sessions completed in the past month."}
        sessions = sessions_data['sessions']
        assignments_completed = sessions_data['assignments_completed']
        chores_completed = sessions_data['chores_completed']
        level = achievements['levels']
        unlocked = {}
        
        # Session Based Achievements (with timezone consideration)
        session_unlocked = await check_session_achievements(sessions, achievements, tz_offset_minutes)
        unlocked.update(session_unlocked)
        
        # Level Based Achievements
        level_unlocked = await check_level_achievements(level, achievements)
        unlocked.update(level_unlocked)
        
        # Cumulative Achievements
        cumulative_unlocked = await check_cumulative_achievements(assignments_completed, chores_completed, achievements)
        unlocked.update(cumulative_unlocked)

        if unlocked:
            set_clause = ', '.join([f"{k} = TRUE" for k in unlocked.keys()])
            await conn.execute(f"UPDATE achievements SET {set_clause} WHERE user_id = $1", user_id)

        print(unlocked)
        return unlocked
    except Exception as e:
        print(f"Error checking achievements: {str(e)}")
        return {"error": "An error occurred while checking achievements."}

async def get_sessions_past_month(conn, user_id: int):
    """Fetch assignment and chore occurrences and completed parent tasks for the past month"""
    try:
        now = datetime.now(timezone.utc)
        one_month_ago = now - timedelta(days=30)
        # Fetch all assignment and chore occurrences in one query using UNION ALL
        sessions = await conn.fetch("""
            SELECT 'assignment' AS type, ao.*, a.completed AS parent_completed, a.deadline AS deadline, a.effort AS effort
            FROM assignment_occurences ao
            JOIN assignments a ON ao.assignment_id = a.assignment_id
            WHERE ao.user_id = $1 AND ao.start_time > $2
            UNION ALL
            SELECT 'chore' AS type, co.*, c.completed AS parent_completed, NULL AS deadline, c.effort AS effort
            FROM chore_occurences co
            JOIN chores c ON co.chore_id = c.chore_id
            WHERE co.user_id = $1 AND co.start_time > $2
        """, user_id, one_month_ago)
        # Count completed assignments and chores in Python
        assignments_completed = sum(
            1 for s in sessions if s['type'] == 'assignment' and s['parent_completed']
        )
        chores_completed = sum(
            1 for s in sessions if s['type'] == 'chore' and s['parent_completed']
        )
        return {
            "sessions": sessions,
            "assignments_completed": assignments_completed,
            "chores_completed": chores_completed
        }
    except Exception as e:
        print(f"Error fetching sessions: {str(e)}")
        return {
            "sessions": [],
            "assignments_completed": 0,
            "chores_completed": 0
        }

def convert_utc_to_local_time(utc_time: datetime, tz_offset_minutes: int = 0) -> datetime:
    """Convert UTC time to user's local timezone using offset in minutes"""
    try:
        return utc_time + timedelta(minutes=tz_offset_minutes)
    except Exception:
        # Fallback to UTC if timezone conversion fails
        return utc_time

async def check_session_achievements(sessions, achievements, tz_offset_minutes: int = 0):
    updates = {}

    # Helper: group sessions by date in user's local timezone
    sessions_by_date = defaultdict(list)
    for s in sessions:
        local_time = convert_utc_to_local_time(s['start_time'], tz_offset_minutes)
        date = local_time.date()
        sessions_by_date[date].append({**s, 'local_start_time': local_time})

    # First Timer
    if not achievements['first_timer']:
        if len(sessions) > 0:
            updates['first_timer'] = True

    # Getting the Hang of it: Finished 3 sessions in one day
    if not achievements['getting_the_hang_of_it']:
        if any(len(day_sessions) >= 3 for day_sessions in sessions_by_date.values()):
            updates['getting_the_hang_of_it'] = True

    # Early Bird: Completed a session before 8 am (LOCAL TIME)
    if not achievements['early_bird']:
        for s in sessions:
            local_time = convert_utc_to_local_time(s['start_time'], tz_offset_minutes)
            if local_time.hour < 8:
                updates['early_bird'] = True
                break

    # Night Owl: Completed a session after 11 pm (LOCAL TIME)
    if not achievements['night_owl']:
        for s in sessions:
            local_time = convert_utc_to_local_time(s['start_time'], tz_offset_minutes)
            if local_time.hour >= 23:
                updates['night_owl'] = True
                break

    # Weekend Warrior: Completed 5 sessions on a Weekend (LOCAL TIME)
    if not achievements['weekend_warrior']:
        weekend_sessions = []
        for s in sessions:
            local_time = convert_utc_to_local_time(s['start_time'], tz_offset_minutes)
            if local_time.weekday() >= 5:  # Saturday = 5, Sunday = 6
                weekend_sessions.append(s)
        if len(weekend_sessions) >= 5:
            updates['weekend_warrior'] = True

    # 7-Day Streak: Completed each session with 80% locked in value in the last 7 days (LOCAL TIME)
    if not achievements['seven_day_streak']:
        today = convert_utc_to_local_time(datetime.now(timezone.utc), tz_offset_minutes).date()
        streak = True
        for i in range(7):
            day = today - timedelta(days=i)
            # Find sessions on this day in local time
            day_sessions = []
            for s in sessions:
                local_time = convert_utc_to_local_time(s['start_time'], tz_offset_minutes)
                if local_time.date() == day:
                    day_sessions.append(s)
            
            # Check if any session on this day has >= 80% locked in
            if not any(s['locked_in'] >= 0.8 * s['effort'] for s in day_sessions):
                streak = False
                break
        if streak:
            updates['seven_day_streak'] = True

    # Daily Grinder: Completed 5 sessions in one day
    if not achievements['daily_grinder']:
        if any(len(day_sessions) >= 5 for day_sessions in sessions_by_date.values()):
            updates['daily_grinder'] = True

    # Consistency King: Complete all sessions everyday for a month (at least 3 a day)
    if not achievements['consistency_king']:
        today = convert_utc_to_local_time(datetime.now(timezone.utc), tz_offset_minutes).date()
        consistency = True
        for i in range(30):
            day = today - timedelta(days=i)
            # Count sessions on this day in local time
            day_session_count = 0
            for s in sessions:
                local_time = convert_utc_to_local_time(s['start_time'], tz_offset_minutes)
                if local_time.date() == day:
                    day_session_count += 1
            
            if day_session_count < 3:
                consistency = False
                break
        if consistency:
            updates['consistency_king'] = True

    # Power Hour: 60 minute session completed with good focus (>=8 out of 10)
    if not achievements['power_hour']:
        for s in sessions:
            if s['end_time'] and s['start_time'] and s['locked_in'] is not None:
                duration = (s['end_time'] - s['start_time']).total_seconds() / 60
                if duration >= 60 and s['locked_in'] >= 8:
                    updates['power_hour'] = True
                    break

    # Focus Beast: Completed 2 hour session with excellent focus (>=9 out of 10)
    # Note: Changed threshold from 10 to 9 to be more achievable
    if not achievements['focus_beast']:
        for s in sessions:
            if s['end_time'] and s['start_time'] and s['locked_in'] is not None:
                duration = (s['end_time'] - s['start_time']).total_seconds() / 60
                if duration >= 120 and s['locked_in'] >= 9:
                    updates['focus_beast'] = True
                    break

    # Redemption: Complete an Assignment not more than 15 minutes after the deadline
    if not achievements['redemption']:
        for s in sessions:
            if (
                s['type'] == 'assignment'
                and s.get('deadline')
                and s.get('end_time')
            ):
                delta = abs((s['end_time'] - s['deadline']).total_seconds()) / 60
                if delta <= 15:
                    updates['redemption'] = True
                    break

    # Sleep is for the weak: Complete a session between 3 am and 5 am (LOCAL TIME)
    if not achievements['sleep_is_for_the_weak']:
        for s in sessions:
            local_time = convert_utc_to_local_time(s['start_time'], tz_offset_minutes)
            if 3 <= local_time.hour < 5:
                updates['sleep_is_for_the_weak'] = True
                break

    return updates

async def check_level_achievements(level, achievements):
    updates = {}
    level_achievements = [
        ('humble_beginner', 5),
        ('making_progress', 10),
        ('motivated', 25),
        ('hard_worker', 50),
        ('grinder_expert', 75),
        ('legend_of_grinding', 100),
    ]
    for name, threshold in level_achievements:
        if not achievements.get(name) and level >= threshold:
            updates[name] = True
    return updates

async def check_cumulative_achievements(assignments_completed, chores_completed, achievements):
    updates = {}
    # Task Slayer (Assignments)
    task_slayer = [
        ('task_slayer_i', 10),
        ('task_slayer_ii', 30),
        ('task_slayer_iii', 100),
        ('task_slayer_iv', 250),
        ('task_slayer_v', 500),
    ]
    for name, threshold in task_slayer:
        if not achievements.get(name) and assignments_completed >= threshold:
            updates[name] = True

    # Home Hero (Chores)
    home_hero = [
        ('home_hero_i', 10),
        ('home_hero_ii', 50),
        ('home_hero_iii', 200),
        ('home_hero_iv', 500),
        ('home_hero_v', 1000),
    ]
    for name, threshold in home_hero:
        if not achievements.get(name) and chores_completed >= threshold:
            updates[name] = True

    return updates

