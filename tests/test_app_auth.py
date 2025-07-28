import pytest
import sys
import os
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import status
import asyncio

# Add src to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))

from app import app
from data_models import RegistrationDataModel, UserInDB

class TestRegisterEndpoint:
    """Test suite for the /register endpoint"""
    
    def setup_method(self):
        """Setup test client and mocks before each test"""
        self.client = TestClient(app)
        
        # Create mock connection
        self.mock_conn = AsyncMock()
        
        # Create a proper async context manager mock
        self.mock_acquire = MagicMock()
        self.mock_acquire.__aenter__ = AsyncMock(return_value=self.mock_conn)
        self.mock_acquire.__aexit__ = AsyncMock(return_value=None)
        
        # Create mock pool
        self.mock_pool = MagicMock()
        self.mock_pool.acquire.return_value = self.mock_acquire
        
        # Set the mock pool directly on app.state
        app.state.pool = self.mock_pool
    
    def teardown_method(self):
        """Clean up after each test"""
        # Clean up the pool
        if hasattr(app.state, 'pool'):
            delattr(app.state, 'pool')
    
    @patch('app.get_password_hash')
    def test_register_success(self, mock_hash):
        """Test successful user registration"""
        # Setup mocks
        mock_hash.return_value = "hashed_password_123"
        self.mock_conn.fetchrow.return_value = None  # No existing user
        self.mock_conn.fetchval.return_value = 123  # New user ID
        self.mock_conn.execute.return_value = None  # Achievement insertion
        
        # Test data
        registration_data = {
            "username": "testuser",
            "email": "test@example.com", 
            "pwd": "password123"
        }
        
        # Make request
        response = self.client.post("/register", json=registration_data)

        # Assertions
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["message"] == "Account created Successfully"
        
        # Verify database calls
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
        
        # The endpoint checks for empty strings and returns 200 with error message
        assert response.status_code == status.HTTP_200_OK
        assert "Username, email, or password missing" in response.json()["error"]
    
    @patch('app.get_password_hash')
    def test_register_duplicate_username(self, mock_hash):
        """Test registration with existing username"""
        # Setup mocks - return existing user
        self.mock_conn.fetchrow.return_value = {"user_id": 456}
        
        registration_data = {
            "username": "existinguser",
            "email": "new@example.com",
            "pwd": "password123"
        }
        
        response = self.client.post("/register", json=registration_data)
        
        # The endpoint returns 200 with error message, not 409
        assert response.status_code == status.HTTP_200_OK
        assert "already registered" in response.json()["error"]
        
        # Should not call password hashing or user creation
        mock_hash.assert_not_called()
        self.mock_conn.fetchval.assert_not_called()
    
    @patch('app.get_password_hash')
    def test_register_duplicate_email(self, mock_hash):
        """Test registration with existing email"""
        # Setup mocks - return existing user
        self.mock_conn.fetchrow.return_value = {"user_id": 789}
        
        registration_data = {
            "username": "newuser",
            "email": "existing@example.com",
            "pwd": "password123"
        }
        
        response = self.client.post("/register", json=registration_data)
        
        # The endpoint returns 200 with error message, not 409
        assert response.status_code == status.HTTP_200_OK
        assert "already registered" in response.json()["error"]
    
    @patch('app.get_password_hash')
    def test_register_database_error_on_check(self, mock_hash):
        """Test registration when database check fails"""
        # Setup mocks - database error on user check
        self.mock_conn.fetchrow.side_effect = Exception("Database connection failed")
        
        registration_data = {
            "username": "testuser",
            "email": "test@example.com",
            "pwd": "password123"
        }
        
        response = self.client.post("/register", json=registration_data)
        
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Something went wrong on the backend" in response.json()["detail"]
    
    @patch('app.get_password_hash')
    def test_register_database_error_on_insert(self, mock_hash):
        """Test registration when user insertion fails"""
        # Setup mocks
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
        # Setup mocks
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


class TestLoginEndpoint:
    """Test suite for the /login endpoint"""
    
    def setup_method(self):
        """Set up test client and common mocks"""
        self.client = TestClient(app)
        
        # Create mock connection
        self.mock_conn = AsyncMock()
        
        # Create a proper async context manager mock
        self.mock_acquire = MagicMock()
        self.mock_acquire.__aenter__ = AsyncMock(return_value=self.mock_conn)
        self.mock_acquire.__aexit__ = AsyncMock(return_value=None)
        
        # Create mock pool
        self.mock_pool = MagicMock()
        self.mock_pool.acquire.return_value = self.mock_acquire
        
        # Set the mock pool directly on app.state
        app.state.pool = self.mock_pool
    
    def teardown_method(self):
        """Clean up after each test"""
        # Clean up the pool
        if hasattr(app.state, 'pool'):
            delattr(app.state, 'pool')
    
    @patch('app.authenticate_user')
    @patch('app.create_access_token')
    def test_login_success(self, mock_create_token, mock_auth):
        """Test successful user login"""
        # Setup mocks
        mock_user = UserInDB(
            username="testuser",
            user_id=123,
            email="test@example.com",
            hashed_password="hashed_password"
        )
        mock_auth.return_value = mock_user
        mock_create_token.return_value = "jwt_token_123"
        
        # Test data (using form data for OAuth2PasswordRequestForm)
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
        
        # Verify function calls
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
        # Setup mocks - authentication fails
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
        
        # FastAPI will still process empty strings, so this should reach our auth logic
        # The authenticate_user function should return False for empty credentials
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_422_UNPROCESSABLE_ENTITY]
    
    @patch('app.authenticate_user')
    def test_login_database_error(self, mock_auth):
        """Test login when authentication database call fails"""
        # Setup mocks - database error during authentication
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
        assert "Something went wrong on the backend" in response.json()["detail"]
    
    @patch('app.authenticate_user')
    @patch('app.create_access_token')
    def test_login_token_creation_error(self, mock_create_token, mock_auth):
        """Test login when JWT token creation fails"""
        # Setup mocks
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
        assert response.json()["detail"] == "Incorrect username or password"


# Integration-style tests that test both endpoints together
class TestAuthenticationIntegration:
    """Integration tests for register -> login flow"""
    
    def setup_method(self):
        """Set up test client and common mocks"""
        self.client = TestClient(app)
        
        # Create mock connection
        self.mock_conn = AsyncMock()
        
        # Create a proper async context manager mock
        self.mock_acquire = MagicMock()
        self.mock_acquire.__aenter__ = AsyncMock(return_value=self.mock_conn)
        self.mock_acquire.__aexit__ = AsyncMock(return_value=None)
        
        # Create mock pool
        self.mock_pool = MagicMock()
        self.mock_pool.acquire.return_value = self.mock_acquire
        
        # Set the mock pool directly on app.state
        app.state.pool = self.mock_pool
    
    def teardown_method(self):
        """Clean up after each test"""
        # Clean up the pool
        if hasattr(app.state, 'pool'):
            delattr(app.state, 'pool')
    
    @patch('app.get_password_hash')
    @patch('app.authenticate_user')
    @patch('app.create_access_token')
    def test_register_then_login_flow(self, mock_create_token, mock_auth, mock_hash):
        """Test complete register -> login flow"""
        # Setup registration mocks
        mock_hash.return_value = "hashed_password_123"
        self.mock_conn.fetchrow.return_value = None
        self.mock_conn.fetchval.return_value = 123
        self.mock_conn.execute.return_value = None
        
        # Register user
        registration_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "pwd": "password123"
        }
        register_response = self.client.post("/register", json=registration_data)
        assert register_response.status_code == status.HTTP_200_OK
        
        # Setup login mocks
        mock_user = UserInDB(
            username="newuser",
            user_id=123,
            email="newuser@example.com",
            hashed_password="hashed_password_123"
        )
        mock_auth.return_value = mock_user
        mock_create_token.return_value = "jwt_token_for_newuser"
        
        # Login with same credentials
        login_data = {
            "username": "newuser",
            "password": "password123"
        }
        login_response = self.client.post(
            "/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert login_response.status_code == status.HTTP_200_OK
        assert login_response.json()["access_token"] == "jwt_token_for_newuser"
        
        # Verify that the same password was hashed during registration and used for auth
        mock_hash.assert_called_with("password123")
        mock_auth.assert_called_with("newuser", "password123", self.mock_pool)
