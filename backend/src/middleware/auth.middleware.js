import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import {  User } from '../model/index.model.js';


export const verifyJwt = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return next(new ApiError(401, "Unauthorized: Token not found"));
        }

        const decodedPayload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      
        const user = await User.findById(decodedPayload?.userId);
        

        if (!user) {
            return next(new ApiError(401, "Invalid Token: User not found"));
        }
        const userResponse = {
            id: user.id,
            email: user.email,
            fullname: user.fullname,
            role: user.role,
            firm_id: user.firm_id,
        };
        req.user = userResponse;
        next(); 

    } catch (error) {
        
        const errorMessage = error.name === 'TokenExpiredError' 
            ? 'Access Token has expired' 
            : 'Invalid Access Token';
        return next(new ApiError(401, errorMessage));
    }
};

