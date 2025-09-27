import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Load .env from the root directory (where package.json is)
dotenv.config({ path: path.resolve(dirname, '../../../.env') });
console.log('Environment variables:', {
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_NAME: process.env.DB_NAME,  // Check if this is defined
    DB_PORT: process.env.DB_PORT
});


const config = {
  development: {
    database: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_ROOT_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    },
    port: process.env.PORT || 5000
  }
};

export default config.development;
