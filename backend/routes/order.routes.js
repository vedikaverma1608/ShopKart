import { Router } from "express";
import {
  createPaymentOrder,
  verifyPayment,
  markPaymentFailed,
  getOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(protect);

router.post("/create-payment-order", asyncHandler(createPaymentOrder));
router.post("/verify-payment", asyncHandler(verifyPayment));
router.get("/", asyncHandler(getOrders));
router.get("/:id", asyncHandler(getOrderById));
router.patch("/:id/payment-failed", asyncHandler(markPaymentFailed));
router.patch("/:id/status", asyncHandler(updateOrderStatus));

export default router;
