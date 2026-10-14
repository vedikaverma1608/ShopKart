import jwt from "jsonwebtoken";

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export const generateToken = (customerId) =>
  jwt.sign({ id: customerId }, process.env.JWT_SECRET, { expiresIn: "7d" });

// HttpOnly means JavaScript on the page cannot read the token, which is what
// protects it from XSS. sameSite "lax" is enough here: :5173 and :5000 are
// different origins but the same site, so the cookie still travels.
export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: SEVEN_DAYS,
};
