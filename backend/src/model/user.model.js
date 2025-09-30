import database from "../config/database.js";

class User {
    // Create Operation
    async createUser(userdata, options = {}) {
        const db = options.transaction || database;

        const sql = `INSERT INTO user (fullname, contact_no, email, password_hash, role, avatar, bio, firm_id) 
                        VALUES(?,?,?,?,?,?,?,?)`;
        const [result] = await db.query(sql, [
            userdata.fullname,
            userdata.contact_no,
            userdata.email,
            userdata.password_hash,
            userdata.role,
            userdata.avatar,
            userdata.bio,
            userdata.firm_id
        ]);
        
        if (!result || result.affectedRows !== 1 || !result.insertId) {
            console.error("User creation failed. Full database response:", result);
            throw new Error("Failed to create user in the database. See server logs for details.");
        }
        
        return await this.findById(result.insertId, { transaction: db });
    }
    // Read Operations
    async findById(id, options = {}) {
        const db = options.transaction || database;
        const sql = `SELECT * FROM user WHERE id = ?`;
        const result = await db.query(sql, [id]);
        return result[0];
    }
    async findByEmail(email, options = {}) {
        const db = options.transaction || database;
        const sql = `SELECT * FROM user WHERE email = ?`;
        const reasult = await db.query(sql, [email]);
        return reasult;

    }
    async findByFirmId(firmid, options = {}) {
        const db = options.transaction || database;
        const sql = `SELECT * FROM user WHERE firm_id =?`;
        const reasult = await db.query(sql, [firmid])
        return reasult;
    }
    //Update Operation
    async updateUserById(userdata, id, options = {}) {
        const db = options.transaction || database;
        const sql = `UPDATE user
                SET fullname = ?, 
                password_hash = ?,
                avatar = ?, 
                bio= ? 
                WHERE id = ?`;
        const result = await db.query(sql, [
            userdata.fullname,
            userdata.password_hash,
            userdata.avatar,
            userdata.bio,
            id
        ]);
        return await this.findById(id, options);
    }
}
export default new User();
//Delete Operation

//Other Operations

