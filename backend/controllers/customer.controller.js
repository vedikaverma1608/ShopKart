import bcrypt from "bcrypt";
import Customer from "../models/customer.model.js";
import { generateToken, cookieOptions } from "../utils/generateToken.js";

const SALT_ROUNDS = 10;

const publicCustomer = (c) => ({
  _id: c._id,
  fullName: c.fullName,
  email: c.email,
  phone: c.phone,
});

export const register = async (req, res) => {
  const { fullName, email, password, phone } = req.body;

  if (!fullName?.trim() || !email?.trim() || !password || !phone?.trim()) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ success: false, message: "Password must be at least 6 characters" });
  }

  const existing = await Customer.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(409).json({ success: false, message: "Email already registered" });
  }

  // bcrypt hashes with a per-password salt and is deliberately slow, which is why
  // it is used here instead of a reversible encryption scheme.
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const customer = await Customer.create({
    fullName: fullName.trim(),
    email: email.toLowerCase().trim(),
    password: hashed,
    phone: phone.trim(),
  });

  res.status(201).json({
    success: true,
    message: "Customer registered successfully",
    customer: publicCustomer(customer),
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  const customer = await Customer.findOne({ email: email.toLowerCase().trim() });

  // One identical message for "no such email" and "wrong password" so the
  // response cannot be used to discover which emails are registered.
  const invalid = () =>
    res.status(401).json({ success: false, message: "Invalid credentials" });

  if (!customer) return invalid();

  const matches = await bcrypt.compare(password, customer.password);
  if (!matches) return invalid();

  res.cookie("token", generateToken(customer._id), cookieOptions);
  res.json({ success: true, message: "Login successful", customer: publicCustomer(customer) });
};

export const me = async (req, res) => {
  res.json(publicCustomer(req.user));
};

export const logout = async (req, res) => {
  res.clearCookie("token", { ...cookieOptions, maxAge: undefined });
  res.json({ success: true, message: "Logged out successfully" });
};

export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ success: false, message: "Old and new password are required" });
  }

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ success: false, message: "Password must be at least 6 characters" });
  }

  // req.user was loaded without the password field, so re-read it here.
  const customer = await Customer.findById(req.user._id);
  const matches = await bcrypt.compare(oldPassword, customer.password);

  if (!matches) {
    return res.status(401).json({ success: false, message: "Old password is incorrect" });
  }

  customer.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await customer.save();

  res.json({ success: true, message: "Password changed successfully" });
};
