import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import KoruLogo from "../components/UI/KoruLogo";
import GoogleAuthButton from "../components/UI/googleAuthButton";
import TwoFactorSetupModal from "../components/UI/TwoFactorSetupModal";
import { Alert, Badge, Button, Card, Input } from "../components/UI";
import { loginUser, loginWithGoogle, validate2FA } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";

import StudentIcon from "../assets/icons/Student.png";
import TeacherIcon from "../assets/icons/Teacher.png";
import AdminIcon from "../assets/icons/Administrator.png";

const ROLE_CONFIG = {
  student: {
    label: "Student",
    icon: StudentIcon,
    badgeVariant: "primary",
    subtitle: "Access your courses, assignments, and grades.",
  },
  teacher: {
    label: "Teacher",
    icon: TeacherIcon,
    badgeVariant: "secondary",
    subtitle: "Manage your classes, materials, and students.",
  },
  admin: {
    label: "Administrator",
    icon: AdminIcon,
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
        : `${config.label} sign in`;

  const subtitle =
    step === "twoFactor"
      ? "Enter the 6-digit code from your authenticator app."
      : step === "firstLoginPrompt"
        ? "Add a second sign-in step to keep your account protected."
        : config.subtitle;

  return (
    <div
      data-tts-root="true"
      className="koru-auth-canvas relative flex min-h-screen items-center justify-center px-4 py-10"
    >
      <Motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <Card
          variant="elevated"
          tone="low"
          padding="none"
          radius="3xl"
          className="overflow-hidden shadow-koru-lg"
        >
          <div className="relative px-6 pb-6 pt-8 sm:px-8">
            {step === "credentials" ? (
              <Link
                to="/"
                className="absolute left-6 top-6 inline-flex items-center gap-1.5 rounded-koru-pill px-3 py-1.5 text-sm font-medium text-koru-on-surface-variant transition-colors hover:bg-koru-on-surface/8 hover:text-koru-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus sm:left-8"
              >
                <ArrowLeft size={16} />
                Back
              </Link>
            ) : null}

            <div className="flex flex-col items-center text-center">
              <KoruLogo className="h-14 w-14" />
              <Badge
                variant={config.badgeVariant}
                size="md"
                className="mt-4 gap-2"
              >
                <img
                  src={config.icon}
                  alt=""
                  className="h-4 w-4 object-contain"
                />
                {config.label}
              </Badge>
              <h1 className="mt-4 font-display text-koru-title text-koru-on-surface">
                {title}
              </h1>
              <p className="mt-2 max-w-sm text-koru-body text-koru-on-surface-variant">
                {subtitle}
              </p>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="h-1.5 w-full bg-gradient-to-r from-koru-primary via-koru-secondary to-koru-tertiary"
          />

          <div className="px-6 pb-8 pt-6 sm:px-8">
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
                    label="Email address"
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
                      <Button
                        type="button"
                        variant="text"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setShowPassword((v) => !v)}
                        tabIndex={-1}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </Button>
                    }
                  />

                  {error ? <Alert variant="error">{error}</Alert> : null}

                  <Button
                    type="submit"
                    size="lg"
                    fullWidth
                    loading={loading}
                    startIcon={<GraduationCap size={18} />}
                    className="mt-1"
                  >
                    {loading ? "Signing in..." : "Let's Learn"}
                  </Button>

                  <div className="my-1 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-koru-on-surface-variant/70">
                    <span className="h-px flex-1 bg-koru-outline-variant" />
                    <span>or</span>
                    <span className="h-px flex-1 bg-koru-outline-variant" />
                  </div>

                  <GoogleAuthButton
                    text="signin_with"
                    onCredential={handleGoogleLogin}
                    onError={(err) =>
                      setError(err.message || "Google sign-in failed.")
                    }
                  />

                  <p className="text-center text-sm text-koru-on-surface-variant">
                    New to Koru?{" "}
                    <Link
                      to="/signup"
                      className="font-medium text-koru-primary hover:underline"
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
                  <p className="text-center text-sm text-koru-on-surface-variant">
                    Open your authenticator app and enter the 6-digit code.
                  </p>

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
                    onClick={() => {
                      setStep("credentials");
                      setError("");
                      setTwoFactorCode("");
                    }}
                  >
                    Back to login
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
                    Adds a one-time code from your phone as a second sign-in
                    step, keeping your account safe even if your password is
                    compromised.
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
          </div>
        </Card>

        <p className="mt-4 text-center text-koru-caption text-koru-on-surface-variant">
          Protected by Koru · POPIA-compliant by design
        </p>
      </Motion.div>

      {showSetupModal && pendingUserData ? (
        <TwoFactorSetupModal
          userId={pendingUserData.userId}
          onSuccess={handleSetupComplete}
          onClose={() => setShowSetupModal(false)}
        />
      ) : null}
    </div>
  );
}
