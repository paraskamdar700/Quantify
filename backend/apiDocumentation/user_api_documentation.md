# User Management API Documentation

**Base URL:** `/api/v1/users`  
**Authentication:** All endpoints require a valid JWT Bearer Token

---

## 1. Register Staff or Admin

Allows an Owner or Admin to register a new user (Staff or Admin) under their firm.

**Endpoint:** `POST /register-staff-admin`  
**Allowed Roles:** OWNER, ADMIN

### Request

**Headers:**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<token>` |
| Content-Type | application/json |

**Body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| fullname | string | Yes | Full name of the new user |
| email | string | Yes | Email address (must be unique) |
| password | string | Yes | Initial password for the account |
| contact_no | string | Yes | Contact number |
| role | string | Yes | STAFF or ADMIN |

### Response

**201 Created:**
```json
{
    "statusCode": 201,
    "data": {
        "id": 55,
        "fullname": "Alice Smith",
        "contact_no": "9876543210",
        "email": "alice@example.com",
        "role": "STAFF",
        "firm_id": 101
    },
    "message": "User registered successfully",
    "success": true
}
```

**Error Responses:**
| Status | Error |
|--------|-------|
| 400 | All fields required OR Invalid role specified |
| 409 | Email already in use |
| 401 | Firm ID not found in token |

---

## 2. Update Staff Role

Allows an Owner to change a user's role.

**Endpoint:** `PATCH /update-staff-role`  
**Allowed Roles:** OWNER

### Request

**Body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | Yes | Email of user to update |
| newRole | string | Yes | STAFF or ADMIN |

### Response

**200 OK:**
```json
{
    "statusCode": 200,
    "data": {
        "email": "alice@example.com",
        "newRole": "ADMIN"
    },
    "message": "User role updated successfully",
    "success": true
}
```

**Error Responses:**
| Status | Error |
|--------|-------|
| 400 | User already has that role |
| 403 | Cannot change role of user from another firm OR cannot change OWNER role |
| 404 | User not found |

---

## 3. Deactivate User

Forcibly changes a user's password to prevent login with old credentials.

**Endpoint:** `PATCH /deactivate-user`  
**Allowed Roles:** OWNER

### Request

**Body:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | Yes | Email of user to deactivate |
| newPassword | string | Yes | New password |

### Response

**200 OK:**
```json
{
    "statusCode": 200,
    "data": { "email": "alice@example.com" },
    "message": "Password changed successfully",
    "success": true
}
```

**Error Responses:**
| Status | Error |
|--------|-------|
| 403 | Cannot deactivate OWNER or user from another firm |
| 404 | User not found |

---

## 4. List Firm Users

Retrieves all users in the authenticated user's firm.

**Endpoint:** `GET /list-firm-users`  
**Allowed Roles:** OWNER, ADMIN

### Response

**200 OK:**
```json
{
    "statusCode": 200,
    "data": [
        {
            "id": 50,
            "fullname": "John Owner",
            "email": "owner@example.com",
            "role": "OWNER",
            "firm_id": 101,
            "avatar": null,
            "bio": null
        }
    ],
    "message": "Firm users retrieved successfully",
    "success": true
}
```

---

## 5. Get My Profile

Retrieves the current user's profile details.

**Endpoint:** `GET /my-profile`  
**Allowed Roles:** All authenticated users

### Response

**200 OK:**
```json
{
    "statusCode": 200,
    "data": {
        "id": 55,
        "fullname": "Alice Smith",
        "email": "alice@example.com",
        "contact_no": "9876543210",
        "role": "STAFF",
        "firm_id": 101,
        "avatar": null,
        "bio": null
    },
    "message": "User profile retrieved successfully",
    "success": true
}
```
