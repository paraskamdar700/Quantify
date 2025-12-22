# Firm Management API Documentation

**Base URL:** `/api/v1/firm`  
**Authentication:** JWT Bearer Token (required for all endpoints)  
**Authorization:** OWNER role only

---

## 1. Get My Firm Details

Retrieves the details of the firm associated with the currently authenticated Owner.

**Endpoint:** `GET /my-firm`

### Request

| Header | Value | Required |
|--------|-------|----------|
| Authorization | Bearer `{token}` | Yes |

### Response

**200 OK**
```json
{
    "statusCode": 200,
    "data": {
        "id": 10,
        "firm_name": "Tech Solutions",
        "gst_no": "22AAAAA0000A1Z5",
        "firm_city": "Mumbai",
        "firm_street": "Andheri East"
    },
    "message": "Firm details retrieved successfully",
    "success": true
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 404 | Firm not found |
| 500 | Server error |

---

## 2. Update Firm Details

Updates firm details. Supports partial updates.

**Endpoint:** `PATCH /update-firm`

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| firm_name | string | No | Firm name |
| gst_no | string | No | GST number (must be unique) |
| firm_city | string | No | City |
| firm_street | string | No | Street address |

### Response

**200 OK**
```json
{
    "statusCode": 200,
    "data": {
        "id": 10,
        "firm_name": "Tech Solutions Pvt Ltd",
        "gst_no": "22AAAAA0000A1Z5",
        "firm_city": "Pune",
        "firm_street": "Andheri East"
    },
    "message": "Firm details updated successfully",
    "success": true
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 409 | GST number already in use |
| 404 | Firm not found |
| 500 | Database update failed |

---

## 3. Delete Firm

Permanently deletes the firm and cascades deletion to associated users, orders, and data.

**Endpoint:** `DELETE /delete-firm`

### Response

**200 OK**
```json
{
    "statusCode": 200,
    "data": null,
    "message": "Firm deleted successfully",
    "success": true
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 404 | Firm not found |
| 500 | Deletion failed |
