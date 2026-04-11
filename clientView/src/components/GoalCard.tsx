import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Leaf, Flame, Heart } from "lucide-react";

export interface Goal {
  id: string;
  title: string;
  type: "gym" | "yoga" | "diet" | "cardio";
  progress: number;
  currentTask: string;
  daysLeft: number;
}

const typeConfig = {
  gym: { icon: Dumbbell, color: "from-primary to-emerald-400" },
  yoga: { icon: Leaf, color: "from-violet-500 to-purple-400" },
  diet: { icon: Flame, color: "from-orange-500 to-yellow-400" },
  cardio: { icon: Heart, color: "from-rose-500 to-pink-400" },
};

const GoalCard = ({ goal }: { goal: Goal }) => {
  const navigate = useNavigate();
  const config = typeConfig[goal.type];
  const Icon = config.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/goal/${goal.id}`)}
      className="bg-card border border-border rounded-2xl p-5 cursor-pointer hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
          {goal.daysLeft}d left
        </span>
      </div>

      <h3 className="font-display font-semibold text-foreground mb-1">{goal.title}</h3>
      <p className="text-sm text-muted-foreground mb-4 truncate">{goal.currentTask}</p>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="text-primary font-semibold">{goal.progress}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${goal.progress}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className={`h-full rounded-full bg-gradient-to-r ${config.color}`}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default GoalCard;
