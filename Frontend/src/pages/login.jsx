import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  GraduationCap,
  Presentation,
  Shield,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import AuthLayout, { AuthDivider, AuthHeading } from "../components/AuthLayout";
import GoogleAuthButton from "../components/UI/googleAuthButton";
import TwoFactorSetupModal from "../components/UI/TwoFactorSetupModal";
import { Alert, Badge, Button, Input } from "../components/UI";
import { loginUser, loginWithGoogle, validate2FA } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";

const ROLE_CONFIG = {
  student: {
    label: "Student",
    icon: GraduationCap,
    badgeVariant: "primary",
    subtitle: "Access your courses, assignments, and grades.",
  },
  teacher: {
    label: "Teacher",
    icon: Presentation,
    badgeVariant: "secondary",
    subtitle: "Manage your classes, materials, and students.",
  },
  admin: {
    label: "Administrator",
    icon: Shield,
    badgeVariant: "tertiary",
    subtitle: "Oversee the platform, users, and settings.",
  },
};

// Login page – authenticates users with email/password or Google,
// then handles the 2FA challenge and the first-login 2FA setup offer.
export default function Login({ role = "student" }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.student;

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // "twoFactor" = showing TOTP code input after credentials accepted
  // "firstLoginPrompt" = offering to enable 2FA after first ever login
  const [step, setStep] = useState("credentials");
  const [pendingUserId, setPendingUserId] = useState(null);
  const [pendingUserData, setPendingUserData] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((c) => ({ ...c, [name]: value }));
    if (error) setError("");
  }

  // After credentials or 2FA are validated, check if this is the user's
  // first login. If so, offer 2FA setup before entering the app.
  function afterAuth(userData) {
    const alreadyPrompted = localStorage.getItem(
      `twoFactorPrompted_${userData.userId}`,
    );
    if (!alreadyPrompted && !userData.twoFactorEnabled) {
      setPendingUserData(userData);
      setStep("firstLoginPrompt");
    } else {
      finalizeLogin(userData);
    }
  }

  function finalizeLogin(userData) {
    login({
      userId: userData.userId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      profileImageUrl: userData.profileImageUrl,
      twoFactorEnabled: userData.twoFactorEnabled ?? false,
    });
    navigate("/dashboard");
  }

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

      if (data.requiresTwoFactor) {
        setPendingUserId(data.pendingUserId);
        setStep("twoFactor");
        return;
      }

      afterAuth(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin(credential) {
    setError("");
    setLoading(true);

    try {
      const data = await loginWithGoogle(credential, role);

      if (data.requiresTwoFactor) {
        setPendingUserId(data.pendingUserId);
        setStep("twoFactor");
        return;
      }

      afterAuth(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleTwoFactorSubmit(event) {
    event.preventDefault();
    setError("");
    setVerifying(true);

    try {
      const data = await validate2FA(pendingUserId, twoFactorCode.trim());
      afterAuth(data);
    } catch (err) {
      setError(err.message);
      setTwoFactorCode("");
    } finally {
      setVerifying(false);
    }
  }

  function handleTwoFactorCodeInput(e) {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setTwoFactorCode(val);
    if (error) setError("");
  }

  function dismissFirstLoginPrompt() {
    localStorage.setItem(
      `twoFactorPrompted_${pendingUserData.userId}`,
      "1",
    );
    finalizeLogin(pendingUserData);
  }

  function handleSetupComplete() {
    setShowSetupModal(false);
    localStorage.setItem(
      `twoFactorPrompted_${pendingUserData.userId}`,
      "1",
    );
    finalizeLogin({ ...pendingUserData, twoFactorEnabled: true });
  }

  const title =
    step === "twoFactor"
      ? "Two-factor authentication"
      : step === "firstLoginPrompt"
        ? "Secure your account"
        : "Welcome back";

  const subtitle =
    step === "twoFactor"
      ? "Enter the 6-digit code from your authenticator app."
      : step === "firstLoginPrompt"
        ? "Add a second sign-in step to keep your account protected."
        : config.subtitle;

  return (
    <AuthLayout backTo={step === "credentials" ? "/" : undefined}>
      <AuthHeading
        eyebrow={
          <Badge variant={config.badgeVariant} size="md" className="gap-2">
            <config.icon size={14} aria-hidden="true" />
            {config.label}
          </Badge>
        }
        title={title}
        subtitle={subtitle}
      />

      <AnimatePresence mode="wait">
        {step === "credentials" && (
          <Motion.form
            key="credentials"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              id="login-email"
              autoComplete="email"
              startIcon={<Mail size={16} />}
            />

            <Input
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              id="login-password"
              autoComplete="current-password"
              startIcon={<LockKeyhole size={16} />}
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="-mr-2 flex h-8 w-8 items-center justify-center rounded-koru-pill text-koru-on-surface-variant transition-colors duration-150 ease-koru-out hover:bg-koru-on-surface/8 hover:text-koru-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus"
                >
                  {showPassword ? (
                    <EyeOff size={16} aria-hidden="true" />
                  ) : (
                    <Eye size={16} aria-hidden="true" />
                  )}
                </button>
              }
            />

            {error ? <Alert variant="error">{error}</Alert> : null}

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={loading}
              className="mt-2"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            <AuthDivider />

            <GoogleAuthButton
              text="signin_with"
              onCredential={handleGoogleLogin}
              onError={(err) =>
                setError(err.message || "Google sign-in failed.")
              }
            />

            <p className="mt-2 text-center text-koru-label text-koru-on-surface-variant">
              New to Koru?{" "}
              <Link
                to="/signup"
                className="font-medium text-koru-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus rounded-koru-xs"
              >
                Create an account
              </Link>
            </p>
          </Motion.form>
        )}

        {step === "twoFactor" && (
          <Motion.form
            key="twoFactor"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleTwoFactorSubmit}
            className="flex flex-col gap-4"
          >
            <Input
              label="Authentication code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={twoFactorCode}
              onChange={handleTwoFactorCodeInput}
              placeholder="000000"
              autoFocus
              autoComplete="one-time-code"
              size="lg"
              className="text-center font-mono text-2xl tracking-[0.5em]"
            />

            {error ? <Alert variant="error">{error}</Alert> : null}

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={verifying}
              disabled={twoFactorCode.length < 6}
              startIcon={<ShieldCheck size={18} />}
            >
              Verify code
            </Button>

            <Button
              type="button"
              variant="text"
              fullWidth
              startIcon={<ArrowLeft size={16} />}
              onClick={() => {
                setStep("credentials");
                setError("");
                setTwoFactorCode("");
              }}
            >
              Back to sign in
            </Button>
          </Motion.form>
        )}

        {step === "firstLoginPrompt" && (
          <Motion.div
            key="firstLoginPrompt"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            <Alert variant="info" title="Two-factor authentication">
              Adds a one-time code from your phone as a second sign-in step,
              keeping your account safe even if your password is compromised.
            </Alert>

            <Button
              type="button"
              size="lg"
              fullWidth
              startIcon={<ShieldCheck size={18} />}
              onClick={() => setShowSetupModal(true)}
            >
              Enable 2FA now
            </Button>

            <Button
              type="button"
              size="lg"
              fullWidth
              variant="tonal"
              startIcon={<ShieldOff size={18} />}
              onClick={dismissFirstLoginPrompt}
            >
              Maybe later
            </Button>

            <p className="text-center text-koru-caption text-koru-on-surface-variant">
              You can always enable this later in Settings → Password &
              Security.
            </p>
          </Motion.div>
        )}
      </AnimatePresence>

      {showSetupModal && pendingUserData ? (
        <TwoFactorSetupModal
          userId={pendingUserData.userId}
          onSuccess={handleSetupComplete}
          onClose={() => setShowSetupModal(false)}
        />
      ) : null}
    </AuthLayout>
  );
}
