import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";

type FitnessLevel = "beginner" | "intermediate" | "advanced";

const Onboarding = () => {
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [level, setLevel] = useState<FitnessLevel>("beginner");
  
  
  const [medicalIssuesInput, setMedicalIssuesInput] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
  }, [navigate]);

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

      const parsedMedicalIssues = medicalIssuesInput
        .split(",")
        .map((issue) => issue.trim())
        .filter((issue) => issue.length > 0);

      const response = await axios.put(
        `${API_BASE_URL}/user/update-profile`, 
        {
          age: parseInt(age),
          heightCm: parseInt(heightCm),
          weightKg: parseInt(weightKg),
          level,
          medicalIssues: parsedMedicalIssues
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

     
      localStorage.setItem('user', JSON.stringify(response.data.user));

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to save details");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
            <Activity className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold font-display text-foreground">
            Tell us about yourself
          </h1>
          <p className="text-muted-foreground mt-2">
            This helps us personalize your fitness goals.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <form onSubmit={handleUpdateDetails} className="space-y-5">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-foreground">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="e.g. 25"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="bg-secondary border-border text-foreground h-12"
                  min="1" max="120"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height" className="text-foreground">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="e.g. 175"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="bg-secondary border-border text-foreground h-12"
                  min="50" max="300"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight" className="text-foreground">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="e.g. 70"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="bg-secondary border-border text-foreground h-12"
                min="20" max="500"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Fitness Level</Label>
              <div className="grid grid-cols-3 gap-3 pt-1">
                {["beginner", "intermediate", "advanced"].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl as FitnessLevel)}
                    className={`h-10 rounded-lg text-sm font-medium transition-colors border ${
                      level === lvl 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-secondary text-muted-foreground border-border hover:bg-secondary/80"
                    }`}
                  >
                    {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            
            <div className="space-y-2">
              <Label htmlFor="medical" className="text-foreground">Medical Issues / Injuries (Optional)</Label>
              <Input
                id="medical"
                type="text"
                placeholder="e.g. Asthma, Lower back pain"
                value={medicalIssuesInput}
                onChange={(e) => setMedicalIssuesInput(e.target.value)}
                className="bg-secondary border-border text-foreground h-12"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground pt-1">
                Separate multiple issues with commas.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 mt-6 gradient-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Complete Setup"}
            </Button>
          </form>
          
          <button 
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;