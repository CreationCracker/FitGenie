import mongoose, { Schema, Document, Types } from "mongoose";

// ---------------------------------------------------------
// 1. Base Task Fields (unchanged)
// ---------------------------------------------------------

export interface IBaseTask {
  _id?: Types.ObjectId;
  title: string;
  scheduledTime?: string;
  done: boolean;
  missed: boolean;
  order: number;
}

export interface IMealTask extends IBaseTask {
  ingredients: string[];
  calories: number;
  protein: number;
}

export interface IExerciseTask extends IBaseTask {
  sets: number;
  repsOrDuration: string;
  restSeconds: number;
  notes?: string;
}

const baseTaskFields = {
  title: { type: String, required: true, trim: true },
  scheduledTime: { type: String },
  done: { type: Boolean, default: false },
  missed: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
};

const MealTaskSchema = new Schema<IMealTask>(
  {
    ...baseTaskFields,
    ingredients: { type: [String], default: [] },
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
  },
  { _id: true }
);

const ExerciseTaskSchema = new Schema<IExerciseTask>(
  {
    ...baseTaskFields,
    sets: { type: Number, required: true },
    repsOrDuration: { type: String, required: true },
    restSeconds: { type: Number, required: true },
    notes: { type: String, trim: true },
  },
  { _id: true }
);

// ---------------------------------------------------------
// 2. NEW: Day-level wrappers (mirrors AI response)
// ---------------------------------------------------------

// Meal Day — one entry per calendar date in the plan
export interface IMealDay {
  _id?: Types.ObjectId;
  date: string;           // "2026-04-25"
  dayLabel: string;       // "Saturday"
  meals: IMealTask[];
  totalDailyCalories: number;
  totalDailyProtein: number;
}

// Exercise Day — one entry per calendar date in the plan
export interface IExerciseDay {
  _id?: Types.ObjectId;
  date: string;           // "2026-04-25"
  dayLabel: string;       // "Saturday"
  focus: string;          // "Full Body Strength & Cardio" | "Rest Day"
  exercises: IExerciseTask[];
  isRestDay: boolean;
}

const MealDaySchema = new Schema<IMealDay>(
  {
    date: { type: String, required: true },
    dayLabel: { type: String, required: true },
    meals: { type: [MealTaskSchema], default: [] },
    totalDailyCalories: { type: Number, default: 0 },
    totalDailyProtein: { type: Number, default: 0 },
  },
  { _id: true }
);

const ExerciseDaySchema = new Schema<IExerciseDay>(
  {
    date: { type: String, required: true },
    dayLabel: { type: String, required: true },
    focus: { type: String, default: "" },
    exercises: { type: [ExerciseTaskSchema], default: [] },
    isRestDay: { type: Boolean, default: false },
  },
  { _id: true }
);

// ---------------------------------------------------------
// 3. Goal Interface & Schema (updated)
// ---------------------------------------------------------

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
  // userId: Types.ObjectId;
  title: string;
  fitnessGoals: GoalType[];
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

  // Aggregate Lists
  groceryList: string[];
  equipmentNeeded: string[];

  // ✅ NEW: Day-grouped plans (matches AI response structure)
  mealPlan: IMealDay[];
  exercisePlan: IExerciseDay[];
}

const GoalSchema = new Schema<IGoal>(
  {
    
    title: { type: String, required: true, trim: true },
    fitnessGoals: [
      {
        type: String,
        enum: ["gym", "yoga", "diet", "cardio"],
        required: true,
      },
    ],
    physiqueTarget: {
      type: String,
      enum: [
        "Lose Weight",
        "Build Muscle",
        "Get Toned",
        "Increase Flexibility",
        "Improve Endurance",
        "General Fitness",
      ],
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
      default: "active",
    },

    // Aggregate Lists
    groceryList: { type: [String], default: [] },
    equipmentNeeded: { type: [String], default: [] },

    // ✅ Day-grouped subdocuments
    mealPlan: { type: [MealDaySchema], default: [] },
    exercisePlan: { type: [ExerciseDaySchema], default: [] },
  },
  { timestamps: true }
);
GoalSchema.pre("validate", function (this: IGoal) {
  if (this.startDate && this.durationDays && !this.endDate) {
    const end = new Date(this.startDate);
    end.setDate(end.getDate() + this.durationDays);
    this.endDate = end;
  }
});

export const Goal = mongoose.model<IGoal>("Goal", GoalSchema);