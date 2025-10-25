import database from "../config/database.js";

class Delivery {

   
    async create(deliveryData, options = {}) {
        const db = options.transaction || database;
        const sql = `
            INSERT INTO delivery (order_stock_id, firm_id, delivered_quantity, delivery_date, delivery_notes)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.query(sql, [
            deliveryData.order_stock_id,
            deliveryData.firm_id,
            deliveryData.delivered_quantity,
            deliveryData.delivery_date || new Date(),
            deliveryData.delivery_notes
        ]);

        if (result.affectedRows === 1) {
            const [[row]] = await db.query('SELECT * FROM delivery WHERE id = ?', [result.insertId]);
            return row;
        }
        throw new Error("Failed to record delivery.");
    }

    async findById(id, firmId, options = {}) {
        const db = options.transaction || database;
        const sql = `SELECT * FROM delivery WHERE id = ? AND firm_id = ?`;
        const [row] = await db.query(sql, [id, firmId]);
        return row || null;
    }

    async findByOrderId(orderId, options = {}) {
        const db = options.transaction || database;
        const sql = `
            SELECT d.*, os.stock_id, s.stock_name 
            FROM delivery d
            JOIN order_stock os ON d.order_stock_id = os.id
            JOIN stock s ON os.stock_id = s.id
            WHERE os.order_id = ?
            ORDER BY d.delivery_date DESC
        `;
        const rows = await db.query(sql, [orderId]);
        return rows;
    }

    async updateById(id, data, options = {}) {
        const db = options.transaction || database;
        const setClauses = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(data), id];

        const sql = `UPDATE delivery SET ${setClauses} WHERE id = ?`;
        const [result] = await db.query(sql, values);
        return result.affectedRows;
    }

    async removeById(id, options = {}) {
        const db = options.transaction || database;
        const sql = `DELETE FROM delivery WHERE id = ?`;
        const [result] = await db.query(sql, [id]);
        return result.affectedRows;
    }

    async calculateTotalDelivered(orderStockId, options = {}) {
        const db = options.transaction || database;
        const sql = `SELECT SUM(delivered_quantity) as totalDelivered FROM delivery WHERE order_stock_id = ?`;
        const [[result]] = await db.query(sql, [orderStockId]);
        return parseFloat(result.totalDelivered) || 0;
    }
}

export default new Delivery();
