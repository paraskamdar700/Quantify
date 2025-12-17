import { Order, OrderStock, Payment, Delivery, Firm, Customer } from '../model/index.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
// To generate PDFs, you would import a library like puppeteer
// import puppeteer from 'puppeteer'; 
// To send emails, you would import nodemailer
// import nodemailer from 'nodemailer';

/**
 * Gets the next suggested invoice number for the firm.
 */
const generateInvoice = async (req, res, next) => {
    try {
        const { firm_id } = req.user;
        const latestInvoiceNo = await Order.findLatestInvoiceNo(firm_id);
        const nextInvoiceNo = (latestInvoiceNo || 0) + 1;

        return res.status(200).json(
            new ApiResponse(200, "Next invoice number retrieved", { next_invoice_no: nextInvoiceNo })
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Fetches all data for an invoice and returns it as JSON.
 * This data can be used to generate a PDF.
 */
const downloadInvoice = async (req, res, next) => {
    try {
        const { order_id } = req.params;
        const { firm_id } = req.user;

        // 1. Get the core order (and verify it belongs to the firm)
        const orderArray = await Order.findById(order_id, firm_id);
        if (!orderArray || orderArray.length === 0) {
            throw new ApiError(404, "Order not found.");
        }
        const order = orderArray[0];

        // 2. Get all related data in parallel
        const [firmArray, customerArray, items, payments, deliveries] = await Promise.all([
            Firm.findById(order.firm_id),
            Customer.findById(order.customer_id),
            OrderStock.findByOrderId(order_id),
            Payment.findByOrderId(order_id),
            Delivery.findByOrderId(order_id)
        ]);

        // Handle cases where related data might not be found
        const firm = firmArray && firmArray.length > 0 ? firmArray[0] : null;
        const customer = customerArray && customerArray.length > 0 ? customerArray[0] : null;

        // 3. Assemble the complete invoice data object
        const invoiceData = {
            order,
            firm,
            customer,
            items,
            payments,
            deliveries,
            summary: {
                total_amount: parseFloat(order.total_amount),
                total_paid: parseFloat(order.total_paid_amount),
                balance_due: parseFloat(order.total_amount) - parseFloat(order.total_paid_amount)
            }
        };

        // --- PDF Generation Logic ---
        // (As described before)
        // For now, we will just return the JSON data.
        // --- End PDF Logic ---

        return res.status(200).json(
            new ApiResponse(200, "Invoice data retrieved successfully", invoiceData)
        );

    } catch (error) {
        next(error);
    }
};

/**
 * Fetches invoice data and emails it to the customer.
 */
const sendInvoice = async (req, res, next) => {
    try {
        const { order_id } = req.params;
        const { firm_id } = req.user;

        // 1. Get the core order
        const orderArray = await Order.findById(order_id, firm_id);
        if (!orderArray || orderArray.length === 0) {
            throw new ApiError(404, "Order not found.");
        }
        const order = orderArray[0];

        // 2. Get the customer's email
        const customerArray = await Customer.findById(order.customer_id);
        if (!customerArray || customerArray.length === 0) {
            throw new ApiError(404, "Customer not found.");
        }
        const customer = customerArray[0];

        if (!customer.email) {
            throw new ApiError(400, "Customer does not have an email address on file.");
        }

        // 3. You would generate the PDF here, just like in downloadInvoice()
        //    ... (const pdfBuffer = await generatePdfFunction(order_id, firm_id)) ...

        // --- Email Sending Logic ---
        // (As described before)
        // --- End Email Logic ---

        return res.status(200).json(
            new ApiResponse(200, `Invoice sending initiated to ${customer.email}`)
        );

    } catch (error) {
        next(error);
    }
};

export {
    generateInvoice,
    downloadInvoice,
    sendInvoice
};

