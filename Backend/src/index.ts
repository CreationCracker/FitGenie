import express, { Request, Response, NextFunction } from 'express';
import 'dotenv/config';
import { connectDB } from './database.js';


const PORT = process.env.PORT || 3000;

const app = express();


app.use(express.json());
connectDB()

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: "Server is running smoothly!",
    status: "success"
  });
});


app.get('/health', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});


app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


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