import { Order, OrderStock, Stock } from '../model/index.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import database from '../config/database.js';

const addOrderItem = async (req, res, next) => {
    try {
        const { order_id, stock_id, quantity, selling_price } = req.body;
        const { firm_id } = req.user;

        if (!order_id || !stock_id || !quantity || selling_price === undefined) {
            throw new ApiError(400, "order_id, stock_id, quantity, and selling_price are required.");
        }

        const updatedOrder = await database.transaction(async (transaction) => {

            const order = await Order.findById(order_id, firm_id, { transaction });
            if (!order) {
                throw new ApiError(404, "Parent order not found.");
            }

            await OrderStock.createOrderStock({ order_id, stock_id, quantity, selling_price }, { transaction });

            await Stock.adjustQuantity(stock_id, firm_id, -quantity, { transaction });

            const totalAmount = await OrderStock.calculateTotalAmount(order_id, { transaction });
            const updatedOrder = await Order.updateById(order_id, firm_id, { total_amount: totalAmount }, { transaction });
            const [orderItems] = await OrderStock.findByOrderId(order_id, { transaction });
            updatedOrder[0].items = orderItems;
            return updatedOrder;
        });

        return res.status(201).json(
            new ApiResponse(201, "Item added to order successfully", updatedOrder)
        );

    } catch (error) {
        next(error);
    }
};

const updateOrderItem = async (req, res, next) => {
    try {
        const { id } = req.params; // This is the order_stock ID
        const { quantity, selling_price } = req.body;
        const { firm_id } = req.user;

        if (quantity === undefined && selling_price === undefined) {
            throw new ApiError(400, "Either quantity or selling_price must be provided.");
        }

        const updatedOrder = await database.transaction(async (transaction) => {
            const [originalItem] = await database.query('SELECT * FROM order_stock WHERE id = ?', [id], { transaction });
            if (!originalItem) {
                throw new ApiError(404, "Order item not found.");
            }
        
            const order = await Order.findById(originalItem.order_id, firm_id, { transaction });
            if (!order) {
                throw new ApiError(403, "Forbidden: You do not have permission to access this order item.");
            }
        
            const quantityDifference = (quantity || originalItem.quantity) - originalItem.quantity;

            const updateData = {};
        
            updateData.quantity = quantity || originalItem.quantity;
            updateData.selling_price = selling_price || originalItem.selling_price;

           const updateditem =  await OrderStock.updateById(id, updateData, { transaction });

            if (quantityDifference !== 0) {
                await Stock.adjustQuantity(originalItem.stock_id, firm_id, -quantityDifference, { transaction });
            }

            const totalAmount = await OrderStock.calculateTotalAmount(originalItem.order_id, { transaction });

            return await Order.updateById(originalItem.order_id, firm_id, { total_amount: totalAmount }, { transaction });
        });

        return res.status(200).json(
            new ApiResponse(200, "Order item updated successfully", updatedOrder)
        );
    } catch (error) {
        next(error);
    }
};
// In this controller need to handle the quantity delivered has to delete for the table  
const removeOrderItem = async (req, res, next) => {
    try {
        const { id } = req.params; // This is the order_stock ID
        const { firm_id } = req.user;

        const updatedOrder = await database.transaction(async (transaction) => {
    
            const [itemToRemove] = await database.query('SELECT * FROM order_stock WHERE id = ?', [id], { transaction });
            if (!itemToRemove) {
                throw new ApiError(404, "Order item not found.");
            }

            const order = await Order.findById(itemToRemove.order_id, firm_id, { transaction });
            if (!order) {
                throw new ApiError(403, "Forbidden: You do not have permission to access this order item.");
            }

            await OrderStock.removeById(id, { transaction });
            
            await Stock.adjustQuantity(itemToRemove.stock_id, firm_id, itemToRemove.quantity, { transaction });

            const totalAmount = await OrderStock.calculateTotalAmount(itemToRemove.order_id, { transaction });
            return await Order.updateById(itemToRemove.order_id, firm_id, { total_amount: totalAmount }, { transaction });
        });

        return res.status(200).json(
            new ApiResponse(200, "Item removed from order successfully", updatedOrder)
        );

    } catch (error) {
        next(error);
    }
};

const getOrderItems = async (req, res, next) => {
    try {
        const { order_id } = req.params;
        const { firm_id } = req.user;

        // Verify the order belongs to the user's firm before fetching items
        const order = await Order.findById(order_id, firm_id);
        if (!order) {
            throw new ApiError(404, "Order not found.");
        }

        const items = await OrderStock.findByOrderId(order_id);
        return res.status(200).json(
            new ApiResponse(200, "Order items retrieved successfully", items)
        );

    } catch (error) {
        next(error);
    }
};

export {
    addOrderItem,
    updateOrderItem,
    removeOrderItem,
    getOrderItems
};

