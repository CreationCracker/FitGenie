//Imports 


import express, { Request, Response, NextFunction } from 'express';
import 'dotenv/config';
import { connectDB } from './database.js';
import userRoutes from './routes/userRoutes.js';
import cors from "cors";



//definitions
const PORT = process.env.PORT || 3000;




//setup


const app = express();




//middlewares


app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
app.use(express.json());
connectDB()
app.use(cors());



//routes


app.use('/', userRoutes);


//server listening


const start = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("❌ DB connection failed", err);
    process.exit(1);
  }
};

start();