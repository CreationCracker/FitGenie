import { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Dumbbell,
  Utensils,
  Flame,
  Clock,
  RotateCcw,
  ArrowLeft,
  Loader2,
  Beef,
  MessageSquare,
  Zap,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Meal {
  title: string;
  scheduledTime?: string;
  ingredients: string[];
  calories: number;
  protein: number;
}

interface MealDay {
  date: string;
  dayLabel: string;
  meals: Meal[];
  totalDailyCalories: number;
  totalDailyProtein: number;
}

interface Exercise {
  title: string;
  scheduledTime?: string;
  sets: number;
  repsOrDuration: string;
  restSeconds: number;
  notes?: string;
}

interface ExerciseDay {
  date: string;
  dayLabel: string;
  focus: string;
  exercises: Exercise[];
  isRestDay: boolean;
}

interface PlanData {
  threadId: string;
  userId: string;
  mealPlan: MealDay[];
  exercisePlan: ExerciseDay[];
  groceryList: string[];
  equipmentNeeded: string[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({ icon: Icon, value, label, color }: { icon: any; value: string | number; label: string; color: string }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{value}</span>
      <span className="opacity-70 font-normal">{label}</span>
    </div>
  );
}

function MealDayCard({ day, index }: { day: MealDay; index: number }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Utensils className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm">{day.dayLabel}</p>
            <p className="text-xs text-muted-foreground">{day.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatPill icon={Flame} value={day.totalDailyCalories} label="kcal" color="bg-orange-500/10 text-orange-600" />
          <StatPill icon={Beef} value={`${day.totalDailyProtein}g`} label="protein" color="bg-emerald-500/10 text-emerald-600" />
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground ml-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              {day.meals.map((meal, i) => (
                <div key={i} className="rounded-xl bg-muted/30 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{meal.title}</p>
                      {meal.scheduledTime && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Clock className="w-3 h-3" />
                          {meal.scheduledTime}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <StatPill icon={Flame} value={meal.calories} label="kcal" color="bg-orange-500/10 text-orange-600" />
                      <StatPill icon={Beef} value={`${meal.protein}g`} label="prot" color="bg-emerald-500/10 text-emerald-600" />
                    </div>
                  </div>
                  {meal.ingredients?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {meal.ingredients.map((ing, j) => (
                        <span key={j} className="text-xs rounded-full border border-border px-2 py-0.5 bg-background text-muted-foreground">
                          {ing}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ExerciseDayCard({ day, index }: { day: ExerciseDay; index: number }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${day.isRestDay ? "bg-slate-500/10" : "bg-primary/10"}`}>
            <Dumbbell className={`w-4 h-4 ${day.isRestDay ? "text-slate-500" : "text-primary"}`} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm">{day.dayLabel}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[160px]">{day.focus || (day.isRestDay ? "Rest Day" : "Training")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {day.isRestDay ? (
            <span className="text-xs rounded-full border border-border px-3 py-1 text-muted-foreground">Rest</span>
          ) : (
            <StatPill icon={Zap} value={day.exercises.length} label="exercises" color="bg-primary/10 text-primary" />
          )}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground ml-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && !day.isRestDay && day.exercises.length > 0 && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
              {day.exercises.map((ex, i) => (
                <div key={i} className="rounded-xl bg-muted/30 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">{ex.title}</p>
                    {ex.scheduledTime && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Clock className="w-3 h-3" />
                        {ex.scheduledTime}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5">{ex.sets} sets</span>
                    <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5">{ex.repsOrDuration}</span>
                    <span className="text-xs rounded-full border border-border text-muted-foreground px-2 py-0.5">{ex.restSeconds}s rest</span>
                  </div>
                  {ex.notes && <p className="text-xs text-muted-foreground mt-1.5 italic">{ex.notes}</p>}
                </div>
              ))}
            </div>
          </motion.div>
        )}
        {open && day.isRestDay && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border pt-3">
              <p className="text-sm text-muted-foreground italic">Active recovery — light stretching or walking recommended.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Generating Screen ────────────────────────────────────────────────────────

function GeneratingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 px-4">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Zap className="w-8 h-8 text-primary" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">{message}</h2>
        <p className="text-sm text-muted-foreground">Your personalized plan is being crafted…</p>
      </div>
      <div className="flex gap-1.5 mt-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

const TABS = ["Meals", "Workouts", "Grocery", "Equipment"] as const;
type Tab = (typeof TABS)[number];

// ─── Main Page ────────────────────────────────────────────────────────────────

const PlanFeedback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Expect: { threadId, userId, mealPlan, exercisePlan, groceryList, equipmentNeeded, userParams }
  const locationState = location.state as (PlanData & { userParams: any }) | null;

  const [plan, setPlan] = useState<PlanData | null>(locationState ?? null);
  const [activeTab, setActiveTab] = useState<Tab>("Meals");
  const [phase, setPhase] = useState<"review" | "feedback" | "generating" | "saving">(
    locationState ? "review" : "generating"
  );
  const [generatingMsg, setGeneratingMsg] = useState("Generating your AI plan…");
  const [mealFeedback, setMealFeedback] = useState("");
  const [exerciseFeedback, setExerciseFeedback] = useState("");
  const [error, setError] = useState("");

  // Frontend only ever talks to Express backend — never directly to Python
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // ── Approve & Save ──────────────────────────────────────────────────────────
  const handleApprove = useCallback(async () => {
    if (!plan || !locationState?.userParams) return;
    setPhase("saving");
    setError("");

    try {
      const token = localStorage.getItem("token");

      // Single call to Express — it notifies Python AI service AND saves to MongoDB
      await axios.post(
        `${API_BASE_URL}/goals/confirm`,
        {
          userId: plan.userId,
          threadId: plan.threadId,
          mealPlan: plan.mealPlan,
          exercisePlan: plan.exercisePlan,
          groceryList: plan.groceryList,
          equipmentNeeded: plan.equipmentNeeded,
          ...locationState.userParams,
        },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      console.error("Approve error:", err);
      setError(err.response?.data?.message || "Failed to save plan. Please try again.");
      setPhase("review");
    }
  }, [plan, locationState, navigate, API_BASE_URL]);

  // ── Submit Feedback & Regenerate ────────────────────────────────────────────
  const handleRegenerate = useCallback(async () => {
    if (!plan) return;
    setPhase("generating");
    setGeneratingMsg("Regenerating with your feedback…");
    setError("");

    try {
      const token = localStorage.getItem("token");

      // Call Express backend — it proxies the feedback to Python and returns the new plan
      const res = await axios.post(
        `${API_BASE_URL}/goals/regenerate`,
        {
          userId: plan.userId,
          threadId: plan.threadId,
          mealFeedback: mealFeedback || null,
          exerciseFeedback: exerciseFeedback || null,
        },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      const data = res.data;

      const updated: PlanData = {
        ...plan,
        mealPlan: mapMealPlan(data.meal_plan),
        exercisePlan: mapExercisePlan(data.workout_plan),
        groceryList: data.grocery_list ?? [],
        equipmentNeeded: data.equipment_needed ?? [],
      };

      setPlan(updated);
      setMealFeedback("");
      setExerciseFeedback("");
      setPhase("review");
      setActiveTab("Meals");
    } catch (err: any) {
      console.error("Regenerate error:", err);
      setError(err.response?.data?.error || "Regeneration failed. Please try again.");
      setPhase("feedback");
    }
  }, [plan, mealFeedback, exerciseFeedback, API_BASE_URL]);

  // ── Helpers to map AI service format → our internal format ─────────────────
  function mapMealPlan(raw: any[]): MealDay[] {
    return (raw ?? []).map((day: any) => ({
      date: day.date,
      dayLabel: day.day_label ?? day.dayLabel,
      totalDailyCalories: day.total_daily_calories ?? day.totalDailyCalories ?? 0,
      totalDailyProtein: day.total_daily_protein ?? day.totalDailyProtein ?? 0,
      meals: (day.meals ?? []).map((m: any, idx: number) => ({
        title: m.name ?? m.title,
        scheduledTime: m.scheduled_time ?? m.scheduledTime,
        ingredients: m.ingredients ?? [],
        calories: m.calories ?? 0,
        protein: m.protein ?? 0,
        done: false,
        missed: false,
        order: idx,
      })),
    }));
  }

  function mapExercisePlan(raw: any[]): ExerciseDay[] {
    return (raw ?? []).map((day: any) => ({
      date: day.date,
      dayLabel: day.day_label ?? day.dayLabel,
      focus: day.focus ?? "",
      isRestDay: (day.exercises ?? []).length === 0,
      exercises: (day.exercises ?? []).map((ex: any, idx: number) => ({
        title: ex.name ?? ex.title,
        scheduledTime: ex.scheduled_time ?? ex.scheduledTime,
        sets: ex.sets ?? 1,
        repsOrDuration: ex.reps_or_duration ?? ex.repsOrDuration ?? "",
        restSeconds: ex.rest_seconds ?? ex.restSeconds ?? 60,
        notes: ex.notes ?? "",
        done: false,
        missed: false,
        order: idx,
      })),
    }));
  }

  // ── Loading states ──────────────────────────────────────────────────────────
  if (phase === "generating" || phase === "saving") {
    return (
      <GeneratingScreen
        message={phase === "saving" ? "Saving your plan…" : generatingMsg}
      />
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <p className="text-muted-foreground">No plan data found.</p>
          <Button onClick={() => navigate("/add-goal")}>Create New Goal</Button>
        </div>
      </div>
    );
  }

  const totalCalories = plan.mealPlan.reduce((s, d) => s + d.totalDailyCalories, 0);
  const totalProtein = plan.mealPlan.reduce((s, d) => s + d.totalDailyProtein, 0);
  const totalWorkouts = plan.exercisePlan.filter((d) => !d.isRestDay).length;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-sm">Review Your Plan</h1>
            <p className="text-xs text-muted-foreground">AI-generated · Approve or give feedback</p>
          </div>
        </div>
      </header>

      {/* ── Summary Banner ── */}
      <div className="max-w-2xl mx-auto px-4 pt-5">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-primary/10 via-emerald-500/5 to-orange-500/10 border border-border p-4 flex flex-wrap gap-3 items-center justify-between"
        >
          <div className="space-y-0.5">
            <p className="font-semibold text-sm">Your Personalized Plan</p>
            <p className="text-xs text-muted-foreground">{plan.mealPlan.length} days · Review before saving</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatPill icon={Flame} value={`${Math.round(totalCalories / (plan.mealPlan.length || 1))}`} label="avg kcal/day" color="bg-orange-500/10 text-orange-600" />
            <StatPill icon={Beef} value={`${Math.round(totalProtein / (plan.mealPlan.length || 1))}g`} label="avg protein" color="bg-emerald-500/10 text-emerald-600" />
            <StatPill icon={Dumbbell} value={totalWorkouts} label="workouts" color="bg-primary/10 text-primary" />
          </div>
        </motion.div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="sticky top-14 z-40 bg-background/80 backdrop-blur-xl border-b border-border mt-4">
        <div className="max-w-2xl mx-auto px-4 flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <main className="max-w-2xl mx-auto px-4 py-5 space-y-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === "Meals" && (
              <div className="space-y-3">
                {plan.mealPlan.map((day, i) => (
                  <MealDayCard key={day.date + i} day={day} index={i} />
                ))}
                {plan.mealPlan.length === 0 && (
                  <p className="text-center text-muted-foreground py-10 text-sm">No meal plan generated.</p>
                )}
              </div>
            )}

            {activeTab === "Workouts" && (
              <div className="space-y-3">
                {plan.exercisePlan.map((day, i) => (
                  <ExerciseDayCard key={day.date + i} day={day} index={i} />
                ))}
                {plan.exercisePlan.length === 0 && (
                  <p className="text-center text-muted-foreground py-10 text-sm">No workout plan generated.</p>
                )}
              </div>
            )}

            {activeTab === "Grocery" && (
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold">Grocery List</h2>
                  <span className="ml-auto text-xs text-muted-foreground">{plan.groceryList.length} items</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {plan.groceryList.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.025 }}
                      className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-sm">{item}</span>
                    </motion.div>
                  ))}
                  {plan.groceryList.length === 0 && (
                    <p className="text-muted-foreground text-sm col-span-2">No grocery items listed.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "Equipment" && (
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold">Equipment Needed</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {plan.equipmentNeeded.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-sm">{item}</span>
                    </motion.div>
                  ))}
                  {plan.equipmentNeeded.length === 0 && (
                    <p className="text-muted-foreground text-sm col-span-2">No special equipment required.</p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Feedback Section ── */}
        <AnimatePresence>
          {phase === "feedback" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="rounded-2xl border border-border bg-card p-5 space-y-5 mt-2"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">What should we improve?</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="meal-feedback" className="text-sm flex items-center gap-1.5 mb-1.5">
                    <Utensils className="w-3.5 h-3.5" />
                    Meal plan feedback
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="meal-feedback"
                    value={mealFeedback}
                    onChange={(e) => setMealFeedback(e.target.value)}
                    placeholder="E.g. Less chicken, more vegetarian options, reduce calories by 200…"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="exercise-feedback" className="text-sm flex items-center gap-1.5 mb-1.5">
                    <Dumbbell className="w-3.5 h-3.5" />
                    Workout plan feedback
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="exercise-feedback"
                    value={exerciseFeedback}
                    onChange={(e) => setExerciseFeedback(e.target.value)}
                    placeholder="E.g. Avoid jumping exercises, prefer morning slots, add more core work…"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPhase("review")}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2 gradient-primary text-primary-foreground"
                  onClick={handleRegenerate}
                  disabled={!mealFeedback && !exerciseFeedback}
                >
                  <RotateCcw className="w-4 h-4" />
                  Regenerate
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error Banner ── */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive p-3 text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </motion.div>
        )}
      </main>

      {/* ── Bottom CTA Bar ── */}
      {phase === "review" && (
        <div className="sticky bottom-0 bg-background/90 backdrop-blur-xl border-t border-border">
          <div className="max-w-2xl mx-auto px-4 py-4 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12 gap-2"
              onClick={() => setPhase("feedback")}
            >
              <XCircle className="w-4 h-4 text-destructive" />
              Not satisfied
            </Button>
            <Button
              className="flex-1 h-12 gap-2 gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
              onClick={handleApprove}
            >
              <CheckCircle2 className="w-4 h-4" />
              Looks great — Save!
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanFeedback;
