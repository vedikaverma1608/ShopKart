import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { errorMessage } from "../services/api.js";
import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext(null);

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { customer } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshCart = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/cart");
      setCartItems(data.cart);
    } catch (err) {
      setError(errorMessage(err, "Unable to load your cart."));
    } finally {
      setLoading(false);
    }
  };

  // The cart belongs to a session, so it loads on login and empties on logout.
  useEffect(() => {
    if (customer) {
      refreshCart();
    } else {
      setCartItems([]);
      setError("");
    }
  }, [customer]);

  // Every mutation endpoint returns the whole cart, so one assignment keeps the
  // navbar count and the cart page from ever disagreeing.
  const applyResponse = (data) => {
    setCartItems(data.cart);
    return data;
  };

  const addToCart = async (productId) =>
    applyResponse((await api.post(`/cart/${productId}`)).data);

  const updateQuantity = async (productId, quantity) =>
    applyResponse((await api.patch(`/cart/${productId}`, { quantity })).data);

  const removeFromCart = async (productId) =>
    applyResponse((await api.delete(`/cart/${productId}`)).data);

  const clearCart = () => setCartItems([]);

  // Derived, never stored: recomputing is always correct, a stored copy can rot.
  const { itemCount, subtotal } = useMemo(
    () => ({
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      ),
    }),
    [cartItems]
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        error,
        itemCount,
        subtotal,
        refreshCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
