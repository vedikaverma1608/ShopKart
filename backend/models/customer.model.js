import mongoose from "mongoose";

// Labs 01-02 call this collection "Customer"; Labs 04-06 call the same document
// "User". It is one model — Customer — carrying the wishlist and cart.
const customerSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, required: true, trim: true },

  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

  cart: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      quantity: { type: Number, default: 1, min: 1 },
    },
  ],

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Customer", customerSchema);
