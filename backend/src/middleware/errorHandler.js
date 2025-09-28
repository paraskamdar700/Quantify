import { ApiError } from "../utils/ApiError";

const errorHandler = (err, req, res, next) =>{
    console.log(err);

    if(err instanceof ApiError){
        return res.status(err.statusCode).json({
            success:false,
            message:err.message+"💥",
        });
    }
    return res.status(500).json({
        success:false,
            message:"💥 Error caught by middleware:",
    });
}



export default errorHandler;
