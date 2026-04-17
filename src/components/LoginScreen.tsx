"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { auth as authApi, setToken } from "@/lib/api";
import { ClipboardCheck } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function LoginScreen() {
  const { setAuth, setScreen, showToast } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup" | "magic" | "setup">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // One-time setup token from invite link (?setup=TOKEN&email=EMAIL)
  const [setupToken, setSetupToken] = useState("");

  // On mount: detect ?setup= param in URL → switch to setup mode
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("setup");
    const inviteEmail = params.get("email");
    if (token && inviteEmail) {
      setSetupToken(token);
      setEmail(decodeURIComponent(inviteEmail));
      setMode("setup");
      // Clean the URL so refreshing doesn't re-trigger setup
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleSetupAccount = async () => {
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/auth/setup-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: setupToken,
          email: email,
          password: password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Setup failed");

      // Store session
      setToken(data.access_token);
      setAuth({ id: data.user_id, email: data.email }, data.access_token);

      // Auto-join company (belt-and-braces — backend pre-adds them,
      // but /join handles edge cases like invite created before the
      // new flow was deployed)
      try {
        await fetch(`${API}/companies/join`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${data.access_token}`,
            "Content-Type": "application/json",
          },
        });
      } catch {}

      showToast("Welcome to VoxSite!");
      setScreen("projects");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email) return;
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (mode === "magic") {
        await authApi.magicLink(email);
        setMessage("Magic link sent! Check your email.");
      } else if (mode === "signup") {
        await authApi.signup(email, password);
        setMessage("Account created! Check your email to confirm.");
      } else {
        const res = await authApi.login(email, password);
        setToken(res.access_token);
        setAuth({ id: res.user_id, email: res.email }, res.access_token);

        // Auto-join company if there's a pending invite
        try {
          const joinRes = await fetch(`${API}/companies/join`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${res.access_token}`,
              "Content-Type": "application/json",
            },
          });
          if (joinRes.ok) {
            const joinData = await joinRes.json();
            if (joinData?.status === "joined") {
              setMessage(joinData.message || "You've joined a team!");
            }
          }
        } catch {}

        setScreen("projects");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ── Setup mode (invited user setting password for the first time) ──
  if (mode === "setup") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8">
        <div className="animate-slide-up text-center w-full max-w-xs">
          {/* Logo */}
          <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-brand to-orange-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-brand/30">
            <ClipboardCheck className="w-11 h-11 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-1">Welcome to VoxSite</h1>
          <p className="text-[var(--text3)] text-sm mb-2">You've been invited to join a team.</p>
          <p className="text-[var(--text2)] text-xs mb-6">Choose a password to get started.</p>

          {/* Email (read-only) */}
          <div className="space-y-3 mb-4">
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 bg-[var(--bg3)] border border-[var(--border)] rounded-lg text-center text-base text-[var(--text3)] outline-none opacity-70"
            />
            <input
              type="password"
              placeholder="Choose a password (6+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full px-4 py-3 bg-[var(--bg2)] border border-[var(--border)] rounded-lg text-center text-base text-white placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleSetupAccount()}
            />
          </div>

          <button
            onClick={handleSetupAccount}
            disabled={loading || !password || password.length < 6}
            className="w-full h-12 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? "Setting up…" : "Set Password & Sign In"}
          </button>

          {error && (
            <p className="mt-4 text-sm text-red-400 animate-fade-in">{error}</p>
          )}

          {/* Escape hatch */}
          <button
            onClick={() => { setMode("login"); setSetupToken(""); }}
            className="mt-4 text-xs text-[var(--text3)] hover:text-white transition-colors"
          >
            Already have an account? Sign in instead
          </button>
        </div>
      </div>
    );
  }

  // ── Normal login / signup / magic link ──
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8">
      <div className="animate-slide-up text-center w-full max-w-xs">
        {/* Logo */}
        <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-brand to-orange-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-brand/30">
          <ClipboardCheck className="w-11 h-11 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-1">VoxSite</h1>
        <p className="text-[var(--text3)] text-sm mb-8">Site inspections, simplified.</p>

        {/* Form */}
        <div className="space-y-3 mb-4">
          <input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-[var(--bg2)] border border-[var(--border)] rounded-lg text-center text-base text-white placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />

          {mode !== "magic" && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg2)] border border-[var(--border)] rounded-lg text-center text-base text-white placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          )}
        </div>

        <button
          onClick={handleLogin}
          disabled={loading || !email}
          className="w-full h-12 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition-all disabled:opacity-50"
        >
          {loading
            ? "Please wait…"
            : mode === "magic"
            ? "Send Magic Link"
            : mode === "signup"
            ? "Create Account"
            : "Sign In"}
        </button>

        {/* Mode switcher */}
        <div className="flex gap-4 justify-center mt-4 text-xs">
          {mode !== "login" && (
            <button onClick={() => setMode("login")} className="text-[var(--text2)] hover:text-white transition-colors">
              Sign in
            </button>
          )}
          {mode !== "signup" && (
            <button onClick={() => setMode("signup")} className="text-[var(--text2)] hover:text-white transition-colors">
              Create account
            </button>
          )}
          {mode !== "magic" && (
            <button onClick={() => setMode("magic")} className="text-[var(--text2)] hover:text-white transition-colors">
              Magic link
            </button>
          )}
        </div>

        {/* Messages */}
        {message && (
          <p className="mt-4 text-sm text-green-400 animate-fade-in">{message}</p>
        )}
        {error && (
          <p className="mt-4 text-sm text-red-400 animate-fade-in">{error}</p>
        )}
      </div>
    </div>
  );
}
