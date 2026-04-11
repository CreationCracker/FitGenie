import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Dumbbell, Leaf, Flame, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

  const handleSubmit = () => {
    // TODO: send to backend
    navigate("/dashboard");
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-foreground">What type of goal?</h2>
            <p className="text-muted-foreground">Choose the category that fits your goal</p>
            <div className="grid grid-cols-2 gap-3 mt-6">
              {goalTypes.map((t) => {
                const Icon = t.icon;
                const selected = form.type === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setForm((f) => ({ ...f, type: t.id }))}
                    className={`p-5 rounded-2xl border-2 transition-all text-left ${
                      selected ? "border-primary glow-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center mb-3`}>
                      <Icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="font-display font-semibold text-foreground">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-foreground">Name your goal</h2>
            <p className="text-muted-foreground">Give it a motivating title</p>
            <Input
              placeholder="e.g. Get shredded in 30 days"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="bg-secondary border-border text-foreground h-12 mt-4"
            />
            <div className="space-y-2 mt-4">
              <Label className="text-foreground">Duration (days)</Label>
              <Input
                type="number"
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                className="bg-secondary border-border text-foreground h-12"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-foreground">What's your target?</h2>
            <p className="text-muted-foreground">Select what you want to achieve</p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {physiques.map((p) => (
                <button
                  key={p}
                  onClick={() => setForm((f) => ({ ...f, physique: p }))}
                  className={`p-4 rounded-xl border-2 transition-all text-sm font-medium ${
                    form.physique === p ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-foreground">Any medical conditions?</h2>
            <p className="text-muted-foreground">Select all that apply so we can customize your plan</p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {medicalConditions.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleMedical(c)}
                  className={`p-4 rounded-xl border-2 transition-all text-sm font-medium ${
                    form.medicalConditions.includes(c) ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-foreground">Anything else?</h2>
            <p className="text-muted-foreground">Diet preferences, allergies, schedule constraints…</p>
            <div className="space-y-3 mt-4">
              <Input
                placeholder="e.g. Vegetarian, No dairy"
                value={form.dietPreference}
                onChange={(e) => setForm((f) => ({ ...f, dietPreference: e.target.value }))}
                className="bg-secondary border-border text-foreground h-12"
              />
              <Textarea
                placeholder="Any additional notes for your trainer AI…"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="bg-secondary border-border text-foreground min-h-[120px]"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center">
          <button onClick={() => (step > 0 ? setStep(step - 1) : navigate("/dashboard"))} className="text-muted-foreground hover:text-foreground">
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
              disabled={!canNext()}
              className="w-full h-12 gradient-primary text-primary-foreground font-semibold gap-2 hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="w-full h-12 gradient-primary text-primary-foreground font-semibold gap-2 hover:opacity-90 transition-opacity"
            >
              Create Goal <Check className="w-4 h-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default AddGoal;
