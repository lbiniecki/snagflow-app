"use client";

import { useStore } from "@/lib/store";
import { FolderOpen, List, Camera } from "lucide-react";
import clsx from "clsx";

const tabs = [
  { id: "projects" as const, label: "Projects", icon: FolderOpen },
  { id: "snags" as const, label: "Snags", icon: List },
  { id: "capture" as const, label: "Capture", icon: Camera },
];

export default function BottomNav({ active }: { active: string }) {
  const { setScreen, currentProject } = useStore();

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-[var(--bg2)] border-t border-[var(--border)] z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}
    >
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const disabled = tab.id !== "projects" && !currentProject;
          return (
            <button
              key={tab.id}
              onClick={() => !disabled && setScreen(tab.id)}
              disabled={disabled}
              className={clsx(
                "flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                active === tab.id ? "text-brand" : "text-[var(--text3)]",
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
