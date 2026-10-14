import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";
import { isValidObjectId } from "../utils/validateObjectId.js";

const CART_FIELDS = "name price category image stock";

// Every mutation replies with the whole populated cart so the frontend can
// replace its state outright instead of trying to patch it in two places.
const populatedCart = async (customerId) => {
  const customer = await Customer.findById(customerId).populate({
    path: "cart.product",
    select: CART_FIELDS,
  });

  // Drop rows whose product was deleted — populate leaves those as null.
  return customer.cart.filter((item) => item.product);
};

export const addToCart = async (req, res) => {
  const { productId } = req.params;

  if (!isValidObjectId(productId)) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  const customer = await Customer.findById(req.user._id);
  const existing = customer.cart.find((item) => item.product.equals(product._id));

  // Same product twice becomes quantity 2, never two rows.
  const nextQuantity = existing ? existing.quantity + 1 : 1;

  if (nextQuantity > product.stock) {
    return res.status(400).json({
      success: false,
      message:
        product.stock === 0
          ? `${product.name} is out of stock`
          : `Only ${product.stock} units of ${product.name} are available`,
    });
  }

  if (existing) {
    existing.quantity = nextQuantity;
  } else {
    customer.cart.push({ product: product._id, quantity: 1 });
  }

  await customer.save();

  res.json({ success: true, message: "Cart updated", cart: await populatedCart(customer._id) });
};

export const getCart = async (req, res) => {
  res.json({ success: true, cart: await populatedCart(req.user._id) });
};

export const updateCartQuantity = async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!isValidObjectId(productId)) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }

  if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  // Checked against current stock, which may have dropped since the item was added.
  if (quantity > product.stock) {
    return res.status(400).json({
      success: false,
      message: `Only ${product.stock} units of ${product.name} are available`,
    });
  }

  const customer = await Customer.findById(req.user._id);
  const item = customer.cart.find((row) => row.product.equals(product._id));

  if (!item) {
    return res.status(404).json({ success: false, message: "Product not in cart" });
  }

  item.quantity = quantity;
  await customer.save();

  res.json({ success: true, message: "Cart updated", cart: await populatedCart(customer._id) });
};

export const removeFromCart = async (req, res) => {
  const { productId } = req.params;

  if (!isValidObjectId(productId)) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }

  const customer = await Customer.findById(req.user._id);
  const before = customer.cart.length;

  customer.cart = customer.cart.filter((item) => item.product.toString() !== productId);

  if (customer.cart.length === before) {
    return res.status(404).json({ success: false, message: "Product not in cart" });
  }

  await customer.save();

  res.json({
    success: true,
    message: "Product removed from cart",
    cart: await populatedCart(customer._id),
  });
};
