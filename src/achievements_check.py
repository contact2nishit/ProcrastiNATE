import requests
import json
from datetime import datetime, timedelta
from collections import defaultdict

from data_models import SessionCompletionDataModel
async def check_achievements(conn, user_id: int, completed: SessionCompletionDataModel):
    """Check and update achievements for a user"""
    try:
        # Fetch user achievements
        achievements = await conn.fetchrow("SELECT * FROM achievements WHERE user_id = $1", user_id)
        if not achievements:
            return {"message": "No achievements found for this user."}
        # Fetch sessions completed in the past month
        sessions_data = await get_sessions_past_month(conn, user_id)
        if not sessions_data:
            return {"message": "No sessions completed in the past month."}
        sessions = sessions_data['sessions']
        assignments_completed = sessions_data['assignments_completed']
        chores_completed = sessions_data['chores_completed']
        level = achievements['level']

        return {"message": "Achievements checked and updated successfully."}
    except Exception as e:
        print(f"Error checking achievements: {str(e)}")
        return {"error": "An error occurred while checking achievements."}

async def get_sessions_past_month(conn, user_id: int):
    """Fetch assignment and chore occurrences and completed parent tasks for the past month"""
    try:
        one_month_ago = datetime.now() - timedelta(days=30)
        # Fetch all assignment and chore occurrences in one query using UNION ALL
        sessions = await conn.fetch("""
            SELECT 'assignment' AS type, ao.*, a.completed AS parent_completed, a.deadline
            FROM assignment_occurences ao
            JOIN assignments a ON ao.assignment_id = a.assignment_id
            WHERE ao.user_id = $1 AND ao.start_time > $2
            UNION ALL
            SELECT 'chore' AS type, co.*, c.completed AS parent_completed
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

async def check_session_achievements(conn, user_id, sessions, completed, achievements):
    updates = {}

    # Helper: group sessions by date
    sessions_by_date = defaultdict(list)
    for s in sessions:
        date = s['start_time'].date()
        sessions_by_date[date].append(s)

    # First Timer
    if not achievements['first_timer']:
        if len(sessions) > 0:
            updates['first_timer'] = True

    # Getting the Hang of it: Finished 3 sessions in one day
    if not achievements['getting_the_hang_of_it']:
        if any(len(day_sessions) >= 3 for day_sessions in sessions_by_date.values()):
            updates['getting_the_hang_of_it'] = True

    # Early Bird: Completed a session before 8 am
    if not achievements['early_bird']:
        if any(s['start_time'].hour < 8 for s in sessions):
            updates['early_bird'] = True

    # Night Owl: Completed a session after 11 pm
    if not achievements['night_owl']:
        if any(s['start_time'].hour >= 23 for s in sessions):
            updates['night_owl'] = True

    # Weekend Warrior: Completed 5 sessions on a Weekend
    if not achievements['weekend_warrior']:
        weekend_sessions = [s for s in sessions if s['start_time'].weekday() >= 5]
        if len(weekend_sessions) >= 5:
            updates['weekend_warrior'] = True

    # 7-Day Streak: Completed each session with 80% locked in value in the last 7 days
    if not achievements['seven_day_streak']:
        today = datetime.now().date()
        streak = True
        for i in range(7):
            day = today - timedelta(days=i)
            day_sessions = [s for s in sessions if s['start_time'].date() == day]
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
        today = datetime.now().date()
        consistency = True
        for i in range(30):
            day = today - timedelta(days=i)
            if len([s for s in sessions if s['start_time'].date() == day]) < 3:
                consistency = False
                break
        if consistency:
            updates['consistency_king'] = True

    # Power Hour: 60 minute session completed with full focus
    if not achievements['power_hour']:
        for s in sessions:
            if s['end_time'] and s['start_time'] and s['locked_in'] is not None:
                duration = (s['end_time'] - s['start_time']).total_seconds() / 60
                if duration >= 60 and s['locked_in'] >= 8:
                    updates['power_hour'] = True
                    break

    # Focus Beast: Completed 2 hour session with full focus
    if not achievements['focus_beast']:
        for s in sessions:
            if s['end_time'] and s['start_time'] and s['locked_in'] is not None:
                duration = (s['end_time'] - s['start_time']).total_seconds() / 60
                if duration >= 120 and s['locked_in'] == 10:
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

    # Sleep is for the weak: Complete a session between 3 am and 5 am
    if not achievements['sleep_is_for_the_weak']:
        if any(3 <= s['start_time'].hour < 5 for s in sessions):
            updates['sleep_is_for_the_weak'] = True

    # Batch update
    if updates:
        set_clause = ', '.join([f"{k} = TRUE" for k in updates.keys()])
        await conn.execute(f"UPDATE achievements SET {set_clause} WHERE user_id = $1", user_id)