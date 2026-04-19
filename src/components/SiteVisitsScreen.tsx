"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { siteVisits as visitsApi } from "@/lib/api";
import {
  ChevronLeft, Plus, ClipboardList, Lock, Unlock,
  Calendar, CloudSun, Trash2, Pencil,
} from "lucide-react";
import clsx from "clsx";
import BottomNav from "./BottomNav";
import { useConfirm } from "./ConfirmDialog";

export default function SiteVisitsScreen() {
  const {
    currentProject, setScreen, visits, setVisits,
    setCurrentVisit, showToast, loading, setLoading,
    setEditingVisit,
  } = useStore();
  const confirm = useConfirm();

  // Fetch visits
  useEffect(() => {
    if (!currentProject) return;
    async function load() {
      setLoading(true);
      try {
        const data = await visitsApi.list(currentProject!.id);
        setVisits(data);
      } catch (err) {
        console.error("Failed to load visits:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentProject, setVisits, setLoading]);

  const openEdit = (v: typeof visits[0]) => {
    setEditingVisit(v);
    setScreen("visitForm");
  };

  const openNew = () => {
    setEditingVisit(null);
    setScreen("visitForm");
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
                {/* Item-count pills — only shown when the visit has at least one item.
                    Each pill is hidden individually if its count is zero, so a visit with
                    5 open items and no closed ones shows just the amber "5 open" pill. */}
                {(v.snag_count ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(v.open_count ?? 0) > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                        {v.open_count} open
                      </span>
                    )}
                    {(v.closed_count ?? 0) > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success">
                        {v.closed_count} closed
                      </span>
                    )}
                  </div>
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
      <button
        onClick={() => openNew()}
        className="fixed bottom-24 right-[max(20px,calc((100%-480px)/2+20px))] w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center shadow-[var(--fab-shadow)] hover:scale-110 active:scale-95 transition-transform z-40"
        aria-label="New site visit"
      >
        <Plus className="w-6 h-6" />
      </button>

      <BottomNav active="projects" />
    </div>
  );
}
