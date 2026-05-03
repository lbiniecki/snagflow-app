"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { getToken, setToken } from "@/lib/api";
import LoginScreen from "@/components/LoginScreen";
import ProjectsScreen from "@/components/ProjectsScreen";
import SiteVisitsScreen from "@/components/SiteVisitsScreen";
import VisitFormScreen from "@/components/VisitFormScreen";
import SnagsScreen from "@/components/SnagsScreen";
import CaptureScreen from "@/components/CaptureScreen";
import PricingScreen from "@/components/PricingScreen";
import SettingsScreen from "@/components/SettingsScreen";
import OfflineBanner from "@/components/OfflineBanner";
import Toast from "@/components/Toast";
import { ConfirmProvider } from "@/components/ConfirmDialog";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Next.js 14 requires components that call useSearchParams() to be inside
// a Suspense boundary, otherwise the build's static-generation phase fails
// with "useSearchParams() should be wrapped in a suspense boundary".
//
// Splitting the component: the outer default export sets up Suspense,
// and the inner AppShellInner contains all the actual logic.

export default function AppPage() {
  return (
    <Suspense fallback={null}>
      <AppShellInner />
    </Suspense>
  );
}

function AppShellInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { screen, setScreen, setAuth, showToast, toast, isCompanyOwner } = useStore();

  // Guard: non-owners can't view Pricing. If someone triggers the screen
  // (e.g. via an older link or stale state), bounce back to Projects.
  // We explicitly check `=== false`: a null flag (pre-load or API failure)
  // does NOT trigger the redirect, so the screen still works for the owner
  // during the brief moment before the flag resolves.
  useEffect(() => {
    if (screen === "pricing" && isCompanyOwner === false) {
      setScreen("projects");
    }
  }, [screen, isCompanyOwner, setScreen]);

  // Restore session on mount; redirect to landing if no session.
  useEffect(() => {
    // If the URL has ?setup=, the user is an invitee arriving to set their
    // password. Don't restore a stale session — let LoginScreen handle it.
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("setup")) {
        // Invitee landed on /app?setup=... directly. Force the login screen
        // so password setup runs. Do NOT redirect to / — that would lose
        // the setup token.
        setScreen("login");
        return;
      }
    }

    // mode= controls login screen state when arriving from landing CTAs
    const mode = searchParams.get("mode");

    const token = getToken();
    if (!token) {
      // No token: this is an unauthenticated visit to /app.
      // If they explicitly clicked "Log in" or "Sign up" on the landing page,
      // honour that and show LoginScreen. Otherwise, redirect to landing.
      if (mode === "login" || mode === "signup") {
        setScreen("login");
        return;
      }
      router.replace("/");
      return;
    }

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
        // Token expired or invalid: clear and bounce to landing.
        // Landing page has clear sign-up/log-in CTAs; user picks where to go.
        setToken(null);
        router.replace("/");
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ConfirmProvider>
      <OfflineBanner />
      {screen === "login" && <LoginScreen />}
      {screen === "projects" && <ProjectsScreen />}
      {screen === "visits" && <SiteVisitsScreen />}
      {screen === "visitForm" && <VisitFormScreen />}
      {screen === "snags" && <SnagsScreen />}
      {screen === "capture" && <CaptureScreen />}
      {screen === "pricing" && <PricingScreen />}
      {screen === "settings" && <SettingsScreen />}
      {toast && <Toast message={toast} />}
    </ConfirmProvider>
  );
}
