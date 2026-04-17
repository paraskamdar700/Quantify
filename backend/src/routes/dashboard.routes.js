import express from 'express';
import {
    getDashboardData,
    getSummaryStats,
    getRevenueOverview,
    getTopSelling,
    getRecentOrders,
    exportDashboardData
} from '../controller/dashboard.controller.js';
import { verifyJwt } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

router.use(verifyJwt);

const roles = ['OWNER', 'ADMIN', 'STAFF'];

// ─── Full Dashboard (backward compatible) ───────────────────────────────────
// GET /api/v1/dashboard?startDate=2025-01-01&endDate=2025-01-31
router.get('/', authorize(roles), getDashboardData);

// ─── Summary Stats (cards: Revenue, Orders, Pending, Products) ──────────────
// GET /api/v1/dashboard/summary?startDate=2025-01-01&endDate=2025-01-31
router.get('/summary', authorize(roles), getSummaryStats);

// ─── Revenue Overview (line chart data) ─────────────────────────────────────
// GET /api/v1/dashboard/revenue-overview?startDate=2025-01-01&endDate=2025-12-31
router.get('/revenue-overview', authorize(roles), getRevenueOverview);

// ─── Top Selling Products (pie chart data) ──────────────────────────────────
// GET /api/v1/dashboard/top-selling?startDate=2025-01-01&endDate=2025-12-31&limit=5
router.get('/top-selling', authorize(roles), getTopSelling);

// ─── Recent Orders (today's latest orders) ──────────────────────────────────
// GET /api/v1/dashboard/recent-orders?limit=10
router.get('/recent-orders', authorize(roles), getRecentOrders);

// ─── Export Dashboard Data (CSV download) ───────────────────────────────────
// GET /api/v1/dashboard/export?startDate=2025-01-01&endDate=2025-01-31
router.get('/export', authorize(roles), exportDashboardData);

export default router;