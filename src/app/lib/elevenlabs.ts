const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY?.trim();
const VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID?.trim();

const LANG_BCP47: Record<string, string> = {
  en: 'en-US', es: 'es-ES', zh: 'zh-CN',
  vi: 'vi-VN', ar: 'ar-SA', fr: 'fr-FR',
};

export interface SpeechController {
  stop: () => void;
}

/**
 * Speak text using ElevenLabs (same voice, correct language accent).
 * Automatically falls back to the browser Web Speech API if ElevenLabs
 * is unavailable or returns an error.
 *
 * @param onStart  called once audio actually begins playing
 * @param onEnd    called when audio finishes or is stopped naturally
 */
export async function speak(
  text: string,
  langCode = 'en',
  onStart: () => void,
  onEnd: () => void,
): Promise<SpeechController> {

  // ── Try ElevenLabs ──────────────────────────────────────────────────────────
  if (API_KEY && VOICE_ID) {
    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          method: 'POST',
          headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',   // stable multilingual model; auto-detects language from text
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        },
      );

      if (res.ok) {
        const url = URL.createObjectURL(await res.blob());
        const audio = new Audio(url);

        const cleanup = () => URL.revokeObjectURL(url);
        audio.onended = () => { cleanup(); onEnd(); };
        audio.onerror = () => { cleanup(); onEnd(); };

        await audio.play();
        onStart();

        return {
          stop: () => {
            audio.pause();
            cleanup();
          },
        };
      }

      console.warn(`ElevenLabs returned ${res.status} — falling back to Web Speech API`);
    } catch (e) {
      console.warn('ElevenLabs request failed — falling back to Web Speech API', e);
    }
  }

  // ── Web Speech API fallback ─────────────────────────────────────────────────
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = LANG_BCP47[langCode] ?? 'en-US';
  utterance.rate = 0.92;
  utterance.onstart = () => onStart();
  utterance.onend = () => onEnd();
  utterance.onerror = () => onEnd();
  window.speechSynthesis.speak(utterance);

  return { stop: () => window.speechSynthesis.cancel() };
}
