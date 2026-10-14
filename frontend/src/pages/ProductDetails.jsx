import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StateMessage from "../components/StateMessage.jsx";
import api, { errorMessage } from "../services/api.js";
import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import { formatPrice } from "../utils/formatPrice.js";

const ProductDetails = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { isSaved, toggle } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cartBusy, setCartBusy] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const loadProduct = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get(`/products/${id}`);
      setProduct(data.product);
    } catch (err) {
      setError(errorMessage(err, "We couldn't load this product."));
    } finally {
      setLoading(false);
    }
  };

  // Re-fetches when the route parameter changes, so navigating between two
  // product pages does not leave the previous product on screen.
  useEffect(() => {
    loadProduct();
  }, [id]);

  if (loading) return <StateMessage title="Loading product..." />;

  if (error) {
    return (
      <StateMessage icon="⚠️" title={error} actionLabel="Try Again" onAction={loadProduct} />
    );
  }

  const saved = isSaved(product._id);
  const outOfStock = product.stock === 0;

  const handleAddToCart = async () => {
    setCartBusy(true);
    setActionMessage("");

    try {
      await addToCart(product._id);
      setActionMessage("Added to your cart.");
    } catch (err) {
      setActionMessage(errorMessage(err, "Unable to add to cart."));
    } finally {
      setCartBusy(false);
    }
  };

  const handleToggleWishlist = async () => {
    setWishBusy(true);
    setActionMessage("");

    try {
      const nowSaved = await toggle(product._id);
      setActionMessage(nowSaved ? "Saved to your wishlist." : "Removed from your wishlist.");
    } catch (err) {
      setActionMessage(errorMessage(err, "Unable to update your wishlist."));
    } finally {
      setWishBusy(false);
    }
  };

  return (
    <main className="page">
      <Link className="back-link" to="/products">
        ← Back to products
      </Link>

      <article className="product-detail">
        <img className="product-detail__image" src={product.image} alt={product.name} />

        <div className="product-detail__body">
          <p className="card__meta">{product.category}</p>
          <h1>{product.name}</h1>

          <p className="product-detail__price">{formatPrice(product.price)}</p>

          <p className={`card__stock ${outOfStock ? "is-out" : ""}`}>
            {outOfStock ? "Out of stock" : `${product.stock} units left`}
          </p>

          <p className="product-detail__description">{product.description}</p>

          {actionMessage && (
            <p className="form__success" role="status">
              {actionMessage}
            </p>
          )}

          <div className="product-detail__actions">
            <button
              className="button button--primary"
              type="button"
              onClick={handleAddToCart}
              disabled={cartBusy || outOfStock}
            >
              {cartBusy ? "Adding..." : "Add to Cart"}
            </button>

            <button
              className="button button--ghost"
              type="button"
              onClick={handleToggleWishlist}
              disabled={wishBusy}
              aria-pressed={saved}
            >
              {wishBusy ? "Saving..." : saved ? "♥ Remove from Wishlist" : "♡ Add to Wishlist"}
            </button>
          </div>
        </div>
      </article>
    </main>
  );
};

export default ProductDetails;
