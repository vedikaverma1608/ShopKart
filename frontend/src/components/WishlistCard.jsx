import { useState } from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext.jsx";
import { errorMessage } from "../services/api.js";
import { formatPrice } from "../utils/formatPrice.js";

const WishlistCard = ({ product }) => {
  const { remove } = useWishlist();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const handleRemove = async () => {
    setBusy(true);
    setMessage("");

    try {
      await remove(product._id);
    } catch (err) {
      setMessage(errorMessage(err, "Unable to remove product."));
      setBusy(false);
    }
  };

  return (
    <article className="card">
      <div className="card__media">
        <img src={product.image} alt={product.name} loading="lazy" />
      </div>

      <div className="card__body">
        <h3 className="card__title">{product.name}</h3>
        <p className="card__meta">{product.category}</p>
        <p className="card__price">{formatPrice(product.price)}</p>

        <p className={`card__stock ${product.stock === 0 ? "is-out" : ""}`}>
          {product.stock === 0 ? "Out of stock" : `${product.stock} units left`}
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
            className="button button--danger"
            type="button"
            onClick={handleRemove}
            disabled={busy}
          >
            {busy ? "Removing..." : "Remove ♥"}
          </button>
        </div>
      </div>
    </article>
  );
};

export default WishlistCard;
