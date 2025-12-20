import express from 'express';
import { generateInvoice, downloadInvoice, sendInvoice } from '../controller/invoice.controller.js';
import { authorize } from '../middleware/authorize.js';
import { verifyJwt } from '../middleware/auth.middleware.js';
const router = express.Router();


router.use(verifyJwt); // Any authenticated user can access these routes
router.use(authorize('OWNER', 'ADMIN'));


router.get('/next-number',authorize(['OWNER', 'ADMIN']), generateInvoice);

router.get('/:order_id', authorize(['OWNER', 'ADMIN']), downloadInvoice);

router.post('/:order_id/send', authorize(['OWNER', 'ADMIN']), sendInvoice);
export default router;
