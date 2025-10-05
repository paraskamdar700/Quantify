import express from 'express';
import { authorize } from '../middleware/authorize.js';
import { verifyJwt } from '../middleware/auth.middleware.js';

const router = express.Router();

// Customer routes go here

export default router;
