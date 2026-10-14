import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { errorMessage } from "../services/api.js";

const EMPTY = { fullName: "", email: "", password: "", phone: "" };

const validate = ({ fullName, email, password, phone }) => {
  const errors = {};

  if (!fullName.trim()) errors.fullName = "Full name is required";
  if (!email.trim()) errors.email = "Email is required";
  else if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = "Enter a valid email address";

  if (!password) errors.password = "Password is required";
  else if (password.length < 6) errors.password = "Password must be at least 6 characters";

  if (!phone.trim()) errors.phone = "Phone number is required";
  else if (!/^[6-9]\d{9}$/.test(phone.trim())) errors.phone = "Enter a valid 10-digit number";

  return errors;
};

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => {
    setForm({ ...form, [field]: event.target.value });
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");

    const found = validate(form);
    setErrors(found);

    // The backend is not called while the form is obviously invalid.
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);

    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
      });

      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setServerError(errorMessage(err, "Registration failed. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const field = (name, label, type = "text", extra = {}) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>

      <input
        id={name}
        name={name}
        type={type}
        value={form[name]}
        onChange={update(name)}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
        {...extra}
      />

      {errors[name] && (
        <p className="field__error" id={`${name}-error`}>
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <main className="auth">
      <div className="auth__card">
        <h1>Create your account</h1>
        <p className="auth__subtitle">Join ShopKart in a few seconds.</p>

        <form onSubmit={handleSubmit} noValidate>
          {field("fullName", "Full Name", "text", { autoComplete: "name" })}
          {field("email", "Email", "email", { autoComplete: "email" })}
          {field("password", "Password", "password", { autoComplete: "new-password" })}
          {field("phone", "Phone Number", "tel", { autoComplete: "tel", maxLength: 10 })}

          {serverError && (
            <p className="form__error" role="alert">
              {serverError}
            </p>
          )}

          <button className="button button--primary button--block" type="submit" disabled={submitting}>
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth__switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </main>
  );
};

export default Register;
