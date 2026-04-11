import mongoose, { Schema, Document, Types } from "mongoose";

export type FitnessLevel = "beginner" | "intermediate" | "advanced";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  level?: FitnessLevel;
  medicalIssues?: string[]; 
  memberSince: Date;
  streak: number;
  totalTasksDone: number;
  currentGoalId?: Types.ObjectId;
  pastGoals: Types.ObjectId[];
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    age: { type: Number, min: 1, max: 120 },
    heightCm: { type: Number, min: 50, max: 300 },
    weightKg: { type: Number, min: 20, max: 500 },
    level: { 
      type: String, 
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner"
    },
    // Added: Defines an array of strings, trimming whitespace from each entry
    medicalIssues: [{ type: String, trim: true }], 
    memberSince: { type: Date, default: Date.now },
    streak: { type: Number, default: 0 },
    totalTasksDone: { type: Number, default: 0 },
    currentGoalId: { type: Schema.Types.ObjectId, ref: "Goal" },
    pastGoals: [{ type: Schema.Types.ObjectId, ref: "Goal" }],
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);