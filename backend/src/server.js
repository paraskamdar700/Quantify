import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import errorHandler from './middleware/errorHandler.js';


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,

}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

// route import
import authRouter from './router/auth.routes.js'
import userRouter from './router/user.routes.js'
import firmRouter from './router/firm.routes.js'
//routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/firm", firmRouter);



app.use(errorHandler);
