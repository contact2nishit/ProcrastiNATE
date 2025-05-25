import pytest
from fastapi.testclient import TestClient
from app import app

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def mock_db(mocker):
    mock_conn = mocker.AsyncMock()
    mocker.patch("app.app.state.pool.acquire", return_value=mock_conn)
    return mock_conn

def test_register_success(mocker, client):
    # Mock asyncpg connection and methods
    mock_conn = mocker.AsyncMock()
    mocker.patch("app.app.state.pool.acquire", return_value=mock_conn)
    mock_conn.fetchrow.return_value = None
    mock_conn.execute.return_value = None

    response = client.post("/register", json={"username": "test", "email": "test@test.com", "pwd": "pw"})
    assert response.status_code == 201
    assert "Account created successfully" in response.json()["message"]

def test_register_duplicate_user(client, mock_db):
    mock_db.fetchrow.return_value = (1,)  # Simulate user exists
    response = client.post("/register", json={"username": "test", "email": "test@test.com", "pwd": "pw"})
    assert response.status_code == 409
