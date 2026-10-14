import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StateMessage from "../components/StateMessage.jsx";
import api, { errorMessage } from "../services/api.js";
import { formatPrice, formatDate } from "../utils/formatPrice.js";

const OrderDetails = () => {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrder = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data.order);
    } catch (err) {
      setError(errorMessage(err, "We couldn't load this order."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  if (loading) return <StateMessage title="Loading order..." />;

  if (error) {
    return <StateMessage icon="⚠️" title={error} actionLabel="Try Again" onAction={loadOrder} />;
  }

  const { shippingAddress: address } = order;

  return (
    <main className="page">
      <Link className="back-link" to="/orders">
        ← Back to orders
      </Link>

      <header className="page__header">
        <div>
          <h1>Order #{order._id.slice(-8)}</h1>
          <p className="page__subtitle">Placed on {formatDate(order.createdAt)}</p>
        </div>

        <span className={`status status--${order.status.toLowerCase()}`}>{order.status}</span>
      </header>

      <div className="order-detail">
        <section className="panel">
          <h2>Items</h2>

          <ul className="order-detail__items">
            {order.items.map((item) => (
              <li key={item._id ?? item.product}>
                {item.image && <img src={item.image} alt={item.name} />}

                <div>
                  {/* Name and price are the values snapshotted at purchase time. */}
                  <p className="order-detail__item-name">{item.name}</p>
                  <p className="card__meta">
                    {formatPrice(item.price)} × {item.quantity}
                  </p>
                </div>

                <span className="order-detail__line-total">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="panel">
          <h2>Delivery</h2>

          <address className="order-detail__address">
            {address.fullName}
            <br />
            {address.addressLine1}
            <br />
            {address.city}, {address.state} {address.pincode}
            <br />
            {address.phone}
          </address>

          <dl className="summary__lines">
            <div>
              <dt>Payment</dt>
              <dd>{order.paymentStatus}</dd>
            </div>
            <div className="summary__total">
              <dt>Total</dt>
              <dd>{formatPrice(order.totalAmount)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  );
};

export default OrderDetails;
