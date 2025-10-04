
// user.controller.js - User Management Only

// USER MANAGEMENT:
// - getFirmUsers()          // List firm users
// - listUsers()            // Protected - firm users only
// - getUserDetails()        // Get user info
// - getUserProfile()       // Protected - own profile

// PROFILE MANAGEMENT:
// - getMyProfile()          // Self profile
// - updateMyProfile()       // Self updates
// - changeMyPassword()      // Password change


import ApiError from "../utils/ApiError.js";
import { User, Firm} from "../model/index.model.js";
import bcrypt from "bcrypt";
import ApiResponse from "../utils/ApiResponse.js";
import database from "../config/database.js";


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
const deactivateUser = async (req, res, next) => {}


export {
    registerStaff,
    updateStaffRole
};
  