import database from "../config/database.js";

class Firm {
   
    async createFirm(firmData, options = {}) {
        

        const db = options.transaction || database;

        const sql = `
            INSERT INTO firm (firm_name, gst_no, firm_city, firm_street)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await db.query(sql, [
            firmData.firm_name,
            firmData.gst_no,
            firmData.firm_city,
            firmData.firm_street
        ]);
        
        if (!result || result.affectedRows !== 1 || !result.insertId) {
            console.error("Firm creation failed. Full database response:", result);
            throw new Error("Failed to create firm in the database. See server logs for details.");
        }

        return await this.findById(result.insertId, { transaction: db });
    }

    async findById(id, options = {}) {
        const db = options.transaction || database;
        const sql = `SELECT * FROM firm WHERE id = ?`;
        const result = await db.query(sql, [id]);
        return result[0];
    }

    async findByGst(gst, options = {}) {
        const db = options.transaction || database;
        const sql = `SELECT * FROM firm WHERE gst_no = ?`;
        const result = await db.query(sql, [gst]);
        return result[0];
    }

    async findByFirmName(firmName, options = {}) {
        const db = options.transaction || database;
        const sql = `SELECT * FROM firm WHERE firm_name = ?`;
        const result = await db.query(sql, [firmName]);
        return result;
    }

    async updateFirmById(firmData, id, options = {}) {
        const db = options.transaction || database;
        const sql = `
            UPDATE firm
            SET firm_name = ?, gst_no = ?, firm_city = ?, firm_street = ?
            WHERE id = ?
        `;
        await db.query(sql, [
            firmData.firm_name,
            firmData.gst_no,
            firmData.firm_city,
            firmData.firm_street,
            id
        ]);
        return await this.findById(id, options);
    }
}

export default new Firm();
