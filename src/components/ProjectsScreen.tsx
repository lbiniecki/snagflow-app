"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { projects as projectsApi, companies as companiesApi } from "@/lib/api";
import { LogOut, Plus, X, Sparkles, Trash2 } from "lucide-react";
import BottomNav from "./BottomNav";
import { useConfirm } from "./ConfirmDialog";

export default function ProjectsScreen() {
  const {
    user, logout, projects, setProjects, setCurrentProject,
    setScreen, showToast, loading, setLoading,
    isCompanyOwner, setIsCompanyOwner,
  } = useStore();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [address, setAddress] = useState("");
  const confirm = useConfirm();

  const deleteProject = async (p: typeof projects[0]) => {
    const ok = await confirm({
      title: "Delete this project?",
      message: `"${p.name}" and all its site visits, items, and photos will be permanently removed. This can't be undone.`,
      confirmLabel: "Delete project",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await projectsApi.delete(p.id);
      setProjects(projects.filter((x) => x.id !== p.id));
      showToast("Project deleted");
    } catch (err: any) {
      showToast(err.message || "Failed to delete project");
    }
  };

  // Fetch projects on mount
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await projectsApi.list();
        setProjects(data);
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [setProjects, setLoading]);

  // Populate ownership flag once per session — cheap lookup, one API call.
  // This is the root screen users land on after login, so doing it here means
  // downstream screens can rely on the flag being set. If the user has no
  // company yet (new signup), we treat them as "owner" since they'll be the
  // one creating the company.
  useEffect(() => {
    if (isCompanyOwner !== null) return; // already resolved
    (async () => {
      try {
        const company = await companiesApi.getMyCompany();
        setIsCompanyOwner(company ? !!company.is_owner : true);
      } catch {
        // Non-fatal — leave null. Screens that check will show the sensible
        // default (e.g. Upgrade pill visible), which matches the pre-fix
        // behaviour so nothing is worse than before.
        setIsCompanyOwner(null);
      }
    })();
  }, [isCompanyOwner, setIsCompanyOwner]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const created = await projectsApi.create({ name, client, address });
      setProjects([created, ...projects]);
      setShowModal(false);
      setName("");
      setClient("");
      setAddress("");
      showToast("Project created");
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const openProject = (p: typeof projects[0]) => {
    setCurrentProject(p);
    setScreen("visits");
  };

  const totalOpen = projects.reduce((sum, p) => sum + (p.snag_count || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[var(--bg)] border-b border-[var(--border)] px-5 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Projects</h2>
          <p className="text-xs text-[var(--text3)]">Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}</p>
        </div>
        <div className="flex items-center gap-1">
          {/* Owner-only: upgrade pill. Hidden for regular members — they
              can't change billing anyway, and the pill is confusing noise. */}
          {isCompanyOwner !== false && (
            <button onClick={() => setScreen("pricing")} className="px-3 py-1.5 rounded-full bg-brand/10 text-brand text-xs font-semibold hover:bg-brand/20 transition-colors flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Upgrade
            </button>
          )}
          <button onClick={logout} className="p-2.5 rounded-full hover:bg-[var(--bg3)] transition-colors text-[var(--text2)]">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4 pb-28">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5 mb-5 animate-slide-up">
          <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-3.5 text-center">
            <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">{projects.length}</div>
            <div className="text-xs text-[var(--text3)] uppercase tracking-wider mt-1">Projects</div>
          </div>
          <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-3.5 text-center">
            <div className="text-2xl font-bold font-mono text-info">{totalOpen}</div>
            <div className="text-xs text-[var(--text3)] uppercase tracking-wider mt-1">Total Items</div>
          </div>
          <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-3.5 text-center">
            <div className="text-2xl font-bold font-mono text-success">0</div>
            <div className="text-xs text-[var(--text3)] uppercase tracking-wider mt-1">Closed</div>
          </div>
        </div>

        {/* Project cards */}
        {loading ? (
          <div className="text-center py-12 text-[var(--text3)]">Loading…</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 text-[var(--text3)] animate-fade-in">
            <p className="text-sm mb-1">No projects yet</p>
            <p className="text-xs">Tap + to create your first project</p>
          </div>
        ) : (
          projects.map((p, i) => (
            <button
              key={p.id}
              onClick={() => openProject(p)}
              className={`w-full text-left bg-[var(--bg2)] border border-[var(--border)] border-l-4 rounded-xl p-4 mb-2.5 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 transition-all animate-slide-up ${
                p.snag_count > 0 ? "border-l-warning" : "border-l-info"
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold truncate text-[var(--text-primary)]">{p.name}</h3>
                  <p className="text-xs text-[var(--text3)] mt-0.5">{p.client || "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {p.snag_count > 0 && (
                    <span className="text-xs font-semibold text-info bg-info/10 px-2.5 py-0.5 rounded-full">
                      {p.snag_count} items
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteProject(p); }}
                    className="p-1.5 rounded-lg bg-critical/10 text-critical hover:bg-critical/20 transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-[var(--text3)] mt-2.5">
                Created {new Date(p.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </button>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-[max(20px,calc((100%-480px)/2+20px))] w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center shadow-[var(--fab-shadow)] hover:scale-110 active:scale-95 transition-transform z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Create modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 z-50 animate-fade-in overflow-y-auto"
          onClick={() => setShowModal(false)}
          style={{ height: "100dvh" }}
        >
          <div className="min-h-full flex items-start justify-center pt-[12vh] pb-8 px-4">
            <div
              className="w-full max-w-[480px] bg-[var(--bg2)] rounded-2xl p-5 animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">New Project</h3>
                <button onClick={() => setShowModal(false)} className="text-[var(--text3)]"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider block mb-1.5">Project Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Riverside Apartments – Block B" autoFocus
                    onFocus={(e) => {
                      const el = e.currentTarget;
                      setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
                    }}
                    className="w-full px-3.5 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider block mb-1.5">Client</label>
                  <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="e.g. Horizon Developments"
                    onFocus={(e) => {
                      const el = e.currentTarget;
                      setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
                    }}
                    className="w-full px-3.5 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider block mb-1.5">Site Address</label>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 42 River Road, Dublin"
                    onFocus={(e) => {
                      const el = e.currentTarget;
                      setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
                    }}
                    className="w-full px-3.5 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
                  />
                </div>
              </div>

              <button onClick={handleCreate} disabled={!name.trim()}
                className="w-full h-12 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {!showModal && <BottomNav active="projects" />}
    </div>
  );
}
