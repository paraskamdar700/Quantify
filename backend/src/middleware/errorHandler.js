
import ApiError from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = err.message || "Internal Server Error";

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
    } else {
    
        console.error("UNHANDLED ERROR:", err);
    }

    if (typeof statusCode !== 'number') {
        console.error("Invalid status code received by error handler:", statusCode);
        statusCode = 500; 
    }

    return res.status(statusCode).json({
        success: false,
        message: message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
};



export default errorHandler;
