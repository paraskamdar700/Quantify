import express from 'express';
import { authorize } from '../middleware/authorize.js';
import { verifyJwt } from '../middleware/auth.middleware.js';
import {
    getMyFirm,
    updateFirmDetails,
    deleteFirm
} from '../controller/firm.controller.js';

const router = express.Router();

router.use(verifyJwt);
router.use(authorize('OWNER'));
router.get('/my-firm', getMyFirm);
router.patch('/update-firm', updateFirmDetails);
router.delete('/delete-firm', deleteFirm);



// OWNER ONLY ROUTES:
export default router;