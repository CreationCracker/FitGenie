import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Check, Clock, Flame, Dumbbell,
  Loader2, Salad, Moon, ChevronRight, RefreshCw,
  ShoppingCart, Wrench, Sparkles, Tag,
  Youtube, PlayCircle, ExternalLink
} from "lucide-react";
import axios from "axios";

// ─── Types (mirrors GoalSchema) ────────────────────────────────────────────────

interface IMealTask {
  _id: string;
  title: string;
  scheduledTime?: string;
  done: boolean;
  missed: boolean;
  order: number;
  ingredients: string[];
  calories: number;
  protein: number;
}

interface IExerciseTask {
  _id: string;
  title: string;
  scheduledTime?: string;
  done: boolean;
  missed: boolean;
  order: number;
  sets: number;
  repsOrDuration: string;
  restSeconds: number;
  notes?: string;
  // ── Tutorial fields (optional — fallback to dummy until AI-generated) ──
  tutorialVideoId?: string;
  tutorialUrl?: string;
  tutorialThumbnail?: string;
  tutorialTitle?: string;
  tutorialChannelName?: string;
}

interface IMealDay {
  _id: string;
  date: string;
  dayLabel: string;
  meals: IMealTask[];
  totalDailyCalories: number;
  totalDailyProtein: number;
}

interface IExerciseDay {
  _id: string;
  date: string;
  dayLabel: string;
  focus: string;
  exercises: IExerciseTask[];
  isRestDay: boolean;
}

interface IGoal {
  _id: string;
  title: string;
  fitnessGoals: string[];
  physiqueTarget: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  progress: number;
  status: "active" | "completed" | "abandoned";
  groceryList: string[];
  equipmentNeeded: string[];
  mealPlan: IMealDay[];
  exercisePlan: IExerciseDay[];
}

type TabType = "meals" | "exercise" | "grocery" | "equipment";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const fmt = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en", { month: "short", day: "numeric" });

const dayAbbr = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en", { weekday: "short" });

const dayNum = (d: string) => new Date(d + "T00:00:00").getDate();

// ─── Sub-components ────────────────────────────────────────────────────────────

const ProgressRing = ({ value }: { value: number }) => {
  const r = 52;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative w-36 h-36">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="7" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke="hsl(var(--primary))" strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - value / 100)}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="text-3xl font-bold tracking-tight leading-none">{value}%</span>
        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest">today</span>
      </div>
    </div>
  );
};

const StatPill = ({
  icon: Icon,
  value,
  unit,
  label,
  color,
}: {
  icon: React.ElementType;
  value: number;
  unit: string;
  label: string;
  color: string;
}) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border">
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
      <Icon className="w-3.5 h-3.5" />
    </div>
    <div>
      <p className="text-[11px] text-muted-foreground leading-none mb-0.5">{label}</p>
      <p className="text-sm font-semibold leading-none">
        {value}
        <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>
      </p>
    </div>
  </div>
);

// ─── Meal Card ─────────────────────────────────────────────────────────────────

const MealCard = ({
  task,
  goalId,
  dayId,
  onToggle,
}: {
  task: IMealTask;
  goalId: string;
  dayId: string;
  onToggle: (dayId: string, taskId: string, newDone: boolean) => void;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      className={`rounded-2xl border overflow-hidden transition-colors ${
        task.done ? "bg-primary/5 border-primary/20" : "bg-card border-border"
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={() => onToggle(dayId, task._id, !task.done)}
          className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
            task.done ? "border-primary bg-primary" : "border-muted-foreground/40"
          }`}
        >
          {task.done && <Check className="w-3.5 h-3.5 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium truncate ${
              task.done ? "line-through text-muted-foreground" : "text-foreground"
            }`}
          >
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-amber-500 font-medium flex items-center gap-0.5">
              <Flame className="w-3 h-3" /> {task.calories} kcal
            </span>
            <span className="text-xs text-blue-500 font-medium">
              {task.protein}g protein
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {task.scheduledTime && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {task.scheduledTime}
            </div>
          )}
          {task.ingredients.length > 0 && (
            <button
              onClick={() => setExpanded((p) => !p)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`}
              />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && task.ingredients.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-border/50">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 mt-3">
                Ingredients
              </p>
              <div className="flex flex-wrap gap-1.5">
                {task.ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Dummy tutorial fallback (until AI-generated values are stored in DB) ──────

const DUMMY_TUTORIAL = {
  tutorialVideoId: "XxWcirHIwVo",
  tutorialUrl: "https://www.youtube.com/watch?v=XxWcirHIwVo",
  tutorialThumbnail: "https://i.ytimg.com/vi/XxWcirHIwVo/hq720.jpg?sqp=-oaymwEcCOgCEMoBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLB1_5n9PstkMNTEyWbUHxy8XAK2UA",
  tutorialTitle: "How to PROPERLY Deadlift for Growth (5 Easy Steps)",
  tutorialChannelName: "Jeremy Ethier",
};

// ─── Exercise Card ─────────────────────────────────────────────────────────────

const ExerciseCard = ({
  task,
  goalId,
  dayId,
  onToggle,
}: {
  task: IExerciseTask;
  goalId: string;
  dayId: string;
  onToggle: (dayId: string, taskId: string, newDone: boolean) => void;
}) => {
  const [showTutorial, setShowTutorial] = useState(false);

  const tutorial = {
    tutorialUrl:         task.tutorialUrl         ?? DUMMY_TUTORIAL.tutorialUrl,
    tutorialThumbnail:   task.tutorialThumbnail   ?? DUMMY_TUTORIAL.tutorialThumbnail,
    tutorialTitle:       task.tutorialTitle       ?? DUMMY_TUTORIAL.tutorialTitle,
    tutorialChannelName: task.tutorialChannelName ?? DUMMY_TUTORIAL.tutorialChannelName,
  };

  return (
    <motion.div
      layout
      className={`rounded-2xl border overflow-hidden transition-colors ${
        task.done ? "bg-primary/5 border-primary/20" : "bg-card border-border"
      }`}
    >
      {/* ── Main row ── */}
      <div className="flex items-start gap-3 p-4">
        <button
          onClick={() => onToggle(dayId, task._id, !task.done)}
          className={`w-6 h-6 mt-0.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
            task.done ? "border-primary bg-primary" : "border-muted-foreground/40"
          }`}
        >
          {task.done && <Check className="w-3.5 h-3.5 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium ${
              task.done ? "line-through text-muted-foreground" : "text-foreground"
            }`}
          >
            {task.title}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            <span className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{task.sets}</span> sets ×{" "}
              <span className="font-medium text-foreground">{task.repsOrDuration}</span>
            </span>
            <span className="text-xs text-muted-foreground">
              Rest{" "}
              <span className="font-medium text-foreground">{task.restSeconds}s</span>
            </span>
            {task.scheduledTime && (
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <Clock className="w-3 h-3" /> {task.scheduledTime}
              </span>
            )}
          </div>
          {task.notes && (
            <p className="text-xs text-muted-foreground/70 italic mt-1.5 leading-relaxed">
              {task.notes}
            </p>
          )}
        </div>

        {/* Watch tutorial button */}
        <button
          onClick={() => setShowTutorial((p) => !p)}
          className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${
            showTutorial
              ? "bg-red-500/10 text-red-600"
              : "bg-secondary text-muted-foreground hover:bg-red-500/10 hover:text-red-600"
          }`}
        >
          <Youtube className="w-3.5 h-3.5" />
          {showTutorial ? "Hide" : "How?"}
        </button>
      </div>

      {/* ── Tutorial card ── */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border/50">
              <motion.a
                href={tutorial.tutorialUrl}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 flex gap-3 p-3 rounded-xl bg-secondary/60 border border-border hover:border-red-500/30 hover:bg-red-500/5 transition-all group"
              >
                {/* Thumbnail */}
                <div className="relative flex-shrink-0 w-24 h-[54px] rounded-lg overflow-hidden bg-secondary">
                  <img
                    src={tutorial.tutorialThumbnail}
                    alt={tutorial.tutorialTitle}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center shadow-md">
                      <PlayCircle className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                  <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">
                    {tutorial.tutorialTitle}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Youtube className="w-3 h-3 text-red-500 flex-shrink-0" />
                    <p className="text-[11px] text-muted-foreground truncate">
                      {tutorial.tutorialChannelName}
                    </p>
                  </div>
                </div>

                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0 self-center group-hover:text-red-500 transition-colors" />
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Empty state ───────────────────────────────────────────────────────────────

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-2 bg-secondary/30 rounded-2xl border border-dashed border-border">
    <RefreshCw className="w-6 h-6 text-muted-foreground/40" />
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const GoalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [goal, setGoal] = useState<IGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("meals");
  const [selectedGroceries, setSelectedGroceries] = useState<Set<string>>(new Set());

  // ── Fetch goal ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchGoal = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:8000/goals/${id}`, {
          headers: getAuthHeader(),
          withCredentials: true,
        });
        setGoal(res.data);
      } catch (err: any) {
        console.error(err);
        if (err.response?.status === 401) navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchGoal();
  }, [id, navigate]);

  // ── Derive unique sorted dates from both plans ───────────────────────────────
  const dayTabs = useMemo(() => {
    if (!goal) return [];
    const dateSet = new Set<string>();
    goal.mealPlan.forEach((d) => dateSet.add(d.date));
    goal.exercisePlan.forEach((d) => dateSet.add(d.date));
    return [...dateSet].sort();
  }, [goal]);

  useEffect(() => {
    if (dayTabs.length > 0 && !selectedDate) {
      const today = new Date().toISOString().split("T")[0];
      setSelectedDate(dayTabs.includes(today) ? today : dayTabs[0]);
    }
  }, [dayTabs, selectedDate]);

  // ── Current day slices ───────────────────────────────────────────────────────
  const currentMealDay = useMemo(
    () => goal?.mealPlan.find((d) => d.date === selectedDate) ?? null,
    [goal, selectedDate]
  );

  const currentExerciseDay = useMemo(
    () => goal?.exercisePlan.find((d) => d.date === selectedDate) ?? null,
    [goal, selectedDate]
  );

  // ── Progress for the selected date ──────────────────────────────────────────
  const progress = useMemo(() => {
    const meals = currentMealDay?.meals ?? [];
    const exercises = currentExerciseDay?.exercises ?? [];
    const all = [...meals, ...exercises];
    if (!all.length) return 0;
    const done = all.filter((t) => t.done).length;
    return Math.round((done / all.length) * 100);
  }, [currentMealDay, currentExerciseDay]);

  // ── Toggle handlers ──────────────────────────────────────────────────────────
  const toggleMeal = async (dayId: string, taskId: string, newDone: boolean) => {
    if (!goal) return;
    setGoal({
      ...goal,
      mealPlan: goal.mealPlan.map((day) =>
        day._id === dayId
          ? { ...day, meals: day.meals.map((m) => (m._id === taskId ? { ...m, done: newDone } : m)) }
          : day
      ),
    });
    try {
      await axios.patch(
        `http://localhost:8000/goals/${goal._id}/meal-tasks/${taskId}/toggle`,
        { done: newDone },
        { headers: getAuthHeader(), withCredentials: true }
      );
    } catch (e) {
      console.error("Sync failed", e);
    }
  };

  const toggleExercise = async (dayId: string, taskId: string, newDone: boolean) => {
    if (!goal) return;
    setGoal({
      ...goal,
      exercisePlan: goal.exercisePlan.map((day) =>
        day._id === dayId
          ? {
              ...day,
              exercises: day.exercises.map((ex) =>
                ex._id === taskId ? { ...ex, done: newDone } : ex
              ),
            }
          : day
      ),
    });
    try {
      await axios.patch(
        `http://localhost:8000/goals/${goal._id}/exercise-tasks/${taskId}/toggle`,
        { done: newDone },
        { headers: getAuthHeader(), withCredentials: true }
      );
    } catch (e) {
      console.error("Sync failed", e);
    }
  };

  // ── Grocery cart ─────────────────────────────────────────────────────────────
  const toggleGrocery = (item: string) => {
    setSelectedGroceries((prev) => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });
  };

  const selectAllGroceries = () => {
    if (selectedGroceries.size === goal?.groceryList.length) {
      setSelectedGroceries(new Set());
    } else {
      setSelectedGroceries(new Set(goal?.groceryList ?? []));
    }
  };

  const handleFindDeals = () => {
    const items = [...selectedGroceries];
    navigate(`/deals?items=${encodeURIComponent(JSON.stringify(items))}`);
  };

  // ── Loading / empty ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Syncing your plan…</p>
      </div>
    );
  }
  if (!goal) return null;

  const goalTypeColors: Record<string, string> = {
    gym: "bg-blue-500/10 text-blue-600",
    yoga: "bg-purple-500/10 text-purple-600",
    diet: "bg-emerald-500/10 text-emerald-600",
    cardio: "bg-orange-500/10 text-orange-600",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="font-bold text-sm text-foreground leading-tight">{goal.title}</h1>
            <p className="text-[11px] text-muted-foreground">{goal.physiqueTarget}</p>
          </div>
          <div className="w-5 h-5" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
        {/* ── Hero Stats ── */}
        <div className="flex items-center gap-6">
          <ProgressRing value={progress} />
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {goal.fitnessGoals.map((g) => (
                <span
                  key={g}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                    goalTypeColors[g] ?? "bg-secondary text-muted-foreground"
                  }`}
                >
                  {g}
                </span>
              ))}
            </div>
            {currentMealDay && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <StatPill
                  icon={Flame}
                  value={currentMealDay.totalDailyCalories}
                  unit="kcal"
                  label="Calories"
                  color="bg-amber-500/10 text-amber-500"
                />
                <StatPill
                  icon={Salad}
                  value={currentMealDay.totalDailyProtein}
                  unit="g"
                  label="Protein"
                  color="bg-blue-500/10 text-blue-500"
                />
              </div>
            )}
            {currentExerciseDay && !currentExerciseDay.isRestDay && (
              <StatPill
                icon={Dumbbell}
                value={currentExerciseDay.exercises.length}
                unit="exercises"
                label={currentExerciseDay.focus || "Today's focus"}
                color="bg-violet-500/10 text-violet-500"
              />
            )}
          </div>
        </div>

        {/* ── Day Selector ── */}
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 min-w-max pb-1">
            {dayTabs.map((d) => {
              const isSelected = d === selectedDate;
              const today = new Date().toISOString().split("T")[0];
              const isToday = d === today;
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`flex flex-col items-center px-3 py-2 rounded-2xl transition-all min-w-[52px] ${
                    isSelected
                      ? "bg-primary text-white shadow-md shadow-primary/25"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  <span className="text-[10px] font-medium uppercase tracking-wider">
                    {isToday && !isSelected ? "today" : dayAbbr(d)}
                  </span>
                  <span className="text-lg font-bold leading-tight">{dayNum(d)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Date heading ── */}
        {selectedDate && (
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">{fmt(selectedDate)}</h2>
            {currentExerciseDay?.isRestDay && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                <Moon className="w-3.5 h-3.5" /> Rest Day
              </span>
            )}
            {currentExerciseDay && !currentExerciseDay.isRestDay && currentExerciseDay.focus && (
              <span className="text-xs text-muted-foreground truncate max-w-[55%] text-right">
                {currentExerciseDay.focus}
              </span>
            )}
          </div>
        )}

        {/* ── Tab Switch ── */}
        <div className="flex rounded-2xl bg-secondary p-1 gap-1">
          {([
            { key: "meals", label: "Meals", icon: Salad },
            { key: "exercise", label: "Exercise", icon: Dumbbell },
            { key: "grocery", label: "Grocery", icon: ShoppingCart },
            { key: "equipment", label: "Gear", icon: Wrench },
          ] as { key: TabType; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === "meals" && (
            <motion.div
              key="meals"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {currentMealDay && currentMealDay.meals.length > 0 ? (
                currentMealDay.meals
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((meal) => (
                    <MealCard
                      key={meal._id}
                      task={meal}
                      goalId={goal._id}
                      dayId={currentMealDay._id}
                      onToggle={toggleMeal}
                    />
                  ))
              ) : (
                <EmptyState message="No meals planned for this day." />
              )}
            </motion.div>
          )}

          {activeTab === "exercise" && (
            <motion.div
              key="exercise"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {currentExerciseDay?.isRestDay ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 bg-secondary/40 rounded-2xl border border-dashed border-border">
                  <Moon className="w-8 h-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Rest & recover today</p>
                </div>
              ) : currentExerciseDay && currentExerciseDay.exercises.length > 0 ? (
                currentExerciseDay.exercises
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((ex) => (
                    <ExerciseCard
                      key={ex._id}
                      task={ex}
                      goalId={goal._id}
                      dayId={currentExerciseDay._id}
                      onToggle={toggleExercise}
                    />
                  ))
              ) : (
                <EmptyState message="No exercises scheduled for this day." />
              )}
            </motion.div>
          )}

          {activeTab === "grocery" && (
            <motion.div
              key="grocery"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              {goal.groceryList.length > 0 ? (
                <>
                  {/* ── Header row ── */}
                  <div className="flex items-center justify-between px-1">
                    <p className="text-xs text-muted-foreground">
                      {goal.groceryList.length} items
                      {selectedGroceries.size > 0 && (
                        <span className="ml-1.5 text-primary font-medium">
                          · {selectedGroceries.size} selected
                        </span>
                      )}
                    </p>
                    <button
                      onClick={selectAllGroceries}
                      className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      {selectedGroceries.size === goal.groceryList.length ? "Deselect all" : "Select all"}
                    </button>
                  </div>

                  {/* ── Item list ── */}
                  {goal.groceryList.map((item, i) => {
                    const isSelected = selectedGroceries.has(item);
                    return (
                      <motion.div
                        key={i}
                        layout
                        onClick={() => toggleGrocery(item)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-pointer transition-all select-none ${
                          isSelected
                            ? "bg-emerald-500/8 border-emerald-500/30"
                            : "bg-card border-border hover:border-border/80"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-muted-foreground/30"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? "bg-emerald-500/15" : "bg-secondary"
                        }`}>
                          <ShoppingCart className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-600" : "text-muted-foreground"}`} />
                        </div>
                        <p className={`text-sm flex-1 transition-colors ${
                          isSelected ? "text-foreground font-medium" : "text-foreground"
                        }`}>
                          {item}
                        </p>
                        {isSelected && (
                          <Tag className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        )}
                      </motion.div>
                    );
                  })}

                  {/* ── Find Best Deals CTA ── */}
                  <AnimatePresence>
                    {selectedGroceries.size > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        className="sticky bottom-4 pt-2"
                      >
                        <button
                          onClick={handleFindDeals}
                          className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl bg-primary text-white font-semibold text-sm shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-[0.98] transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            <span>Find Best Deals</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              {selectedGroceries.size} item{selectedGroceries.size > 1 ? "s" : ""}
                            </span>
                            <ChevronRight className="w-4 h-4 opacity-70" />
                          </div>
                        </button>
                        <p className="text-center text-[11px] text-muted-foreground mt-2">
                          We'll search for the best prices near you
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <EmptyState message="No grocery items for this plan." />
              )}
            </motion.div>
          )}

          {activeTab === "equipment" && (
            <motion.div
              key="equipment"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-2"
            >
              {goal.equipmentNeeded.length > 0 ? (
                goal.equipmentNeeded.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border"
                  >
                    <div className="w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                    <p className="text-sm text-foreground">{item}</p>
                  </div>
                ))
              ) : (
                <EmptyState message="No equipment listed for this plan." />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default GoalDetail;
