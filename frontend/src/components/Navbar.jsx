import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";

const Navbar = () => {
  const { customer, logout } = useAuth();
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link className="navbar__brand" to={customer ? "/home" : "/login"}>
          Shop<span>Kart</span>
        </Link>

        {customer && (
          <nav className="navbar__links" aria-label="Main">
            <NavLink to="/home">Home</NavLink>
            <NavLink to="/products">Products</NavLink>

            <NavLink to="/wishlist">
              Wishlist
              {wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
            </NavLink>

            <NavLink to="/cart">
              Cart
              {itemCount > 0 && <span className="badge">{itemCount}</span>}
            </NavLink>

            <NavLink to="/orders">Orders</NavLink>

            <button className="button button--ghost" type="button" onClick={handleLogout}>
              Logout
            </button>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
