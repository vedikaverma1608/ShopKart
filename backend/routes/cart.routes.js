import { Router } from "express";
import {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
} from "../controllers/cart.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(protect);

router.get("/", asyncHandler(getCart));
router.post("/:productId", asyncHandler(addToCart));
router.patch("/:productId", asyncHandler(updateCartQuantity));
router.delete("/:productId", asyncHandler(removeFromCart));

export default router;
