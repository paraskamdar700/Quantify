import express from 'express';
import dotenv from 'dotenv'; 
import { checkDbConnection } from './db/db.js';

dotenv.config();
const app = express();

app.get('/', (req, res) => {
    res.send('Hello World!pk');
})

checkDbConnection().then(()=>{
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
    });

});
