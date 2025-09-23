import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import constant from './constant.js';

const app = express();

app.use(cors({
    origin: constant.CORS_ORIGIN,
    credentials: true,

}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

