
# Payment API Documentation

## Base URL
```
/api/v1/payments
```

## Authentication
All endpoints require a valid JWT Bearer Token in the `Authorization` header.

---

## Endpoints

### 1. Record Payment
Records a new payment for a specific order and updates the order's payment status.

- **Endpoint:** `/`
- **Method:** `POST`
- **Allowed Roles:** OWNER, ADMIN

#### Request Headers
| Key | Value | Description |
|---|---|---|
| Authorization | Bearer `{token}` | Required JWT Token |
| Content-Type | application/json | |

#### Request Body
| Parameter | Type | Required | Description |
|---|---|---|---|
| order_id | integer | Yes | The ID of the order being paid for |
| amount_paid | number | Yes | The amount being paid |
| payment_method | string | Yes | Payment method (e.g., "CASH", "UPI", "BANK_TRANSFER") |
| reference_no | string | No | Transaction ID or check number |
| remarks | string | No | Notes regarding the payment |
| payment_date | string | No | Payment date (YYYY-MM-DD). Defaults to current date |

#### Success Response (201 Created)
```json
{
    "statusCode": 201,
    "data": {
        "id": 25,
        "order_id": 501,
        "firm_id": 10,
        "customer_id": 105,
        "amount_paid": 500.00,
        "payment_method": "UPI",
        "reference_no": "UPI123456",
        "payment_date": "2023-11-05T00:00:00.000Z",
        "created_at": "2023-11-05T10:30:00.000Z"
    },
    "message": "Payment recorded successfully",
    "success": true
}
```

#### Error Responses
| Status | Description |
|---|---|
| 400 | order_id, amount_paid, and payment_method are required |
| 404 | Order not found |
| 500 | Database transaction failed |

---

### 2. Get Pending Payments
Retrieves a paginated list of orders with UNPAID or PARTIALLY_PAID status.

- **Endpoint:** `/pending`
- **Method:** `GET`
- **Allowed Roles:** OWNER, ADMIN

#### Query Parameters
| Parameter | Type | Default | Description |
|---|---|---|---|
| page | integer | 1 | Page number |
| limit | integer | 10 | Items per page |

#### Success Response (200 OK)
```json
{
    "statusCode": 200,
    "data": {
        "orders": [
            {
                "id": 501,
                "invoice_no": "INV-001",
                "customer_id": 105,
                "total_amount": 1500.00,
                "payment_status": "PARTIALLY_PAID",
                "order_date": "2023-11-01T00:00:00.000Z"
            }
        ],
        "pagination": {
            "totalItems": 12,
            "totalPages": 2,
            "currentPage": 1,
            "itemsPerPage": 10,
            "hasNextPage": true,
            "hasPrevPage": false
        }
    },
    "message": "Orders with pending payments retrieved",
    "success": true
}
```

---

### 3. Get Order Payments
Retrieves all payment records for a specific order.

- **Endpoint:** `/order/:order_id`
- **Method:** `GET`
- **Allowed Roles:** Authenticated Users (Owner, Admin, Staff)

#### URL Parameters
| Parameter | Type | Description |
|---|---|---|
| order_id | integer | The ID of the order |

#### Success Response (200 OK)
```json
{
    "statusCode": 200,
    "data": [
        {
            "id": 25,
            "amount_paid": 500.00,
            "payment_method": "UPI",
            "payment_date": "2023-11-05T00:00:00.000Z",
            "reference_no": "UPI123456"
        },
        {
            "id": 24,
            "amount_paid": 200.00,
            "payment_method": "CASH",
            "payment_date": "2023-11-01T00:00:00.000Z",
            "reference_no": null
        }
    ],
    "message": "Payments retrieved successfully",
    "success": true
}
```

---

### 4. Get Payment Summary
Retrieves financial summary for an order.

- **Endpoint:** `/order/:order_id/summary`
- **Method:** `GET`
- **Allowed Roles:** Authenticated Users

#### URL Parameters
| Parameter | Type | Description |
|---|---|---|
| order_id | integer | The ID of the order |

#### Success Response (200 OK)
```json
{
    "statusCode": 200,
    "data": {
        "order_id": 501,
        "total_amount": 1500.00,
        "total_paid": 700.00,
        "balance_due": 800.00,
        "payment_status": "PARTIALLY_PAID"
    },
    "message": "Payment summary retrieved",
    "success": true
}
```

---

### 5. Get Single Payment
Retrieves details of a specific payment record.

- **Endpoint:** `/:id`
- **Method:** `GET`
- **Allowed Roles:** Authenticated Users

#### URL Parameters
| Parameter | Type | Description |
|---|---|---|
| id | integer | The ID of the payment record |

#### Success Response (200 OK)
```json
{
    "statusCode": 200,
    "data": {
        "id": 25,
        "order_id": 501,
        "amount_paid": 500.00,
        "payment_method": "UPI",
        "remarks": "Part payment"
    },
    "message": "Payment retrieved successfully",
    "success": true
}
```

---

### 6. Update Payment
Updates an existing payment record and recalculates order totals.

- **Endpoint:** `/:id`
- **Method:** `PATCH`
- **Allowed Roles:** OWNER, ADMIN

#### URL Parameters
| Parameter | Type | Description |
|---|---|---|
| id | integer | The ID of the payment record to update |

#### Request Body (At least one field required)
| Parameter | Type | Description |
|---|---|---|
| amount_paid | number | Updated amount |
| payment_method | string | Updated payment method |
| reference_no | string | Updated reference number |
| remarks | string | Updated remarks |
| payment_date | string | Updated payment date |

#### Success Response (200 OK)
```json
{
    "statusCode": 200,
    "data": {
        "id": 25,
        "amount_paid": 600.00,
        "payment_method": "UPI"
    },
    "message": "Payment updated successfully",
    "success": true
}
```

---

### 7. Delete Payment
Deletes a payment record and reverses the amount from the order.

- **Endpoint:** `/:id`
- **Method:** `DELETE`
- **Allowed Roles:** OWNER, ADMIN

#### URL Parameters
| Parameter | Type | Description |
|---|---|---|
| id | integer | The ID of the payment record to delete |

#### Success Response (200 OK)
```json
{
    "statusCode": 200,
    "data": null,
    "message": "Payment deleted successfully",
    "success": true
}
```
