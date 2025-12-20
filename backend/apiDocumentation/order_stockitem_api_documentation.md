
# Order Items Management API Documentation

**Base URL:** `/api/v1/orders/items`  
**Authentication:** All endpoints require a valid JWT Bearer Token

---

## 1. Add Item to Order

Adds a new product (stock item) to an existing order. Automatically deducts quantity from main stock and recalculates order total.

**Endpoint:** `/`  
**Method:** `POST`  
**Allowed Roles:** OWNER, ADMIN

### Request

**Headers:**
| Key | Value | Description |
|---|---|---|
| Authorization | Bearer `<token>` | Required JWT Token |
| Content-Type | application/json | |

**Body:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| order_id | integer | Yes | ID of the existing order |
| stock_id | integer | Yes | ID of the product/stock item |
| quantity | integer | Yes | Quantity to add |
| selling_price | number | Yes | Selling price per unit |

### Response

**201 Created**
```json
{
    "statusCode": 201,
    "data": {
        "id": 501,
        "customer_id": 105,
        "firm_id": 10,
        "total_amount": 1800.00,
        "items": [
            {
                "id": 15,
                "stock_name": "Product A",
                "quantity": 2,
                "selling_price": 100,
                "subtotal": 200
            },
            {
                "id": 16,
                "stock_name": "Product B",
                "quantity": 1,
                "selling_price": 500,
                "subtotal": 500
            }
        ]
    },
    "message": "Item added to order successfully",
    "success": true
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields
- `404 Not Found` - Parent order not found
- `500 Internal Server Error` - Insufficient stock

---

## 2. Get Order Items

Retrieves all items associated with a specific order.

**Endpoint:** `/:order_id`  
**Method:** `GET`  
**Allowed Roles:** Authenticated Users (Owner, Admin, Staff)

### Request

**URL Parameters:**
| Parameter | Type | Description |
|---|---|---|
| order_id | integer | ID of the order |

### Response

**200 OK**
```json
{
    "statusCode": 200,
    "data": [
        {
            "id": 45,
            "order_id": 501,
            "stock_id": 12,
            "quantity": 5,
            "selling_price": 100.00,
            "subtotal": 500.00,
            "stock_name": "Wireless Mouse",
            "unit": "pcs"
        }
    ],
    "message": "Order items retrieved successfully",
    "success": true
}
```

**Error Responses:**
- `404 Not Found` - Order not found

---

## 3. Update Order Item

Updates quantity or selling price of an item. Adjusts stock inventory and recalculates order total.

**Endpoint:** `/:id`  
**Method:** `PATCH`  
**Allowed Roles:** OWNER, ADMIN

### Request

**URL Parameters:**
| Parameter | Type | Description |
|---|---|---|
| id | integer | ID of the order item |

**Body:** (At least one required)
| Parameter | Type | Description |
|---|---|---|
| quantity | integer | New quantity (difference adjusted in stock) |
| selling_price | number | New selling price |

### Response

**200 OK**
```json
{
    "statusCode": 200,
    "data": {
        "id": 501,
        "total_amount": 2000.00
    },
    "message": "Order item updated successfully",
    "success": true
}
```

**Error Responses:**
- `400 Bad Request` - No fields provided
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Order item not found

---

## 4. Remove Order Item

Removes an item from an order. Returns quantity to main stock and recalculates order total.

**Endpoint:** `/:id`  
**Method:** `DELETE`  
**Allowed Roles:** OWNER, ADMIN

### Request

**URL Parameters:**
| Parameter | Type | Description |
|---|---|---|
| id | integer | ID of the order item |

### Response

**200 OK**
```json
{
    "statusCode": 200,
    "data": {
        "id": 501,
        "total_amount": 1500.00
    },
    "message": "Item removed from order successfully",
    "success": true
}
```

**Error Responses:**
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Order item not found
