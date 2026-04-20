import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import Background from "../assets/backgrounds/Background.png";
import Logo from "../assets/Logo.png";
import AuthInput from "../components/UI/authInput";
import GoogleAuthButton from "../components/UI/googleAuthButton";
import {
  loginUser,
  loginWithGoogle,
  saveAuthSession,
} from "../services/authService";

// Login page – authenticates returning users with email/password or Google
export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Update the form state as the user types into each field
  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  // Submit the standard login form and navigate to the dashboard on success
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = await loginUser(form);
      saveAuthSession({ ...data, email: form.email });
      setSuccess("Login successful. Redirecting...");
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
    setSuccess("");
    setLoading(true);

    try {
      const data = await loginWithGoogle(credential);
      saveAuthSession(data);
      setSuccess("Google login successful. Redirecting...");
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
      <div className="w-full max-w-md rounded-[32px] bg-white/95 p-6 shadow-2xl backdrop-blur-md sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold text-slate-900">Login</h1>
          <p className="mt-2 text-sm text-slate-600">
            Hello again! Let&apos;s make today a productive one.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AuthInput
            label="Email address"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />

          <AuthInput
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#3C0078] px-4 py-3 font-semibold text-white transition hover:bg-[#2f005f] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <GraduationCap size={18} />
            <span>{loading ? "Signing in..." : "Lets Learn"}</span>
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          <span>or</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <GoogleAuthButton
          text="signin_with"
          onCredential={handleGoogleLogin}
          onError={(err) => setError(err.message || "Google sign-in failed.")}
        />

        <p className="mt-5 text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-semibold text-[#3C0078] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}