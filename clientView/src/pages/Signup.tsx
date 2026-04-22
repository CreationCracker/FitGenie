import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8000";

  // Handle successful authentication
  const handleAuthSuccess = (token: string, user: any) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    navigate("/onboarding");
  };

  // ================= NORMAL SIGNUP =================
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      return setError("All fields are required.");
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters long.");
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/user/signup`,
        { name, email, password },
        { withCredentials: true }
      );

      handleAuthSuccess(response.data.token, response.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  // ================= GOOGLE SIGNUP =================
  const handleGoogleSignup = async (credentialResponse: any) => {
    setIsLoading(true);
    setError("");

    try {
      const res = await axios.post(
        `${API_BASE_URL}/user/auth/google/signup`, // Dedicated signup route
        {
          token: credentialResponse.credential,
        },
        { withCredentials: true }
      );

      handleAuthSuccess(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || "Google signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/40 to-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* HEADER */}
        <div className="text-center mb-8">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-primary to-purple-600 mb-4 shadow-lg"
          >
            <Dumbbell className="w-8 h-8 text-white" />
          </motion.div>

          <h1 className="text-3xl font-bold font-display">
            Create Account
          </h1>
          <p className="text-muted-foreground mt-2">
            Start your fitness transformation today
          </p>
        </div>

        {/* CARD */}
        <div className="bg-card/80 backdrop-blur-lg border border-border rounded-2xl p-8 shadow-xl">
          {/* ERROR MESSAGE */}
          {error && (
            <div className="p-3 mb-4 bg-red-100 border border-red-300 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSignup} className="space-y-5">
            {/* NAME */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="h-12"
              />
            </div>

            {/* EMAIL */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-12"
              />
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-12 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters.
              </p>
            </div>

            {/* SUBMIT BUTTON */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white shadow-md"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          {/* DIVIDER */}
          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-border"></div>
            <span className="px-3 text-sm text-muted-foreground">
              OR CONTINUE WITH
            </span>
            <div className="flex-grow h-px bg-border"></div>
          </div>

          {/* GOOGLE SIGNUP */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSignup}
              onError={() => setError("Google Signup Failed")}
              theme="outline"
              size="large"
              text="signup_with"
              shape="pill"
            />
          </div>

          {/* LOGIN LINK */}
          <p className="text-center text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary hover:underline font-semibold"
            >
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;