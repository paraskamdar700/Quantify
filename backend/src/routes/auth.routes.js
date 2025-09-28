import express from 'express'
import {} from './controller/auth.controller.js'

const router = express.Router();

router.post('/register').post(registerFirmAndOwner);
router.post('/').post(loginUser);
router.post('/').post(logoutUser);
router.post('/').post(refreshToken);
router.post('/').post(forgerPassword);
router.post('/').post(resetPassword);


const registerFirmAndOwner = async (err, req, res, next) =>{
    try{

    }
    catch(error){
        
        next(error);
    }
};