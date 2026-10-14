import Product from "../models/product.model.js";
import { isValidObjectId } from "../utils/validateObjectId.js";

const LIST_FIELDS = "name price category image stock";

const SORT_OPTIONS = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  newest: { createdAt: -1 },
};

export const createProduct = async (req, res) => {
  const { name, description, price, category, image, stock } = req.body;

  if (!name?.trim() || !description?.trim() || !category?.trim() || !image?.trim()) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  if (typeof price !== "number" || price <= 0) {
    return res.status(400).json({ success: false, message: "Price must be greater than 0" });
  }

  if (typeof stock !== "number" || stock < 0 || !Number.isInteger(stock)) {
    return res
      .status(400)
      .json({ success: false, message: "Stock must be an integer of 0 or more" });
  }

  const product = await Product.create({
    name: name.trim(),
    description: description.trim(),
    price,
    category: category.trim(),
    image: image.trim(),
    stock,
  });

  res.status(201).json({ success: true, product });
};

export const getProducts = async (req, res) => {
  const { search, category, sort } = req.query;

  // The filter is assembled from whichever params arrived, so one endpoint
  // serves search, category and the two combined.
  const filter = {};

  if (search?.trim()) {
    // Escaped so regex characters in user input are matched literally.
    const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.name = { $regex: safe, $options: "i" };
  }

  if (category?.trim() && category !== "All") {
    filter.category = category.trim();
  }

  const products = await Product.find(filter)
    .select(LIST_FIELDS)
    .sort(SORT_OPTIONS[sort] ?? { createdAt: -1 });

  res.json({ success: true, count: products.length, products });
};

export const getProductById = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }

  const product = await Product.findById(id);

  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  res.json({ success: true, product });
};

export const getCategories = async (req, res) => {
  const categories = await Product.distinct("category");
  res.json({ success: true, categories: categories.sort() });
};
