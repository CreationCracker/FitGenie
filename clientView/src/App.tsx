import axios from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GoogleOAuthProvider } from "@react-oauth/google";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AddGoal from "./pages/AddGoal";
import GoalDetail from "./pages/GoalDetail";
import BuyItems from "./pages/BuyItems";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/OnBoarding";
import AIAssistant from "./pages/AiAssistant";
import PlanFeedback from "./pages/PlanFeedback";

// ✅ VERY IMPORTANT (for cookies auth)
axios.defaults.withCredentials = true;

const queryClient = new QueryClient();

// 🔥 THIS COMPONENT HANDLES THE HIDING LOGIC
const ConditionalAI = () => {
  const location = useLocation();
  
  // Define routes where the AI should NOT appear
  const excludedPaths = ["/login", "/signup"];
  
  if (excludedPaths.includes(location.pathname)) {
    return null;
  }

  return <AIAssistant />;
};

const App = () => (
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add-goal" element={<AddGoal />} />
            <Route path="/goal/:id" element={<GoalDetail />} />
            <Route path="/buy-items" element={<BuyItems />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/feedback" element={<PlanFeedback />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          {/* Use the conditional wrapper instead of the raw component */}
          <ConditionalAI />
          
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;