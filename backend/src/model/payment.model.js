import database from "../config/database.js";

class Payment {

    async create(paymentData, options = {}) {
        const db = options.transaction || database;
        const sql = `
            INSERT INTO payment (order_id, firm_id, customer_id, amount_paid, payment_method, reference_no, remarks, payment_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.query(sql, [
            paymentData.order_id,
            paymentData.firm_id,
            paymentData.customer_id,
            paymentData.amount_paid,
            paymentData.payment_method,
            paymentData.reference_no,
            paymentData.remarks,
            paymentData.payment_date || new Date()
        ]);

        if (result.affectedRows === 1) {
            const [[row]] = await db.query('SELECT * FROM payment WHERE id = ?', [result.insertId]);
            return row;
        }
        throw new Error("Failed to record payment.");
    }

    async findById(id, firmId, options = {}) {
        const db = options.transaction || database;
        const sql = `SELECT * FROM payment WHERE id = ? AND firm_id = ?`;
        const [row] = await db.query(sql, [id, firmId]);
        return row || null;
    }

    async findByOrderId(orderId, options = {}) {
        const db = options.transaction || database;
        const sql = `SELECT * FROM payment WHERE order_id = ? ORDER BY payment_date DESC`;
        const rows = await db.query(sql, [orderId]);
        return rows;
    }

 
    async updateById(id, data, options = {}) {
        const db = options.transaction || database;
        const setClauses = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(data), id];

        const sql = `UPDATE payment SET ${setClauses} WHERE id = ?`;
        const [result] = await db.query(sql, values);
        return result.affectedRows;
    }


    async removeById(id, options = {}) {
        const db = options.transaction || database;
        const sql = `DELETE FROM payment WHERE id = ?`;
        const [result] = await db.query(sql, [id]);
        return result.affectedRows;
    }

 
    async calculateTotalPaid(orderId, options = {}) {
        const db = options.transaction || database;
        const sql = `SELECT SUM(amount_paid) as totalPaid FROM payment WHERE order_id = ?`;
        const [[result]] = await db.query(sql, [orderId]);
        return parseFloat(result.totalPaid) || 0;
    }

    
}

export default new Payment();
