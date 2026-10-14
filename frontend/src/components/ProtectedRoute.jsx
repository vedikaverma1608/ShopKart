import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import StateMessage from "./StateMessage.jsx";

const ProtectedRoute = ({ children }) => {
  const { customer, loading } = useAuth();
  const location = useLocation();

  // Wait for /customers/me to answer. Redirecting while it is still in flight
  // would log the user out every time they refresh.
  if (loading) {
    return <StateMessage title="Checking your session..." />;
  }

  if (!customer) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute;
