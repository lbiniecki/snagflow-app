/**
 * Audio recorder hook — captures mic input and returns a Blob
 * - 10-second max recording limit (auto-stops and delivers blob)
 * - Exposes secondsLeft for UI countdown
 * - onComplete callback fires on both manual stop AND auto-stop
 */
import { useState, useRef, useCallback, useEffect } from "react";

const MAX_SECONDS = 10;

interface UseAudioRecorderReturn {
  isRecording: boolean;
  secondsLeft: number;
  startRecording: (onComplete?: (blob: Blob) => void) => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(MAX_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef<((blob: Blob) => void) | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
    };
  }, []);

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null; }
    setSecondsLeft(MAX_SECONDS);
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    clearTimers();

    return new Promise((resolve) => {
      const recorder = mediaRecorder.current;
      if (!recorder || recorder.state === "inactive") {
        setIsRecording(false);
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: recorder.mimeType });
        recorder.stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        mediaRecorder.current = null;

        // Fire onComplete callback (handles both manual stop & auto-stop)
        if (onCompleteRef.current) {
          onCompleteRef.current(blob);
          onCompleteRef.current = null;
        }

        resolve(blob);
      };

      recorder.stop();
    });
  }, [clearTimers]);

  const startRecording = useCallback(async (onComplete?: (blob: Blob) => void) => {
    try {
      setError(null);
      chunks.current = [];
      setSecondsLeft(MAX_SECONDS);
      onCompleteRef.current = onComplete || null;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      recorder.start(250);
      mediaRecorder.current = recorder;
      setIsRecording(true);

      // Countdown
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setSecondsLeft(Math.max(0, MAX_SECONDS - elapsed));
      }, 500);

      // Auto-stop after 10s
      autoStopRef.current = setTimeout(() => {
        stopRecording();
      }, MAX_SECONDS * 1000);

    } catch (err: any) {
      setError(err.message || "Microphone access denied");
      console.error("[AudioRecorder]", err);
    }
  }, [stopRecording]);

  return { isRecording, secondsLeft, startRecording, stopRecording, error };
}
