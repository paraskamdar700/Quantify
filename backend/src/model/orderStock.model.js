// models/orderStock.model.js
import database from "../config/database.js";

class OrderStock {

    async createOrderStock(itemData, options = {}) {
        const db = options.transaction || database;
        // Calculate subtotal before insertion
        const subtotal = itemData.quantity * itemData.selling_price;
        
        const sql = `
            INSERT INTO order_stock (order_id, stock_id, quantity, selling_price, subtotal) 
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.query(sql, [
            itemData.order_id,
            itemData.stock_id,
            itemData.quantity,
            itemData.selling_price,
            subtotal
        ]);

        if (result.affectedRows === 1) {
            const [[row]] = await db.query(`SELECT * FROM order_stock WHERE id = ?`, [result.insertId]);
            return row;
        }
        throw new Error("Failed to create order item.");
    }
    async findById(id, options = {}) {
        const db = options.transaction || database;
        const sql = `SELECT * FROM order_stock WHERE id = ?`;
        const [[row]] = await db.query(sql, [id]);
        return row || null;
    }
    async findAllByOrderId(orderId, options = {}) {
        const db = options.transaction || database;
        const sql = `SELECT * FROM order_stock WHERE order_id = ?`;
        const [rows] = await db.query(sql, [orderId]);
        return rows;
    }

    async findByOrderId(orderId, options = {}) {
        const db = options.transaction || database;
        const sql = `
            SELECT os.*, s.stock_name, s.unit 
            FROM order_stock os
            JOIN stock s ON os.stock_id = s.id
            WHERE os.order_id = ?
        `;
        const rows = await db.query(sql, [orderId]);
        return rows;
    }
    
    async updateTotalAmount(orderId, firm_id, totalAmount, options = {}) {
        const db = options.transaction || database;
        const sql = `UPDATE orders SET total_amount = ? WHERE id = ? AND firm_id = ?`;
        const [result] = await db.query(sql, [totalAmount, orderId, firm_id]);
        return result.affectedRows > 0;
    }

    
    async updateById(id, data, options = {}) {
        if (Object.keys(data).length === 0) return null;
        
        const db = options.transaction || database;

        if (data.quantity && data.selling_price) {
            data.subtotal = data.quantity * data.selling_price;
        }

        const setClauses = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(data), id];

        const sql = `UPDATE order_stock SET ${setClauses} WHERE id = ?`;
        const [result] = await db.query(sql, values);

        if (result.affectedRows > 0) {
            const [[row]] = await db.query(`SELECT * FROM order_stock WHERE id = ?`, [id]);
            return row;
        }
        return null;
    }
    

    
    async removeById(id, options = {}) {
        const db = options.transaction || database;
        const sql = `DELETE FROM order_stock WHERE id = ?`;
        const [result] = await db.query(sql, [id]);
        return result.affectedRows;
    }

    async calculateTotalAmount(orderId, options = {}) {
        const db = options.transaction || database;
        const sql = `SELECT SUM(subtotal) as total FROM order_stock WHERE order_id = ?`;
        const [[result]] = await db.query(sql, [orderId]);
        return result.total || 0;
    }
}

export default new OrderStock();