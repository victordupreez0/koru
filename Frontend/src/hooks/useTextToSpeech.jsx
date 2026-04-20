import { useCallback, useEffect } from "react";

// Text-to-speech hook – reads content aloud when assistive audio is enabled
export function useTextToSpeech(enabled = false) {
  const speak = useCallback(
    (text) => {
      if (!enabled || !window.speechSynthesis) return;

      // Cancel any ongoing speech before starting a new message
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      window.speechSynthesis.speak(utterance);
    },
    [enabled],
  );

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Cleanup – stop speech when the component using this hook unmounts
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { speak, stop, enabled };
}
