
import mongoose, { Schema, Document, Types } from "mongoose";
export interface ITask {
  _id?: Types.ObjectId; 
  date: string;
  title: string;
  scheduledTime: string;
  done: boolean;
  missed: boolean;
  order: number;
}

const DailyTaskSchema = new Schema<ITask>(
  {
    date: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    scheduledTime: { type: String, required: true },
    done: { type: Boolean, default: false },
    missed: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type GoalType = "gym" | "yoga" | "diet" | "cardio";
export type PhysiqueTarget =
  | "Lose Weight"
  | "Build Muscle"
  | "Get Toned"
  | "Increase Flexibility"
  | "Improve Endurance"
  | "General Fitness";
export type GoalStatus = "active" | "completed" | "abandoned";

export interface IGoal extends Document {
  userId: Types.ObjectId;
  title: string;
  type: GoalType;
  physiqueTarget: PhysiqueTarget;
  medicalConditions: string[];
  dietPreference?: string;
  notes?: string;
  durationDays: number;
  startDate: Date;
  endDate: Date;
  progress: number;
  isActive: boolean;
  status: GoalStatus;
  tasks: ITask[]; 
}

const GoalSchema = new Schema<IGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ["gym", "yoga", "diet", "cardio"], required: true },
    physiqueTarget: {
      type: String,
      enum: ["Lose Weight", "Build Muscle", "Get Toned", "Increase Flexibility", "Improve Endurance", "General Fitness"],
      required: true,
    },
    medicalConditions: { type: [String], default: [] },
    dietPreference: { type: String, trim: true },
    notes: { type: String, trim: true },
    durationDays: { type: Number, required: true, min: 1 },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active"
    },
    tasks: [DailyTaskSchema]
  },
  { timestamps: true }
);

GoalSchema.pre("validate", function (next) {
  if (this.startDate && this.durationDays && !this.endDate) {
    const end = new Date(this.startDate);
    end.setDate(end.getDate() + this.durationDays);
    this.endDate = end;
  }
//   next();
});

export const Goal = mongoose.model<IGoal>("Goal", GoalSchema);

