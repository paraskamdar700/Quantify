import database from "../config/database.js";

class User {
    // Create Operation
    async createUser(userdata, options = {}) {
        const db = options.transaction || database;

        const sql = `INSERT INTO user (fullname, contact_no, email, password_hash, role, avatar, bio, firm_id) 
                        VALUES(?,?,?,?,?,?,?,?)`;
        const result = await db.query(sql, [
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
         const sql = `SELECT * FROM user WHERE id=?`;
        const result = await db.query(sql, [id]);
        return result[0];
    }
    async findByEmail(email, options = {}) {
        const db = options.transaction || database;
        const sql = `SELECT * FROM user WHERE TRIM(email) = ?`;
        const result = await db.query(sql, [email]);
        return result[0];

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

    async updatePasswordById(password_hash, id, options = {}) {
        const db = options.transaction || database;
        const sql = `UPDATE user
                SET password_hash = ? 
                WHERE id = ?`;
        const result = await db.query(sql, [
            password_hash,
            id
        ]);
        return result.affectedRows;
    }

    async updateAvatarById(avatar, id, options = {}) {
        const db = options.transaction || database;
        const sql = `UPDATE user
                SET avatar = ?
                WHERE id = ?`;
        const result = await db.query(sql, [avatar, id]);
        return this.findById(result.insertId);
    }
    async updatePasswordById(password_hash, id, options = {}) {
        const db = options.transaction || database;
        const sql = `UPDATE user
                SET password_hash = ? 
                WHERE id = ?`;
        const result = await db.query(sql, [
            password_hash,
            id
        ]);
        return result.affectedRows;
    }
    async updateBioById(bio, id, options = {}) {
        const db = options.transaction || database;
        const sql = `UPDATE user
                SET bio = ?
                WHERE id = ?`;
        const result = await db.query(sql, [bio, id]);
        if (result.affectedRows === 0) {

        return null; 
    }
        return this.findById(id, options);
    }
    async updateContactNoById(contact_no, id, options = {}) {
        const db = options.transaction || database;
        const sql = `UPDATE user
                SET contact_no = ? 
                WHERE id = ?`;
        const result = await db.query(sql, [
            contact_no,
            id
        ]);
        return this.findById(id, options);
    }
    async updateFullNameById(fullname, id, options = {}) {
        const db = options.transaction || database;
        const sql = `UPDATE user
                SET fullname = ? 
                WHERE id = ?`;
        const result = await db.query(sql, [
            fullname,
            id
        ]);
        return this.findById(id, options);
    }
    async updateEmailById(email, id, options = {}) {
        const db = options.transaction || database;
        const sql = `UPDATE user
                SET email = ? 
                WHERE id = ?`;
        const result = await db.query(sql, [
            email,
            id
        ]);
        return this.findById(id, options);
    }
    async updateUserRole(role, id, options={}){
        const db = options.transaction || database;
        const sql =`UPDATE user
                    SET role =?
                    WHERE id = ?`;
        const result = await db.query(sql,[role, id]);
        return result.affectedRows;
    }
}
export default new User();
//Delete Operation

//Other Operations

