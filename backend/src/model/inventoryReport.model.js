import database from "../config/database.js";

class InventoryReport {

    /**
     * Inventory Summary Cards
     * Returns: total_value, turnover_ratio, sell_through_rate, stock_alerts
     */
    async getSummaryStats(firmId, startDate, endDate) {
        const db = database;

        // 1. Total Inventory Value (current snapshot)
        //    SUM(quantity_available * buy_price) for all active stock
        const valueSql = `
            SELECT COALESCE(SUM(quantity_available * buy_price), 0) AS total_value
            FROM stock
            WHERE firm_id = ? AND is_active = TRUE
        `;
        const [valueResult] = await db.query(valueSql, [firmId]);
        const totalValue = parseFloat(valueResult.total_value) || 0;

        // 2. Total Sales in the period (for turnover ratio)
        //    SUM(os.subtotal) from orders in the date range
        const salesSql = `
            SELECT COALESCE(SUM(os.subtotal), 0) AS total_sales
            FROM order_stock os
            JOIN ORDERS o ON os.order_id = o.id
            WHERE o.firm_id = ?
            AND o.order_status != 'CANCELLED'
            AND o.order_date BETWEEN ? AND ?
        `;
        const [salesResult] = await db.query(salesSql, [firmId, startDate, endDate]);
        const totalSales = parseFloat(salesResult.total_sales) || 0;

        // Turnover Ratio = Total Sales / Average Inventory Value
        // Using current inventory value as the denominator (best approximation without historical snapshots)
        const turnoverRatio = totalValue > 0
            ? parseFloat((totalSales / totalValue).toFixed(2))
            : 0;

        // 3. Sell-Through Rate = (total sold quantity / total available quantity) * 100
        //    total_sold = SUM(os.quantity) for orders in the date range
        //    total_stock = total_sold + current_quantity_available (approximates total received)
        const soldQtySql = `
            SELECT COALESCE(SUM(os.quantity), 0) AS total_sold
            FROM order_stock os
            JOIN ORDERS o ON os.order_id = o.id
            WHERE o.firm_id = ?
            AND o.order_status != 'CANCELLED'
            AND o.order_date BETWEEN ? AND ?
        `;
        const [soldResult] = await db.query(soldQtySql, [firmId, startDate, endDate]);
        const totalSold = parseFloat(soldResult.total_sold) || 0;

        const currentStockQtySql = `
            SELECT COALESCE(SUM(quantity_available), 0) AS total_available
            FROM stock
            WHERE firm_id = ? AND is_active = TRUE
        `;
        const [stockQtyResult] = await db.query(currentStockQtySql, [firmId]);
        const totalAvailable = parseFloat(stockQtyResult.total_available) || 0;

        // total_received ≈ total_sold + current_available
        const totalReceived = totalSold + totalAvailable;
        const sellThroughRate = totalReceived > 0
            ? parseFloat(((totalSold / totalReceived) * 100).toFixed(2))
            : 0;

        // 4. Stock Alerts — products where quantity_available <= low_unit_threshold
        const alertsSql = `
            SELECT COUNT(id) AS stock_alerts
            FROM stock
            WHERE firm_id = ?
            AND is_active = TRUE
            AND quantity_available <= low_unit_threshold
        `;
        const [alertsResult] = await db.query(alertsSql, [firmId]);
        const stockAlerts = alertsResult.stock_alerts || 0;

        return {
            total_value: totalValue,
            turnover_ratio: turnoverRatio,
            sell_through_rate: sellThroughRate,
            stock_alerts: stockAlerts
        };
    }

    /**
     * Inventory Value by Category
     * Returns: category_name, total_value per category
     * Calculation: SUM(quantity_available * buy_price) GROUP BY category
     */
    async getCategoryBreakdown(firmId) {
        const db = database;

        const sql = `
            SELECT 
                c.id AS category_id,
                c.category_name,
                COALESCE(SUM(s.quantity_available * s.buy_price), 0) AS total_value,
                COUNT(s.id) AS product_count
            FROM category c
            LEFT JOIN stock s ON c.id = s.category_id AND s.is_active = TRUE
            WHERE c.firm_id = ?
            GROUP BY c.id, c.category_name
            ORDER BY total_value DESC
        `;
        const rows = await db.query(sql, [firmId]);

        // Calculate grand total for percentage breakdown
        const grandTotal = rows.reduce((sum, row) => sum + parseFloat(row.total_value), 0);

        return rows.map(row => ({
            category_id: row.category_id,
            category_name: row.category_name,
            total_value: parseFloat(row.total_value),
            product_count: row.product_count,
            percentage: grandTotal > 0
                ? parseFloat(((parseFloat(row.total_value) / grandTotal) * 100).toFixed(2))
                : 0
        }));
    }

    /**
     * Sell-Through Analysis
     * Returns: sell_through_rate, target_rate, trend (% change from previous period)
     */
    async getSellThroughAnalysis(firmId, startDate, endDate, targetRate = 75) {
        const db = database;

        // ── Current Period ──────────────────────────────────────────────
        const soldQtySql = `
            SELECT COALESCE(SUM(os.quantity), 0) AS total_sold
            FROM order_stock os
            JOIN ORDERS o ON os.order_id = o.id
            WHERE o.firm_id = ?
            AND o.order_status != 'CANCELLED'
            AND o.order_date BETWEEN ? AND ?
        `;
        const [soldResult] = await db.query(soldQtySql, [firmId, startDate, endDate]);
        const totalSold = parseFloat(soldResult.total_sold) || 0;

        const currentStockQtySql = `
            SELECT COALESCE(SUM(quantity_available), 0) AS total_available
            FROM stock
            WHERE firm_id = ? AND is_active = TRUE
        `;
        const [stockQtyResult] = await db.query(currentStockQtySql, [firmId]);
        const totalAvailable = parseFloat(stockQtyResult.total_available) || 0;

        const totalReceived = totalSold + totalAvailable;
        const sellThroughRate = totalReceived > 0
            ? parseFloat(((totalSold / totalReceived) * 100).toFixed(2))
            : 0;

        // ── Previous Period (same duration, immediately before startDate) ──
        const start = new Date(startDate);
        const end = new Date(endDate);
        const durationMs = end.getTime() - start.getTime();

        const prevEnd = new Date(start.getTime() - 1);                  // day before current start
        const prevStart = new Date(prevEnd.getTime() - durationMs);     // same duration back

        const prevStartStr = prevStart.toISOString().split('T')[0];
        const prevEndStr = prevEnd.toISOString().split('T')[0];

        const [prevSoldResult] = await db.query(soldQtySql, [firmId, prevStartStr, prevEndStr]);
        const prevTotalSold = parseFloat(prevSoldResult.total_sold) || 0;

        // For the previous period, use total_sold + current_available as an approximation
        const prevTotalReceived = prevTotalSold + totalAvailable;
        const prevSellThrough = prevTotalReceived > 0
            ? parseFloat(((prevTotalSold / prevTotalReceived) * 100).toFixed(2))
            : 0;

        // Trend: percentage point change
        const trend = prevSellThrough > 0
            ? parseFloat((sellThroughRate - prevSellThrough).toFixed(2))
            : 0;

        return {
            sell_through_rate: sellThroughRate,
            target_rate: targetRate,
            trend,
            current_period: { startDate, endDate, total_sold: totalSold, total_received: totalReceived },
            previous_period: { startDate: prevStartStr, endDate: prevEndStr, sell_through_rate: prevSellThrough }
        };
    }
}

export default new InventoryReport();
