import express from 'express';
import {
    getInventoryDashboard,
    getInventorySummary,
    getCategoryBreakdown,
    getSellThroughAnalysis
} from '../controller/inventoryReport.controller.js';
import { verifyJwt } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

router.use(verifyJwt);

const roles = ['OWNER', 'ADMIN', 'STAFF'];

// ─── Full Inventory Dashboard (all sections combined) ───────────────────────
// GET /api/v1/inventory/dashboard?startDate=2025-01-01&endDate=2025-01-31
router.get('/dashboard', authorize(roles), getInventoryDashboard);

// ─── Summary Cards (total_value, turnover, sell-through, alerts) ────────────
// GET /api/v1/inventory/summary?startDate=2025-01-01&endDate=2025-01-31
router.get('/summary', authorize(roles), getInventorySummary);

// ─── Category Breakdown (inventory value per category) ──────────────────────
// GET /api/v1/inventory/category-breakdown
router.get('/category-breakdown', authorize(roles), getCategoryBreakdown);

// ─── Sell-Through Analysis (rate, target, trend) ────────────────────────────
// GET /api/v1/inventory/sell-through?startDate=2025-01-01&endDate=2025-01-31&targetRate=75
router.get('/sell-through', authorize(roles), getSellThroughAnalysis);

export default router;
