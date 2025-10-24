import database from "../config/database.js";

class Order {

    async createOrder(orderData, options = {}) {
        const db = options.transaction || database;
        const sql = `
            INSERT INTO ORDERS (customer_id, firm_id, created_by, order_date, invoice_no) 
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.query(sql, [
            orderData.customer_id,
            orderData.firm_id,
            orderData.created_by,
            orderData.order_date,
            orderData.invoice_no
        ]);

        if (result.affectedRows === 1) {
            return this.findById(result.insertId, orderData.firm_id, options);
        }
        throw new Error("Failed to create order.");
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
        const sql = `SELECT * FROM ORDERS WHERE id = ? AND firm_id = ?`;
        const [row] = await db.query(sql, [id, firmId]);
        return row || null;
    }

    async findAllByFirmId(firmId, filters = {}, pagination = {}, options = {}) {
        const db = options.transaction || database;
        
        let whereClauses = ['firm_id = ?'];
        let params = [firmId];
        let countParams = [firmId]; // Params for count query

        Object.keys(filters).forEach(key => {
            whereClauses.push(`${key} = ?`);
            params.push(filters[key]);
            countParams.push(filters[key]);
        });
        
        const whereSql = whereClauses.join(' AND ');

        const countSql = `SELECT COUNT(*) as totalCount FROM ORDERS WHERE ${whereSql}`;
        const [countResult] = await db.query(countSql, countParams);
        const totalCount = countResult.totalCount || 0;

        if (totalCount === 0) {
            return { rows: [], totalCount: 0 };
        }

        let dataSql = `SELECT * FROM ORDERS WHERE ${whereSql} ORDER BY created_at DESC`;
        
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
        if (result.affectedRows > 0) {
            return this.findById(id, firmId, options);
        }
        return null;
    }


    async removeById(id, firmId, options = {}) {
        const db = options.transaction || database;
        // Important: In a real app, you must first delete related order_stock items.
        // This should be handled in a transaction in the controller.
        const sql = `DELETE FROM ORDERS WHERE id = ? AND firm_id = ?`;
        const [result] = await db.query(sql, [id, firmId]);
        return result.affectedRows;
    }
}

export default new Order();