import { Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Products from "./pages/Products.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import Orders from "./pages/Orders.jsx";
import OrderDetails from "./pages/OrderDetails.jsx";

const guarded = (element) => <ProtectedRoute>{element}</ProtectedRoute>;

const App = () => (
  <>
    <Navbar />

    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      <Route path="/home" element={guarded(<Home />)} />
      <Route path="/products" element={guarded(<Products />)} />
      <Route path="/products/:id" element={guarded(<ProductDetails />)} />
      <Route path="/wishlist" element={guarded(<Wishlist />)} />
      <Route path="/cart" element={guarded(<Cart />)} />
      <Route path="/checkout" element={guarded(<Checkout />)} />
      <Route path="/order-success/:id" element={guarded(<OrderSuccess />)} />
      <Route path="/orders" element={guarded(<Orders />)} />
      <Route path="/orders/:id" element={guarded(<OrderDetails />)} />

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  </>
);

export default App;
