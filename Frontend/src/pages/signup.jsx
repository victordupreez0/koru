import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail } from "lucide-react";
import AuthLayout, { AuthDivider, AuthHeading } from "../components/AuthLayout";
import GoogleAuthButton from "../components/UI/googleAuthButton";
import { Alert, Button, Input, Select } from "../components/UI";
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

const ROLES = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "admin", label: "Admin" },
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
    <AuthLayout backTo="/" contentClassName="max-w-md">
      <AuthHeading
        title="Create your account"
        subtitle="New here? Let's get you set up in under a minute."
        compact
      />

      <form onSubmit={handleSubmit} className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-koru-label font-medium text-koru-on-surface">
            I am a
          </legend>
          <div className="grid grid-cols-3 gap-1 rounded-koru-pill bg-koru-surface-container-high p-1">
            {ROLES.map((role) => (
              <label key={role.value} className="relative">
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={form.role === role.value}
                  onChange={handleChange}
                  className="peer sr-only"
                />
                <span className="flex h-9 cursor-pointer items-center justify-center rounded-koru-pill text-koru-label font-medium text-koru-on-surface-variant transition-colors duration-150 ease-koru-out hover:text-koru-on-surface peer-checked:bg-koru-surface-container-lowest peer-checked:text-koru-primary peer-checked:shadow-koru-xs peer-focus-visible:ring-2 peer-focus-visible:ring-koru-focus">
                  {role.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

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
          label="Email"
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
          placeholder="Repeat password"
          autoComplete="new-password"
          startIcon={<LockKeyhole size={16} />}
          required
        />

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
          className="mt-1 sm:col-span-2"
        >
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <div className="my-4">
        <AuthDivider />
      </div>

      <GoogleAuthButton
        text="signup_with"
        onCredential={handleGoogleSignup}
        onError={(err) => setError(err.message || "Google sign-up failed.")}
      />

      <p className="mt-4 text-center text-koru-label text-koru-on-surface-variant">
        Already have an account?{" "}
        <Link
          to={`/${form.role}/login`}
          className="rounded-koru-xs font-medium text-koru-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
