import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  getCategories,
} from "../controllers/product.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/", asyncHandler(createProduct));
router.get("/", asyncHandler(getProducts));
// Declared before "/:id" so "categories" is not read as a product id.
router.get("/categories", asyncHandler(getCategories));
router.get("/:id", asyncHandler(getProductById));

export default router;
