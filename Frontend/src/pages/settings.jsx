import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Volume2,
  Type,
  UserRound,
  KeyRound,
  LogOut,
  Save,
  RotateCcw,
  Sparkles,
  Bell,
  ShieldCheck,
  Palette,
  Eye,
  Shuffle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import TwoFactorSetupModal from "../components/UI/TwoFactorSetupModal";
import { Alert, Avatar, Badge, Button, Card, Input, Select } from "../components/UI";
import { dicebearUrl, getAvatarUrl } from "../utils/avatar";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import {
  changeUserPassword,
  updateUserProfile,
  disable2FA,
} from "../services/authService";
import { useAuth } from "../contexts/AuthContext";

const SETTINGS_STORAGE_KEY = "learnonline.settings";

const defaultSettings = {
  font: "Poppins",
  textSize: 100,
  lineSpacing: 150,
  ttsEnabled: false,
  theme: "light",
  reducedMotion: false,
  focusMode: false,
  emailNotifications: true,
  inAppNotifications: true,
  audioCues: false,
};

function ToggleRow({ icon, title, description, checked, onChange }) {
  return (
    <label
      className="flex min-h-[56px] cursor-pointer items-center justify-between gap-4 rounded-koru-md bg-koru-surface-container-low p-5 transition-colors duration-200 ease-koru-out hover:bg-koru-surface-container focus-within:ring-2 focus-within:ring-koru-focus"
    >
      <div className="flex items-center gap-4">
        <span className="shrink-0 rounded-koru-md bg-koru-primary-container/60 p-2.5 text-koru-primary">{icon}</span>
        <div>
          <p className="text-koru-label text-koru-on-surface">
            {title}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-koru-on-surface-variant">
            {description}
          </p>
        </div>
      </div>

      <span className="relative inline-flex h-7 w-12 items-center shrink-0 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          role="switch"
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className={`absolute inset-0 rounded-full transition-colors duration-300 ${checked ? "bg-koru-primary" : "bg-koru-outline-variant"}`} />
        <span
          className="absolute left-1 h-5 w-5 rounded-full bg-koru-surface-container-lowest transition-transform duration-300 shadow-koru-xs"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
        />
      </span>
    </label>
  );
}

export default function SettingsPage() {
  const { user: session, login: updateSession, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    () => session?.twoFactorEnabled ?? false
  );
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [mfaError, setMfaError] = useState("");
  const [mfaMessage, setMfaMessage] = useState("");

  const [settings, setSettings] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "null");
      return saved ? { ...defaultSettings, ...saved } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const [profileForm, setProfileForm] = useState({
    firstName: session?.firstName || "",
    lastName: session?.lastName || "",
    email: session?.email || "",
    role: session?.role?.toLowerCase?.() || "student",
    profileImageUrl: getAvatarUrl(session),
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const { speak } = useTextToSpeech(settings.ttsEnabled);
  // Read field labels aloud on focus when assistive audio is on (kept from the old AuthInput).
  const announceField = (label) => () => speak(label);

  const pageClasses = useMemo(
    () => ({
      wrapper: "text-koru-on-surface font-sans",
      muted: "text-koru-body text-koru-on-surface-variant",
    }),
    [],
  );

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event("learnonline-settings-changed"));
    
    document.documentElement.style.fontSize = `${settings.textSize}%`;
    document.body.style.lineHeight = `${settings.lineSpacing / 100}`;

    document.body.classList.toggle("dyslexic-font", settings.font === "OpenDyslexic");
    
    document.documentElement.classList.toggle("dark", settings.theme === "dark");
    if (settings.theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", isDark);
    }
    
    document.documentElement.classList.toggle("reduce-motion", settings.reducedMotion);
    document.body.classList.toggle("focus-mode", settings.focusMode);
  }, [settings]);

  function updateSetting(key, value) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function handleProfileChange(event) {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
  }

  // Pick a fresh random DiceBear avatar; saved together with the profile form
  function handleShuffleAvatar() {
    const seed = `${session?.userId || "user"}-${Math.random().toString(36).slice(2, 10)}`;
    setProfileForm((current) => ({ ...current, profileImageUrl: dicebearUrl(seed) }));
    setProfileMessage("");
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  }

  async function handleProfileSave(event) {
    event.preventDefault();
    setProfileError("");
    setProfileMessage("");
    setSavingProfile(true);

    try {
      const userId = session?.userId;
      const payload = {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        role: profileForm.role,
        profileImageUrl: profileForm.profileImageUrl,
      };

      if (userId) {
        const updated = await updateUserProfile(userId, payload);
        updateSession({ ...session, ...updated, role: updated.role || payload.role });
      } else {
        updateSession({ ...session, ...payload });
      }

      setProfileMessage("Your account details have been updated.");
    } catch (error) {
      setProfileError(error.message || "Unable to save your details.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSave(event) {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (!session?.userId) {
      setPasswordError("Please log in again before changing your password.");
      return;
    }

    setSavingPassword(true);

    try {
      const result = await changeUserPassword(session.userId, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordMessage(result.message || "Your password has been changed successfully.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      setPasswordError(error.message || "Unable to change your password.");
    } finally {
      setSavingPassword(false);
    }
  }

  function handleReset() {
    setSettings(defaultSettings);
    setProfileMessage("Accessibility and system settings have been reset to defaults.");
  }

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  const categories = [
    {
      id: "profile",
      label: "Account & Profile",
      icon: <UserRound size={15} />,
    },
    {
      id: "security",
      label: "Password & Security",
      icon: <KeyRound size={15} />,
    },
    {
      id: "accessibility",
      label: "Accessibility & Spacing",
      icon: <Sparkles size={15} />,
    },
  ];

  const activeTabLabel = useMemo(() => {
    if (activeTab === "profile") return "Account & Profile";
    if (activeTab === "security") return "Password & Security";
    if (activeTab === "accessibility") return "Accessibility & Spacing";
    return "Settings";
  }, [activeTab]);

  return (
    <div data-tts-root="true" className={`flex overflow-hidden gap-4 transition-all duration-300 md:h-[calc(100vh-32px)] md:w-full max-md:h-screen max-md:w-screen max-md:-ml-4 max-md:-mr-4 max-md:-mt-4 bg-transparent ${settings.font === "OpenDyslexic" ? "dyslexic-font" : ""} ${pageClasses.wrapper}`}>
      <div className="flex h-full w-full gap-4 overflow-hidden">
        {/* Left Section: Floating Settings Secondary Navigation (Matching Courses) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col shrink-0 transition-all duration-300
            md:h-full md:w-64 md:overflow-hidden md:rounded-koru-lg md:bg-koru-surface-container-lowest md:shadow-koru-card md:ring-1 md:ring-koru-outline-faint md:backdrop-blur-xl
            max-md:h-full max-md:w-64 max-md:border-r max-md:border-koru-outline-faint max-md:bg-koru-surface-container-lowest max-md:backdrop-blur-md"
        >
          {/* Settings Sidebar Header Info */}
          <div className="px-6 pt-6 pb-5 border-b border-koru-outline-faint flex flex-col gap-2 shrink-0 select-none">
            <div className="flex items-center gap-2">
              <Badge variant="primary">
                System
              </Badge>
              <span className="text-koru-caption text-koru-on-surface-variant">
                Preferences
              </span>
            </div>
            <h3 className="mt-1 truncate font-display text-koru-heading text-koru-on-surface">
              Settings
            </h3>
          </div>

          {/* Navigation links */}
          <div className="flex-1 overflow-y-auto pt-4 pb-6 scrollbar-hide">
            <ul className="flex flex-col gap-0.5">
              {categories.map((cat, index) => {
                const isActive = activeTab === cat.id;
                return (
                  <motion.li
                    key={cat.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="list-none group relative"
                  >
                    <button
                      type="button"
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => {
                        setActiveTab(cat.id);
                        setProfileMessage("");
                        setPasswordMessage("");
                        setProfileError("");
                        setPasswordError("");
                      }}
                      className={`group relative mx-3 my-0.5 flex w-[calc(100%-24px)] cursor-pointer select-none items-center gap-3 rounded-koru-pill px-4 py-2.5 text-left text-koru-label transition-colors duration-200 ease-koru-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-koru-focus
                        ${isActive
                          ? "bg-koru-secondary-container text-koru-on-secondary-container"
                          : "text-koru-on-surface-variant hover:bg-koru-surface-container hover:text-koru-on-surface"
                        }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeSettingsLeftAccent"
                          className="absolute bottom-1/4 left-0 top-1/4 w-0.75 shrink-0 rounded-r-koru-xs bg-koru-primary"
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30
                          }}
                        />
                      )}

                      <span className={`transition-colors shrink-0 ${isActive ? "text-koru-primary" : "text-koru-on-surface-variant group-hover:text-koru-on-surface"}`}>
                        {cat.icon}
                      </span>
                      
                      <span className="flex-1 truncate !text-inherit">{cat.label}</span>

                      {isActive && (
                        <motion.div
                          layoutId="activeSettingsDot"
                          className="w-1.5 h-1.5 rounded-full bg-koru-primary shrink-0"
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30
                          }}
                        />
                      )}
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </motion.div>

        {/* Right Section: Main Content Area: Floating Island Card */}
        <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300 md:rounded-koru-lg md:bg-koru-surface-container-lowest md:shadow-koru-card md:ring-1 md:ring-koru-outline-faint md:backdrop-blur-xl max-md:bg-koru-surface-container-lowest">
          {/* Header Top Bar */}
          <div className="z-10 flex h-14 shrink-0 select-none items-center justify-between border-b border-koru-outline-faint bg-koru-surface-container-lowest/70 px-8 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="rounded-koru-sm bg-koru-primary px-2.5 py-0.5 text-koru-caption font-medium text-koru-on-primary shadow-koru-xs">
                System Settings
              </span>
              <span aria-hidden="true" className="text-xs text-koru-outline-variant">/</span>
              <span className="text-koru-caption font-medium capitalize text-koru-on-surface-variant">{activeTabLabel}</span>
            </div>
          </div>

          {/* Scrollable View Content */}
          <div className="flex-1 overflow-y-auto pt-8 px-8 pb-12">
            <div className="w-full flex flex-col gap-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-6"
                >
                  {activeTab === "profile" && (
                    <>
                      <Card as="form" variant="outlined" tone="low" padding="lg" onSubmit={handleProfileSave}>
                        <div className="mb-6 flex items-center gap-3 border-b border-koru-outline-faint pb-3">
                          <span className="rounded-koru-md bg-koru-primary-container/60 p-2 text-koru-primary"><UserRound size={20} /></span>
                          <h2 className="font-display text-koru-heading text-koru-on-surface">User Information</h2>
                        </div>

                        <div className="mb-6 flex flex-wrap items-center gap-5">
                          <Avatar
                            src={profileForm.profileImageUrl}
                            seed={session?.userId}
                            name={`${profileForm.firstName} ${profileForm.lastName}`.trim()}
                            size="xl"
                          />
                          <div className="flex min-w-[220px] flex-1 flex-col gap-2">
                            <p className="text-koru-label text-koru-on-surface">Profile picture</p>
                            <p className={pageClasses.muted}>Your avatar is randomly assigned. Shuffle for a new one, then save.</p>
                            <div>
                              <Button type="button" variant="outlined" size="sm" onClick={handleShuffleAvatar} startIcon={<Shuffle size={14} />}>
                                Shuffle avatar
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Input label="First name" onFocus={announceField("First name")} name="firstName" value={profileForm.firstName} onChange={handleProfileChange} required />
                          <Input label="Last name" onFocus={announceField("Last name")} name="lastName" value={profileForm.lastName} onChange={handleProfileChange} required />
                          <div className="sm:col-span-2">
                            <Input
                              label="Email address"
                              onFocus={announceField("Email address")}
                              name="email"
                              type="email"
                              value={profileForm.email}
                              onChange={handleProfileChange}
                              disabled
                              required
                            />
                          </div>
                          {session?.role?.toLowerCase() === "admin" && (
                            <div className="sm:col-span-2">
                              <Select
                                label="Role"
                                name="role"
                                value={profileForm.role}
                                onChange={handleProfileChange}
                              >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Admin</option>
                              </Select>
                            </div>
                          )}
                        </div>

                        {profileError ? <Alert variant="error" className="mt-4">{profileError}</Alert> : null}
                        {profileMessage ? <Alert variant="success" className="mt-4">{profileMessage}</Alert> : null}

                        <Button type="submit" disabled={savingProfile} startIcon={<Save size={14} />} className="mt-6">
                          {savingProfile ? "Saving..." : "Save profile"}
                        </Button>
                      </Card>

                      {/* Notification Preferences */}
                      <Card variant="outlined" tone="low" padding="lg">
                        <div className="mb-6 flex items-center gap-3 border-b border-koru-outline-faint pb-3">
                          <span className="rounded-koru-md bg-koru-primary-container/60 p-2 text-koru-primary"><Bell size={20} /></span>
                          <h2 className="font-display text-koru-heading text-koru-on-surface">Notification Preferences</h2>
                        </div>
                        <p className={`${pageClasses.muted} mb-5`}>
                          Choose how you receive course updates, faculty announcements, and completion audio triggers.
                        </p>
                        
                        <div className="flex flex-col gap-4">
                          <ToggleRow
                            icon={<Bell size={16} />}
                            title="Email Announcements"
                            description="Receive announcements, faculty digests, and critical system updates via email."
                            checked={settings.emailNotifications}
                            onChange={(checked) => updateSetting("emailNotifications", checked)}
                          />
                          
                          <ToggleRow
                            icon={<Sparkles size={16} />}
                            title="In-App Push Alerts"
                            description="Display real-time visual toasts for new grades, assignments, and modules."
                            checked={settings.inAppNotifications}
                            onChange={(checked) => updateSetting("inAppNotifications", checked)}
                          />
                          
                          <ToggleRow
                            icon={<Volume2 size={16} />}
                            title="Audio Completion Cues"
                            description="Play subtle audio chimes when a module item is successfully completed."
                            checked={settings.audioCues}
                            onChange={(checked) => updateSetting("audioCues", checked)}
                          />
                        </div>
                      </Card>

                      <Card variant="outlined" tone="low" padding="lg">
                        <div className="mb-6 flex items-center gap-3 border-b border-koru-outline-faint pb-3">
                          <span className="rounded-koru-md bg-koru-error-container p-2 text-koru-error"><LogOut size={20} /></span>
                          <h2 className="font-display text-koru-heading text-koru-on-surface">Session Management</h2>
                        </div>
                        <p className={pageClasses.muted}>
                          End your current session safely and return to the university onboarding page.
                        </p>
                        <Button variant="error" onClick={handleLogout} startIcon={<LogOut size={14} />} className="mt-6">
                          Log out
                        </Button>
                      </Card>
                    </>
                  )}

                  {activeTab === "security" && (
                    <>
                      <Card as="form" variant="outlined" tone="low" padding="lg" onSubmit={handlePasswordSave}>
                        <div className="mb-6 flex items-center gap-3 border-b border-koru-outline-faint pb-3">
                          <span className="rounded-koru-md bg-koru-primary-container/60 p-2 text-koru-primary"><KeyRound size={20} /></span>
                          <h2 className="font-display text-koru-heading text-koru-on-surface">Change Password</h2>
                        </div>

                        <div className="grid gap-4">
                          <Input label="Current password" onFocus={announceField("Current password")} name="currentPassword" type="password" value={passwordForm.currentPassword} onChange={handlePasswordChange} required />
                          <Input label="New password" onFocus={announceField("New password")} name="newPassword" type="password" value={passwordForm.newPassword} onChange={handlePasswordChange} required />
                          <Input label="Confirm new password" onFocus={announceField("Confirm new password")} name="confirmPassword" type="password" value={passwordForm.confirmPassword} onChange={handlePasswordChange} required />
                        </div>

                        {passwordError ? <Alert variant="error" className="mt-4">{passwordError}</Alert> : null}
                        {passwordMessage ? <Alert variant="success" className="mt-4">{passwordMessage}</Alert> : null}

                        <Button type="submit" disabled={savingPassword} startIcon={<KeyRound size={14} />} className="mt-6">
                          {savingPassword ? "Updating..." : "Update password"}
                        </Button>
                      </Card>

                      {/* Multi-Factor Authentication */}
                      <Card variant="outlined" tone="low" padding="lg">
                        <div className="mb-6 flex items-center gap-3 border-b border-koru-outline-faint pb-3">
                          <span className="rounded-koru-md bg-koru-primary-container/60 p-2 text-koru-primary"><ShieldCheck size={20} /></span>
                          <h2 className="font-display text-koru-heading text-koru-on-surface">Multi-Factor Authentication</h2>
                        </div>
                        <p className={`${pageClasses.muted} mb-5`}>
                          Secure your university account by adding an additional layer of verification code security.
                        </p>

                        <ToggleRow
                          icon={<ShieldCheck size={16} />}
                          title="Authenticator MFA"
                          description="Use Google Authenticator or any TOTP app to generate login codes."
                          checked={twoFactorEnabled}
                          onChange={(checked) => {
                            setMfaError("");
                            setMfaMessage("");
                            if (checked) {
                              setShowSetup2FA(true);
                            } else {
                              setDisableCode("");
                              setShowDisable2FA(true);
                            }
                          }}
                        />

                        {/* Disable 2FA confirmation form */}
                        {showDisable2FA && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 flex flex-col gap-3 rounded-koru-md bg-koru-surface-container p-4"
                          >
                            <p className="text-koru-label text-koru-on-surface-variant">
                              Enter your current authenticator code to disable 2FA.
                            </p>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={6}
                              value={disableCode}
                              onChange={(e) => { setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setMfaError(""); }}
                              placeholder="000000"
                              aria-label="Authenticator code"
                              className="h-12 w-full rounded-koru-xs bg-koru-surface-container-lowest px-4 text-center font-mono text-lg tracking-widest text-koru-on-surface shadow-koru-xs outline-none ring-1 ring-inset ring-koru-outline-variant transition focus:ring-koru-primary"
                            />
                            <div className="flex gap-2">
                              <Button
                                variant="error"
                                disabled={disableCode.length < 6 || disabling2FA}
                                onClick={async () => {
                                  setDisabling2FA(true);
                                  setMfaError("");
                                  try {
                                    await disable2FA(session.userId, disableCode);
                                    setTwoFactorEnabled(false);
                                    updateUser({ twoFactorEnabled: false });
                                    setMfaMessage("Two-factor authentication has been disabled.");
                                    setShowDisable2FA(false);
                                    setDisableCode("");
                                  } catch (err) {
                                    setMfaError(err.message || "Invalid code.");
                                    setDisableCode("");
                                  } finally {
                                    setDisabling2FA(false);
                                  }
                                }}
                                className="flex-1"
                              >
                                {disabling2FA ? "Disabling…" : "Confirm Disable"}
                              </Button>
                              <Button
                                variant="text"
                                onClick={() => { setShowDisable2FA(false); setDisableCode(""); setMfaError(""); }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </motion.div>
                        )}

                        {mfaError && <Alert variant="error" className="mt-3">{mfaError}</Alert>}
                        {mfaMessage && <Alert variant="success" className="mt-3">{mfaMessage}</Alert>}
                      </Card>

                      {/* 2FA Setup Modal */}
                      <AnimatePresence>
                        {showSetup2FA && session?.userId && (
                          <TwoFactorSetupModal
                            userId={session.userId}
                            onSuccess={() => {
                              setShowSetup2FA(false);
                              setTwoFactorEnabled(true);
                              updateUser({ twoFactorEnabled: true });
                              setMfaMessage("Two-factor authentication has been enabled.");
                            }}
                            onClose={() => setShowSetup2FA(false)}
                          />
                        )}
                      </AnimatePresence>
                    </>
                  )}

                  {activeTab === "accessibility" && (
                    <>
                      <Card variant="outlined" tone="low" padding="lg">
                        <div className="mb-6 flex items-center gap-3 border-b border-koru-outline-faint pb-3">
                          <span className="rounded-koru-md bg-koru-primary-container/60 p-2 text-koru-primary"><Type size={20} /></span>
                          <h2 className="font-display text-koru-heading text-koru-on-surface">Reading Settings</h2>
                        </div>

                        <div className="mb-6">
                          <div className="mb-2 flex items-center justify-between">
                            <label htmlFor="settings-text-size" className="text-koru-label text-koru-on-surface-variant">Text Size</label>
                            <span className="text-koru-label tabular-nums text-koru-primary">{settings.textSize}%</span>
                          </div>
                          <input id="settings-text-size" type="range" min="100" max="200" value={settings.textSize} onChange={(e) => updateSetting("textSize", Number(e.target.value))} className="h-2 w-full cursor-pointer accent-koru-primary" />
                        </div>

                        <div className="mb-6">
                          <div className="mb-2 flex items-center justify-between">
                            <label htmlFor="settings-line-spacing" className="text-koru-label text-koru-on-surface-variant">Line Spacing</label>
                            <span className="text-koru-label tabular-nums text-koru-primary">{settings.lineSpacing}%</span>
                          </div>
                          <input id="settings-line-spacing" type="range" min="120" max="200" value={settings.lineSpacing} onChange={(e) => updateSetting("lineSpacing", Number(e.target.value))} className="h-2 w-full cursor-pointer accent-koru-primary" />
                        </div>

                        <ToggleRow
                          icon={<Type size={16} />}
                          title="Dyslexic Font"
                          description="Switch to OpenDyslexic for improved readability and letter distinction."
                          checked={settings.font === "OpenDyslexic"}
                          onChange={(checked) => updateSetting("font", checked ? "OpenDyslexic" : "Poppins")}
                        />
                      </Card>

                      <Card variant="outlined" tone="low" padding="lg">
                        <div className="mb-6 flex items-center gap-3 border-b border-koru-outline-faint pb-3">
                          <span className="rounded-koru-md bg-koru-primary-container/60 p-2 text-koru-primary"><Volume2 size={20} /></span>
                          <h2 className="font-display text-koru-heading text-koru-on-surface">Text to Speech</h2>
                        </div>

                        <div className="flex flex-col gap-3">
                          <ToggleRow
                            icon={<Volume2 size={16} />}
                            title="Enable Text-to-Speech"
                            description="Read page content aloud for easier comprehension and reduced reading strain."
                            checked={settings.ttsEnabled}
                            onChange={(checked) => updateSetting("ttsEnabled", checked)}
                          />
                        </div>

                        <Button variant="outlined" onClick={() => speak("This is a preview of the text to speech accessibility setting.", { force: true })} startIcon={<Volume2 size={14} />} className="mt-4">
                          Preview voice
                        </Button>
                      </Card>

                      {/* Visual Style Preferences */}
                      <Card variant="outlined" tone="low" padding="lg">
                        <div className="mb-6 flex items-center gap-3 border-b border-koru-outline-faint pb-3">
                          <span className="rounded-koru-md bg-koru-primary-container/60 p-2 text-koru-primary"><Palette size={20} /></span>
                          <h2 className="font-display text-koru-heading text-koru-on-surface">Visual Theme & Style</h2>
                        </div>
                        <p className={`${pageClasses.muted} mb-5`}>
                          Configure themes, optimize motion settings, and enable focus features to minimize reading distractions.
                        </p>

                        <div className="mb-6">
                          <Select
                            label="Interface Theme Mode"
                            value={settings.theme}
                            onChange={(e) => updateSetting("theme", e.target.value)}
                          >
                            <option value="light">☀️ Light Theme</option>
                            <option value="dark">🌙 Dark Theme</option>
                            <option value="system">🖥️ Sync with System</option>
                          </Select>
                        </div>

                      </Card>

                      <Card variant="outlined" tone="low" padding="lg">
                        <div className="mb-6 flex items-center gap-3 border-b border-koru-outline-faint pb-3">
                          <span className="rounded-koru-md bg-koru-primary-container/60 p-2 text-koru-primary"><Sparkles size={20} /></span>
                          <h2 className="font-display text-koru-heading text-koru-on-surface">Accessibility Compliance</h2>
                        </div>
                        <ul className="list-none space-y-3.5 text-koru-body text-koru-on-surface-variant">
                          <li className="flex items-start gap-2.5">
                            <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-koru-primary" />
                            <span>Buttons and controls use strong color contrast and visible focus states.</span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-koru-primary" />
                            <span>Touch targets are sized for easier clicking and keyboard access.</span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-koru-primary" />
                            <span>Dyslexic-friendly font and spacing controls improve reading comfort.</span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-koru-primary" />
                            <span>Text-to-speech support is available for audio assistance.</span>
                          </li>
                        </ul>

                        <div className="mt-6 flex flex-wrap gap-3">
                          <Button onClick={() => setProfileMessage("All settings have been successfully persisted.")} startIcon={<Save size={14} />}>
                            Save All Settings
                          </Button>
                          <Button variant="outlined" onClick={handleReset} startIcon={<RotateCcw size={14} />}>
                            Reset to Defaults
                          </Button>
                        </div>

                        {profileMessage && <Alert variant="success" className="mt-4">{profileMessage}</Alert>}
                      </Card>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
