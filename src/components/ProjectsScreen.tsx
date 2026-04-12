"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { projects as projectsApi } from "@/lib/api";
import { LogOut, Plus, X } from "lucide-react";
import BottomNav from "./BottomNav";

export default function ProjectsScreen() {
  const {
    user, logout, projects, setProjects, setCurrentProject,
    setScreen, showToast, loading, setLoading,
  } = useStore();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [address, setAddress] = useState("");

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
    setScreen("snags");
  };

  const totalOpen = projects.reduce((sum, p) => sum + (p.snag_count || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[var(--bg)] border-b border-[var(--border)] px-5 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Projects</h2>
          <p className="text-xs text-[var(--text3)]">Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}</p>
        </div>
        <button onClick={logout} className="p-2.5 rounded-full hover:bg-[var(--bg3)] transition-colors text-[var(--text2)]">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="px-5 py-4 pb-28">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5 mb-5 animate-slide-up">
          <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-3.5 text-center">
            <div className="text-2xl font-bold font-mono">{projects.length}</div>
            <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider mt-1">Projects</div>
          </div>
          <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-3.5 text-center">
            <div className="text-2xl font-bold font-mono text-red-400">{totalOpen}</div>
            <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider mt-1">Total Snags</div>
          </div>
          <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-3.5 text-center">
            <div className="text-2xl font-bold font-mono text-green-400">0</div>
            <div className="text-[10px] text-[var(--text3)] uppercase tracking-wider mt-1">Closed</div>
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
              className="w-full text-left bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-4 mb-2.5 hover:border-[var(--border)] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 transition-all animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold truncate">{p.name}</h3>
                  <p className="text-xs text-[var(--text3)] mt-0.5">{p.client || "—"}</p>
                </div>
                {p.snag_count > 0 && (
                  <span className="text-[11px] font-semibold text-red-400 bg-red-400/10 px-2.5 py-0.5 rounded-full">
                    {p.snag_count} snags
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text3)] mt-2.5">
                Created {new Date(p.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </button>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-[max(20px,calc((100%-480px)/2+20px))] w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/40 hover:scale-110 active:scale-95 transition-transform z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-[480px] bg-[var(--bg2)] rounded-t-2xl p-5 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[var(--border)] rounded-full mx-auto mb-4" />
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold">New Project</h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--text3)]"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-wider block mb-1.5">Project Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Riverside Apartments – Block B" autoFocus
                  className="w-full px-3.5 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-wider block mb-1.5">Client</label>
                <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="e.g. Horizon Developments"
                  className="w-full px-3.5 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-wider block mb-1.5">Site Address</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 42 River Road, Dublin"
                  className="w-full px-3.5 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
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
      )}

      <BottomNav active="projects" />
    </div>
  );
}
