import Dashboard from '../model/dashboard.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

const getDashboardData = async (req, res, next) => {
    try {
        const { firm_id } = req.user;
        let { startDate, endDate } = req.query;

        // Default to current month if no dates provided
        if (!startDate || !endDate) {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1); // First day of month
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of month
            
            // Format as YYYY-MM-DD
            if (!startDate) startDate = start.toISOString().split('T')[0];
            if (!endDate) endDate = end.toISOString().split('T')[0];
        }

        // Fetch all dashboard components in parallel for performance
        const [summary, revenueChart, topSelling, recentOrders] = await Promise.all([
            Dashboard.getSummaryStats(firm_id, startDate, endDate),
            Dashboard.getRevenueChartData(firm_id, startDate, endDate),
            Dashboard.getTopSellingStock(firm_id, startDate, endDate, 5), // Top 5 items
            Dashboard.getRecentOrders(firm_id, 10) // Last 10 orders
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

export {
    getDashboardData
};