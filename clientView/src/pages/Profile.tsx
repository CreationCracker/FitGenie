import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User as UserIcon, Mail, Calendar, Ruler, Weight, Activity, Trophy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { getCookie } from "../utils.ts";

const Profile = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    heightCm: "",
    weightKg: "",
    level: "beginner",
    medicalIssues: ""
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = getCookie("token"); 
        if (!token) {
          navigate("/login");
          return;
        }
        
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await axios.get(`${API_BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const user = response.data.user;
        
        setFormData({
          name: user.name || "",
          email: user.email || "",
          age: user.age || "",
          heightCm: user.heightCm || "",
          weightKg: user.weightKg || "",
          level: user.level || "beginner",
          medicalIssues: user.medicalIssues && user.medicalIssues.length > 0 
            ? user.medicalIssues.join(", ") 
            : ""
        });
      } catch (error) {
        console.error("Failed to load profile", error);
        setMessage({ type: "error", text: "Failed to load profile data." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const token = getCookie("token");
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

      const parsedMedicalIssues = formData.medicalIssues
        .split(",")
        .map((issue) => issue.trim())
        .filter((issue) => issue.length > 0);

      const response = await axios.put(
        `${API_BASE_URL}/update-profile`,
        {
          name: formData.name, 
          age: formData.age ? parseInt(formData.age as string) : undefined,
          heightCm: formData.heightCm ? parseInt(formData.heightCm as string) : undefined,
          weightKg: formData.weightKg ? parseInt(formData.weightKg as string) : undefined,
          level: formData.level,
          medicalIssues: parsedMedicalIssues
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      localStorage.setItem('user', JSON.stringify(response.data.user));
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error: any) {
      setMessage({ 
        type: "error", 
        text: error.response?.data?.message || "Failed to update profile." 
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="w-full max-w-2xl mx-auto px-4 h-16 flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/dashboard")} 
            className="rounded-full shrink-0 bg-secondary/50 hover:bg-secondary hover:text-foreground transition-all duration-200 hover:-translate-x-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-bold text-foreground ml-4 truncate">Profile Settings</h1>
        </div>
      </header>

      <main className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full gradient-primary flex items-center justify-center mb-3 sm:mb-4 shadow-md shrink-0">
            <UserIcon className="w-10 h-10 sm:w-12 sm:h-12 text-primary-foreground" />
          </div>
          <h2 className="font-display text-lg sm:text-xl font-bold text-foreground text-center px-4 break-words">
            {formData.name || "User Name"}
          </h2>
          <p className="text-muted-foreground text-sm text-center px-4 break-all">
            {formData.email}
          </p>
        </div>

        <form onSubmit={handleSave} className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm w-full">
          
          {message.text && (
            <div className={`p-3 rounded-lg text-sm border mb-5 ${message.type === 'error' ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-green-500/10 border-green-500/20 text-green-600'}`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {[
              { icon: UserIcon, label: "Full Name", name: "name", type: "text" },
              { icon: Calendar, label: "Age", name: "age", type: "number" },
              { icon: Ruler, label: "Height (cm)", name: "heightCm", type: "number" },
              { icon: Weight, label: "Weight (kg)", name: "weightKg", type: "number" },
            ].map(({ icon: Icon, label, name, type }) => (
              <div key={name} className="space-y-2 w-full">
                <Label className="text-foreground flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" /> {label}
                </Label>
                <Input 
                  name={name}
                  type={type}
                  value={formData[name as keyof typeof formData]} 
                  onChange={handleInputChange}
                  placeholder="N/A" 
                  className="w-full bg-secondary border-border text-foreground h-11 transition-all focus:ring-2 focus:ring-primary/20" 
                />
              </div>
            ))}
          </div>

          <div className="space-y-4 mt-4 sm:mt-5">
            <div className="space-y-2 w-full">
              <Label className="text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground shrink-0" /> Medical Issues
              </Label>
              <Input 
                name="medicalIssues"
                type="text"
                value={formData.medicalIssues} 
                onChange={handleInputChange}
                placeholder="Comma separated (e.g., Asthma, Knee pain)" 
                className="w-full bg-secondary border-border text-foreground h-11 transition-all focus:ring-2 focus:ring-primary/20" 
              />
            </div>

            <div className="space-y-2 w-full">
              <Label className="text-foreground flex items-center gap-2">
                <Trophy className="w-4 h-4 text-muted-foreground shrink-0" /> Fitness Level
              </Label>
              <select 
                name="level" 
                value={formData.level} 
                onChange={handleInputChange}
                className="flex h-11 w-full items-center justify-between rounded-md border border-border bg-secondary px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="space-y-2 w-full">
              <Label className="text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" /> Email (Read Only)
              </Label>
              <Input 
                value={formData.email} 
                readOnly 
                className="w-full bg-secondary/50 border-border text-muted-foreground h-11 cursor-not-allowed" 
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isSaving}
            className="w-full h-12 gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity mt-6 shadow-sm"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default Profile;