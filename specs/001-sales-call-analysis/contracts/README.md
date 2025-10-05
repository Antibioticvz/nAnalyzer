# API Contracts

## Overview

This directory contains OpenAPI 3.0 specifications for all nAnalyzer API endpoints.

## Files

- [users.yaml](./users.yaml) - User registration, voice training, settings
- [analysis.yaml](./analysis.yaml) - Streaming upload, analysis endpoints
- [calls.yaml](./calls.yaml) - Call management, feedback
- [websocket.md](./websocket.md) - WebSocket message specifications

## Base URL

```
Development: http://localhost:8000/api/v1
Production: https://your-domain.com/api/v1
```

## Authentication

**Development**: Simple user ID header
```http
X-User-ID: user_abc123
```

**Production** (optional): JWT Bearer token
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Common Response Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET/POST/PUT |
| 201 | Created | Resource created (POST /users/register) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input, validation failed |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource (email exists) |
| 413 | Payload Too Large | File exceeds max size |
| 422 | Unprocessable Entity | Valid JSON but business logic failed |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | Models not loaded, maintenance |

## Common Headers

### Request Headers
```http
Content-Type: application/json
X-User-ID: user_abc123
Accept: application/json
```

### Response Headers
```http
Content-Type: application/json
X-Request-ID: req_xyz789
X-Processing-Time-Ms: 42
```

## Error Response Format

All errors return consistent JSON structure:

```json
{
  "error": "ErrorType",
  "message": "Human-readable error message",
  "code": "ERROR_CODE_CONSTANT",
  "details": {
    "field": "email",
    "reason": "already_exists"
  },
  "request_id": "req_xyz789"
}
```

## Rate Limiting

**Development**: No limits

**Production**: 
- 100 requests/minute per user
- 10 concurrent uploads per user

Headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704452400
```

## Pagination

List endpoints support cursor-based pagination:

**Request**:
```http
GET /api/v1/calls?limit=50&cursor=call_xyz789
```

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "next_cursor": "call_abc123",
    "has_more": true,
    "total": 250
  }
}
```

## Contract Testing

Each contract file includes:
- Request schemas
- Response schemas
- Example requests/responses
- Test scenarios

Run contract tests:
```bash
pytest tests/test_contracts/ -v
```

## Versioning

API versioning via URL path: `/api/v1/`, `/api/v2/`

Breaking changes require new version. Backwards-compatible changes can be added to existing version.

## OpenAPI Validation

Validate contracts:
```bash
openapi-spec-validator contracts/*.yaml
```

Generate client SDK:
```bash
openapi-generator-cli generate -i contracts/users.yaml -g typescript-axios -o frontend/src/generated
```

---

**Contract Status**: ✅ Ready for implementation  
**Last Updated**: 2025-01-05
