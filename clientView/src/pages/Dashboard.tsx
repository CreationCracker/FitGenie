import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, ShoppingBag, LogOut, MessageSquare, X, Send, 
  Bot, Sparkles, CheckCircle2, Circle, Trophy, 
  XCircle, History, UserCircle, ArrowRight, Loader2 
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCookie } from "../utils.ts";
import axios from "axios";  

interface Task {
  _id: string;
  title: string;
  scheduledTime: string;
  done: boolean;
}

interface Goal {
  _id: string;
  title: string;
  type: string;
  physiqueTarget: string;
  durationDays: number;
  progress: number;
  status: "active" | "completed" | "abandoned";
  tasks: Task[];
  endDate?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Athlete");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Chat States
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState([{ id: "init", role: "bot", text: "Hi! I'm your AI Fitness Agent." }]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Goals from Backend
  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.get(`${API_BASE_URL}/goals`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGoals(response.data);
    } catch (error) {
      console.error("Failed to fetch goals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUserName(JSON.parse(storedUser).name || "Athlete");
    fetchGoals();
  }, []);

  // 2. Toggle Task Status on Backend
  const handleToggleTask = async (goalId: string, taskId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/goals/${goalId}/tasks/${taskId}/toggle`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${getCookie("token")}`,
        },
      });

      if (response.ok) {
        const updatedGoal = await response.json();
        // Update local state immediately
        setGoals(prev => prev.map(g => g._id === goalId ? updatedGoal : g));
      }
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate("/login");
  };

  // Filter goals
  const activeGoals = goals.filter(g => g.status === "active" || !g.status);
  const pastGoals = goals.filter(g => g.status === "completed" || g.status === "abandoned");

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/70 backdrop-blur-2xl border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="font-display font-bold text-xl text-foreground">Fit<span className="text-primary">Track</span></h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/buy-items"><Button variant="ghost" size="icon"><ShoppingBag className="w-5 h-5" /></Button></Link>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive"><LogOut className="w-5 h-5" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10 relative z-10">
        
        {/* Dynamic Welcome */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <p className="text-primary font-medium tracking-wide mb-1 uppercase text-xs">Dashboard Overview</p>
            <h1 className="text-4xl md:text-5xl font-display font-black text-foreground">
              Hey, <span className="text-primary">{userName}</span>! 👋
            </h1>
          </motion.div>
          <Link to="/profile">
            <Button variant="outline" className="rounded-xl gap-2 hover:bg-primary/5 border-primary/20">
              <UserCircle className="w-5 h-5" /> View Profile <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Button>
          </Link>
        </section>

        {/* Active Goals */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-2xl text-foreground tracking-tight">Active Goals</h2>
            <Link to="/add-goal"><Button className="gap-2 font-semibold shadow-md transition-all hover:scale-105 active:scale-95"><Plus className="w-4 h-4" /> Add Goal</Button></Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeGoals.length > 0 ? activeGoals.map((goal, i) => (
              <motion.div key={goal._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-1 block">{goal.type} • {goal.physiqueTarget}</span>
                    <h3 className="text-xl font-bold text-foreground">{goal.title}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground">{goal.durationDays} Days</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${goal.progress}%` }} />
                      </div>
                      <span className="text-xs font-medium">{goal.progress}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center justify-between">
                    Today's Tasks
                    <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                      {goal.tasks.filter(t => t.done).length} / {goal.tasks.length} Completed
                    </span>
                  </h4>
                  <div className="space-y-3">
                    {goal.tasks.map((task) => (
                      <div key={task._id} className={`flex items-center gap-3 p-3 rounded-xl border ${task.done ? 'bg-secondary/30 border-transparent' : 'bg-background border-border'} transition-colors`}>
                        <button onClick={() => handleToggleTask(goal._id, task._id)} className="text-primary hover:scale-110 transition-transform">
                          {task.done ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                        </button>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${task.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{task.title}</p>
                          <p className="text-xs text-muted-foreground">{task.scheduledTime}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Link to={`/goal/${goal._id}`}><Button variant="outline" className="w-full mt-5">View Full Plan</Button></Link>
              </motion.div>
            )) : (
              <p className="text-muted-foreground italic">No active goals. Time to set one!</p>
            )}
          </div>
        </div>

        {/* Goal History */}
        {pastGoals.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="pt-4">
            <div className="flex items-center gap-2 mb-6">
              <History className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-display font-bold text-xl text-foreground tracking-tight">Goal History</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastGoals.map((goal) => (
                <Link to={`/goal/${goal._id}`} key={goal._id}>
                  <div className="group bg-card/50 border border-border/40 rounded-xl p-5 hover:bg-card hover:border-border transition-all cursor-pointer shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{goal.title}</h3>
                        <span className="text-xs text-muted-foreground">{goal.type} • {goal.endDate || 'Finished'}</span>
                      </div>
                      {goal.status === "completed" ? (
                        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center"><Trophy className="w-4 h-4 text-green-600" /></div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center"><XCircle className="w-4 h-4 text-destructive" /></div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* AI Bot logic remains similar, but now "dynamic" in sense of state */}
      {/* ... (Bot Code) ... */}
    </div>
  );
};

export default Dashboard;