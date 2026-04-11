import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ShoppingBag, LogOut, MessageSquare, X, Send, Bot, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GoalCard, { Goal } from "@/components/GoalCard";
import ProfileCard from "@/components/ProfileCard";
import { getCookie } from "../utils.ts";

const mockGoals: Goal[] = [
  { id: "1", title: "Muscle Building", type: "gym", progress: 65, currentTask: "Chest & Triceps workout", daysLeft: 21 },
  { id: "2", title: "Morning Yoga", type: "yoga", progress: 40, currentTask: "Sun Salutation flow", daysLeft: 45 },
  { id: "3", title: "Clean Eating", type: "diet", progress: 80, currentTask: "Prep high-protein lunch", daysLeft: 10 },
  { id: "4", title: "5K Training", type: "cardio", progress: 25, currentTask: "Interval run 3km", daysLeft: 30 },
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

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-2xl text-foreground tracking-tight">Your Goals</h2>
            <Link to="/add-goal">
              <Button className="bg-foreground text-background hover:bg-foreground/90 gap-2 font-semibold shadow-md transition-all hover:scale-105 active:scale-95">
                <Plus className="w-4 h-4" /> Add Goal
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {mockGoals.map((goal, i) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="transition-transform duration-300 group-hover:-translate-y-1">
                  <GoalCard goal={goal} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

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