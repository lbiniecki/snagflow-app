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
      setAuth({ id: "restored", email: "user" }, token);
      setScreen("projects");
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
