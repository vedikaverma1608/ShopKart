import { useEffect, useState } from "react";
import OrderCard from "../components/OrderCard.jsx";
import StateMessage from "../components/StateMessage.jsx";
import api, { errorMessage } from "../services/api.js";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/orders");
      setOrders(data.orders);
    } catch (err) {
      setError(errorMessage(err, "Unable to load your orders."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  if (loading) return <StateMessage title="Loading your orders..." />;

  if (error) {
    return <StateMessage icon="⚠️" title={error} actionLabel="Try Again" onAction={loadOrders} />;
  }

  if (orders.length === 0) {
    return (
      <StateMessage
        icon="📦"
        title="You have not placed any orders yet."
        actionLabel="Start Shopping"
        actionTo="/products"
      />
    );
  }

  return (
    <main className="page">
      <header className="page__header">
        <div>
          <h1>My Orders</h1>
          <p className="page__subtitle">
            {orders.length} {orders.length === 1 ? "order" : "orders"}
          </p>
        </div>
      </header>

      <section className="order-list">
        {orders.map((order) => (
          <OrderCard key={order._id} order={order} />
        ))}
      </section>
    </main>
  );
};

export default Orders;
