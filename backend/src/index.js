import express from 'express';
import dotenv from 'dotenv'; 
import database from './config/database.js';
import path from 'path';
import { fileURLToPath } from 'url';


const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Load .env from root directory
dotenv.config({ path: path.resolve(dirname, '../../.env') });
const app = express();

app.get('/', (req, res) => {
    res.send('Hello World!');
})

const port = process.env.PORT;
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });

    
