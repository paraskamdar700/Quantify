import express from 'express';
import { registerFirmAndOwner, 
        loginUser,
        refreshToken, 
        logoutUser,
        resetPassword,
        updateAvatar ,
        updateUserDetails,
        softDeleteUser,
        getCurrentUser
      } from '../controller/auth.controller.js';
import { upload } from '../middleware/multer.middleware.js';
import { verifyJwt } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/authorize.js';
const router = express.Router();

router.post('/register',
  upload.fields([
    { name: 'avatar', maxCount: 1 }
  ]),
  registerFirmAndOwner);
router.post('/login', loginUser);

router.post('/logout', verifyJwt, logoutUser);
router.post('/refresh-token', refreshToken);
router.patch('/reset-password', verifyJwt, resetPassword);
router.patch('/update-avatar', verifyJwt, upload.fields([{ name: 'avatar', maxCount: 1 }]), updateAvatar);
router.patch('/update-user-details', verifyJwt, updateUserDetails);
router.get('/getuser-details', verifyJwt, getCurrentUser);
router.delete('/deactivate-user/:id', verifyJwt, authorize(['OWNER', 'ADMIN']), softDeleteUser);
export default router;
