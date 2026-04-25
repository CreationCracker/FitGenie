// routes/goalRoutes.ts  (or wherever you register goal routes)
// Add / update these two new routes alongside your existing ones.

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";   // adjust path as needed
import {
  generateGoalPreview,   // Step 1 — generate plan, no DB write
  confirmAndSaveGoal,    // Step 2 — user approved → notify Python + save to MongoDB
  regenerateGoalPlan,    // Step 2b — user gave feedback → proxy to Python → return new plan
  // getUserGoals,
  getGoal,
  toggleTaskStatus,
} from "../controller/goalController.js";

const router = Router();

// ── New two-step flow ─────────────────────────────────────────────────────────

/** Step 1 — Generate & preview (no DB write). Called by AddGoal.tsx */
router.post("/generate-preview", requireAuth, generateGoalPreview);

/** Step 2a — User approved → Express notifies Python + saves to MongoDB */
router.post("/confirm", requireAuth, confirmAndSaveGoal);

/** Step 2b — User gave feedback → Express proxies to Python → returns new plan (no DB write) */
router.post("/regenerate", requireAuth, regenerateGoalPlan);



// ── Existing routes ───────────────────────────────────────────────────────────
// router.get("/", requireAuth, getUserGoals);
router.get("/:goalId", requireAuth, getGoal);
router.patch("/:goalId/tasks/:taskId/toggle", requireAuth, toggleTaskStatus);

export default router;