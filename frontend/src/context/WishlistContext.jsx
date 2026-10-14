import { createContext, useContext, useEffect, useState } from "react";
import api, { errorMessage } from "../services/api.js";
import { useAuth } from "./AuthContext.jsx";

const WishlistContext = createContext(null);

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const { customer } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshWishlist = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/wishlist");
      setItems(data.wishlist);
    } catch (err) {
      setError(errorMessage(err, "We couldn't load your wishlist."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customer) {
      refreshWishlist();
    } else {
      setItems([]);
      setError("");
    }
  }, [customer]);

  const isSaved = (productId) => items.some((item) => item._id === productId);

  // One toggle endpoint keeps the heart button to a single request whichever
  // direction it is going.
  const toggle = async (productId) => {
    const { data } = await api.patch(`/wishlist/${productId}/toggle`);
    await refreshWishlist();
    return data.saved;
  };

  const remove = async (productId) => {
    await api.delete(`/wishlist/${productId}`);
    setItems((current) => current.filter((item) => item._id !== productId));
  };

  return (
    <WishlistContext.Provider
      value={{ items, loading, error, count: items.length, isSaved, toggle, remove, refreshWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
