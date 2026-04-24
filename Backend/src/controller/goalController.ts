

import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { User, IUser } from "../models/UserSchema.js";
import { Types } from "mongoose";
import { Goal, IGoal, IMealDay, IExerciseDay } from "../models/GoalSchema.js";

// ─── Types matching the AI response structure ─────────────────────────────────

interface AIMeal {
  name: string;
  scheduled_time: string;
  ingredients: string[];
  calories: number;
  protein: number;
}

interface AIMealDay {
  date: string;
  day_label: string;
  total_daily_calories: number;
  total_daily_protein: number;
  meals: AIMeal[];
}

interface AIExercise {
  name: string;
  scheduled_time: string;
  sets: number;
  reps_or_duration: string;
  rest_seconds: number;
  notes?: string;
}

interface AIExerciseDay {
  date: string;
  day_label: string;
  focus: string;
  exercises: AIExercise[];
}

interface AIResponse {
  meal_plan: AIMealDay[];
  workout_plan: AIExerciseDay[];
  grocery_list: string[];
  equipment_needed: string[];
}

interface UserGoalParams {
  title: string;
  fitnessGoals: string[];
  physiqueTarget: string;
  medicalConditions: string[];
  dietPreference?: string;
  notes?: string;
  durationDays: number;
}

// ─── Internal helper: parse AI raw JSON and map to Mongoose subdocs ───────────

export const processAndSaveAIGoal = async (
  userId: string,
  rawText: string,
  userParams: UserGoalParams
): Promise<IGoal> => {
  let aiData: AIResponse;
  try {
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    aiData = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Failed to parse AI response as JSON: ${err}`);
  }

  const mealPlan: IMealDay[] = (aiData.meal_plan ?? []).map((day) => ({
    date: day.date,
    dayLabel: day.day_label,
    totalDailyCalories: day.total_daily_calories ?? 0,
    totalDailyProtein: day.total_daily_protein ?? 0,
    meals: (day.meals ?? []).map((meal, idx) => ({
      title: meal.name,
      scheduledTime: meal.scheduled_time,
      done: false,
      missed: false,
      order: idx,
      ingredients: meal.ingredients ?? [],
      calories: meal.calories ?? 0,
      protein: meal.protein ?? 0,
    })),
  }));

  const exercisePlan: IExerciseDay[] = (aiData.workout_plan ?? []).map((day) => ({
    date: day.date,
    dayLabel: day.day_label,
    focus: day.focus ?? "",
    isRestDay: (day.exercises ?? []).length === 0,
    exercises: (day.exercises ?? []).map((ex, idx) => ({
      title: ex.name,
      scheduledTime: ex.scheduled_time,
      done: false,
      missed: false,
      order: idx,
      sets: ex.sets ?? 1,
      repsOrDuration: ex.reps_or_duration ?? "",
      restSeconds: ex.rest_seconds ?? 60,
      notes: ex.notes ?? "",
    })),
  }));

const allDates = [
  ...(mealPlan).map((d) => d.date),
  ...(exercisePlan).map((d) => d.date),
].filter((d): d is string => Boolean(d)).sort();

const firstDate = allDates.length > 0 ? allDates[0] : undefined;
const lastDate  = allDates.length > 0 ? allDates[allDates.length - 1] : undefined;

const startDate = firstDate ? new Date(firstDate) : new Date();
const endDate   = lastDate  ? new Date(lastDate)  : new Date();

const durationDays =
  Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const goal = new Goal({
    userId: new Types.ObjectId(userId),
    title: userParams.title,
    fitnessGoals: userParams.fitnessGoals,
    physiqueTarget: userParams.physiqueTarget,
    medicalConditions: userParams.medicalConditions ?? [],
    dietPreference: userParams.dietPreference,
    notes: userParams.notes,
    durationDays,
    startDate,
    endDate,
    groceryList: aiData.grocery_list ?? [],
    equipmentNeeded: aiData.equipment_needed ?? [],
    mealPlan,
    exercisePlan,
    progress: 0,
    isActive: true,
    status: "active",
  });

  await goal.save();
  return goal;
};

// ─── Helper: save a plan from already-mapped frontend data (after approval) ───

const saveConfirmedGoal = async (
  userId: string,
  body: any
): Promise<IGoal> => {
  // mealPlan and exercisePlan arrive already mapped from PlanFeedback.tsx
  const mealPlan: IMealDay[] = (body.mealPlan ?? []).map((day: any) => ({
    date: day.date,
    dayLabel: day.dayLabel,
    totalDailyCalories: day.totalDailyCalories ?? 0,
    totalDailyProtein: day.totalDailyProtein ?? 0,
    meals: (day.meals ?? []).map((m: any, idx: number) => ({
      title: m.title,
      scheduledTime: m.scheduledTime,
      done: false,
      missed: false,
      order: idx,
      ingredients: m.ingredients ?? [],
      calories: m.calories ?? 0,
      protein: m.protein ?? 0,
    })),
  }));

  const exercisePlan: IExerciseDay[] = (body.exercisePlan ?? []).map((day: any) => ({
    date: day.date,
    dayLabel: day.dayLabel,
    focus: day.focus ?? "",
    isRestDay: day.isRestDay ?? (day.exercises ?? []).length === 0,
    exercises: (day.exercises ?? []).map((ex: any, idx: number) => ({
      title: ex.title,
      scheduledTime: ex.scheduledTime,
      done: false,
      missed: false,
      order: idx,
      sets: ex.sets ?? 1,
      repsOrDuration: ex.repsOrDuration ?? "",
      restSeconds: ex.restSeconds ?? 60,
      notes: ex.notes ?? "",
    })),
  }));

const allDates = [
  ...(mealPlan).map((d) => d.date),
  ...(exercisePlan).map((d) => d.date),
].filter((d): d is string => Boolean(d)).sort();

const firstDate = allDates.length > 0 ? allDates[0] : undefined;
const lastDate  = allDates.length > 0 ? allDates[allDates.length - 1] : undefined;

const startDate = firstDate ? new Date(firstDate) : new Date();
const endDate   = lastDate  ? new Date(lastDate)  : new Date();

const durationDays =
  Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const goal = new Goal({
    userId: new Types.ObjectId(userId),
    title: body.title,
    fitnessGoals: Array.isArray(body.fitnessGoals) ? body.fitnessGoals : [body.fitnessGoals],
    physiqueTarget: body.physiqueTarget,
    medicalConditions: body.medicalConditions ?? [],
    dietPreference: body.dietPreference ?? undefined,
    notes: body.notes ?? undefined,
    durationDays,
    startDate,
    endDate,
    groceryList: body.groceryList ?? [],
    equipmentNeeded: body.equipmentNeeded ?? [],
    mealPlan,
    exercisePlan,
    progress: 0,
    isActive: true,
    status: "active",
  });

  await goal.save();
  return goal;
};

// ─── ROUTE HANDLERS ───────────────────────────────────────────────────────────

/**
 * POST /goals/generate-preview
 *
 * Calls the Python AI service and returns the generated plan to the frontend
 * WITHOUT saving anything to MongoDB. The user reviews the plan first.
 *
 * Body: { userId, title, type, physiqueTarget, durationDays,
 *         medicalConditions, dietPreference, notes }
 *
 * Returns: { threadId, meal_plan, workout_plan, grocery_list, equipment_needed }
 */
export const generateGoalPreview = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      userId,
      title,
      type,
      physiqueTarget,
      durationDays,
      medicalConditions,
      dietPreference,
      notes,
    } = req.body;

    if (!userId || !title || !type || !physiqueTarget || !durationDays) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const user: IUser | null = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const formattedStartDate = new Date().toISOString().split("T")[0];

    const aiPayload = {
      userId,
      title,
      notes: notes ?? "",
      type,
      physiqueTarget,
      durationDays: Number(durationDays) || 7,
      medicalConditions: medicalConditions || user?.medicalIssues || [],
      dietPreference: dietPreference ? [dietPreference] : [],
      start_date: formattedStartDate,
      target_calories: 2000,
      target_protein: 150,
      days_per_week: Math.min(Number(durationDays), 4),
      fitness_level: user?.level || "Beginner",
      available_equipment: [],
    };

    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8003";
    console.log(`[generateGoalPreview] Calling AI: ${aiServiceUrl}/api/plans/generate`);

    const aiResponse = await fetch(`${aiServiceUrl}/api/plans/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aiPayload),
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.text();
      console.error("[generateGoalPreview] AI Service Error:", errorData);
      throw new Error(`AI Service failed: ${aiResponse.status} - ${errorData}`);
    }

    // The Python service returns JSON directly with meal_plan, workout_plan, etc.
    const aiData = await aiResponse.json();
    console.log("[generateGoalPreview] AI responded — returning preview to frontend");

    // Return the raw AI plan to the frontend — nothing saved yet
    res.status(200).json({
      threadId: userId,
      meal_plan: (aiData as AIResponse).meal_plan ?? [],
      workout_plan: (aiData as AIResponse).workout_plan ?? [],
      grocery_list: (aiData as AIResponse).grocery_list ?? [],
      equipment_needed: (aiData as AIResponse).equipment_needed ?? [],
    });
  } catch (error: any) {
    console.error("[generateGoalPreview] Error:", error);
    const status = error.message?.includes("AI Service") ? 503 : 500;
    res.status(status).json({
      error: status === 503 ? "AI service unavailable" : "Internal Server Error",
      details: error.message,
    });
  }
};

/**
 * POST /goals/confirm
 *
 * Called AFTER the user approves the plan on the PlanFeedback page.
 * 1. Notifies Python AI service that user is satisfied (closes the HITL loop)
 * 2. Saves the approved plan to MongoDB
 *
 * Body: {
 *   userId, threadId,
 *   mealPlan, exercisePlan, groceryList, equipmentNeeded,  ← from frontend state
 *   title, fitnessGoals, physiqueTarget, medicalConditions,
 *   dietPreference?, notes?
 * }
 *
 * Returns: { message, goalId }
 */
export const confirmAndSaveGoal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, threadId } = req.body;

    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Step 1: Tell Python AI service the user is satisfied — closes the HITL loop
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8003";
    console.log(`[confirmAndSaveGoal] Notifying Python AI service — thread: ${threadId}`);
    try {
      await fetch(`${aiServiceUrl}/api/plans/feedback/${userId}/1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_satisfied: true }),
      });
    } catch (aiErr) {
      // Non-fatal — log it but still save to MongoDB
      console.warn("[confirmAndSaveGoal] Could not notify AI service:", aiErr);
    }

    // Step 2: Save to MongoDB
    console.log(`[confirmAndSaveGoal] Saving approved plan for user ${userId}`);
    const goal = await saveConfirmedGoal(userId, req.body);

    res.status(201).json({
      message: "Goal saved successfully!",
      goalId: goal._id,
    });
  } catch (error: any) {
    console.error("[confirmAndSaveGoal] Error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};

/**
 * POST /goals/regenerate
 *
 * Called when user is NOT satisfied and submits feedback on PlanFeedback page.
 * 1. Proxies the feedback to Python AI service
 * 2. Python regenerates the plan via LangGraph
 * 3. Returns the new plan to the frontend (still NOT saved to MongoDB)
 *
 * Body: { userId, threadId, mealFeedback?, exerciseFeedback? }
 *
 * Returns: { meal_plan, workout_plan, grocery_list, equipment_needed }
 */
export const regenerateGoalPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, threadId, mealFeedback, exerciseFeedback } = req.body;

    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8003";
    console.log(`[regenerateGoalPlan] Sending feedback to Python AI — thread: ${threadId}, user: ${userId}`);

    const aiResponse = await fetch(`${aiServiceUrl}/api/plans/feedback/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        is_satisfied: false,
        meal_feedback: mealFeedback ?? null,
        exercise_feedback: exerciseFeedback ?? null,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[regenerateGoalPlan] Python AI error:", errorText);
      throw new Error(`AI Service failed: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log("[regenerateGoalPlan] Regenerated plan received from Python");

    // Return the new plan to the frontend — still NOT saved to MongoDB
    res.status(200).json({
      meal_plan: ( aiData as AIResponse).meal_plan ?? [],
      workout_plan: ( aiData as AIResponse).workout_plan ?? [],
      grocery_list: ( aiData as AIResponse).grocery_list ?? [],
      equipment_needed: ( aiData as AIResponse).equipment_needed ?? [],
    });
  } catch (error: any) {
    console.error("[regenerateGoalPlan] Error:", error);
    const status = error.message?.includes("AI Service") ? 503 : 500;
    res.status(status).json({
      error: status === 503 ? "AI service unavailable" : "Internal Server Error",
      details: error.message,
    });
  }
};

/**
 * POST /goals/create-with-ai   (legacy — kept for backward compat)
 *
 * Original one-shot endpoint: generates AND saves in one call.
 * Prefer the generate-preview + confirm two-step flow for new UI.
 */
export const createGoalWithAI = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      userId,
      title,
      type,
      physiqueTarget,
      durationDays,
      medicalConditions,
      dietPreference,
      notes,
    } = req.body;

    if (!userId || !title || !type || !physiqueTarget || !durationDays) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const user: IUser | null = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const formattedStartDate = new Date().toISOString().split("T")[0];

    const aiPayload = {
      userId,
      title,
      notes: notes ?? "",
      type,
      physiqueTarget,
      durationDays: Number(durationDays) || 7,
      medicalConditions: medicalConditions || user?.medicalIssues || [],
      dietPreference: dietPreference ? [dietPreference] : [],
      start_date: formattedStartDate,
      target_calories: 2000,
      target_protein: 150,
      days_per_week: Math.min(Number(durationDays), 4),
      fitness_level: user?.level || "Beginner",
      available_equipment: [],
    };

    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8003";
    const aiResponse = await fetch(`${aiServiceUrl}/api/plans/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aiPayload),
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.text();
      throw new Error(`AI Service failed: ${aiResponse.status} - ${errorData}`);
    }

    const rawText = await aiResponse.text();
    const userParams: UserGoalParams = {
      title,
      fitnessGoals: Array.isArray(type) ? type : [type],
      physiqueTarget,
      medicalConditions: medicalConditions || user?.medicalIssues || [],
      dietPreference: dietPreference ?? undefined,
      notes: notes ?? undefined,
      durationDays: Number(durationDays) || 7,
    };

    const finalGoal = await processAndSaveAIGoal(userId, rawText, userParams);

    res.status(201).json({
      message: "Goal successfully generated and saved!",
      goalId: finalGoal._id,
    });
  } catch (error: any) {
    console.error("Error creating AI goal:", error);
    const status = error.message?.includes("AI Service") ? 503 : 500;
    res.status(status).json({
      error: status === 503 ? "AI service unavailable" : "Internal Server Error",
      details: error.message,
    });
  }
};

// ─── Other existing controllers ───────────────────────────────────────────────

export const getUserGoals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const goals = await Goal.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(goals);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch goals" });
  }
};

export const toggleTaskStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { goalId, taskId } = req.params;
  try {
    // TODO: implement nested subdoc toggle for mealPlan/exercisePlan tasks
    res.status(501).json({ message: "Not yet implemented" });
  } catch (error) {
    console.error("Task Toggle Error:", error);
    res.status(500).json({ message: "Error updating task" });
  }
};

export const getGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  const { goalId } = req.params;
  try {
    const goal = await Goal.findById(goalId);
    if (!goal) {
      res.status(404).json({ message: "Goal not found" });
      return;
    }
    res.status(200).json(goal);
  } catch (error) {
    console.error("Get Goal Error:", error);
    res.status(500).json({ message: "Error fetching goal" });
  }
};








