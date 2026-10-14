import { createContext, useContext, useEffect, useState } from "react";
import api, { errorMessage } from "../services/api.js";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null);
  // Starts true so protected routes wait for the session check instead of
  // bouncing a logged-in user to /login on a refresh.
  const [loading, setLoading] = useState(true);

  const loadCustomer = async () => {
    try {
      const { data } = await api.get("/customers/me");
      setCustomer(data);
    } catch {
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomer();
  }, []);

  // The cookie is HttpOnly, so the session is read back from the server rather
  // than kept in JavaScript where a script could reach it.
  const login = async (email, password) => {
    await api.post("/customers/login", { email, password });
    const { data } = await api.get("/customers/me");
    setCustomer(data);
    return data;
  };

  const register = (payload) => api.post("/customers/register", payload);

  const logout = async () => {
    try {
      await api.post("/customers/logout");
    } finally {
      setCustomer(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ customer, loading, login, register, logout, errorMessage }}
    >
      {children}
    </AuthContext.Provider>
  );
};
