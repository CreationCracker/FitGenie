import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  ShoppingBag,
  LogOut,
  Sparkles,
  Trophy,
  XCircle,
  History,
  UserCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import axios from "axios";

interface Goal {
  _id: string;
  title: string;
  type: string;
  physiqueTarget: string;
  durationDays: number;
  progress: number;
  status: "active" | "completed" | "abandoned";
  endDate?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("Athlete");
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [pastGoals, setPastGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8000";

  // 🔥 FETCH GOALS USING TOKEN
  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return navigate("/login");
      }

      const res = await axios.get(
        `${API_BASE_URL}/user/getMyGoals`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setActiveGoals(res.data.activeGoals || []);
      setPastGoals(res.data.pastGoals || []);
    } catch (error: any) {
      console.error("Fetch Goals Error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔥 INITIAL LOAD
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setUserName(JSON.parse(storedUser).name || "Athlete");
      } catch {
        setUserName("Athlete");
      }
    }

    fetchGoals();
  }, []);

  // 🔥 LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // 🔥 LOADING
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-background/70 backdrop-blur-2xl border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="font-bold text-xl">
              Fit<span className="text-primary">Track</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/buy-items">
              <Button variant="ghost" size="icon">
                <ShoppingBag className="w-5 h-5" />
              </Button>
            </Link>

            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">

        {/* WELCOME */}
        <section className="flex justify-between items-end border-b pb-6">
          <div>
            <p className="text-primary text-xs uppercase">Dashboard</p>
            <h1 className="text-4xl font-bold">
              Hey, <span className="text-primary">{userName}</span> 👋
            </h1>
          </div>

          <Link to="/profile">
            <Button variant="outline" className="gap-2">
              <UserCircle className="w-5 h-5" />
              Profile
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </section>

        {/* ACTIVE GOALS */}
        <section>
          <div className="flex justify-between mb-6">
            <h2 className="text-2xl font-bold">Active Goals</h2>

            <Link to="/add-goal">
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Add Goal
              </Button>
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {activeGoals.length > 0 ? (
              activeGoals.map((goal, i) => (
                <motion.div
                  key={goal._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card border rounded-2xl p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs text-primary uppercase">
                        {goal.type} • {goal.physiqueTarget}
                      </span>
                      <h3 className="text-xl font-bold">{goal.title}</h3>
                    </div>

                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">
                        {goal.durationDays} days
                      </span>

                      <div className="mt-2 flex items-center gap-2">
                        <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                        <span className="text-xs">{goal.progress}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-muted-foreground flex justify-between">
                    <span>Plan Duration: {goal.durationDays} days</span>
                    <span>Status: Active</span>
                  </div>

                  <Link to={`/goal/${goal._id}`}>
                    <Button variant="outline" className="w-full mt-5">
                      View Full Plan
                    </Button>
                  </Link>
                </motion.div>
              ))
            ) : (
              <p className="text-muted-foreground italic">
                No active goals. Time to set one!
              </p>
            )}
          </div>
        </section>

        {/* HISTORY */}
        {pastGoals.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <History className="w-5 h-5" />
              <h2 className="text-xl font-bold">Goal History</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastGoals.map((goal) => (
                <Link to={`/goal/${goal._id}`} key={goal._id}>
                  <div className="bg-card border rounded-xl p-5 hover:shadow-md transition">
                    <div className="flex justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{goal.title}</h3>
                        <span className="text-xs text-muted-foreground">
                          {goal.type} • {goal.endDate || "Finished"}
                        </span>
                      </div>

                      {goal.status === "completed" ? (
                        <Trophy className="text-green-500" />
                      ) : (
                        <XCircle className="text-red-500" />
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {goal.progress}% completed
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Dashboard;