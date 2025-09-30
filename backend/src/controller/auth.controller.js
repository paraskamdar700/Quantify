
// - registerFirmAndOwner() // Public - creates firm + owner

// - loginUser() // Public

// - logoutUser() // Protected

// - refreshToken() // Public

// - forgotPassword() // Public

// - resetPassword() // Public

import { Firm, User } from '../model/index.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import database from '../config/database.js';
import bcrypt from 'bcrypt';
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
            console.log('Firm created:', firm);
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
            console.log('User created:', user);
            return { firm, user }
        });
        
        console.log('Transaction result:', result);

        
        res.status(201).json(
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

export { registerFirmAndOwner };