// user.controller.js - User Management Only
import ApiError from "../utils/ApiError.js";
import { User, Firm} from "../model/index.model.js";
import bcrypt from "bcrypt";
import ApiResponse from "../utils/ApiResponse.js";

const registerStaff = async (req, res, next) => {
    try {
        const { fullname, email, password, contact_no, role } = req.body;
        const firm_id = req.user.firm_id; 

        if (!firm_id) {
            throw new ApiError(401, "Unauthorized: Firm ID not found in user token.");
        }
        if (!fullname || !email || !password || !contact_no || !role) {
            throw new ApiError(400, 'All fields are required');
        }
        if (!['STAFF', 'ADMIN'].includes(role.toUpperCase())) { // Use .toUpperCase() for safety
            throw new ApiError(400, 'Invalid role specified. Must be STAFF or ADMIN.');
        }
        const existingUserArray = await User.findByEmail(email);
        if (existingUserArray && existingUserArray.length > 0) {
            throw new ApiError(409, 'Email already in use');
        }

        const password_hash = await bcrypt.hash(password, 10);

        const newUserArray = await User.createUser({
            fullname,
            contact_no,
            email,
            password_hash,
            role: role.toUpperCase(),
            avatar: null, 
            bio: null,    
            firm_id
        });

        if (!newUserArray || newUserArray.length === 0) {
            throw new ApiError(500, 'Failed to create user');
        }
    
        const userResponse = {
            id: newUserArray.id,
            fullname: newUserArray.fullname,
            contact_no: newUserArray.contact_no,
            email: newUserArray.email,
            role: newUserArray.role,
            firm_id: newUserArray.firm_id
        };

        return res.status(201)
            .json(new ApiResponse(201, 'User registered successfully', userResponse));

    } catch (error) {
        next(error);
    }
};
const updateStaffRole = async(req, res, next) =>{
        try{
            const { email, newRole } = req.body;
            const firm_id = req.user.firm_id;
            if(!email || !newRole){
                throw new ApiError(400, 'Email and new role are required');
            }
            if(!['STAFF', 'ADMIN'].includes(newRole.toUpperCase())){
                throw new ApiError(400, 'Invalid role specified. Must be STAFF or ADMIN.');
            }
            const user = await User.findByEmail(email);
            if(!user){
                throw new ApiError(404, 'User not found');
            }
            if(user.firm_id !== firm_id){
                throw new ApiError(403, 'Forbidden: Cannot change role of user from another firm');
            }
            if(user.role === 'OWNER'){
                throw new ApiError(403, 'Forbidden: Cannot change role of OWNER');
            }
            if(user.role === newRole.toUpperCase()){
                throw new ApiError(400, `User already has the role ${newRole}`);
            }
            const affectedRows = await User.updateUserRole(newRole.toUpperCase(), user.id);
            if(affectedRows === 0){
                throw new ApiError(500, 'Failed to update user role');
            }
            return res.status(200)
                .json(new ApiResponse(200, 'User role updated successfully', {
                    email: user.email,
                    newRole: newRole.toUpperCase()
                }));

        }catch(error){
            next(error);
        }
};
const deactivateUserByPassword = async (req, res, next) => {
    try {
        const { email, newPassword } = req.body;
        const firm_id = req.user.firm_id;

        if (!email || !newPassword) {
            throw new ApiError(400, 'Email and new password are required');
        }
        const user = await User.findByEmail(email);
        if (!user) {
            throw new ApiError(404, 'User not found');
        }
        if (user.firm_id !== firm_id) {
            throw new ApiError(403, 'Forbidden: Cannot deactivate user from another firm');
        }
        if (user.role === 'OWNER') {
            throw new ApiError(403, 'Forbidden: Cannot deactivate OWNER');
        }
        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        const affectedRows = await User.updatePasswordById(newHashedPassword, user.id);
        if (affectedRows === 0) {
            throw new ApiError(500, 'Failed to deactivate user');
        }
        return res.status(200)
            .json(new ApiResponse(200, 'Password changed successfully', {
                email: user.email
            }));
        
}
catch (error) {
        next(error);
    }
};
const listFirmUser = async (req, res, next) => {
    try {
        const firm_id = req.user.firm_id;
        const users = await User.findByFirmId(firm_id);

        const usersWithoutPasswords = users.map((user)=>{
            const {password_hash,created_at,updated_at, ...userWithoutPassword} = user;
            return userWithoutPassword;
        });

        return res.status(200)
            .json(new ApiResponse(200, 'Firm users retrieved successfully', usersWithoutPasswords));
    } catch (error) {
        next(error);
    }
};
const myProfile = async (req, res, next) => {
    try{
        const userId = req.user.id;
        const user = await User.findById(userId);
        if(!user){
            throw new ApiError(404, 'User not found');
        }
        const {password_hash, created_at, updated_at, ...userWithoutPassword} = user;
        return res.status(200)
            .json(new ApiResponse(200, 'User profile retrieved successfully', userWithoutPassword));
    }
    catch(error){
        next(error);      
    }
};

export {
    registerStaff,
    updateStaffRole,
    deactivateUserByPassword,
    listFirmUser,
    myProfile    
};
  