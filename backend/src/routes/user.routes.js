import express from 'express';
import { authorize } from '../middleware/authorize.js';
import { verifyJwt } from '../middleware/auth.middleware.js';
import { 
    registerStaff,
    updateStaffRole,
    deactivateUserByPassword,
    listFirmUser,
    myProfile
} from '../controller/user.controller.js';

const router = express.Router();

router.post('/register-staff-admin', verifyJwt, authorize(['OWNER', 'ADMIN']), registerStaff);
router.patch('/update-staff-role', verifyJwt, authorize(['OWNER']), updateStaffRole);
router.patch('/deactivate-user', verifyJwt, authorize(['OWNER']), deactivateUserByPassword);
router.get('/list-firm-users', verifyJwt, authorize(['OWNER', 'ADMIN']), listFirmUser);
router.get('/my-profile', verifyJwt, myProfile);
export default router;