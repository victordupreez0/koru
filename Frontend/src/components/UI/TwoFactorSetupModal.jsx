import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, Copy, Check } from "lucide-react";
import { setup2FA, enable2FA } from "../../services/authService";
import Alert from "./Alert";
import Button from "./Button";
import Input from "./Input";
import Modal from "./Modal";

// Modal that guides a user through scanning the QR code and verifying their
// Google Authenticator code to activate 2FA on their account.
export default function TwoFactorSetupModal({ userId, onSuccess, onClose }) {
  const [qrUri, setQrUri] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSetup() {
      try {
        const data = await setup2FA(userId);
        if (!active) return;
        setQrUri(data.qrCodeUri);
        setManualKey(data.manualEntryKey);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to start 2FA setup.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSetup();
    return () => {
      active = false;
    };
  }, [userId]);

  async function handleVerify(e) {
    e.preventDefault();
    if (code.length < 6) return;
    setError("");
    setVerifying(true);

    try {
      await enable2FA(userId, code.trim());
      onSuccess();
    } catch (err) {
      setError(err.message || "Invalid code. Please try again.");
      setCode("");
    } finally {
      setVerifying(false);
    }
  }

  function copyKey() {
    navigator.clipboard.writeText(manualKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleCodeInput(e) {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(val);
    if (error) setError("");
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Set up authenticator"
      description="Google Authenticator or any TOTP app."
    >
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <span
            aria-label="Loading setup"
            className="h-8 w-8 animate-spin rounded-full border-2 border-koru-primary/25 border-t-koru-primary"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <section className="space-y-3">
            <p className="text-koru-caption font-medium uppercase tracking-wider text-koru-on-surface-variant">
              Step 1 — Scan the QR code
            </p>

            <div className="flex flex-col items-center gap-3">
              <div className="rounded-koru-md bg-white p-3 shadow-koru-xs">
                {qrUri ? (
                  <QRCodeSVG value={qrUri} size={160} level="M" />
                ) : null}
              </div>

              <p className="text-center text-xs text-koru-on-surface-variant">
                Can&apos;t scan? Enter the key manually in your app.
              </p>

              <Button
                type="button"
                variant="outlined"
                size="sm"
                onClick={copyKey}
                startIcon={
                  copied ? <Check size={14} /> : <Copy size={14} />
                }
                className="max-w-full"
              >
                <span className="truncate font-mono text-[11px] tracking-wider">
                  {manualKey || "—"}
                </span>
                <span className="text-koru-on-surface-variant">
                  {copied ? "Copied!" : "Copy"}
                </span>
              </Button>
            </div>
          </section>

          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <p className="text-koru-caption font-medium uppercase tracking-wider text-koru-on-surface-variant">
              Step 2 — Enter the 6-digit code
            </p>

            <Input
              label="Authentication code"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={handleCodeInput}
              placeholder="000000"
              size="lg"
              className="text-center font-mono text-2xl tracking-[0.5em]"
              autoFocus
            />

            {error ? <Alert variant="error">{error}</Alert> : null}

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={verifying}
              disabled={code.length < 6}
              startIcon={<ShieldCheck size={16} />}
            >
              Enable 2FA
            </Button>
          </form>
        </div>
      )}
    </Modal>
  );
}
