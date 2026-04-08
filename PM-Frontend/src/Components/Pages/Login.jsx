import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "../../api/apiConfig";
import GoogleAuth from "../GoogleAuth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        { email, password },
      );

      console.log("Login response:", response.data);

      const token = response.data.token;
      const user = response.data.user;

      // Try different possible role locations
      const userRole =
        response.data.role ||
        response.data.user?.role ||
        response.data.data?.role ||
        "user"; // fallback

      console.log("Detected role:", userRole);

      // Store in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", userRole);

      // Show success message
      setError(null);

      // Redirect based on role (case insensitive)
      setTimeout(() => {
        const roleLower = String(userRole).toLowerCase().trim();

        if (roleLower.includes("admin")) {
          console.log("Redirecting to admin panel");
          navigate("/admin/media");
        } else if (
          roleLower.includes("photographer") ||
          roleLower.includes("photog")
        ) {
          console.log("Redirecting to photographer dashboard");
          navigate("/photographer/dashboard");
        } else if (roleLower.includes("user") || roleLower.includes("buyer")) {
          console.log("Redirecting to buyer dashboard");
          navigate("/buyer/dashboard");
        } else {
          console.log("Unknown role, going to home");
          navigate("/");
        }
      }, 1500);
    } catch (err) {
      console.error("Login error:", err);
      console.error("Login response payload:", err.response?.data);

      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.response?.data ? JSON.stringify(err.response.data) : null);

      if (err.response?.status === 400) {
        setError(serverMessage || "Invalid email or password");
      } else {
        setError(serverMessage || "Login failed, please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  const glassCardStyle = {
    background: "rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center position-relative overflow-hidden"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2070&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Semi-transparent overlay */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
      ></div>

      {/* Login Card */}
      <div
        className="container position-relative"
        style={{ maxWidth: "400px", zIndex: 2 }}
      >
        <div
          className="card border-0"
          style={{
            ...glassCardStyle,
            borderRadius: "20px",
            overflow: "hidden",
          }}
        >
          {/* Card Header */}
          <div className="card-header bg-transparent border-0 text-center pt-4 pb-2">
            <div className="mb-2">
              <div
                className="d-inline-flex align-items-center justify-content-center"
                style={{
                  width: "60px",
                  height: "60px",
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "50%",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <i className="fas fa-camera text-white fa-2x"></i>
              </div>
            </div>
            <h4 className="text-white fw-bold mb-1">Welcome Back</h4>
            <p className="text-white-50 small mb-0">Sign in to continue</p>
          </div>

          {/* Card Body */}
          <div className="card-body px-4 py-3">
            {error && (
              <div
                className="alert d-flex align-items-center mb-3 py-2"
                style={{
                  background: "rgba(220, 53, 69, 0.2)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid rgba(220, 53, 69, 0.3)",
                  borderRadius: "10px",
                  color: "#fff",
                  fontSize: "0.85rem",
                }}
              >
                <i
                  className="fas fa-exclamation-circle me-2"
                  style={{ color: "#dc3545" }}
                ></i>
                <span>{error}</span>
                <button
                  type="button"
                  className="btn-close btn-close-white ms-auto"
                  onClick={() => setError(null)}
                ></button>
              </div>
            )}

            {loading && (
              <div
                className="alert d-flex align-items-center mb-3 py-2"
                style={{
                  background: "rgba(255, 193, 7, 0.1)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid rgba(255, 193, 7, 0.2)",
                  borderRadius: "10px",
                  color: "#ffc107",
                }}
              >
                <div className="spinner-border spinner-border-sm me-2"></div>
                <span>Redirecting to your dashboard...</span>
              </div>
            )}

            <form onSubmit={handleLogin}>
              {/* Email Field */}
              <div className="mb-3">
                <label
                  htmlFor="email"
                  className="form-label text-white small fw-semibold mb-1"
                >
                  <i className="fas fa-envelope me-1"></i>
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="form-control form-control-sm bg-transparent text-white border-0 py-2"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    backdropFilter: "blur(4px)",
                  }}
                />
              </div>

              {/* Password Field */}
              <div className="mb-3">
                <label
                  htmlFor="password"
                  className="form-label text-white small fw-semibold mb-1"
                >
                  <i className="fas fa-lock me-1"></i>
                  Password
                </label>
                <div className="input-group input-group-sm">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="form-control bg-transparent text-white border-0 py-2"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      backdropFilter: "blur(4px)",
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm bg-transparent border-0 text-white"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                    }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i
                      className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                    ></i>
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input bg-transparent"
                    type="checkbox"
                    id="rememberMe"
                    style={{
                      border: "1px solid rgba(255,255,255,0.3)",
                      backgroundColor: "rgba(255,255,255,0.05)",
                    }}
                  />
                  <label
                    className="form-check-label text-white-50 small"
                    htmlFor="rememberMe"
                  >
                    Remember me
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-white text-decoration-none small"
                  style={{ opacity: 0.7 }}
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn w-100 py-2 fw-semibold mb-3"
                disabled={loading}
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "10px",
                  color: "white",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.25)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.15)")
                }
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt me-2"></i>
                    Sign In
                  </>
                )}
              </button>

              {/* Sign Up Link */}
              <p className="text-center text-white-50 small mb-0">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-white text-decoration-none fw-semibold"
                >
                  Sign up
                </Link>
              </p>
            </form>

            {/* Divider */}
            <div className="d-flex align-items-center my-3">
              <hr className="flex-grow-1 border-white-50" />
              <span className="mx-3 text-white-50 small">or</span>
              <hr className="flex-grow-1 border-white-50" />
            </div>

            {/* Google Sign In */}
            {/* <GoogleAuth text="Continue with Google" /> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
