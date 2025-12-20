# Order Management API Documentation

**Base URL:** `/api/v1/orders`  
**Authentication:** All endpoints require a valid JWT Bearer Token.

---

## 1. Create Order

Creates a new order with optional payment terms and delivery instructions.

**Endpoint:** `POST /`  
**Allowed Roles:** OWNER, ADMIN

### Request Headers
| Key | Value | Description |
|---|---|---|
| Authorization | Bearer `<token>` | Required JWT Token |
| Content-Type | application/json | |

### Request Body
| Parameter | Type | Required | Description |
|---|---|---|---|
| customer_id | integer | Yes | The ID of the customer placing the order |
| order_items | array | Yes | Array of items to be ordered |
| order_date | string | No | Order date (YYYY-MM-DD). Defaults to current date |
| invoice_no | integer | No | Custom invoice number (must exceed latest existing) |
| payment_terms | string | No | Payment terms (e.g., "Net 30", "50% Advance") |
| delivery_instructions | string | No | Delivery instructions (e.g., "Drop at rear gate") |

### order_items Structure
```json
{
    "stock_id": 1,
    "quantity": 1,
    "selling_price": 500.00
}
```

### Example Request
```json
{
    "customer_id": 1,
    "order_date": "2025-12-18",
    "payment_terms": "50% Advance, Balance on Delivery",
    "delivery_instructions": "Deliver to the back warehouse gate before 5 PM.",
    "order_items": [
        {"stock_id": 1, "quantity": 1, "selling_price": 500.00},
        {"stock_id": 2, "quantity": 2, "selling_price": 1200.50}
    ]
}
```

### Success Response (201 Created)
```json
{
    "statusCode": 201,
    "data": {
        "id": 501,
        "customer_id": 105,
        "firm_id": 10,
        "created_by": 5,
        "order_date": "2023-12-17T00:00:00.000Z",
        "invoice_no": "INV-2023-0150",
        "order_status": "PENDING",
        "payment_status": "UNPAID",
        "delivery_status": "PENDING",
        "total_amount": 1000.00,
        "payment_terms": "Net 30 Days",
        "delivery_instructions": "Handle with care"
    },
    "message": "Order created successfully",
    "success": true
}
```

---

## 2. List Orders

Retrieves a paginated list of orders.

**Endpoint:** `GET /`  
**Allowed Roles:** Authenticated Users

### Query Parameters
| Parameter | Type | Default | Description |
|---|---|---|---|
| page | integer | 1 | Page number |
| limit | integer | 10 | Items per page |
| search | string | - | Search by invoice_no or customer name |
| order_status | string | - | Filter by status (PENDING, COMPLETED, CANCELLED) |
| startDate | string | - | Filter orders created on or after this date |
| endDate | string | - | Filter orders created on or before this date |

### Success Response (200 OK)
```json
{
    "statusCode": 200,
    "data": {
        "orders": [
            {
                "id": 501,
                "customer_id": 105,
                "firm_id": 10,
                "invoice_no": "INV-2023-0150",
                "total_amount": 1000.00,
                "order_status": "PENDING",
                "customer_name": "John Doe",
                "payment_terms": "Net 30 Days",
                "delivery_instructions": "Handle with care",
                "created_at": "2023-12-17T10:00:00.000Z"
            }
        ],
        "pagination": {
            "totalItems": 1,
            "totalPages": 1,
            "currentPage": 1,
            "itemsPerPage": 10
        }
    },
    "message": "Orders retrieved successfully",
    "success": true
}
```

---

## 3. Get Order Details

Retrieves full details of a specific order.

**Endpoint:** `GET /:id`  
**Allowed Roles:** Authenticated Users

### Success Response (200 OK)
```json
{
    "statusCode": 200,
    "data": {
        "id": 501,
        "invoice_no": 150,
        "payment_terms": "Net 30 Days",
        "delivery_instructions": "Handle with care",
        "items": [
            {
                "stock_id": 10,
                "stock_name": "Product A",
                "quantity": 5,
                "selling_price": 200
            }
        ]
    },
    "message": "Order retrieved successfully",
    "success": true
}
```

---

## 4. Update Order

Updates basic order details.

**Endpoint:** `PATCH /:id`  
**Allowed Roles:** OWNER, ADMIN

> **Note:** Currently supports `order_date` and `invoice_no` only. Payment terms and delivery instructions cannot be updated via this endpoint.

### Request Body
| Parameter | Type | Description |
|---|---|---|
| order_date | string | New order date |
| invoice_no | integer | New invoice number |

---

## 5. Cancel Order

Cancels an order and restocks items.

**Endpoint:** `PATCH /:id/cancel`  
**Allowed Roles:** OWNER, ADMIN

### Success Response (200 OK)
```json
{
    "statusCode": 200,
    "data": {
        "id": 501,
        "order_status": "CANCELLED"
    },
    "message": "Order cancelled successfully",
    "success": true
}
```
