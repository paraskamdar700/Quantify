import database from "../config/database";

class User{
        // Create Operation
    async createUser(userdata) {
        const sql = `INSERT INTO user (fullname, contact_no, email, password_hash, role, avatar, bio, firm_id,) 
                        VALUE(?,?,?,?,?,?,?,?)`;
       const reasult =  await database.query(sql,[
                userdata.fullname,
                userdata.contact_no,
                userdata.email,
                userdata.password_hash,
                userdata.role,
                userdata.bio,
                userdata.firm_id
        ]);
        return await this.findById(reasult.insertId);
    }
        // Read Operations
    async findById(id){
        const sql=`SELECT * FROM user WHERE id = ?`;
            const reasult = await database.query(sql, [id]);
            return reasult;
    }
    async findByEmail(email){
        const sql = `SELECT * FROM user WHERE email = ?`;
        const reasult = await database.query(sql, [email]);
        return reasult;
        
    }
    async findByFirmId(firmid){
        const sql = `SELECT * FORM user WHERE firm firm_id =?`;
            const reasult = await database.query(sql, [firmid])
            return reasult;
    }
    //Update Operation
    async updateUserById(userdata, id) {
      const sql =`UPDATE user
                SET fullname = ?, 
                password_hash = ?,
                avatar = ?, 
                bio= ? 
                WHERE id = ?`;
      const result = await database.query(sql, [
        userdata.fullname,
        userdata.password_hash,
        userdata.avatar,
        userdata.bio,
        id 
    ]);
    return await this.findById(id);
}
}
export default new User;
//Delete Operation

//Other Operations
    



// export const updateUser = async (req, res) => {
//     try {
//         const userId = req.user.id; // or from params if admin is updating others
//         const { fullname, bio, email, role } = req.body;

//         // Allow only certain fields to be updated
//         const updateData = {};
//         if (fullname !== undefined) updateData.fullname = fullname;
//         if (bio !== undefined) updateData.bio = bio;
//         if (email !== undefined) updateData.email = email;
//         if (role !== undefined && ['owner', 'admin', 'staff'].includes(role)) {
//             updateData.role = role;
//         }

//         const updatedUser = await User.update(userId, updateData);

//         res.json({
//             success: true,
//             message: "User updated successfully",
//             data: updatedUser
//         });

//     } catch (error) {
//         res.status(400).json({
//             success: false,
//             error: error.message
//         });
//     }
// };
