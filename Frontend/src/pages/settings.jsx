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
} from "lucide-react";
import Menu from "../components/menu";
import SideMenu from "../components/sideMenu";
import AuthInput from "../components/UI/authInput";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import {
  changeUserPassword,
  updateUserProfile,
} from "../services/authService";
import { useAuth } from "../contexts/AuthContext";

const SETTINGS_STORAGE_KEY = "learnonline.settings";

const defaultSettings = {
  font: "Poppins",
  textSize: 100,
  lineSpacing: 150,
  ttsEnabled: false,
};

function ToggleRow({ icon, title, description, checked, onChange }) {
  return (
    <label
      className="flex min-h-[56px] items-center justify-between gap-4 rounded-2xl border p-4 border-slate-200 bg-slate-50"
    >
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-[#3C0078]/10 p-2 text-[#3C0078]">{icon}</span>
        <div>
          <p className="text-base font-semibold text-slate-900">
            {title}
          </p>
          <p className="text-sm text-slate-600">
            {description}
          </p>
        </div>
      </div>

      <span className="relative inline-flex h-7 w-12 items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className={`absolute inset-0 rounded-full transition ${checked ? "bg-[#3C0078]" : "bg-slate-300"}`} />
        <span
          className="absolute left-1 h-5 w-5 rounded-full bg-white transition peer-focus:outline peer-focus:outline-2 peer-focus:outline-offset-2 peer-focus:outline-[#9BE9EA]"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
        />
      </span>
    </label>
  );
}

// Settings page – lets the user update profile details, password, and accessibility preferences
export default function SettingsPage() {
  const { user: session, login: updateSession, logout } = useAuth();
  const navigate = useNavigate();
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

  const pageClasses = useMemo(
    () => ({
      wrapper: "text-slate-900",
      card: "border-slate-200 bg-white/95 text-slate-900",
      muted: "text-slate-600",
      secondaryButton: "border-[#3C0078] bg-white text-[#3C0078] hover:bg-[#f3edff]",
      select: "border-slate-300 bg-white text-slate-900",
      input: "border-slate-300 bg-white text-slate-900",
      label: "text-slate-700",
    }),
    [],
  );

  // Persist settings and apply their effects across the app without a separate context
  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event("learnonline-settings-changed"));
    document.documentElement.style.fontSize = `${settings.textSize}%`;
    document.body.style.lineHeight = `${settings.lineSpacing / 100}`;

    document.body.classList.toggle("dyslexic-font", settings.font === "OpenDyslexic");
    document.body.classList.remove("theme-high-contrast", "reduce-motion", "focus-mode");
  }, [settings]);

  // Manual preview is available from the text-to-speech section below.

  function updateSetting(key, value) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function handleProfileChange(event) {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
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
    setProfileMessage("Accessibility settings have been reset to defaults.");
  }

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <div data-tts-root="true" className={`w-full pb-10 ${settings.font === "OpenDyslexic" ? "dyslexic-font" : ""} ${pageClasses.wrapper}`}>
      <Menu />
      <SideMenu />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-2">
        <div className={`rounded-[28px] border p-6 shadow-sm ${pageClasses.card}`}>
          <h1 className="text-4xl font-bold">Settings</h1>
          <p className={`mt-2 max-w-2xl text-sm ${pageClasses.muted}`}>
            Manage your account, update your password, and personalize your accessibility preferences with WCAG AA-friendly controls.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
          <div className="flex flex-col gap-6">
            <form onSubmit={handleProfileSave} className={`rounded-[28px] border p-6 shadow-sm ${pageClasses.card}`}>
              <div className="mb-5 flex items-center gap-3">
                <UserRound size={22} />
                <h2 className="text-2xl font-bold">User Information</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <AuthInput label="First name" name="firstName" value={profileForm.firstName} onChange={handleProfileChange} labelClassName={pageClasses.label} className={pageClasses.input} required />
                <AuthInput label="Last name" name="lastName" value={profileForm.lastName} onChange={handleProfileChange} labelClassName={pageClasses.label} className={pageClasses.input} required />
                <div className="sm:col-span-2">
                  <AuthInput label="Email address" name="email" type="email" value={profileForm.email} onChange={handleProfileChange} labelClassName={pageClasses.label} className={pageClasses.input} required />
                </div>
                <label className={`sm:col-span-2 flex flex-col gap-2 text-sm font-medium ${pageClasses.wrapper}`}>
                  <span>Role</span>
                  <select
                    name="role"
                    value={profileForm.role}
                    onChange={handleProfileChange}
                    className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-sm outline-none transition focus:border-[#3C0078] focus:ring-2 focus:ring-[#9BE9EA] ${pageClasses.select}`}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
              </div>

              {profileError ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{profileError}</div> : null}
              {profileMessage ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{profileMessage}</div> : null}

              <button type="submit" disabled={savingProfile} className="mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-[#3C0078] px-4 py-3 font-semibold text-white transition hover:bg-[#2f005f] disabled:cursor-not-allowed disabled:opacity-70">
                <Save size={18} />
                <span>{savingProfile ? "Saving..." : "Save profile"}</span>
              </button>
            </form>

            <form onSubmit={handlePasswordSave} className={`rounded-[28px] border p-6 shadow-sm ${pageClasses.card}`}>
              <div className="mb-5 flex items-center gap-3">
                <KeyRound size={22} />
                <h2 className="text-2xl font-bold">Change Password</h2>
              </div>

              <div className="grid gap-4">
                <AuthInput label="Current password" name="currentPassword" type="password" value={passwordForm.currentPassword} onChange={handlePasswordChange} labelClassName={pageClasses.label} className={pageClasses.input} required />
                <AuthInput label="New password" name="newPassword" type="password" value={passwordForm.newPassword} onChange={handlePasswordChange} labelClassName={pageClasses.label} className={pageClasses.input} required />
                <AuthInput label="Confirm new password" name="confirmPassword" type="password" value={passwordForm.confirmPassword} onChange={handlePasswordChange} labelClassName={pageClasses.label} className={pageClasses.input} required />
              </div>

              {passwordError ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{passwordError}</div> : null}
              {passwordMessage ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{passwordMessage}</div> : null}

              <button type="submit" disabled={savingPassword} className="mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-[#3C0078] px-4 py-3 font-semibold text-white transition hover:bg-[#2f005f] disabled:cursor-not-allowed disabled:opacity-70">
                <KeyRound size={18} />
                <span>{savingPassword ? "Updating..." : "Update password"}</span>
              </button>
            </form>

            <div className={`rounded-[28px] border p-6 shadow-sm ${pageClasses.card}`}>
              <h2 className="text-2xl font-bold">Session</h2>
              <p className={`mt-2 text-sm ${pageClasses.muted}`}>
                End your current session and return to onboarding.
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700"
              >
                <LogOut size={18} />
                <span>Log out</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className={`rounded-[28px] border p-6 shadow-sm ${pageClasses.card}`}>
              <div className="mb-4 flex items-center gap-3">
                <Type size={22} />
                <h2 className="text-2xl font-bold">Reading Settings</h2>
              </div>

              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-base font-medium">Text Size</label>
                  <span className={`text-sm ${pageClasses.muted}`}>{settings.textSize}%</span>
                </div>
                <input type="range" min="100" max="200" value={settings.textSize} onChange={(e) => updateSetting("textSize", Number(e.target.value))} className="h-2 w-full cursor-pointer accent-[#3C0078]" />
              </div>

              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-base font-medium">Line Spacing</label>
                  <span className={`text-sm ${pageClasses.muted}`}>{settings.lineSpacing}%</span>
                </div>
                <input type="range" min="120" max="200" value={settings.lineSpacing} onChange={(e) => updateSetting("lineSpacing", Number(e.target.value))} className="h-2 w-full cursor-pointer accent-[#3C0078]" />
              </div>

              <ToggleRow
                icon={<Type size={18} />}
                title="Dyslexic Font"
                description="Switch to OpenDyslexic for improved readability and letter distinction."
                checked={settings.font === "OpenDyslexic"}
                onChange={(checked) => updateSetting("font", checked ? "OpenDyslexic" : "Poppins")}
              />
            </div>



            <div className={`rounded-[28px] border p-6 shadow-sm ${pageClasses.card}`}>
              <div className="mb-4 flex items-center gap-3">
                <Volume2 size={22} />
                <h2 className="text-2xl font-bold">Text to Speech</h2>
              </div>

              <div className="flex flex-col gap-3">
                <ToggleRow
                  icon={<Volume2 size={18} />}
                  title="Enable Text-to-Speech"
                  description="Read page content aloud for easier comprehension and reduced reading strain."
                  checked={settings.ttsEnabled}
                  onChange={(checked) => updateSetting("ttsEnabled", checked)}
                />
              </div>

              <button type="button" onClick={() => speak("This is a preview of the text to speech accessibility setting.", { force: true })} className={`mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 font-semibold ${pageClasses.secondaryButton}`}>
                <Volume2 size={18} />
                <span>Preview voice</span>
              </button>
            </div>

            <div className={`rounded-[28px] border p-6 shadow-sm ${pageClasses.card}`}>
              <h2 className="text-2xl font-bold">Accessibility Compliance</h2>
              <ul className={`mt-4 list-disc space-y-2 pl-5 text-sm ${pageClasses.muted}`}>
                <li>Buttons and controls use strong color contrast and visible focus states.</li>
                <li>Touch targets are sized for easier clicking and keyboard access.</li>
                <li>Dyslexic-friendly font and spacing controls improve reading comfort.</li>
                <li>Text-to-speech support is available for audio assistance.</li>
              </ul>

              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => setProfileMessage("Accessibility settings saved.")} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-[#3C0078] px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-[#2f005f]">
                  <Save size={18} />
                  <span>Save All Settings</span>
                </button>
                <button type="button" onClick={handleReset} className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 font-semibold ${pageClasses.secondaryButton}`}>
                  <RotateCcw size={18} />
                  <span>Reset to Defaults</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
