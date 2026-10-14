import { Router } from "express";
import {
  register,
  login,
  me,
  logout,
  changePassword,
} from "../controllers/customer.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.get("/me", protect, asyncHandler(me));
router.post("/logout", protect, asyncHandler(logout));
router.patch("/change-password", protect, asyncHandler(changePassword));

export default router;
