"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { getToken, setToken } from "@/lib/api";
import LoginScreen from "@/components/LoginScreen";
import ProjectsScreen from "@/components/ProjectsScreen";
import SnagsScreen from "@/components/SnagsScreen";
import CaptureScreen from "@/components/CaptureScreen";
import PricingScreen from "@/components/PricingScreen";
import Toast from "@/components/Toast";

export default function Home() {
  const { screen, setScreen, setAuth, toast } = useStore();

  // Restore session on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      // Token exists — skip login
      // In production, verify token is still valid via /api/auth/verify
      setAuth({ id: "restored", email: "user" }, token);
      setScreen("projects");
    }
  }, [setAuth, setScreen]);

  return (
    <>
      {screen === "login" && <LoginScreen />}
      {screen === "projects" && <ProjectsScreen />}
      {screen === "snags" && <SnagsScreen />}
      {screen === "capture" && <CaptureScreen />}
      {screen === "pricing" && <PricingScreen />}
      {toast && <Toast message={toast} />}
    </>
  );
}
