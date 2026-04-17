import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Dumbbell, Leaf, Flame, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";

const goalTypes = [
  { id: "gym", label: "Gym / Strength", icon: Dumbbell, color: "from-primary to-emerald-400" },
  { id: "yoga", label: "Yoga / Flexibility", icon: Leaf, color: "from-violet-500 to-purple-400" },
  { id: "diet", label: "Diet Only", icon: Flame, color: "from-orange-500 to-yellow-400" },
  { id: "cardio", label: "Cardio / Running", icon: Heart, color: "from-rose-500 to-pink-400" },
];

const medicalConditions = [
  "None", "Diabetes", "Hypertension", "Asthma", "Back Pain", "Knee Injury", "Heart Condition", "Other"
];

const physiques = [
  "Lose Weight", "Build Muscle", "Get Toned", "Increase Flexibility", "Improve Endurance", "General Fitness"
];

const AddGoal = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  
  // --- ADDED STATES ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  // --------------------

  const [form, setForm] = useState({
    type: "",
    title: "",
    physique: "",
    medicalConditions: [] as string[],
    dietPreference: "",
    duration: "30",
    notes: "",
  });

  const totalSteps = 5;

  const toggleMedical = (condition: string) => {
    setForm((f) => ({
      ...f,
      medicalConditions: f.medicalConditions.includes(condition)
        ? f.medicalConditions.filter((c) => c !== condition)
        : [...f.medicalConditions, condition],
    }));
  };

  const canNext = () => {
    if (step === 0) return !!form.type;
    if (step === 1) return !!form.title;
    if (step === 2) return !!form.physique;
    if (step === 3) return form.medicalConditions.length > 0;
    return true;
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold">Choose a workout goal</h1>
              <p className="text-sm text-muted-foreground">Select the kind of fitness plan you want to follow.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {goalTypes.map((goal) => {
                const isActive = form.type === goal.id;
                const Icon = goal.icon;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: goal.id }))}
                    className={`rounded-3xl border p-5 text-left transition-shadow ${isActive ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-background hover:border-foreground"}`}
                  >
                    <div className={`inline-flex items-center justify-center rounded-full p-3 text-white bg-gradient-to-br ${goal.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="mt-4">
                      <h2 className="font-medium">{goal.label}</h2>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold">Name your goal</h1>
              <p className="text-sm text-muted-foreground">Give your plan a title and set the expected duration.</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="goal-title">Goal title</Label>
                <Input
                  id="goal-title"
                  value={form.title}
                  onChange={(event) => setForm((f) => ({ ...f, title: event.target.value }))}
                  placeholder="E.g. Build strength in 12 weeks"
                />
              </div>
              <div>
                <Label htmlFor="goal-duration">Duration (days)</Label>
                <Input
                  id="goal-duration"
                  type="number"
                  min={7}
                  max={365}
                  value={form.duration}
                  onChange={(event) => setForm((f) => ({ ...f, duration: event.target.value }))}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold">Select physique target</h1>
              <p className="text-sm text-muted-foreground">Choose the primary result you want from this plan.</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {physiques.map((option) => {
                const isActive = form.physique === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, physique: option }))}
                    className={`rounded-3xl border p-4 text-left transition ${isActive ? "border-primary bg-primary/10" : "border-border bg-background hover:border-foreground"}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold">Medical conditions</h1>
              <p className="text-sm text-muted-foreground">Tell us about any conditions that should shape your program.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {medicalConditions.map((condition) => {
                const selected = form.medicalConditions.includes(condition);
                return (
                  <button
                    key={condition}
                    type="button"
                    onClick={() => toggleMedical(condition)}
                    className={`rounded-full border px-4 py-3 text-sm font-medium transition ${selected ? "border-primary bg-primary/10" : "border-border bg-background hover:border-foreground"}`}
                  >
                    {condition}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold">Diet preferences & notes</h1>
              <p className="text-sm text-muted-foreground">Provide any dietary preferences and extra details for your plan.</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="diet-preference">Diet preference</Label>
                <Input
                  id="diet-preference"
                  value={form.dietPreference}
                  onChange={(event) => setForm((f) => ({ ...f, dietPreference: event.target.value }))}
                  placeholder="E.g. Vegetarian, Low carb, No preference"
                />
              </div>
              <div>
                <Label htmlFor="goal-notes">Additional notes</Label>
                <Textarea
                  id="goal-notes"
                  value={form.notes}
                  onChange={(event) => setForm((f) => ({ ...f, notes: event.target.value }))}
                  placeholder="Any injuries, schedule constraints, or focus areas"
                  rows={5}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    if (!form.type || !form.title || !form.physique || form.medicalConditions.length === 0) {
      setError("Please complete all required steps.");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required. Please log in again.");
        setTimeout(() => navigate("/login"), 1500);
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      // Step 1: Get user profile
      const profileRes = await axios.get(`${API_BASE_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const user = profileRes.data.user;
      if (!user || !user._id) {
        setError("Failed to load user profile. Please try again.");
        return;
      }

      // Step 2: Prepare goal payload
      const payload = {
        userId: user._id,
        title: form.title,
        type: form.type,
        physiqueTarget: form.physique,
        durationDays: parseInt(form.duration) || 30,
        medicalConditions: form.medicalConditions,
        dietPreference: form.dietPreference || "No preference",
        notes: form.notes || ""
      };
      console.log("Submitting Goal Payload:", payload);
      // Step 3: Create goal with AI
      const response = await axios.post(
        `${API_BASE_URL}/goals/create-with-ai`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.status === 201 || response.status === 200) {
        console.log("Goal created successfully!", response.data);
        // Redirect to dashboard with success
        setTimeout(() => navigate("/dashboard"), 500);
      } else {
        setError(response.data?.message || "Failed to create goal.");
      }

    } catch (err: any) {
      console.error("Submission Error:", err);
      
      // Handle different error scenarios
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        setTimeout(() => navigate("/login"), 1500);
      } else if (err.response?.status === 404) {
        setError("User profile not found. Please update your profile first.");
      } else if (err.response?.status === 500) {
        setError("AI service is currently unavailable. Please try again later.");
      } else {
        setError(err.response?.data?.message || err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // ... (renderStep remains the same)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center">
          <button 
            disabled={isGenerating}
            onClick={() => (step > 0 ? setStep(step - 1) : navigate("/dashboard"))} 
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex justify-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i <= step ? "w-8 bg-primary" : "w-4 bg-secondary"}`} />
            ))}
          </div>
          <div className="w-5" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8">
          {step < totalSteps - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canNext() || isGenerating}
              className="w-full h-12 gradient-primary text-primary-foreground font-semibold gap-2 hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isGenerating}
              className="w-full h-12 gradient-primary text-primary-foreground font-semibold gap-2 hover:opacity-90 transition-opacity"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating AI Plan
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Create Goal
                </>
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default AddGoal;