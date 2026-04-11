import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";



export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required. No token provided." });
    }

    const token = authHeader.split(" ")[1];

   
    if (!token) {
      return res.status(401).json({ message: "Malformed token." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
    (req as any).user = decoded;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({ message: "Invalid or expired token. Please log in again." });
  }
};