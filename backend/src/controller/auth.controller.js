import { Firm, User } from '../model/index.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import database from '../config/database.js';
import bcrypt from 'bcrypt';
import { cleanUpFiles } from '../utils/cleanUpFile.js';
import { uploadImage } from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';


// --- Helper Functions for Token Generation ---
const generateAccessToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role,
            firmId: user.firm_id
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_EXPIRES_IN,
        }
    );
};
const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_EXPIRES_IN,
        }
    );
};
// --- Controller Functions ---
const registerFirmAndOwner = async (req, res, next) => {
    const avatarLocalPath = req.files?.avatar?.[0]?.path;

    try {
        const { firmdata, userdata } = req.body;

        if (!firmdata?.firm_name || !firmdata?.gst_no) {
            
            throw new ApiError(400, "Firm name and GST number are required.");
        }
        if (!userdata?.fullname || !userdata?.email || !userdata?.password_hash || !userdata?.contact_no) {
           
            throw new ApiError(400, "Full name, email, password, and contact number are required.");
        }

        const existingUser = await User.findByEmail(userdata.email);
        const existingFirms = await Firm.findByFirmName(firmdata.firm_name);
          
            if (existingUser?.length > 0 && existingFirms?.length > 0) {
                throw new ApiError(409, "User with this email and firm with this name already exists.");
            }

 
        const uploadedAvatar = avatarLocalPath ? await uploadImage(avatarLocalPath) : null;

        const result = await database.transaction(async (transaction) => {
            const firm = await Firm.createFirm({
                firm_name: firmdata.firm_name,
                gst_no: firmdata.gst_no,
                firm_city: firmdata.firm_city || null,
                firm_street: firmdata.firm_street || null
            }, { transaction });

            const user = await User.createUser({
                fullname: userdata.fullname,
                contact_no: userdata.contact_no,
                email: userdata.email,
                password_hash: await bcrypt.hash(userdata.password_hash, 10),
                bio: userdata.bio || null,
                firm_id: firm[0].id,
                role: 'OWNER',
                avatar: uploadedAvatar?.secure_url || null 
            }, { transaction });
            return { firm, user }
        });

        
       return res.status(201).json(
            new ApiResponse(201, "Firm and Owner registered successfully",
                {
                    firm: {
                        id: result.firm[0].id,
                        firm_name: result.firm[0].firm_name,
                        gst_no: result.firm[0].gst_no,
                        firm_city: result.firm[0].firm_city,
                        firm_street: result.firm[0].firm_street,

                    },
                    user: {
                        id: result.user[0].id,
                        fullname: result.user[0].fullname,
                        contact_no: result.user[0].contact_no,
                        email: result.user[0].email,
                        role: result.user[0].role,
                        avatar: result.user[0].avatar,
                        bio: result.user[0].bio
                    }
                }
            )
        );
    }
    catch (error) {
        
        next(error);
    }
    finally {
   
        if (avatarLocalPath) {
            cleanUpFiles(avatarLocalPath);
        }
    }
};
const loginUser = async (req, res, next) => {
    try {
        const email = req.body.email?.trim();
        const password = req.body.password?.trim();

        if (!email || !password) {
            throw new ApiError(400, "Email and password are required.");
        }

        const userArray = await User.findByEmail(email);

        if (!userArray || userArray.length === 0) {
            throw new ApiError(404, "User with this email does not exist.");
        }
        const user = userArray;

        const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordCorrect) {
            throw new ApiError(401, "Invalid credentials.");
        }

        const firmArray = await Firm.findById(user.firm_id);
        if (!firmArray || firmArray.length === 0) {
            throw new ApiError(404, "Associated firm for this user could not be found.");
        }
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        const firm = firmArray;

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'None',
            maxAge: 24 * 60 * 60 * 1000
        };
        const userResponse = {
            id: user.id,
            email: user.email,
            fullname: user.fullname,
            role: user.role,
            bio: user.bio,
            avatar: user.avatar

        };
        const firmResponse = {
            firm_id: firm.firm_id,
            firm_name: firm.firm_name,
            gst_no: firm.gst_no,
            firm_city: firm.firm_city,
            firm_street: firm.firm_street
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json({
                success: true,
                message: "User logged in successfully",
                data: {
                    user: userResponse,
                    firm: firmResponse
                }
            });

    } catch (error) {
        next(error);
    }
};
const refreshToken = async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) {
            throw new ApiError(400, "Invalid request refresh token not found");
        }
        const decode = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        if (!decode?.userId) {
            throw new ApiError(401, "Invalid token");
        }
            
        const userobj = await User.findById(decode.userId);
            
        
        const user =userobj;
        const userResponse ={
            id:userobj.id,
            email:userobj.email,
            fullname:userobj.fullname,
            role:userobj.role,
            bio:userobj.bio,
            avatar:userobj.avatar
        }
        
        if (!user) {
            throw new ApiError(404, "User does not exist.");
        }
        const accessToken = generateAccessToken(user);
        
        return res.status(200)
                    .cookie("accessToken",accessToken)
                    .json({
                            success: true,
                            message: "Access token refreshed successfully",
                            data: {
                                user: userResponse,
                            }
                         });
        
    } catch (error) {
        next(error);
    }
}
const logoutUser = async (req, res, next) => {
    try
    {
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'None',
            maxAge: 0
        };
        return res.status(200)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, "User logged out successfully", null)
        );
    }
    catch (error) {
        next(error);
    }
};
const resetPassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = req.user;

        if (!newPassword || !currentPassword) {
            throw new ApiError(400, "Token and new password are required.");
        }
        const userobj = await User.findById(user.id);
        if (!userobj) {
            throw new ApiError(404, "User not found.");
        }
        const isMatch = await bcrypt.compare(currentPassword, userobj.password_hash);
        if (!isMatch) {
            throw new ApiError(401, "Current password is incorrect.");
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatedUser = await User.updatePasswordById(hashedPassword, user.id);
        if (updatedUser <= 0) {
            throw new ApiError(500, "Failed to update password. Please try again later.");
        }
        return res.status(200).json(
            new ApiResponse(200, "Password reset successfully", null)
        );


    } catch (error) {
        next(error);
    }
};
const updateAvatar = async (req, res, next) => {
    try {
        const avatarLocalPath = req.files?.avatar?.[0]?.path;
        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is required.");
        }

        const uploadedAvatar = await uploadImage(avatarLocalPath);
        if (!uploadedAvatar || !uploadedAvatar.secure_url) {
            throw new ApiError(500, "Failed to upload avatar. Please try again later.");
        }

        const updatedUser = await User.updateAvatarById(uploadedAvatar.secure_url, req.user.id);
        if (!updatedUser) {
            throw new ApiError(500, "Failed to update user avatar. Please try again later.");
        }

        return res.status(200).json(
            new ApiResponse(200, "User avatar updated successfully", {
                avatar: updatedUser
            })
        );
        
    } catch (error) {
        next(error);
    }
};
const updateBio = async (req, res, next) => {
    try {
        const { bio } = req.body;
        if (bio === undefined) {
            throw new ApiError(400, "Bio is required.");
        }
        const updatedUser = await User.updateBioById(bio, req.user.id);
        if (!updatedUser) {
            throw new ApiError(500, "Failed to update user bio. Please try again later.");
        }
        return res.status(200).json(
            new ApiResponse(200, "User bio updated successfully", {
                bio: updatedUser.bio
            })
        );        
    } catch (error) {
        next(error);
    }
};
const updateContact = async (req, res, next)=>{
    try{
        const {newContact} = req.body;
        if(!newContact){
            throw new ApiError(400,"new Contact is required");
        }
        const updatedContact = await User.updateContactNoById(newContact, req.user.id);
        if(!updatedContact){
            throw new ApiError(400,"Failed to update the contact No");
        }
        res.status(200)
        .json(new ApiResponse(200,"Contact no is updated successfully",{updatedContact:updatedContact.contact_no}));
    }catch(error){
        next(error);
    }
};
const updateFullName = async (req, res, next)=>{
    try{
        const {newFullName} = req.body;
        if(!newFullName){
            throw new ApiError(400,"new Full Name is required");
        }
        const updatedFullName = await User.updateFullNameById(newFullName, req.user.id);
        if(!updatedFullName){
            throw new ApiError(400,"Failed to update the Full Name");
        }
        res.status(200)
        .json(new ApiResponse(200,"Full Name is updated successfully",{updatedFullName:updatedFullName.fullname}));
    }catch(error){
        next(error);
    }
};
const updateEmail = async (req, res, next)=>{
    try{
        const {newEmail} = req.body;
        if(!newEmail){
            throw new ApiError(400,"new Email is required");
        }
        const updatedEmail = await User.updateEmailById(newEmail, req.user.id);
        if(!updatedEmail){
            throw new ApiError(400,"Failed to update the Email");
        }
        res.status(200)
        .json(new ApiResponse(200,"Email is updated successfully",{updatedEmail:updatedEmail.email}));
    }
    catch(error){
        next(error);
    }
};
const getCurrentUser = async (req, res, next) => {
    try {
        const user = req.user;
        if(!user){
            throw new ApiError(400,"User Authorization failed");
        }
        const result = await database.transaction(async (transaction) =>{
                const userobj = await User.findById(user.id, {transaction});
                const firmobj = await Firm.findById(userobj[0].firm_id, {transaction});
            return {firm: firmobj, user: userobj};
        });
        if(!result || !result.user || result.user.length === 0){
            throw new ApiError(404,"User not found");
        }
        if(!result.firm || result.firm.length === 0){
            throw new ApiError(404,"Firm not found");
        }

        const userResponse = {
            id: result.user[0].id,
            email: result.user[0].email,
            fullname: result.user[0].fullname,
            role: result.user[0].role,
            bio: result.user[0].bio,
            avatar: result.user[0].avatar
        }
        const firmResponse = result.firm[0];
        return res.status(200).json(
            new ApiResponse(200, "User details fetched successfully", {
                user: userResponse,
                firm: firmResponse
            })
        );
    }catch(error){
        next(error);
    }
};
export { registerFirmAndOwner, 
            loginUser, 
            refreshToken, 
            logoutUser, 
            resetPassword, 
            updateAvatar,
            updateBio,
            updateContact,
            updateFullName,
            updateEmail,
            getCurrentUser
        };