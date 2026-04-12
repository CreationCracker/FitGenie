import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./database.js";
import userRoutes from "./routes/userRoutes.js";

// Configs
const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:8080";

const app = express();

// ✅ CORS CONFIG (VERY IMPORTANT for Google Auth + Cookies)
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);

// ✅ Middlewares
app.use(express.json());
app.use(cookieParser());

// ✅ Routes
app.use("/", userRoutes);

// ✅ Global Error Handler
const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something broke!" });
};

app.use(errorHandler);

// ✅ Server Start
const start = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`⚡ Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ DB connection failed", err);
    process.exit(1);
  }
};

start();