import express from 'express';
import { registerFirmAndOwner, 
        loginUser,
        refreshToken, 
        logoutUser,
        resetPassword,
        updateAvatar ,
        updateBio,
        updateContact,
        updateFullName,
        updateEmail,
        getCurrentUser
      } from '../controller/auth.controller.js';
import { upload } from '../middleware/multer.middleware.js';
import { verifyJwt } from '../middleware/auth.middleware.js';
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
router.patch('/update-bio', verifyJwt, updateBio);
router.patch('/update-contact', verifyJwt, updateContact);
router.patch('/update-fullname', verifyJwt, updateFullName);
router.patch('/update-email', verifyJwt, updateEmail);
router.get('/getuser-details', verifyJwt, getCurrentUser);

export default router;
