import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import database from "../config/database.js";
import { Firm, User, Customer } from "../model/index.model.js";

const addCustomer = async (req, res, next) => {
    try {
        const { fullname, firm_name, contact_no, gst_no, city, street } = req.body;
        const firm_id = req.user.firm_id;
        console.log(firm_id);
        if (!fullname || !firm_name) {
            throw new ApiError(400, "fullname & Firm name is missing");
        }
        const existingFirm = await Customer.findByFirm(firm_name);
        if (existingFirm) {
            throw new ApiError(409, "Firm name already exists");
        }
        const customer = await Customer.createCustomer({
            fullname,
            firm_name,
            contact_no: contact_no || null,
            gst_no: gst_no || null,
            city: city || null,
            street: street || null,
            firm_id
        });
        if (!customer) {
            throw new ApiError(500, "Unable to create customer");
        }
        const { created_at, updated_at, ...customerData } = customer;
        res.status(201)
            .json(new ApiResponse(201, "Customer created successfully", customerData));

    } catch (error) {
        next(error);
    }
};
const getCustomers = async (req, res, next) => {
    try {
        const firm_id = req.user.firm_id;
        const customers = await Customer.findById(firm_id);
        res.status(200).json(new ApiResponse(200, "Customers retrieved successfully", customers));
    }
    catch (error) {
        next(error);
    }
};

const searchCustomers = async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name) {
            throw new ApiError(400, "Search term is missing");
        }
        const customers = await Customer.findByNameSearch(name);
        res.status(200).json(new ApiResponse(200, "Search completed successfully", customers));
    } catch (error) {
        next(error);
    }
};
const updateCustomer = async (req, res, next) => {
    try {
        const { updatedCustomer } = req.body;
        const firm_id = req.user.firm_id;
        if (!updatedCustomer) {
            throw new ApiError(400, "No data provided for update");
        }
        if (updatedCustomer.firm_name) {
            const existingFirm = await Customer.findByFirm(updatedCustomer.firm_name);
            if (existingFirm && existingFirm.firm_id !== firm_id) {
                throw new ApiError(409, "Firm name already exists");
            }
        }
        // Implementation for updating a customer
        const { id } = req.params;
        const existingCustomer = await Customer.findById(id);
        if (!existingCustomer) {
            throw new ApiError(404, 'Customer not found');
        }
        const updatedcustomer = {
            fullname: updatedCustomer.fullname || existingCustomer.fullname,
            firm_name: updatedCustomer.firm_name || existingCustomer.firm_name,
            contact_no: updatedCustomer.contact_no || existingCustomer.contact_no,
            gst_no: updatedCustomer.gst_no || existingCustomer.gst_no,
            city: updatedCustomer.city || existingCustomer.city,
            street: updatedCustomer.street || existingCustomer.street,
            firm_id: existingCustomer.firm_id
        }

        const updated = await Customer.updateCustomer(id, updatedcustomer);
        res.status(200).json(new ApiResponse(200, 'Customer updated successfully', updated));
    } catch (error) {
        next(error);
    }

};
//deleteCustomer controller will be implemented later when all child tables of customer will be created
const deleteCustomer = async (req, res, next) => {
    // Implementation for deleting a customer
};

export {
    addCustomer,
    getCustomers,
    searchCustomers,
    updateCustomer,
    deleteCustomer
};