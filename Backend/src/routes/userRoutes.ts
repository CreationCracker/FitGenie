import { Router } from "express";
import { 
  loginUser, 
  signupUser, 
  updateProfile, 
  getUserProfile, 
  googleLogin,
  logoutUser,
  getCurrentUser,
} from "../controller/userController.js";
import { requireAuth } from "../middleware/auth.js"; 

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

export default router;