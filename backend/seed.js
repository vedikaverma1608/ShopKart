import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

import { connectDB } from "./config/db.js";
import Product from "./models/product.model.js";
import Customer from "./models/customer.model.js";
import Order from "./models/order.model.js";

// Images are placeholder photos — the schema only stores a URL string, so any
// real product image can be swapped in without a code change.
const img = (seed) => `https://picsum.photos/seed/${seed}/600/600`;

const products = [
  {
    name: "Mechanical Keyboard",
    description:
      "Hot-swappable 87-key mechanical keyboard with blue switches, per-key RGB and a detachable USB-C cable.",
    price: 2999,
    category: "Electronics",
    image: img("keyboard"),
    stock: 10,
  },
  {
    name: "Noise Cancelling Headphones",
    description:
      "Wireless over-ear headphones with active noise cancellation and 30 hours of playback on a single charge.",
    price: 4999,
    category: "Electronics",
    image: img("headphones"),
    stock: 12,
  },
  {
    name: "Wireless Mouse",
    description:
      "Silent-click wireless mouse with an adjustable 1600 DPI sensor and a one-year battery life.",
    price: 1499,
    category: "Electronics",
    image: img("mouse"),
    stock: 25,
  },
  {
    name: "27-inch QHD Monitor",
    description:
      "27-inch 1440p IPS display at 75Hz with a height-adjustable stand and built-in speakers.",
    price: 18499,
    category: "Electronics",
    image: img("monitor"),
    stock: 4,
  },
  {
    name: "USB-C Hub",
    description:
      "Seven-in-one USB-C hub with HDMI, two USB-A ports, SD and microSD readers and 100W passthrough charging.",
    price: 2299,
    category: "Electronics",
    image: img("usbhub"),
    stock: 18,
  },
  {
    name: "Bluetooth Speaker",
    description:
      "Portable IPX7 speaker with a passive radiator for deep bass and twelve hours of playtime.",
    price: 3499,
    category: "Electronics",
    image: img("speaker"),
    stock: 0,
  },
  {
    name: "Cotton Oxford Shirt",
    description:
      "Button-down oxford shirt in breathable 100% cotton with a relaxed fit and mother-of-pearl buttons.",
    price: 1899,
    category: "Fashion",
    image: img("shirt"),
    stock: 30,
  },
  {
    name: "Slim Fit Denim Jeans",
    description:
      "Mid-rise stretch denim with a tapered leg, reinforced belt loops and a five-pocket cut.",
    price: 2499,
    category: "Fashion",
    image: img("jeans"),
    stock: 22,
  },
  {
    name: "Leather Sneakers",
    description:
      "Minimal full-grain leather sneakers on a cupsole with a cushioned ortholite footbed.",
    price: 4299,
    category: "Fashion",
    image: img("sneakers"),
    stock: 9,
  },
  {
    name: "Wool Blend Overcoat",
    description:
      "Single-breasted overcoat in a wool-cashmere blend with notch lapels and a half-lined body.",
    price: 7999,
    category: "Fashion",
    image: img("overcoat"),
    stock: 3,
  },
  {
    name: "Canvas Backpack",
    description:
      "Water-resistant waxed canvas backpack with a padded 15-inch laptop sleeve and leather straps.",
    price: 3299,
    category: "Fashion",
    image: img("backpack"),
    stock: 15,
  },
  {
    name: "The Pragmatic Programmer",
    description:
      "Hunt and Thomas on pragmatic software craft — twentieth anniversary edition, hardcover.",
    price: 1299,
    category: "Books",
    image: img("pragmatic"),
    stock: 40,
  },
  {
    name: "Designing Data-Intensive Applications",
    description:
      "Martin Kleppmann's guide to the architecture of reliable, scalable and maintainable data systems.",
    price: 1699,
    category: "Books",
    image: img("ddia"),
    stock: 27,
  },
  {
    name: "Clean Code",
    description:
      "Robert C. Martin on writing code that other people can read, change and trust.",
    price: 999,
    category: "Books",
    image: img("cleancode"),
    stock: 33,
  },
  {
    name: "Eloquent JavaScript",
    description:
      "A modern introduction to JavaScript, programming and the wider web platform. Third edition.",
    price: 899,
    category: "Books",
    image: img("eloquent"),
    stock: 2,
  },
  {
    name: "Ceramic Pour Over Set",
    description:
      "Stoneware pour-over dripper with a matching 600ml carafe and a reusable stainless filter.",
    price: 2199,
    category: "Home",
    image: img("pourover"),
    stock: 14,
  },
  {
    name: "Linen Bedsheet Set",
    description:
      "Stonewashed pure linen set with one flat sheet, one fitted sheet and two pillow covers.",
    price: 5499,
    category: "Home",
    image: img("bedsheet"),
    stock: 8,
  },
  {
    name: "Cast Iron Skillet",
    description:
      "Pre-seasoned 26cm cast iron skillet with a helper handle, oven safe to 260°C.",
    price: 1999,
    category: "Home",
    image: img("skillet"),
    stock: 20,
  },
  {
    name: "Desk Lamp",
    description:
      "Dimmable LED desk lamp with three colour temperatures, a weighted base and a USB charging port.",
    price: 2799,
    category: "Home",
    image: img("desklamp"),
    stock: 11,
  },
  {
    name: "Indoor Plant Pot Set",
    description:
      "Set of three matte terracotta pots in graduated sizes with drainage holes and bamboo trays.",
    price: 1599,
    category: "Home",
    image: img("potset"),
    stock: 17,
  },
];

const DEMO = {
  fullName: "Aarav Sharma",
  email: "aarav@shopkart.com",
  password: "aarav123",
  phone: "9876543210",
};

const run = async () => {
  await connectDB();

  await Promise.all([Product.deleteMany({}), Order.deleteMany({}), Customer.deleteMany({})]);

  const inserted = await Product.insertMany(products);

  await Customer.create({
    ...DEMO,
    password: await bcrypt.hash(DEMO.password, 10),
  });

  console.log(`Seeded ${inserted.length} products`);
  console.log(`Demo login: ${DEMO.email} / ${DEMO.password}`);

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
