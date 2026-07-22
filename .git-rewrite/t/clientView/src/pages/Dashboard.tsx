import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ShoppingBag, LogOut, MessageSquare, X, Send, Bot, Sparkles, CheckCircle2, Circle, Trophy, XCircle, History } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProfileCard from "@/components/ProfileCard";
import { getCookie } from "../utils.ts";

const today = new Date().toISOString().split('T')[0];

// Mock data for currently active goals
const activeGoals: any[] = [
  {
    _id: "1",
    title: "Summer Shred 2026",
    type: "gym",
    physiqueTarget: "Lose Weight",
    durationDays: 90,
    progress: 15,
    tasks: [
      { _id: "t1", date: today, title: "Oats & Whey Protein", scheduledTime: "08:00 AM", done: true },
      { _id: "t2", date: today, title: "Push Workout (Chest/Tri)", scheduledTime: "05:30 PM", done: false },
      { _id: "t3", date: today, title: "Grilled Chicken Salad", scheduledTime: "08:00 PM", done: false },
    ]
  },
  {
    _id: "2",
    title: "Morning Mobility",
    type: "yoga",
    physiqueTarget: "Increase Flexibility",
    durationDays: 30,
    progress: 10,
    tasks: [
      { _id: "t4", date: today, title: "15 Min Sun Salutation", scheduledTime: "07:00 AM", done: true },
    ]
  }
];

// Mock data for past/completed goals
const pastGoals: any[] = [
  {
    _id: "3",
    title: "Winter Bulking 2025",
    type: "gym",
    physiqueTarget: "Build Muscle",
    durationDays: 120,
    progress: 100,
    status: "completed",
    endDate: "Feb 2026"
  },
  {
    _id: "4",
    title: "Couch to 5K",
    type: "cardio",
    physiqueTarget: "Improve Endurance",
    durationDays: 60,
    progress: 45,
    status: "abandoned",
    endDate: "Nov 2025"
  }
];

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: "init", role: "bot", text: "Hi! I'm your AI Fitness Agent. Ask me about your goals, routines, or nutrition!" }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    const token = getCookie("token");
    if (token) {
      localStorage.removeItem("user");
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
    navigate("/login");
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", text: inputMessage };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");

    setTimeout(() => {
      const botMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: "bot", 
        text: "I'm analyzing your fitness data. I will generate a personalized response for this soon!" 
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 1000);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isBotOpen]);

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
            <h1 className="font-display font-bold text-xl text-foreground">
              Fit<span className="text-primary">Track</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/buy-items">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-secondary/80">
                <ShoppingBag className="w-5 h-5" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10 relative z-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <ProfileCard />
        </motion.div>

        {/* --- Active Goals Section --- */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-2xl text-foreground tracking-tight">Active Goals</h2>
            <Link to="/add-goal">
              <Button className="bg-foreground text-background hover:bg-foreground/90 gap-2 font-semibold shadow-md transition-all hover:scale-105 active:scale-95">
                <Plus className="w-4 h-4" /> Add Goal
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeGoals.map((goal, i) => (
              <motion.div
                key={goal._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-1 block">
                      {goal.type} • {goal.physiqueTarget}
                    </span>
                    <h3 className="text-xl font-bold text-foreground">{goal.title}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground">{goal.durationDays} Days</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${goal.progress}%` }} 
                        />
                      </div>
                      <span className="text-xs font-medium">{goal.progress}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center justify-between">
                    Today's Tasks
                    <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                      {goal.tasks.filter((t: any) => t.done).length} / {goal.tasks.length} Completed
                    </span>
                  </h4>
                  <div className="space-y-3">
                    {goal.tasks.map((task: any) => (
                      <div 
                        key={task._id} 
                        className={`flex items-center gap-3 p-3 rounded-xl border ${task.done ? 'bg-secondary/30 border-transparent' : 'bg-background border-border'} transition-colors`}
                      >
                        <button className="text-primary hover:scale-110 transition-transform">
                          {task.done ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground" />
                          )}
                        </button>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${task.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {task.title}
                          </p>
                          <p className="text-xs text-muted-foreground">{task.scheduledTime}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Link to={`/goal/${goal._id}`}>
                   <Button variant="outline" className="w-full mt-5">View Full Plan</Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* --- Goal History Section --- */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="pt-4"
        >
          <div className="flex items-center gap-2 mb-6">
            <History className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-display font-bold text-xl text-foreground tracking-tight">Goal History</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastGoals.map((goal, i) => (
              <Link to={`/goal/${goal._id}`} key={goal._id}>
                <div className="group bg-card/50 border border-border/40 rounded-xl p-5 hover:bg-card hover:border-border transition-all cursor-pointer shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {goal.title}
                      </h3>
                      <span className="text-xs text-muted-foreground">{goal.type} • Ended {goal.endDate}</span>
                    </div>
                    {/* Status Icons */}
                    {goal.status === "completed" ? (
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                        <XCircle className="w-4 h-4 text-destructive" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${goal.status === 'completed' ? 'bg-green-500' : 'bg-muted-foreground/40'}`} 
                        style={{ width: `${goal.progress}%` }} 
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{goal.progress}%</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* --- Shop Banner --- */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link to="/buy-items">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-6 sm:p-8 hover:border-primary/40 hover:bg-card transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl hover:shadow-primary/5 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0 transform group-hover:scale-110 transition-transform duration-300">
                  <ShoppingBag className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-foreground mb-1">Fitness Shop</h3>
                  <p className="text-muted-foreground leading-relaxed">Upgrade your workouts with the best deals on premium supplements and gear.</p>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      </main>

      {/* --- AI Bot --- */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isBotOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 250, damping: 25 }}
              className="bg-card border border-border shadow-2xl rounded-2xl w-[320px] sm:w-[380px] h-[500px] max-h-[80vh] flex flex-col mb-4 overflow-hidden"
            >
              <div className="gradient-primary p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-foreground text-sm">AI Fitness Agent</h3>
                    <div className="flex items-center gap-1.5 text-primary-foreground/80 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Online
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsBotOpen(false)}
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/30">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div 
                      className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                        msg.role === "user" 
                          ? "bg-primary text-primary-foreground rounded-tr-sm" 
                          : "bg-card border border-border text-foreground rounded-tl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-3 bg-card border-t border-border shrink-0">
                <div className="relative flex items-center">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about your workout..."
                    className="pr-12 bg-secondary/50 border-transparent focus:border-primary/50 rounded-full h-10"
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={!inputMessage.trim()}
                    className="absolute right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsBotOpen(!isBotOpen)}
          className={`w-14 h-14 rounded-full shadow-xl shadow-primary/30 flex items-center justify-center transition-colors ${
            isBotOpen ? "bg-secondary text-foreground border border-border" : "gradient-primary text-primary-foreground"
          }`}
        >
          {isBotOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </motion.button>
      </div>
    </div>
  );
};

export default Dashboard;