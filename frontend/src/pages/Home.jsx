import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import { formatPrice } from "../utils/formatPrice.js";

const Home = () => {
  const { customer } = useAuth();
  const { itemCount, subtotal } = useCart();
  const { count: wishlistCount } = useWishlist();

  return (
    <main className="page">
      <section className="hero">
        <h1>Welcome back, {customer.fullName.split(" ")[0]}</h1>
        <p>Here is where your ShopKart account stands today.</p>

        <Link className="button button--primary" to="/products">
          Browse Products
        </Link>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>Your details</h2>

          <dl className="detail-list">
            <div>
              <dt>Name</dt>
              <dd>{customer.fullName}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{customer.email}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{customer.phone}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <h2>Your activity</h2>

          <dl className="detail-list">
            <div>
              <dt>Items in cart</dt>
              <dd>{itemCount}</dd>
            </div>
            <div>
              <dt>Cart subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div>
              <dt>Saved to wishlist</dt>
              <dd>{wishlistCount}</dd>
            </div>
          </dl>

          <div className="panel__actions">
            <Link className="button button--ghost button--small" to="/cart">
              Open cart
            </Link>
            <Link className="button button--ghost button--small" to="/orders">
              My orders
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
};

export default Home;
