import { Stock, Category } from '../model/index.model.js'; 
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import database from '../config/database.js';



const addStock = async (req, res, next) => {
    try {
        const {
            stock_name,
            sku_code,
            unit,
            quantity_available,
            buy_price,
            weight_per_unit,
            weight_unit,
            low_unit_threshold,
            category_id
        } = req.body;
        
        const firm_id = req.user.firm_id;

        if ([stock_name, sku_code, unit, quantity_available, buy_price, category_id].some(field => field === undefined || field === '')) {
            throw new ApiError(400, "All required fields must be provided.");
        }

      
        const categoryArray = await Category.findById(category_id);
        if (!categoryArray || categoryArray.length === 0 || categoryArray.firm_id !== firm_id) {
            throw new ApiError(404, "Category not found, Create category first.");
        }
          
        const existingStock = await Stock.findBySkuAndFirmId(sku_code, firm_id);
        if (existingStock && existingStock.length > 0) {
            throw new ApiError(409, `An item with SKU code "${sku_code}" already exists.`);
        }

        const newStockData = {
            stock_name,
            sku_code: sku_code.toUpperCase(),
            unit: unit.toUpperCase(),
            quantity_available,
            buy_price,
            weight_per_unit: weight_per_unit || 0,
            weight_unit: weight_unit.toUpperCase() || 'KG',
            low_unit_threshold: low_unit_threshold || 0,
            category_id,
            firm_id
        };

        const newStockArray = await Stock.createStock(newStockData);
        if (!newStockArray || newStockArray.length === 0) {
            throw new ApiError(500, "Failed to add stock item. Please try again.");
        }

        return res.status(201).json(
            new ApiResponse(201, "Stock item added successfully", newStockArray)
        );

    } catch (error) {
        next(error);
    }
};

const getStock = async (req, res, next) => {
    try {
        const firm_id = req.user.firm_id;
        
        // Extract filters and pagination from Query Parameters
        const { category_id, search, startDate, endDate, page, limit } = req.query;

        const filters = {
            category_id: category_id ? parseInt(category_id) : undefined,
            search: search || undefined,
            startDate: startDate || undefined, // Format: YYYY-MM-DD
            endDate: endDate || undefined      // Format: YYYY-MM-DD
        };

        // Pagination Logic
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const offset = (pageNum - 1) * limitNum;

        // Call model with pagination options
        const { rows: stockItems, totalCount } = await Stock.findByFirmId(firm_id, filters, { limit: limitNum, offset });

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / limitNum);

        const responsePayload = {
            stockItems,
            pagination: {
                totalItems: totalCount,
                totalPages,
                currentPage: pageNum,
                itemsPerPage: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        };

        return res.status(200).json(
            new ApiResponse(200, "Stock items retrieved successfully", responsePayload)
        );
    } catch (error) {
        next(error);
    }
};


const updateStock = async (req, res, next) => {
    try {
        
        const stockId = req.params.id;
        const firm_id = req.user.firm_id;
        const { stock_name, sku_code, unit, quantity_available, buy_price, weight_per_unit, weight_unit, low_unit_threshold, category_id } = req.body;

        const existingStockArray = await Stock.findById(stockId, firm_id);
        if (!existingStockArray || existingStockArray.length === 0) {
            throw new ApiError(404, "Stock item not found.");
        }
        if (existingStockArray[0].firm_id !== firm_id) {
            throw new ApiError(403, "Forbidden: You do not have permission to update this item.");
        }
      
        const updatedData = {};
        if (stock_name !== undefined) updatedData.stock_name = stock_name;
        if (sku_code !== undefined) updatedData.sku_code = sku_code;
        if (unit !== undefined) updatedData.unit = unit;
        if (quantity_available !== undefined) updatedData.quantity_available = quantity_available;
        if (buy_price !== undefined) updatedData.buy_price = buy_price;
        if (weight_per_unit !== undefined) updatedData.weight_per_unit = weight_per_unit;
        if (weight_unit !== undefined) updatedData.weight_unit = weight_unit;
        if (low_unit_threshold !== undefined) updatedData.low_unit_threshold = low_unit_threshold;
        if (category_id !== undefined) updatedData.category_id = category_id;


        const updatedStockArray = await Stock.updateStockById(stockId, firm_id ,updatedData);
        if (!updatedStockArray || updatedStockArray.length === 0) {
            throw new ApiError(500, "Failed to update stock item.");
        }

        return res.status(200).json(
            new ApiResponse(200, "Stock item updated successfully", updatedStockArray[0])
        );

    } catch (error) {
        next(error);
    }
};

const deleteStock = async (req, res, next) => {
    try {
        const stockId = req.params.id;
        const firm_id = req.user.firm_id;

        const existingStockArray = await Stock.findById(stockId, firm_id);
        if (!existingStockArray || existingStockArray.length === 0) {
            throw new ApiError(404, "Stock item not found.");
        }
        if (existingStockArray[0].firm_id !== firm_id) {
            throw new ApiError(403, "Forbidden: You do not have permission to delete this item.");
        }

        const deletedRows = await Stock.softDeleteStockById(stockId);
        if (deletedRows === 0) {
            throw new ApiError(500, "Failed to delete stock item.");
        }

        return res.status(200).json(
            new ApiResponse(200, "Stock item deleted successfully", null)
        );

    } catch (error) {
        next(error);
    }
};

const getLowStockAlerts = async (req, res, next) => {
    try {
        const firm_id = req.user.firm_id;
        const lowStockItems = await Stock.findLowStockByFirmId(firm_id);

        return res.status(200).json(
            new ApiResponse(200, "Low stock items retrieved successfully", lowStockItems)
        );
    } catch (error) {
        next(error);
    }
};

const updateStockQuantity = async (req, res, next) => {
    try {
        const stockId = req.params.id;
        // Correctly get the firmId from req.user
        const firmId = req.user.firm_id; 
        const { change_in_quantity } = req.body;

        if (typeof change_in_quantity !== 'number') {
            throw new ApiError(400, "A numeric 'change_in_quantity' is required.");
        }

        const existingStock = await Stock.findById(stockId, firmId);
        if (!existingStock) {
            throw new ApiError(404, "Stock item not found for this firm.");
        }
        
        if ((existingStock.quantity_available + change_in_quantity) < 0) {
            throw new ApiError(400, `Operation would result in a negative stock quantity. Current quantity: ${existingStock.quantity_available}.`);
        }

        // Call the model with the correct arguments (id, firmId, change)
        const updatedStock = await Stock.adjustQuantity(stockId, firmId, change_in_quantity);
        
        if (!updatedStock) {
            throw new ApiError(500, "Failed to update stock quantity.");
        }

        return res.status(200).json(
            new ApiResponse(200, "Stock quantity updated successfully", updatedStock)
        );

    } catch (error) {
        next(error);
    }
};

export {
    addStock,
    getStock,
    updateStock,
    deleteStock,
    getLowStockAlerts,
    updateStockQuantity
};
