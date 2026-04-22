import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Check, Clock, AlertTriangle, 
  MessageSquare, Send, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";

interface ITask {
  _id: string;
  date: string;
  title: string;
  scheduledTime: string;
  done: boolean;
  missed: boolean;
}

interface IGoal {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  tasks: ITask[];
}

const GoalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [goal, setGoal] = useState<IGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", text: "Hey! I'm your goal assistant. Want to swap any meals or exercises? Just ask!" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // 1. Fetch Goal
  useEffect(() => {
    const fetchGoal = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:8000/goals/${id}`, {
          headers: getAuthHeader(),
          withCredentials: true
        });
        setGoal(response.data);
      } catch (error: any) {
        console.error("Error fetching goal:", error);
        if (error.response?.status === 401) navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchGoal();
  }, [id, navigate]);

  // 2. FIXED: Day Tabs Generation (Midnight normalization)
  const dayTabs = useMemo(() => {
    if (!goal) return [];
    const tabs: string[] = [];
    
    // Normalize start/end to midnight for clean comparison
    const start = new Date(goal.startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(goal.endDate);
    end.setHours(0, 0, 0, 0);
    
    let current = new Date(start);

    // This ensures we get exactly the range intended
    while (current < end) {
      tabs.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
    return tabs;
  }, [goal]);

  // 3. Auto-select logical starting date
  useEffect(() => {
    if (dayTabs.length > 0 && !selectedDate) {
      const today = new Date().toISOString().split("T")[0];
      // If today is in the goal range, select today. Otherwise, start at the beginning.
      setSelectedDate(dayTabs.includes(today) ? today : dayTabs[0]);
    }
  }, [dayTabs, selectedDate]);

  const currentTasks = useMemo(() => {
    return goal?.tasks?.filter((t) => t.date === selectedDate) || [];
  }, [goal, selectedDate]);

  const progress = useMemo(() => {
    if (!currentTasks.length) return 0;
    const done = currentTasks.filter((t) => t.done).length;
    return Math.round((done / currentTasks.length) * 100);
  }, [currentTasks]);

  const missedTasks = currentTasks.filter((t) => t.missed && !t.done);

  // 4. Update Task Status
  const toggleTask = async (taskId: string) => {
    if (!goal) return;
    
    const taskToUpdate = goal.tasks.find(t => t._id === taskId);
    if (!taskToUpdate) return;
    const newStatus = !taskToUpdate.done;

    try {
      // Optimistic UI
      setGoal({
        ...goal,
        tasks: goal.tasks.map((t) => 
          t._id === taskId ? { ...t, done: newStatus } : t
        ),
      });

      await axios.patch(`http://localhost:8000/goals/${goal._id}/tasks/${taskId}/toggle`, 
        { done: newStatus },
        { headers: getAuthHeader(), withCredentials: true }
      );
    } catch (error: any) {
      console.error("Failed to sync task update:", error);
      // Re-fetch on error to sync state
      const res = await axios.get(`http://localhost:8000/goals/${id}`, { headers: getAuthHeader() });
      setGoal(res.data);
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { role: "user", text: chatInput }]);
    setTimeout(() => {
        setChatMessages(prev => [...prev, { role: "assistant", text: "Got it! I'll adjust your plan accordingly." }]);
    }, 1000);
    setChatInput("");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Syncing your fitness schedule...</p>
      </div>
    );
  }

  if (!goal) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-foreground">{goal.title}</h1>
          <button onClick={() => setShowChat(!showChat)} className="text-muted-foreground hover:text-primary">
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Progress Display */}
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
                strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-display font-bold">{progress}%</span>
              <span className="text-xs text-muted-foreground">today</span>
            </div>
          </div>
        </div>

        {/* Day Selector */}
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 min-w-max">
            {dayTabs.map((d) => {
              const dateObj = new Date(d + "T00:00:00");
              const isSelected = d === selectedDate;
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`flex flex-col items-center px-3 py-2 rounded-xl transition-all min-w-[52px] ${
                    isSelected ? "bg-primary text-white shadow-lg" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <span className="text-xs font-medium">{dateObj.toLocaleDateString("en", { weekday: "short" })}</span>
                  <span className="text-lg font-bold">{dateObj.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          <h3 className="font-display font-semibold">Tasks for {new Date(selectedDate + "T00:00:00").toLocaleDateString('en', { month: 'short', day: 'numeric' })}</h3>
          {currentTasks.length > 0 ? currentTasks.map((task) => (
            <motion.div key={task._id} layout className={`flex items-center gap-4 p-4 rounded-xl border ${task.done ? "bg-primary/5 border-primary/20" : "bg-card border-border"}`}>
              <button onClick={() => toggleTask(task._id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.done ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                {task.done && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
              <div className="flex-1">
                <p className={`text-sm font-medium ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {task.scheduledTime}
              </div>
            </motion.div>
          )) : (
            <div className="text-center py-10 bg-secondary/30 rounded-2xl border border-dashed border-border text-muted-foreground">
              No tasks scheduled for this day.
            </div>
          )}
        </div>

        {/* Chat Section */}
        {showChat && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b bg-secondary/10 font-semibold text-sm">Assistant</div>
            <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${m.role === "user" ? "bg-primary text-white" : "bg-secondary text-foreground"}`}>{m.text}</div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex gap-2">
              <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendChat()} placeholder="Ask for a swap..." />
              <Button onClick={handleSendChat} size="icon"><Send className="w-4 h-4" /></Button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default GoalDetail;