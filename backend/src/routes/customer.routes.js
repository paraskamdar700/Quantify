import express from 'express';
import { authorize } from '../middleware/authorize.js';
import { verifyJwt } from '../middleware/auth.middleware.js';
import { 
    addCustomer,
    getCustomers,
    updateCustomer,
    deleteCustomer
} from '../controller/customer.controller.js';
const router = express.Router();

// Customer routes go here
router.post('/add-customer', verifyJwt, authorize(['OWNER','ADMIN','STAFF']), addCustomer);
router.get('/get-customers-list', verifyJwt, authorize(['OWNER','ADMIN','STAFF']), getCustomers);
router.put('/update-customer/:id', verifyJwt, authorize(['OWNER','ADMIN','STAFF']), updateCustomer);
router.delete('/delete-customer/:id', verifyJwt, authorize(['OWNER','ADMIN','STAFF']), deleteCustomer);
export default router;
