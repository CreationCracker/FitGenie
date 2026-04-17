import { Router } from "express";
import { getUserGoals, toggleTaskStatus } from "../controller/goalController.js";
import { requireAuth } from "../middleware/auth.js";
import { createGoalWithAI } from "../controller/goalController.js";
const router = Router();

router.get("/", requireAuth, getUserGoals);
router.patch("/:goalId/tasks/:taskId/toggle", requireAuth, toggleTaskStatus);
router.post("/create-with-ai", requireAuth , createGoalWithAI);
export default router;