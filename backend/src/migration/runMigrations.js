import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import database from '../config/database.js';

class MigrationRunner {
    constructor() {
        this.migrationsTable = 'migration_tracker';
    }

    async init() {
        await database.init();
        await this.createMigrationsTable();
    }

    async createMigrationsTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                migration_name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB
        `;
        await database.query(sql);
    }

    async getExecutedMigrations() {
        try {
            const migrations = await database.query(
                `SELECT migration_name FROM ${this.migrationsTable} ORDER BY executed_at`
            );
            return migrations.map(m => m.migration_name);
        } catch (error) {
            return [];
        }
    }

    async markMigrationExecuted(migrationName) {
        await database.query(
            `INSERT INTO ${this.migrationsTable} (migration_name) VALUES (?)`,
            [migrationName]
        );
    }

    async getPendingMigrations() {
        const files = await fs.readdir(__dirname);
        const sqlFiles = files
            .filter(file => file.endsWith('.sql') && file.startsWith('0'))
            .sort();

        const executedMigrations = await this.getExecutedMigrations();
        const pendingMigrations = sqlFiles.filter(file => 
            !executedMigrations.includes(file)
        );

        return pendingMigrations;
    }

    async runMigration(file) {
        const filePath = path.join(__dirname, file);
        const sql = await fs.readFile(filePath, 'utf8');
        
        console.log(`🔄 Running: ${file}`);
        
        // Split SQL by semicolons to handle multiple statements
        const statements = sql.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                await database.query(statement);
            }
        }
        
        await this.markMigrationExecuted(file);
        console.log(`✅ Completed: ${file}`);
    }

    async runMigrations() {
        try {
            await this.init();
            
            const pendingMigrations = await this.getPendingMigrations();
            console.log(`📦 Pending migrations: ${pendingMigrations.length}`);
            
            if (pendingMigrations.length === 0) {
                console.log('🎉 All migrations are already up to date!');
                return;
            }

            // Disable foreign key checks for the entire migration process
            await database.query('SET FOREIGN_KEY_CHECKS = 0');

            for (const migration of pendingMigrations) {
                try {
                    await this.runMigration(migration);
                } catch (error) {
                    console.error(`❌ Failed: ${migration}`, error.message);
                    
                    // If it's a foreign key error, try without foreign keys
                    if (error.code === 'ER_CANT_CREATE_TABLE' && error.errno === 1005) {
                        console.log('🔄 Retrying without foreign keys...');
                        await this.runMigrationWithoutForeignKeys(migration);
                    } else {
                        throw error;
                    }
                }
            }

            // Re-enable foreign key checks
            await database.query('SET FOREIGN_KEY_CHECKS = 1');
            
            console.log('🎉 All migrations completed successfully!');

        } catch (error) {
            console.error('💥 Migration failed:', error.message);
            // Re-enable foreign key checks even on failure
            await database.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
            process.exit(1);
        }
    }

    async runMigrationWithoutForeignKeys(file) {
        const filePath = path.join(__dirname, file);
        let sql = await fs.readFile(filePath, 'utf8');
        
        // Remove FOREIGN KEY constraints temporarily
        sql = sql.replace(/,\s*FOREIGN KEY\s*\([^)]+\)\s*REFERENCES[^,)]+/gi, '');
        
        const statements = sql.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                await database.query(statement);
            }
        }
        
        await this.markMigrationExecuted(file);
        console.log(`✅ Completed (without FKs): ${file}`);
    }
}

// Run migrations if this file is executed directly
if (process.argv[1] === __filename) {
    const runner = new MigrationRunner();
    runner.runMigrations();
}

export default MigrationRunner;