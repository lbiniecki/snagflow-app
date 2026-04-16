"use client";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { getToken, setToken } from "@/lib/api";
import LoginScreen from "@/components/LoginScreen";
import ProjectsScreen from "@/components/ProjectsScreen";
import SiteVisitsScreen from "@/components/SiteVisitsScreen";
import SnagsScreen from "@/components/SnagsScreen";
import CaptureScreen from "@/components/CaptureScreen";
import PricingScreen from "@/components/PricingScreen";
import SettingsScreen from "@/components/SettingsScreen";
import OfflineBanner from "@/components/OfflineBanner";
import Toast from "@/components/Toast";
import { ConfirmProvider } from "@/components/ConfirmDialog";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function Home() {
  const { screen, setScreen, setAuth, showToast, toast } = useStore();

  // Restore session on mount
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const init = async () => {
      try {
        // 1. Verify token & get user info
        const meRes = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!meRes.ok) throw new Error("Token expired");
        const user = await meRes.json();

        setAuth({ id: user.id, email: user.email }, token);

        // 2. Auto-join company if there's a pending invite for this email
        try {
          const joinRes = await fetch(`${API}/companies/join`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          if (joinRes.ok) {
            const joinData = await joinRes.json();
            if (joinData?.status === "joined") {
              showToast(joinData.message || "You've joined a team!");
            }
          }
        } catch {
          // Non-critical — continue to projects even if join check fails
        }

        setScreen("projects");
      } catch {
        setToken(null);
        setScreen("login");
      }
    };

    init();
  }, [setAuth, setScreen, showToast]);

  return (
    <ConfirmProvider>
      {screen !== "login" && <OfflineBanner />}
      {screen === "login" && <LoginScreen />}
      {screen === "projects" && <ProjectsScreen />}
      {screen === "visits" && <SiteVisitsScreen />}
      {screen === "snags" && <SnagsScreen />}
      {screen === "capture" && <CaptureScreen />}
      {screen === "pricing" && <PricingScreen />}
      {screen === "settings" && <SettingsScreen />}
      {toast && <Toast message={toast} />}
    </ConfirmProvider>
  );
}
