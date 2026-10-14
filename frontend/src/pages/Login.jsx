import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { errorMessage } from "../services/api.js";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const justRegistered = location.state?.registered;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate(location.state?.from || "/home", { replace: true });
    } catch (err) {
      setError(errorMessage(err, "Invalid Credentials"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth">
      <div className="auth__card">
        <h1>Welcome back</h1>
        <p className="auth__subtitle">Log in to continue shopping.</p>

        {justRegistered && (
          <p className="form__success" role="status">
            Account created. Please log in.
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error && (
            <p className="form__error" role="alert">
              {error}
            </p>
          )}

          <button className="button button--primary button--block" type="submit" disabled={submitting}>
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="auth__switch">
          New to ShopKart? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </main>
  );
};

export default Login;
