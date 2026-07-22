import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./database.js";
import userRoutes from "./routes/userRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";
import chatRoute from "./routes/chatroute.js";
// Configs
const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:8080";

const app = express();

// ✅ CORS CONFIG (VERY IMPORTANT for Google Auth + Cookies)
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:8080", // optional
    ],
    credentials: true,
  })
);

// ✅ Middlewares
app.use(express.json());
app.use(cookieParser());

// ✅ Routes
app.use("/user", userRoutes);
app.use("/goals", goalRoutes);
app.use("/ai", chatRoute);

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
    console.error("❌ Server failed to start:");
    if (err instanceof Error) {
      console.error("Error:", err.message);
      console.error("Stack:", err.stack);
    } else {
      console.error("Unknown error:", err);
    }
    process.exit(1);
  }
};

start();

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});