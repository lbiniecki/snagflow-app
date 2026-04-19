"use client";

import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { snags as snagsApi, reports as reportsApi, siteVisits as visitsApi } from "@/lib/api";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import { getPendingForVisit, getPendingSnags, type PendingSnag } from "@/lib/offlineStore";
import {
  ChevronLeft, FileText, Plus, Pencil, Trash2, Camera,
  MapPin, Download, X, WifiOff, CloudUpload, Mail,
} from "lucide-react";
import clsx from "clsx";
import BottomNav from "./BottomNav";
import { compressImage } from "@/lib/compressImage";
import { useConfirm } from "./ConfirmDialog";

const STATUS_COLORS = { open: "text-warning bg-warning/10", closed: "text-success bg-success/10" };
const PRIORITY_COLORS = { high: "text-critical bg-critical/10", medium: "text-warning bg-warning/10", low: "text-slate-500 bg-slate-500/10" };

export default function SnagsScreen() {
  const {
    currentProject, setScreen, snags, setSnags,
    filter, setFilter, showToast, loading, setLoading,
    currentVisit, setEditingSnag,
  } = useStore();

  const [showReport, setShowReport] = useState(false);
  const [downloading, setDownloading] = useState(false);
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

  const handleDownloadPdf = async () => {
    if (!currentProject) return;
    setDownloading(true);
    try {
      await reportsApi.downloadPdf(currentProject.id, {
        visitId: currentVisit?.id,
        weather: currentVisit?.weather || "",
        visitNo: String(currentVisit?.visit_no || ""),
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
        weather: currentVisit?.weather || "",
        visitNo: String(currentVisit?.visit_no || ""),
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

  // Download every photo on an item as individual files (not zipped).
  // Each save is sequential with a short delay — most browsers throttle
  // back-to-back programmatic downloads unless they're spaced out, and
  // Safari/iOS is especially strict. 200ms is the sweet spot; any
  // shorter and the browser drops downloads 2+ silently.
  const saveAllPhotos = async (s: typeof snags[0]) => {
    // photo_urls is a 4-slot array; nulls represent empty slots
    const slots = (s.photo_urls ?? []).map((url, i) => ({ url, slot: i + 1 }));
    const present = slots.filter((x) => x.url);

    // Fallback to single photo_url when photo_urls hasn't been populated
    // (older snag rows pre the photo_urls backend change)
    if (present.length === 0 && s.photo_url) {
      return savePhoto(s.photo_url, {
        snagDate: s.created_at,
        photoNo: 1,
        itemNo: s.snag_no,
      });
    }

    if (present.length === 0) {
      showToast("No photos to download");
      return;
    }

    showToast(`Saving ${present.length} photo${present.length === 1 ? "" : "s"}…`);
    for (let i = 0; i < present.length; i++) {
      const { url, slot } = present[i];
      try {
        const resp = await fetch(url!);
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = buildPhotoFilename(s.created_at, slot, s.snag_no, false);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } catch {
        // Continue with others — don't abort the batch on one failure
      }
      // Space downloads out. Skip the delay on the last one.
      if (i < present.length - 1) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
    showToast(`Downloaded ${present.length} photo${present.length === 1 ? "" : "s"}`);
  };

  // Hide bottom nav when any modal is open
  const modalOpen = showReport || showEmailModal;
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
          <h2 className="text-base font-semibold truncate text-[var(--text-primary)]">
            {currentVisit ? `Visit #${currentVisit.visit_ref || currentVisit.visit_no}` : currentProject?.name}
          </h2>
          <p className="text-xs text-[var(--text3)]">
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
            <p className="text-xs font-semibold text-warning uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CloudUpload className="w-3.5 h-3.5" /> {pendingSnags.length} pending sync
            </p>
            {pendingSnags.map((p) => (
              <div key={p.id} className="bg-warning/5 border border-warning/20 rounded-xl p-3 mb-2 opacity-70">
                <div className="flex items-center gap-2">
                  <WifiOff className="w-4 h-4 text-warning flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] truncate">{p.note}</p>
                    <p className="text-xs text-[var(--text3)]">
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
                  <p className="text-[13px] font-medium leading-snug mb-1.5 text-[var(--text-primary)]">{s.note}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded-full uppercase", STATUS_COLORS[s.status])}>
                      {s.status}
                    </span>
                    <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded-full uppercase", PRIORITY_COLORS[s.priority])}>
                      {s.priority}
                    </span>
                    {s.location && (
                      <span className="text-xs text-[var(--text3)] flex items-center gap-0.5">
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
                    s.status === "open" ? "bg-brand text-white" : "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)]"
                  )}
                >
                  {s.status === "open" ? "Close" : "Reopen"}
                </button>
                {((s.photo_urls ?? []).some(Boolean) || s.photo_url) && (
                  <button
                    onClick={() => saveAllPhotos(s)}
                    className="p-2 rounded-lg bg-[var(--surface)] text-[var(--text2)] hover:text-[var(--text-primary)] transition-colors"
                    title="Download all photos"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => { setEditingSnag(s); setScreen("capture"); }}
                  className="p-2 rounded-lg bg-[var(--surface)] text-[var(--text2)] hover:text-[var(--text-primary)] transition-colors"
                  title="Edit item"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deleteSnag(s)} className="p-2 rounded-lg bg-critical/10 text-critical hover:bg-critical/20 transition-colors" title="Delete item">
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
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Inspection Report</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[var(--surface)] text-[var(--text-primary)] rounded-lg text-xs font-semibold hover:bg-[var(--bg3)]"
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

            {/* Report preview */}
            <div className="bg-white text-gray-900 rounded-xl p-5 text-xs leading-relaxed">
              <div className="flex justify-between items-start pb-3 mb-4 border-b-[3px] border-brand">
                <div>
                  <h1 className="text-base font-bold text-brand">INSPECTION REPORT</h1>
                  <p className="text-xs text-gray-600">{currentProject?.name}</p>
                  <p className="text-xs text-gray-400">Client: {currentProject?.client || "—"}</p>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <p>Date: {new Date().toLocaleDateString("en-GB")}</p>
                  {/* Ref mirrors the PDF exactly: visit_ref takes precedence,
                      else {first-3-chars-of-project-name}-SV{visit_no padded}.
                      Must match the backend's doc_ref in report_generator.py
                      (line 170): p_name[:3].upper() + "-SV" + zfill(2). */}
                  <p>Ref: {
                    currentVisit?.visit_ref
                      ? currentVisit.visit_ref
                      : `${(currentProject?.name || "").slice(0, 3).toUpperCase()}-SV${String(currentVisit?.visit_no ?? 1).padStart(2, "0")}`
                  }</p>
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
                    <div className="text-xs text-gray-500">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Snag table */}
              <h2 className="text-xs font-bold text-brand uppercase tracking-wider mb-2 pb-1 border-b border-gray-200">
                Open Items ({openCount})
              </h2>
              {openCount > 0 ? (
                <table className="w-full text-xs border-collapse">
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
                        <td className="p-1.5 border border-gray-200 font-mono font-semibold">{(s as any).snag_no ?? i + 1}</td>
                        <td className="p-1.5 border border-gray-200">{s.note}</td>
                        <td className="p-1.5 border border-gray-200">{s.location || "—"}</td>
                        <td className="p-1.5 border border-gray-200">
                          <span className={clsx("text-xs font-bold uppercase", {
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
                <p className="text-gray-400 italic text-xs py-2">All items resolved!</p>
              )}
            </div>
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
              <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--text-primary)]">
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
              <span className="text-[var(--text-primary)] font-semibold">
                {currentProject?.name}
              </span>
              {currentVisit && ` · Visit ${currentVisit.visit_ref || currentVisit.visit_no}`}
              .
            </p>

            {/* Recipients */}
            <div className="mb-3">
              <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider block mb-1.5">
                Recipients
              </label>
              <textarea
                value={emailRecipients}
                onChange={(e) => setEmailRecipients(e.target.value)}
                placeholder="email@example.com, another@example.com"
                rows={2}
                disabled={sendingEmail}
                className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors resize-none"
              />
              <p className="text-xs text-[var(--text3)] mt-1">
                Separate multiple addresses with commas, spaces, or new lines. Up to 10 recipients.
              </p>
            </div>

            {/* Optional message */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider block mb-1.5">
                Message <span className="text-[var(--text3)] normal-case font-normal">(optional)</span>
              </label>
              <textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Add a short note for the recipient…"
                rows={3}
                maxLength={2000}
                disabled={sendingEmail}
                className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors resize-none"
              />
            </div>

            {/* Info note about size handling */}
            <div className="mb-4 p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg">
              <p className="text-xs text-[var(--text2)] leading-relaxed">
                <span className="font-semibold">Heads-up:</span> reports under
                10&nbsp;MB are attached directly. Larger reports are uploaded
                and shared as a time-limited download link valid for 7 days.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowEmailModal(false)}
                disabled={sendingEmail}
                className="flex-1 h-11 bg-[var(--surface)] hover:bg-[var(--bg3)] text-[var(--text-primary)] font-semibold rounded-lg transition-all disabled:opacity-50"
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
