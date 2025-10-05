"""
Test POST /api/v1/users/register endpoint
Contract test - must fail until endpoint is implemented
"""
import pytest


@pytest.mark.asyncio
async def test_register_user_success(client):
    """Test successful user registration"""
    response = await client.post(
    "/api/v1/users/register",
    json={
        "name": "Alice Johnson",
        "email": "alice@company.com",
        "role": "seller"
            }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert "user_id" in data
    assert data["name"] == "Alice Johnson"
    assert data["email"] == "alice@company.com"
    assert data["role"] == "seller"
    assert data["voice_trained"] is False
    assert "created_at" in data


@pytest.mark.asyncio
async def test_register_user_minimal_fields(client):
    """Test registration with only required fields"""
    response = await client.post(
    "/api/v1/users/register",
    json={
        "name": "Bob Smith",
        "email": "bob@example.com"
            }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["role"] == "seller"  # Default role


@pytest.mark.asyncio
async def test_register_user_invalid_email(client):
    """Test registration with invalid email format"""
    response = await client.post(
    "/api/v1/users/register",
    json={
        "name": "Invalid User",
        "email": "not-an-email"
            }
    )
    
    assert response.status_code == 400
    data = response.json()
    assert "error" in data
    assert data["error"] == "ValidationError"


@pytest.mark.asyncio
async def test_register_user_missing_required_fields(client):
    """Test registration with missing required fields"""
    response = await client.post(
    "/api/v1/users/register",
    json={
        "name": "Only Name"
            }
    )
    
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_register_user_duplicate_email(client):
    """Test registration with duplicate email"""
    # First registration
    await client.post(
    "/api/v1/users/register",
    json={
        "name": "First User",
        "email": "duplicate@test.com"
            }
    )
    
    # Duplicate registration
    response = await client.post(
    "/api/v1/users/register",
    json={
        "name": "Second User",
        "email": "duplicate@test.com"
            }
    )
    
    assert response.status_code == 409
    data = response.json()
    assert data["error"] == "ConflictError"
    assert "already exists" in data["message"].lower()


@pytest.mark.asyncio
async def test_register_user_with_metadata(client):
    """Test registration with optional metadata"""
    response = await client.post(
    "/api/v1/users/register",
    json={
        "name": "Charlie Brown",
        "email": "charlie@company.com",
        "metadata": {
                    "company": "ACME Corp",
                    "department": "Sales"
        }
            }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Charlie Brown"
