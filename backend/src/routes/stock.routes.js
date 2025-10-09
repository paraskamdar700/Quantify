import { Router } from 'express';
import {
    addStock,
    getStock,
    updateStock,
    deleteStock,
    getLowStockAlerts,
    updateStockQuantity
} from '../controller/stock.controller.js';
import { verifyJwt } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/authorize.js'; 

const router = Router();


router.use(verifyJwt);


router.post("/add-stock", authorize(['OWNER', 'ADMIN']), addStock);
router.get("/get-stock", authorize(['OWNER', 'ADMIN', 'STAFF']), getStock);
router.put("/update-stock/:id", authorize(['OWNER', 'ADMIN']), updateStock);
router.delete("/delete-stock/:id", authorize(['OWNER', 'ADMIN']), deleteStock);
router.get("/low-stock-alerts", authorize(['OWNER', 'ADMIN', 'STAFF']), getLowStockAlerts);
router.patch("/adjust-quantity/:id", authorize(['OWNER', 'ADMIN', 'STAFF']), updateStockQuantity);

export default router;