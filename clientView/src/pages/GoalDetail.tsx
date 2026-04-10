import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Clock, AlertTriangle, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Task {
  id: string;
  title: string;
  time: string;
  done: boolean;
  missed?: boolean;
}

const generateWeekTasks = (): Record<string, Task[]> => {
  const days: Record<string, Task[]> = {};
  const today = new Date();
  for (let i = -7; i <= 6; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    days[key] = [
      { id: `${key}-1`, title: "Morning Protein Shake", time: "7:00 AM", done: i < 0, missed: i < 0 && Math.random() > 0.7 },
      { id: `${key}-2`, title: i % 2 === 0 ? "Chest & Triceps" : "Back & Biceps", time: "8:30 AM", done: i < 0 },
      { id: `${key}-3`, title: "Post-Workout Meal", time: "10:00 AM", done: i < -1 },
      { id: `${key}-4`, title: "Evening Cardio (20 min)", time: "6:00 PM", done: i < -2 },
      { id: `${key}-5`, title: "Casein Protein Before Bed", time: "9:30 PM", done: i < -3 },
    ];
  }
  return days;
};

const GoalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [weekTasks] = useState(generateWeekTasks);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [chatMessages, setChatMessages] = useState<{ role: string; text: string }[]>([
    { role: "assistant", text: "Hey! I'm your goal assistant. Want to swap any meals or exercises? Just ask!" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [tasks, setTasks] = useState(weekTasks);
  const [showChat, setShowChat] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const currentTasks = tasks[selectedDate] || [];

  // Generate day tabs: last 7 + next 7
  const dayTabs: string[] = [];
  const now = new Date();
  for (let i = -7; i <= 6; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    dayTabs.push(d.toISOString().split("T")[0]);
  }

  const toggleTask = (taskId: string) => {
    setTasks((prev) => ({
      ...prev,
      [selectedDate]: prev[selectedDate].map((t) =>
        t.id === taskId ? { ...t, done: !t.done } : t
      ),
    }));
  };

  const totalTasks = currentTasks.length;
  const doneTasks = currentTasks.filter((t) => t.done).length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const missedTasks = currentTasks.filter((t) => t.missed && !t.done);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages((m) => [...m, { role: "user", text: chatInput }]);
    setChatMessages((m) => [
      ...m,
      { role: "assistant", text: "Got it! I'll update your plan. This change will be reflected from tomorrow." },
    ]);
    setChatInput("");
  };

  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return { day: d.toLocaleDateString("en", { weekday: "short" }), date: d.getDate() };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-foreground">Muscle Building</h1>
          <button onClick={() => setShowChat(!showChat)} className="text-muted-foreground hover:text-primary">
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Progress Circle */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-display font-bold text-foreground">{progress}%</span>
              <span className="text-xs text-muted-foreground">today</span>
            </div>
          </div>
        </motion.div>

        {/* Day Selector */}
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 min-w-max">
            {dayTabs.map((d) => {
              const { day, date } = formatDay(d);
              const isSelected = d === selectedDate;
              const isToday = d === today;
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`flex flex-col items-center px-3 py-2 rounded-xl transition-all min-w-[52px] ${
                    isSelected
                      ? "gradient-primary text-primary-foreground"
                      : isToday
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="text-xs font-medium">{day}</span>
                  <span className="text-lg font-display font-bold">{date}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Missed Tasks Warning */}
        {missedTasks.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">Missed Tasks</span>
            </div>
            {missedTasks.map((t) => (
              <p key={t.id} className="text-sm text-muted-foreground ml-6">• {t.title}</p>
            ))}
          </div>
        )}

        {/* Task List */}
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-foreground">Tasks</h3>
          {currentTasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                task.done ? "bg-primary/5 border-primary/20" : "bg-card border-border"
              }`}
            >
              <button
                onClick={() => toggleTask(task.id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  task.done ? "border-primary bg-primary" : "border-muted-foreground"
                }`}
              >
                {task.done && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
              </button>
              <div className="flex-1">
                <p className={`text-sm font-medium ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {task.title}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {task.time}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Chat Section */}
        {showChat && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-card border border-border rounded-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-border">
              <h3 className="font-display font-semibold text-foreground">Customize Your Plan</h3>
            </div>
            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                      m.role === "user"
                        ? "gradient-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                placeholder="e.g. Replace eggs with tofu"
                className="bg-secondary border-border text-foreground h-10"
              />
              <Button onClick={handleSendChat} size="icon" className="gradient-primary text-primary-foreground h-10 w-10">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default GoalDetail;
