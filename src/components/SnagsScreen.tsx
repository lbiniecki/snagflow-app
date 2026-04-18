"use client";

import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { snags as snagsApi, reports as reportsApi, transcription, siteVisits as visitsApi } from "@/lib/api";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import { getPendingForVisit, getPendingSnags, type PendingSnag } from "@/lib/offlineStore";
import {
  ChevronLeft, FileText, Plus, Pencil, Trash2, Camera,
  MapPin, Download, X, Mic, WifiOff, CloudUpload, Mail,
  Image as ImageIcon,
} from "lucide-react";
import clsx from "clsx";
import BottomNav from "./BottomNav";
import { useAudioRecorder } from "@/lib/useAudioRecorder";
import { compressImage } from "@/lib/compressImage";
import { useConfirm } from "./ConfirmDialog";

const STATUS_COLORS = { open: "text-warning bg-warning/10", closed: "text-success bg-success/10" };
const PRIORITY_COLORS = { high: "text-critical bg-critical/10", medium: "text-warning bg-warning/10", low: "text-slate-500 bg-slate-500/10" };

export default function SnagsScreen() {
  const {
    currentProject, setScreen, snags, setSnags,
    filter, setFilter, showToast, loading, setLoading,
    currentVisit,
  } = useStore();

  const [showReport, setShowReport] = useState(false);
  const [editSnag, setEditSnag] = useState<typeof snags[0] | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editLoc, setEditLoc] = useState("");
  const [editPri, setEditPri] = useState<"low" | "medium" | "high">("medium");
  // Newly-picked photos to attach on save, pre-compressed
  const [editNewPhotos, setEditNewPhotos] = useState<File[]>([]);
  const [editUploadingPhotos, setEditUploadingPhotos] = useState(false);
  // When a slot number is here, that slot's X is showing a loading indicator
  // and its delete request is in flight. Used only for UI feedback.
  const [editDeletingSlot, setEditDeletingSlot] = useState<number | null>(null);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);
  const editGalleryRef = useRef<HTMLInputElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [weather, setWeather] = useState("");
  const [visitNo, setVisitNo] = useState("");
  const [reportTranscribing, setReportTranscribing] = useState(false);
  const [reportMicTarget, setReportMicTarget] = useState<"weather" | "visitNo" | null>(null);
  const { isRecording, secondsLeft, startRecording, stopRecording, error: micError } = useAudioRecorder();
  const confirm = useConfirm();

  // Email-report modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const closePhotoRef = useRef<HTMLInputElement>(null);
  const [closingSnagId, setClosingSnagId] = useState<string | null>(null);
  const [pendingSnags, setPendingSnags] = useState<PendingSnag[]>([]);
  const isOnline = useOnlineStatus();

  // Fetch snags (scoped to current visit if available)
  useEffect(() => {
    if (!currentProject) return;
    async function load() {
      setLoading(true);
      try {
        if (navigator.onLine) {
          const data = await snagsApi.list(currentProject!.id, currentVisit?.id);
          setSnags(data);
        }
      } catch (err) {
        console.error("Failed to load snags (offline?):", err);
      } finally {
        setLoading(false);
      }
      // Always load pending offline snags
      try {
        const pending = currentVisit
          ? await getPendingForVisit(currentVisit.id)
          : await getPendingSnags();
        setPendingSnags(pending.filter((p) => p.project_id === currentProject!.id));
      } catch {}
    }
    load();
  }, [currentProject, currentVisit, setSnags, setLoading]);

  const filtered = filter === "all" ? snags : snags.filter((s) => s.status === filter);
  const openCount = snags.filter((s) => s.status === "open").length;
  const closedCount = snags.filter((s) => s.status === "closed").length;

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === "open" ? "closed" : "open";
    try {
      await snagsApi.update(id, { status: newStatus as any });
      setSnags(snags.map((s) => s.id === id ? { ...s, status: newStatus as any } : s));
      showToast(`Item ${newStatus}`);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const deleteSnag = async (s: typeof snags[0]) => {
    const label = s.note.trim().slice(0, 60) || "this item";
    const ok = await confirm({
      title: "Delete this item?",
      message: `"${label}"${s.note.trim().length > 60 ? "…" : ""} and any photos attached to it will be permanently removed. This can't be undone.`,
      confirmLabel: "Delete item",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await snagsApi.delete(s.id);
      setSnags(snags.filter((x) => x.id !== s.id));
      showToast("Item deleted");
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const startCloseWithPhoto = (id: string) => {
    setClosingSnagId(id);
    closePhotoRef.current?.click();
  };

  const handleClosePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !closingSnagId) return;

    try {
      showToast("Compressing photo…");
      const compressed = await compressImage(file).catch(() => file);
      await snagsApi.closeWithPhoto(closingSnagId, compressed);
      setSnags(snags.map((s) => s.id === closingSnagId ? { ...s, status: "closed" as const } : s));
      showToast("Item closed with photo");
    } catch (err: any) {
      showToast(err.message || "Failed to close item");
    } finally {
      setClosingSnagId(null);
      if (closePhotoRef.current) closePhotoRef.current.value = "";
    }
  };

  const saveEdit = async () => {
    if (!editSnag) return;
    try {
      // 1. Patch text fields first — cheap, can fail fast
      await snagsApi.update(editSnag.id, { note: editNote, location: editLoc, priority: editPri });

      // 2. If the user staged new photos, upload them. We do this AFTER the
      // text patch so a failed photo upload doesn't lose the text edits.
      // The response carries the updated photo_count AND photo_urls, so we
      // use it to keep the list row in sync.
      let serverSnag = editSnag;
      if (editNewPhotos.length > 0) {
        setEditUploadingPhotos(true);
        try {
          serverSnag = await snagsApi.addPhotos(editSnag.id, editNewPhotos);
        } finally {
          setEditUploadingPhotos(false);
        }
      }

      // 3. Merge our text-edit changes into whatever the server returned.
      // `serverSnag` may be from addPhotos (has fresh photo_urls/count) or
      // may still be the pre-edit editSnag (if no new photos were staged).
      // Either way we overlay the text fields we just saved.
      const merged = {
        ...serverSnag,
        note: editNote,
        location: editLoc,
        priority: editPri,
      };
      setSnags(snags.map((s) => (s.id === editSnag.id ? merged : s)));

      setEditSnag(null);
      setEditNewPhotos([]);
      if (editPhotoInputRef.current) editPhotoInputRef.current.value = "";
      if (editGalleryRef.current) editGalleryRef.current.value = "";
      showToast(editNewPhotos.length > 0 ? "Item updated with new photos" : "Item updated");
    } catch (err: any) {
      showToast(err.message);
    }
  };

  /**
   * File picker handler for the edit-modal photo section. Compresses each
   * selected image and appends to editNewPhotos, respecting the per-snag
   * 4-photo cap.
   */
  const handleEditPhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !editSnag) return;
    // Derive existing count from photo_urls so it stays accurate after
    // in-session deletions (handleDeleteExistingPhoto updates editSnag).
    const existing = (editSnag.photo_urls ?? []).filter(Boolean).length;
    const remaining = 4 - existing - editNewPhotos.length;
    if (remaining <= 0) {
      showToast("This item already has 4 photos");
      return;
    }
    const toAdd = files.slice(0, remaining);
    if (toAdd.length < files.length) {
      showToast(`Only ${toAdd.length} photo(s) added — 4-photo limit`);
    }
    try {
      const compressed = await Promise.all(
        toAdd.map((f) => compressImage(f).catch(() => f))
      );
      setEditNewPhotos((prev) => [...prev, ...compressed]);
    } catch {
      showToast("Failed to prepare photos");
    } finally {
      // Reset the inputs so the same files can be re-picked if the user removes and re-adds
      if (editPhotoInputRef.current) editPhotoInputRef.current.value = "";
      if (editGalleryRef.current) editGalleryRef.current.value = "";
    }
  };

  /**
   * Remove an already-saved photo from a snag. Slot is 1-based (matches the
   * backend endpoint's URL param).
   *
   * Policy decision — we delete immediately instead of queuing the delete
   * for the next Save. That matches the instant-remove behaviour for pending
   * (new) photos and how mobile users expect an X button to work. The
   * confirm dialog would be overkill for something that's one tap to
   * restage if mistaken.
   */
  const handleDeleteExistingPhoto = async (slot: number) => {
    if (!editSnag || editDeletingSlot !== null) return;

    const ok = await confirm({
      title: "Remove this photo?",
      message: "The photo will be permanently deleted from this item. You can always add a new one.",
      confirmLabel: "Remove photo",
      tone: "destructive",
    });
    if (!ok) return;

    setEditDeletingSlot(slot);
    try {
      const updated = await snagsApi.deletePhoto(editSnag.id, slot);
      setEditSnag(updated);
      setSnags(snags.map((s) => s.id === updated.id ? updated : s));
      showToast("Photo removed");
    } catch (err: any) {
      showToast(err?.message || "Failed to remove photo");
    } finally {
      setEditDeletingSlot(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (!currentProject) return;
    setDownloading(true);
    try {
      await reportsApi.downloadPdf(currentProject.id, {
        visitId: currentVisit?.id,
        weather,
        visitNo: visitNo || String(currentVisit?.visit_no || ""),
      });
      showToast("Report downloaded");
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setDownloading(false);
    }
  };

  /**
   * Parse a free-form text field into a list of recipient emails.
   * Accepts commas, semicolons, whitespace, or newlines as separators.
   */
  const parseRecipients = (raw: string): string[] => {
    return raw
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const handleEmailReport = async () => {
    if (!currentProject) return;
    const recipients = parseRecipients(emailRecipients);
    if (recipients.length === 0) {
      showToast("Add at least one recipient");
      return;
    }
    // Very light client-side sanity check — backend does the real validation
    const bad = recipients.find((r) => !r.includes("@") || r.length < 5);
    if (bad) {
      showToast(`Invalid email: ${bad}`);
      return;
    }

    setSendingEmail(true);
    try {
      const res = await reportsApi.emailReport(currentProject.id, {
        to: recipients,
        visitId: currentVisit?.id,
        weather,
        visitNo: visitNo || String(currentVisit?.visit_no || ""),
        message: emailMessage.trim() || undefined,
      });

      const countLabel = `${recipients.length} recipient${recipients.length === 1 ? "" : "s"}`;
      const modeLabel =
        res.mode === "link"
          ? ` (${res.size_mb} MB — sent as download link)`
          : ` (${res.size_mb} MB — attached)`;
      showToast(`Report sent to ${countLabel}${modeLabel}`);

      // Clear state on success
      setShowEmailModal(false);
      setEmailRecipients("");
      setEmailMessage("");
    } catch (err: any) {
      // Backend surfaces plan-gate failures with a 403 + clear message
      showToast(err.message || "Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleReportMic = async (
    target: "weather" | "visitNo",
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    if (isRecording) {
      stopRecording();
    } else {
      setReportMicTarget(target);
      await startRecording(async (blob) => {
        setReportTranscribing(true);
        try {
          const res = await transcription.transcribe(blob);
          setter((prev) => (prev ? prev + " " : "") + res.text);
          showToast("Voice transcribed");
        } catch (err: any) {
          showToast("Transcription failed");
        } finally {
          setReportTranscribing(false);
          setReportMicTarget(null);
        }
      });
    }
  };

  const openEdit = (s: typeof snags[0]) => {
    setEditSnag(s);
    setEditNote(s.note);
    setEditLoc(s.location || "");
    setEditPri(s.priority);
    // Clear any lingering pending photos from a previous open
    setEditNewPhotos([]);
  };

  /**
   * Project code derivation mirrors the backend's _project_code in reports.py
   * so the PDF and the downloaded photos share the same prefix.
   * Examples:
   *   "MIL06 — Basement Retrofit"  → "MIL06"
   *   "Project Alpha"              → "PROJECT"
   *   "" / undefined               → "PHOTO"
   */
  const projectCode = (projectName?: string): string => {
    if (!projectName) return "PHOTO";
    const first = projectName.trim().split(/\s+/)[0] || "";
    const cleaned = first.replace(/[^A-Za-z0-9_-]/g, "").toUpperCase();
    return (cleaned || "PHOTO").slice(0, 12);
  };

  /**
   * Build the download filename for an item photo.
   * Format: ProjectName_YYYY_MM_DD_V01_Issue01a.jpg
   *
   * Photo slot maps to letter: 1→a, 2→b, 3→c, 4→d
   * Rectification photos get _rect suffix.
   */
  const buildPhotoFilename = (
    snagDate: string,
    photoSlot: number,
    itemNo?: number,
    isRectification = false,
  ): string => {
    const code = projectCode(currentProject?.name);
    const d = new Date(snagDate);
    const safeDate = isNaN(d.getTime()) ? new Date() : d;
    const y = safeDate.getFullYear();
    const m = String(safeDate.getMonth() + 1).padStart(2, "0");
    const day = String(safeDate.getDate()).padStart(2, "0");
    const visitNo = currentVisit?.visit_no ?? 1;
    const vPart = `V${String(visitNo).padStart(2, "0")}`;
    const issuePart = `Issue${String(itemNo ?? 1).padStart(2, "0")}`;
    const slotLetter = ["a", "b", "c", "d"][Math.max(0, Math.min(3, photoSlot - 1))];
    const suffix = isRectification ? "_rect" : "";
    return `${code}_${y}_${m}_${day}_${vPart}_${issuePart}${slotLetter}${suffix}.jpg`;
  };

  const savePhoto = async (
    url: string,
    opts: {
      snagDate: string;
      photoNo?: number;
      itemNo?: number;
      isRectification?: boolean;
    },
  ) => {
    try {
      showToast("Saving photo…");
      const resp = await fetch(url);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = buildPhotoFilename(
        opts.snagDate,
        opts.photoNo ?? 1,
        opts.itemNo,
        opts.isRectification ?? false,
      );
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      showToast("Photo saved");
    } catch {
      showToast("Failed to save photo");
    }
  };

  // Hide bottom nav when any modal is open
  const modalOpen = !!editSnag || showReport || showEmailModal;
  const visitClosed = currentVisit?.status === "closed";

  return (
    <div>
      {/* Hidden file input for close-with-photo */}
      <input
        ref={closePhotoRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleClosePhoto}
      />
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[var(--bg)] border-b border-[var(--border)] px-4 py-3 flex items-center gap-3">
        <button onClick={() => setScreen("visits")} className="p-2 rounded-full hover:bg-[var(--bg3)] text-[var(--text2)]">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center min-w-0">
          <h2 className="text-base font-semibold truncate">
            {currentVisit ? `Visit #${currentVisit.visit_no}` : currentProject?.name}
          </h2>
          <p className="text-[11px] text-[var(--text3)]">
            {currentProject?.name}{currentVisit?.weather ? ` • ${currentVisit.weather}` : ""}
          </p>
        </div>
        <button onClick={() => setShowReport(true)} className="p-2 rounded-full hover:bg-[var(--bg3)] text-[var(--text2)]">
          <FileText className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="px-5 py-4 pb-28">
        {/* Filter chips */}
        <div className="flex gap-2 mb-4 animate-slide-up no-scrollbar overflow-x-auto">
          {([
            ["all", `All (${snags.length})`],
            ["open", `Open (${openCount})`],
            ["closed", `Closed (${closedCount})`],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={clsx(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap",
                filter === key
                  ? "bg-brand text-white border-brand"
                  : "bg-[var(--bg2)] text-[var(--text2)] border-[var(--border)] hover:border-[var(--border)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Visit closed banner */}
        {visitClosed && (
          <div className="bg-success/10 border border-success/20 rounded-xl p-3 mb-4 text-center animate-fade-in">
            <p className="text-xs font-semibold text-success">Visit closed — reopen from the visits screen to add new items</p>
          </div>
        )}

        {/* Pending offline snags */}
        {pendingSnags.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-warning uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CloudUpload className="w-3.5 h-3.5" /> {pendingSnags.length} pending sync
            </p>
            {pendingSnags.map((p) => (
              <div key={p.id} className="bg-warning/5 border border-warning/20 rounded-xl p-3 mb-2 opacity-70">
                <div className="flex items-center gap-2">
                  <WifiOff className="w-4 h-4 text-warning flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{p.note}</p>
                    <p className="text-[10px] text-[var(--text3)]">
                      {p.location || "No location"} • {p.photos.length} photo{p.photos.length !== 1 ? "s" : ""} • {p.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Snag list */}
        {loading ? (
          <div className="text-center py-12 text-[var(--text3)]">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[var(--text3)] animate-fade-in">
            <Camera className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No items {filter !== "all" ? `with status "${filter}"` : "yet"}</p>
            <p className="text-xs mt-1">Tap + to add your first item</p>
          </div>
        ) : (
          filtered.map((s, i) => (
            <div
              key={s.id}
              className={clsx(
                "bg-[var(--bg2)] border rounded-xl p-4 mb-2.5 animate-slide-up",
                s.status === "closed"
                  ? "border-success/20 opacity-70"
                  : "border-[var(--border)]"
              )}
              style={{ animationDelay: `${Math.min(i, 4) * 50}ms` }}
            >
              <div className="flex gap-3">
                {/* Snag number badge */}
                <div className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
                  s.status === "closed"
                    ? "bg-success/10 text-success"
                    : "bg-brand/10 text-brand"
                )}>
                  {(s as any).snag_no || i + 1}
                </div>
                {/* Photo */}
                {s.photo_url ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 group">
                    <img src={s.photo_url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); savePhoto(s.photo_url!, { snagDate: s.created_at, photoNo: 1, itemNo: s.snag_no }); }}
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-all"
                      title="Save photo"
                    >
                      <Download className="w-5 h-5 text-white drop-shadow" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-[var(--bg3)] flex items-center justify-center flex-shrink-0">
                    <Camera className="w-5 h-5 text-[var(--text3)]" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium leading-snug mb-1.5">{s.note}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase", STATUS_COLORS[s.status])}>
                      {s.status}
                    </span>
                    <span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase", PRIORITY_COLORS[s.priority])}>
                      {s.priority}
                    </span>
                    {s.location && (
                      <span className="text-[10px] text-[var(--text3)] flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" /> {s.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3 pt-2.5 border-t border-[var(--border)]">
                <button
                  onClick={() => toggleStatus(s.id, s.status)}
                  className={clsx(
                    "flex-1 py-2 rounded-lg text-xs font-semibold transition-all",
                    s.status === "open" ? "bg-brand text-white" : "bg-[var(--surface)] text-white border border-[var(--border)]"
                  )}
                >
                  {s.status === "open" ? "Close" : "Reopen"}
                </button>
                {s.status === "open" && (
                  <button
                    onClick={() => startCloseWithPhoto(s.id)}
                    disabled={closingSnagId === s.id}
                    className="p-2 rounded-lg bg-brand/20 text-brand hover:bg-brand/30 transition-colors"
                    title="Close with photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
                {s.photo_url && (
                  <button
                    onClick={() => savePhoto(s.photo_url!, { snagDate: s.created_at, photoNo: 1, itemNo: s.snag_no })}
                    className="p-2 rounded-lg bg-[var(--surface)] text-[var(--text2)] hover:text-white transition-colors"
                    title="Save photo"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => openEdit(s)} className="p-2 rounded-lg bg-[var(--surface)] text-[var(--text2)] hover:text-white transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
               <button onClick={() => deleteSnag(s)} className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors" title="Delete item">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB — hide when modal is open or visit is closed */}
      {!modalOpen && !visitClosed && (
        <button
          onClick={() => setScreen("capture")}
          className="fixed bottom-24 right-[max(20px,calc((100%-480px)/2+20px))] w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center shadow-[var(--fab-shadow)] hover:scale-110 active:scale-95 transition-transform z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Report sheet */}
      {showReport && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center animate-fade-in" onClick={() => setShowReport(false)}>
          <div className="w-full max-w-[480px] max-h-[90vh] bg-[var(--bg2)] rounded-t-2xl p-5 overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[var(--border)] rounded-full mx-auto mb-4" />
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Inspection Report</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[var(--surface)] text-white rounded-lg text-xs font-semibold hover:bg-[var(--bg3)]"
                  title="Email this report"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-brand text-white rounded-lg text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloading ? "Generating…" : "Download PDF"}
                </button>
              </div>
            </div>

            {/* Report fields */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-wider block mb-1.5">Visit / Report No.</label>
                <div className="flex gap-2 items-center">
                  <input
                    value={visitNo}
                    onChange={(e) => setVisitNo(e.target.value)}
                    placeholder="e.g. 1 or 2026/04/13"
                    className="flex-1 px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
                  />
                  <button
                    onClick={() => handleReportMic("visitNo", setVisitNo)}
                    disabled={reportTranscribing || (isRecording && reportMicTarget !== "visitNo")}
                    className={clsx(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                      isRecording && reportMicTarget === "visitNo"
                        ? "bg-critical text-white animate-recording"
                        : "bg-[var(--surface)] text-[var(--text2)] hover:text-white hover:bg-[var(--bg3)]"
                    )}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
                {isRecording && reportMicTarget === "visitNo" && (
                  <p className="text-xs text-critical font-semibold mt-1">● Recording… {secondsLeft}s</p>
                )}
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-wider block mb-1.5">Weather</label>
                <div className="flex gap-2 items-center">
                  <input
                    value={weather}
                    onChange={(e) => setWeather(e.target.value)}
                    placeholder="e.g. Sunny, 18°C, light wind"
                    className="flex-1 px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
                  />
                  <button
                    onClick={() => handleReportMic("weather", setWeather)}
                    disabled={reportTranscribing || (isRecording && reportMicTarget !== "weather")}
                    className={clsx(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                      isRecording && reportMicTarget === "weather"
                        ? "bg-critical text-white animate-recording"
                        : "bg-[var(--surface)] text-[var(--text2)] hover:text-white hover:bg-[var(--bg3)]"
                    )}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
                {isRecording && reportMicTarget === "weather" && (
                  <p className="text-xs text-critical font-semibold mt-1">● Recording… {secondsLeft}s</p>
                )}
                {reportTranscribing && (
                  <p className="text-xs text-[var(--text2)] mt-1">Transcribing…</p>
                )}
              </div>
            </div>

            {/* Report preview */}
            <div className="bg-white text-gray-900 rounded-xl p-5 text-[11px] leading-relaxed">
              <div className="flex justify-between items-start pb-3 mb-4 border-b-[3px] border-brand">
                <div>
                  <h1 className="text-base font-bold text-brand">INSPECTION REPORT</h1>
                  <p className="text-xs text-gray-600">{currentProject?.name}</p>
                  <p className="text-[10px] text-gray-400">Client: {currentProject?.client || "—"}</p>
                </div>
                <div className="text-right text-[10px] text-gray-400">
                  <p>Date: {new Date().toLocaleDateString("en-GB")}</p>
                  <p>Ref: VS-{currentProject?.id?.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>

              {/* Summary boxes */}
              <h2 className="text-xs font-bold text-brand uppercase tracking-wider mb-2 pb-1 border-b border-gray-200">Summary</h2>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: "Total", val: snags.length, color: "#333" },
                  { label: "Open", val: openCount, color: "#D97706" },
                  { label: "Closed", val: closedCount, color: "#16A34A" },
                  { label: "High", val: snags.filter((s) => s.priority === "high" && s.status === "open").length, color: "#DC2626" },
                ].map((s) => (
                  <div key={s.label} className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold" style={{ color: s.color }}>{s.val}</div>
                    <div className="text-[9px] text-gray-500">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Snag table */}
              <h2 className="text-xs font-bold text-brand uppercase tracking-wider mb-2 pb-1 border-b border-gray-200">
                Open Items ({openCount})
              </h2>
              {openCount > 0 ? (
                <table className="w-full text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-1.5 text-left border border-gray-200 w-[8%]">#</th>
                      <th className="p-1.5 text-left border border-gray-200">Description</th>
                      <th className="p-1.5 text-left border border-gray-200 w-[22%]">Location</th>
                      <th className="p-1.5 text-left border border-gray-200 w-[12%]">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snags.filter((s) => s.status === "open").map((s, i) => (
                      <tr key={s.id}>
                        <td className="p-1.5 border border-gray-200 font-mono font-semibold">{i + 1}</td>
                        <td className="p-1.5 border border-gray-200">{s.note}</td>
                        <td className="p-1.5 border border-gray-200">{s.location || "—"}</td>
                        <td className="p-1.5 border border-gray-200">
                          <span className={clsx("text-[9px] font-bold uppercase", {
                            "text-critical": s.priority === "high",
                            "text-warning": s.priority === "medium",
                            "text-gray-500": s.priority === "low",
                          })}>{s.priority}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-400 italic text-[10px] py-2">All items resolved!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editSnag && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center animate-fade-in">
          <div className="w-full max-w-[480px] bg-[var(--bg2)] rounded-t-2xl p-5 animate-slide-up">
            <div className="w-10 h-1 bg-[var(--border)] rounded-full mx-auto mb-4" />
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold">Edit Item</h3>
              <button
                onClick={() => { setEditSnag(null); setEditNewPhotos([]); }}
                className="text-[var(--text3)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-wider block mb-1.5">Description</label>
                <textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} rows={3}
                  className="w-full px-3.5 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors resize-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-wider block mb-1.5">Location</label>
                <input value={editLoc} onChange={(e) => setEditLoc(e.target.value)}
                  className="w-full px-3.5 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-wider block mb-1.5">Priority</label>
                <div className="flex gap-2">
                  {(["low", "medium", "high"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setEditPri(p)}
                      className={clsx(
                        "flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all capitalize",
                        editPri === p
                          ? p === "high" ? "border-critical text-critical bg-critical/10"
                          : p === "medium" ? "border-warning text-warning bg-warning/10"
                          : "border-slate-500 text-slate-500 bg-slate-500/10"
                          : "border-[var(--border)] text-[var(--text3)] bg-[var(--bg)]"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Photos */}
            {(() => {
              // existingPhotos is a 4-element slot-ordered list from the backend.
              // Some slots may be null (empty). We render the non-null ones as
              // thumbnails with a remove button that calls the backend
              // DELETE /snags/{id}/photos/{slot} endpoint.
              const existingSlots: (string | null)[] = editSnag?.photo_urls ?? [];
              const existingPhotos: { slot: number; url: string }[] = existingSlots
                .map((url, idx) => (url ? { slot: idx + 1, url } : null))
                .filter((x): x is { slot: number; url: string } => x !== null);

              const existing = existingPhotos.length;
              const pending = editNewPhotos.length;
              const total = existing + pending;
              const remaining = Math.max(0, 4 - total);

              return (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-wider">
                      Photos
                    </label>
                    <span className="text-[10px] text-[var(--text3)]">
                      {total} of 4
                      {pending > 0 && ` (${pending} new)`}
                    </span>
                  </div>

                  {/* Existing photos + pending new photos, in one strip */}
                  {(existing > 0 || pending > 0) && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {existingPhotos.map(({ slot, url }) => (
                        <div
                          key={`existing-${slot}`}
                          className="relative w-16 h-16 rounded-lg overflow-hidden border border-[var(--border)]"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          {/* Download button — bottom-left */}
                          <button
                            onClick={() => savePhoto(url, { snagDate: editSnag?.created_at || "", photoNo: slot, itemNo: editSnag?.snag_no })}
                            className="absolute bottom-0.5 left-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                            aria-label={`Download photo ${slot}`}
                            title="Download this photo"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                          {/* Delete button — top-right */}
                          <button
                            onClick={() => handleDeleteExistingPhoto(slot)}
                            disabled={editDeletingSlot === slot}
                            className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center disabled:opacity-50"
                            aria-label={`Remove photo ${slot}`}
                            title="Remove this photo"
                          >
                            {editDeletingSlot === slot ? (
                              <span className="block w-2 h-2 rounded-full bg-white animate-pulse" />
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ))}

                      {editNewPhotos.map((f, i) => {
                        const objectUrl = URL.createObjectURL(f);
                        return (
                          <div
                            key={`pending-${f.name}-${i}`}
                            className="relative w-16 h-16 rounded-lg overflow-hidden border border-brand/60"
                            title="New photo (will upload on save)"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={objectUrl} alt="" className="w-full h-full object-cover" />
                            <span className="absolute bottom-0 left-0 right-0 text-[8px] text-center bg-brand/80 text-white py-0.5 font-semibold uppercase">
                              New
                            </span>
                            <button
                              onClick={() => {
                                setEditNewPhotos((prev) => prev.filter((_, idx) => idx !== i));
                                URL.revokeObjectURL(objectUrl);
                              }}
                              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                              aria-label="Remove pending photo"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add-more picker */}
                  {remaining > 0 ? (
                    <div className="flex gap-2">
                      {/* Camera input — capture="environment" forces rear camera on Android/iOS */}
                      <input
                        ref={editPhotoInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleEditPhotoPick}
                        className="hidden"
                        id="edit-photo-camera"
                      />
                      {/* Gallery input — no capture, opens file/gallery picker */}
                      <input
                        ref={editGalleryRef}
                        type="file"
                        accept="image/*"
                        onChange={handleEditPhotoPick}
                        className="hidden"
                        id="edit-photo-gallery"
                      />
                      <label
                        htmlFor="edit-photo-camera"
                        className="flex-1 flex items-center justify-center gap-1.5 h-11 border border-dashed border-[var(--border)] rounded-lg text-xs font-semibold text-[var(--text2)] hover:text-white hover:border-brand transition-colors cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        Take Photo
                      </label>
                      <label
                        htmlFor="edit-photo-gallery"
                        className="flex-1 flex items-center justify-center gap-1.5 h-11 border border-dashed border-[var(--border)] rounded-lg text-xs font-semibold text-[var(--text2)] hover:text-white hover:border-brand transition-colors cursor-pointer"
                      >
                        <ImageIcon className="w-4 h-4" />
                        Gallery
                      </label>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[var(--text3)] italic">
                      This item has the maximum of 4 photos. Remove one above to add another.
                    </p>
                  )}
                </div>
              );
            })()}

            <button
              onClick={saveEdit}
              disabled={editUploadingPhotos}
              className="w-full h-12 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              {editUploadingPhotos ? "Uploading photos…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Email Report Modal */}
      {showEmailModal && (
        <div
          className="fixed inset-0 bg-black/70 z-[60] flex items-end justify-center animate-fade-in"
          onClick={() => !sendingEmail && setShowEmailModal(false)}
        >
          <div
            className="w-full max-w-[480px] max-h-[85vh] bg-[var(--bg2)] rounded-t-2xl p-5 overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-[var(--border)] rounded-full mx-auto mb-4" />

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand" />
                Email Report
              </h3>
              <button
                onClick={() => setShowEmailModal(false)}
                disabled={sendingEmail}
                className="p-1.5 rounded-full hover:bg-[var(--bg3)] text-[var(--text2)] disabled:opacity-50"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[12px] text-[var(--text3)] mb-4">
              Send the PDF report for{" "}
              <span className="text-white font-semibold">
                {currentProject?.name}
              </span>
              {currentVisit && ` · Visit ${currentVisit.visit_no}`}
              .
            </p>

            {/* Recipients */}
            <div className="mb-3">
              <label className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-wider block mb-1.5">
                Recipients
              </label>
              <textarea
                value={emailRecipients}
                onChange={(e) => setEmailRecipients(e.target.value)}
                placeholder="email@example.com, another@example.com"
                rows={2}
                disabled={sendingEmail}
                className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors resize-none"
              />
              <p className="text-[10px] text-[var(--text3)] mt-1">
                Separate multiple addresses with commas, spaces, or new lines. Up to 10 recipients.
              </p>
            </div>

            {/* Optional message */}
            <div className="mb-4">
              <label className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-wider block mb-1.5">
                Message <span className="text-[var(--text3)] normal-case font-normal">(optional)</span>
              </label>
              <textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Add a short note for the recipient…"
                rows={3}
                maxLength={2000}
                disabled={sendingEmail}
                className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors resize-none"
              />
            </div>

            {/* Info note about size handling */}
            <div className="mb-4 p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
              <p className="text-[11px] text-[var(--text2)] leading-relaxed">
                <span className="font-semibold">Heads-up:</span> reports under
                10&nbsp;MB are attached directly. Larger reports are uploaded
                and shared as a time-limited download link valid for 7 days.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowEmailModal(false)}
                disabled={sendingEmail}
                className="flex-1 h-11 bg-[var(--surface)] hover:bg-[var(--bg3)] text-white font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEmailReport}
                disabled={sendingEmail || !emailRecipients.trim()}
                className="flex-1 h-11 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sendingEmail ? (
                  "Sending…"
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hide bottom nav when any modal is open */}
      {!modalOpen && <BottomNav active="snags" />}
    </div>
  );
}
