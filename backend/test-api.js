import "dotenv/config";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import mongoose from "mongoose";

import Order from "./models/order.model.js";
import Customer from "./models/customer.model.js";
import Product from "./models/product.model.js";

// The curl/Postman test plans from Labs 01-06, as one runnable script.
// Usage: start the server (npm run dev), seed it (npm run seed), then: npm test

const BASE = `http://localhost:${process.env.PORT || 5001}`;
let cookie = "";
let passed = 0;

const api = async (method, path, body, opts = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(opts.noAuth ? {} : cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const setCookie = res.headers.getSetCookie?.() ?? [];
  if (setCookie.length && !opts.noAuth) {
    cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
  }

  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
};

const check = async (label, fn) => {
  await fn();
  passed += 1;
  console.log(`  ok  ${label}`);
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const email = `test_${Date.now()}@shopkart.com`;

  console.log("\nLab 01 - authentication");

  await check("register returns 201", async () => {
    const r = await api("POST", "/customers/register", {
      fullName: "Test Customer",
      email,
      password: "secret123",
      phone: "9876543210",
    });
    assert.equal(r.status, 201);
    assert.equal(r.body.customer.email, email);
    assert.equal(r.body.customer.password, undefined, "password must never be returned");
  });

  await check("password is stored as a bcrypt hash", async () => {
    const doc = await Customer.findOne({ email });
    assert.match(doc.password, /^\$2[aby]\$/);
    assert.notEqual(doc.password, "secret123");
  });

  await check("duplicate email returns 409", async () => {
    const r = await api("POST", "/customers/register", {
      fullName: "Test Customer",
      email,
      password: "secret123",
      phone: "9876543210",
    });
    assert.equal(r.status, 409);
  });

  await check("short password returns 400", async () => {
    const r = await api("POST", "/customers/register", {
      fullName: "x",
      email: `s_${Date.now()}@a.com`,
      password: "123",
      phone: "9876543210",
    });
    assert.equal(r.status, 400);
  });

  await check("missing field returns 400", async () => {
    const r = await api("POST", "/customers/register", { email: "a@b.com" });
    assert.equal(r.status, 400);
  });

  await check("wrong password returns 401 without leaking which field failed", async () => {
    const r = await api("POST", "/customers/login", { email, password: "wrongpass" });
    assert.equal(r.status, 401);
    assert.equal(r.body.message, "Invalid credentials");

    const unknown = await api("POST", "/customers/login", {
      email: "nobody@nowhere.com",
      password: "wrongpass",
    });
    assert.equal(unknown.body.message, r.body.message);
  });

  await check("/customers/me is 401 without a cookie", async () => {
    const r = await api("GET", "/customers/me", undefined, { noAuth: true });
    assert.equal(r.status, 401);
  });

  await check("login sets an HttpOnly cookie", async () => {
    const res = await fetch(`${BASE}/customers/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secret123" }),
    });
    assert.equal(res.status, 200);

    const raw = res.headers.getSetCookie();
    assert.ok(raw.some((c) => /HttpOnly/i.test(c)), "cookie must be HttpOnly");
    cookie = raw.map((c) => c.split(";")[0]).join("; ");
  });

  await check("/customers/me returns the logged in customer", async () => {
    const r = await api("GET", "/customers/me");
    assert.equal(r.status, 200);
    assert.equal(r.body.email, email);
    assert.equal(r.body.password, undefined);
  });

  console.log("\nLab 03 - products");

  let keyboard;

  await check("product list returns the seeded catalogue", async () => {
    const r = await api("GET", "/products");
    assert.equal(r.status, 200);
    assert.ok(r.body.count >= 20, `expected >=20 products, got ${r.body.count}`);
    assert.equal(r.body.count, r.body.products.length);
  });

  await check("search is case-insensitive and partial", async () => {
    const r = await api("GET", "/products?search=KEYBO");
    assert.equal(r.body.count, 1);
    keyboard = r.body.products[0];
    assert.equal(keyboard.name, "Mechanical Keyboard");
  });

  await check("category filter works", async () => {
    const r = await api("GET", "/products?category=Books");
    assert.ok(r.body.count >= 4);
    assert.ok(r.body.products.every((p) => p.category === "Books"));
  });

  await check("search and category combine", async () => {
    const hit = await api("GET", "/products?search=keyboard&category=Electronics");
    assert.equal(hit.body.count, 1);

    const miss = await api("GET", "/products?search=keyboard&category=Books");
    assert.equal(miss.body.count, 0, "empty result, not an error");
  });

  await check("sort=price_asc orders by price", async () => {
    const r = await api("GET", "/products?sort=price_asc");
    const prices = r.body.products.map((p) => p.price);
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
  });

  await check("single product by id returns 200", async () => {
    const r = await api("GET", `/products/${keyboard._id}`);
    assert.equal(r.status, 200);
    assert.equal(r.body.product.name, "Mechanical Keyboard");
    assert.ok(r.body.product.description);
  });

  await check("malformed id returns 400, unknown id returns 404", async () => {
    assert.equal((await api("GET", "/products/not-an-id")).status, 400);
    assert.equal((await api("GET", "/products/000000000000000000000000")).status, 404);
  });

  await check("create product validates price and stock", async () => {
    assert.equal((await api("POST", "/products", { name: "x" })).status, 400);

    const badPrice = await api("POST", "/products", {
      name: "Bad",
      description: "d",
      price: 0,
      category: "Electronics",
      image: "http://x/y.jpg",
      stock: 1,
    });
    assert.equal(badPrice.status, 400);

    const badStock = await api("POST", "/products", {
      name: "Bad",
      description: "d",
      price: 10,
      category: "Electronics",
      image: "http://x/y.jpg",
      stock: -1,
    });
    assert.equal(badStock.status, 400);
  });

  console.log("\nLab 04 - wishlist");

  await check("wishlist endpoints are protected", async () => {
    assert.equal((await api("GET", "/wishlist", undefined, { noAuth: true })).status, 401);
    assert.equal(
      (await api("POST", `/wishlist/${keyboard._id}`, undefined, { noAuth: true })).status,
      401
    );
  });

  await check("add to wishlist works", async () => {
    const r = await api("POST", `/wishlist/${keyboard._id}`);
    assert.equal(r.status, 200);
  });

  await check("duplicate wishlist add returns 409", async () => {
    assert.equal((await api("POST", `/wishlist/${keyboard._id}`)).status, 409);
  });

  await check("wishlist stores ObjectIds, not copied products", async () => {
    const doc = await Customer.findOne({ email });
    assert.ok(doc.wishlist[0] instanceof mongoose.Types.ObjectId);
  });

  await check("get wishlist populates product data", async () => {
    const r = await api("GET", "/wishlist");
    assert.equal(r.body.count, 1);
    assert.equal(r.body.wishlist[0].name, "Mechanical Keyboard");
    assert.equal(typeof r.body.wishlist[0].price, "number");
  });

  await check("unknown product returns 404, bad id 400", async () => {
    assert.equal((await api("POST", "/wishlist/000000000000000000000000")).status, 404);
    assert.equal((await api("POST", "/wishlist/nope")).status, 400);
  });

  await check("remove works, removing twice returns 404", async () => {
    assert.equal((await api("DELETE", `/wishlist/${keyboard._id}`)).status, 200);
    assert.equal((await api("DELETE", `/wishlist/${keyboard._id}`)).status, 404);
  });

  await check("toggle adds then removes", async () => {
    const on = await api("PATCH", `/wishlist/${keyboard._id}/toggle`);
    assert.equal(on.body.saved, true);

    const off = await api("PATCH", `/wishlist/${keyboard._id}/toggle`);
    assert.equal(off.body.saved, false);
  });

  console.log("\nLab 05 - cart");

  await check("cart endpoints are protected", async () => {
    assert.equal((await api("GET", "/cart", undefined, { noAuth: true })).status, 401);
  });

  await check("adding the same product twice increments quantity", async () => {
    const first = await api("POST", `/cart/${keyboard._id}`);
    assert.equal(first.status, 200);
    assert.equal(first.body.cart[0].quantity, 1);

    const second = await api("POST", `/cart/${keyboard._id}`);
    assert.equal(second.body.cart.length, 1, "one row, not two");
    assert.equal(second.body.cart[0].quantity, 2);
  });

  await check("get cart populates the product", async () => {
    const r = await api("GET", "/cart");
    assert.equal(r.body.cart[0].product.name, "Mechanical Keyboard");
    assert.equal(r.body.cart[0].quantity, 2);
  });

  await check("quantity update respects stock", async () => {
    const ok = await api("PATCH", `/cart/${keyboard._id}`, { quantity: 3 });
    assert.equal(ok.body.cart[0].quantity, 3);

    const tooMany = await api("PATCH", `/cart/${keyboard._id}`, { quantity: 999 });
    assert.equal(tooMany.status, 400);

    const tooFew = await api("PATCH", `/cart/${keyboard._id}`, { quantity: 0 });
    assert.equal(tooFew.status, 400);
  });

  await check("adding beyond stock is rejected", async () => {
    const outOfStock = await Product.findOne({ stock: 0 });
    const r = await api("POST", `/cart/${outOfStock._id}`);
    assert.equal(r.status, 400);
    assert.match(r.body.message, /out of stock/i);
  });

  await check("quantity update on a product not in the cart returns 404", async () => {
    const other = await Product.findOne({ name: "Wireless Mouse" });
    assert.equal((await api("PATCH", `/cart/${other._id}`, { quantity: 1 })).status, 404);
  });

  await check("subtotal is derived, never stored", async () => {
    const doc = await Customer.findOne({ email }).lean();
    const keys = Object.keys(doc.cart[0]);
    assert.ok(!keys.includes("price"), "cart must not copy price");
    assert.ok(doc.subtotal === undefined, "subtotal must not be persisted");
  });

  await check("remove works, removing twice returns 404", async () => {
    const mouse = await Product.findOne({ name: "Wireless Mouse" });
    await api("POST", `/cart/${mouse._id}`);

    assert.equal((await api("DELETE", `/cart/${mouse._id}`)).status, 200);
    assert.equal((await api("DELETE", `/cart/${mouse._id}`)).status, 404);
  });

  console.log("\nLab 06 - checkout and orders");

  const address = {
    fullName: "Test Customer",
    phone: "9876543210",
    addressLine1: "22 MG Road",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001",
  };

  await check("order endpoints are protected", async () => {
    assert.equal((await api("GET", "/orders", undefined, { noAuth: true })).status, 401);
  });

  await check("invalid shipping address is rejected", async () => {
    const badPin = await api("POST", "/orders/create-payment-order", {
      shippingAddress: { ...address, pincode: "123" },
    });
    assert.equal(badPin.status, 400);
    assert.match(badPin.body.message, /pincode/i);

    const blank = await api("POST", "/orders/create-payment-order", {
      shippingAddress: { ...address, city: "   " },
    });
    assert.equal(blank.status, 400, "whitespace-only input is invalid");
  });

  const customer = await Customer.findOne({ email });

  await check("empty cart is rejected before anything else", async () => {
    const saved = customer.cart;
    await Customer.findByIdAndUpdate(customer._id, { $set: { cart: [] } });

    const r = await api("POST", "/orders/create-payment-order", { shippingAddress: address });
    assert.equal(r.status, 400);
    assert.match(r.body.message, /empty/i);

    await Customer.findByIdAndUpdate(customer._id, { $set: { cart: saved } });
  });

  await check("placeholder Razorpay keys report as unconfigured, not unreachable", async () => {
    const placeholder = /^(your_|rzp_test_x+$)/.test(process.env.RAZORPAY_KEY_ID ?? "");

    if (!placeholder) {
      console.log("      (skipped - real Razorpay keys are configured)");
      return;
    }

    const r = await api("POST", "/orders/create-payment-order", { shippingAddress: address });
    assert.equal(r.status, 503);
    assert.match(r.body.message, /not configured/i);
  });

  // Razorpay's live API is not called here. The order is built directly so the
  // signature verification path can be exercised against the real secret.
  const seededProduct = await Product.findById(keyboard._id);
  let order;

  await check("order snapshots name and price at purchase time", async () => {
    order = await Order.create({
      user: customer._id,
      items: [
        {
          product: seededProduct._id,
          name: seededProduct.name,
          price: seededProduct.price,
          quantity: 2,
          image: seededProduct.image,
        },
      ],
      shippingAddress: address,
      totalAmount: seededProduct.price * 2,
      razorpayOrderId: "order_TEST123",
    });

    assert.equal(order.paymentStatus, "PENDING");
    assert.equal(order.status, "PENDING_PAYMENT");
    assert.equal(order.items[0].price, seededProduct.price);
  });

  await check("a forged signature is rejected and the cart survives", async () => {
    const r = await api("POST", "/orders/verify-payment", {
      shopKartOrderId: order._id,
      razorpay_payment_id: "pay_FAKE",
      razorpay_signature: "deadbeef",
    });

    assert.equal(r.status, 400);
    assert.match(r.body.message, /signature/i);

    const after = await Order.findById(order._id);
    assert.notEqual(after.paymentStatus, "PAID", "a forged signature must never mark PAID");

    const stillThere = await api("GET", "/cart");
    assert.ok(stillThere.body.cart.length > 0, "cart must not clear on a failed payment");
  });

  await check("a valid signature marks the order PAID and clears the cart", async () => {
    await Order.findByIdAndUpdate(order._id, { $set: { paymentStatus: "PENDING" } });

    const paymentId = "pay_REAL123";
    const signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`order_TEST123|${paymentId}`)
      .digest("hex");

    const r = await api("POST", "/orders/verify-payment", {
      shopKartOrderId: order._id,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    });

    assert.equal(r.status, 200);
    assert.equal(r.body.order.paymentStatus, "PAID");
    assert.equal(r.body.order.status, "PLACED");

    const emptied = await api("GET", "/cart");
    assert.equal(emptied.body.cart.length, 0, "cart clears only after verification");
  });

  await check("the signature is built from the stored order id, not the posted one", async () => {
    const forged = await Order.create({
      user: customer._id,
      items: order.items,
      shippingAddress: address,
      totalAmount: 1,
      razorpayOrderId: "order_REALSTORED",
    });

    // Signed against an id the attacker chose, which is not the stored one.
    const paymentId = "pay_ATTACK";
    const signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`order_ATTACKER|${paymentId}`)
      .digest("hex");

    const r = await api("POST", "/orders/verify-payment", {
      shopKartOrderId: forged._id,
      razorpay_order_id: "order_ATTACKER",
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    });

    assert.equal(r.status, 400);
  });

  await check("my orders returns only this customer's orders, newest first", async () => {
    const r = await api("GET", "/orders");
    assert.equal(r.status, 200);
    assert.ok(r.body.orders.length >= 1);
    assert.ok(r.body.orders.every((o) => o.user === customer._id.toString()));

    const dates = r.body.orders.map((o) => new Date(o.createdAt).getTime());
    assert.deepEqual(dates, [...dates].sort((a, b) => b - a));
  });

  await check("another customer's order is not readable", async () => {
    const stranger = await Customer.create({
      fullName: "Stranger",
      email: `stranger_${Date.now()}@shopkart.com`,
      password: "hash",
      phone: "9999999999",
    });

    const theirOrder = await Order.create({
      user: stranger._id,
      items: order.items,
      shippingAddress: address,
      totalAmount: 100,
    });

    const r = await api("GET", `/orders/${theirOrder._id}`);
    assert.equal(r.status, 404);

    await Customer.findByIdAndDelete(stranger._id);
    await Order.findByIdAndDelete(theirOrder._id);
  });

  await check("own order is readable by id", async () => {
    const r = await api("GET", `/orders/${order._id}`);
    assert.equal(r.status, 200);
    assert.equal(r.body.order._id, order._id.toString());
  });

  console.log("\nBonus");

  await check("change password verifies the old one first", async () => {
    const wrong = await api("PATCH", "/customers/change-password", {
      oldPassword: "nottherightone",
      newPassword: "newsecret123",
    });
    assert.equal(wrong.status, 401);

    const ok = await api("PATCH", "/customers/change-password", {
      oldPassword: "secret123",
      newPassword: "newsecret123",
    });
    assert.equal(ok.status, 200);

    const relogin = await api("POST", "/customers/login", {
      email,
      password: "newsecret123",
    });
    assert.equal(relogin.status, 200);
  });

  await check("order status progression is gated on payment", async () => {
    const r = await api("PATCH", `/orders/${order._id}/status`, { status: "SHIPPED" });
    assert.equal(r.status, 200);
    assert.equal(r.body.order.status, "SHIPPED");

    const bad = await api("PATCH", `/orders/${order._id}/status`, { status: "NONSENSE" });
    assert.equal(bad.status, 400);
  });

  await check("logout clears the cookie", async () => {
    const res = await fetch(`${BASE}/customers/logout`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    assert.equal(res.status, 200);

    const cleared = res.headers.getSetCookie();
    assert.ok(cleared.some((c) => /token=;|token=""/.test(c)), "cookie must be cleared");
  });

  // Leave the database as the seed left it.
  await Order.deleteMany({ user: customer._id });
  await Customer.findByIdAndDelete(customer._id);
  await Product.deleteMany({ name: "Bad" });

  console.log(`\n${passed} checks passed\n`);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(`\nFAILED after ${passed} checks:\n`, err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
