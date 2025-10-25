import express from 'express';
import { authorize } from '../middleware/authorize.js';
import { verifyJwt } from '../middleware/auth.middleware.js';
import {
    recordPayment,
    listOrderPayments,
    getPayment,
    updatePayment,
    deletePayment,
    getPendingPayments,
    getPaymentSummary
} from '../controller/payment.controller.js';

const router = express.Router();

// All payment routes are protected
router.use(verifyJwt);

// Record a new payment
router.post('/', authorize('OWNER', 'ADMIN'), recordPayment);

// Get a list of all orders with pending payments
router.get('/pending', authorize('OWNER', 'ADMIN'), getPendingPayments);

// Get all payments for a specific order
router.get('/order/:order_id', listOrderPayments);

// Get a payment summary for a specific order
router.get('/order/:order_id/summary', getPaymentSummary);

// Routes for a specific payment record
router.route('/:id')
    .get(getPayment) // Get a single payment's details
    .patch(authorize('OWNER', 'ADMIN'), updatePayment) // Update a payment
    .delete(authorize('OWNER', 'ADMIN'), deletePayment); // Delete a payment

export default router;
