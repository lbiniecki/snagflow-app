"use client";

import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { snags as snagsApi, reports as reportsApi, transcription, siteVisits as visitsApi } from "@/lib/api";
import {
  ChevronLeft, FileText, Plus, Pencil, Trash2, Camera,
  MapPin, Download, X, Mic,
} from "lucide-react";
import clsx from "clsx";
import BottomNav from "./BottomNav";
import { useAudioRecorder } from "@/lib/useAudioRecorder";
import { compressImage } from "@/lib/compressImage";

const STATUS_COLORS = { open: "text-red-400 bg-red-400/10", closed: "text-green-400 bg-green-400/10" };
const PRIORITY_COLORS = { high: "text-red-400 bg-red-400/10", medium: "text-yellow-400 bg-yellow-400/10", low: "text-gray-400 bg-gray-400/10" };

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
  const [downloading, setDownloading] = useState(false);
  const [weather, setWeather] = useState("");
  const [visitNo, setVisitNo] = useState("");
  const [reportTranscribing, setReportTranscribing] = useState(false);
  const [reportMicTarget, setReportMicTarget] = useState<"weather" | "visitNo" | null>(null);
  const { isRecording, secondsLeft, startRecording, stopRecording, error: micError } = useAudioRecorder();

  const closePhotoRef = useRef<HTMLInputElement>(null);
  const [closingSnagId, setClosingSnagId] = useState<string | null>(null);

  // Fetch snags (scoped to current visit if available)
  useEffect(() => {
    if (!currentProject) return;
    async function load() {
      setLoading(true);
      try {
        const data = await snagsApi.list(currentProject!.id, currentVisit?.id);
        setSnags(data);
      } catch (err) {
        console.error("Failed to load snags:", err);
      } finally {
        setLoading(false);
      }
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
      showToast(`Snag ${newStatus}`);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const deleteSnag = async (id: string) => {
    try {
      await snagsApi.delete(id);
      setSnags(snags.filter((s) => s.id !== id));
      showToast("Snag deleted");
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
      showToast("Snag closed with photo");
    } catch (err: any) {
      showToast(err.message || "Failed to close snag");
    } finally {
      setClosingSnagId(null);
      if (closePhotoRef.current) closePhotoRef.current.value = "";
    }
  };

  const saveEdit = async () => {
    if (!editSnag) return;
    try {
      await snagsApi.update(editSnag.id, { note: editNote, location: editLoc, priority: editPri });
      setSnags(snags.map((s) => s.id === editSnag.id ? { ...s, note: editNote, location: editLoc, priority: editPri } : s));
      setEditSnag(null);
      showToast("Snag updated");
    } catch (err: any) {
      showToast(err.message);
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
  };

  const savePhoto = async (url: string, snagNote: string) => {
    try {
      showToast("Saving photo…");
      const resp = await fetch(url);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const safeName = snagNote.slice(0, 20).replace(/[^a-zA-Z0-9]/g, "-") || "snag";
      a.download = `voxsite-${safeName}.jpg`;
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
  const modalOpen = !!editSnag || showReport;
  const visitClosed = currentVisit?.status === "closed";

  return (
    <div>
      {/* Hidden file input for close-with-photo */}
      <input
        ref={closePhotoRef}
        type="file"
        accept="image/*"

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
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-4 text-center animate-fade-in">
            <p className="text-xs font-semibold text-green-400">Visit closed — reopen from the visits screen to add new snags</p>
          </div>
        )}

        {/* Snag list */}
        {loading ? (
          <div className="text-center py-12 text-[var(--text3)]">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[var(--text3)] animate-fade-in">
            <Camera className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No snags {filter !== "all" ? `with status "${filter}"` : "yet"}</p>
            <p className="text-xs mt-1">Tap + to add your first snag</p>
          </div>
        ) : (
          filtered.map((s, i) => (
            <div
              key={s.id}
              className={clsx(
                "bg-[var(--bg2)] border rounded-xl p-4 mb-2.5 animate-slide-up",
                s.status === "closed"
                  ? "border-green-500/20 opacity-70"
                  : "border-[var(--border)]"
              )}
              style={{ animationDelay: `${Math.min(i, 4) * 50}ms` }}
            >
              <div className="flex gap-3">
                {/* Snag number badge */}
                <div className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
                  s.status === "closed"
                    ? "bg-green-500/10 text-green-400"
                    : "bg-brand/10 text-brand"
                )}>
                  {(s as any).snag_no || i + 1}
                </div>
                {/* Photo */}
                {s.photo_url ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 group">
                    <img src={s.photo_url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); savePhoto(s.photo_url!, s.note); }}
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
                    onClick={() => savePhoto(s.photo_url!, s.note)}
                    className="p-2 rounded-lg bg-[var(--surface)] text-[var(--text2)] hover:text-white transition-colors"
                    title="Save photo"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => openEdit(s)} className="p-2 rounded-lg bg-[var(--surface)] text-[var(--text2)] hover:text-white transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deleteSnag(s.id)} className="p-2 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors">
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
          className="fixed bottom-24 right-[max(20px,calc((100%-480px)/2+20px))] w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/40 hover:scale-110 active:scale-95 transition-transform z-40"
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
              <h3 className="text-lg font-bold">Snagging Report</h3>
              <button
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-brand text-white rounded-lg text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                {downloading ? "Generating…" : "Download PDF"}
              </button>
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
                        ? "bg-red-500 text-white animate-recording"
                        : "bg-[var(--surface)] text-[var(--text2)] hover:text-white hover:bg-[var(--bg3)]"
                    )}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
                {isRecording && reportMicTarget === "visitNo" && (
                  <p className="text-xs text-red-400 font-semibold mt-1">● Recording… {secondsLeft}s</p>
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
                        ? "bg-red-500 text-white animate-recording"
                        : "bg-[var(--surface)] text-[var(--text2)] hover:text-white hover:bg-[var(--bg3)]"
                    )}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
                {isRecording && reportMicTarget === "weather" && (
                  <p className="text-xs text-red-400 font-semibold mt-1">● Recording… {secondsLeft}s</p>
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
                  <h1 className="text-base font-bold text-brand">SNAGGING REPORT</h1>
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
                  { label: "Open", val: openCount, color: "#EF4444" },
                  { label: "Closed", val: closedCount, color: "#22C55E" },
                  { label: "High", val: snags.filter((s) => s.priority === "high" && s.status === "open").length, color: "#F59E0B" },
                ].map((s) => (
                  <div key={s.label} className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold" style={{ color: s.color }}>{s.val}</div>
                    <div className="text-[9px] text-gray-500">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Snag table */}
              <h2 className="text-xs font-bold text-brand uppercase tracking-wider mb-2 pb-1 border-b border-gray-200">
                Open Snags ({openCount})
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
                            "text-red-500": s.priority === "high",
                            "text-yellow-600": s.priority === "medium",
                            "text-gray-500": s.priority === "low",
                          })}>{s.priority}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-400 italic text-[10px] py-2">All snags resolved!</p>
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
              <h3 className="text-lg font-bold">Edit Snag</h3>
              <button onClick={() => setEditSnag(null)} className="text-[var(--text3)]"><X className="w-5 h-5" /></button>
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
                          ? p === "high" ? "border-red-400 text-red-400 bg-red-400/10"
                          : p === "medium" ? "border-yellow-400 text-yellow-400 bg-yellow-400/10"
                          : "border-gray-400 text-gray-400 bg-gray-400/10"
                          : "border-[var(--border)] text-[var(--text3)] bg-[var(--bg)]"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={saveEdit} className="w-full h-12 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition-all">
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Hide bottom nav when any modal is open */}
      {!modalOpen && <BottomNav active="snags" />}
    </div>
  );
}
