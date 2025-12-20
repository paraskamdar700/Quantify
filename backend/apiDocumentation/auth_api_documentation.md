
# Auth Management API Documentation

**Base URL:** `/api/v1/auth`

## 1. Register Firm & Owner

Registers a new firm with owner account.

**Endpoint:** `POST /register`  
**Content-Type:** `multipart/form-data`

### Request Body

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `firmdata[firm_name]` | string | Yes | Name of the firm |
| `firmdata[gst_no]` | string | Yes | GST Number |
| `firmdata[firm_city]` | string | No | City of the firm |
| `firmdata[firm_street]` | string | No | Street address |
| `userdata[fullname]` | string | Yes | Owner's full name |
| `userdata[email]` | string | Yes | Owner's email |
| `userdata[password_hash]` | string | Yes | Owner's password |
| `userdata[contact_no]` | string | Yes | Owner's contact number |
| `userdata[bio]` | string | No | Owner's bio |
| `avatar` | file | No | Profile picture (max 1 file) |

### Success Response (201 Created)

```json
{
    "statusCode": 201,
    "data": {
        "firm": { "id": 101, "firm_name": "Tech Solutions", "gst_no": "22AAAAA0000A1Z5", "firm_city": "Mumbai", "firm_street": "Main Street" },
        "user": { "id": 50, "fullname": "John Doe", "contact_no": "9876543210", "email": "john@example.com", "role": "OWNER", "avatar": "https://cloudinary.com/...", "bio": "CEO" }
    },
    "message": "Firm and Owner registered successfully",
    "success": true
}
```

## 2. Login User

Authenticates user and sets HTTP-only cookies.

**Endpoint:** `POST /login`  
**Content-Type:** `application/json`

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | User's email |
| `password` | string | Yes | User's password |

### Success Response (200 OK)

Sets `_accessToken_` and `_refreshToken_` cookies.

```json
{
    "success": true,
    "message": "User logged in successfully",
    "data": {
        "user": { "id": 50, "email": "john@example.com", "fullname": "John Doe", "role": "OWNER", "bio": "CEO", "avatar": "https://cloudinary.com/..." },
        "firm": { "firm_id": 101, "firm_name": "Tech Solutions", "gst_no": "22AAAAA0000A1Z5", "firm_city": "Mumbai", "firm_street": "Main Street" }
    }
}
```

## 3. Logout User

Logs out user by clearing authentication cookies.

**Endpoint:** `POST /logout`  
**Authentication:** Required (JWT)

### Success Response (200 OK)

```json
{
    "statusCode": 200,
    "data": null,
    "message": "User logged out successfully",
    "success": true
}
```

## 4. Refresh Token

Refreshes access token using refresh token cookie.

**Endpoint:** `POST /refresh-token`  
**Cookie Required:** `refreshToken`

### Success Response (200 OK)

Sets new `_accessToken_` cookie.

```json
{
    "success": true,
    "message": "Access token refreshed successfully",
    "data": { "user": { "id": 50, "email": "john@example.com", "fullname": "John Doe", "role": "OWNER", "bio": "CEO", "avatar": "https://cloudinary.com/..." } }
}
```

## 5. Reset Password

Changes logged-in user's password.

**Endpoint:** `PATCH /reset-password`  
**Authentication:** Required (JWT)

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `currentPassword` | string | Yes | Current password |
| `newPassword` | string | Yes | New password |

### Success Response (200 OK)

```json
{
    "statusCode": 200,
    "data": null,
    "message": "Password reset successfully",
    "success": true
}
```

## 6. Update Avatar

Updates user's profile picture.

**Endpoint:** `PATCH /update-avatar`  
**Authentication:** Required (JWT)  
**Content-Type:** `multipart/form-data`

### Request Body

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `avatar` | file | Yes | New image file (max 1) |

### Success Response (200 OK)

```json
{
    "statusCode": 200,
    "data": { "avatar": { "id": 50, "avatar": "https://cloudinary.com/new-image-url.jpg" } },
    "message": "User avatar updated successfully",
    "success": true
}
```

## 7. Update User Details

Updates profile information.

**Endpoint:** `PATCH /update-user-details`  
**Authentication:** Required (JWT)

### Request Body (at least one required)

| Parameter | Type | Description |
|-----------|------|-------------|
| `fullname` | string | Updated full name |
| `email` | string | Updated email |
| `contact_no` | string | Updated contact number |
| `bio` | string | Updated bio |

### Success Response (200 OK)

```json
{
    "statusCode": 200,
    "data": { "id": 50, "fullname": "John Updated", "email": "john@example.com", "contact_no": "9876543210", "bio": "Updated Bio", "role": "OWNER", "avatar": "https://cloudinary.com/..." },
    "message": "User details updated successfully",
    "success": true
}
```

## 8. Get Current User Details

Retrieves logged-in user and firm details.

**Endpoint:** `GET /getuser-details`  
**Authentication:** Required (JWT)

### Success Response (200 OK)

```json
{
    "statusCode": 200,
    "data": {
        "user": { "id": 50, "email": "john@example.com", "fullname": "John Doe", "role": "OWNER", "bio": "CEO", "avatar": "https://cloudinary.com/..." },
        "firm": { "id": 101, "firm_name": "Tech Solutions", "gst_no": "22AAAAA0000A1Z5", "firm_city": "Mumbai", "firm_street": "Main Street", "created_at": "..." }
    },
    "message": "User details fetched successfully",
    "success": true
}
```
