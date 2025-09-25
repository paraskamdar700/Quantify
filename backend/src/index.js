import express from 'express';
import dotenv from 'dotenv';
import { PORT} from './constant.js';


const app = express();
dotenv.config();

app.get('/', (req, res) => {
    res.send('Hello Worldgbnhfdghb!');
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
