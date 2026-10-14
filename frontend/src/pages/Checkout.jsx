import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import CheckoutForm from "../components/CheckoutForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import api, { errorMessage } from "../services/api.js";
import { formatPrice } from "../utils/formatPrice.js";
import { loadRazorpayScript } from "../utils/razorpay.js";

const validate = (values) => {
  const errors = {};
  const required = {
    fullName: "Full name is required",
    addressLine1: "Address is required",
    city: "City is required",
    state: "State is required",
  };

  for (const [field, message] of Object.entries(required)) {
    if (!values[field].trim()) errors[field] = message;
  }

  if (!values.phone.trim()) errors.phone = "Phone is required";
  else if (!/^[6-9]\d{9}$/.test(values.phone.trim()))
    errors.phone = "Enter a valid 10-digit phone number";

  if (!values.pincode.trim()) errors.pincode = "Pincode is required";
  else if (!/^\d{6}$/.test(values.pincode.trim()))
    errors.pincode = "Pincode must contain 6 digits";

  return errors;
};

const Checkout = () => {
  const { customer } = useAuth();
  const { cartItems, subtotal, itemCount, clearCart, refreshCart } = useCart();
  const navigate = useNavigate();

  const [values, setValues] = useState({
    fullName: customer.fullName,
    phone: customer.phone,
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [status, setStatus] = useState("idle");

  // Reaching /checkout directly with nothing to buy has nowhere to go.
  if (cartItems.length === 0 && status === "idle") {
    return <Navigate to="/cart" replace />;
  }

  const handleChange = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    setServerError("");

    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus("creating");

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Unable to load the payment gateway. Check your connection.");
      }

      // The server re-prices the cart and creates both orders. Nothing about the
      // amount is decided here.
      const { data } = await api.post("/orders/create-payment-order", {
        shippingAddress: values,
      });

      setStatus("paying");

      const razorpay = new window.Razorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "ShopKart",
        description: "ShopKart Order",
        order_id: data.razorpayOrderId,
        prefill: { name: values.fullName, contact: values.phone, email: customer.email },

        handler: async (response) => {
          // A handler callback is not proof of payment — the backend decides.
          try {
            await api.post("/orders/verify-payment", {
              shopKartOrderId: data.shopKartOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            clearCart();
            navigate(`/order-success/${data.shopKartOrderId}`, { replace: true });
          } catch (err) {
            setStatus("idle");
            setServerError(errorMessage(err, "We could not verify your payment."));
            refreshCart();
          }
        },

        modal: {
          ondismiss: () => {
            setStatus("idle");
            setServerError("Payment cancelled. Your cart has not been cleared.");
          },
        },
      });

      razorpay.on("payment.failed", async (response) => {
        setStatus("idle");
        setServerError(
          response?.error?.description ||
            "Payment failed. Your cart has not been cleared. Please try again."
        );

        await api
          .patch(`/orders/${data.shopKartOrderId}/payment-failed`)
          .catch(() => undefined);
      });

      razorpay.open();
    } catch (err) {
      setStatus("idle");
      setServerError(err.response ? errorMessage(err) : err.message);
    }
  };

  const busy = status !== "idle";

  return (
    <main className="page">
      <header className="page__header">
        <h1>Checkout</h1>
      </header>

      <form className="checkout-layout" onSubmit={handlePlaceOrder} noValidate>
        <CheckoutForm values={values} errors={errors} onChange={handleChange} />

        <aside className="summary">
          <h2>Order Summary</h2>

          <ul className="summary__items">
            {cartItems.map(({ product, quantity }) => (
              <li key={product._id}>
                <span>
                  {product.name} × {quantity}
                </span>
                <span>{formatPrice(product.price * quantity)}</span>
              </li>
            ))}
          </ul>

          <dl className="summary__lines">
            <div>
              <dt>Items</dt>
              <dd>{itemCount}</dd>
            </div>
            <div className="summary__total">
              <dt>Total</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
          </dl>

          {serverError && (
            <p className="form__error" role="alert">
              {serverError}
            </p>
          )}

          <button className="button button--primary button--block" type="submit" disabled={busy}>
            {status === "creating"
              ? "Preparing payment..."
              : status === "paying"
                ? "Waiting for payment..."
                : "Place Order"}
          </button>

          <p className="summary__note">
            The final amount is calculated on the server from current prices.
          </p>
        </aside>
      </form>
    </main>
  );
};

export default Checkout;
