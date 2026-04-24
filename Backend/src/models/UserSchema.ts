import mongoose, { Schema, Document, Types } from "mongoose";

export type FitnessLevel = "beginner" | "intermediate" | "advanced";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string; 
  googleId?: string;     
  image?: string;        
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
  
  // Added as a readonly property since it's computed
  readonly planCount: number; 
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { 
      type: String, 
      required: function(this: IUser) { 
        return !this.googleId; 
      } 
    },
    googleId: { type: String, unique: true, sparse: true },
    image: { type: String },
    age: { type: Number, min: 1, max: 120 },
    heightCm: { type: Number, min: 50, max: 300 },
    weightKg: { type: Number, min: 20, max: 500 },
    level: { 
      type: String, 
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner"
    },
    medicalIssues: [{ type: String, trim: true }], 
    memberSince: { type: Date, default: Date.now },
    streak: { type: Number, default: 0 },
    totalTasksDone: { type: Number, default: 0 },
    currentGoalId: { type: Schema.Types.ObjectId, ref: "Goal" },
    pastGoals: [{ type: Schema.Types.ObjectId, ref: "Goal" }],
  },
  { 
    timestamps: true,
    // Ensure virtuals are included when converting to JSON/Objects
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Define the virtual property
UserSchema.virtual("planCount").get(function (this: IUser) {
  const current = this.currentGoalId ? 1 : 0;
  const past = this.pastGoals ? this.pastGoals.length : 0;
  return current + past;
});

export const User = mongoose.model<IUser>("User", UserSchema);