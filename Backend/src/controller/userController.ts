import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/UserSchema.js";
import { Goal } from "../models/GoalSchema.js";
import { OAuth2Client } from "google-auth-library";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "none" as const,
  maxAge: 24 * 60 * 60 * 1000,
};

// ================= HELPER =================

const generateToken = (userId: any) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || "fallback_secret",
    { expiresIn: "1d" }
  );
};

const setTokenCookie = (res: Response, token: string) => {
  res.cookie("token", token, COOKIE_OPTIONS);
};

// ================= LOGIN =================

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ message: "Please log in with Google" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);
    setTokenCookie(res, token);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ================= SIGNUP =================

export const signupUser = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      passwordHash: hashedPassword,
      name,
      memberSince: new Date(),
      streak: 0,
      totalTasksDone: 0,
    });

    await newUser.save();

    const token = generateToken(newUser._id);
    setTokenCookie(res, token);

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
      },
    });

  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ================= GOOGLE LOGIN =================

export const googleLogin = async (req: Request, res: Response) => {
  const { token } = req.body;
  const googleClientId = process.env.GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    return res.status(500).json({ message: "Google client ID not configured" });
  }

  try {
    const client = new OAuth2Client(googleClientId);

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        name,
        image: picture,
        googleId,
        memberSince: new Date(),
        streak: 0,
        totalTasksDone: 0,
      });

      await user.save();
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    const appToken = generateToken(user._id);
    setTokenCookie(res, appToken);

    res.status(200).json({
      token: appToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });

  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};

// ================= LOGOUT =================

export const logoutUser = (_req: Request, res: Response) => {
  res.clearCookie("token", { ...COOKIE_OPTIONS, path: "/" });
  res.status(200).json({ message: "Logged out successfully" });
};

// ================= GET CURRENT USER =================

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await User.findById(userId).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });

  } catch (error) {
    console.error("Get Current User Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET MY GOALS (🔥 NEW) =================

export const getMyGoals = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // ✅ Fetch all goals of user (NO tasks for performance)
    const goals = await Goal.find({ userId })
      .select("-tasks")
      .sort({ createdAt: -1 });

    const activeGoals = goals.filter(g => g.status === "active");
    const pastGoals = goals.filter(
      g => g.status === "completed" || g.status === "abandoned"
    );

    res.status(200).json({
      activeGoals,
      pastGoals
    });

  } catch (error) {
    console.error("Get My Goals Error:", error);
    res.status(500).json({ message: "Failed to fetch goals" });
  }
};

// ================= UPDATE PROFILE =================

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const { name, age, heightCm, weightKg, level, medicalIssues } = req.body;

    const updateFields: any = {
      age,
      heightCm,
      weightKg,
      level,
      medicalIssues
    };

    if (name?.trim()) {
      updateFields.name = name.trim();
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ================= GET PROFILE =================

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await User.findById(userId).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });

  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};