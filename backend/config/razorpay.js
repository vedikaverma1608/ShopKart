import Razorpay from "razorpay";

// Lab-06: the key secret lives only here, on the server. It is never sent to React.
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default razorpay;
