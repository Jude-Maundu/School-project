import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "../../api/apiConfig";
import GoogleAuth from "../GoogleAuth";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("user");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const navigate = useNavigate();

  // Centralized API URL
  const API_URL = API_BASE_URL;

  // Password strength indicator
  const getPasswordStrength = () => {
    if (password.length === 0) return 0;
    if (password.length < 6) return 1;
    if (password.length < 8) return 2;
    if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) return 4;
    if (password.match(/^(?=.*[a-z])(?=.*[A-Z])/)) return 3;
    return 2;
  };

  const passwordStrength = getPasswordStrength();
  const strengthText = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColor = ["", "danger", "warning", "info", "success"];

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long!");
      return;
    }

    if (!termsAccepted) {
      setError("You must accept the Terms & Conditions!");
      return;
    }

    // Phone number validation required for M-Pesa (format: 254XXXXXXXXX)
    const phoneRegex = /^254\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError("Phone number must be in the format 254XXXXXXXXX (e.g., 254712345678).");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(
        `${API_URL}/auth/register`,
        { username, email, password, role, phoneNumber }
      );

      console.log("✅ Registration successful:", response.data);

      // Save user data to localStorage
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("role", response.data.user.role || role);
      }

      setSuccess("Account created successfully! Redirecting to your dashboard...");

      // Redirect based on role
      setTimeout(() => {
        if (role === "photographer") {
          navigate("/photographer/dashboard");
        } else {
          navigate("/buyer/dashboard");
        }
      }, 2000);

    } catch (err) {
      console.error("❌ Registration error:", err);
      
      if (err.response) {
        setError(err.response.data?.message || `Error: ${err.response.status}`);
      } else if (err.request) {
        setError("Cannot connect to server. Please check your connection.");
      } else {
        setError(err.message || "Registration failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Glass card style
  const glassCardStyle = {
    background: "rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center position-relative overflow-hidden py-3" 
         style={{
           backgroundImage: "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2070&q=80')",
           backgroundSize: "cover",
           backgroundPosition: "center",
           backgroundAttachment: "fixed",
         }}>
      
      <div className="position-absolute top-0 start-0 w-100 h-100"
           style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}>
      </div>

      {/* Register Card */}
      <div className="container position-relative" style={{ maxWidth: "400px", zIndex: 2 }}>
        <div className="card border-0"
             style={{
               ...glassCardStyle,
               borderRadius: "20px",
               overflow: "hidden",
             }}>
          
          {/* Card Header */}
          <div className="card-header bg-transparent border-0 text-center pt-4 pb-2">
            <div className="mb-2">
              <div className="d-inline-flex align-items-center justify-content-center"
                   style={{
                     width: "60px",
                     height: "60px",
                     background: "rgba(255, 255, 255, 0.1)",
                     borderRadius: "50%",
                     border: "1px solid rgba(255, 255, 255, 0.2)",
                   }}>
                <i className="fas fa-user-plus text-white fa-2x"></i>
              </div>
            </div>
            <h4 className="text-white fw-bold mb-1">Create Account</h4>
            <p className="text-white-50 small mb-0">Join our community</p>
          </div>

          {/* Card Body */}
          <div className="card-body px-4 py-2">
            {/* Error Alert */}
            {error && (
              <div className="alert d-flex align-items-center mb-2 py-2" 
                   style={{
                     background: "rgba(220, 53, 69, 0.2)",
                     backdropFilter: "blur(4px)",
                     border: "1px solid rgba(220, 53, 69, 0.3)",
                     borderRadius: "8px",
                     color: "#fff",
                     fontSize: "0.8rem",
                   }}>
                <i className="fas fa-exclamation-circle me-2" style={{ color: "#dc3545", fontSize: "0.8rem" }}></i>
                <span>{error}</span>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="alert d-flex align-items-center mb-2 py-2"
                   style={{
                     background: "rgba(25, 135, 84, 0.2)",
                     backdropFilter: "blur(4px)",
                     border: "1px solid rgba(25, 135, 84, 0.3)",
                     borderRadius: "8px",
                     color: "#fff",
                     fontSize: "0.8rem",
                   }}>
                <i className="fas fa-check-circle me-2" style={{ color: "#198754", fontSize: "0.8rem" }}></i>
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleRegister}>
              {/* Username Field */}
              <div className="mb-2">
                <label htmlFor="username" className="form-label text-white small fw-semibold mb-1">
                  <i className="fas fa-user me-1" style={{ fontSize: "0.7rem" }}></i>
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  className="form-control form-control-sm bg-transparent text-white border-0 py-1"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    backdropFilter: "blur(4px)",
                    fontSize: "0.85rem",
                    height: "35px",
                  }}
                />
              </div>

              {/* Email Field */}
              <div className="mb-2">
                <label htmlFor="email" className="form-label text-white small fw-semibold mb-1">
                  <i className="fas fa-envelope me-1" style={{ fontSize: "0.7rem" }}></i>
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="form-control form-control-sm bg-transparent text-white border-0 py-1"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    backdropFilter: "blur(4px)",
                    fontSize: "0.85rem",
                    height: "35px",
                  }}
                />
              </div>

              {/* Phone Number Field */}
              <div className="mb-2">
                <label htmlFor="phoneNumber" className="form-label text-white small fw-semibold mb-1">
                  <i className="fas fa-phone me-1" style={{ fontSize: "0.7rem" }}></i>
                  Phone (254XXXXXXXXX)
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  className="form-control form-control-sm bg-transparent text-white border-0 py-1"
                  placeholder="254712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    backdropFilter: "blur(4px)",
                    fontSize: "0.85rem",
                    height: "35px",
                  }}
                />
              </div>

              {/* Password Field */}
              <div className="mb-2">
                <label htmlFor="password" className="form-label text-white small fw-semibold mb-1">
                  <i className="fas fa-lock me-1" style={{ fontSize: "0.7rem" }}></i>
                  Password
                </label>
                <div className="input-group input-group-sm">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="form-control bg-transparent text-white border-0 py-1"
                    placeholder="Create password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      backdropFilter: "blur(4px)",
                      fontSize: "0.85rem",
                      height: "35px",
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm bg-transparent border-0 text-white"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      height: "35px",
                    }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`} style={{ fontSize: "0.7rem" }}></i>
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="mt-1">
                    <div className="d-flex align-items-center gap-2">
                      <div className="flex-grow-1">
                        <div className="progress" style={{ height: "3px", background: "rgba(255,255,255,0.1)" }}>
                          <div 
                            className={`progress-bar bg-${strengthColor[passwordStrength]}`} 
                            style={{ width: `${(passwordStrength / 4) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <small className={`text-${strengthColor[passwordStrength]}`} style={{ fontSize: "0.6rem" }}>
                        {strengthText[passwordStrength]}
                      </small>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="mb-2">
                <label htmlFor="confirmPassword" className="form-label text-white small fw-semibold mb-1">
                  <i className="fas fa-check-circle me-1" style={{ fontSize: "0.7rem" }}></i>
                  Confirm Password
                </label>
                <div className="input-group input-group-sm">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    className="form-control bg-transparent text-white border-0 py-1"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      backdropFilter: "blur(4px)",
                      fontSize: "0.85rem",
                      height: "35px",
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm bg-transparent border-0 text-white"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      height: "35px",
                    }}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <i className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`} style={{ fontSize: "0.7rem" }}></i>
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div className="mb-2">
                <label className="form-label text-white small fw-semibold mb-1">
                  <i className="fas fa-user-tag me-1" style={{ fontSize: "0.7rem" }}></i>
                  Register as
                </label>
                <div className="d-flex gap-2">
                  {[
                    { value: "user", icon: "fa-user", label: "User", desc: "Buy photos" },
                    { value: "photographer", icon: "fa-camera", label: "Photographer", desc: "Sell photos" }
                  ].map((r) => (
                    <div 
                      className="flex-fill text-center p-2 cursor-pointer"
                      key={r.value}
                      onClick={() => setRole(r.value)}
                      style={{
                        background: role === r.value ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.05)",
                        backdropFilter: "blur(4px)",
                        border: role === r.value ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                      }}
                    >
                      <i className={`fas ${r.icon} ${role === r.value ? 'text-white' : 'text-white-50'} mb-1`} style={{ fontSize: "0.8rem" }}></i>
                      <small className={`d-block fw-semibold ${role === r.value ? 'text-white' : 'text-white-50'}`} style={{ fontSize: "0.65rem" }}>
                        {r.label}
                      </small>
                      <small className="text-white-50" style={{ fontSize: "0.55rem", opacity: 0.6 }}>
                        {r.desc}
                      </small>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="mb-2">
                <div className="form-check">
                  <input 
                    className="form-check-input bg-transparent" 
                    type="checkbox" 
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    style={{
                      border: "1px solid rgba(255,255,255,0.3)",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      width: "12px",
                      height: "12px",
                      marginTop: "2px",
                    }}
                  />
                  <label className="form-check-label text-white-50" htmlFor="terms" style={{ fontSize: "0.65rem" }}>
                    I agree to the{" "}
                    <Link to="/terms" className="text-white text-decoration-none">
                      Terms
                    </Link>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="btn w-100 py-2 fw-semibold mb-2"
                disabled={loading}
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(4px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "0.85rem",
                  height: "38px",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" style={{ width: "12px", height: "12px" }}></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus me-2" style={{ fontSize: "0.75rem" }}></i>
                    Sign Up
                  </>
                )}
              </button>

              {/* Login Link */}
              <p className="text-center text-white-50 small mb-0" style={{ fontSize: "0.7rem" }}>
                Already have an account?{" "}
                <Link to="/login" className="text-white text-decoration-none fw-semibold">
                  Sign in
                </Link>
              </p>
            </form>

            {/* Divider */}
            <div className="d-flex align-items-center my-3">
              <hr className="flex-grow-1 border-white-50" />
              <span className="mx-3 text-white-50 small">or</span>
              <hr className="flex-grow-1 border-white-50" />
            </div>

            {/* Google Sign Up */}
            {/* <GoogleAuth text="Continue with Google" /> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;