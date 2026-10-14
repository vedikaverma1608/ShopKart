import { Router } from "express";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist,
} from "../controllers/wishlist.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(protect);

router.get("/", asyncHandler(getWishlist));
router.post("/:productId", asyncHandler(addToWishlist));
router.patch("/:productId/toggle", asyncHandler(toggleWishlist));
router.delete("/:productId", asyncHandler(removeFromWishlist));

export default router;
