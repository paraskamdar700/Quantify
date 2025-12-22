import database from "../config/database.js";

class Dashboard {

    /**
     * Gets high-level summary cards (Revenue, Orders, Profit, etc.)
     */
    async getSummaryStats(firmId, startDate, endDate) {
        const db = database;
        
        // Ensure dates are valid strings or use defaults to avoid SQL errors
        // Note: In a real app, strict validation should happen in the controller.
        
        const params = [firmId, startDate, endDate];

        // 1. Revenue & Orders
        // Revenue = Total amount from COMPLETED or CONFIRMED orders (or all non-cancelled)
        // Profit is tricky without cost price history in order_stock, 
        // but we can estimate it: (Selling Price - Buy Price) * Quantity
        // However, buy_price is in 'stock' table. We need to join.
        
        const sql = `
            SELECT 
                COUNT(DISTINCT o.id) as total_orders,
                COALESCE(SUM(o.total_amount), 0) as total_revenue,
                
                -- Calculate Profit: Sum of ((Selling Price - Buy Price) * Quantity) for all items in these orders
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
        // Count orders where payment_status is not PAID
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

        // 4. Total Products (Total active stock items - usually just a current snapshot, not date filtered)
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
     * Gets data for the main chart (Revenue vs. Date)
     */
    async getRevenueChartData(firmId, startDate, endDate) {
        const db = database;
        // Group by Date for the chart
        const sql = `
            SELECT 
                DATE(order_date) as date,
                COALESCE(SUM(total_amount), 0) as revenue,
                COUNT(id) as order_count
            FROM ORDERS
            WHERE firm_id = ? 
            AND order_status != 'CANCELLED'
            AND order_date BETWEEN ? AND ?
            GROUP BY DATE(order_date)
            ORDER BY DATE(order_date) ASC
        `;
        const [rows] = await db.query(sql, [firmId, startDate, endDate]);
        return rows;
    }

    /**
     * Gets top selling products
     */
    async getTopSellingStock(firmId, startDate, endDate, limit = 5) {
        const db = database;
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
            GROUP BY s.id
            ORDER BY total_sold_quantity DESC
            LIMIT ?
        `;
        const [rows] = await db.query(sql, [firmId, startDate, endDate, limit]);
        return rows;
    }

    /**
     * Gets recent orders for the dashboard list
     */
    async getRecentOrders(firmId, limit = 5) {
        const db = database;
        const sql = `
            SELECT 
                o.id,
                o.invoice_no,
                o.order_date,
                o.total_amount,
                o.payment_status,
                o.delivery_status,
                c.fullname as customer_name
            FROM ORDERS o
            LEFT JOIN customer c ON o.customer_id = c.id
            WHERE o.firm_id = ?
            ORDER BY o.created_at DESC
            LIMIT ?
        `;
        const [rows] = await db.query(sql, [firmId, limit]);
        return rows;
    }
}

export default new Dashboard();