import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StateMessage from "../components/StateMessage.jsx";
import api, { errorMessage } from "../services/api.js";
import { formatPrice } from "../utils/formatPrice.js";

const OrderSuccess = () => {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch((err) => setError(errorMessage(err, "We couldn't load your order.")));
  }, [id]);

  if (error) return <StateMessage icon="⚠️" title={error} actionLabel="My Orders" actionTo="/orders" />;
  if (!order) return <StateMessage title="Loading your order..." />;

  return (
    <main className="page">
      <section className="success">
        <span className="success__icon" aria-hidden="true">
          ✅
        </span>

        <h1>Order Placed Successfully</h1>

        <dl className="detail-list detail-list--centered">
          <div>
            <dt>Order ID</dt>
            <dd>{order._id}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{formatPrice(order.totalAmount)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{order.status}</dd>
          </div>
        </dl>

        <p className="success__note">Your order has been saved successfully.</p>

        <div className="success__actions">
          <Link className="button button--primary" to="/orders">
            View My Orders
          </Link>
          <Link className="button button--ghost" to="/products">
            Continue Shopping
          </Link>
        </div>
      </section>
    </main>
  );
};

export default OrderSuccess;
