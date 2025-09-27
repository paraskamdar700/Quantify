import mysql from 'mysql2/promise';

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'rootpassword',
            database: 'quantify_db'
        });
        
        console.log('✅ Connected to database successfully!');
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.log('❌ Connection failed:', error.message);
        process.exit(1);
    }
}

testConnection();