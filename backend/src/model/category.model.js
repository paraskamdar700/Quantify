import database from "../config/database.js";

class Category{

 async createCategory(data, options = {}) {
        const db = options.transaction || database;
        const sql = `
            INSERT INTO category (category_name, description, firm_id, created_by) 
            VALUES (?, ?, ?, ?)
        `;
        try {
            const result = await db.query(sql, [
                data.category_name,
                data.description,
                data.firm_id,
                data.created_by
            ]);
            if (result.insertId > 0) {
                return this.findById(result.insertId, options);
            } else {
                throw new Error("Category creation failed, no insertId returned.");
            }

        } catch (error) {
            console.error("Error in createCategory model:", error);
            throw error;
        }
    }

    async findById(id, options = {}) {
        const db = options.transaction || database;
        const sql = `SELECT * FROM category WHERE id = ?`;
        const [result] = await db.query(sql, [id]);
        return result;
    }

    async findByFirmId(firmId) {
        const sql = `SELECT * FROM category WHERE firm_id = ?`;
        const results = await database.query(sql, [firmId]);
        return results;
    }
    
    async findByNameAndFirmId(categoryName, firmId) {
        const sql = `SELECT * FROM category WHERE category_name = ? AND firm_id = ?`;
        const [result] = await database.query(sql, [categoryName, firmId]);
        return result;
    }

    async updateCategoryById(id, data) {
        const sql = `UPDATE category SET category_name = ?, description = ? WHERE id = ?`;
        const result = await database.query(sql, [data.category_name, data.description, id]);
        if (result.affectedRows > 0) {
            return this.findById(id);
        }
        return null;
    }

    async deleteCategoryById(id) {
        const sql = `DELETE FROM category WHERE id = ?`;
        const result = await database.query(sql, [id]);
        return result.affectedRows;
    }


}
export default new Category();