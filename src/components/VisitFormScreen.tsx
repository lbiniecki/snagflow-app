"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { siteVisits as visitsApi, transcription } from "@/lib/api";
import { useAudioRecorder } from "@/lib/useAudioRecorder";
import { useOnlineStatus } from "@/lib/useOnlineStatus";
import { ChevronLeft, Mic, WifiOff } from "lucide-react";
import clsx from "clsx";

const DEFAULT_CLOSING = "If requested, notice must be given to allow for a site visit to review prior to closing up or concealing the item of works.\n\nThe contractor is to confirm that the above actions have been carried out and provide photographic record of the associated works. The contractor is to sign the items as closed and e-mail to originator.";

export default function VisitFormScreen() {
  const {
    currentProject, setScreen,
    visits, setVisits, setCurrentVisit,
    showToast,
    editingVisit, setEditingVisit,
  } = useStore();
  const { isRecording, secondsLeft, startRecording, stopRecording, error: micError } = useAudioRecorder();
  const isOnline = useOnlineStatus();

  const isEdit = !!editingVisit;

  // ── Form state ────────────────────────────────────────────────────
  // In edit mode, seed from the visit being edited. In create mode,
  // seed from the most recent visit's document-control fields so the
  // user doesn't re-type Checker/Reviewer/Approver/Footer each time.
  const mostRecent = visits[0] as any | undefined;

  const [weather, setWeather] = useState(editingVisit?.weather || "");
  const [attendees, setAttendees] = useState(editingVisit?.attendees || "");
  const [accessNotes, setAccessNotes] = useState(editingVisit?.access_notes || "");
  const [checker, setChecker] = useState(
    (editingVisit as any)?.checker ?? mostRecent?.checker ?? ""
  );
  const [reviewer, setReviewer] = useState(
    (editingVisit as any)?.reviewer ?? mostRecent?.reviewer ?? ""
  );
  const [approver, setApprover] = useState(
    (editingVisit as any)?.approver ?? mostRecent?.approver ?? ""
  );
  const [closingNotes, setClosingNotes] = useState(
    (editingVisit as any)?.closing_notes ?? mostRecent?.closing_notes ?? DEFAULT_CLOSING
  );

  // Visit-number display override. visit_no (integer, auto-increment)
  // stays managed by the backend; this field lets users show a custom
  // ref on the PDF and UI ("MIL-V01", "2026/04/13", etc.). Empty string
  // = use the auto number. The backend normalises to NULL on save.
  //
  // In edit mode: seed from the stored visit_ref.
  // In create mode: show the next auto-increment as a placeholder so
  //   the user knows what they'll get if they leave it blank.
  const nextVisitNo = editingVisit
    ? editingVisit.visit_no
    : (visits.reduce((max, v) => Math.max(max, v.visit_no), 0) + 1);
  const [visitRef, setVisitRef] = useState<string>(
    (editingVisit?.visit_ref ?? "") as string
  );

  // Dirty-detection snapshot (edit mode only)
  const [originalSnapshot] = useState(() => ({
    visitRef: (editingVisit?.visit_ref ?? "") as string,
    weather: editingVisit?.weather || "",
    attendees: editingVisit?.attendees || "",
    accessNotes: editingVisit?.access_notes || "",
    checker: (editingVisit as any)?.checker || "",
    reviewer: (editingVisit as any)?.reviewer || "",
    approver: (editingVisit as any)?.approver || "",
    closingNotes: (editingVisit as any)?.closing_notes || DEFAULT_CLOSING,
  }));

  const [saving, setSaving] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [micTarget, setMicTarget] = useState<"weather" | "accessNotes" | null>(null);
  const [showDiscardPrompt, setShowDiscardPrompt] = useState(false);

  // Safety: clear editingVisit on unmount so next entry is clean
  useEffect(() => {
    return () => {
      if (editingVisit) setEditingVisit(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDirty = isEdit && (
    visitRef !== originalSnapshot.visitRef ||
    weather !== originalSnapshot.weather ||
    attendees !== originalSnapshot.attendees ||
    accessNotes !== originalSnapshot.accessNotes ||
    checker !== originalSnapshot.checker ||
    reviewer !== originalSnapshot.reviewer ||
    approver !== originalSnapshot.approver ||
    closingNotes !== originalSnapshot.closingNotes
  );

  // ── Mic handler — shared between Weather + Access Notes ──
  const handleMic = async (
    target: "weather" | "accessNotes",
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

  // ── Navigation ────────────────────────────────────────────────────
  const navigateBack = () => {
    setEditingVisit(null);
    setScreen("visits");
  };

  // ── Save handlers ─────────────────────────────────────────────────
  const handleSaveEdit = async (): Promise<boolean> => {
    if (!editingVisit) return false;
    setSaving(true);
    try {
      const updated = await visitsApi.update(editingVisit.id, {
        visit_ref: visitRef,
        weather,
        attendees,
        access_notes: accessNotes,
        checker,
        reviewer,
        approver,
        closing_notes: closingNotes,
      } as any);
      setVisits(visits.map((v) => (v.id === editingVisit.id ? { ...v, ...updated } : v)));
      showToast("Visit updated");
      navigateBack();
      return true;
    } catch (err: any) {
      showToast(err.message || "Failed to save visit");
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
    setSaving(true);
    try {
      const created = await visitsApi.create({
        project_id: currentProject.id,
        visit_ref: visitRef || null,
        weather,
        attendees,
        access_notes: accessNotes,
        checker,
        reviewer,
        approver,
        closing_notes: closingNotes,
      });
      setVisits([created, ...visits]);
      setCurrentVisit(created);
      const createdLabel = created.visit_ref || created.visit_no;
      showToast(`Visit #${createdLabel} created`);
      // Jump into Items to start inspecting — matches old behaviour
      setEditingVisit(null);
      setScreen("snags");
    } catch (err: any) {
      showToast(err.message || "Failed to create visit");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = () => (isEdit ? handleSaveEdit() : handleSaveCreate());

  // ── Back navigation ───────────────────────────────────────────────
  const handleBack = () => {
    if (isDirty) {
      setShowDiscardPrompt(true);
      return;
    }
    navigateBack();
  };

  const handleDiscardAndExit = () => {
    setShowDiscardPrompt(false);
    navigateBack();
  };

  const handleSaveFromPrompt = async () => {
    setShowDiscardPrompt(false);
    await handleSaveEdit();
  };

  const screenTitle = isEdit ? "Edit Visit" : "New Site Visit";
  const submitLabel = saving
    ? "Saving…"
    : isEdit
      ? "Save Changes"
      : "Start Inspection";

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
        {/* Visit Number — optional display override.
            Integer visit_no auto-increments on the backend; this field
            lets users display a custom scheme on reports (e.g.
            "MIL-V01", "2026/04/13"). Leaving it blank falls back to
            the next auto number, shown as placeholder. */}
        <div className="mb-5 animate-slide-up">
          <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider block mb-2">Visit Number</label>
          <input
            value={visitRef}
            onChange={(e) => setVisitRef(e.target.value)}
            placeholder={`${nextVisitNo}  (auto) — or type your own e.g. MIL-V01, 2026/04/13`}
            maxLength={50}
            className="w-full px-3.5 py-3 bg-[var(--bg2)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
          />
          <p className="text-xs text-[var(--text3)] mt-1">
            Leave blank to use the auto-incrementing number ({nextVisitNo}). Custom values appear on reports and visit cards.
          </p>
        </div>

        {/* Weather + mic */}
        <div className="mb-5 animate-slide-up delay-50">
          <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider block mb-2">Weather</label>
          <div className="flex gap-2 items-center">
            <input
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              placeholder="e.g. Sunny, 18°C, light wind"
              className="flex-1 px-3.5 py-3 bg-[var(--bg2)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
            />
            <button
              onClick={() => handleMic("weather", setWeather)}
              disabled={transcribing || (isRecording && micTarget !== "weather") || !isOnline}
              className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                isRecording && micTarget === "weather"
                  ? "bg-critical text-white animate-recording"
                  : "bg-[var(--surface)] text-[var(--text2)] hover:text-[var(--text-primary)] hover:bg-[var(--bg3)]",
                !isOnline && "opacity-30"
              )}
              title={!isOnline ? "Voice requires connection" : ""}
              aria-label="Dictate weather"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
          {isRecording && micTarget === "weather" && (
            <p className="text-xs text-critical font-semibold mt-1.5">● Recording… {secondsLeft}s</p>
          )}
        </div>

        {/* Attendees */}
        <div className="mb-5 animate-slide-up delay-50">
          <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider block mb-2">Attendees</label>
          <input
            value={attendees}
            onChange={(e) => setAttendees(e.target.value)}
            placeholder="e.g. John, Mary, Client rep"
            className="w-full px-3.5 py-3 bg-[var(--bg2)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
          />
        </div>

        {/* Access Notes + mic */}
        <div className="mb-5 animate-slide-up delay-100">
          <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider block mb-2">Access Notes</label>
          <div className="flex gap-3 items-start">
            <textarea
              value={accessNotes}
              onChange={(e) => setAccessNotes(e.target.value)}
              placeholder="e.g. Scaffolding required for levels 2-4"
              rows={3}
              className="flex-1 px-3.5 py-3 bg-[var(--bg2)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors resize-none leading-relaxed"
            />
            <button
              onClick={() => handleMic("accessNotes", setAccessNotes)}
              disabled={transcribing || (isRecording && micTarget !== "accessNotes") || !isOnline}
              className={clsx(
                "w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                isRecording && micTarget === "accessNotes"
                  ? "bg-critical text-white animate-recording"
                  : "bg-[var(--surface)] text-[var(--text2)] hover:text-[var(--text-primary)] hover:bg-[var(--bg3)]",
                !isOnline && "opacity-30"
              )}
              title={!isOnline ? "Voice requires connection" : ""}
              aria-label="Dictate access notes"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
          {isRecording && micTarget === "accessNotes" && (
            <p className="text-xs text-critical font-semibold mt-1.5">● Recording… {secondsLeft}s</p>
          )}
          {transcribing && (
            <p className="text-xs text-[var(--text2)] mt-1.5">Transcribing audio…</p>
          )}
          {micError && (
            <p className="text-xs text-critical mt-1.5">{micError}</p>
          )}
        </div>

        {/* Document Control roles */}
        <div className="mb-5 animate-slide-up delay-150 pt-3 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--text3)] uppercase tracking-wider mb-2">Document Control (for PDF report)</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-[var(--text3)] block mb-1">Checker</label>
              <input
                value={checker}
                onChange={(e) => setChecker(e.target.value)}
                placeholder="Name"
                className="w-full px-2.5 py-2 bg-[var(--bg2)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text3)] block mb-1">Reviewer</label>
              <input
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
                placeholder="Name"
                className="w-full px-2.5 py-2 bg-[var(--bg2)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text3)] block mb-1">Approver</label>
              <input
                value={approver}
                onChange={(e) => setApprover(e.target.value)}
                placeholder="Name"
                className="w-full px-2.5 py-2 bg-[var(--bg2)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Report Footer Text */}
        <div className="mb-8 animate-slide-up delay-200 pt-3 border-t border-[var(--border)]">
          <label className="text-xs font-semibold text-[var(--text2)] uppercase tracking-wider block mb-2">Report Footer Text</label>
          <textarea
            value={closingNotes}
            onChange={(e) => setClosingNotes(e.target.value)}
            rows={4}
            className="w-full px-3.5 py-2.5 bg-[var(--bg2)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors resize-none leading-relaxed"
          />
          <p className="text-xs text-[var(--text3)] mt-1">This text appears on the last page of the PDF report</p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full h-[52px] bg-brand hover:bg-brand-light text-white text-base font-semibold rounded-xl transition-all disabled:opacity-50 animate-slide-up delay-200"
        >
          {submitLabel}
        </button>
      </div>

      {/* Unsaved-changes dialog — edit mode only */}
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
              You've made changes to this visit. What would you like to do?
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
