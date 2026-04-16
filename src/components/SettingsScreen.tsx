"use client";

import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { companies, profiles } from "@/lib/api";
import type { Company, CompanyMember } from "@/lib/api";
import {
  ChevronLeft, Upload, Trash2, UserPlus, X, Building2, Users, Image, User,
  Clock, Mail,
} from "lucide-react";
import BottomNav from "./BottomNav";
import { useConfirm } from "./ConfirmDialog";

// Pending invite type (from the new /pending-invites endpoint)
interface PendingInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export default function SettingsScreen() {
  const { setScreen, showToast, user, setIsCompanyOwner } = useStore();
  const confirm = useConfirm();

  const [company, setCompanyRaw] = useState<Company | null>(null);
  // Wrapper that also syncs the global isCompanyOwner flag. Every place in
  // this file uses `setCompany` — centralising the sync here means we don't
  // have to remember to add setIsCompanyOwner at six different call sites.
  const setCompany = (c: Company | null) => {
    setCompanyRaw(c);
    setIsCompanyOwner(c ? !!c.is_owner : true);
  };
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  // Helper to get auth headers
  const authHeaders = () => {
    const token = localStorage.getItem("voxsite_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // Fetch company + profile + members + pending invites
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Load profile
        try {
          const p = await profiles.get();
          setFirstName(p.first_name || "");
          setLastName(p.last_name || "");
        } catch {}

        // Load company
        const c = await companies.getMyCompany();
        setCompany(c);
        if (c) {
          setCompanyName(c.name);

          // Fetch members (now returns email + full_name from profiles join)
          try {
            const token = localStorage.getItem("voxsite_token");
            const mRes = await fetch(`${API}/companies/members`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (mRes.ok) {
              const mData = await mRes.json();
              setMembers(mData);
            }
          } catch {}

          // Fetch pending invites
          try {
            const token = localStorage.getItem("voxsite_token");
            const iRes = await fetch(`${API}/companies/pending-invites`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (iRes.ok) {
              const iData = await iRes.json();
              setPendingInvites(iData);
            }
          } catch {}
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [API]);

  const handleCreateCompany = async () => {
    if (!companyName.trim()) return;
    setCreating(true);
    try {
      const c = await companies.create(companyName.trim());
      setCompany(c);
      showToast("Company created");
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await profiles.update({ first_name: firstName.trim(), last_name: lastName.trim() });
      setProfileSaved(true);
      showToast("Profile saved — this name will appear on reports");
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleUpdateName = async () => {
    if (!company || !companyName.trim()) return;
    try {
      const updated = await companies.update({ name: companyName.trim() });
      setCompany(updated);
      showToast("Company name updated");
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast("Uploading logo…");
      await companies.uploadLogo(file);
      const c = await companies.getMyCompany();
      setCompany(c);
      showToast("Logo uploaded");
    } catch (err: any) {
      showToast(err.message);
    }
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleDeleteLogo = async () => {
    const ok = await confirm({
      title: "Remove company logo?",
      message: "Your logo will no longer appear on PDF reports. You can upload a new one anytime.",
      confirmLabel: "Remove logo",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await companies.deleteLogo();
      setCompany(company ? { ...company, logo_path: undefined } : null);
      showToast("Logo removed");
    } catch (err: any) {
      showToast(err.message);
    }
  };

  // ── FIXED: handles both "added" (existing user) and "invited" (new user) ──
  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return;
    setAdding(true);
    try {
      const token = localStorage.getItem("voxsite_token");
      const res = await fetch(`${API}/companies/members`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: newMemberEmail.trim(), role: "member" }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.detail || "Failed to add member");
        return;
      }

      if (data.status === "added") {
        // User existed — added directly, refresh member list
        const mRes = await fetch(`${API}/companies/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (mRes.ok) setMembers(await mRes.json());
        showToast(data.message || "Member added");
      } else if (data.status === "invited") {
        // User doesn't exist yet — invite created, refresh invites
        const iRes = await fetch(`${API}/companies/pending-invites`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (iRes.ok) setPendingInvites(await iRes.json());
        showToast(data.message || "Invite sent");
      }

      setNewMemberEmail("");

      // Refresh company to update member_count
      const c = await companies.getMyCompany();
      setCompany(c);
    } catch (err: any) {
      showToast(err.message || "Failed to add member");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (m: CompanyMember) => {
    const name = getMemberDisplay(m);
    const ok = await confirm({
      title: "Remove team member?",
      message: `${name} will lose access to this company's projects immediately. They'll keep their own account and can be re-invited later if needed.`,
      confirmLabel: "Remove",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      await companies.removeMember(m.id);
      setMembers(members.filter((x) => x.id !== m.id));
      const c = await companies.getMyCompany();
      setCompany(c);
      showToast("Member removed");
    } catch (err: any) {
      showToast(err.message);
    }
  };

  // ── NEW: revoke a pending invite ──
  const handleRevokeInvite = async (inv: PendingInvite) => {
    const ok = await confirm({
      title: "Revoke this invite?",
      message: `The invitation for ${inv.email} will be cancelled. If they haven't accepted yet, they won't be able to — you can send a new invite later if you change your mind.`,
      confirmLabel: "Revoke invite",
      tone: "destructive",
    });
    if (!ok) return;
    try {
      const token = localStorage.getItem("voxsite_token");
      const res = await fetch(`${API}/companies/invites/${inv.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPendingInvites(pendingInvites.filter((i) => i.id !== inv.id));
        const c = await companies.getMyCompany();
        setCompany(c);
        showToast("Invite revoked");
      } else {
        const data = await res.json();
        showToast(data.detail || "Failed to revoke");
      }
    } catch (err: any) {
      showToast(err.message);
    }
  };

  // Helper: get display name for a member
  const getMemberDisplay = (m: any) => {
    if (m.full_name && m.full_name.trim()) return m.full_name;
    if (m.email && m.email.trim()) return m.email;
    return m.user_id?.slice(0, 8) + "…";
  };

  const getMemberInitial = (m: any) => {
    if (m.full_name && m.full_name.trim()) return m.full_name[0].toUpperCase();
    if (m.email && m.email.trim()) return m.email[0].toUpperCase();
    return "?";
  };

  // Count total seats used (members + pending invites)
  const totalSeats = members.length + pendingInvites.length;

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={handleLogoUpload}
      />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-[var(--bg)] border-b border-[var(--border)] px-4 py-3 flex items-center gap-3">
        <button onClick={() => setScreen("projects")} className="p-2 rounded-full hover:bg-[var(--bg3)] text-[var(--text2)]">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-semibold flex-1 text-center">Settings</h2>
        <div className="w-9" />
      </div>

      {/* Content */}
      <div className="px-5 py-4 pb-28">
        {loading ? (
          <div className="text-center py-12 text-[var(--text3)]">Loading…</div>
        ) : !company ? (
          /* ── No company yet — create one ── */
          <div className="animate-fade-in">
            {/* Profile name (always shown) */}
            <section className="mb-6">
              <h3 className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> Your Name
              </h3>
              <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-4">
                <p className="text-[11px] text-[var(--text3)] mb-3">This name appears as the inspector signature on PDF reports.</p>
                <div className="flex gap-2 mb-2">
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name"
                    className="flex-1 px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors" />
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name"
                    className="flex-1 px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors" />
                </div>
                <button onClick={handleSaveProfile} className="w-full py-2.5 bg-brand text-white text-xs font-semibold rounded-lg transition-all">
                  {profileSaved ? "Saved!" : "Save Name"}
                </button>
              </div>
            </section>

            <div className="text-center py-8">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-[var(--text3)] opacity-40" />
              <h3 className="text-lg font-bold mb-1">Set Up Your Company</h3>
              <p className="text-sm text-[var(--text3)]">Your company logo will appear on PDF reports</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-wider block mb-1.5">Company Name</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Horizon Construction Ltd"
                  autoFocus
                  className="w-full px-3.5 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
                />
              </div>
              <button
                onClick={handleCreateCompany}
                disabled={!companyName.trim() || creating}
                className="w-full h-12 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create Company"}
              </button>
            </div>
          </div>
        ) : (
          /* ── Company exists — show settings ── */
          <div className="space-y-6 animate-fade-in">
            {/* Your Name */}
            <section>
              <h3 className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> Your Name
              </h3>
              <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-4">
                <p className="text-[11px] text-[var(--text3)] mb-3">This name appears as the inspector signature on PDF reports.</p>
                <div className="flex gap-2 mb-2">
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name"
                    className="flex-1 px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors" />
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name"
                    className="flex-1 px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors" />
                </div>
                <button onClick={handleSaveProfile} className="w-full py-2.5 bg-brand text-white text-xs font-semibold rounded-lg transition-all">
                  {profileSaved ? "Saved!" : "Save Name"}
                </button>
              </div>
            </section>

            {/* Company Info */}
            <section>
              <h3 className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Company Info
              </h3>
              <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-4">
                <label className="text-[11px] font-semibold text-[var(--text3)] uppercase tracking-wider block mb-1.5">Name</label>
                <div className="flex gap-2">
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white outline-none focus:border-brand transition-colors"
                  />
                  <button
                    onClick={handleUpdateName}
                    disabled={companyName === company.name}
                    className="px-4 py-2.5 bg-brand text-white text-xs font-semibold rounded-lg disabled:opacity-30 transition-all"
                  >
                    Save
                  </button>
                </div>

                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--border)]">
                  <span className="text-xs text-[var(--text3)]">Plan:</span>
                  <span className="text-xs font-semibold text-brand uppercase">{company.plan}</span>
                  <span className="text-xs text-[var(--text3)]">•</span>
                  <span className="text-xs text-[var(--text3)]">{totalSeats}/{company.max_users} users</span>
                </div>
              </div>
            </section>

            {/* Company Logo */}
            <section>
              <h3 className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Image className="w-4 h-4" /> Company Logo
              </h3>
              <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-4">
                {company.plan === "free" ? (
                  /* ── Free plan: logo is a paid feature ── */
                  company.logo_path ? (
                    // Already has a logo (uploaded before downgrade, or legacy).
                    // Show it, but be clear it won't appear on reports until upgrade.
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden opacity-60">
                        <span className="text-[10px] text-gray-400">Logo</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-yellow-400 font-semibold">Logo uploaded but hidden</p>
                        <p className="text-[11px] text-[var(--text3)]">Upgrade to Starter or higher to show your logo on PDF reports.</p>
                      </div>
                      <button
                        onClick={handleDeleteLogo}
                        className="p-2 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors"
                        title="Remove logo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    // No logo, show upgrade prompt instead of upload button
                    <div className="text-center py-6">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-brand/15 text-brand mb-3">
                        <Image className="w-5 h-5" />
                      </div>
                      <p className="text-sm text-white font-semibold mb-1">Company logo is a Starter feature</p>
                      <p className="text-[12px] text-[var(--text3)] mb-3 px-4 leading-relaxed">
                        {company.is_owner
                          ? "Add your logo to PDF reports and remove the VoxSite watermark by upgrading."
                          : "Once your company owner upgrades, your logo will appear on PDF reports automatically."}
                      </p>
                      {company.is_owner && (
                        <button
                          onClick={() => setScreen("pricing")}
                          className="px-4 py-2 bg-brand hover:bg-brand-light text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          See plans
                        </button>
                      )}
                    </div>
                  )
                ) : company.logo_path ? (
                  /* ── Paid plan, logo uploaded ── */
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                      <span className="text-[10px] text-gray-400">Logo</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-green-400 font-semibold">Logo uploaded</p>
                      <p className="text-[11px] text-[var(--text3)]">Appears on PDF report covers and headers</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => logoInputRef.current?.click()}
                        className="p-2 rounded-lg bg-[var(--surface)] text-[var(--text2)] hover:text-white transition-colors"
                        title="Replace logo"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleDeleteLogo}
                        className="p-2 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors"
                        title="Remove logo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Paid plan, no logo yet ── */
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-[var(--border)] rounded-xl text-center hover:border-brand transition-colors group"
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-[var(--text3)] group-hover:text-brand transition-colors" />
                    <p className="text-sm text-[var(--text2)] group-hover:text-white transition-colors">Upload company logo</p>
                    <p className="text-[11px] text-[var(--text3)] mt-1">PNG or JPEG, max 5MB</p>
                  </button>
                )}
              </div>
            </section>

            {/* Team Members */}
            <section>
              <h3 className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" /> Team Members ({totalSeats}/{company.max_users})
              </h3>
              <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-4">
                {/* ── Active members ── */}
                {members.map((m) => {
                  const isOwner = m.role === "owner";
                  const isMe = m.user_id === user?.id;
                  const display = getMemberDisplay(m);
                  const initial = getMemberInitial(m);

                  return (
                    <div key={m.id} className="flex items-center gap-3 mb-3 pb-3 border-b border-[var(--border)] last:mb-0 last:pb-0 last:border-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        isOwner ? "bg-brand/20 text-brand" : "bg-[var(--bg3)] text-[var(--text2)]"
                      }`}>
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{display}</p>
                        {m.email && m.full_name && (
                          <p className="text-[10px] text-[var(--text3)] truncate">{m.email}</p>
                        )}
                        <p className={`text-[10px] font-semibold uppercase ${
                          isOwner ? "text-brand" : "text-[var(--text3)]"
                        }`}>{m.role}</p>
                      </div>
                      {/* Only owner can remove, and can't remove self */}
                      {company.is_owner && !isMe && (
                        <button
                          onClick={() => handleRemoveMember(m)}
                          className="p-1.5 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* ── Pending invites ── */}
                {pendingInvites.length > 0 && (
                  <div className={members.length > 0 ? "mt-2 pt-3 border-t border-[var(--border)]" : ""}>
                    {pendingInvites.map((inv) => (
                      <div key={inv.id} className="flex items-center gap-3 mb-3 last:mb-0">
                        <div className="w-8 h-8 rounded-full bg-yellow-400/10 flex items-center justify-center">
                          <Mail className="w-3.5 h-3.5 text-yellow-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{inv.email}</p>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-yellow-400" />
                            <span className="text-[10px] text-yellow-400 font-semibold uppercase">Pending invite</span>
                          </div>
                        </div>
                        {company.is_owner && (
                          <button
                            onClick={() => handleRevokeInvite(inv)}
                            className="p-1.5 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors"
                            title="Revoke invite"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Add member input ── */}
                {company.is_owner && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                    <input
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                      placeholder="team@company.com"
                      className="flex-1 px-3 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
                    />
                    <button
                      onClick={handleAddMember}
                      disabled={!newMemberEmail.trim() || adding}
                      className="px-3 py-2.5 bg-brand text-white text-xs font-semibold rounded-lg disabled:opacity-30 transition-all flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> {adding ? "…" : "Add"}
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      <BottomNav active="settings" />
    </div>
  );
}
// updated
