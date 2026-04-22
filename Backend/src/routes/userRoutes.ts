import { Router } from "express";
import { 
  loginUser, 
  signupUser, 
  updateProfile, 
  getUserProfile, 
  googleLogin,
  logoutUser,
  getCurrentUser,
  getMyGoals
} from "../controller/userController.js";
import { requireAuth } from "../middleware/auth.js"; 
import { get } from "mongoose";

const router = Router();

// Public Authentication Routes
router.post('/login', loginUser);
router.post('/signup', signupUser);
router.post('/auth/google', googleLogin);
router.post('/logout', logoutUser);

// Protected Profile Routes
router.get('/me', requireAuth, getCurrentUser);
router.put("/update-profile", requireAuth, updateProfile);
router.get("/profile", requireAuth, getUserProfile);
router.get("/getMyGoals",requireAuth,getMyGoals);

export default router;