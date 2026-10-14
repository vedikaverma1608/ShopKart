import { Link } from "react-router-dom";
import CartItem from "../components/CartItem.jsx";
import StateMessage from "../components/StateMessage.jsx";
import { useCart } from "../context/CartContext.jsx";
import { formatPrice } from "../utils/formatPrice.js";

const Cart = () => {
  const { cartItems, loading, error, itemCount, subtotal, refreshCart } = useCart();

  if (loading) return <StateMessage title="Loading your cart..." />;

  if (error) {
    return (
      <StateMessage
        icon="⚠️"
        title="Unable to load your cart."
        actionLabel="Try Again"
        onAction={refreshCart}
      />
    );
  }

  if (cartItems.length === 0) {
    return (
      <StateMessage
        icon="🛒"
        title="Your cart is empty"
        description="Looks like you haven't added anything yet."
        actionLabel="Browse Products"
        actionTo="/products"
      />
    );
  }

  return (
    <main className="page">
      <header className="page__header">
        <h1>My Cart</h1>
      </header>

      <div className="cart-layout">
        <section className="cart-items" aria-label="Cart items">
          {cartItems.map((item) => (
            <CartItem key={item.product._id} item={item} />
          ))}
        </section>

        <aside className="summary">
          <h2>Order Summary</h2>

          <dl className="summary__lines">
            <div>
              <dt>Items</dt>
              <dd>{itemCount}</dd>
            </div>
            <div className="summary__total">
              <dt>Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
          </dl>

          <Link className="button button--primary button--block" to="/checkout">
            Proceed to Checkout
          </Link>

          <Link className="button button--ghost button--block" to="/products">
            Continue Shopping
          </Link>
        </aside>
      </div>
    </main>
  );
};

export default Cart;
