import database from "../config/database.js";

class Order {

async create(orderData, options = {}) {
        const db = options.transaction || database;
        const sql = `
            INSERT INTO ORDERS (customer_id, firm_id, created_by, order_date, invoice_no, payment_terms, delivery_instructions) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(sql, [
            orderData.customer_id, 
            orderData.firm_id, 
            orderData.created_by, 
            orderData.order_date, 
            orderData.invoice_no,
            orderData.payment_terms || null,        // Added field
            orderData.delivery_instructions || null // Added field
        ]);
        
        // Return the created order
        const [[row]] = await db.query(`SELECT * FROM ORDERS WHERE id = ?`, [result.insertId]);
        return row;
    }
    async findLatestInvoiceNo(firmId, options = {}) {
        const db = options.transaction || database;
        const sql = `SELECT invoice_no FROM ORDERS WHERE firm_id = ? ORDER BY order_date DESC LIMIT 1`;
        const rows = await db.query(sql, [firmId]);
        if(rows.length === 0) {
            return 0;
        }
        return rows[0].invoice_no;
    }
    async findById(id, firmId, options = {}) {
        const db = options.transaction || database;
        let sql = `
            SELECT o.*, c.fullname as customer_name
            FROM ORDERS o
            LEFT JOIN customer c 
            ON o.customer_id = c.id
            WHERE o.firm_id = ? AND o.id = ?
        `;
        const [row] = await db.query(sql, [firmId, id]);
        
        return row || null;
    }

async findAllByFirmId(firmId, filters = {}, pagination = {}, options = {}) {
        const db = options.transaction || database;
        
        // --- 1. Base Query with JOIN ---
        // We join 'customer' so we can access 'c.fullname' for searching
        let baseSql = `
            FROM ORDERS o
            LEFT JOIN customer c ON o.customer_id = c.id
            WHERE o.firm_id = ?
        `;
        
        const params = [firmId];

        // --- 2. Apply Filters ---

        // Status Filters
        if (filters.order_status) {
            baseSql += ` AND o.order_status = ?`;
            params.push(filters.order_status);
        }
        if (filters.payment_status) {
            baseSql += ` AND o.payment_status = ?`;
            params.push(filters.payment_status);
        }
        if (filters.delivery_status) {
            baseSql += ` AND o.delivery_status = ?`;
            params.push(filters.delivery_status);
        }

        // Date Range Filters
        if (filters.startDate) {
            baseSql += ` AND o.order_date >= ?`;
            params.push(filters.startDate);
        }
        if (filters.endDate) {
            baseSql += ` AND o.order_date <= ?`;
            params.push(filters.endDate);
        }

        // Search Filter (Invoice No OR Customer Name)
        if (filters.search) {
            // CAST invoice_no to CHAR to allow LIKE searching on numbers
            baseSql += ` AND (CAST(o.invoice_no AS CHAR) LIKE ? OR c.fullname LIKE ?)`;
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm);
        }

        // --- 3. Get Total Count ---
        const countSql = `SELECT COUNT(*) as totalCount ${baseSql}`;
        const [countResult] = await db.query(countSql, params);
        const totalCount = countResult.totalCount || 0;

        // If no results, return early
        if (totalCount === 0) {
            return { rows: [], totalCount: 0 };
        }

        // --- 4. Get Paginated Data ---
        // We select o.* (all order fields) and c.fullname for convenience
        let dataSql = `SELECT o.*, c.fullname as customer_name ${baseSql} ORDER BY o.created_at DESC`;
        
        if (pagination.limit !== undefined && pagination.offset !== undefined) {
            dataSql += ` LIMIT ? OFFSET ?`;
            params.push(pagination.limit, pagination.offset);
        }
        
        const rows = await db.query(dataSql, params);
        
        return { rows, totalCount };
    }

    
    async updateById(id, firmId, data, options = {}) {
        if (Object.keys(data).length === 0) {
            return this.findById(id, firmId, options);
        }
        const db = options.transaction || database;
        
        const setClauses = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(data), id, firmId];

        const sql = `UPDATE ORDERS SET ${setClauses} WHERE id = ? AND firm_id = ?`;
        
        const [result] = await db.query(sql, values);
        console.log("Update result:", result);
        if (result.affectedRows > 0) {
            return this.findById(id, firmId, options);
        }
        return null;
    }


    async removeById(id, firmId, options = {}) {
        const db = options.transaction || database;
        const sql = `DELETE FROM ORDERS WHERE id = ? AND firm_id = ?`;
        const [result] = await db.query(sql, [id, firmId]);
        return result.affectedRows;
    }
    async findOrdersWithPendingPayment(firmId, pagination = {}) {
        const db = database;
        const whereSql = `firm_id = ? AND (payment_status = 'UNPAID' OR payment_status = 'PARTIALLY_PAID')`;
        const params = [firmId];
        const countParams = [firmId];

        const countSql = `SELECT COUNT(*) as totalCount FROM ORDERS WHERE ${whereSql}`;
        const [countResult] = await db.query(countSql, countParams);
        const totalCount = countResult.totalCount || 0;

        if (totalCount === 0) {
            return { rows: [], totalCount: 0 };
        }

        let dataSql = `SELECT * FROM ORDERS WHERE ${whereSql} ORDER BY order_date ASC`; // Oldest pending first
        if (pagination.limit !== undefined && pagination.offset !== undefined) {
            dataSql += ` LIMIT ? OFFSET ?`;
            params.push(pagination.limit, pagination.offset);
        }

        const rows = await db.query(dataSql, params);
        return { rows, totalCount };
    }

    async findOrdersWithPendingDelivery(firmId, pagination = {}) {
        const db = database;
        const whereSql = `firm_id = ? AND (delivery_status = 'PENDING' OR delivery_status = 'PARTIALLY_DELIVERED')`;
        const params = [firmId];
        const countParams = [firmId];

        const countSql = `SELECT COUNT(*) as totalCount FROM ORDERS WHERE ${whereSql}`;
        const [countResult] = await db.query(countSql, countParams);
        const totalCount = countResult.totalCount || 0;

        if (totalCount === 0) {
            return { rows: [], totalCount: 0 };
        }

        let dataSql = `SELECT * FROM ORDERS WHERE ${whereSql} ORDER BY order_date ASC`; // Oldest pending first
        if (pagination.limit !== undefined && pagination.offset !== undefined) {
            dataSql += ` LIMIT ? OFFSET ?`;
            params.push(pagination.limit, pagination.offset);
        }

        const rows = await db.query(dataSql, params);
        return { rows, totalCount };
    }
}

export default new Order();