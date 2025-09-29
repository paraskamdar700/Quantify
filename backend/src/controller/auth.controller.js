
// - registerFirmAndOwner() // Public - creates firm + owner

// - loginUser() // Public

// - logoutUser() // Protected

// - refreshToken() // Public

// - forgotPassword() // Public

// - resetPassword() // Public

import { Firm, User } from '../model/index.model.js';
import { ApiError } from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import database from '../config/database.js';
import bcrypt from 'bcryptjs';
import { cleanUpFiles } from '../utils/cleanUpFile.js';
import { uploadImage } from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';


const registerFirmAndOwner = async (req, res, next) => {

    const avatarLocalPath = req.files?.avatar?.[0]?.path;

    try {
        const { firmdata, userdata } = req.body;

        if (!firmdata?.firm_name || !firmdata?.gst_no) {
            throw new ApiError(400, "Firm name and GST number are required.");
        }
        
        if (!userdata?.fullname || !userdata?.email || !userdata?.password || !userdata?.contact_no) {
            throw new ApiError(400, "Full name, email, password, and contact number are required.");
        }

        const existingUser = await User.findByEmail(userdata.email);
        if (existingUser?.length > 0) {
            throw new ApiError(409, "User with this email already exists.");
        }

        const existingFirm = await Firm.findByFirmName(firmdata.firm_name);
        if (existingFirm?.length > 0) {
            throw new ApiError(409, "Firm with this name already exists.");
        }

        const uploadedAvatar = avatarLocalPath ? await uploadImage(avatarLocalPath) : null;

        const result = await database.transaction(async (transaction) => {
            const newFirm = await Firm.createFirm({
                firm_name: firmdata.firm_name,
                gst_no: firmdata.gst_no,
                firm_city: firmdata.firm_city || null,
                firm_street: firmdata.firm_street || null,
            }, { transaction });

            const hashedPassword = await bcrypt.hash(userdata.password, 10);

            const newOwner = await User.createUser({
                fullname: userdata.fullname,
                contact_no: userdata.contact_no,
                email: userdata.email,
                password_hash: hashedPassword,
                bio: userdata.bio || null,
                firm_id: newFirm.id,
                role: 'OWNER',
                avatar: uploadedAvatar?.secure_url || null,
            }, { transaction });

            return { firm: newFirm, user: newOwner };
        });

        const userResponse = { ...result.user.get({ plain: true }) };
        delete userResponse.password_hash;
        
       
        return res.status(201).json(
            new ApiResponse(201, "Firm and Owner registered successfully.", {
                firm: result.firm,
                user: userResponse,
            })
        );
    } catch (error) {
        next(error);
        
    } finally {
        if (avatarLocalPath) {
            cleanUpFiles(avatarLocalPath);
        }
    }
};