import express from 'express';
import { authorize } from '../middleware/authorize.js';
import { verifyJwt } from '../middleware/auth.middleware.js';
import { 
    registerStaff,
    updateStaffRole
} from '../controller/user.controller.js';

const router = express.Router();

router.post('/register-staff-admin', verifyJwt, authorize(['OWNER', 'ADMIN']), registerStaff);
router.patch('/update-staff-role', verifyJwt, authorize(['OWNER']), updateStaffRole);

export default router;