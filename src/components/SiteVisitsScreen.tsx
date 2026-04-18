"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { siteVisits as visitsApi } from "@/lib/api";
import {
  ChevronLeft, Plus, X, ClipboardList, Lock, Unlock,
  Calendar, CloudSun, Trash2, Pencil,
} from "lucide-react";
import clsx from "clsx";
import BottomNav from "./BottomNav";
import { useConfirm } from "./ConfirmDialog";

export default function SiteVisitsScreen() {
  const {
    currentProject, setScreen, visits, setVisits,
    setCurrentVisit, showToast, loading, setLoading,
  } = useStore();
  const confirm = useConfirm();

  const DEFAULT_CLOSING = "If requested, notice must be given to allow for a site visit to review prior to closing up or concealing the item of works.\n\nThe contractor is to confirm that the above actions have been carried out and provide photographic record of the associated works. The contractor is to sign the items as closed and e-mail to originator.";

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [weather, setWeather] = useState("");
  const [attendees, setAttendees] = useState("");
  const [accessNotes, setAccessNotes] = useState("");
  const [checker, setChecker] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [approver, setApprover] = useState("");
  const [closingNotes, setClosingNotes] = useState(DEFAULT_CLOSING);

  // Fetch visits
  useEffect(() => {
    if (!currentProject) return;
    async function load() {
      setLoading(true);
      try {
        const data = await visitsApi.list(currentProject!.id);
        setVisits(data);
        // Pre-fill checker/reviewer/approver from last visit
        if (data.length > 0) {
          const last = data[0];
          setChecker((last as any).checker || "");
          setReviewer((last as any).reviewer || "");
          setApprover((last as any).approver || "");
          if ((last as any).closing_notes) setClosingNotes((last as any).closing_notes);
        }
      } catch (err) {
        console.error("Failed to load visits:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentProject, setVisits, setLoading]);

  const resetForm = () => {
    setWeather("");
    setAttendees("");
    setAccessNotes("");
    setEditingId(null);
    // Keep checker/reviewer/approver/closingNotes for next visit
  };

  const openEdit = (v: typeof visits[0]) => {
    setEditingId(v.id);
    setWeather(v.weather || "");
    setAttendees(v.attendees || "");
    setAccessNotes(v.access_notes || "");
    setChecker((v as any).checker || "");
    setReviewer((v as any).reviewer || "");
    setApprover((v as any).approver || "");
    setClosingNotes((v as any).closing_notes || DEFAULT_CLOSING);
    setShowModal(true);
  };

  const openNew = () => {
    setEditingId(null);
    setWeather("");
    setAttendees("");
    setAccessNotes("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!currentProject) return;
    try {
      if (editingId) {
        // Update existing visit
        const updated = await visitsApi.update(editingId, {
          weather,
          attendees,
          access_notes: accessNotes,
          checker,
          reviewer,
          approver,
          closing_notes: closingNotes,
        } as any);
        setVisits(visits.map((v) => (v.id === editingId ? { ...v, ...updated } : v)));
        setShowModal(false);
        resetForm();
        showToast("Visit updated");
      } else {
        // Create new visit
        const created = await visitsApi.create({
          project_id: currentProject.id,
          weather,
          attendees,
          access_notes: accessNotes,
          checker,
          reviewer,
          approver,
          closing_notes: closingNotes,
        });
        setVisits([created, ...visits]);
        setShowModal(false);
        resetForm();
        showToast(`Visit #${created.visit_no} created`);
        setCurrentVisit(created);
        setScreen("snags");
      }
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const closeVisit = async (id: string) => {
    try {
      const updated = await visitsApi.close(id);
      setVisits(visits.map((v) => (v.id === id ? { ...v, status: "closed" as const } : v)));
      showToast("Visit closed");
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const reopenVisit = async (id: string) => {
    try {
      await visitsApi.reopen(id);
      setVisits(visits.map((v) => (v.id === id ? { ...v, status: "open" as const } : v)));
      showToast("Visit reopened — you can add items again");
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const deleteVisit = async (v: typeof visits[0]) => {
    const ok = await confirm({
      title: `Delete Visit ${v.visit_no}?`,
      message: "This will permanently remove the site visit and all items recorded on it. This can't be undone.",
      confirmLabel: "Delete visit",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await visitsApi.delete(v.id);
      setVisits(visits.filter((x) => x.id !== v.id));
      showToast("Visit deleted");
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const openVisit = (v: typeof visits[0]) => {
    setCurrentVisit(v);
    setScreen("snags");
  };

  const openCount = visits.filter((v) => v.status === "open").length;
  const closedCount = visits.filter((v) => v.status === "closed").length;
  const modalOpen = showModal;

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[var(--bg)] border-b border-[var(--border)] px-4 py-3 flex items-center gap-3">
        <button onClick={() => setScreen("projects")} className="p-2 rounded-full hover:bg-[var(--bg3)] text-[var(--text2)]">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center min-w-0">
          <h2 className="text-base font-semibold truncate text-[var(--text-primary)]">{currentProject?.name}</h2>
          <p className="text-[11px] text-[var(--text3)]">{currentProject?.client}</p>
        </div>
        <div className="w-9" />
      </div>

      {/* Content */}
      <div className="px-5 py-4 pb-28">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5 mb-5 animate-slide-up">
          <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-3 text-center">
            <div className="text-xl font-bold font-mono text-[var(--text-primary)]">{visits.length}</div>
            <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider mt-0.5">Total Visits</div>
          </div>
          <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-3 text-center">
            <div className="text-xl font-bold font-mono text-brand">{openCount}</div>
            <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider mt-0.5">Open</div>
          </div>
          <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-3 text-center">
            <div className="text-xl font-bold font-mono text-success">{closedCount}</div>
            <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider mt-0.5">Closed</div>
          </div>
        </div>

        {/* Visit list */}
        {loading ? (
          <div className="text-center py-12 text-[var(--text3)]">Loading…</div>
        ) : visits.length === 0 ? (
          <div className="text-center py-16 text-[var(--text3)] animate-fade-in">
            <ClipboardList className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No site visits yet</p>
            <p className="text-xs mt-1">Tap + to start your first inspection</p>
          </div>
        ) : (
          visits.map((v, i) => (
            <div
              key={v.id}
              className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-4 mb-2.5 animate-slide-up"
              style={{ animationDelay: `${Math.min(i, 4) * 50}ms` }}
            >
              <button
                onClick={() => openVisit(v)}
                className="w-full text-left"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
                      Site Visit #{v.visit_no}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-[var(--text3)] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(v.visit_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      {v.weather && (
                        <span className="text-[11px] text-[var(--text3)] flex items-center gap-1">
                          <CloudSun className="w-3 h-3" /> {v.weather}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={clsx(
                      "text-[11px] font-semibold px-2.5 py-0.5 rounded-full",
                      v.status === "open"
                        ? "text-brand bg-brand/10"
                        : "text-success bg-success/10"
                    )}
                  >
                    {v.status === "open" ? "Open" : "Closed"}
                  </span>
                </div>
                {v.inspector && (
                  <p className="text-[11px] text-[var(--text3)] mt-1.5">Inspector: {v.inspector}</p>
                )}
              </button>

              {/* Actions */}
              <div className="flex gap-2 mt-3 pt-2.5 border-t border-[var(--border)]">
                {v.status === "open" ? (
                  <button
                    onClick={() => closeVisit(v.id)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold bg-success/10 text-success hover:bg-success/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" /> Close Visit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => reopenVisit(v.id)}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold bg-brand/10 text-brand hover:bg-brand/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Unlock className="w-3.5 h-3.5" /> Reopen
                    </button>
                    <button
                      onClick={() => openVisit(v)}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold bg-[var(--surface)] text-[var(--text2)] hover:text-[var(--text-primary)] transition-all flex items-center justify-center gap-1.5"
                    >
                      View Report
                    </button>
                  </>
                )}
                <button
                  onClick={() => deleteVisit(v)}
                  className="p-2 rounded-lg text-[var(--text2)] hover:text-[var(--text-primary)] hover:bg-[var(--bg3)] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openEdit(v)}
                  className="p-2 rounded-lg bg-[var(--surface)] text-[var(--text2)] hover:text-[var(--text-primary)] transition-colors"
                  title="Edit visit settings"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      {!modalOpen && (
        <button
          onClick={() => openNew()}
          className="fixed bottom-24 right-[max(20px,calc((100%-480px)/2+20px))] w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center shadow-[var(--fab-shadow)] hover:scale-110 active:scale-95 transition-transform z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Create Visit modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center animate-fade-in"
          onClick={() => { setShowModal(false); resetForm(); }}
          style={{ height: "100vh", maxHeight: "100dvh" }}
        >
          <div
            className="w-full max-w-[480px] bg-[var(--bg2)] rounded-t-2xl p-5 overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "90dvh" }}
          >
            <div className="w-10 h-1 bg-[var(--border)] rounded-full mx-auto mb-4" />
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{editingId ? "Edit Visit" : "New Site Visit"}</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-[var(--text3)]"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-wider block mb-1.5">Weather</label>
                <input value={weather} onChange={(e) => setWeather(e.target.value)} placeholder="e.g. Sunny, 18°C, light wind"
                  onFocus={(e) => {
                    const el = e.currentTarget;
                    setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
                  }}
                  className="w-full px-3.5 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-wider block mb-1.5">Attendees</label>
                <input value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="e.g. John, Mary, Client rep"
                  onFocus={(e) => {
                    const el = e.currentTarget;
                    setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
                  }}
                  className="w-full px-3.5 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-wider block mb-1.5">Access Notes</label>
                <input value={accessNotes} onChange={(e) => setAccessNotes(e.target.value)} placeholder="e.g. Scaffolding required for levels 2-4"
                  onFocus={(e) => {
                    const el = e.currentTarget;
                    setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
                  }}
                  className="w-full px-3.5 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
                />
              </div>

              {/* Document Control roles (copied from previous visit) */}
              <div className="pt-2 border-t border-[var(--border)]">
                <p className="text-[10px] text-[var(--text3)] mb-2">Document Control (for PDF report)</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-[var(--text3)] block mb-1">Checker</label>
                    <input value={checker} onChange={(e) => setChecker(e.target.value)} placeholder="Name"
                      className="w-full px-2.5 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text3)] block mb-1">Reviewer</label>
                    <input value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="Name"
                      className="w-full px-2.5 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text3)] block mb-1">Approver</label>
                    <input value={approver} onChange={(e) => setApprover(e.target.value)} placeholder="Name"
                      className="w-full px-2.5 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Report closing text */}
              <div className="pt-2 border-t border-[var(--border)]">
                <label className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-wider block mb-1.5">Report Footer Text</label>
                <textarea
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors resize-none leading-relaxed"
                />
                <p className="text-[9px] text-[var(--text3)] mt-1">This text appears on the last page of the PDF report</p>
              </div>
            </div>

            <button onClick={handleSave}
              className="w-full h-12 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition-all"
            >
              {editingId ? "Save Changes" : "Start Inspection"}
            </button>
          </div>
        </div>
      )}

      {!modalOpen && <BottomNav active="projects" />}
    </div>
  );
}
