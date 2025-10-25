import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import errorHandler from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') }); 

const app = express();


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// --- Route Imports ---
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import firmRouter from './routes/firm.routes.js';
import customerRouter from './routes/customer.routes.js';
import categoryRouter from './routes/category.routes.js';
import stockRouter from './routes/stock.routes.js';
import orderRouter from './routes/order.routes.js';
import paymentRouter from './routes/payment.routes.js';

// --- API Routes ---
app.get('/', (req, res) => {
  res.send('API is running!');
});
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/firm", firmRouter);
app.use("/api/v1/customer", customerRouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/stock", stockRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/payment", paymentRouter);

// --- Error Handling Middleware (must be last) ---
app.use(errorHandler);

// --- Start Server ---
const port = process.env.PORT || 8000; // Provide a default port
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
