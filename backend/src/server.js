import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,

}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));


app.use("/", (err, req, res, next) => {
    console.log("💥 Error caught by middleware:", err.message);
    const data = {
        success:false,
        message:err.message || "Internal Server Error"};
    res.status(500).json(data);
});
