import database from "../config/database.js";

class Stock {

 
    async createStock(stockData, options = {}) {
        const db = options.transaction || database;
        const sql = `
            INSERT INTO stock (stock_name, sku_code, unit, quantity_available, buy_price, low_unit_threshold, firm_id, category_id, weight_per_unit, weight_unit) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const result = await db.query(sql, [
            stockData.stock_name,
            stockData.sku_code,
            stockData.unit,
            stockData.quantity_available,
            stockData.buy_price,
            stockData.low_unit_threshold,
            stockData.firm_id,
            stockData.category_id,
            stockData.weight_per_unit,
            stockData.weight_unit
        ]);

        if (result.affectedRows === 1) {
            return await this.findById(result.insertId, stockData.firm_id);
        }
        throw new Error("Failed to create stock item.");
    }

     async findBySkuAndFirmId(sku, firmId, options = {}) { 
        const db = options.transaction || database;
        const sql = `SELECT * FROM stock WHERE sku_code = ? AND firm_id = ? AND is_active = TRUE`;
        const [rows] = await db.query(sql, [sku, firmId]);
        return rows || null;
    }


    async findById(id, firmId, options = {}) {
        const db = options.transaction || database;
        const sql = `SELECT * FROM stock WHERE id = ? AND firm_id = ? AND is_active = TRUE`;
        const rows = await db.query(sql, [id, firmId]);
        if (rows.length === 0) {
            throw new Error("Stock item not found.");
        }
        return rows;
    }

    async findByFirmId(firmId, filters = {}, pagination = {}, options = {}) {
        const db = options.transaction || database;
        
        // Base SQL fragment for WHERE clauses
        let baseSql = `
            FROM stock s
            LEFT JOIN category c ON s.category_id = c.id
            WHERE s.firm_id = ? AND s.is_active = TRUE
        `;
        
        const params = [firmId];
        const countParams = [firmId]; // Separate params for the count query

        // 1. Filter by Category
        if (filters.category_id) {
            baseSql += ` AND s.category_id = ?`;
            params.push(filters.category_id);
            countParams.push(filters.category_id);
        }

        // 2. Search by Name or SKU
        if (filters.search) {
            baseSql += ` AND (s.stock_name LIKE ? OR s.sku_code LIKE ?)`;
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm);
            countParams.push(searchTerm, searchTerm);
        }

        // 3. Filter by Date (Created At)
        if (filters.startDate) {
            baseSql += ` AND DATE(s.created_at) >= ?`;
            params.push(filters.startDate);
            countParams.push(filters.startDate);
        }
        if (filters.endDate) {
            baseSql += ` AND DATE(s.created_at) <= ?`;
            params.push(filters.endDate);
            countParams.push(filters.endDate);
        }

        // --- 1. Get Total Count ---
        const countSql = `SELECT COUNT(*) as totalCount ${baseSql}`;
        const [countResult] = await db.query(countSql, countParams);
        const totalCount = countResult.totalCount || 0;

        // --- 2. Get Paginated Data ---
        let dataSql = `SELECT s.*, c.category_name ${baseSql} ORDER BY s.created_at DESC`;

        if (pagination.limit !== undefined && pagination.offset !== undefined) {
            dataSql += ` LIMIT ? OFFSET ?`;
            params.push(pagination.limit, pagination.offset);
        }

        const rows = await db.query(dataSql, params);
        
        // Return object with rows and totalCount
        return { rows, totalCount };
    }

    async findLowStockByFirmId(firmId, options = {}) {
        const db = options.transaction || database;
        const sql = `
            SELECT * FROM stock 
            WHERE firm_id = ? AND quantity_available <= low_unit_threshold AND is_active = TRUE
        `;
        const rows = await db.query(sql, [firmId]);
        return rows;
    }

    async search(query, firmId, options = {}) {
        const db = options.transaction || database;
        const sql = `
            SELECT * FROM stock 
            WHERE firm_id = ? AND (stock_name LIKE ? OR sku_code LIKE ?)
        `;
        const searchTerm = `%${query}%`;
        const [rows] = await db.query(sql, [firmId, searchTerm, searchTerm]);
        return rows;
    }

    async updateStockById(id, firm_id, data) {
        if (Object.keys(data).length === 0) {
            return this.findById(id);
        }
        const setClauses = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(data), id];

        const sql = `UPDATE stock SET ${setClauses} WHERE id = ?`;

        const result = await database.query(sql, values);

        if (result.affectedRows > 0) {
            return this.findById(id, firm_id);
        }
        
        return null; 
    }


    async adjustQuantity(id, firmId, quantityChange, options = {}) {
    const db = options.transaction || database;
    const sql = `
        UPDATE stock SET quantity_available = quantity_available + ? 
        WHERE id = ? AND firm_id = ?
    `;
    const result = await db.query(sql, [quantityChange, id, firmId]);

    // If the update was successful, fetch and return the updated stock item
    if (result.affectedRows > 0) {
        return await this.findById(id, firmId, { transaction: db });
    }
    
    return null; // Return null if no rows were updated
    }
    
    async quantityAvailable(id, quantity, options = {}){
      const db = options.transaction || database;
      const sql = `SELECT quantity_available, stock_name FROM stock WHERE id = ?`;
      const result = await db.query(sql, [id]);
      if (result.length > 0) {
          return result[0];
      }
      throw new Error("Stock item not found.");
    }

      async softDeleteStockById(id) {
        const sql = `UPDATE stock SET is_active = FALSE WHERE id = ?`;
        const result = await database.query(sql, [id]);
        return result.affectedRows;
    }
    
    async findByCategoryId(categoryId, options = {}) {
        const db = options.transaction || database;
        const sql = `SELECT * FROM stock WHERE category_id = ? AND is_active = TRUE`;
        const rows = await db.query(sql, [categoryId]);
        return rows;
    }
    
}

export default new Stock();

