import express from 'express';
import { getDashboardData } from '../controller/dashboard.controller.js';
import { verifyJwt } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

router.use(verifyJwt);

// Dashboard Route
// Example: GET /api/v1/dashboard?startDate=2025-01-01&endDate=2025-01-31
router.get('/', authorize(['OWNER', 'ADMIN', 'STAFF']), getDashboardData);

export default router;