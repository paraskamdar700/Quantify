import express from 'express';
import { authorize } from '../middleware/authorize.js';
import { verifyJwt } from '../middleware/auth.middleware.js';
import {
    recordDelivery,
    listOrderDeliveries,
    getDelivery,
    updateDelivery,
    deleteDelivery,
    getPendingDeliveries,
    getDeliverySummary,
    deliverFullOrder
} from '../controller/delivery.controller.js';

const router = express.Router();

router.use(verifyJwt);

router.post('/', authorize('OWNER', 'ADMIN'), recordDelivery);

router.get('/pending', authorize('OWNER', 'ADMIN'), getPendingDeliveries);

router.get('/order/:order_id', listOrderDeliveries);

router.get('/order/:order_id/summary', getDeliverySummary);


router.route('/:id')
    .get(getDelivery)
    .patch(authorize('OWNER', 'ADMIN'), updateDelivery)
    .delete(authorize('OWNER', 'ADMIN'), deleteDelivery);

router.post(
    '/order/:order_id/deliver-all', 
    authorize('OWNER', 'ADMIN'), 
    deliverFullOrder
);


export default router;
