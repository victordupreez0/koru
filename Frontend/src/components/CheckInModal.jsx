import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { checkIn } from "../services/checkInService";
import { useAuth } from "../contexts/AuthContext";
import { Alert, Button, Modal } from "./UI";

export default function CheckInModal({ courseName, onClose }) {
    const { user } = useAuth();
    const [digits, setDigits]   = useState(["", "", "", ""]);
    const [error, setError]     = useState(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const inputs = useRef([]);

    useEffect(() => { inputs.current[0]?.focus(); }, []);

    const handleChange = (idx, value) => {
        const digit = value.replace(/\D/g, "").slice(-1);
        const next = [...digits];
        next[idx] = digit;
        setDigits(next);
        setError(null);
        if (digit && idx < 3) inputs.current[idx + 1]?.focus();
    };

    const handleKeyDown = (idx, e) => {
        if (e.key === "Backspace" && !digits[idx] && idx > 0) {
            inputs.current[idx - 1]?.focus();
        }
    };

    const code = digits.join("");

    // Auto-submit when all 4 digits are entered
    useEffect(() => {
        if (code.length === 4 && !loading && !success) submit(code);
    }, [code]);

    const submit = async (c) => {
        setLoading(true);
        setError(null);
        try {
            await checkIn(c, user.userId);
            setSuccess(true);
            setTimeout(onClose, 1800);
        } catch (err) {
            setError(err.message);
            setDigits(["", "", "", ""]);
            setTimeout(() => inputs.current[0]?.focus(), 50);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open
            onClose={onClose}
            ariaLabel={`Check in to ${courseName}`}
            size="sm"
            showCloseButton={false}
        >
            <div className="py-2">
                {success ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-6"
                    >
                        <div className="w-16 h-16 rounded-full bg-koru-success-soft flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-koru-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="font-display text-koru-title text-koru-on-surface mb-1">Checked In!</h2>
                        <p className="text-sm text-koru-on-surface-variant">Your attendance has been recorded.</p>
                    </motion.div>
                ) : (
                    <>
                        <div className="mb-8">
                            <span className="text-koru-caption font-medium uppercase tracking-[0.2em] text-koru-primary">Check In</span>
                            <h2 className="font-display text-koru-title text-koru-on-surface mt-1">{courseName}</h2>
                            <p className="text-sm text-koru-on-surface-variant mt-1">Enter the 4-digit code from your lecturer</p>
                        </div>

                        {/* 4-box code input */}
                        <div className="flex gap-3 justify-center mb-6">
                            {digits.map((d, idx) => (
                                <input
                                    key={idx}
                                    ref={el => (inputs.current[idx] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={d}
                                    onChange={e => handleChange(idx, e.target.value)}
                                    onKeyDown={e => handleKeyDown(idx, e)}
                                    disabled={loading}
                                    aria-label={`Digit ${idx + 1} of 4`}
                                    className={`w-14 h-14 sm:w-16 sm:h-16 text-center text-3xl font-display font-medium rounded-koru-md outline-none transition-all focus-visible:ring-2 focus-visible:ring-koru-focus
                                        ${d
                                            ? "bg-koru-primary-container text-koru-on-primary-container"
                                            : "bg-koru-surface-container-lowest text-koru-on-surface shadow-koru-xs"
                                        }
                                        focus:bg-koru-primary-container
                                        disabled:opacity-50`}
                                />
                            ))}
                        </div>

                        {error && (
                            <Alert variant="error" className="mb-4">{error}</Alert>
                        )}

                        <Button
                            size="lg"
                            fullWidth
                            onClick={() => submit(code)}
                            disabled={code.length !== 4 || loading}
                        >
                            {loading ? "Checking in…" : "Check In"}
                        </Button>
                    </>
                )}
            </div>
        </Modal>
    );
}
