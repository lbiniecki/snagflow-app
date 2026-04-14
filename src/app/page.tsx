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
import Toast from "@/components/Toast";

export default function Home() {
  const { screen, setScreen, setAuth, toast } = useStore();

  // Restore session on mount
  useEffect(() => {
  const token = getToken();
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.ok ? r.json() : Promise.reject())
        .then((user) => {
          setAuth({ id: user.id, email: user.email }, token);
          setScreen("projects");
        })
        .catch(() => {
          setToken(null);
          setScreen("login");
        });
    }
  }, [setAuth, setScreen]);

  return (
    <>
      {screen === "login" && <LoginScreen />}
      {screen === "projects" && <ProjectsScreen />}
      {screen === "visits" && <SiteVisitsScreen />}
      {screen === "snags" && <SnagsScreen />}
      {screen === "capture" && <CaptureScreen />}
      {screen === "pricing" && <PricingScreen />}
      {screen === "settings" && <SettingsScreen />}
      {toast && <Toast message={toast} />}
    </>
  );
}
