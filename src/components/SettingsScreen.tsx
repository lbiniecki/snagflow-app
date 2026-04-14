"use client";

import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { companies, profiles } from "@/lib/api";
import type { Company, CompanyMember } from "@/lib/api";
import {
  ChevronLeft, Upload, Trash2, UserPlus, X, Building2, Users, Image, User,
} from "lucide-react";
import BottomNav from "./BottomNav";

export default function SettingsScreen() {
  const { setScreen, showToast, user } = useStore();

  const [company, setCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Fetch company + profile data
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
          const m = await companies.listMembers();
          setMembers(m);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
      // Refresh company data
      const c = await companies.getMyCompany();
      setCompany(c);
      showToast("Logo uploaded");
    } catch (err: any) {
      showToast(err.message);
    }
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleDeleteLogo = async () => {
    try {
      await companies.deleteLogo();
      setCompany(company ? { ...company, logo_path: undefined } : null);
      showToast("Logo removed");
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return;
    try {
      const member = await companies.addMember(newMemberEmail.trim());
      setMembers([...members, member]);
      setNewMemberEmail("");
      showToast("Member added");
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await companies.removeMember(memberId);
      setMembers(members.filter((m) => m.id !== memberId));
      showToast("Member removed");
    } catch (err: any) {
      showToast(err.message);
    }
  };

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
                  <span className="text-xs text-[var(--text3)]">{company.member_count || 1}/{company.max_users} users</span>
                </div>
              </div>
            </section>

            {/* Company Logo */}
            <section>
              <h3 className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider mb-3 flex items-center gap-2">
                <Image className="w-4 h-4" /> Company Logo
              </h3>
              <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-4">
                {company.logo_path ? (
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
                <Users className="w-4 h-4" /> Team Members ({company.member_count || 1}/{company.max_users})
              </h3>
              <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-xl p-4">
                {/* Current user (owner) */}
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[var(--border)]">
                  <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand text-xs font-bold">
                    {user?.email?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.email}</p>
                    <p className="text-[10px] text-brand font-semibold uppercase">Owner</p>
                  </div>
                </div>

                {/* Other members */}
                {members
                  .filter((m) => m.user_id !== user?.id)
                  .map((m) => (
                    <div key={m.id} className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-[var(--bg3)] flex items-center justify-center text-[var(--text3)] text-xs font-bold">
                        ?
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{m.user_id.slice(0, 8)}…</p>
                        <p className="text-[10px] text-[var(--text3)] uppercase">{m.role}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        className="p-1.5 rounded-lg bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                {/* Add member */}
                {company.is_owner && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                    <input
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="team@company.com"
                      className="flex-1 px-3 py-2.5 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
                    />
                    <button
                      onClick={handleAddMember}
                      disabled={!newMemberEmail.trim()}
                      className="px-3 py-2.5 bg-brand text-white text-xs font-semibold rounded-lg disabled:opacity-30 transition-all flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Add
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
