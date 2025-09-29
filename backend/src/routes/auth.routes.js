import express from 'express'
import {registerFirmAndOwner} from './controller/auth.controller.js'
import { upload } from '../middleware/multer.middleware.js';

const router = express.Router();

router.post('/register').post( upload.fields([
    { name: 'avatar', maxCount: 1 }
  ]),registerFirmAndOwner);

router.post('/').post(loginUser);
router.post('/').post(logoutUser);
router.post('/').post(refreshToken);
router.post('/').post(forgerPassword);
router.post('/').post(resetPassword);


