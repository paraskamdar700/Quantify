import database from "../config/database.js";

class Dashboard {

    /**
     * Gets high-level summary cards (Revenue, Orders, Pending Payments, Active Products)
     */
    async getSummaryStats(firmId, startDate, endDate) {
        const db = database;
        const params = [firmId, startDate, endDate];

        // 1. Revenue & Orders & Profit
        const sql = `
            SELECT 
                COUNT(DISTINCT o.id) as total_orders,
                COALESCE(SUM(o.total_amount), 0) as total_revenue,
                COALESCE(SUM(
                    (os.selling_price - s.buy_price) * os.quantity
                ), 0) as total_profit
            FROM ORDERS o
            LEFT JOIN order_stock os ON o.id = os.order_id
            LEFT JOIN stock s ON os.stock_id = s.id
            WHERE o.firm_id = ? 
            AND o.order_status != 'CANCELLED'
            AND o.order_date BETWEEN ? AND ?
        `;
        const [stats] = await db.query(sql, params);

        // 2. Pending Payments Count & Amount
        const pendingSql = `
            SELECT 
                COUNT(id) as pending_payment_count,
                COALESCE(SUM(total_amount - total_amount_paid), 0) as total_pending_amount
            FROM ORDERS
            WHERE firm_id = ?
            AND payment_status != 'PAID'
            AND order_status != 'CANCELLED'
            AND order_date BETWEEN ? AND ?
        `;
        const [pendingStats] = await db.query(pendingSql, params);

        // 3. Total Customers (New customers in this period)
        const customerSql = `
            SELECT COUNT(id) as total_customers 
            FROM customer 
            WHERE firm_id = ? 
            AND created_at BETWEEN ? AND ?
        `;
        const [customerStats] = await db.query(customerSql, params);

        // 4. Total Active Products (snapshot, not date filtered)
        const productSql = `SELECT COUNT(id) as total_products FROM stock WHERE firm_id = ? AND is_active = TRUE`;
        const [productStats] = await db.query(productSql, [firmId]);

        return {
            total_orders: stats.total_orders,
            total_revenue: stats.total_revenue,
            total_profit: stats.total_profit,
            pending_payments: {
                count: pendingStats.pending_payment_count,
                amount: pendingStats.total_pending_amount
            },
            total_customers: customerStats.total_customers,
            total_products: productStats.total_products
        };
    }

    /**
     * Determines the best granularity for the revenue chart based on date range span.
     * Returns: 'daily' | 'weekly' | 'monthly' | 'yearly'
     */
    _getGranularity(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) return 'daily';       // Single day
        if (diffDays <= 31) return 'daily';       // Up to ~1 month → daily points
        if (diffDays <= 90) return 'weekly';      // Up to ~3 months → weekly points
        if (diffDays <= 730) return 'monthly';    // Up to ~2 years → monthly points
        return 'yearly';                          // Beyond 2 years → yearly points
    }

    /**
     * Gets data for the Revenue Overview line chart.
     * Auto-selects granularity (daily/weekly/monthly/yearly) based on the date range.
     * Useful for visualizing revenue growth and spotting seasonal patterns, peaks, and dips.
     */
    async getRevenueChartData(firmId, startDate, endDate) {
        const db = database;
        const granularity = this._getGranularity(startDate, endDate);

        let dateExpression, dateLabel;

        switch (granularity) {
            case 'daily':
                dateExpression = 'DATE(order_date)';
                dateLabel = 'DATE(order_date)';
                break;
            case 'weekly':
                // Group by ISO week start (Monday)
                dateExpression = 'DATE(order_date - INTERVAL (WEEKDAY(order_date)) DAY)';
                dateLabel = 'DATE(order_date - INTERVAL (WEEKDAY(order_date)) DAY)';
                break;
            case 'monthly':
                dateExpression = "DATE_FORMAT(order_date, '%Y-%m-01')";
                dateLabel = "DATE_FORMAT(order_date, '%Y-%m-01')";
                break;
            case 'yearly':
                dateExpression = "DATE_FORMAT(order_date, '%Y-01-01')";
                dateLabel = "DATE_FORMAT(order_date, '%Y-01-01')";
                break;
        }

        const sql = `
            SELECT 
                ${dateExpression} as date,
                COALESCE(SUM(total_amount), 0) as revenue,
                COUNT(id) as order_count
            FROM ORDERS
            WHERE firm_id = ? 
            AND order_status != 'CANCELLED'
            AND order_date BETWEEN ? AND ?
            GROUP BY ${dateLabel}
            ORDER BY ${dateLabel} ASC
        `;

        const rows = await db.query(sql, [firmId, startDate, endDate]);
        return {
            granularity,
            data: rows
        };
    }

    /**
     * Gets top selling products with percentage of total revenue — ideal for pie chart.
     * Shows what percentage of total revenue each product contributes.
     */
    async getTopSellingStock(firmId, startDate, endDate, limit = 5) {
        const db = database;

        // First, get total revenue in the period for percentage calculation
        const totalSql = `
            SELECT COALESCE(SUM(os.subtotal), 0) as grand_total
            FROM order_stock os
            JOIN ORDERS o ON os.order_id = o.id
            WHERE o.firm_id = ?
            AND o.order_status != 'CANCELLED'
            AND o.order_date BETWEEN ? AND ?
        `;
        const [totalResult] = await db.query(totalSql, [firmId, startDate, endDate]);
        const grandTotal = parseFloat(totalResult.grand_total) || 0;

        // Get top N products
        const sql = `
            SELECT 
                s.stock_name,
                s.sku_code,
                COALESCE(SUM(os.quantity), 0) as total_sold_quantity,
                COALESCE(SUM(os.subtotal), 0) as total_sales_amount
            FROM order_stock os
            JOIN ORDERS o ON os.order_id = o.id
            JOIN stock s ON os.stock_id = s.id
            WHERE o.firm_id = ?
            AND o.order_status != 'CANCELLED'
            AND o.order_date BETWEEN ? AND ?
            GROUP BY s.id, s.stock_name, s.sku_code
            ORDER BY total_sold_quantity DESC
            LIMIT ?
        `;
        const rows = await db.query(sql, [firmId, startDate, endDate, limit]);

        // Calculate percentage for each product
        let topTotal = 0;
        const products = rows.map(row => {
            const salesAmount = parseFloat(row.total_sales_amount);
            topTotal += salesAmount;
            return {
                stock_name: row.stock_name,
                sku_code: row.sku_code,
                total_sold_quantity: row.total_sold_quantity,
                total_sales_amount: salesAmount,
                percentage: grandTotal > 0 ? parseFloat(((salesAmount / grandTotal) * 100).toFixed(2)) : 0
            };
        });

        // Add "Others" category if there's remaining revenue outside top N
        const othersAmount = grandTotal - topTotal;
        if (othersAmount > 0 && products.length >= limit) {
            products.push({
                stock_name: 'Others',
                sku_code: null,
                total_sold_quantity: null,
                total_sales_amount: parseFloat(othersAmount.toFixed(2)),
                percentage: parseFloat(((othersAmount / grandTotal) * 100).toFixed(2))
            });
        }

        return {
            grand_total: grandTotal,
            products
        };
    }

    /**
     * Gets recent orders for the dashboard list
     */
    async getRecentOrders(firmId, limit = 10) {
        const db = database;
        const sql = `
            SELECT 
                o.id,
                o.invoice_no,
                o.order_date,
                o.total_amount,
                o.total_amount_paid,
                o.payment_status,
                o.delivery_status,
                o.order_status,
                c.fullname as customer_name
            FROM ORDERS o
            LEFT JOIN customer c ON o.customer_id = c.id
            WHERE o.firm_id = ?
            ORDER BY o.created_at DESC
            LIMIT ?
        `;
        const rows = await db.query(sql, [firmId, limit]);
        return rows;
    }

    /**
     * Gets ALL orders within a date range for CSV export.
     * Includes full order details with customer name.
     */
    async getExportOrders(firmId, startDate, endDate) {
        const db = database;
        const sql = `
            SELECT 
                o.id,
                o.invoice_no,
                o.order_date,
                o.total_amount,
                o.total_amount_paid,
                (o.total_amount - o.total_amount_paid) as balance_due,
                o.order_status,
                o.payment_status,
                o.delivery_status,
                o.payment_terms,
                c.fullname as customer_name,
                c.firm_name as customer_firm,
                c.contact_no as customer_contact,
                c.city as customer_city
            FROM ORDERS o
            LEFT JOIN customer c ON o.customer_id = c.id
            WHERE o.firm_id = ?
            AND o.order_status != 'CANCELLED'
            AND o.order_date BETWEEN ? AND ?
            ORDER BY o.order_date DESC
        `;
        const rows = await db.query(sql, [firmId, startDate, endDate]);
        return rows;
    }
}

export default new Dashboard();