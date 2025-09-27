import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import database from '../config/database.js';

async function resetDatabase() {
    try {
        console.log('🚨 Resetting database...');
        await database.init();

        // Debug: Check what SHOW TABLES returns
        const tables = await database.query('SHOW TABLES');
        console.log('Tables result:', JSON.stringify(tables, null, 2));
        console.log('Type of tables:', typeof tables);
        console.log('Is array?', Array.isArray(tables));

        if (!Array.isArray(tables) || tables.length === 0) {
            console.log('✅ No tables to drop');
            return;
        }

        // Disable foreign key checks
        await database.query('SET FOREIGN_KEY_CHECKS = 0');

        // Drop each table
        for (const table of tables) {
            console.log('Table object:', table);
            const tableName = Object.values(table)[0]; // Get the table name
            console.log(`Dropping table: ${tableName}`);
            await database.query(`DROP TABLE IF EXISTS ${tableName}`);
        }

        // Re-enable foreign key checks
        await database.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('✅ Database reset successfully!');
    } catch (error) {
        console.error('❌ Database reset failed:', error);
    } finally {
        process.exit(0);
    }
}

resetDatabase();