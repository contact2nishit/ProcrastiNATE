import pytest
import sys
import os
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import status
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))
from app import app
from data_models import RegistrationDataModel, UserInDB

class TestEndpoints:
    """Test suite for most endpoints"""
    
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