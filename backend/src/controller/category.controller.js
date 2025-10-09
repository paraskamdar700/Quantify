import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {Firm, User, Customer, Category} from "../model/index.model.js"
import database from "../config/database.js";


const createCategory = async (req, res, next) => {
    try {
        const { categoryName, description } = req.body;
        const firm_id = req.user.firm_id;
        const created_by = req.user.id;

        if (!categoryName) {
            throw new ApiError(400, "Category name is required.");
        }

        if (!created_by) {
            throw new ApiError(401, "Unauthorized: User ID not found in token.");
        }


        const existingCategory = await Category.findByNameAndFirmId(categoryName, firm_id);
        if (existingCategory && existingCategory.length > 0) {
            throw new ApiError(409, `Category with name "${categoryName}" already exists.`);
        }

        const newCategoryData = {
            category_name:categoryName,
            description: description || null,
            firm_id,
            created_by // Pass the creator's ID to the model
        };
            console.log(newCategoryData)
        const newCategoryArray = await Category.createCategory(newCategoryData);

        if (!newCategoryArray || newCategoryArray.length === 0) {
            throw new ApiError(500, "Failed to create the category. Please try again.");
        }
        
        const newCategory = newCategoryArray[0];

        return res.status(201).json(
            new ApiResponse(201, "Category created successfully", newCategory)
        );

    } catch (error) {
        next(error);
    }
};

const getCategories = async (req, res, next) => {
    try {
        const firm_id = req.user.firm_id;
        const categories = await Category.findByFirmId(firm_id);

        const enrichedCategories = await Promise.all(
            categories.map(async (category) => { 

                const filteredData = { ...category };

                const createdByUserArray = await User.findById(category.created_by);
                if (createdByUserArray) {
                    const createdByUser = createdByUserArray;
                    filteredData.created_by_name = createdByUser.fullname; 
                } else {
                    filteredData.created_by_name = "Unknown User";
                }
                
                delete filteredData.created_at;
                delete filteredData.updated_at;

                return filteredData;
            })
        );

        return res.status(200).json(
            new ApiResponse(200, "Categories retrieved successfully", enrichedCategories)
        );

    } catch (error) {
        next(error);
    }
};

const updateCategory = async (req, res, next) => {
    try {
        const categoryId = req.params.id;
        const { category_name, description } = req.body;
        const firm_id = req.user.firm_id;

        if (!category_name && !description) {
            throw new ApiError(400, "At least one field (category_name or description) is required to update.");
        }

        const existingCategoryArray = await Category.findById(categoryId);
        if (!existingCategoryArray || existingCategoryArray.length === 0) {
            throw new ApiError(404, "Category not found.");
        }

        const existingCategory = existingCategoryArray;
        if (existingCategory.firm_id !== firm_id) {
            throw new ApiError(403, "Forbidden: You do not have permission to update this category.");
        }

        const updatedData = {
            category_name: category_name || existingCategory.category_name,
            description: description || existingCategory.description
        };

        const updatedCategoryArray = await Category.updateCategoryById(categoryId, updatedData);
        
        if (!updatedCategoryArray || updatedCategoryArray.length === 0) {
             throw new ApiError(500, "Failed to update category.");
        }

        const updatedCategory = updatedCategoryArray;

        return res.status(200).json(
            new ApiResponse(200, "Category updated successfully", updatedCategory)
        );

    } catch (error) {
        next(error);
    }
};
// this will be implemented at the end of all other CRUD operations
const deleteCategory = async (req, res, next) => {
    try {
        const categoryId = req.params.id;
        const firm_id = req.user.firm_id;

        // Security Check: Verify the category belongs to the user's firm before deleting
        const existingCategoryArray = await Category.findById(categoryId);
        if (!existingCategoryArray || existingCategoryArray.length === 0) {
            throw new ApiError(404, "Category not found.");
        }

        const existingCategory = existingCategoryArray;
        if (existingCategory.firm_id !== firm_id) {
            throw new ApiError(403, "Forbidden: You do not have permission to delete this category.");
        }
        
        const deletedRows = await Category.deleteCategoryById(categoryId);

        if (deletedRows === 0) {
            throw new ApiError(500, "Failed to delete the category.");
        }

        return res.status(200).json(
            new ApiResponse(200, "Category deleted successfully", null)
        );

    } catch (error) {
        // Handle foreign key constraint errors gracefully
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return next(new ApiError(409, "Cannot delete category because it is currently in use by one or more products."));
        }
        next(error);
    }
};


export {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory
};