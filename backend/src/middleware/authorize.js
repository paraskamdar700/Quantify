import ApiError from '../utils/ApiError.js';



export const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError(401, 'Authentication required'));
        }
        if (roles.length > 0 && !roles.includes(req.user.role)) {
            return next(new ApiError(403, 'Forbidden: Insufficient permissions'));
        }
        
        next();
    }
}
