import InventoryReport from '../model/inventoryReport.model.js';
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

    if (isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
        throw new ApiError(400, "Invalid date format. Use YYYY-MM-DD.");
    }

    if (new Date(startDate) > new Date(endDate)) {
        throw new ApiError(400, "startDate cannot be after endDate.");
    }

    return { startDate, endDate };
}

// ─── GET /api/v1/inventory/dashboard ────────────────────────────────────────
// Returns full inventory dashboard data (all sections combined)

const getInventoryDashboard = async (req, res, next) => {
    try {
        const { firm_id } = req.user;
        const { startDate, endDate } = parseDateRange(req.query);
        const targetRate = parseFloat(req.query.targetRate) || 75;

        const [summary, categoryBreakdown, sellThrough] = await Promise.all([
            InventoryReport.getSummaryStats(firm_id, startDate, endDate),
            InventoryReport.getCategoryBreakdown(firm_id),
            InventoryReport.getSellThroughAnalysis(firm_id, startDate, endDate, targetRate)
        ]);

        return res.status(200).json(
            new ApiResponse(200, "Inventory dashboard data retrieved successfully", {
                dateRange: { startDate, endDate },
                summary,
                categoryBreakdown,
                sellThrough
            })
        );
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/v1/inventory/summary ──────────────────────────────────────────
// Returns summary cards: total_value, turnover_ratio, sell_through_rate, stock_alerts

const getInventorySummary = async (req, res, next) => {
    try {
        const { firm_id } = req.user;
        const { startDate, endDate } = parseDateRange(req.query);

        const summary = await InventoryReport.getSummaryStats(firm_id, startDate, endDate);

        return res.status(200).json(
            new ApiResponse(200, "Inventory summary retrieved successfully", {
                dateRange: { startDate, endDate },
                ...summary
            })
        );
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/v1/inventory/category-breakdown ───────────────────────────────
// Returns category-wise inventory value breakdown

const getCategoryBreakdown = async (req, res, next) => {
    try {
        const { firm_id } = req.user;

        const categories = await InventoryReport.getCategoryBreakdown(firm_id);

        const grandTotal = categories.reduce((sum, c) => sum + c.total_value, 0);

        return res.status(200).json(
            new ApiResponse(200, "Category breakdown retrieved successfully", {
                grand_total: grandTotal,
                categories
            })
        );
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/v1/inventory/sell-through ─────────────────────────────────────
// Returns sell-through analysis with target rate and trend

const getSellThroughAnalysis = async (req, res, next) => {
    try {
        const { firm_id } = req.user;
        const { startDate, endDate } = parseDateRange(req.query);
        const targetRate = parseFloat(req.query.targetRate) || 75;

        const sellThrough = await InventoryReport.getSellThroughAnalysis(
            firm_id, startDate, endDate, targetRate
        );

        return res.status(200).json(
            new ApiResponse(200, "Sell-through analysis retrieved successfully", {
                dateRange: { startDate, endDate },
                ...sellThrough
            })
        );
    } catch (error) {
        next(error);
    }
};

export {
    getInventoryDashboard,
    getInventorySummary,
    getCategoryBreakdown,
    getSellThroughAnalysis
};
