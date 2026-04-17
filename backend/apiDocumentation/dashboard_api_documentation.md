
# Dashboard API Documentation

**Base URL:** `/api/v1/dashboard`  
**Authentication:** All endpoints require a valid JWT Bearer Token  
**Allowed Roles:** OWNER, ADMIN, STAFF

---

## Date Filtering

All dashboard endpoints (except Recent Orders) support date range filtering through query parameters. If no dates are provided, the **current calendar month** is used as the default range.

| Parameter | Type | Required | Format | Description |
|---|---|---|---|---|
| startDate | string | No | `YYYY-MM-DD` | Start of the date range |
| endDate | string | No | `YYYY-MM-DD` | End of the date range |

**Validation Rules:**
- Both dates must be in valid `YYYY-MM-DD` format
- `startDate` cannot be after `endDate`
- If only one date is provided, the other defaults to the current month boundary

---

## 1. Get Full Dashboard

Retrieves all dashboard data in a single request — summary stats, revenue chart, top selling products, and recent orders. Useful for initial page load.

**Endpoint:** `/`  
**Method:** `GET`  
**Allowed Roles:** OWNER, ADMIN, STAFF

### Request

**Headers:**
| Key | Value | Description |
|---|---|---|
| Authorization | Bearer `<token>` | Required JWT Token |

**Query Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| startDate | string | No | Start date (YYYY-MM-DD) |
| endDate | string | No | End date (YYYY-MM-DD) |

**Example:** `GET /api/v1/dashboard?startDate=2026-03-01&endDate=2026-04-16`

### Response

**200 OK**
```json
{
    "statuscode": 200,
    "data": {
        "dateRange": {
            "startDate": "2026-03-01",
            "endDate": "2026-04-16"
        },
        "summary": {
            "total_orders": 25,
            "total_revenue": 125000,
            "total_profit": 37500,
            "pending_payments": {
                "count": 5,
                "amount": 15000
            },
            "total_customers": 8,
            "total_products": 4
        },
        "revenueChart": {
            "granularity": "daily",
            "data": [
                { "date": "2026-03-01", "revenue": 5000, "order_count": 3 },
                { "date": "2026-03-02", "revenue": 3200, "order_count": 2 }
            ]
        },
        "topSelling": {
            "grand_total": 125000,
            "products": [
                {
                    "stock_name": "Product A",
                    "sku_code": "PA-001",
                    "total_sold_quantity": 50,
                    "total_sales_amount": 75000,
                    "percentage": 60.0
                },
                {
                    "stock_name": "Others",
                    "sku_code": null,
                    "total_sold_quantity": null,
                    "total_sales_amount": 10000,
                    "percentage": 8.0
                }
            ]
        },
        "recentOrders": [
            {
                "id": 1,
                "invoice_no": 1,
                "order_date": "2026-04-16",
                "total_amount": 2500,
                "total_amount_paid": 2500,
                "payment_status": "PAID",
                "delivery_status": "DELIVERED",
                "order_status": "COMPLETED",
                "customer_name": "Rajesh Kumar"
            }
        ]
    },
    "message": "Dashboard data retrieved successfully",
    "success": true
}
```

**Error Responses:**
- `400 Bad Request` - Invalid date format or startDate after endDate
- `401 Unauthorized` - Missing or invalid token

---

## 2. Get Summary Stats

Retrieves the four summary stat cards: Total Revenue, Total Orders, Pending Payments, and Active Products.

**Endpoint:** `/summary`  
**Method:** `GET`  
**Allowed Roles:** OWNER, ADMIN, STAFF

### Request

**Headers:**
| Key | Value | Description |
|---|---|---|
| Authorization | Bearer `<token>` | Required JWT Token |

**Query Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| startDate | string | No | Start date (YYYY-MM-DD) |
| endDate | string | No | End date (YYYY-MM-DD) |

**Example:** `GET /api/v1/dashboard/summary?startDate=2026-03-31&endDate=2026-04-29`

### Response

**200 OK**
```json
{
    "statuscode": 200,
    "data": {
        "dateRange": {
            "startDate": "2026-03-31",
            "endDate": "2026-04-29"
        },
        "total_orders": 1,
        "total_revenue": 2500,
        "total_profit": 800,
        "pending_payments": {
            "count": 1,
            "amount": 2500
        },
        "total_customers": 3,
        "total_products": 4
    },
    "message": "Summary stats retrieved successfully",
    "success": true
}
```

**Error Responses:**
- `400 Bad Request` - Invalid date format or startDate after endDate
- `401 Unauthorized` - Missing or invalid token

---

## 3. Get Revenue Overview

Returns time-series data for the **Revenue Overview line chart**. Visualizes revenue growth over time to help spot seasonal patterns, peaks, and dips. Granularity auto-adjusts based on the selected date range.

**Endpoint:** `/revenue-overview`  
**Method:** `GET`  
**Allowed Roles:** OWNER, ADMIN, STAFF

### Granularity Logic

| Date Range Span | Granularity | Example |
|---|---|---|
| ≤ 31 days | `daily` | Each point = 1 day |
| 32 – 90 days | `weekly` | Each point = 1 week (ISO Monday start) |
| 91 – 730 days | `monthly` | Each point = 1 month |
| > 730 days | `yearly` | Each point = 1 year |

### Request

**Headers:**
| Key | Value | Description |
|---|---|---|
| Authorization | Bearer `<token>` | Required JWT Token |

**Query Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| startDate | string | No | Start date (YYYY-MM-DD) |
| endDate | string | No | End date (YYYY-MM-DD) |

**Example:** `GET /api/v1/dashboard/revenue-overview?startDate=2026-01-01&endDate=2026-04-16`

### Response

**200 OK**
```json
{
    "statuscode": 200,
    "data": {
        "dateRange": {
            "startDate": "2026-01-01",
            "endDate": "2026-04-16"
        },
        "granularity": "monthly",
        "chartData": [
            {
                "date": "2026-01-01",
                "revenue": 45000,
                "order_count": 12
            },
            {
                "date": "2026-02-01",
                "revenue": 52000,
                "order_count": 15
            },
            {
                "date": "2026-03-01",
                "revenue": 38000,
                "order_count": 9
            },
            {
                "date": "2026-04-01",
                "revenue": 2500,
                "order_count": 1
            }
        ]
    },
    "message": "Revenue overview retrieved successfully",
    "success": true
}
```

**Response Fields:**
| Field | Type | Description |
|---|---|---|
| granularity | string | Auto-selected resolution: `daily`, `weekly`, `monthly`, or `yearly` |
| chartData[].date | string | Date label for the data point (format depends on granularity) |
| chartData[].revenue | number | Total revenue for that period |
| chartData[].order_count | integer | Number of orders in that period |

**Error Responses:**
- `400 Bad Request` - Invalid date format or startDate after endDate
- `401 Unauthorized` - Missing or invalid token

---

## 4. Get Top Selling Products

Returns the top selling products with their percentage contribution to total revenue. Designed to feed a **pie chart** showing what percentage of total revenue each product contributes. Best suited for a small number of categories.

**Endpoint:** `/top-selling`  
**Method:** `GET`  
**Allowed Roles:** OWNER, ADMIN, STAFF

### Request

**Headers:**
| Key | Value | Description |
|---|---|---|
| Authorization | Bearer `<token>` | Required JWT Token |

**Query Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| startDate | string | No | Start date (YYYY-MM-DD) |
| endDate | string | No | End date (YYYY-MM-DD) |
| limit | integer | No | Number of top products to return (default: 5, max: 20) |

**Example:** `GET /api/v1/dashboard/top-selling?startDate=2026-03-01&endDate=2026-04-16&limit=5`

### Response

**200 OK**
```json
{
    "statuscode": 200,
    "data": {
        "dateRange": {
            "startDate": "2026-03-01",
            "endDate": "2026-04-16"
        },
        "grand_total": 40500,
        "products": [
            {
                "stock_name": "Widget A",
                "sku_code": "WA-001",
                "total_sold_quantity": 50,
                "total_sales_amount": 25000,
                "percentage": 61.73
            },
            {
                "stock_name": "Gadget B",
                "sku_code": "GB-002",
                "total_sold_quantity": 30,
                "total_sales_amount": 12000,
                "percentage": 29.63
            },
            {
                "stock_name": "Others",
                "sku_code": null,
                "total_sold_quantity": null,
                "total_sales_amount": 3500,
                "percentage": 8.64
            }
        ]
    },
    "message": "Top selling products retrieved successfully",
    "success": true
}
```

**Response Fields:**
| Field | Type | Description |
|---|---|---|
| grand_total | number | Total revenue across all products in the date range |
| products[].stock_name | string | Product name (`"Others"` for the remainder bucket) |
| products[].sku_code | string/null | SKU code (null for the "Others" entry) |
| products[].total_sold_quantity | integer/null | Units sold (null for "Others") |
| products[].total_sales_amount | number | Revenue generated by this product |
| products[].percentage | number | Percentage of grand_total (2 decimal places) |

> **Note:** If there are more products beyond the specified `limit`, they are grouped into an **"Others"** entry with the combined remaining revenue and percentage.

**Error Responses:**
- `400 Bad Request` - Invalid date format or startDate after endDate
- `401 Unauthorized` - Missing or invalid token

---

## 5. Get Recent Orders

Retrieves the most recent orders for the **Recent Orders** section on the dashboard. Orders are sorted by creation time (newest first) regardless of date range.

**Endpoint:** `/recent-orders`  
**Method:** `GET`  
**Allowed Roles:** OWNER, ADMIN, STAFF

### Request

**Headers:**
| Key | Value | Description |
|---|---|---|
| Authorization | Bearer `<token>` | Required JWT Token |

**Query Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| limit | integer | No | Number of orders to return (default: 10, max: 50) |

**Example:** `GET /api/v1/dashboard/recent-orders?limit=10`

### Response

**200 OK**
```json
{
    "statuscode": 200,
    "data": {
        "orders": [
            {
                "id": 1,
                "invoice_no": 1,
                "order_date": "2026-04-16",
                "total_amount": 2500,
                "total_amount_paid": 0,
                "payment_status": "UNPAID",
                "delivery_status": "PENDING",
                "order_status": "CONFIRMED",
                "customer_name": "Rajesh Kumar"
            },
            {
                "id": 2,
                "invoice_no": 2,
                "order_date": "2026-04-15",
                "total_amount": 8500,
                "total_amount_paid": 8500,
                "payment_status": "PAID",
                "delivery_status": "DELIVERED",
                "order_status": "COMPLETED",
                "customer_name": "Priya Sharma"
            }
        ],
        "count": 2
    },
    "message": "Recent orders retrieved successfully",
    "success": true
}
```

**Response Fields:**
| Field | Type | Description |
|---|---|---|
| orders[].id | integer | Order ID |
| orders[].invoice_no | integer | Raw invoice number |
| orders[].order_date | string | Date the order was placed |
| orders[].total_amount | number | Total order value |
| orders[].total_amount_paid | number | Amount paid so far |
| orders[].payment_status | string | `PAID`, `UNPAID`, or `PARTIAL` |
| orders[].delivery_status | string | `PENDING`, `IN_TRANSIT`, or `DELIVERED` |
| orders[].order_status | string | `CONFIRMED`, `COMPLETED`, or `CANCELLED` |
| orders[].customer_name | string | Full name of the customer |
| count | integer | Number of orders returned |

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token

---

## 6. Export Dashboard Data

Exports all order data within the selected date range as a **downloadable CSV file**. Triggers a file download in the browser when called.

**Endpoint:** `/export`  
**Method:** `GET`  
**Allowed Roles:** OWNER, ADMIN, STAFF

### Request

**Headers:**
| Key | Value | Description |
|---|---|---|
| Authorization | Bearer `<token>` | Required JWT Token |

**Query Parameters:**
| Parameter | Type | Required | Description |
|---|---|---|---|
| startDate | string | Yes | Start date (YYYY-MM-DD) |
| endDate | string | Yes | End date (YYYY-MM-DD) |

**Example:** `GET /api/v1/dashboard/export?startDate=2026-03-01&endDate=2026-04-16`

### Response

**200 OK** — Returns a CSV file download

**Response Headers:**
| Header | Value |
|---|---|
| Content-Type | `text/csv; charset=utf-8` |
| Content-Disposition | `attachment; filename="Quantify_Orders_2026-03-01_to_2026-04-16.csv"` |

**CSV Columns:**
| Column | Description |
|---|---|
| Invoice No | Formatted as `INV-YYYY-NNNN` |
| Order Date | Date in YYYY-MM-DD format |
| Customer Name | Full name of the customer |
| Customer Firm | Customer's business/firm name |
| Customer Contact | Customer phone/contact number |
| Customer City | Customer's city |
| Total Amount | Total order value |
| Amount Paid | Amount paid so far |
| Balance Due | Remaining balance (Total - Paid) |
| Order Status | `CONFIRMED`, `COMPLETED`, or `CANCELLED` |
| Payment Status | `PAID`, `UNPAID`, or `PARTIAL` |
| Delivery Status | `PENDING`, `IN_TRANSIT`, or `DELIVERED` |
| Payment Terms | Payment terms text |

**Example CSV Output:**
```csv
Invoice No,Order Date,Customer Name,Customer Firm,Customer Contact,Customer City,Total Amount,Amount Paid,Balance Due,Order Status,Payment Status,Delivery Status,Payment Terms
"INV-2026-0001","2026-04-16","Rajesh Kumar","Demo Traders","9876543210","Mumbai",2500,0,2500,"CONFIRMED","UNPAID","PENDING","Net 30"
"INV-2026-0002","2026-04-15","Priya Sharma","ABC Corp","9123456789","Delhi",8500,8500,0,"COMPLETED","PAID","DELIVERED","Immediate"
```

**Frontend Integration:**
```javascript
// Trigger CSV download from the browser
const downloadExport = async (startDate, endDate) => {
    const response = await fetch(
        `/api/v1/dashboard/export?startDate=${startDate}&endDate=${endDate}`,
        {
            headers: { 'Authorization': `Bearer ${token}` }
        }
    );
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Quantify_Orders_${startDate}_to_${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
};
```

**Error Responses:**
- `400 Bad Request` - Invalid date format or startDate after endDate
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - No orders found in the selected date range
