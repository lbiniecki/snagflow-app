"use client";

import { useState, useRef } from "react";
import { useStore } from "@/lib/store";
import { snags as snagsApi, transcription } from "@/lib/api";
import { useAudioRecorder } from "@/lib/useAudioRecorder";
import { ChevronLeft, Camera, Mic, X } from "lucide-react";
import clsx from "clsx";

const PRIORITY_STYLES = {
  low: { active: "border-gray-400 text-gray-400 bg-gray-400/10", inactive: "border-[var(--border)] text-[var(--text3)]" },
  medium: { active: "border-yellow-400 text-yellow-400 bg-yellow-400/10", inactive: "border-[var(--border)] text-[var(--text3)]" },
  high: { active: "border-red-400 text-red-400 bg-red-400/10", inactive: "border-[var(--border)] text-[var(--text3)]" },
};

export default function CaptureScreen() {
  const { currentProject, setScreen, setSnags, snags, showToast } = useStore();
  const { isRecording, startRecording, stopRecording, error: micError } = useAudioRecorder();

  const [note, setNote] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleMic = async () => {
    if (isRecording) {
      const blob = await stopRecording();
      if (blob) {
        setTranscribing(true);
        try {
          const res = await transcription.transcribe(blob);
          setNote((prev) => (prev ? prev + " " : "") + res.text);
          showToast("Voice transcribed");
        } catch (err: any) {
          showToast("Transcription failed: " + (err.message || ""));
        } finally {
          setTranscribing(false);
        }
      }
    } else {
      await startRecording();
    }
  };

  const handleSubmit = async () => {
    if (!note.trim() || !currentProject) return;
    setSaving(true);
    try {
      const created = await snagsApi.create({
        project_id: currentProject.id,
        note,
        location: location || undefined,
        priority,
        photo: photo || undefined,
      });
      setSnags([created, ...snags]);
      showToast("Snag saved!");
      setScreen("snags");
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[var(--bg)] border-b border-[var(--border)] px-4 py-3 flex items-center gap-3">
        <button onClick={() => setScreen("snags")} className="p-2 rounded-full hover:bg-[var(--bg3)] text-[var(--text2)]">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-semibold flex-1 text-center">New Snag</h2>
        <div className="w-9" />
      </div>

      {/* Content */}
      <div className="px-5 py-4 pb-8">
        {/* Photo */}
        <div className="mb-5 animate-slide-up">
          <label className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-wider block mb-2">Photo</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="w-full aspect-[4/3] rounded-xl bg-[var(--bg3)] border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand hover:bg-brand/5 transition-all overflow-hidden relative"
          >
            {photoPreview ? (
              <>
                <img src={photoPreview} alt="Captured" className="w-full h-full object-cover" />
                <button
                  onClick={(e) => { e.stopPropagation(); removePhoto(); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Camera className="w-8 h-8 text-[var(--text3)]" />
                <span className="text-xs text-[var(--text3)]">Tap to take photo or upload</span>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhoto}
          />
        </div>

        {/* Note + Mic */}
        <div className="mb-5 animate-slide-up delay-50">
          <label className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-wider block mb-2">Description</label>
          <div className="flex gap-3 items-start">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Describe the snag… or tap the mic to dictate"
              rows={4}
              className="flex-1 px-3.5 py-3 bg-[var(--bg2)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors resize-none leading-relaxed"
            />
            <button
              onClick={handleMic}
              disabled={transcribing}
              className={clsx(
                "w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                isRecording
                  ? "bg-red-500 text-white animate-recording"
                  : "bg-[var(--surface)] text-[var(--text2)] hover:text-white hover:bg-[var(--bg3)]"
              )}
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
          {isRecording && (
            <p className="text-xs text-red-400 font-semibold mt-1.5">● Recording… tap mic to stop</p>
          )}
          {transcribing && (
            <p className="text-xs text-[var(--text2)] mt-1.5">Transcribing audio…</p>
          )}
          {micError && (
            <p className="text-xs text-red-400 mt-1.5">{micError}</p>
          )}
        </div>

        {/* Location */}
        <div className="mb-5 animate-slide-up delay-100">
          <label className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-wider block mb-2">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Unit 3 – Kitchen"
            className="w-full px-3.5 py-3 bg-[var(--bg2)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
          />
        </div>

        {/* Priority */}
        <div className="mb-8 animate-slide-up delay-150">
          <label className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-wider block mb-2">Priority</label>
          <div className="flex gap-2">
            {(["low", "medium", "high"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={clsx(
                  "flex-1 py-3 rounded-lg text-xs font-semibold border-2 transition-all capitalize",
                  priority === p ? PRIORITY_STYLES[p].active : PRIORITY_STYLES[p].inactive,
                  priority !== p && "bg-[var(--bg2)]"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={saving || !note.trim()}
          className="w-full h-[52px] bg-brand hover:bg-brand-light text-white text-base font-semibold rounded-xl transition-all disabled:opacity-50 animate-slide-up delay-200"
        >
          {saving ? "Saving…" : "Save Snag"}
        </button>
      </div>
    </div>
  );
}
