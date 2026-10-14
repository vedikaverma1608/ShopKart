import axios from "axios";

// withCredentials is what makes the browser attach the HttpOnly auth cookie to
// a cross-origin request. Without it the session simply would not travel.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001",
  withCredentials: true,
});

// Every caller wants the server's message, not axios's "Request failed with 401".
export const errorMessage = (err, fallback = "Something went wrong") =>
  err?.response?.data?.message || fallback;

export default api;
