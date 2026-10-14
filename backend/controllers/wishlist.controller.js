import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";
import { isValidObjectId } from "../utils/validateObjectId.js";

const WISHLIST_FIELDS = "name price category image stock";

export const addToWishlist = async (req, res) => {
  const { productId } = req.params;

  if (!isValidObjectId(productId)) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  const customer = await Customer.findById(req.user._id);

  if (customer.wishlist.some((id) => id.equals(product._id))) {
    return res.status(409).json({ success: false, message: "Product already in wishlist" });
  }

  // Only the ObjectId is stored. The Product collection stays the source of
  // truth, so a price or stock change needs no wishlist update.
  customer.wishlist.push(product._id);
  await customer.save();

  res.json({ success: true, message: "Product added to wishlist" });
};

export const getWishlist = async (req, res) => {
  // The user comes from the JWT, never from the URL — that is what stops one
  // customer reading another customer's wishlist.
  const customer = await Customer.findById(req.user._id).populate({
    path: "wishlist",
    select: WISHLIST_FIELDS,
  });

  res.json({ success: true, count: customer.wishlist.length, wishlist: customer.wishlist });
};

export const removeFromWishlist = async (req, res) => {
  const { productId } = req.params;

  if (!isValidObjectId(productId)) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }

  const customer = await Customer.findById(req.user._id);
  const before = customer.wishlist.length;

  customer.wishlist = customer.wishlist.filter((id) => id.toString() !== productId);

  if (customer.wishlist.length === before) {
    return res.status(404).json({ success: false, message: "Product not in wishlist" });
  }

  await customer.save();
  res.json({ success: true, message: "Product removed from wishlist" });
};

export const toggleWishlist = async (req, res) => {
  const { productId } = req.params;

  if (!isValidObjectId(productId)) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  const customer = await Customer.findById(req.user._id);
  const saved = customer.wishlist.some((id) => id.equals(product._id));

  if (saved) {
    customer.wishlist = customer.wishlist.filter((id) => !id.equals(product._id));
  } else {
    customer.wishlist.push(product._id);
  }

  await customer.save();

  res.json({
    success: true,
    saved: !saved,
    message: saved ? "Product removed from wishlist" : "Product added to wishlist",
  });
};
