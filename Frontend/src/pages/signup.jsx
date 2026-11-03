import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap, LockKeyhole, Mail } from "lucide-react";
import { motion as Motion } from "framer-motion";
import KoruLogo from "../components/UI/KoruLogo";
import GoogleAuthButton from "../components/UI/googleAuthButton";
import { Alert, Badge, Button, Card, Input, Select } from "../components/UI";
import {
  loginUser,
  loginWithGoogle,
  registerUser,
} from "../services/authService";
import { useAuth } from "../contexts/AuthContext";

// Placeholder institutions – lets the user identify where they are studying
const institutions = [
  "Open Window",
  "University of Pretoria",
  "University of Johannesburg",
  "University of Cape Town",
  "University of the Witwatersrand",
  "Stellenbosch University",
  "North-West University",
  "University of South Africa",
  "Rhodes University",
];

// Default form state – keeps all sign-up values in one place
const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "student",
  institution: "",
};

// Sign-up page – registers new users with profile, role, and institution details
export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Update the form state whenever the user changes an input or dropdown
  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  // Validate and submit the sign-up form, then log the new user in automatically
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await registerUser({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        role: form.role,
        institution: form.institution,
      });

      const loginData = await loginUser({
        email: form.email,
        password: form.password,
      });

      login({
        ...loginData,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        institution: form.institution,
      });
      setSuccess("Account created successfully. Redirecting...");
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Complete registration by using the Google credential returned by the auth button
  async function handleGoogleSignup(credential) {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = await loginWithGoogle(credential, form.role);
      login({ ...data, institution: form.institution });
      setSuccess("Google account connected. Redirecting...");
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
      className="koru-auth-canvas relative flex min-h-screen items-center justify-center px-4 py-10"
    >
      <Motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-2xl"
      >
        <Card
          variant="elevated"
          tone="low"
          padding="none"
          radius="3xl"
          className="overflow-hidden shadow-koru-lg"
        >
          <div className="relative px-6 pb-6 pt-8 sm:px-8">
            <Link
              to="/"
              className="absolute left-6 top-6 inline-flex items-center gap-1.5 rounded-koru-pill px-3 py-1.5 text-sm font-medium text-koru-on-surface-variant transition-colors hover:bg-koru-on-surface/8 hover:text-koru-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus sm:left-8"
            >
              <ArrowLeft size={16} />
              Back
            </Link>

            <div className="flex flex-col items-center text-center">
              <KoruLogo className="h-14 w-14" />
              <Badge variant="primary" size="md" className="mt-4">
                New account
              </Badge>
              <h1 className="mt-4 font-display text-koru-title text-koru-on-surface">
                Create account
              </h1>
              <p className="mt-2 max-w-sm text-koru-body text-koru-on-surface-variant">
                New here? Let&apos;s get you set up.
              </p>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="h-1.5 w-full bg-gradient-to-r from-koru-primary via-koru-secondary to-koru-tertiary"
          />

          <div className="px-6 pb-8 pt-6 sm:px-8">
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First name"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Jane"
                autoComplete="given-name"
                required
              />

              <Input
                label="Last name"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Doe"
                autoComplete="family-name"
                required
              />

              <Input
                label="Email address"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                startIcon={<Mail size={16} />}
                containerClassName="sm:col-span-2"
                required
              />

              <Select
                label="Institution"
                name="institution"
                value={form.institution}
                onChange={handleChange}
                autoComplete="organization"
                containerClassName="sm:col-span-2"
                required
              >
                <option value="" disabled>
                  Select your institution
                </option>
                {institutions.map((institution) => (
                  <option key={institution} value={institution}>
                    {institution}
                  </option>
                ))}
              </Select>

              <Input
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a password"
                autoComplete="new-password"
                startIcon={<LockKeyhole size={16} />}
                required
              />

              <Input
                label="Confirm password"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat your password"
                autoComplete="new-password"
                startIcon={<LockKeyhole size={16} />}
                required
              />

              <Select
                label="Role"
                name="role"
                value={form.role}
                onChange={handleChange}
                containerClassName="sm:col-span-2"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </Select>

              {error ? (
                <Alert variant="error" className="sm:col-span-2">
                  {error}
                </Alert>
              ) : null}

              {success ? (
                <Alert variant="success" className="sm:col-span-2">
                  {success}
                </Alert>
              ) : null}

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={loading}
                startIcon={<GraduationCap size={18} />}
                className="mt-1 sm:col-span-2"
              >
                {loading ? "Creating account..." : "Let's Learn"}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-koru-on-surface-variant/70">
              <span className="h-px flex-1 bg-koru-outline-variant" />
              <span>or</span>
              <span className="h-px flex-1 bg-koru-outline-variant" />
            </div>

            <GoogleAuthButton
              text="signup_with"
              onCredential={handleGoogleSignup}
              onError={(err) =>
                setError(err.message || "Google sign-up failed.")
              }
            />

            <p className="mt-5 text-center text-sm text-koru-on-surface-variant">
              Already have an account?{" "}
              <Link
                to={`/${form.role}/login`}
                className="font-medium text-koru-primary hover:underline"
              >
                Log in
              </Link>
            </p>
          </div>
        </Card>

        <p className="mt-4 text-center text-koru-caption text-koru-on-surface-variant">
          Protected by Koru · POPIA-compliant by design
        </p>
      </Motion.div>
    </div>
  );
}
