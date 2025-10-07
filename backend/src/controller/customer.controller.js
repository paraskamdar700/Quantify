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
        const customers = await Customer.findByFirmId(firm_id);
        res.status(200).json(new ApiResponse(200, "Customers retrieved successfully", customers));
    }
    catch (error) {
        next(error);
    }
};

const searchCustomers = async (req, res, next) => {
    try {
        const { q } = req.query; 
        if (!q) {
            throw new ApiError(400, "Search query parameter 'q' is missing");
        }
        const customers = await Customer.searchByNameOrFirm(q);
        if (customers.length === 0) {
            throw new ApiError(200, "No customers found matching your search.");
        }
            const customData = customers.map((customer)=>{
                const {created_at, updated_at, ...customerData} = customer;
                return customerData;
            })
        res.status(200).json(new ApiResponse(200, "Customers retrieved successfully", customData));

    } catch (error) {
        next(error);
    }
};

const updateCustomer = async (req, res, next) => {
    try {
        const { id } = req.params; 
        const firmId = req.user.firm_id; 
        const { fullname, firm_name, contact_no, gst_no, city, street } = req.body;
        const updateData = { fullname, firm_name, contact_no, gst_no, city, street };
        if (!id) {
            throw new ApiError(400, "Customer ID is required.");
        }

        if (Object.keys(updateData).length === 0) {
            throw new ApiError(400, "No data provided for update.");
        }

        const existingCustomer = await Customer.findById(id);
        if (!existingCustomer || existingCustomer[0].firm_id !== firmId) {
            throw new ApiError(404, 'Customer not found for this firm.');
        }
        if(updateData.fullname === existingCustomer[0].fullname &&
            updateData.firm_name === existingCustomer[0].firm_name &&
            updateData.contact_no === existingCustomer[0].contact_no &&
            updateData.gst_no === existingCustomer[0].gst_no &&
            updateData.city === existingCustomer[0].city &&
            updateData.street === existingCustomer[0].street){
                throw new ApiError(400, "No changes detected in the update data.");
            }
        const updatedcustomer = {
            fullname: updateData.fullname || existingCustomer.fullname,
            firm_name: updateData.firm_name || existingCustomer.firm_name,
            contact_no: updateData.contact_no || existingCustomer.contact_no,
            gst_no: updateData.gst_no || existingCustomer.gst_no,
            city: updateData.city || existingCustomer.city,
            street: updateData.street || existingCustomer.street,
            firm_id: existingCustomer[0].firm_id
        }

        const updatedCustomer = await Customer.updateCustomer(id, updatedcustomer);

        if (!updatedCustomer) {
            throw new ApiError(404, 'Customer not found or no changes were made.');
        }

        res.status(200).json(new ApiResponse(200, 'Customer updated successfully', updatedCustomer));

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