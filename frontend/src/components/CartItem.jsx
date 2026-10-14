import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { errorMessage } from "../services/api.js";
import { formatPrice } from "../utils/formatPrice.js";

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const { product, quantity } = item;

  // Per-row busy state, so updating one line does not freeze the whole cart.
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const run = async (action) => {
    setBusy(true);
    setMessage("");

    try {
      await action();
    } catch (err) {
      setMessage(errorMessage(err, "Unable to update the cart."));
    } finally {
      setBusy(false);
    }
  };

  const atStockLimit = quantity >= product.stock;

  return (
    <article className="cart-item">
      <img className="cart-item__image" src={product.image} alt={product.name} />

      <div className="cart-item__details">
        <Link className="cart-item__name" to={`/products/${product._id}`}>
          {product.name}
        </Link>

        <p className="cart-item__price">{formatPrice(product.price)}</p>

        {message && (
          <p className="card__error" role="alert">
            {message}
          </p>
        )}
      </div>

      <div className="cart-item__quantity">
        <button
          className="quantity-button"
          type="button"
          onClick={() => run(() => updateQuantity(product._id, quantity - 1))}
          disabled={busy || quantity <= 1}
          aria-label={`Decrease quantity of ${product.name}`}
        >
          −
        </button>

        <span className="quantity-value" aria-live="polite">
          {quantity}
        </span>

        <button
          className="quantity-button"
          type="button"
          onClick={() => run(() => updateQuantity(product._id, quantity + 1))}
          disabled={busy || atStockLimit}
          aria-label={`Increase quantity of ${product.name}`}
        >
          +
        </button>
      </div>

      <div className="cart-item__total">
        <p className="cart-item__line-total">{formatPrice(product.price * quantity)}</p>

        <button
          className="button button--danger button--small"
          type="button"
          onClick={() => run(() => removeFromCart(product._id))}
          disabled={busy}
        >
          Remove
        </button>
      </div>
    </article>
  );
};

export default CartItem;
