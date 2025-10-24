import { Order, OrderStock, Stock } from '../model/index.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import database from '../config/database.js';

const createOrder = async (req, res, next) => {
    try {
        const { customer_id, order_date, order_items, invoice_No } = req.body;
        const { firm_id, id: userId } = req.user;

        if (!customer_id || !order_items || !Array.isArray(order_items) || order_items.length === 0) {
            throw new ApiError(400, "Customer ID and a non-empty array of order items are required.");
        }

        const latestInvoiceNo = await Order.findLatestInvoiceNo(firm_id);

        if (invoice_No <= latestInvoiceNo) {
            throw new ApiError(400, `Invoice number must be greater than the latest invoice number (${latestInvoiceNo}).`);
        }
        const one = 1;
        const invoice_no = !invoice_No ? latestInvoiceNo + one : invoice_No;

        const now = new Date();
        const defaultDate = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
        const order_date_final = order_date || defaultDate;

        const finalOrder = await database.transaction(async (transaction) => {
        
            const orderData = { customer_id, firm_id, created_by: userId, order_date: order_date_final, invoice_no };
            const newOrder = await Order.createOrder(orderData, { transaction });
            
            for (const item of order_items) {
                const availableQuantity = await Stock.quantityAvailable(item.stock_id, item.quantity);
                if (availableQuantity.quantity_available < item.quantity) {
                    throw new ApiError(400, `Insufficient stock for item ${availableQuantity.stock_name}. Available: ${availableQuantity.quantity_available}, Required: ${item.quantity}`);
                }
                await OrderStock.createOrderStock({
                    order_id: newOrder.id,
                    stock_id: item.stock_id,
                    quantity: item.quantity,
                    selling_price: item.selling_price
                }, { transaction });

                await Stock.adjustQuantity(item.stock_id, firm_id, -item.quantity, { transaction });
            }

            const totalAmount = await OrderStock.calculateTotalAmount(newOrder.id, { transaction });
            return await Order.updateById(newOrder.id, firm_id, { total_amount: totalAmount }, { transaction });
        });
        const createdOrderResponse = {
            id: finalOrder.id,
            customer_id: finalOrder.customer_id,
            firm_id: finalOrder.firm_id,
            created_by: finalOrder.created_by,
            order_date: finalOrder.order_date,
            invoice_no: `INV-${now.getFullYear()}-${String(finalOrder.invoice_no).padStart(4, '0')}`,
            order_status: finalOrder.order_status,
            payment_status: finalOrder.payment_status,
            delivery_status: finalOrder.delivery_status,
            total_amount: finalOrder.total_amount,
        }

        return res.status(201).json(
            new ApiResponse(201, "Order created successfully", createdOrderResponse)
        );

    } catch (error) {
        next(error);
    }
};

const getOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { firm_id } = req.user;

        const order = await Order.findById(id, firm_id);
        
        if (!order) {
            throw new ApiError(404, "Order not found.");
        }

        const items = await OrderStock.findByOrderId(id);
        
        // (IMPORTANT)In a full app, you would also fetch payments and deliveries here
        // And Formate the Response Later Accordingly
        const responseData = { ...order, items };

        return res.status(200).json(
            new ApiResponse(200, "Order retrieved successfully", responseData)
        );
    } catch (error) {
        next(error);
    }
};

const listOrders = async (req, res, next) => {
    try {
        const { firm_id } = req.user;
        const { order_status, payment_status, delivery_status } = req.query;
        console.log(req.query);
        console.log(req.user.firm_id);

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const filters = {};
        if (order_status) filters.order_status = order_status;
        if (payment_status) filters.payment_status = payment_status;
        if (delivery_status) filters.delivery_status = delivery_status;

        const paginatedResult = await Order.findAllByFirmId(firm_id, filters, { limit, offset });
        
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
            new ApiResponse(200, "Orders retrieved successfully", responseData)
        );
    } catch (error) {
        next(error);
    }
};

const updateOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { firm_id } = req.user;
        const { order_date, invoice_no } = req.body;

        if (order_date === undefined && invoice_no === undefined) {
            throw new ApiError(400, "No fields to update were provided.");
        }

        const order = await Order.findById(id, firm_id);
        if (!order) {
            throw new ApiError(404, "Order not found.");
        }
        
        const updateData = {};
        if (order_date) updateData.order_date = order_date;
        if (invoice_no) updateData.invoice_no = invoice_no;

        const updatedOrder = await Order.updateById(id, firm_id, updateData);
        if (!updatedOrder) {
            throw new ApiError(500, "Failed to update order details.");
        }

        return res.status(200).json(
            new ApiResponse(200, "Order updated successfully", updatedOrder)
        );

    } catch (error) {
        next(error);
    }
};
// This controller is yet to be test 
const cancelOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { firm_id } = req.user;

        const updatedOrder = await database.transaction(async (transaction) => {
            const order = await Order.findById(id, firm_id, { transaction });
            if (!order) {
                throw new ApiError(404, "Order not found.");
            }
            if (order.order_status === 'COMPLETED' || order.order_status === 'CANCELLED') {
                throw new ApiError(400, `Cannot cancel an order that is already ${order.order_status}.`);
            }

            const itemsToRestock = await OrderStock.findByOrderId(id, { transaction });
            for (const item of itemsToRestock) {
                await Stock.adjustQuantity(item.stock_id, firm_id, item.quantity, { transaction });
            }
            
            return await Order.updateById(id, firm_id, { order_status: 'CANCELLED' }, { transaction });
        });

        return res.status(200).json(
            new ApiResponse(200, "Order cancelled successfully", updatedOrder)
        );

    } catch (error) {
        next(error);
    }
};


export {
    createOrder,
    getOrder,
    listOrders,
    updateOrder,
    cancelOrder
};

