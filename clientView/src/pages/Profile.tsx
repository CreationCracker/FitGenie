import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Calendar, Ruler, Weight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center">
          <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-foreground ml-4">Profile</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center mb-4">
            <User className="w-12 h-12 text-primary-foreground" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">Alex Johnson</h2>
          <p className="text-muted-foreground text-sm">alex@example.com</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          {[
            { icon: User, label: "Full Name", value: "Alex Johnson" },
            { icon: Mail, label: "Email", value: "alex@example.com" },
            { icon: Calendar, label: "Age", value: "28" },
            { icon: Ruler, label: "Height (cm)", value: "178" },
            { icon: Weight, label: "Weight (kg)", value: "75" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="space-y-2">
              <Label className="text-foreground flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground" /> {label}
              </Label>
              <Input defaultValue={value} className="bg-secondary border-border text-foreground h-11" />
            </div>
          ))}

          <Button className="w-full h-12 gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity mt-2">
            Save Changes
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Profile;
