import express from 'express';
import dotenv from 'dotenv';
import constant from './constant.js';

const app = express();
dotenv.config();

app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.listen(constant.PORT, () => {
    console.log(`Server is running on port ${constant.PORT}`);
});
