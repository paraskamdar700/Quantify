# API Documentation: Delivery Management

## Base URL
`/api/v1/delivery` (Assumed based on naming conventions)

## Authentication
All endpoints require a valid JWT Bearer Token.

---

### 1. Record Delivery (Partial or Full)
Records a delivery for a specific line item within an order (e.g., delivering 5 units of "Product A" out of ordered 10). Automatically updates the order's `delivery_status` and the item's `quantity_delivered`.

- **Endpoint:** `/`
- **Method:** `POST`
- **Allowed Roles:** OWNER, ADMIN

#### Request Headers:
| Key            | Value               | Description               |
|----------------|---------------------|---------------------------|
| Authorization  | Bearer              | Required JWT Token        |
| Content-Type   | application/json     |                           |

#### Request Body:
| Parameter         | Type     | Required | Description                                                  |
|-------------------|----------|----------|--------------------------------------------------------------|
| order_stock_id    | integer  | Yes      | The ID of the specific line item (from order_stock table) being delivered. |
| delivered_quantity | integer  | Yes      | The quantity being delivered now.                           |
| delivery_notes     | string   | No       | Notes regarding the delivery (e.g., "Dispatched via DHL"). |
| delivery_date      | string   | No       | Date of delivery (YYYY-MM-DD). Defaults to current date if omitted. |

#### Success Response (201 Created):
```json
{
    "statusCode": 201,
    "data": {
        "id": 10,
        "order_stock_id": 45,
        "firm_id": 10,
        "delivered_quantity": 5,
        "delivery_date": "2023-11-10T00:00:00.000Z",
        "delivery_notes": "First batch"
    },
    "message": "Delivery recorded successfully",
    "success": true
}
```

#### Error Responses:
- **400 Bad Request:** `order_stock_id` and `delivered_quantity` are required.
- **400 Bad Request:** Cannot deliver more than the remaining quantity.
- **404 Not Found:** Order item not found.

---

### 2. Deliver Full Order
A utility endpoint to mark all items in an order as fully delivered in one go. Useful for simple workflows where partial delivery is not tracked.

- **Endpoint:** `/order/:order_id/deliver-all`
- **Method:** `POST`
- **Allowed Roles:** OWNER, ADMIN

#### URL Parameters:
| Parameter   | Type     | Description                                   |
|-------------|----------|-----------------------------------------------|
| order_id    | integer  | The ID of the order to fulfill completely.   |

#### Success Response (200 OK):
```json
{
    "statusCode": 200,
    "data": {
            "updatedCount": 3 // Number of items updated
    },
    "message": "All items in order marked as delivered successfully",
    "success": true
}
```

---

### 3. Get Pending Deliveries
Retrieves a paginated list of orders that are not yet fully delivered (Status PENDING or PARTIALLY_DELIVERED).

- **Endpoint:** `/pending`
- **Method:** `GET`
- **Allowed Roles:** OWNER, ADMIN

#### Query Parameters:
| Parameter | Type     | Default | Description         |
|-----------|----------|---------|---------------------|
| page      | integer  | 1       | Page number.        |
| limit     | integer  | 10      | Items per page.    |

#### Success Response (200 OK):
```json
{
    "statusCode": 200,
    "data": {
        "orders": [
            {
                "id": 501,
                "invoice_no": "INV-001",
                "customer_id": 105,
                "delivery_status": "PARTIALLY_DELIVERED",
                "order_date": "2023-11-01T00:00:00.000Z"
            }
        ],
        "pagination": {
            "totalItems": 5,
            "totalPages": 1,
            "currentPage": 1,
            "itemsPerPage": 10
        }
    },
    "message": "Orders with pending deliveries retrieved",
    "success": true
}
```

---

### 4. Get Delivery Summary
Retrieves a comprehensive status report for an order, listing every item and its delivery progress (Ordered vs. Delivered).

- **Endpoint:** `/order/:order_id/summary`
- **Method:** `GET`
- **Allowed Roles:** Authenticated Users

#### URL Parameters:
| Parameter | Type     | Description                       |
|-----------|----------|-----------------------------------|
| order_id  | integer  | The ID of the order.             |

#### Success Response (200 OK):
```json
{
    "statusCode": 200,
    "data": {
        "order_id": 501,
        "delivery_status": "PARTIALLY_DELIVERED",
        "order_status": "PENDING",
        "items": [
            {
                "stock_id": 12,
                "stock_name": "Product A",
                "unit": "pcs",
                "quantity_ordered": 10,
                "quantity_delivered": 5,
                "is_fulfilled": false
            },
            {
                "stock_id": 15,
                "stock_name": "Product B",
                "unit": "box",
                "quantity_ordered": 2,
                "quantity_delivered": 2,
                "is_fulfilled": true
            }
        ]
    },
    "message": "Delivery summary retrieved",
    "success": true
}
```

---

### 5. Get Order Deliveries History
Retrieves the history of all delivery records (logs) for a specific order.

- **Endpoint:** `/order/:order_id`
- **Method:** `GET`
- **Allowed Roles:** Authenticated Users

#### URL Parameters:
| Parameter | Type     | Description                       |
|-----------|----------|-----------------------------------|
| order_id  | integer  | The ID of the order.             |

#### Success Response (200 OK):
```json
{
    "statusCode": 200,
    "data": [
        {
            "id": 10,
            "stock_name": "Product A",
            "delivered_quantity": 5,
            "delivery_date": "2023-11-10T00:00:00.000Z",
            "delivery_notes": "First batch"
        }
    ],
    "message": "Delivery records retrieved successfully",
    "success": true
}
```

---

### 6. Update Delivery Record
Updates a specific delivery log (e.g., correcting a mistake in quantity). Automatically adjusts the total delivered count and status.

- **Endpoint:** `/:id`
- **Method:** `PATCH`
- **Allowed Roles:** OWNER, ADMIN

#### URL Parameters:
| Parameter | Type     | Description                       |
|-----------|----------|-----------------------------------|
| id        | integer  | The ID of the delivery record (not the order). |

#### Request Body:
| Parameter         | Type     | Description                       |
|-------------------|----------|-----------------------------------|
| delivered_quantity | integer  | Updated quantity.                 |
| delivery_notes     | string   | Updated notes.                   |
| delivery_date      | string   | Updated date.                    |

#### Success Response (200 OK):
```json
{
    "statusCode": 200,
    "data": {
        "id": 10,
        "delivered_quantity": 6,
        // ...other fields
    },
    "message": "Delivery record updated successfully",
    "success": true
}
```

---

### 7. Delete Delivery Record
Deletes a delivery log. Automatically reverses the delivered quantity on the item and updates status.

- **Endpoint:** `/:id`
- **Method:** `DELETE`
- **Allowed Roles:** OWNER, ADMIN

#### URL Parameters:
| Parameter | Type     | Description                       |
|-----------|----------|-----------------------------------|
| id        | integer  | The ID of the delivery record to delete. |

#### Success Response (200 OK):
```json
{
    "statusCode": 200,
    "data": null,
    "message": "Delivery record deleted successfully",
    "success": true
}
```