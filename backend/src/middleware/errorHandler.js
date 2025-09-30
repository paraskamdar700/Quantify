
import ApiError from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
    // Default to 500 if the status code isn't set
    let statusCode = 500;
    let message = err.message || "Internal Server Error";

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
    } else {
        // Log non-ApiError errors to see what they are
        console.error("UNHANDLED ERROR:", err);
    }

    // This check prevents the crash if statusCode is somehow not a number
    if (typeof statusCode !== 'number') {
        console.error("Invalid status code received by error handler:", statusCode);
        statusCode = 500; // Default to a safe value
    }

    return res.status(statusCode).json({
        success: false,
        message: message,
        // In development, it's helpful to see the error stack
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
};



export default errorHandler;
