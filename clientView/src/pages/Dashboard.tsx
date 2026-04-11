import { motion } from "framer-motion";
import { Plus, ShoppingBag, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import GoalCard, { Goal } from "@/components/GoalCard";
import ProfileCard from "@/components/ProfileCard";

const mockGoals: Goal[] = [
  { id: "1", title: "Muscle Building", type: "gym", progress: 65, currentTask: "Chest & Triceps workout", daysLeft: 21 },
  { id: "2", title: "Morning Yoga", type: "yoga", progress: 40, currentTask: "Sun Salutation flow", daysLeft: 45 },
  { id: "3", title: "Clean Eating", type: "diet", progress: 80, currentTask: "Prep high-protein lunch", daysLeft: 10 },
  { id: "4", title: "5K Training", type: "cardio", progress: 25, currentTask: "Interval run 3km", daysLeft: 30 },
];

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="font-display font-bold text-xl text-foreground">
            Fit<span className="text-primary">Track</span>
          </h1>
          <div className="flex items-center gap-3">
            <Link to="/buy-items">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <ShoppingBag className="w-5 h-5" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/login")}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <ProfileCard />
        </motion.div>

        {/* Goals Section */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-xl text-foreground">Your Goals</h2>
            <Link to="/add-goal">
              <Button className="gradient-primary text-primary-foreground gap-2 font-semibold hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4" /> Add Goal
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {mockGoals.map((goal, i) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <GoalCard goal={goal} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Buy Items CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link to="/buy-items">
            <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">Buy Fitness Items</h3>
                  <p className="text-sm text-muted-foreground">Find the best deals on supplements, gear & more</p>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
