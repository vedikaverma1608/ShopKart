import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import { errorMessage } from "../services/api.js";
import { formatPrice } from "../utils/formatPrice.js";

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { isSaved, toggle } = useWishlist();

  const [cartBusy, setCartBusy] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [message, setMessage] = useState("");

  const saved = isSaved(product._id);
  const outOfStock = product.stock === 0;

  const handleAddToCart = async () => {
    setCartBusy(true);
    setMessage("");

    try {
      await addToCart(product._id);
    } catch (err) {
      setMessage(errorMessage(err, "Unable to add to cart."));
    } finally {
      setCartBusy(false);
    }
  };

  const handleToggleWishlist = async () => {
    setWishBusy(true);
    setMessage("");

    try {
      await toggle(product._id);
    } catch (err) {
      setMessage(errorMessage(err, "Unable to save product."));
    } finally {
      setWishBusy(false);
    }
  };

  return (
    <article className="card">
      <div className="card__media">
        <img src={product.image} alt={product.name} loading="lazy" />

        <button
          className={`card__heart ${saved ? "is-saved" : ""}`}
          type="button"
          onClick={handleToggleWishlist}
          disabled={wishBusy}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          {saved ? "♥" : "♡"}
        </button>
      </div>

      <div className="card__body">
        <h3 className="card__title">{product.name}</h3>
        <p className="card__meta">{product.category}</p>
        <p className="card__price">{formatPrice(product.price)}</p>

        <p className={`card__stock ${outOfStock ? "is-out" : ""}`}>
          {outOfStock ? "Out of stock" : `${product.stock} units left`}
        </p>

        {message && (
          <p className="card__error" role="alert">
            {message}
          </p>
        )}

        <div className="card__actions">
          <Link className="button button--ghost" to={`/products/${product._id}`}>
            View Details
          </Link>

          <button
            className="button button--primary"
            type="button"
            onClick={handleAddToCart}
            disabled={cartBusy || outOfStock}
          >
            {cartBusy ? "Adding..." : "Add to Cart"}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
