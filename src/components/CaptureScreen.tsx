"use client";

import { useState, useRef } from "react";
import { useStore } from "@/lib/store";
import { snags as snagsApi, transcription } from "@/lib/api";
import { useAudioRecorder } from "@/lib/useAudioRecorder";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import { compressImage } from "@/lib/compressImage";
import { savePendingSnag, type PendingSnag } from "@/lib/offlineStore";
import { ChevronLeft, Camera, Mic, X, Plus, WifiOff, Image as ImageIcon } from "lucide-react";
import clsx from "clsx";

const PRIORITY_STYLES = {
  low: { active: "border-gray-400 text-gray-400 bg-gray-400/10", inactive: "border-[var(--border)] text-[var(--text3)]" },
  medium: { active: "border-yellow-400 text-yellow-400 bg-yellow-400/10", inactive: "border-[var(--border)] text-[var(--text3)]" },
  high: { active: "border-red-400 text-red-400 bg-red-400/10", inactive: "border-[var(--border)] text-[var(--text3)]" },
};

const MAX_PHOTOS = 4;

interface PhotoSlot {
  file: File;
  preview: string;
}

export default function CaptureScreen() {
  const { currentProject, currentVisit, setScreen, setSnags, snags, showToast } = useStore();
  const { isRecording, secondsLeft, startRecording, stopRecording, error: micError } = useAudioRecorder();
  const isOnline = useOnlineStatus();

  const [note, setNote] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [photos, setPhotos] = useState<PhotoSlot[]>([]);
  const [saving, setSaving] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [micTarget, setMicTarget] = useState<"note" | "location" | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || photos.length >= MAX_PHOTOS) return;

    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(compressed);
      });

      setPhotos((prev) => [...prev, { file: compressed, preview }]);

      const savedKB = Math.round((file.size - compressed.size) / 1024);
      if (savedKB > 50) {
        showToast(`Compressed (saved ${savedKB > 1024 ? (savedKB / 1024).toFixed(1) + "MB" : savedKB + "KB"})`);
      }
    } catch {
      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(file);
      });
      setPhotos((prev) => [...prev, { file, preview }]);
    } finally {
      setCompressing(false);
      if (cameraRef.current) cameraRef.current.value = "";
      if (galleryRef.current) galleryRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMic = async (
    target: "note" | "location",
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (isRecording) {
      stopRecording();
    } else {
      setMicTarget(target);
      await startRecording(async (blob) => {
        setTranscribing(true);
        try {
          const res = await transcription.transcribe(blob);
          setter((prev) => (prev ? prev + " " : "") + res.text);
          showToast("Voice transcribed");
        } catch (err: any) {
          showToast("Transcription failed: " + (err.message || ""));
        } finally {
          setTranscribing(false);
          setMicTarget(null);
        }
      });
    }
  };

  const handleSubmit = async () => {
    if (!currentProject) {
      showToast("No project selected");
      return;
    }
    // Polite validation — previously we early-returned silently, which made
    // the Save button feel broken when the user forgot to fill in a description.
    if (!note.trim()) {
      showToast("Please add a description before saving this item.");
      return;
    }
    setSaving(true);

    // Check connectivity directly (hook state can lag)
    if (!navigator.onLine) {
      await saveOffline();
      setSaving(false);
      return;
    }

    // Online: try upload with 8s timeout
    try {
      const createPromise = snagsApi.create({
        project_id: currentProject.id,
        visit_id: currentVisit?.id,
        note,
        location: location || undefined,
        priority,
        photo: photos[0]?.file,
        photo2: photos[1]?.file,
        photo3: photos[2]?.file,
        photo4: photos[3]?.file,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 8000)
      );

      const created = await Promise.race([createPromise, timeoutPromise]) as any;
      setSnags([created, ...snags]);
      showToast("Item saved!");
      setScreen("snags");
    } catch (err: any) {
      // Upload failed or timed out — save offline
      await saveOffline();
    } finally {
      setSaving(false);
    }
  };

  const saveOffline = async () => {
    try {
      const photoBlobs: Blob[] = photos.map((p) => p.file);
      const pending: PendingSnag = {
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        project_id: currentProject!.id,
        visit_id: currentVisit?.id,
        note,
        location: location || undefined,
        priority,
        photos: photoBlobs,
        created_at: new Date().toISOString(),
        status: "pending",
        retries: 0,
      };
      await savePendingSnag(pending);
      showToast("Saved offline — will sync when connected");
      setScreen("snags");
    } catch (err: any) {
      showToast("Failed to save: " + (err.message || ""));
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
        {!isOnline && (
          <span className="flex items-center gap-1 text-[10px] text-red-400 font-semibold">
            <WifiOff className="w-3.5 h-3.5" /> Offline
          </span>
        )}
        {isOnline && <div className="w-9" />}
      </div>

      <div className="px-5 py-4 pb-8">
        {/* Offline notice */}
        {!isOnline && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-center">
            <p className="text-xs text-red-400 font-semibold">No connection — snag will be saved locally and synced later</p>
          </div>
        )}

        {/* Photos (up to 4) */}
        <div className="mb-5 animate-slide-up">
          <label className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-wider block mb-2">
            Photos ({photos.length}/{MAX_PHOTOS})
          </label>
          <div className="grid grid-cols-2 gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[var(--bg3)]">
                <img src={p.preview} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded">
                  {i + 1}
                </span>
              </div>
            ))}

            {photos.length < MAX_PHOTOS && (
              <div className="aspect-[4/3] rounded-xl bg-[var(--bg3)] border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-2">
                {compressing ? (
                  <span className="text-xs text-[var(--text3)]">Compressing…</span>
                ) : (
                  <>
                    <button
                      onClick={() => cameraRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand/10 text-brand text-xs font-semibold hover:bg-brand/20 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      Take Photo
                    </button>
                    <button
                      onClick={() => galleryRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--surface)] text-[var(--text2)] text-xs font-semibold hover:text-white transition-colors"
                    >
                      <ImageIcon className="w-4 h-4" />
                      From Gallery
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          {/* Camera input — capture="environment" forces rear camera on mobile */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleAddPhoto}
          />
          {/* Gallery input — no capture attr, opens file/gallery picker */}
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAddPhoto}
          />
        </div>

        {/* Note + Mic */}
        <div className="mb-5 animate-slide-up delay-50">
          <label className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-wider block mb-2">Description</label>
          <div className="flex gap-3 items-start">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Describe the item… or tap the mic to dictate"
              rows={4}
              className="flex-1 px-3.5 py-3 bg-[var(--bg2)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors resize-none leading-relaxed"
            />
            <button
              onClick={() => handleMic("note", setNote)}
              disabled={transcribing || (isRecording && micTarget !== "note") || !isOnline}
              className={clsx(
                "w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                isRecording && micTarget === "note"
                  ? "bg-red-500 text-white animate-recording"
                  : "bg-[var(--surface)] text-[var(--text2)] hover:text-white hover:bg-[var(--bg3)]",
                !isOnline && "opacity-30"
              )}
              title={!isOnline ? "Voice requires connection" : ""}
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
          {isRecording && micTarget === "note" && (
            <p className="text-xs text-red-400 font-semibold mt-1.5">● Recording… {secondsLeft}s</p>
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
          <div className="flex gap-2 items-center">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Unit 3 – Kitchen"
              className="flex-1 px-3.5 py-3 bg-[var(--bg2)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
            />
            <button
              onClick={() => handleMic("location", setLocation)}
              disabled={transcribing || (isRecording && micTarget !== "location") || !isOnline}
              className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                isRecording && micTarget === "location"
                  ? "bg-red-500 text-white animate-recording"
                  : "bg-[var(--surface)] text-[var(--text2)] hover:text-white hover:bg-[var(--bg3)]",
                !isOnline && "opacity-30"
              )}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
          {isRecording && micTarget === "location" && (
            <p className="text-xs text-red-400 font-semibold mt-1.5">● Recording… {secondsLeft}s</p>
          )}
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
          disabled={saving}
          className="w-full h-[52px] bg-brand hover:bg-brand-light text-white text-base font-semibold rounded-xl transition-all disabled:opacity-50 animate-slide-up delay-200"
        >
          {saving ? "Saving…" : !isOnline ? "Save Offline" : "Save Item"}
        </button>
      </div>
    </div>
  );
}
