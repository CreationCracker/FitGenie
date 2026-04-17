import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Request to include user property
export interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

export const requireAuth = (
  req: AuthRequest, // Use the extended type here
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    // 1. Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } 

    // 2. Check cookies if header is missing
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }

    // 3. Verify
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret"
    ) as { id: string };

    // 4. Inject user into request
    req.user = { id: decoded.id };

    next();
  } catch (error) {
    console.error("Auth Error:", error);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};