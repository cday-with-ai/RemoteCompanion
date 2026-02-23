import { useState, useCallback, useRef } from 'react';
import { speakText, stopSpeaking } from '../services/speech';

export function useSpeech() {
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const ttsEnabledRef = useRef(false);
  const spokenIds = useRef(new Set<string>());

  const toggleTts = useCallback(() => {
    const next = !ttsEnabledRef.current;
    ttsEnabledRef.current = next;
    setTtsEnabled(next);

    if (next) {
      // Speak confirmation so user knows TTS is working
      speakText('Speech enabled');
    } else {
      stopSpeaking();
      setIsSpeaking(false);
    }
  }, []);

  const speakResponse = useCallback(
    async (id: string, text: string) => {
      if (!ttsEnabledRef.current) return;
      if (spokenIds.current.has(id)) return;
      spokenIds.current.add(id);

      setIsSpeaking(true);
      await speakText(text);
      setIsSpeaking(false);
    },
    [],
  );

  const stop = useCallback(() => {
    stopSpeaking();
    setIsSpeaking(false);
  }, []);

  return { ttsEnabled, isSpeaking, toggleTts, speakResponse, stop };
}
