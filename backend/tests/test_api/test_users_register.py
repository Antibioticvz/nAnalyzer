"""
Test POST /api/v1/users/register endpoint
Contract test - must fail until endpoint is implemented
"""
import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_register_user_success():
    """Test successful user registration"""
    async with AsyncClient(app=app, base_url="http://test") as client:
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
async def test_register_user_minimal_fields():
    """Test registration with only required fields"""
    async with AsyncClient(app=app, base_url="http://test") as client:
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
async def test_register_user_invalid_email():
    """Test registration with invalid email format"""
    async with AsyncClient(app=app, base_url="http://test") as client:
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
async def test_register_user_missing_required_fields():
    """Test registration with missing required fields"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/users/register",
            json={
                "name": "Only Name"
            }
        )
        
        assert response.status_code == 400


@pytest.mark.asyncio
async def test_register_user_duplicate_email():
    """Test registration with duplicate email"""
    async with AsyncClient(app=app, base_url="http://test") as client:
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
async def test_register_user_with_metadata():
    """Test registration with optional metadata"""
    async with AsyncClient(app=app, base_url="http://test") as client:
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
