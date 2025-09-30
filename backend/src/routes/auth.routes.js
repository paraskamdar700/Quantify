import express from 'express';
import { registerFirmAndOwner } from '../controller/auth.controller.js'; // Corrected import path
import { upload } from '../middleware/multer.middleware.js';

const router = express.Router();

router.post(
  '/register',
  upload.fields([
    { name: 'avatar', maxCount: 1 }
  ]),
  registerFirmAndOwner
);




/*
Example of how to fix them:
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
*/

export default router;
