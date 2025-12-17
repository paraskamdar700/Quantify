import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import InvoiceController from '../controllers/invoice.controller.js';

const router = express.Router();


router.use(protect);
router.use(authorize('OWNER', 'ADMIN'));


router.get('/next-number', InvoiceController.generateInvoice);

router.get('/:order_id/download', InvoiceController.downloadInvoice);

router.post('/:order_id/send', InvoiceController.sendInvoice);

export default router;
