import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import errorHandler from './middleware/errorHandler.js';


// --- Setup for __dirname in ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load Environment Variables ---
// This ensures process.env variables are available throughout the app
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // Adjusted path assuming /src/index.js
console.log('Environment variables:', {
    PORT: process.env.PORT,
    DB_HOST: process.env.DB_HOST,
   
});
// --- Create Express App Instance ---
const app = express();

// --- Core Middleware ---
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

// --- API Routes ---
app.get('/', (req, res) => {
    res.send('API is running!');
});
app.use("/api/v1/auth", authRouter);
// app.use("/api/v1/user", userRouter);
// app.use("/api/v1/firm", firmRouter);

// --- Error Handling Middleware (must be last) ---
app.use(errorHandler);

// --- Start Server ---
const port = process.env.PORT || 8000; // Provide a default port
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
