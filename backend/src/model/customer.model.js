import database from "../config/database.js";

class Customer {

    async createCustomer(customerData, options = {}) {
        const db = options.transaction || database;
        const sql = `INSERT INTO customer (fullname, firm_name, contact_no, gst_no, city, street, firm_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const result = await db.query(sql, [
            customerData.fullname,
            customerData.firm_name,
            customerData.contact_no,
            customerData.gst_no,
            customerData.city,
            customerData.street,
            customerData.firm_id
        ]);
        return this.findById(result.insertId);
    }
    async findById(id, options = {}) {
        const db = options.transaction || database;
        const sql = `SELECT * FROM customer WHERE id = ?`;
        const result = await db.query(sql,[id]);
        return result;
    }

     async findByFirmId(firmId, filters = {}, pagination = {}, options = {}) {
        const db = options.transaction || database;
        
        // Base SQL fragment used for both counting and fetching data
        let baseSql = `FROM customer WHERE firm_id = ?`;
        const params = [firmId];
        const countParams = [firmId]; // Separate params for the count query

        // Search Logic: Check fullname, firm_name, OR contact_no
        if (filters.search) {
            baseSql += ` AND (fullname LIKE ? OR firm_name LIKE ? OR contact_no LIKE ?)`;
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
            countParams.push(searchTerm, searchTerm, searchTerm);
        }

        // 1. Get Total Count
        const countSql = `SELECT COUNT(*) as totalCount ${baseSql}`;
        const [countResult] = await db.query(countSql, countParams);
        const totalCount = countResult.totalCount || 0;

        // 2. Get Paginated Data
        // We include a subquery to fetch the most recent order date for each customer
        let dataSql = `
            SELECT customer.*, 
            (SELECT MAX(order_date) FROM ORDERS WHERE ORDERS.customer_id = customer.id) as last_order_date 
            ${baseSql} 
            ORDER BY created_at DESC
        `;

        if (pagination.limit !== undefined && pagination.offset !== undefined) {
            dataSql += ` LIMIT ? OFFSET ?`;
            params.push(pagination.limit, pagination.offset);
        }

        const rows = await db.query(dataSql, params);
        
        // Return object with rows and totalCount
        return { rows, totalCount };
    }

    async updateCustomer(id, updateData, options = {}) {
        const db = options.transaction || database;
        const sql = `UPDATE customer
                SET fullname = ?, 
                firm_name = ?,
                contact_no = ?, 
                gst_no= ?,
                city = ?,
                street = ?,
                firm_id = ?
                WHERE id = ?`;
        const result = await db.query(sql, [
            updateData.fullname,
            updateData.firm_name,
            updateData.contact_no,
            updateData.gst_no,
            updateData.city,
            updateData.street,
            updateData.firm_id,
            id
        ]);
        return await this.findById(id, options);
    }

    async findByFirmName(firm_name, options = {}) {
        const db = options.transaction || database;
        const sql = `SELECT * FROM customer WHERE firm_name = ?`;
        const result = await db.query(sql, [firm_name]);
        return result;
    }

    async deleteCustomer(id, options = {}) {
        const db = options.transaction || database;
        const sql = `DELETE FROM customer WHERE id = ?`;
        const result = await db.query(sql, [id]);
        return result.affectedRows > 0;
    }
}

export default new Customer();