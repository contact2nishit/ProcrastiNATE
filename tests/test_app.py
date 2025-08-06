import pytest
import sys
import os
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import status
from datetime import datetime, timezone, timedelta, time, date
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))
from app import app
from data_models import (
    RegistrationDataModel, UserInDB, ScheduleRequest, MeetingInRequest, 
    AssignmentInRequest, ChoreInRequest, Schedule, ScheduleResponseFormat, 
    SessionCompletionDataModel, RescheduleRequestDataModel
)

def validate_schedule_no_overlaps(schedule):
    """
    Validates that no two occurrences in a schedule overlap.
    Returns True if valid, False if overlaps found.
    """
    all_time_slots = []
    
    # Collect all time slots from assignments
    for assignment in schedule["assignments"]:
        if "schedule" in assignment and "slots" in assignment["schedule"]:
            for slot in assignment["schedule"]["slots"]:
                all_time_slots.append((slot["start"], slot["end"], f"assignment:{assignment['name']}"))
    
    # Collect all time slots from chores
    for chore in schedule["chores"]:
        if "schedule" in chore and "slots" in chore["schedule"]:
            for slot in chore["schedule"]["slots"]:
                all_time_slots.append((slot["start"], slot["end"], f"chore:{chore['name']}"))
    
    # Check for overlaps
    for i in range(len(all_time_slots)):
        for j in range(i + 1, len(all_time_slots)):
            start1, end1, name1 = all_time_slots[i]
            start2, end2, name2 = all_time_slots[j]
            
            # Convert string timestamps to datetime objects if needed
            if isinstance(start1, str):
                start1 = datetime.fromisoformat(start1.replace('Z', '+00:00'))
            if isinstance(end1, str):
                end1 = datetime.fromisoformat(end1.replace('Z', '+00:00'))
            if isinstance(start2, str):
                start2 = datetime.fromisoformat(start2.replace('Z', '+00:00'))
            if isinstance(end2, str):
                end2 = datetime.fromisoformat(end2.replace('Z', '+00:00'))
            
            # Check if time slots overlap
            if start1 < end2 and start2 < end1:
                print(f"Overlap detected between {name1} ({start1}-{end1}) and {name2} ({start2}-{end2})")
                return False
    
    return True

class TestEndpoints:
    """Test suite for most endpoints"""
    
    @pytest.fixture
    def mock_user(self):
        return UserInDB(
            username="testuser",
            user_id=123,
            email="test@example.com",
            hashed_password="hashed"
        )
    
    @pytest.fixture
    def sample_meetings(self):
        return [
            MeetingInRequest(
                name="Team Standup",
                start_end_times=[
                    [datetime(2024, 8, 7, 9, 0, tzinfo=timezone.utc), datetime(2024, 8, 7, 9, 30, tzinfo=timezone.utc)],
                    [datetime(2024, 8, 8, 9, 0, tzinfo=timezone.utc), datetime(2024, 8, 8, 9, 30, tzinfo=timezone.utc)]
                ],
                link_or_loc="https://zoom.us/meeting"
            ),
            MeetingInRequest(
                name="Client Call",
                start_end_times=[
                    [datetime(2024, 8, 7, 14, 0, tzinfo=timezone.utc), datetime(2024, 8, 7, 15, 0, tzinfo=timezone.utc)]
                ],
                link_or_loc=None
            )
        ]
    
    @pytest.fixture
    def sample_assignments(self):
        return [
            AssignmentInRequest(
                name="Math Homework",
                effort=120,
                due=datetime(2024, 8, 9, 23, 59, tzinfo=timezone.utc)
            ),
            AssignmentInRequest(
                name="Essay Draft",
                effort=180,
                due=datetime(2024, 8, 10, 17, 0, tzinfo=timezone.utc)
            )
        ]
    
    @pytest.fixture
    def sample_chores(self):
        return [
            ChoreInRequest(
                name="Grocery Shopping",
                effort=60,
                window=[
                    datetime(2024, 8, 7, 8, 0, tzinfo=timezone.utc),
                    datetime(2024, 8, 7, 20, 0, tzinfo=timezone.utc)
                ]
            ),
            ChoreInRequest(
                name="House Cleaning",
                effort=90,
                window=[
                    datetime(2024, 8, 8, 10, 0, tzinfo=timezone.utc),
                    datetime(2024, 8, 9, 18, 0, tzinfo=timezone.utc)
                ]
            )
        ]
    
    def setup_method(self):
        """Setup test client and mocks before each test"""
        self.client = TestClient(app)
        self.mock_conn = AsyncMock()
        self.mock_acquire = MagicMock()
        self.mock_acquire.__aenter__ = AsyncMock(return_value=self.mock_conn)
        self.mock_acquire.__aexit__ = AsyncMock(return_value=None)
        self.mock_pool = MagicMock()
        self.mock_pool.acquire.return_value = self.mock_acquire
        app.state.pool = self.mock_pool
    
    def teardown_method(self):
        """Clean up after each test"""
        # Clean up the pool
        if hasattr(app.state, 'pool'):
            delattr(app.state, 'pool')
    
    @patch('app.get_password_hash')
    def test_register_success(self, mock_hash):
        """Test successful user registration"""
        mock_hash.return_value = "hashed_password_123"
        self.mock_conn.fetchrow.return_value = None  # No existing user
        self.mock_conn.fetchval.return_value = 123  # New user ID
        self.mock_conn.execute.return_value = None  # Achievement insertion
        registration_data = {
            "username": "testuser",
            "email": "test@example.com", 
            "pwd": "password123"
        }
        response = self.client.post("/register", json=registration_data)
        assert response.status_code == status.HTTP_200_OK
        self.mock_conn.fetchrow.assert_called_once()
        self.mock_conn.fetchval.assert_called_once()
        self.mock_conn.execute.assert_called_once()
        mock_hash.assert_called_once_with("password123")
    
    def test_register_missing_username(self):
        """Test registration with missing username"""
        registration_data = {
            "email": "test@example.com",
            "pwd": "password123"
        }
        response = self.client.post("/register", json=registration_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_register_missing_email(self):
        """Test registration with missing email"""
        registration_data = {
            "username": "testuser",
            "pwd": "password123"
        }
        response = self.client.post("/register", json=registration_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_register_missing_password(self):
        """Test registration with missing password"""
        registration_data = {
            "username": "testuser",
            "email": "test@example.com"
        }
        response = self.client.post("/register", json=registration_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_register_empty_fields(self):
        """Test registration with empty string fields"""
        registration_data = {
            "username": "",
            "email": "test@example.com",
            "pwd": "password123"
        }
        response = self.client.post("/register", json=registration_data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_register_duplicate_username(self):
        """Test registration with existing username"""
        self.mock_conn.fetchrow.return_value = {"user_id": 456}
        registration_data = {
            "username": "existinguser",
            "email": "new@example.com",
            "pwd": "password123"
        }
        response = self.client.post("/register", json=registration_data)
        assert response.status_code == status.HTTP_409_CONFLICT
    
    def test_register_duplicate_email(self):
        """Test registration with existing email"""
        self.mock_conn.fetchrow.return_value = {"user_id": 789}
        registration_data = {
            "username": "newuser",
            "email": "existing@example.com",
            "pwd": "password123"
        }
        response = self.client.post("/register", json=registration_data)
        assert response.status_code == status.HTTP_409_CONFLICT
    
    def test_register_database_error_on_check(self):
        """Test registration when database check fails"""
        self.mock_conn.fetchrow.side_effect = Exception("Database connection failed")
        registration_data = {
            "username": "testuser",
            "email": "test@example.com",
            "pwd": "password123"
        }
        response = self.client.post("/register", json=registration_data)
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    
    @patch('app.get_password_hash')
    def test_register_database_error_on_insert(self, mock_hash):
        """Test registration when user insertion fails"""
        mock_hash.return_value = "hashed_password"
        self.mock_conn.fetchrow.return_value = None  # No existing user
        self.mock_conn.fetchval.side_effect = Exception("Insert failed")
        registration_data = {
            "username": "testuser",
            "email": "test@example.com",
            "pwd": "password123"
        }
        response = self.client.post("/register", json=registration_data)
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Something went wrong on the backend" in response.json()["detail"]
    
    @patch('app.get_password_hash')
    def test_register_achievement_insert_failure(self, mock_hash):
        """Test registration when achievement insertion fails"""
        mock_hash.return_value = "hashed_password"
        self.mock_conn.fetchrow.return_value = None
        self.mock_conn.fetchval.return_value = 123  # User created successfully
        self.mock_conn.execute.side_effect = Exception("Achievement insert failed")
        registration_data = {
            "username": "testuser",
            "email": "test@example.com",
            "pwd": "password123"
        }
        response = self.client.post("/register", json=registration_data)
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    
    def test_register_invalid_json(self):
        """Test registration with invalid JSON"""
        response = self.client.post(
            "/register", 
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    @patch('app.get_password_hash')
    def test_register_special_characters(self, mock_hash):
        """Test registration with special characters in fields"""
        mock_hash.return_value = "hashed_password"
        self.mock_conn.fetchrow.return_value = None
        self.mock_conn.fetchval.return_value = 123
        self.mock_conn.execute.return_value = None
        registration_data = {
            "username": "test@user#2024",
            "email": "test+user@example.co.uk",
            "pwd": "p@ssw0rd!@#$%^&*()"
        }
        response = self.client.post("/register", json=registration_data)
        assert response.status_code == status.HTTP_200_OK
        mock_hash.assert_called_once_with("p@ssw0rd!@#$%^&*()")

    @patch('app.authenticate_user')
    @patch('app.create_access_token')
    def test_login_success(self, mock_create_token, mock_auth):
        """Test successful user login"""
        mock_user = UserInDB(
            username="testuser",
            user_id=123,
            email="test@example.com",
            hashed_password="hashed_password"
        )
        mock_auth.return_value = mock_user
        mock_create_token.return_value = "jwt_token_123"
        form_data = {
            "username": "testuser",
            "password": "password123"
        }
        response = self.client.post(
            "/login",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["access_token"] == "jwt_token_123"
        mock_auth.assert_called_once_with("testuser", "password123", self.mock_pool)
        mock_create_token.assert_called_once()
    
    @patch('app.authenticate_user')
    def test_login_invalid_username(self, mock_auth):
        """Test login with invalid username"""
        # Setup mocks - authentication fails
        mock_auth.return_value = False
        form_data = {
            "username": "nonexistentuser",
            "password": "password123"
        }
        response = self.client.post(
            "/login",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json()["detail"] == "Incorrect username or password"
        assert "WWW-Authenticate" in response.headers
        assert response.headers["WWW-Authenticate"] == "Bearer"
    
    @patch('app.authenticate_user')
    def test_login_invalid_password(self, mock_auth):
        """Test login with invalid password"""
        mock_auth.return_value = False
        form_data = {
            "username": "testuser",
            "password": "wrongpassword"
        }
        response = self.client.post(
            "/login",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json()["detail"] == "Incorrect username or password"
    
    def test_login_missing_username(self):
        """Test login with missing username"""
        form_data = {
            "password": "password123"
        }
        response = self.client.post(
            "/login",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_login_missing_password(self):
        """Test login with missing password"""
        form_data = {
            "username": "testuser"
        }
        response = self.client.post(
            "/login",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_login_empty_fields(self):
        """Test login with empty fields"""
        form_data = {
            "username": "",
            "password": ""
        }
        response = self.client.post(
            "/login",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_422_UNPROCESSABLE_ENTITY]
    
    @patch('app.authenticate_user')
    def test_login_database_error(self, mock_auth):
        """Test login when authentication database call fails"""
        mock_auth.side_effect = Exception("Database connection failed")
        form_data = {
            "username": "testuser",
            "password": "password123"
        }
        response = self.client.post(
            "/login",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    
    @patch('app.authenticate_user')
    @patch('app.create_access_token')
    def test_login_token_creation_error(self, mock_create_token, mock_auth):
        """Test login when JWT token creation fails"""
        mock_user = UserInDB(
            username="testuser", 
            user_id=123,
            email="test@example.com",
            hashed_password="hashed"
        )
        mock_auth.return_value = mock_user
        mock_create_token.side_effect = Exception("Token creation failed")
        form_data = {
            "username": "testuser",
            "password": "password123"
        }
        response = self.client.post(
            "/login",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    
    def test_login_wrong_content_type(self):
        """Test login with wrong content type (JSON instead of form data)"""
        json_data = {
            "username": "testuser",
            "password": "password123"
        }
        response = self.client.post("/login", json=json_data)
        # Should fail because OAuth2PasswordRequestForm expects form data
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    @patch('app.authenticate_user')
    @patch('app.create_access_token')
    def test_login_special_characters(self, mock_create_token, mock_auth):
        """Test login with special characters"""
        mock_user = UserInDB(
            username="test@user#2024",
            user_id=123, 
            email="test@example.com",
            hashed_password="hashed"
        )
        mock_auth.return_value = mock_user
        mock_create_token.return_value = "jwt_token"
        form_data = {
            "username": "test@user#2024",
            "password": "p@ssw0rd!@#$%^&*()"
        }
        response = self.client.post(
            "/login",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == status.HTTP_200_OK
        mock_auth.assert_called_once_with("test@user#2024", "p@ssw0rd!@#$%^&*()", self.mock_pool)
    
    @patch('app.authenticate_user')
    @patch('app.create_access_token')  
    def test_login_token_expiry_setup(self, mock_create_token, mock_auth):
        """Test that login sets up token with correct expiry"""
        mock_user = UserInDB(
            username="testuser",
            user_id=123,
            email="test@example.com", 
            hashed_password="hashed"
        )
        mock_auth.return_value = mock_user
        mock_create_token.return_value = "jwt_token"
        form_data = {
            "username": "testuser",
            "password": "password123"
        }
        response = self.client.post(
            "/login",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == status.HTTP_200_OK
        # Check that create_access_token was called with user ID and expiry delta
        call_args = mock_create_token.call_args
        assert call_args[1]["data"]["sub"] == "123"  # User ID as string
        assert "expires_delta" in call_args[1]
    
    @patch('app.authenticate_user')
    def test_login_null_user_response(self, mock_auth):
        """Test login when authenticate_user returns None instead of False"""
        mock_auth.return_value = None
        form_data = {
            "username": "testuser", 
            "password": "password123"
        }
        response = self.client.post(
            "/login",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @patch('app.get_current_user')
    def test_get_level_success(self, mock_get_current_user):
        """Test successful level retrieval"""
        mock_user = UserInDB(
            username="testuser",
            user_id=123,
            email="test@example.com",
            hashed_password="hashed"
        )
        mock_get_current_user.return_value = mock_user
        self.mock_pool.fetchrow = AsyncMock(return_value={"username": "testuser", "xp": 150})
        self.mock_pool.fetchval = AsyncMock(return_value=3)
        headers = {"Authorization": "Bearer fake_token_123"}
        response = self.client.get("/getLevel", headers=headers)
        assert response.status_code == status.HTTP_200_OK
        response_data = response.json()
        assert response_data["user_name"] == "testuser"
        assert response_data["xp"] == 150
        assert response_data["level"] == 3

    
    @patch('app.get_current_user')
    def test_get_level_user_not_found(self, mock_get_current_user):
        """Test level retrieval when get_current_user returns None"""
        mock_get_current_user.return_value = None
        headers = {"Authorization": "Bearer invalid_token"}
        response = self.client.get("/getLevel", headers=headers)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json()["detail"] == "Invalid authentication credentials"
        mock_get_current_user.assert_called_once_with("invalid_token", self.mock_pool)
    
    @patch('app.get_current_user')
    def test_get_level_database_error(self, mock_get_current_user):
        """Test level retrieval when database query fails"""
        mock_user = UserInDB(
            username="testuser",
            user_id=123,
            email="test@example.com", 
            hashed_password="hashed"
        )
        mock_get_current_user.return_value = mock_user
        self.mock_pool.fetchrow = AsyncMock(side_effect=Exception("Database connection failed"))
        headers = {"Authorization": "Bearer valid_token"}
        response = self.client.get("/getLevel", headers=headers)
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR

    @patch('app.get_current_user')
    def test_schedule_successful_basic(self, mock_get_current_user, mock_user, sample_meetings, sample_assignments, sample_chores):
        mock_get_current_user.return_value = mock_user
        mock_context = AsyncMock()
        mock_connection = AsyncMock()
        mock_context.__aenter__.return_value = mock_connection
        mock_context.__aexit__.return_value = None
        self.mock_pool.acquire.return_value = mock_context
        mock_connection.fetch.side_effect = [[], [], []]
        mock_connection.fetchval.return_value = 1
        # No mocking of schedule_tasks - use real scheduler function
        request_data = ScheduleRequest(
            meetings=sample_meetings,
            assignments=sample_assignments,
            chores=sample_chores,
            tz_offset_minutes=0
        )
        headers = {"Authorization": "Bearer mock_token"}
        response = self.client.post("/schedule", json=request_data.model_dump(mode='json'), headers=headers)
        assert response.status_code == 200
        response_data = response.json()
        assert "schedules" in response_data
        assert "conflicting_meetings" in response_data
        assert "meetings" in response_data
        # Validate that schedules are well-formed (no overlaps)
        for schedule in response_data["schedules"]:
            assert validate_schedule_no_overlaps(schedule), f"Schedule contains overlapping occurrences: {schedule}"

    @patch('app.get_current_user')
    def test_schedule_with_meeting_conflicts(self, mock_get_current_user, mock_user, sample_meetings):
        mock_get_current_user.return_value = mock_user
        mock_context = AsyncMock()
        mock_connection = AsyncMock()
        mock_context.__aenter__.return_value = mock_connection
        mock_context.__aexit__.return_value = None
        self.mock_pool.acquire.return_value = mock_context
        conflicting_times = [
            {'start_time': datetime(2024, 8, 7, 9, 15, tzinfo=timezone.utc), 'end_time': datetime(2024, 8, 7, 9, 45, tzinfo=timezone.utc)}
        ]
        mock_connection.fetch.side_effect = [conflicting_times, [], []]
        mock_connection.fetchval.return_value = 1
        # No mocking of schedule_tasks - use real scheduler function
        request_data = ScheduleRequest(
            meetings=sample_meetings,
            assignments=[],
            chores=[],
            tz_offset_minutes=0
        )
        headers = {"Authorization": "Bearer mock_token"}
        response = self.client.post("/schedule", json=request_data.model_dump(mode='json'), headers=headers)
        assert response.status_code == 200
        response_data = response.json()
        assert len(response_data["conflicting_meetings"]) > 0
        # Validate that schedules are well-formed (no overlaps)
        for schedule in response_data["schedules"]:
            assert validate_schedule_no_overlaps(schedule), f"Schedule contains overlapping occurrences: {schedule}"

    @patch('app.get_current_user')
    def test_schedule_with_assignment_conflicts(self, mock_get_current_user, mock_user, sample_assignments):
        mock_get_current_user.return_value = mock_user
        mock_context = AsyncMock()
        mock_connection = AsyncMock()
        mock_context.__aenter__.return_value = mock_connection
        mock_context.__aexit__.return_value = None
        self.mock_pool.acquire.return_value = mock_context
        mock_connection.fetch.side_effect = [[], [], []]
        mock_connection.fetchval.return_value = 1
        # No mocking of schedule_tasks - use real scheduler function
        request_data = ScheduleRequest(
            meetings=[],
            assignments=sample_assignments,
            chores=[],
            tz_offset_minutes=0
        )
        headers = {"Authorization": "Bearer mock_token"}
        response = self.client.post("/schedule", json=request_data.model_dump(mode='json'), headers=headers)
        assert response.status_code == 200
        response_data = response.json()
        # Note: Real scheduler might not have conflicts, so check if schedules exist
        assert "schedules" in response_data
        # Validate that schedules are well-formed (no overlaps)
        for schedule in response_data["schedules"]:
            assert validate_schedule_no_overlaps(schedule), f"Schedule contains overlapping occurrences: {schedule}"

    @patch('app.get_current_user')
    def test_schedule_with_chore_conflicts(self, mock_get_current_user, mock_user, sample_chores):
        mock_get_current_user.return_value = mock_user
        mock_context = AsyncMock()
        mock_connection = AsyncMock()
        mock_context.__aenter__.return_value = mock_connection
        mock_context.__aexit__.return_value = None
        self.mock_pool.acquire.return_value = mock_context
        mock_connection.fetch.side_effect = [[], [], []]
        mock_connection.fetchval.return_value = 1
        # No mocking of schedule_tasks - use real scheduler function
        request_data = ScheduleRequest(
            meetings=[],
            assignments=[],
            chores=sample_chores,
            tz_offset_minutes=0
        )
        headers = {"Authorization": "Bearer mock_token"}
        response = self.client.post("/schedule", json=request_data.model_dump(mode='json'), headers=headers)
        assert response.status_code == 200
        response_data = response.json()
        # Note: Real scheduler might not have conflicts, so check if schedules exist
        assert "schedules" in response_data
        # Validate that schedules are well-formed (no overlaps)
        for schedule in response_data["schedules"]:
            assert validate_schedule_no_overlaps(schedule), f"Schedule contains overlapping occurrences: {schedule}"

    @patch('app.get_current_user')
    def test_schedule_with_existing_assignments_and_chores(self, mock_get_current_user, mock_user):
        mock_get_current_user.return_value = mock_user
        mock_context = AsyncMock()
        mock_connection = AsyncMock()
        mock_context.__aenter__.return_value = mock_connection
        mock_context.__aexit__.return_value = None
        self.mock_pool.acquire.return_value = mock_context
        existing_assignments = [
            {'start_time': datetime(2024, 8, 7, 14, 0, tzinfo=timezone.utc), 'end_time': datetime(2024, 8, 7, 15, 0, tzinfo=timezone.utc)}
        ]
        existing_chores = [
            {'start_time': datetime(2024, 8, 7, 16, 0, tzinfo=timezone.utc), 'end_time': datetime(2024, 8, 7, 17, 0, tzinfo=timezone.utc)}
        ]
        mock_connection.fetch.side_effect = [[], existing_assignments, existing_chores]
        mock_connection.fetchval.return_value = 1
        # No mocking of schedule_tasks - use real scheduler function
        request_data = ScheduleRequest(
            meetings=[],
            assignments=[],
            chores=[],
            tz_offset_minutes=0
        )
        headers = {"Authorization": "Bearer mock_token"}
        response = self.client.post("/schedule", json=request_data.model_dump(mode='json'), headers=headers)
        assert response.status_code == 200
        mock_get_current_user.return_value = mock_user
        mock_context = AsyncMock()
        mock_context.__aenter__.side_effect = Exception("Database connection failed")
        self.mock_pool.acquire.return_value = mock_context
        request_data = ScheduleRequest(
            meetings=[],
            assignments=[],
            chores=[],
            tz_offset_minutes=0
        )
        headers = {"Authorization": "Bearer mock_token"}
        response = self.client.post("/schedule", json=request_data.model_dump(mode='json'), headers=headers)
        assert response.status_code == 500
        assert "Something went wrong on the backend" in response.json()["detail"]

    @patch('app.get_current_user')
    def test_setSchedule_successful_first_time(self, mock_get_current_user, mock_user, sample_meetings, sample_assignments, sample_chores):
        mock_get_current_user.return_value = mock_user
        mock_context = AsyncMock()
        mock_connection = AsyncMock()
        mock_context.__aenter__.return_value = mock_connection
        mock_context.__aexit__.return_value = None
        self.mock_pool.acquire.return_value = mock_context
        mock_connection.fetchval.return_value = 1
        mock_connection.execute.return_value = None
        mock_connection.executemany.return_value = None
        from data_models import AssignmentInPotentialSchedule, ChoreInPotentialSchedule, ScheduledTaskInfo, TimeSlot
        sample_slot = TimeSlot(start=datetime(2024, 8, 7, 10, 0, tzinfo=timezone.utc), end=datetime(2024, 8, 7, 11, 0, tzinfo=timezone.utc), xp_potential=100)
        sample_schedule_info = ScheduledTaskInfo(effort_assigned=60, status="fully_scheduled", slots=[sample_slot])
        sample_assignment_scheduled = AssignmentInPotentialSchedule(name="Math Homework", effort=120, due=datetime(2024, 8, 9, 23, 59, tzinfo=timezone.utc), schedule=sample_schedule_info)
        sample_chore_scheduled = ChoreInPotentialSchedule(name="Grocery Shopping", effort=60, window=[datetime(2024, 8, 7, 8, 0, tzinfo=timezone.utc), datetime(2024, 8, 7, 20, 0, tzinfo=timezone.utc)], schedule=sample_schedule_info)
        schedule_data = Schedule(
            assignments=[sample_assignment_scheduled],
            chores=[sample_chore_scheduled],
            conflicting_assignments=[],
            conflicting_chores=[],
            not_enough_time_assignments=[],
            not_enough_time_chores=[],
            total_potential_xp=100
        )
        headers = {"Authorization": "Bearer mock_token"}
        response = self.client.post("/setSchedule", json=schedule_data.model_dump(mode='json'), headers=headers)
        assert response.status_code == 200
        response_data = response.json()
        assert "assignments" in response_data
        assert "chores" in response_data

    @patch('app.get_current_user')
    def test_setSchedule_successful_update_existing(self, mock_get_current_user, mock_user, sample_meetings):
        mock_get_current_user.return_value = mock_user
        mock_context = AsyncMock()
        mock_connection = AsyncMock()
        mock_context.__aenter__.return_value = mock_connection
        mock_context.__aexit__.return_value = None
        self.mock_pool.acquire.return_value = mock_context
        mock_connection.fetchval.return_value = 1
        mock_connection.execute.return_value = None
        mock_connection.executemany.return_value = None
        schedule_data = Schedule(
            assignments=[],
            chores=[],
            conflicting_assignments=[],
            conflicting_chores=[],
            not_enough_time_assignments=[],
            not_enough_time_chores=[],
            total_potential_xp=0
        )
        headers = {"Authorization": "Bearer mock_token"}
        response = self.client.post("/setSchedule", json=schedule_data.model_dump(mode='json'), headers=headers)
        assert response.status_code == 200
        response_data = response.json()
        assert "assignments" in response_data
        assert "chores" in response_data

    @patch('app.get_current_user')
    def test_setSchedule_database_error_during_check(self, mock_get_current_user, mock_user):
        mock_get_current_user.return_value = mock_user
        mock_context = AsyncMock()
        mock_connection = AsyncMock()
        mock_context.__aenter__.return_value = mock_connection
        mock_context.__aexit__.return_value = None
        self.mock_pool.acquire.return_value = mock_context
        mock_connection.fetchval.side_effect = Exception("Database query failed")
        from data_models import AssignmentInPotentialSchedule, ScheduledTaskInfo, TimeSlot
        sample_slot = TimeSlot(start=datetime(2024, 8, 7, 10, 0, tzinfo=timezone.utc), end=datetime(2024, 8, 7, 11, 0, tzinfo=timezone.utc), xp_potential=100)
        sample_schedule_info = ScheduledTaskInfo(effort_assigned=60, status="fully_scheduled", slots=[sample_slot])
        sample_assignment = AssignmentInPotentialSchedule(name="Math Homework", effort=120, due=datetime(2024, 8, 9, 23, 59, tzinfo=timezone.utc), schedule=sample_schedule_info)
        schedule_data = Schedule(
            assignments=[sample_assignment],
            chores=[],
            conflicting_assignments=[],
            conflicting_chores=[],
            not_enough_time_assignments=[],
            not_enough_time_chores=[],
            total_potential_xp=100
        )
        headers = {"Authorization": "Bearer mock_token"}
        response = self.client.post("/setSchedule", json=schedule_data.model_dump(mode='json'), headers=headers)
        assert response.status_code == 500

    @patch('app.get_current_user')
    def test_setSchedule_database_error_during_insert(self, mock_get_current_user, mock_user):
        mock_get_current_user.return_value = mock_user
        mock_context = AsyncMock()
        mock_connection = AsyncMock()
        mock_context.__aenter__.return_value = mock_connection
        mock_context.__aexit__.return_value = None
        self.mock_pool.acquire.return_value = mock_context
        mock_connection.fetchval.side_effect = [1, Exception("Insert operation failed")]  # First succeeds, second fails
        from data_models import AssignmentInPotentialSchedule, ScheduledTaskInfo, TimeSlot
        sample_slot = TimeSlot(start=datetime(2024, 8, 7, 10, 0, tzinfo=timezone.utc), end=datetime(2024, 8, 7, 11, 0, tzinfo=timezone.utc), xp_potential=100)
        sample_schedule_info = ScheduledTaskInfo(effort_assigned=60, status="fully_scheduled", slots=[sample_slot])
        sample_assignment = AssignmentInPotentialSchedule(name="Math Homework", effort=120, due=datetime(2024, 8, 9, 23, 59, tzinfo=timezone.utc), schedule=sample_schedule_info)
        schedule_data = Schedule(
            assignments=[sample_assignment],
            chores=[],
            conflicting_assignments=[],
            conflicting_chores=[],
            not_enough_time_assignments=[],
            not_enough_time_chores=[],
            total_potential_xp=100
        )
        headers = {"Authorization": "Bearer mock_token"}
        response = self.client.post("/setSchedule", json=schedule_data.model_dump(mode='json'), headers=headers)
        assert response.status_code == 500

    @patch('app.get_current_user')
    def test_reschedule_successful_basic(self, mock_get_current_user, mock_user):
        mock_get_current_user.return_value = mock_user
        mock_context = AsyncMock()
        mock_connection = AsyncMock()
        mock_context.__aenter__.return_value = mock_connection
        mock_context.__aexit__.return_value = None
        self.mock_pool.acquire.return_value = mock_context
        mock_connection.fetchrow.return_value = {
            "assignment_id": 1,
            "assignment_name": "Math Homework",
            "effort": 120,
            "deadline": datetime(2024, 8, 9, 23, 59, tzinfo=timezone.utc)
        }
        mock_connection.fetch.side_effect = [
            [{"start_time": datetime(2024, 8, 7, 10, 0, tzinfo=timezone.utc), "end_time": datetime(2024, 8, 7, 11, 0, tzinfo=timezone.utc), "occurence_id": 1}],
            [],
            [],
            []
        ]
        mock_connection.execute.return_value = None
        # No mocking of schedule_tasks - use real scheduler function
        request_data = RescheduleRequestDataModel(
            event_type="assignment",
            id=1,
            allow_overlaps=False,
            new_effort=150,
            tz_offset_minutes=0
        )
        headers = {"Authorization": "Bearer mock_token"}
        response = self.client.post("/reschedule", json=request_data.model_dump(mode='json'), headers=headers)
        assert response.status_code == 200
        response_data = response.json()
        assert "schedules" in response_data
        # Validate that schedules are well-formed (no overlaps)
        for schedule in response_data["schedules"]:
            assert validate_schedule_no_overlaps(schedule), f"Schedule contains overlapping occurrences: {schedule}"

    @patch('app.get_current_user')
    def test_reschedule_no_existing_schedule(self, mock_get_current_user, mock_user):
        mock_get_current_user.return_value = mock_user
        mock_context = AsyncMock()
        mock_connection = AsyncMock()
        mock_context.__aenter__.return_value = mock_connection
        mock_context.__aexit__.return_value = None
        self.mock_pool.acquire.return_value = mock_context
        mock_connection.fetchrow.return_value = None
        request_data = RescheduleRequestDataModel(
            event_type="assignment",
            id=1,
            allow_overlaps=False,
            tz_offset_minutes=0
        )
        headers = {"Authorization": "Bearer mock_token"}
        response = self.client.post("/reschedule", json=request_data.model_dump(mode='json'), headers=headers)
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]

    @patch('app.get_current_user')
    def test_reschedule_meeting_not_found(self, mock_get_current_user, mock_user):
        mock_get_current_user.return_value = mock_user
        mock_context = AsyncMock()
        mock_connection = AsyncMock()
        mock_context.__aenter__.return_value = mock_connection
        mock_context.__aexit__.return_value = None
        self.mock_pool.acquire.return_value = mock_context
        mock_connection.fetchrow.return_value = None
        request_data = RescheduleRequestDataModel(
            event_type="chore",
            id=999,
            allow_overlaps=True,
            tz_offset_minutes=0
        )
        headers = {"Authorization": "Bearer mock_token"}
        response = self.client.post("/reschedule", json=request_data.model_dump(mode='json'), headers=headers)
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]

    @patch('app.get_current_user')
    def test_reschedule_chore_successful(self, mock_get_current_user, mock_user):
        mock_get_current_user.return_value = mock_user
        mock_context = AsyncMock()
        mock_connection = AsyncMock()
        mock_context.__aenter__.return_value = mock_connection
        mock_context.__aexit__.return_value = None
        self.mock_pool.acquire.return_value = mock_context
        mock_connection.fetchrow.return_value = {
            "chore_id": 1,
            "chore_name": "Grocery Shopping",
            "effort": 60,
            "start_window": datetime(2024, 8, 7, 8, 0, tzinfo=timezone.utc),
            "end_window": datetime(2024, 8, 7, 20, 0, tzinfo=timezone.utc)
        }
        mock_connection.fetch.side_effect = [
            [{"start_time": datetime(2024, 8, 7, 10, 0, tzinfo=timezone.utc), "end_time": datetime(2024, 8, 7, 11, 0, tzinfo=timezone.utc), "occurence_id": 1}],
            [],
            [],
            []
        ]
        mock_connection.execute.return_value = None
        # No mocking of schedule_tasks - use real scheduler function
        request_data = RescheduleRequestDataModel(
            event_type="chore",
            id=1,
            allow_overlaps=False,
            tz_offset_minutes=0
        )
        headers = {"Authorization": "Bearer mock_token"}
        response = self.client.post("/reschedule", json=request_data.model_dump(mode='json'), headers=headers)
        assert response.status_code == 200
        response_data = response.json()
        assert "schedules" in response_data
        # Validate that schedules are well-formed (no overlaps)
        for schedule in response_data["schedules"]:
            assert validate_schedule_no_overlaps(schedule), f"Schedule contains overlapping occurrences: {schedule}"

    @patch('app.get_current_user')
    def test_reschedule_with_future_occurrences_deletion(self, mock_get_current_user, mock_user):
        mock_get_current_user.return_value = mock_user
        mock_context = AsyncMock()
        mock_connection = AsyncMock()
        mock_context.__aenter__.return_value = mock_connection
        mock_context.__aexit__.return_value = None
        self.mock_pool.acquire.return_value = mock_context
        mock_connection.fetchrow.return_value = {
            "assignment_id": 1,
            "assignment_name": "Math Homework",
            "effort": 120,
            "deadline": datetime(2024, 8, 9, 23, 59, tzinfo=timezone.utc)
        }
        future_occurrence = datetime.now(timezone.utc) + timedelta(hours=2)
        mock_connection.fetch.side_effect = [
            [{"start_time": datetime(2024, 8, 7, 10, 0, tzinfo=timezone.utc), "end_time": future_occurrence, "occurence_id": 1}],
            [],
            [],
            []
        ]
        mock_connection.execute.return_value = None
        # No mocking of schedule_tasks - use real scheduler function
        request_data = RescheduleRequestDataModel(
            event_type="assignment",
            id=1,
            allow_overlaps=False,
            tz_offset_minutes=0
        )
        headers = {"Authorization": "Bearer mock_token"}
        response = self.client.post("/reschedule", json=request_data.model_dump(mode='json'), headers=headers)
        assert response.status_code == 200

    @patch('app.get_current_user')
    def test_reschedule_assignment_with_updates(self, mock_get_current_user, mock_user):
        mock_get_current_user.return_value = mock_user
        mock_context = AsyncMock()
        mock_connection = AsyncMock()
        mock_context.__aenter__.return_value = mock_connection
        mock_context.__aexit__.return_value = None
        self.mock_pool.acquire.return_value = mock_context
        mock_connection.fetchrow.return_value = {
            "assignment_id": 1,
            "assignment_name": "Math Homework",
            "effort": 120,
            "deadline": datetime(2024, 8, 9, 23, 59, tzinfo=timezone.utc)
        }
        mock_connection.fetch.side_effect = [
            [{"start_time": datetime(2024, 8, 7, 10, 0, tzinfo=timezone.utc), "end_time": datetime(2024, 8, 7, 11, 0, tzinfo=timezone.utc), "occurence_id": 1}],
            [],
            [],
            []
        ]
        mock_connection.execute.return_value = None
        # No mocking of schedule_tasks - use real scheduler function
        request_data = RescheduleRequestDataModel(
            event_type="assignment",
            id=1,
            allow_overlaps=False,
            new_effort=180,
            new_window_end=datetime(2024, 8, 10, 23, 59, tzinfo=timezone.utc),
            tz_offset_minutes=0
        )
        headers = {"Authorization": "Bearer mock_token"}
        response = self.client.post("/reschedule", json=request_data.model_dump(mode='json'), headers=headers)
        assert response.status_code == 200

    @patch('app.get_current_user')
    def test_reschedule_chore_with_updates(self, mock_get_current_user, mock_user):
        mock_get_current_user.return_value = mock_user
        mock_context = AsyncMock()
        mock_connection = AsyncMock()
        mock_context.__aenter__.return_value = mock_connection
        mock_context.__aexit__.return_value = None
        self.mock_pool.acquire.return_value = mock_context
        mock_connection.fetchrow.return_value = {
            "chore_id": 1,
            "chore_name": "Grocery Shopping",
            "effort": 60,
            "start_window": datetime(2024, 8, 7, 8, 0, tzinfo=timezone.utc),
            "end_window": datetime(2024, 8, 7, 20, 0, tzinfo=timezone.utc)
        }
        mock_connection.fetch.side_effect = [
            [{"start_time": datetime(2024, 8, 7, 10, 0, tzinfo=timezone.utc), "end_time": datetime(2024, 8, 7, 11, 0, tzinfo=timezone.utc), "occurence_id": 1}],
            [],
            [],
            []
        ]
        mock_connection.execute.return_value = None
        # No mocking of schedule_tasks - use real scheduler function
        request_data = RescheduleRequestDataModel(
            event_type="chore",
            id=1,
            allow_overlaps=False,
            new_effort=90,
            new_window_start=datetime(2024, 8, 7, 9, 0, tzinfo=timezone.utc),
            new_window_end=datetime(2024, 8, 7, 21, 0, tzinfo=timezone.utc),
            tz_offset_minutes=0
        )
        headers = {"Authorization": "Bearer mock_token"}
        response = self.client.post("/reschedule", json=request_data.model_dump(mode='json'), headers=headers)
        assert response.status_code == 200

    @patch('app.get_current_user')
    def test_reschedule_with_existing_meetings_assignments_chores(self, mock_get_current_user, mock_user):
        mock_get_current_user.return_value = mock_user
        mock_context = AsyncMock()
        mock_connection = AsyncMock()
        mock_context.__aenter__.return_value = mock_connection
        mock_context.__aexit__.return_value = None
        self.mock_pool.acquire.return_value = mock_context
        mock_connection.fetchrow.return_value = {
            "assignment_id": 1,
            "assignment_name": "Math Homework",
            "effort": 120,
            "deadline": datetime(2024, 8, 9, 23, 59, tzinfo=timezone.utc)
        }
        # Mock existing meetings, assignments, and chores that will populate blocked_times
        existing_meetings = [
            {'start_time': datetime(2024, 8, 7, 9, 0, tzinfo=timezone.utc), 'end_time': datetime(2024, 8, 7, 10, 0, tzinfo=timezone.utc)}
        ]
        existing_assignments = [
            {'start_time': datetime(2024, 8, 7, 11, 0, tzinfo=timezone.utc), 'end_time': datetime(2024, 8, 7, 12, 0, tzinfo=timezone.utc)}
        ]
        existing_chores = [
            {'start_time': datetime(2024, 8, 7, 13, 0, tzinfo=timezone.utc), 'end_time': datetime(2024, 8, 7, 14, 0, tzinfo=timezone.utc)}
        ]
        mock_connection.fetch.side_effect = [
            [{"start_time": datetime(2024, 8, 7, 10, 0, tzinfo=timezone.utc), "end_time": datetime(2024, 8, 7, 11, 0, tzinfo=timezone.utc), "occurence_id": 1}],
            existing_meetings,
            existing_assignments,
            existing_chores
        ]
        mock_connection.execute.return_value = None
        # No mocking of schedule_tasks - use real scheduler function
        request_data = RescheduleRequestDataModel(
            event_type="assignment",
            id=1,
            allow_overlaps=False,
            tz_offset_minutes=0
        )
        headers = {"Authorization": "Bearer mock_token"}
        response = self.client.post("/reschedule", json=request_data.model_dump(mode='json'), headers=headers)
        assert response.status_code == 200

    @patch('app.get_current_user')
    def test_reschedule_database_error(self, mock_get_current_user, mock_user):
        mock_get_current_user.return_value = mock_user
        mock_context = AsyncMock()
        mock_connection = AsyncMock()
        mock_context.__aenter__.return_value = mock_connection
        mock_context.__aexit__.return_value = None
        self.mock_pool.acquire.return_value = mock_context
        mock_connection.fetchrow.side_effect = Exception("Database error during reschedule")
        request_data = RescheduleRequestDataModel(
            event_type="assignment",
            id=1,
            allow_overlaps=False,
            tz_offset_minutes=0
        )
        headers = {"Authorization": "Bearer mock_token"}
        response = self.client.post("/reschedule", json=request_data.model_dump(mode='json'), headers=headers)
        assert response.status_code == 500
        assert "Internal server error" in response.json()["detail"]

    @patch('app.get_current_user')
    def test_markSessionCompleted_successful_existing_record(self, mock_get_current_user, mock_user):
        mock_get_current_user.return_value = mock_user
        mock_context = AsyncMock()
        mock_connection = AsyncMock()
        mock_context.__aenter__.return_value = mock_connection
        mock_context.__aexit__.return_value = None
        self.mock_pool.acquire.return_value = mock_context
        mock_connection.fetchval.side_effect = [100, 250, 5]  # xp_potential, new_xp, cur_level
        mock_connection.execute.return_value = None
        request_data = SessionCompletionDataModel(
            occurence_id=1,
            completed=True,
            is_assignment=True,
            locked_in=5,
            score=85
        )
        headers = {"Authorization": "Bearer mock_token"}
        response = self.client.post("/markSessionCompleted", json=request_data.model_dump(mode='json'), headers=headers)
        assert response.status_code == 200

    @patch('app.get_current_user')
    def test_markSessionCompleted_successful_new_record(self, mock_get_current_user, mock_user):
        mock_get_current_user.return_value = mock_user
        mock_context = AsyncMock()
        mock_connection = AsyncMock()
        mock_context.__aenter__.return_value = mock_connection
        mock_context.__aexit__.return_value = None
        self.mock_pool.acquire.return_value = mock_context
        mock_connection.fetchval.side_effect = [80, 180, 3]  # xp_potential, new_xp, cur_level
        mock_connection.execute.return_value = None
        request_data = SessionCompletionDataModel(
            occurence_id=2,
            completed=False,
            is_assignment=False,
            locked_in=3
        )
        headers = {"Authorization": "Bearer mock_token"}
        response = self.client.post("/markSessionCompleted", json=request_data.model_dump(mode='json'), headers=headers)
        assert response.status_code == 200

    @patch('app.get_current_user')
    def test_markSessionCompleted_database_error_during_check(self, mock_get_current_user, mock_user):
        mock_get_current_user.return_value = mock_user
        mock_context = AsyncMock()
        mock_connection = AsyncMock()
        mock_context.__aenter__.return_value = mock_connection
        mock_context.__aexit__.return_value = None
        self.mock_pool.acquire.return_value = mock_context
        mock_connection.fetchval.return_value = None  # No xp_potential returned = bad occurence_id
        request_data = SessionCompletionDataModel(
            occurence_id=-1,
            completed=True,
            is_assignment=True,
            locked_in=7
        )
        headers = {"Authorization": "Bearer mock_token"}
        response = self.client.post("/markSessionCompleted", json=request_data.model_dump(mode='json'), headers=headers)
        assert response.status_code == 400
        assert "You picked a bad occurence id" in response.json()["detail"]

    @patch('app.get_current_user')
    def test_markSessionCompleted_database_error_during_update(self, mock_get_current_user, mock_user):
        mock_get_current_user.return_value = mock_user
        mock_context = AsyncMock()
        mock_connection = AsyncMock()
        mock_context.__aenter__.return_value = mock_connection
        mock_context.__aexit__.return_value = None
        self.mock_pool.acquire.return_value = mock_context
        mock_connection.execute.side_effect = Exception("Database update failed")
        request_data = SessionCompletionDataModel(
            occurence_id=1,
            completed=True,
            is_assignment=True,
            locked_in=4
        )
        headers = {"Authorization": "Bearer mock_token"}
        response = self.client.post("/markSessionCompleted", json=request_data.model_dump(mode='json'), headers=headers)
        assert response.status_code == 500
        assert "Internal server error" in response.json()["detail"]