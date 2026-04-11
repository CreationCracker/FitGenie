import { Router } from "express";
import { loginUser, signupUser, updateProfile, getUserProfile } from "../controller/userController.js";

import {requireAuth} from "../middleware/auth.js"
const router = Router();

router.post('/login', loginUser);
router.post('/signup', signupUser);
router.put("/update-profile", requireAuth, updateProfile);


router.get("/profile", requireAuth, getUserProfile);
export default router;