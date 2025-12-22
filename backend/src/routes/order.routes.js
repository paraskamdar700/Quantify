import express from 'express';
import { createOrder, getOrder, listOrders, updateOrder, cancelOrder } from '../controller/order.controller.js';
// Make sure this file name matches what you actually have (routes.js vs route.js)
import orderStockRouter from './orderStock.routes.js';

import { verifyJwt } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// Apply JWT verification to all routes
router.use(verifyJwt);  

// Nested routes for order items
router.use('/items', orderStockRouter);

// Main order routes
router.route('/')
    .post(authorize(['OWNER', 'ADMIN']), createOrder)
    .get(listOrders); 
    // ^^^ This GET route handles Search & Filtering via Query Params ^^^

router.route('/:id')
    .get(getOrder)
    .patch(authorize(['OWNER', 'ADMIN']), updateOrder); 

router.patch('/:id/cancel', authorize(['OWNER', 'ADMIN']), cancelOrder);

export default router;