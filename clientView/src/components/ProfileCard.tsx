import { User, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const ProfileCard = () => {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center">
          <User className="w-7 h-7 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground">Alex Johnson</h3>
          <p className="text-sm text-muted-foreground">Member since Jan 2025</p>
        </div>
        <Link to="/profile" className="ml-auto text-muted-foreground hover:text-foreground">
          <Settings className="w-5 h-5" />
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Goals", value: "4" },
          { label: "Streak", value: "12d" },
          { label: "Tasks Done", value: "87" },
        ].map((stat) => (
          <div key={stat.label} className="bg-secondary rounded-xl p-3 text-center">
            <p className="text-lg font-display font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileCard;
