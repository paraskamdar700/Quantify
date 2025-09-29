import database from "../config/database";

class Firm {
    // Create Operations
    async createFirm(firmdata) {
        const sql = `
            INSERT INTO firm (firm_name, gst_no, firm_city, firm_street)
            VALUES (?, ?, ?, ?)
        `;
        const result = await database.query(sql, [
            firmdata.firm_name,
            firmdata.gst_no,
            firmdata.firm_city || NULL,
            firmdata.firm_street || NULL
        ]);
        return await this.findById(result.insertId);
    }

    // Read Operations
    async findById(id) {
        const sql = `SELECT * FROM firm WHERE id = ?`;
        const result = await database.query(sql, [id]);
        return result[0]; // return single firm
    }

    async findByGst(gst) {
        const sql = `SELECT * FROM firm WHERE gst_no = ?`;
        const result = await database.query(sql, [gst]);
        return result[0];
    }

    async findByFirmName(firmName){
        const sql = `
            SELECT * FROM firm WHERE firm_name = ?
        `;
        const reasult = await database.query(sql,[firmName]);
        return reasult;
    }

    // Update Operations
    async updateFirmById(firmdata, id) {
        const sql = `
            UPDATE firm
            SET firm_name = ?,
                gst_no = ?,
                firm_city = ?,
                firm_street = ?
            WHERE id = ?
        `;
        await database.query(sql, [
            firmdata.firm_name,
            firmdata.gst_no,
            firmdata.firm_city,
            firmdata.firm_street,
            id
        ]);
        return await this.findById(id);
    }
}
export default new Firm;
 
    //Delete Operations
    //Other Operaitons
