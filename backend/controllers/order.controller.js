import crypto from "crypto";
import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import razorpay from "../config/razorpay.js";
import { isValidObjectId } from "../utils/validateObjectId.js";

const STATUS_FLOW = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

const validateShippingAddress = (address) => {
  if (!address || typeof address !== "object") return "Shipping address is required";

  const required = ["fullName", "phone", "addressLine1", "city", "state", "pincode"];
  for (const field of required) {
    if (!address[field]?.trim()) return `${field} is required`;
  }

  if (!/^[6-9]\d{9}$/.test(address.phone.trim())) return "Phone must be a valid 10-digit number";
  if (!/^\d{6}$/.test(address.pincode.trim())) return "Pincode must contain 6 digits";

  return null;
};

const cleanAddress = (a) => ({
  fullName: a.fullName.trim(),
  phone: a.phone.trim(),
  addressLine1: a.addressLine1.trim(),
  city: a.city.trim(),
  state: a.state.trim(),
  pincode: a.pincode.trim(),
});

export const createPaymentOrder = async (req, res) => {
  const addressError = validateShippingAddress(req.body.shippingAddress);
  if (addressError) {
    return res.status(400).json({ success: false, message: addressError });
  }

  const customer = await Customer.findById(req.user._id);

  if (customer.cart.length === 0) {
    return res.status(400).json({ success: false, message: "Your cart is empty" });
  }

  // The shipped .env.example carries placeholder keys. Catching them here gives
  // "not configured" instead of a confusing gateway error later on.
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const unset = (value) => !value || /^(your_|rzp_test_x+$)/.test(value);

  if (unset(keyId) || unset(keySecret)) {
    return res.status(503).json({
      success: false,
      message:
        "Payments are not configured. Add your Razorpay test keys to backend/.env and restart the server.",
    });
  }

  // Products are re-read here rather than trusting anything the cart or the
  // browser carried: price and stock may both have moved since add-to-cart.
  const products = await Product.find({
    _id: { $in: customer.cart.map((item) => item.product) },
  });
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const items = [];
  let totalAmount = 0;

  for (const cartItem of customer.cart) {
    const product = byId.get(cartItem.product.toString());

    if (!product) {
      return res.status(400).json({
        success: false,
        message: "A product in your cart is no longer available",
      });
    }

    if (cartItem.quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for ${product.name}`,
      });
    }

    items.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: cartItem.quantity,
      image: product.image,
    });

    totalAmount += product.price * cartItem.quantity;
  }

  // The server owns the total. Anything the client sent as totalAmount is ignored.
  totalAmount = Math.round(totalAmount * 100) / 100;

  const order = await Order.create({
    user: customer._id,
    items,
    shippingAddress: cleanAddress(req.body.shippingAddress),
    totalAmount,
    paymentStatus: "PENDING",
    status: "PENDING_PAYMENT",
  });

  let razorpayOrder;
  try {
    razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // Razorpay takes paise, not rupees
      currency: "INR",
      receipt: order._id.toString(),
    });
  } catch (err) {
    order.paymentStatus = "FAILED";
    await order.save();
    const reason = err?.error?.description;
    console.error("Razorpay order creation failed", err?.error ?? err);

    // Pass the gateway's own reason through: "Authentication failed" points at
    // the keys, while a generic message sends people hunting for a network fault.
    return res.status(502).json({
      success: false,
      message: reason ? `Payment gateway error: ${reason}` : "Could not reach the payment gateway",
    });
  }

  order.razorpayOrderId = razorpayOrder.id;
  await order.save();

  res.status(201).json({
    success: true,
    shopKartOrderId: order._id,
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    key: process.env.RAZORPAY_KEY_ID, // key id is public; the secret never leaves the server
  });
};

export const verifyPayment = async (req, res) => {
  const { shopKartOrderId, razorpay_payment_id, razorpay_signature } = req.body;

  if (!isValidObjectId(shopKartOrderId)) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }

  if (!razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: "Missing payment details" });
  }

  const order = await Order.findById(shopKartOrderId);

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  if (!order.user.equals(req.user._id)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  if (order.paymentStatus === "PAID") {
    return res.json({ success: true, message: "Payment already verified", order });
  }

  // The order id in the HMAC is the one stored at creation time, not the one the
  // browser posted back — otherwise an attacker could sign a payload of their own.
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${order.razorpayOrderId}|${razorpay_payment_id}`)
    .digest("hex");

  const provided = Buffer.from(String(razorpay_signature), "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");

  const valid =
    provided.length === expectedBuf.length && crypto.timingSafeEqual(provided, expectedBuf);

  if (!valid) {
    order.paymentStatus = "FAILED";
    await order.save();
    // Cart is left untouched so the customer can retry without rebuilding it.
    return res.status(400).json({ success: false, message: "Invalid payment signature" });
  }

  order.paymentStatus = "PAID";
  order.status = "PLACED";
  order.razorpayPaymentId = razorpay_payment_id;
  await order.save();

  await Customer.findByIdAndUpdate(order.user, { $set: { cart: [] } });

  res.json({ success: true, message: "Payment verified", order });
};

export const markPaymentFailed = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }

  const order = await Order.findById(id);

  if (!order || !order.user.equals(req.user._id)) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  if (order.paymentStatus === "PENDING") {
    order.paymentStatus = "FAILED";
    await order.save();
  }

  res.json({ success: true, message: "Order marked as failed" });
};

export const getOrders = async (req, res) => {
  // Scoped to the authenticated user, newest first.
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, count: orders.length, orders });
};

export const getOrderById = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }

  const order = await Order.findById(id);

  // A 404 rather than a 403 for someone else's order: guessing ids should not
  // confirm that an order exists.
  if (!order || !order.user.equals(req.user._id)) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  res.json({ success: true, order });
};

// Bonus: development-only status progression so the Orders page can show movement.
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }

  if (!STATUS_FLOW.includes(status)) {
    return res
      .status(400)
      .json({ success: false, message: `Status must be one of ${STATUS_FLOW.join(", ")}` });
  }

  const order = await Order.findById(id);

  if (!order || !order.user.equals(req.user._id)) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  if (order.paymentStatus !== "PAID") {
    return res.status(400).json({ success: false, message: "Order has not been paid" });
  }

  order.status = status;
  await order.save();

  res.json({ success: true, order });
};
