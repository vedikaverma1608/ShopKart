import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: [0.01, "Price must be greater than 0"] },
  category: { type: String, required: true, trim: true },
  image: { type: String, required: true },
  stock: { type: Number, required: true, min: [0, "Stock cannot be negative"] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Product", productSchema);
