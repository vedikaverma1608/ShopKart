import jwt from "jsonwebtoken";
import Customer from "../models/customer.model.js";

export const protect = async (req, res, next) => {
  // Primary transport is the HttpOnly cookie. The Bearer header is accepted too
  // so the APIs can be exercised from Postman without a cookie jar.
  const header = req.headers.authorization;
  const token = req.cookies?.token || (header?.startsWith("Bearer ") ? header.slice(7) : null);

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const customer = await Customer.findById(payload.id).select("-password");

    if (!customer) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    req.user = customer;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }
};
