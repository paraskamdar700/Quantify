import express from 'express';
import { createOrder, getOrder, listOrders, updateOrder, cancelOrder } from '../controller/order.controller.js';
import orderStockRouter from './orderStock.routes.js';

import { verifyJwt } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();
router.use(verifyJwt);  
// Nested routes for order items
router.use('/items', orderStockRouter);


router.route('/')
    .post(authorize(['OWNER', 'ADMIN']), createOrder)
    .get(listOrders);

router.route('/:id')
    .get(getOrder)
    .patch(authorize(['OWNER', 'ADMIN']), updateOrder); 

router.patch('/:id/cancel', authorize(['OWNER', 'ADMIN']), cancelOrder);

export default router;

