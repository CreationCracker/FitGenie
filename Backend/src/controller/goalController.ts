import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { Goal, IGoal, ITask } from "../models/GoalSchema.js";
import { User, IUser } from "../models/UserSchema.js";

/**
 * Fetch all goals for the logged-in user
 */
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

/**
 * Toggle the completion status of a specific task within a goal
 */
export const toggleTaskStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { goalId, taskId } = req.params;
  try {
    const goal = await Goal.findById(goalId);
    if (!goal || !goal.tasks) {
      res.status(404).json({ message: "Goal or tasks not found" });
      return;
    }

    const task = goal.tasks.find((t: any) => t._id?.toString() === taskId);
    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    // Toggle status
    task.done = !task.done;

    // Recalculate progress
    const total = goal.tasks.length;
    const doneCount = goal.tasks.filter((t: any) => t.done).length;
    goal.progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    await goal.save();
    res.status(200).json(goal);
  } catch (error) {
    console.error("Task Toggle Error:", error);
    res.status(500).json({ message: "Error updating task" });
  }
};

/**
 * Create a new goal using the Python AI Service
 */
export const createGoalWithAI = async (req: Request, res: Response): Promise<void> => {
  try {

    const { userId, title, type, physiqueTarget, durationDays, medicalConditions, dietPreference, notes } = req.body;

    // 1. Validation
    if (!userId || !title || !type || !physiqueTarget || !durationDays) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    console.log(req.body);
    const user: IUser | null = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // 2. STRICTURE ISO FORMAT: Python-friendly (YYYY-MM-DDTHH:MM:SS+00:00)
    // We remove the milliseconds and swap 'Z' for '+00:00'
    //const formattedStartDate = new Date().toISOString().split('.')[0] + '+00:00';
// In goalController.ts, change this line:
//const formattedStartDate = new Date().toISOString().split('.')[0] + '+00:00';

// To this (plain format, no timezone suffix):
const formattedStartDate = new Date().toISOString().split('T')[0];
// Produces: "2026-04-13"  ← Python parses this with no issues
// Produces: "2026-04-12 22:11:56"
    // 3. Prepare AI Payload
    const aiPayload = {
      user_context: {
        thread_id: userId,
        medical_conditions: medicalConditions || user.medicalIssues || [],
        // Ensure this is an array of strings
        dietary_preferences: dietPreference ? [dietPreference] : [],
        fitness_level: user.level || 'beginner',
        available_equipment: [] 
      },
      goal_context: {
        title: title,
        type: type,
        physiqueTarget: physiqueTarget,
        durationDays: Number(durationDays),
        startDate: formattedStartDate, 
        user_prompt: `Create a ${type} plan for ${physiqueTarget}`,
        selected_categories: [type],
        primary_targets: [physiqueTarget],
        plan_duration_days: Number(durationDays),
        target_calories: 2000,
        target_protein: 150,
        days_per_week: 4
      }
    };
    console.log("[Backend] AI Payload:", JSON.stringify(aiPayload, null, 2));
    // 4. Call Python AI service
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8001";
    console.log(`[Backend] Sending request to AI: ${aiServiceUrl}/generate-schedule`);

    const aiResponse = await fetch(`${aiServiceUrl}/generate-schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aiPayload)
    });

    if (!aiResponse.ok) {
      const errorData = await aiResponse.text();
      console.error("[Backend] AI Service Error:", errorData);
      throw new Error(`AI Service failed: ${aiResponse.status} - ${errorData}`);
    }
    console.log("[Backend] AI Response:", JSON.stringify(await aiResponse.json(), null, 2));
    const aiData = await aiResponse.json() as any;

    // 5. Map AI tasks to MongoDB Schema
    let tasks: ITask[] = [];
    if (aiData?.tasks && Array.isArray(aiData.tasks)) {
      tasks = aiData.tasks.map((task: any, index: number) => ({
        date: task.date || new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        title: task.title || task.name || `${type} Session`,
        description: task.description || "",
        scheduledTime: task.scheduledTime || "09:00",
        done: false,
        missed: false,
        order: task.order ?? index
      }));
    } else {
      // Fallback logic
      for (let i = 0; i < durationDays; i++) {
        tasks.push({
          date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '',
          title: `${type} - Day ${i + 1}`,
          scheduledTime: "09:00",
          done: false,
          missed: false,
          order: i
        });
      }
    }

    // 6. Save the Goal to Database
    const newGoal = new Goal({
      userId,
      title,
      type,
      physiqueTarget,
      durationDays,
      medicalConditions,
      dietPreference,
      notes,
      startDate: new Date(),
      endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      tasks,
      progress: 0,
      isActive: true,
      status: "active"
    });

    await newGoal.save();

    res.status(201).json({ 
      message: "Goal and AI tasks created successfully!",
      goal: newGoal
    });

  } catch (error: any) {
    console.error("Error creating AI goal:", error);
    const status = error.message.includes("AI Service") ? 503 : 500;
    res.status(status).json({ 
      error: status === 503 ? "AI service unavailable" : "Internal Server Error",
      details: error.message 
    });
  }
};