import express from 'express';
import { addOrderItem, updateOrderItem, removeOrderItem, getOrderItems } from '../controller/orderStock.controller.js';
import { authorize } from '../middleware/authorize.js';

const router = express.Router();

// --- Routes for items within an order ---

router.get('/order/:order_id', getOrderItems);

// The following routes modify data and are restricted to Owner/Admin.
router.use(authorize('OWNER', 'ADMIN'));

router.post('/', addOrderItem);

router.route('/:id')
    .patch(updateOrderItem)
    .delete(removeOrderItem);

export default router;

