"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { snags as snagsApi, transcription } from "@/lib/api";
import { useAudioRecorder } from "@/lib/useAudioRecorder";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import { compressImage } from "@/lib/compressImage";
import { savePendingSnag, type PendingSnag } from "@/lib/offlineStore";
import { ChevronLeft, Camera, Mic, X, WifiOff, Image as ImageIcon, Download } from "lucide-react";
import clsx from "clsx";

const PRIORITY_STYLES = {
  low: { active: "border-slate-500 text-slate-500 bg-slate-500/10", inactive: "border-[var(--border)] text-[var(--text3)]" },
  medium: { active: "border-warning text-warning bg-warning/10", inactive: "border-[var(--border)] text-[var(--text3)]" },
  high: { active: "border-critical text-critical bg-critical/10", inactive: "border-[var(--border)] text-[var(--text3)]" },
};

const MAX_PHOTOS = 4;

// A photo in local state is one of:
//   - kind:"existing" — already uploaded to server, has URL + slot number.
//     On save, if user removed it, we call deletePhoto(snagId, slot).
//   - kind:"new" — picked in this session, not yet uploaded. On save we
//     upload via addPhotos(snagId, files).
// In create mode (no editingSnag), only "new" photos exist.
type PhotoSlot =
  | { kind: "existing"; slot: number; url: string }
  | { kind: "new"; file: File; preview: string };

export default function CaptureScreen() {
  const {
    currentProject, currentVisit, setScreen,
    setSnags, snags, showToast,
    editingSnag, setEditingSnag,
  } = useStore();
  const { isRecording, secondsLeft, startRecording, stopRecording, error: micError } = useAudioRecorder();
  const isOnline = useOnlineStatus();

  const isEdit = !!editingSnag;

  // ── Form state, seeded from editingSnag when in edit mode ────────
  const [note, setNote] = useState(editingSnag?.note || "");
  const [location, setLocation] = useState(editingSnag?.location || "");
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    editingSnag?.priority || "medium"
  );
  const [photos, setPhotos] = useState<PhotoSlot[]>(() => {
    if (!editingSnag) return [];
    const urls = editingSnag.photo_urls ?? [];
    return urls
      .map((url, i) => (url ? { kind: "existing" as const, slot: i + 1, url } : null))
      .filter((x): x is { kind: "existing"; slot: number; url: string } => x !== null);
  });

  // Snapshot for dirty detection — captured once from initial seed
  const [originalSnapshot] = useState(() => ({
    note: editingSnag?.note || "",
    location: editingSnag?.location || "",
    priority: editingSnag?.priority || ("medium" as const),
    photoUrls: (editingSnag?.photo_urls ?? []).filter(Boolean).join("|"),
  }));

  const [saving, setSaving] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [micTarget, setMicTarget] = useState<"note" | "location" | null>(null);
  const [showDiscardPrompt, setShowDiscardPrompt] = useState(false);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // Safety net: clear editingSnag on unmount so the next Capture entry
  // isn't stuck in edit mode. Doesn't fire on setScreen-driven nav
  // (same component stays mounted), but catches logout/route changes.
  useEffect(() => {
    return () => {
      if (editingSnag) setEditingSnag(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDirty = (() => {
    if (note !== originalSnapshot.note) return true;
    if (location !== originalSnapshot.location) return true;
    if (priority !== originalSnapshot.priority) return true;
    const currentExistingKey = photos
      .filter((p): p is { kind: "existing"; slot: number; url: string } => p.kind === "existing")
      .map((p) => p.url)
      .join("|");
    if (currentExistingKey !== originalSnapshot.photoUrls) return true;
    if (photos.some((p) => p.kind === "new")) return true;
    return false;
  })();

  const photoCount = photos.length;

  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || photoCount >= MAX_PHOTOS) return;

    setCompressing(true);
    try {
      const compressed = await compressImage(file).catch(() => file);
      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(compressed);
      });
      setPhotos((prev) => [...prev, { kind: "new", file: compressed, preview }]);

      const savedKB = Math.round((file.size - compressed.size) / 1024);
      if (savedKB > 50) {
        showToast(`Compressed (saved ${savedKB > 1024 ? (savedKB / 1024).toFixed(1) + "MB" : savedKB + "KB"})`);
      }
    } finally {
      setCompressing(false);
      if (cameraRef.current) cameraRef.current.value = "";
      if (galleryRef.current) galleryRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    // Remove from local state only. If it's an "existing" photo the
    // server-side delete is queued until save, so the user can still
    // back out via the discard dialog.
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Save a photo to the user's device. Two cases:
  //   - "existing" photos have a signed Supabase Storage URL. Fetch as
  //     blob (signed URLs don't play nicely with <a download> on mobile
  //     because they're cross-origin) and save via blob URL.
  //   - "new" photos are local File objects — we already have a blob
  //     preview URL, and we know the File's name.
  //
  // On desktop we use the classic <a download> click pattern. On mobile
  // that attribute is often ignored, so we open the blob in a new tab
  // and the user saves via the browser's share sheet. Matches the
  // pattern used in reports.downloadPdf.
  const downloadPhoto = async (p: PhotoSlot, index: number) => {
    try {
      let blob: Blob;
      let filename: string;

      if (p.kind === "existing") {
        const res = await fetch(p.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        blob = await res.blob();
        // Supabase paths look like "<snag_id>/photo-<uuid>.jpg". Grab
        // the tail as a sensible filename; fall back to a generic name.
        const tail = p.url.split("?")[0].split("/").pop() || "";
        filename = tail && tail.includes(".") ? tail : `photo-${index + 1}.jpg`;
      } else {
        blob = p.file;
        filename = p.file.name || `photo-${index + 1}.jpg`;
      }

      const blobUrl = URL.createObjectURL(blob);
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        const win = window.open(blobUrl, "_blank");
        if (!win) {
          // Popup blocked — fallback to navigating the current tab so
          // the user still gets the photo rather than a silent failure.
          window.location.href = blobUrl;
        }
      } else {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }

      // Release after a comfortable window — mobile uses the URL async.
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (err: any) {
      showToast(`Could not download photo: ${err.message || err}`);
    }
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

  // ── Navigation helpers ─────────────────────────────────────────────
  const navigateBackToItems = () => {
    setEditingSnag(null);
    setScreen("snags");
  };

  // ── Save handlers ──────────────────────────────────────────────────
  const handleSaveEdit = async (): Promise<boolean> => {
    if (!editingSnag) return false;
    if (!note.trim()) {
      showToast("Please add a description before saving this item.");
      return false;
    }
    setSaving(true);
    try {
      // 1. Text fields first — cheap, surfaces errors fast
      await snagsApi.update(editingSnag.id, {
        note,
        location: location || undefined,
        priority,
      });

      // 2. Photo reconciliation: delete slots the user removed
      const originalSlots: number[] = (editingSnag.photo_urls ?? [])
        .map((url, i) => (url ? i + 1 : 0))
        .filter((s) => s > 0);
      const keptSlots = photos
        .filter((p): p is { kind: "existing"; slot: number; url: string } => p.kind === "existing")
        .map((p) => p.slot);
      const removedSlots = originalSlots.filter((s) => !keptSlots.includes(s));

      for (const slot of removedSlots) {
        try {
          await snagsApi.deletePhoto(editingSnag.id, slot);
        } catch {
          // Non-fatal — continue with the rest of the save
        }
      }

      // 3. New photos — upload in one batch
      const newFiles = photos
        .filter((p): p is { kind: "new"; file: File; preview: string } => p.kind === "new")
        .map((p) => p.file);
      if (newFiles.length > 0) {
        await snagsApi.addPhotos(editingSnag.id, newFiles);
      }

      // 4. Refresh the list — canonical URLs beat optimistic merging
      const refreshed = await snagsApi.list(currentProject!.id, currentVisit?.id);
      setSnags(refreshed);

      showToast("Item updated");
      navigateBackToItems();
      return true;
    } catch (err: any) {
      showToast(err.message || "Failed to save changes");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCreate = async () => {
    if (!currentProject) {
      showToast("No project selected");
      return;
    }
    if (!note.trim()) {
      showToast("Please add a description before saving this item.");
      return;
    }
    setSaving(true);

    if (!navigator.onLine) {
      await saveOffline();
      setSaving(false);
      return;
    }

    try {
      const newFiles = photos
        .filter((p): p is { kind: "new"; file: File; preview: string } => p.kind === "new")
        .map((p) => p.file);

      const createPromise = snagsApi.create({
        project_id: currentProject.id,
        visit_id: currentVisit?.id,
        note,
        location: location || undefined,
        priority,
        photo: newFiles[0],
        photo2: newFiles[1],
        photo3: newFiles[2],
        photo4: newFiles[3],
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 8000)
      );
      const created = (await Promise.race([createPromise, timeoutPromise])) as any;
      setSnags([created, ...snags]);
      showToast("Item saved!");
      setScreen("snags");
    } catch {
      await saveOffline();
    } finally {
      setSaving(false);
    }
  };

  const saveOffline = async () => {
    try {
      const newFiles = photos
        .filter((p): p is { kind: "new"; file: File; preview: string } => p.kind === "new")
        .map((p) => p.file);
      const pending: PendingSnag = {
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        project_id: currentProject!.id,
        visit_id: currentVisit?.id,
        note,
        location: location || undefined,
        priority,
        photos: newFiles,
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

  const handleSubmit = () => (isEdit ? handleSaveEdit() : handleSaveCreate());

  // ── Back navigation — prompt only when editing with unsaved changes ──
  const handleBack = () => {
    if (isEdit && isDirty) {
      setShowDiscardPrompt(true);
      return;
    }
    navigateBackToItems();
  };

  const handleDiscardAndExit = () => {
    setShowDiscardPrompt(false);
    navigateBackToItems();
  };

  const handleSaveFromPrompt = async () => {
    setShowDiscardPrompt(false);
    await handleSaveEdit();
  };

  // ── Dynamic labels ─────────────────────────────────────────────────
  const screenTitle = isEdit ? "Edit Item" : "New Item";
  const saveButtonLabel = saving
    ? "Saving…"
    : !isOnline && !isEdit
      ? "Save Offline"
      : isEdit
        ? "Save Changes"
        : "Save Item";

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[var(--bg)] border-b border-[var(--border)] px-4 py-3 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="p-2 rounded-full hover:bg-[var(--bg3)] text-[var(--text2)]"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-semibold flex-1 text-center text-[var(--text-primary)]">
          {screenTitle}
        </h2>
        {!isOnline && (
          <span className="flex items-center gap-1 text-xs text-warning font-semibold">
            <WifiOff className="w-3.5 h-3.5" /> Offline
          </span>
        )}
        {isOnline && <div className="w-9" />}
      </div>

      <div className="px-5 py-4 pb-8">
        {/* Offline notices — differ by mode */}
        {!isOnline && !isEdit && (
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 mb-4 text-center">
            <p className="text-xs text-warning font-semibold">No connection — item will be saved locally and synced later</p>
          </div>
        )}
        {!isOnline && isEdit && (
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 mb-4 text-center">
            <p className="text-xs text-warning font-semibold">No connection — you cannot edit this item until you're back online</p>
          </div>
        )}

        {/* Photos (up to 4) */}
        <div className="mb-5 animate-slide-up">
          <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider block mb-2">
            Photos ({photoCount}/{MAX_PHOTOS})
          </label>
          <div className="grid grid-cols-2 gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[var(--bg3)]">
                <img
                  src={p.kind === "existing" ? p.url : p.preview}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Action buttons, stacked top-right. Download first, then remove. */}
                <div className="absolute top-1.5 right-1.5 flex gap-1.5">
                  <button
                    onClick={() => downloadPhoto(p, i)}
                    className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/75 transition-colors"
                    aria-label={`Download photo ${i + 1}`}
                    type="button"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removePhoto(i)}
                    className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/75 transition-colors"
                    aria-label={`Remove photo ${i + 1}`}
                    type="button"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="absolute bottom-1.5 left-1.5 text-xs font-bold text-white bg-black/50 px-1.5 py-0.5 rounded">
                  {i + 1}
                </span>
              </div>
            ))}

            {photoCount < MAX_PHOTOS && (
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
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--surface)] text-[var(--text2)] text-xs font-semibold hover:text-[var(--text-primary)] transition-colors"
                    >
                      <ImageIcon className="w-4 h-4" />
                      From Gallery
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleAddPhoto}
          />
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
          <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider block mb-2">Description</label>
          <div className="flex gap-3 items-start">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Describe the item… or tap the mic to dictate"
              rows={4}
              className="flex-1 px-3.5 py-3 bg-[var(--bg2)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors resize-none leading-relaxed"
            />
            <button
              onClick={() => handleMic("note", setNote)}
              disabled={transcribing || (isRecording && micTarget !== "note") || !isOnline}
              className={clsx(
                "w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                isRecording && micTarget === "note"
                  ? "bg-critical text-white animate-recording"
                  : "bg-[var(--surface)] text-[var(--text2)] hover:text-[var(--text-primary)] hover:bg-[var(--bg3)]",
                !isOnline && "opacity-30"
              )}
              title={!isOnline ? "Voice requires connection" : ""}
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
          {isRecording && micTarget === "note" && (
            <p className="text-xs text-critical font-semibold mt-1.5">● Recording… {secondsLeft}s</p>
          )}
          {transcribing && (
            <p className="text-xs text-[var(--text2)] mt-1.5">Transcribing audio…</p>
          )}
          {micError && (
            <p className="text-xs text-critical mt-1.5">{micError}</p>
          )}
        </div>

        {/* Location */}
        <div className="mb-5 animate-slide-up delay-100">
          <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider block mb-2">Location</label>
          <div className="flex gap-2 items-center">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Unit 3 – Kitchen"
              className="flex-1 px-3.5 py-3 bg-[var(--bg2)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
            />
            <button
              onClick={() => handleMic("location", setLocation)}
              disabled={transcribing || (isRecording && micTarget !== "location") || !isOnline}
              className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                isRecording && micTarget === "location"
                  ? "bg-critical text-white animate-recording"
                  : "bg-[var(--surface)] text-[var(--text2)] hover:text-[var(--text-primary)] hover:bg-[var(--bg3)]",
                !isOnline && "opacity-30"
              )}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
          {isRecording && micTarget === "location" && (
            <p className="text-xs text-critical font-semibold mt-1.5">● Recording… {secondsLeft}s</p>
          )}
        </div>

        {/* Priority */}
        <div className="mb-8 animate-slide-up delay-150">
          <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider block mb-2">Priority</label>
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
          disabled={saving || (isEdit && !isOnline)}
          className="w-full h-[52px] bg-brand hover:bg-brand-light text-white text-base font-semibold rounded-xl transition-all disabled:opacity-50 animate-slide-up delay-200"
        >
          {saveButtonLabel}
        </button>
      </div>

      {/* ── 3-button dialog for unsaved-changes on back ─────────────── */}
      {showDiscardPrompt && (
        <div
          className="fixed inset-0 bg-black/60 z-[70] flex items-end sm:items-center justify-center animate-fade-in"
          onClick={() => setShowDiscardPrompt(false)}
        >
          <div
            className="w-full max-w-[420px] bg-[var(--bg2)] rounded-t-2xl sm:rounded-2xl p-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Unsaved changes</h3>
            <p className="text-sm text-[var(--text2)] mb-5 leading-relaxed">
              You've made changes to this item. What would you like to do?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSaveFromPrompt}
                disabled={saving}
                className="w-full h-11 bg-brand hover:bg-brand-light text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button
                onClick={handleDiscardAndExit}
                className="w-full h-11 bg-critical/10 text-critical hover:bg-critical/20 text-sm font-semibold rounded-lg transition-all"
              >
                Discard
              </button>
              <button
                onClick={() => setShowDiscardPrompt(false)}
                className="w-full h-11 text-[var(--text2)] hover:text-[var(--text-primary)] text-sm font-semibold rounded-lg transition-all"
              >
                Keep editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
