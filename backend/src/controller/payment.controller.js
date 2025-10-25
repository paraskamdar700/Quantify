import { Order, Payment } from '../model/index.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import database from '../config/database.js';


const updateOrderStatus = async (order_id, firm_id, transaction) => {
    const order = await Order.findById(order_id, firm_id, { transaction });
    if (!order) throw new ApiError(404, "Order not found during status update.");

    const totalPaid = await Payment.calculateTotalPaid(order_id, { transaction });

    let newPaymentStatus = 'UNPAID';

    if (totalPaid >= order[0].total_amount) {
        newPaymentStatus = 'PAID';
    } else if (totalPaid > 0) {
        newPaymentStatus = 'PARTIALLY_PAID';
    }

    let newOrderStatus = 'PENDING';
    if (newPaymentStatus === 'PAID' && order[0].delivery_status === 'DELIVERED') {
        newOrderStatus = 'COMPLETED';
    }

    return await Order.updateById(order_id, firm_id, {
        total_paid_amount: totalPaid,
        payment_status: newPaymentStatus,
        order_status: newOrderStatus
    }, { transaction });
};

const generatePaymentReference = () => {
    return 'PAY-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
};

const recordPayment = async (req, res, next) => {
    try {
        const { order_id, amount_paid, payment_method, remarks, payment_date } = req.body;
        const { firm_id } = req.user;

        const reference_no = generatePaymentReference();

        if (!order_id || !amount_paid || !payment_method) {
            throw new ApiError(400, "order_id, amount_paid, and payment_method are required.");
        }

        const updatedOrder = await database.transaction(async (transaction) => {
            const [order] = await Order.findById(order_id, firm_id, { transaction });
            if (!order) {
                throw new ApiError(404, "Order not found.");
            }

            await Payment.create({
                order_id,
                firm_id,
                customer_id: order.customer_id,
                amount_paid,
                payment_method,
                reference_no,
                remarks,
                payment_date: payment_date || new Date()
            }, { transaction });

            return await updateOrderStatus(order_id, firm_id, transaction);
        });

        const payments = await Payment.findByOrderId(order_id);
        return res.status(201).json(
            new ApiResponse(201, "Payment recorded successfully", { order: updatedOrder, payments })
        );

    } catch (error) {
        next(error);
    }
};

const listOrderPayments = async (req, res, next) => {
    try {
        const { order_id } = req.params;
        const { firm_id } = req.user;

        const order = await Order.findById(order_id, firm_id);
        if (!order) {
            throw new ApiError(404, "Order not found.");
        }

        const payments = await Payment.findByOrderId(order_id);
        return res.status(200).json(
            new ApiResponse(200, "Payments retrieved successfully", payments)
        );
    } catch (error) {
        next(error);
    }
};

const getPayment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { firm_id } = req.user;

        const payment = await Payment.findById(id, firm_id);
        if (!payment) {
            throw new ApiError(404, "Payment record not found.");
        }

        return res.status(200).json(
            new ApiResponse(200, "Payment retrieved successfully", payment)
        );
    } catch (error) {
        next(error);
    }
};

const updatePayment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amount_paid, payment_method, reference_no, remarks, payment_date } = req.body;
        const { firm_id } = req.user;

        const updateData = {};
        if (amount_paid !== undefined) updateData.amount_paid = amount_paid;
        if (payment_method !== undefined) updateData.payment_method = payment_method;
        if (reference_no !== undefined) updateData.reference_no = reference_no;
        if (remarks !== undefined) updateData.remarks = remarks;
        if (payment_date !== undefined) updateData.payment_date = payment_date;

        if (Object.keys(updateData).length === 0) {
            throw new ApiError(400, "No fields to update.");
        }

        const [updatedOrder] = await database.transaction(async (transaction) => {
            const [payment] = await Payment.findById(id, firm_id, { transaction });
            if (!payment) {
                throw new ApiError(404, "Payment record not found.");
            }

            await Payment.updateById(id, updateData, { transaction });
          
            return await updateOrderStatus(payment.order_id, firm_id, transaction);
        });
        
        const payments = await Payment.findByOrderId(updatedOrder.id);
        return res.status(200).json(
            new ApiResponse(200, "Payment updated successfully", { order: updatedOrder, payments })
        );

    } catch (error) {
        next(error);
    }
};

const deletePayment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { firm_id } = req.user;

        const [updatedOrder] = await database.transaction(async (transaction) => {
            const [payment] = await Payment.findById(id, firm_id, { transaction });
            if (!payment) {
                throw new ApiError(404, "Payment record not found.");
            }

            await Payment.removeById(id, { transaction });

            return await updateOrderStatus(payment.order_id, firm_id, transaction);
        });
        const payments = await Payment.findByOrderId(updatedOrder.id);
        return res.status(200).json(
            new ApiResponse(200, "Payment deleted successfully", { order: updatedOrder, payments })
        );

    } catch (error) {
        next(error);
    }
};

const getPendingPayments = async (req, res, next) => {
    try {
        const { firm_id } = req.user;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        // This function in your order.model.js is still the most efficient query
        const paginatedResult = await Order.findOrdersWithPendingPayment(firm_id, { limit, offset });
        const { rows: orders, totalCount } = paginatedResult;

        const totalPages = Math.ceil(totalCount / limit);
        const responseData = {
            orders,
            pagination: {
                totalItems: totalCount,
                totalPages,
                currentPage: page,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };

        return res.status(200).json(
            new ApiResponse(200, "Orders with pending payments retrieved", responseData)
        );
    } catch (error) {
        next(error);
    }
};

const getPaymentSummary = async (req, res, next) => {
    try {
        const { order_id } = req.params;
        const { firm_id } = req.user;

        // This function is now much faster!
        const order = await Order.findById(order_id, firm_id);
        if (!order) {
            throw new ApiError(404, "Order not found.");
        }

        // We no longer need to calculate this. We just read it.
        // const totalPaid = await Payment.calculateTotalPaid(order_id);
        const totalPaid = order.total_paid_amount; // <-- UPDATED
        
        // This calculation now correctly shows a negative balance if overpaid
        const balanceDue = order.total_amount - totalPaid;

        const summary = {
            order_id: order.id,
            total_amount: order.total_amount,
            total_paid: totalPaid,
            balance_due: balanceDue, // will be negative if overpaid
            payment_status: order.payment_status
        };

        return res.status(200).json(
            new ApiResponse(200, "Payment summary retrieved", summary)
        );
    } catch (error) {
        next(error);
    }
};

export {
    recordPayment,
    listOrderPayments,
    getPayment,
    updatePayment,
    deletePayment,
    getPendingPayments,
    getPaymentSummary
};

