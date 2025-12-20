import { Order, OrderStock, Delivery } from '../model/index.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import database from '../config/database.js';

/**
 * HELPER 1: Updates the `order_stock` item's `quantity_delivered` field.
 * This is called after any change in the delivery table.
 */
const updateOrderStockStatus = async (orderStockId, firmId, transaction) => {
    // 1. Calculate the new total delivered quantity for this item
    const totalDelivered = await Delivery.calculateTotalDelivered(orderStockId, { transaction });
    // 2. Update the order_stock item with this new total
   const result = await OrderStock.updateById(orderStockId, { quantity_delivered: totalDelivered }, { transaction });
    
    if (!result) {
        throw new ApiError(404, "Order item not found during status update.");
    }
    return result.order_id;
};

/**
 * HELPER 2: Updates the parent `ORDERS` table's delivery & overall status.
 * This is called after an order_stock item has been updated.
 */
const updateOrderStatus = async (orderId, firmId, transaction) => {
    // 1. Get all items for the order
    const items = await OrderStock.findAllByOrderId(orderId, { transaction });
    
    let totalItems = items.length;
    let deliveredItems = 0;
    let partiallyDeliveredItems = 0;
    for (const item of items) {
        if (parseFloat(item.quantity_delivered) >= parseFloat(item.quantity)) {
            deliveredItems++;
        } else if (parseFloat(item.quantity_delivered) > 0) {
            partiallyDeliveredItems++;
        }
    }

    // 2. Determine new delivery_status
    let newDeliveryStatus = 'PENDING';
    if (totalItems > 0 && deliveredItems === totalItems) {
        newDeliveryStatus = 'DELIVERED';
    } else if (deliveredItems > 0 || partiallyDeliveredItems > 0) {
        newDeliveryStatus = 'PARTIALLY_DELIVERED';
    }
    
    // 3. Determine new overall order_status
    const orderArray = await Order.findById(orderId, firmId, { transaction });
    if (!orderArray || orderArray.length === 0) {
        throw new ApiError(404, "Order not found while updating status.");
    }
    const order = orderArray[0]; // Get object from array

    let newOrderStatus = 'PENDING';
    const isPaid = parseFloat(order.total_amount_paid) >= parseFloat(order.total_amount);
    
    if (newDeliveryStatus === 'DELIVERED' && isPaid) {
        newOrderStatus = 'COMPLETED';
    }
    
    
    // 4. Update the parent order
    return await Order.updateById(orderId, firmId, {
        delivery_status: newDeliveryStatus,
        order_status: newOrderStatus
    }, { transaction });
};

// --- CONTROLLER FUNCTIONS ---

const recordDelivery = async (req, res, next) => {
    try {
        const { order_stock_id, delivered_quantity, delivery_date, delivery_notes } = req.body;
        const { firm_id } = req.user;
        const deliveryDate = delivery_date ? new Date(delivery_date) : new Date();
        if (!order_stock_id || !delivered_quantity) {
            throw new ApiError(400, "order_stock_id and delivered_quantity are required.");
        }

        const updatedOrder = await database.transaction(async (transaction) => {
            const item = await OrderStock.findById(order_stock_id, { transaction });
            if (!item) {
                throw new ApiError(404, "Order item not found.");
            }

            const totalDelivered = await Delivery.calculateTotalDelivered(order_stock_id, { transaction });
            if ((totalDelivered + parseFloat(delivered_quantity)) > item.quantity) {
                const remaining = item.quantity - totalDelivered;
                throw new ApiError(400, `Delivery quantity exceeds amount ordered. Max remaining: ${remaining}.`);
            }

            await Delivery.create({
                order_stock_id,
                firm_id,
                delivered_quantity,
                delivery_date: deliveryDate,
                delivery_notes
            }, { transaction });

            const orderId = await updateOrderStockStatus(order_stock_id, firm_id, transaction);

            return await updateOrderStatus(orderId, firm_id, transaction);
        });

        const items = await OrderStock.findByOrderId(updatedOrder[0].id);
        return res.status(201).json(
            new ApiResponse(201, "Delivery recorded successfully", { order: updatedOrder, items })
        );

    } catch (error) {
        next(error);
    }
};

const deliverFullOrder = async (req, res, next) => {
    try {
        const { order_id } = req.params;
        const { delivery_date, delivery_notes } = req.body;
        const { firm_id } = req.user;

        const updatedOrder = await database.transaction(async (transaction) => {
            // 1. Find the order and all its items
            const order = await Order.findById(order_id, firm_id, { transaction });
            if (!order) {
                throw new ApiError(404, "Order not found.");
            }
            if (order.delivery_status === 'DELIVERED') {
                throw new ApiError(400, "This order has already been fully delivered.");
            }

            const items = await OrderStock.findAllByOrderId(order_id, { transaction });
            if (items.length === 0) {
                throw new ApiError(400, "This order has no items to deliver.");
            }

            // 2. Loop through each item
            for (const item of items) {
                const remainingQuantity = item.quantity - item.quantity_delivered;

                // 3. If it's not fully delivered, create a new delivery for the remaining amount
                if (remainingQuantity > 0) {
                    await Delivery.create({
                        order_stock_id: item.id,
                        firm_id,
                        delivered_quantity: remainingQuantity,
                        delivery_date: delivery_date || new Date(),
                        delivery_notes: delivery_notes || "Full order delivery"
                    }, { transaction });
                    
                    // 4. Update the order_stock item's delivered quantity
                    await OrderStock.updateById(item.id, { 
                        quantity_delivered: item.quantity 
                    }, { transaction });
                }
            }

            // 5. Finally, update the main order's status (this helper handles all logic)
            return await updateOrderStatus(order_id, firm_id, transaction);
        });

        const items = await OrderStock.findByOrderId(updatedOrder[0].id);
        return res.status(200).json(
            new ApiResponse(200, "Order marked as fully delivered", { order: updatedOrder, items })
        );

    } catch (error) {
        next(error);
    }
};


const listOrderDeliveries = async (req, res, next) => {
    try {
        const { order_id } = req.params;
        const { firm_id } = req.user;

        // Verify the order belongs to the firm
        const order = await Order.findById(order_id, firm_id);
        if (!order) {
            throw new ApiError(404, "Order not found.");
        }
       
        const deliveries = await Delivery.findByOrderId(order_id);
        return res.status(200).json(
            new ApiResponse(200, "Deliveries retrieved successfully", deliveries)
        );
    } catch (error) {
        next(error);
    }
};

const getDelivery = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { firm_id } = req.user;

        const delivery = await Delivery.findById(id, firm_id);
        if (!delivery) {
            throw new ApiError(404, "Delivery record not found.");
        }

        return res.status(200).json(
            new ApiResponse(200, "Delivery retrieved successfully", delivery)
        );
    } catch (error) {
        next(error);
    }
};


const updateDelivery = async (req, res, next) => {
    try {
        const { id } = req.params; // This is delivery_id
        const { delivered_quantity, delivery_date, delivery_notes } = req.body;
        const { firm_id } = req.user;

        const updateData = {};
        if (delivered_quantity !== undefined) updateData.delivered_quantity = parseFloat(delivered_quantity);
        if (delivery_date !== undefined) updateData.delivery_date = delivery_date;
        if (delivery_notes !== undefined) updateData.delivery_notes = delivery_notes;

        if (Object.keys(updateData).length === 0) {
            throw new ApiError(400, "No fields to update.");
        }

        const updatedOrder = await database.transaction(async (transaction) => {
            const deliveryArray = await Delivery.findById(id, firm_id, { transaction });
            if (!deliveryArray || deliveryArray.length === 0) {
                throw new ApiError(404, "Delivery record not found.");
            }
            const delivery = deliveryArray[0]; 

            if (updateData.delivered_quantity !== undefined) {
                const itemArray = await OrderStock.findById(delivery.order_stock_id, { transaction });
                if (!itemArray || itemArray.length === 0) {
                    throw new ApiError(404, "Associated order item not found.");
                }
                const item = itemArray; 
        
                const totalDeliveredByOthers = (await Delivery.calculateTotalDelivered(item.id, { transaction })) - parseFloat(delivery.delivered_quantity);

                const newTotalDelivered = totalDeliveredByOthers + updateData.delivered_quantity;

                if (newTotalDelivered > parseFloat(item.quantity)) {
                    const maxAllowed = parseFloat(item.quantity) - totalDeliveredByOthers;
                    throw new ApiError(400, `Update quantity exceeds amount ordered. Max allowed for this entry: ${maxAllowed}.`);
                }
            }
           
            await Delivery.updateById(id, updateData, { transaction });
            const orderId = await updateOrderStockStatus(delivery.order_stock_id, firm_id, transaction);
            
            return await updateOrderStatus(orderId, firm_id, transaction);
        });

        const items = await OrderStock.findByOrderId(updatedOrder[0].id);
        return res.status(200).json(
            new ApiResponse(200, "Delivery updated successfully", { order: updatedOrder, items })
        );

    } catch (error) {
        next(error);
    }
};

const deleteDelivery = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { firm_id } = req.user;

        const updatedOrder = await database.transaction(async (transaction) => {
            // 1. Find the delivery
            const delivery = await Delivery.findById(id, firm_id, { transaction });
            if (!delivery) {
                throw new ApiError(404, "Delivery record not found.");
            }

            // 2. Delete the delivery
            await Delivery.removeById(id, { transaction });

            // 3. Update the order_stock item
            const orderId = await updateOrderStockStatus(delivery[0].order_stock_id, firm_id, transaction);

            // 4. Update the main order's status
            return await updateOrderStatus(orderId, firm_id, transaction);
        });

        const items = await OrderStock.findByOrderId(updatedOrder[0].id);
        return res.status(200).json(
            new ApiResponse(200, "Delivery deleted successfully", { order: updatedOrder, items })
        );

    } catch (error) {
        next(error);
    }
};

const getPendingDeliveries = async (req, res, next) => {
    try {
        const { firm_id } = req.user;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const paginatedResult = await Order.findOrdersWithPendingDelivery(firm_id, { limit, offset });
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
            new ApiResponse(200, "Orders with pending deliveries retrieved", responseData)
        );
    } catch (error) {
        next(error);
    }
};

const getDeliverySummary = async (req, res, next) => {
    try {
        const { order_id } = req.params;
        const { firm_id } = req.user;

        const order = await Order.findById(order_id, firm_id);
        if (!order) {
            throw new ApiError(404, "Order not found.");
        }

        // Get all items with their delivery status
        const items = await OrderStock.findByOrderId(order_id); 

        const summary = {
            order_id: order.id,
            delivery_status: order.delivery_status,
            order_status: order.order_status,
            items: items.map(item => ({
                stock_id: item.stock_id,
                stock_name: item.stock_name,
                unit: item.unit,
                quantity_ordered: item.quantity,
                quantity_delivered: item.quantity_delivered,
                is_fulfilled: item.quantity_delivered >= item.quantity
            }))
        };

        return res.status(200).json(
            new ApiResponse(200, "Delivery summary retrieved", summary)
        );
    } catch (error) {
        next(error);
    }
};

export {
    recordDelivery,
    deliverFullOrder, // <-- Export the new function
    listOrderDeliveries,
    getDelivery,
    updateDelivery,
    deleteDelivery,
    getPendingDeliveries,
    getDeliverySummary
};

