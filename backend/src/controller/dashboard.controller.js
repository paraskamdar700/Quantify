import Dashboard from '../model/dashboard.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Helper: Parse and validate date-range query params.
 * Falls back to the current calendar month if not provided.
 */
function parseDateRange(query) {
    let { startDate, endDate } = query;

    if (!startDate || !endDate) {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        if (!startDate) startDate = start.toISOString().split('T')[0];
        if (!endDate) endDate = end.toISOString().split('T')[0];
    }

    // Basic validation
    if (isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
        throw new ApiError(400, "Invalid date format. Use YYYY-MM-DD.");
    }

    if (new Date(startDate) > new Date(endDate)) {
        throw new ApiError(400, "startDate cannot be after endDate.");
    }

    return { startDate, endDate };
}

// ─── GET /api/v1/dashboard  (Full dashboard — kept for backward compatibility) ───

const getDashboardData = async (req, res, next) => {
    try {
        const { firm_id } = req.user;
        const { startDate, endDate } = parseDateRange(req.query);

        const [summary, revenueChart, topSelling, recentOrders] = await Promise.all([
            Dashboard.getSummaryStats(firm_id, startDate, endDate),
            Dashboard.getRevenueChartData(firm_id, startDate, endDate),
            Dashboard.getTopSellingStock(firm_id, startDate, endDate, 5),
            Dashboard.getRecentOrders(firm_id, 10)
        ]);

        const dashboardData = {
            dateRange: { startDate, endDate },
            summary,
            revenueChart,
            topSelling,
            recentOrders
        };

        return res.status(200).json(
            new ApiResponse(200, "Dashboard data retrieved successfully", dashboardData)
        );
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/v1/dashboard/summary ──────────────────────────────────────────

const getSummaryStats = async (req, res, next) => {
    try {
        const { firm_id } = req.user;
        const { startDate, endDate } = parseDateRange(req.query);

        const summary = await Dashboard.getSummaryStats(firm_id, startDate, endDate);

        return res.status(200).json(
            new ApiResponse(200, "Summary stats retrieved successfully", {
                dateRange: { startDate, endDate },
                ...summary
            })
        );
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/v1/dashboard/revenue-overview ─────────────────────────────────
// Returns time-series data for the Revenue Overview line chart.
// Automatically adjusts granularity (daily/weekly/monthly/yearly) based on
// the selected date range so the frontend always gets the right resolution.

const getRevenueOverview = async (req, res, next) => {
    try {
        const { firm_id } = req.user;
        const { startDate, endDate } = parseDateRange(req.query);

        const revenueChart = await Dashboard.getRevenueChartData(firm_id, startDate, endDate);

        return res.status(200).json(
            new ApiResponse(200, "Revenue overview retrieved successfully", {
                dateRange: { startDate, endDate },
                granularity: revenueChart.granularity,
                chartData: revenueChart.data
            })
        );
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/v1/dashboard/top-selling ──────────────────────────────────────
// Returns top selling products with their percentage contribution to total
// revenue — designed for a pie chart representation.
// Optional query param: limit (default 5)

const getTopSelling = async (req, res, next) => {
    try {
        const { firm_id } = req.user;
        const { startDate, endDate } = parseDateRange(req.query);
        const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20); // Cap at 20

        const topSelling = await Dashboard.getTopSellingStock(firm_id, startDate, endDate, limit);

        return res.status(200).json(
            new ApiResponse(200, "Top selling products retrieved successfully", {
                dateRange: { startDate, endDate },
                ...topSelling
            })
        );
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/v1/dashboard/recent-orders ────────────────────────────────────
// Returns today's most recent orders for the "Recent Orders" section.
// Optional query param: limit (default 10)

const getRecentOrders = async (req, res, next) => {
    try {
        const { firm_id } = req.user;
        const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50); // Cap at 50

        const recentOrders = await Dashboard.getRecentOrders(firm_id, limit);

        return res.status(200).json(
            new ApiResponse(200, "Recent orders retrieved successfully", {
                orders: recentOrders,
                count: recentOrders.length
            })
        );
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/v1/dashboard/export ───────────────────────────────────────────
// Exports dashboard order data as a downloadable CSV file.
// Requires startDate and endDate query params.

const exportDashboardData = async (req, res, next) => {
    try {
        const { firm_id } = req.user;
        const { startDate, endDate } = parseDateRange(req.query);

        const orders = await Dashboard.getExportOrders(firm_id, startDate, endDate);

        if (!orders || orders.length === 0) {
            throw new ApiError(404, "No orders found in the selected date range to export.");
        }

        // ── Build CSV ──────────────────────────────────────────────────
        const csvHeaders = [
            'Invoice No',
            'Order Date',
            'Customer Name',
            'Customer Firm',
            'Customer Contact',
            'Customer City',
            'Total Amount',
            'Amount Paid',
            'Balance Due',
            'Order Status',
            'Payment Status',
            'Delivery Status',
            'Payment Terms'
        ];

        const csvRows = orders.map(order => {
            const invoiceNo = `INV-${new Date(order.order_date).getFullYear()}-${String(order.invoice_no).padStart(4, '0')}`;
            const orderDate = new Date(order.order_date).toISOString().split('T')[0];

            return [
                `"${invoiceNo}"`,
                `"${orderDate}"`,
                `"${(order.customer_name || '').replace(/"/g, '""')}"`,
                `"${(order.customer_firm || '').replace(/"/g, '""')}"`,
                `"${order.customer_contact || ''}"`,
                `"${(order.customer_city || '').replace(/"/g, '""')}"`,
                order.total_amount,
                order.total_amount_paid,
                order.balance_due,
                `"${order.order_status}"`,
                `"${order.payment_status}"`,
                `"${order.delivery_status || ''}"`,
                `"${(order.payment_terms || '').replace(/"/g, '""')}"`
            ].join(',');
        });

        const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

        // Generate a readable filename
        const filename = `Quantify_Orders_${startDate}_to_${endDate}.csv`;

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf-8'));

        return res.status(200).send(csvContent);
    } catch (error) {
        next(error);
    }
};

export {
    getDashboardData,
    getSummaryStats,
    getRevenueOverview,
    getTopSelling,
    getRecentOrders,
    exportDashboardData
};