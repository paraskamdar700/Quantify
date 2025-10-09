import express from 'express';
import { verifyJwt } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/authorize.js';
import { createCategory, getCategories, updateCategory, deleteCategory } from '../controller/category.controller.js';
const router = express.Router();

// Define your category routes here
router.post('/create-category', verifyJwt, authorize('OWNER','ADMIN'), createCategory);
router.get('/get-categories', verifyJwt, authorize('OWNER','ADMIN','STAFF'), getCategories);
router.patch('/update-category/:id', verifyJwt, authorize('OWNER','ADMIN'), updateCategory);
router.delete('/delete-category/:id', verifyJwt, authorize('OWNER','ADMIN'), deleteCategory);

export default router;
