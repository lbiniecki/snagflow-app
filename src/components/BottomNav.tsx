"use client";

import { useStore } from "@/lib/store";
import { FolderOpen, Settings } from "lucide-react";
import clsx from "clsx";

// Bottom nav is for always-available destinations. Visits & Capture
// depend on a selected project/visit, so they don't belong here — use
// the back arrow (ChevronLeft) in the page header to navigate up.
const tabs = [
  { id: "projects" as const, label: "Projects", icon: FolderOpen },
  { id: "settings" as const, label: "Settings", icon: Settings },
];

export default function BottomNav({ active }: { active: string }) {
  const { setScreen } = useStore();

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-[var(--bg2)] border-t border-[var(--border)] z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}
    >
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setScreen(tab.id)}
              className={clsx(
                "flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                active === tab.id ? "text-brand" : "text-[var(--nav-inactive)]"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
