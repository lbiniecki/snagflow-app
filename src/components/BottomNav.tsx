"use client";

import { useStore } from "@/lib/store";
import { FolderOpen, ClipboardList, Camera, Settings } from "lucide-react";
import clsx from "clsx";

const tabs = [
  { id: "projects" as const, label: "Projects", icon: FolderOpen },
  { id: "visits" as const, label: "Visits", icon: ClipboardList },
  { id: "capture" as const, label: "Capture", icon: Camera },
  { id: "settings" as const, label: "Settings", icon: Settings },
];

export default function BottomNav({ active }: { active: string }) {
  const { setScreen, currentProject, currentVisit } = useStore();

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-[var(--bg2)] border-t border-[var(--border)] z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}
    >
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const disabled =
            tab.id === "visits" && !currentProject ||
            tab.id === "capture" && !currentVisit;
          return (
            <button
              key={tab.id}
              onClick={() => !disabled && setScreen(tab.id)}
              disabled={disabled}
              className={clsx(
                "flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                active === tab.id ? "text-brand" : "text-[var(--nav-inactive)]",
                disabled && "opacity-30 cursor-not-allowed"
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
