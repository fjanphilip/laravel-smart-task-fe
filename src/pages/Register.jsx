import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/register", {
        name: name,
        email: email,
        password: password,
        role: "developer", // Default role for registration
      });

      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Registration failed. Please try again.";
      setError(errorMessage);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background font-body-md text-on-background min-h-screen flex items-start sm:items-center justify-center p-margin-mobile md:p-margin-desktop py-12 relative w-full overflow-x-hidden">
      {/* Background Decoration */}
      <div className="fixed inset-0 neo-grid pointer-events-none"></div>
      <div className="floating-shape w-24 h-24 rounded-lg -top-10 -left-10 rotate-12 hidden md:block"></div>
      <div className="floating-shape w-32 h-12 rounded-lg bottom-20 -right-10 -rotate-6 bg-tertiary hidden md:block"></div>

      {/* Registration Container */}
      <main className="relative z-10 w-full max-w-lg m-auto">
        <div
          className={`bg-surface-container-lowest border-border-width border-black rounded-lg brutalist-card overflow-hidden ${
            shake ? "animate-shake" : ""
          }`}
        >
          {/* Card Header */}
          <div className="p-gutter border-b-border-width border-black bg-surface-container flex flex-col items-center text-center">
            <img
              alt="SmartTask Logo"
              className="h-16 mb-base"
              src="/logo.png"
            />
            <h1 className="font-headline-md text-headline-md mt-4 text-on-background uppercase tracking-tight">
              Join SmartTask
            </h1>
            <p className="font-body-md text-on-surface-variant font-bold">
              Start managing your chaos with precision.
            </p>
          </div>

          {/* Registration Form */}
          <div className="p-gutter bg-white">
            <form onSubmit={handleRegister} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-4 border-2 border-black bg-error-container text-error font-bold mb-4">
                  <span className="material-symbols-outlined">error</span>
                  <span className="font-label-mono text-sm">{error}</span>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="flex items-center gap-2 p-4 border-2 border-black bg-green-100 text-green-700 font-bold mb-4">
                  <span className="material-symbols-outlined">check_circle</span>
                  <span className="font-label-mono text-sm">{success}</span>
                </div>
              )}

              {/* Full Name Field */}
              <div className="flex flex-col gap-2 text-left">
                <label
                  className="font-label-mono uppercase tracking-wider text-sm text-on-background"
                  htmlFor="name"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  disabled={loading}
                  className="w-full p-4 border-border-width border-black rounded-lg font-label-mono brutalist-input transition-all text-black"
                />
              </div>

              {/* Email Field */}
              <div className="flex flex-col gap-2 text-left">
                <label
                  className="font-label-mono uppercase tracking-wider text-sm text-on-background"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@smarttask.pro"
                  required
                  disabled={loading}
                  className="w-full p-4 border-border-width border-black rounded-lg font-label-mono brutalist-input transition-all text-black"
                />
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-2 text-left">
                <label
                  className="font-label-mono uppercase tracking-wider text-sm text-on-background"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className="w-full p-4 border-border-width border-black rounded-lg font-label-mono brutalist-input transition-all text-black"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-black flex items-center"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-primary-container border-border-width border-black rounded-lg font-headline-sm text-headline-sm brutalist-button uppercase tracking-tight flex items-center justify-center gap-3 text-black disabled:opacity-50"
              >
                {loading ? "Creating Account..." : "Create Account"}
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'wght' 700" }}
                >
                  person_add
                </span>
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-8 text-center pt-8 border-t-4 border-black">
              <p className="font-body-md text-on-background font-bold mb-4">
                Already have an account?
              </p>
              <Link
                to="/login"
                className="inline-block px-6 py-2 bg-surface-container-high border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-label-mono uppercase hover:bg-tertiary-fixed transition-colors active:translate-x-0.5 active:translate-y-0.5 active:shadow-none font-bold text-black"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
