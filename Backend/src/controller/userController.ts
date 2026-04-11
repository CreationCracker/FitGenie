import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/UserSchema.js"; // Adjust path to your model

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // 1. Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 2. Compare passwords
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 3. Create JWT Token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || "fallback_secret", 
      { expiresIn: "1d" }
    );

    // 4. Send response
    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const signupUser = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  try {
    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 2. Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Create new user
    const newUser = new User({
      email,
      passwordHash: hashedPassword,
      name,
      memberSince: new Date(),
      streak: 0,
      totalTasksDone: 0
    });

    // 4. Save user to database
    await newUser.save();

    // 5. Create JWT Token
    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1d" }
    );

    // 6. Send response
    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};