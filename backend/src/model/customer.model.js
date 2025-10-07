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
        const sql = `SELECT * FROM customer WHERE firm_id = ?`;
        const result = await db.query(sql,[id]);
        return result;
    }
    async findByFirm(firmName, options = {}) {
        const db = options.transaction || database;
        const sql = `SELECT * FROM customer WHERE firm_name = ?`;
        const [result] = await db.query(sql, [firmName]);
        return result;
    }
    async findByNameSearch(name, options = {}) {
        const db = options.transaction || database;

        const sql = `SELECT * FROM customer WHERE fullname LIKE ?`;
        const searchTerm = '%' + name + '%';
        const result = await db.query(sql, [searchTerm]);
        return result;
    }
    async updateCustomer(id, updateData, options = {}) {
        const db = options.transaction || database;
        const sql = `UPDATE customer
                SET fullname = ?, 
                firm_name = ?,
                contact_no = ?, 
                gst_no= ?,
                city = ?,
                street = ?
                WHERE id = ?`;
        const result = await db.query(sql, [
            updateData.fullname,
            updateData.firm_name,
            updateData.contact_no,
            updateData.gst_no,
            updateData.city,
            updateData.street,
            id
        ]);
        return await this.findById(id, options);
    }
}

export default new Customer();