import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GraduationCap, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import Background from "../assets/backgrounds/Background.png";
import Logo from "../assets/Logo.png";
import AuthInput from "../components/UI/authInput";
import GoogleAuthButton from "../components/UI/googleAuthButton";
import { loginUser, loginWithGoogle } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";

// Role icon imports – shown at the top of each role-specific login card
import StudentIcon from "../assets/icons/Student.png";
import TeacherIcon from "../assets/icons/Teacher.png";
import AdminIcon from "../assets/icons/Administrator.png";

// Visual configuration for each role – accent colour, icon, and subtitle
const ROLE_CONFIG = {
  student: {
    label: "Student",
    icon: StudentIcon,
    accent: "#3C0078",
    subtitle: "Access your courses, assignments, and grades.",
  },
  teacher: {
    label: "Teacher",
    icon: TeacherIcon,
    accent: "#0369A1",
    subtitle: "Manage your classes, materials, and students.",
  },
  admin: {
    label: "Administrator",
    icon: AdminIcon,
    accent: "#9F1239",
    subtitle: "Oversee the platform, users, and settings.",
  },
};

// Login page – authenticates returning users with email/password or Google
export default function Login({ role = "student" }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.student;
  
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Update the form state as the user types into each field
  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (error) setError(""); // Clear errors on new input
  }

  // Submit the login form and navigate to the dashboard on success
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser({
        email: form.email,
        password: form.password,
        expectedRole: role,
      });

      // Persist the session through AuthContext
      login({
        userId: data.userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        profileImageUrl: data.profileImageUrl,
      });

      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle the Google credential returned by the Google sign-in button
  async function handleGoogleLogin(credential) {
    setError("");
    setLoading(true);

    try {
      const data = await loginWithGoogle(credential, role);
      login({
        userId: data.userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        profileImageUrl: data.profileImageUrl,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      data-tts-root="true"
      className="fixed inset-0 flex min-h-screen items-center justify-center bg-cover bg-center px-4 py-8"
      style={{ backgroundImage: `url(${Background})` }}
    >
      {/* Overlay for readability */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px]" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Back button – returns to the landing / onboarding page */}
        <Link
          to="/"
          className="group mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-md transition hover:bg-white hover:shadow-md"
        >
          <ArrowLeft size={16} className="transition group-hover:-translate-x-0.5" />
          Back to role selection
        </Link>

        <div className="overflow-hidden rounded-[32px] bg-white/95 shadow-2xl backdrop-blur-md">
          {/* Coloured header strip with role icon */}
          <div
            className="flex flex-col items-center gap-3 px-6 pb-5 pt-8"
            style={{
              background: `linear-gradient(135deg, ${config.accent}15, ${config.accent}08)`,
              borderBottom: `2px solid ${config.accent}20`,
            }}
          >
            {/* Role icon badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 150, damping: 20 }}
              className="flex h-20 w-20 items-center justify-center rounded-full shadow-lg"
              style={{ backgroundColor: `${config.accent}18` }}
            >
              <img
                src={config.icon}
                alt={`${config.label} icon`}
                className="h-12 w-12 object-contain"
              />
            </motion.div>

            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900">
                {config.label} Login
              </h1>
              <p className="mt-1 text-sm text-slate-500">{config.subtitle}</p>
            </div>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 pb-8 pt-6 sm:px-8">
            {/* Email field */}
            <div className="relative">
              <AuthInput
                label="Email address"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                id="login-email"
              />
            </div>

            {/* Password field with show/hide toggle */}
            <div className="relative">
              <AuthInput
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                id="login-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-[38px] text-slate-400 transition hover:text-slate-600"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Error message display */}
            {error ? (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </motion.div>
            ) : null}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              id="login-submit"
              className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 mt-2"
              style={{ backgroundColor: config.accent }}
            >
              <GraduationCap size={18} />
              <span>{loading ? "Signing in..." : "Let's Learn"}</span>
            </button>

            <div className="my-2 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              <span>or</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <GoogleAuthButton
              text="signin_with"
              onCredential={handleGoogleLogin}
              onError={(err) => setError(err.message || "Google sign-in failed.")}
            />
          </form>
        </div>
      </motion.div>
    </div>
  );
}