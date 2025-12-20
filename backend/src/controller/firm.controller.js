
import ApiError from "../utils/ApiError.js";
import { User, Firm } from "../model/index.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import database from "../config/database.js";

// FIRM MANAGEMENT:
const getMyFirm = async (req, res) => {
    try {
        const firmId = req.user.firm_id;
        if (!firmId) {
            throw new ApiError(404, 'Firm ID not found in user token');
        }
        const firm = await Firm.findById(firmId);
        if (!firm) {
            throw new ApiError(404, 'Firm not found');
        }
        const { created_at, updated_at, ...firmData } = firm;
        return res.status(200)
            .json(new ApiResponse(200, 'Firm details retrieved successfully', firmData));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, 'Internal Server Error', error.message));
    }
};

const updateFirmDetails = async (req, res) => {
    try {
        const firmId = req.user.firm_id;
        if (!firmId) {
            throw new ApiError(404, 'Firm ID not found in user token');
        }
        const { firm_name, gst_no, firm_city, firm_street } = req.body;
        const existingFirm = await Firm.findById(firmId);
        if (!existingFirm) {
            throw new ApiError(404, 'Firm not found');
        }
        if (gst_no && gst_no !== existingFirm.gst_no) {
            const gstConflict = await Firm.findByGst(gst_no);
            if (gstConflict) {
                throw new ApiError(409, 'GST number already in use by another firm');
            }
        }
        const updatedFirmData = {
            firm_name: firm_name || existingFirm.firm_name,
            gst_no: gst_no || existingFirm.gst_no,
            firm_city: firm_city || existingFirm.firm_city,
            firm_street: firm_street || existingFirm.firm_street
        };
        const updatedRows = await Firm.updateFirmById(updatedFirmData, firmId);
        if (updatedRows === 0) {
            throw new ApiError(500, 'Failed to update firm details');
        }
        const updatedFirm = await Firm.findById(firmId);
        return res.status(200)
            .json(new ApiResponse(200, 'Firm details updated successfully', updatedFirm));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, 'Internal Server Error', error.message));
    }
};

/* for this delete firm controller you need to work on transaction because if
 firm is deleted then all users of that firm including all the 
 table foreign key should be deleted which was related to firm*/

const deleteFirm = async (req, res) => {
    try {
        const firmId = req.user.firm_id;
        if (!firmId) {
            throw new ApiError(404, 'Firm ID not found in user token');
        }
        const existingFirm = await Firm.findById(firmId);
        if (!existingFirm) {
            throw new ApiError(404, 'Firm not found');
        }
        // Optional: Check for dependent records (users, orders, etc.) before deletion
        const deletedRows = await Firm.deleteFirmById(firmId);
        if (deletedRows === 0) {
            throw new ApiError(500, 'Failed to delete firm');
        }
        return res.status(200)
            .json(new ApiResponse(200, 'Firm deleted successfully'));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, 'Internal Server Error', error.message));
    }
};
// EXPORT FIRM CONTROLLER FUNCTIONS
export {
    getMyFirm,
    updateFirmDetails,
    deleteFirm
};








// firm.controller.js - Analytics & Dashboard

// DASHBOARD ROUTES:
// - getFirmDashboard()      // Main dashboard with overview
// - getFirmStatistics()     // Key metrics and numbers
// - getRevenueAnalytics()   // Revenue charts and trends
// - getSalesReports()       // Sales performance reports
// - getInventorySummary()   // Stock levels, low stock alerts
// - getCustomerAnalytics()  // Customer growth, retention

// // BUSINESS INTELLIGENCE:
// - getOrderAnalytics()     // Order volume, status distribution
// - getPaymentReports()     // Payment collection, pending amounts
// - getPerformanceMetrics() // Business performance indicators