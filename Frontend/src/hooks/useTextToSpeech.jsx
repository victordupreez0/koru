import { useCallback, useEffect, useRef, useState } from "react";

const SETTINGS_STORAGE_KEY = "learnonline.settings";
const TTS_READING_STATE_KEY = "learnonline.tts.readingActive";

function getSavedTtsPreference() {
  if (typeof window === "undefined") return false;

  try {
    const saved = JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) || "null");
    return saved?.ttsEnabled === true;
  } catch {
    return false;
  }
}

function getSavedReadingState() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(TTS_READING_STATE_KEY) === "true";
}

function setSavedReadingState(value) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(TTS_READING_STATE_KEY, String(value));
  window.dispatchEvent(new Event("learnonline-tts-reading-changed"));
}

function splitTextIntoChunks(text, maxLength = 220) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const sentences = normalized.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let currentChunk = "";

  sentences.forEach((sentence) => {
    const candidate = `${currentChunk} ${sentence}`.trim();

    if (candidate.length > maxLength && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk = candidate;
    }
  });

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Text-to-speech hook – reads content aloud when assistive audio is enabled
export function useTextToSpeech(enabled) {
  const [storedEnabled, setStoredEnabled] = useState(() => getSavedTtsPreference());
  const [readingActive, setReadingActive] = useState(() => getSavedReadingState());
  const lastUtteranceRef = useRef({ text: "", time: 0 });
  const queueRef = useRef([]);
  const stoppedRef = useRef(false);
  const isEnabled = typeof enabled === "boolean" ? enabled : storedEnabled;

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const syncPreference = () => setStoredEnabled(getSavedTtsPreference());
    const syncReadingState = () => setReadingActive(getSavedReadingState());

    syncPreference();
    syncReadingState();

    window.addEventListener("storage", syncPreference);
    window.addEventListener("storage", syncReadingState);
    window.addEventListener("learnonline-settings-changed", syncPreference);
    window.addEventListener("learnonline-tts-reading-changed", syncReadingState);

    return () => {
      window.removeEventListener("storage", syncPreference);
      window.removeEventListener("storage", syncReadingState);
      window.removeEventListener("learnonline-settings-changed", syncPreference);
      window.removeEventListener("learnonline-tts-reading-changed", syncReadingState);
    };
  }, []);

  const stop = useCallback((persistState = true) => {
    stoppedRef.current = true;
    queueRef.current = [];

    if (persistState) {
      setSavedReadingState(false);
      setReadingActive(false);
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speak = useCallback(
    (text, options = {}) => {
      const { force = false } = options;

      if (!isEnabled || typeof window === "undefined" || !window.speechSynthesis || !text) return;
      if (!force && !readingActive) return;

      const now = Date.now();
      if (lastUtteranceRef.current.text === text && now - lastUtteranceRef.current.time < 1200) {
        return;
      }

      const chunks = splitTextIntoChunks(text);
      if (!chunks.length) return;

      lastUtteranceRef.current = { text, time: now };
      stoppedRef.current = false;
      queueRef.current = [...chunks];
      window.speechSynthesis.cancel();

      const speakNext = () => {
        if (stoppedRef.current || !queueRef.current.length) {
          return;
        }

        const utterance = new SpeechSynthesisUtterance(queueRef.current.shift());
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.onend = () => {
          if (!stoppedRef.current) {
            speakNext();
          }
        };

        window.speechSynthesis.speak(utterance);
      };

      speakNext();
    },
    [isEnabled, readingActive],
  );

  const startReading = useCallback(
    (text) => {
      if (!isEnabled) return;

      setSavedReadingState(true);
      setReadingActive(true);
      speak(text, { force: true });
    },
    [isEnabled, speak],
  );

  useEffect(() => {
    if (!isEnabled) {
      stop();
    }
  }, [isEnabled, stop]);

  // Cleanup – stop speech when the component using this hook unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { speak, stop, startReading, enabled: isEnabled, readingActive };
}
