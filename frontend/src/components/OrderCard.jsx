import { Link } from "react-router-dom";
import { formatPrice, formatDate } from "../utils/formatPrice.js";

const OrderCard = ({ order }) => (
  <article className="order-card">
    <header className="order-card__header">
      <div>
        <h3 className="order-card__id">Order #{order._id.slice(-8)}</h3>
        <p className="order-card__date">{formatDate(order.createdAt)}</p>
      </div>

      <span className={`status status--${order.status.toLowerCase()}`}>{order.status}</span>
    </header>

    <ul className="order-card__items">
      {order.items.map((item) => (
        <li key={item._id ?? item.product}>
          {item.name} × {item.quantity}
        </li>
      ))}
    </ul>

    <footer className="order-card__footer">
      <p className="order-card__total">Total: {formatPrice(order.totalAmount)}</p>

      <Link className="button button--ghost button--small" to={`/orders/${order._id}`}>
        View Details
      </Link>
    </footer>
  </article>
);

export default OrderCard;
