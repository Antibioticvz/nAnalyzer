"""
Test POST /api/v1/users/login endpoint
"""
import pytest


@pytest.mark.asyncio
async def test_login_user_success(client):
    """Test successful user login"""
    # First register a user
    register_response = await client.post(
        "/api/v1/users/register",
        json={
            "name": "Alice Johnson",
            "email": "alice@company.com",
            "role": "seller"
        }
    )
    assert register_response.status_code == 201

    # Now login with the same email
    response = await client.post(
        "/api/v1/users/login",
        json={
            "email": "alice@company.com"
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert "user_id" in data
    assert data["name"] == "Alice Johnson"
    assert data["email"] == "alice@company.com"
    assert data["role"] == "seller"
    assert data["voice_trained"] is False
    assert "created_at" in data
    assert "updated_at" in data


@pytest.mark.asyncio
async def test_login_user_not_found(client):
    """Test login with non-existent email"""
    response = await client.post(
        "/api/v1/users/login",
        json={
            "email": "nonexistent@example.com"
        }
    )

    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "User not found" in data["detail"]["message"]


@pytest.mark.asyncio
async def test_login_user_invalid_request(client):
    """Test login with invalid request data"""
    response = await client.post(
        "/api/v1/users/login",
        json={
            "invalid_field": "value"
        }
    )

    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_login_user_missing_email(client):
    """Test login with missing email field"""
    response = await client.post(
        "/api/v1/users/login",
        json={}
    )

    assert response.status_code == 422  # Validation error