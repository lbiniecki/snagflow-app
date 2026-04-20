"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { auth as authApi, setToken } from "@/lib/api";
import VoxSiteLogo from "@/components/VoxSiteLogo";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function LoginScreen() {
  const { setAuth, setScreen, showToast } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup" | "magic" | "setup" | "forgot" | "reset">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Extra state for reset-password flow
  const [resetToken, setResetToken] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // One-time setup token from invite link (?setup=TOKEN&email=EMAIL)
  const [setupToken, setSetupToken] = useState("");

  // On mount: detect ?setup= param OR Supabase recovery hash fragment
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);

    // Invite flow (existing)
    const token = params.get("setup");
    const inviteEmail = params.get("email");
    if (token && inviteEmail) {
      setSetupToken(token);
      setEmail(decodeURIComponent(inviteEmail));
      setMode("setup");
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    // Password-reset flow. Supabase puts the recovery session in the URL
    // hash fragment: #access_token=XXX&type=recovery&refresh_token=YYY...
    // We pluck the access_token and use it to authorize a password update.
    const hash = window.location.hash || "";
    if (hash.length > 1) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const type = hashParams.get("type");
      const accessToken = hashParams.get("access_token");

      if (type === "recovery" && accessToken) {
        setResetToken(accessToken);
        setMode("reset");
        window.history.replaceState({}, "", window.location.pathname);
        return;
      }

      // Magic-link callback. Supabase returns #access_token=XXX&type=magiclink
      // once the user clicks the link in the email. The token IS the session
      // access_token — we just need to store it, hydrate the user, and go.
      if (type === "magiclink" && accessToken) {
        (async () => {
          try {
            // Clean the URL immediately so a refresh doesn't re-trigger
            window.history.replaceState({}, "", window.location.pathname);

            // Store token the same way the login flow does
            setToken(accessToken);

            // Resolve who we are from the token via /auth/me
            const meRes = await fetch(`${API}/auth/me`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!meRes.ok) throw new Error("Magic link session rejected");
            const me = await meRes.json();
            setAuth({ id: me.id, email: me.email }, accessToken);

            // Auto-join any pending invite (same as normal login flow)
            try {
              await fetch(`${API}/companies/join`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
              });
            } catch {}

            showToast("Signed in");
            setScreen("projects");
          } catch (err: any) {
            setError(
              err.message ||
                "Magic link couldn't be verified. Please request a new one."
            );
          }
        })();
        return;
      }
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

  // Send a password-reset email. Always resolves success-ish even on
  // unknown email — we don't want to leak whether an account exists.
  const handleForgotPassword = async () => {
    if (!email) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Even on 4xx (rate limit etc.) we show a neutral message unless
      // the server returned a specific user-actionable error.
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 429) {
          setError("Too many attempts. Please wait a few minutes and try again.");
          return;
        }
        if (data?.detail && res.status < 500) {
          setError(data.detail);
          return;
        }
      }
      setMessage(
        "If an account exists for that email, a reset link has been sent. Check your inbox (and spam folder).",
      );
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Consume the reset token and set a new password.
  const handleResetPassword = async () => {
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Reset failed");

      // Backend returns an active session (same shape as /login), so we
      // can sign the user in immediately rather than bouncing them to
      // the login screen.
      if (data.access_token) {
        setToken(data.access_token);
        setAuth({ id: data.user_id, email: data.email }, data.access_token);
        showToast("Password updated — you're signed in");
        setScreen("projects");
      } else {
        // Fallback: no session returned, ask them to sign in.
        setMessage("Password updated. You can now sign in.");
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        setResetToken("");
      }
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
            <VoxSiteLogo className="w-14 h-14 text-white" />
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
              className="w-full px-4 py-3 bg-[var(--bg2)] border border-[var(--border)] rounded-lg text-center text-base text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
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
            <p className="mt-4 text-sm text-critical animate-fade-in">{error}</p>
          )}

          {/* Escape hatch */}
          <button
            onClick={() => { setMode("login"); setSetupToken(""); }}
            className="mt-4 text-xs text-[var(--text3)] hover:text-[var(--text-primary)] transition-colors"
          >
            Already have an account? Sign in instead
          </button>
        </div>
      </div>
    );
  }

  // ── Forgot password: email input + send reset link ──
  if (mode === "forgot") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8">
        <div className="animate-slide-up text-center w-full max-w-xs">
          <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-brand to-orange-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-brand/30">
            <VoxSiteLogo className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-1">Reset password</h1>
          <p className="text-[var(--text3)] text-sm mb-6">
            Enter your email and we'll send you a link to set a new password.
          </p>

          <div className="space-y-3 mb-4">
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              className="w-full px-4 py-3 bg-[var(--bg2)] border border-[var(--border)] rounded-lg text-center text-base text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
            />
          </div>

          <button
            onClick={handleForgotPassword}
            disabled={loading || !email}
            className="w-full h-12 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>

          {message && (
            <p className="mt-4 text-sm text-success animate-fade-in">{message}</p>
          )}
          {error && (
            <p className="mt-4 text-sm text-critical animate-fade-in">{error}</p>
          )}

          <button
            onClick={() => { setMode("login"); setMessage(""); setError(""); }}
            className="mt-4 text-xs text-[var(--text3)] hover:text-[var(--text-primary)] transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  // ── Reset password: user arrived via email link with ?reset=TOKEN ──
  if (mode === "reset") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8">
        <div className="animate-slide-up text-center w-full max-w-xs">
          <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-brand to-orange-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-brand/30">
            <VoxSiteLogo className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-1">Set new password</h1>
          <p className="text-[var(--text3)] text-sm mb-6">
            Choose a new password for your account.
          </p>

          <div className="space-y-3 mb-4">
            <input
              type="password"
              placeholder="New password (6+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full px-4 py-3 bg-[var(--bg2)] border border-[var(--border)] rounded-lg text-center text-base text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg2)] border border-[var(--border)] rounded-lg text-center text-base text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
            />
          </div>

          <button
            onClick={handleResetPassword}
            disabled={loading || !password || password.length < 6 || password !== confirmPassword}
            className="w-full h-12 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? "Updating…" : "Set new password"}
          </button>

          {error && (
            <p className="mt-4 text-sm text-critical animate-fade-in">{error}</p>
          )}

          <button
            onClick={() => {
              setMode("login");
              setResetToken("");
              setPassword("");
              setConfirmPassword("");
              setError("");
            }}
            className="mt-4 text-xs text-[var(--text3)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
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
          <VoxSiteLogo className="w-14 h-14 text-white" />
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
            className="w-full px-4 py-3 bg-[var(--bg2)] border border-[var(--border)] rounded-lg text-center text-base text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />

          {mode !== "magic" && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--bg2)] border border-[var(--border)] rounded-lg text-center text-base text-[var(--text-primary)] placeholder:text-[var(--text3)] outline-none focus:border-brand transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          )}

          {mode === "login" && (
            <div className="text-right -mt-1">
              <button
                onClick={() => { setMode("forgot"); setError(""); setMessage(""); setPassword(""); }}
                className="text-xs text-[var(--text3)] hover:text-[var(--text-primary)] transition-colors"
                type="button"
              >
                Forgot password?
              </button>
            </div>
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
            <button onClick={() => setMode("login")} className="text-[var(--text2)] hover:text-[var(--text-primary)] transition-colors">
              Sign in
            </button>
          )}
          {mode !== "signup" && (
            <button onClick={() => setMode("signup")} className="text-[var(--text2)] hover:text-[var(--text-primary)] transition-colors">
              Create account
            </button>
          )}
          {mode !== "magic" && (
            <button onClick={() => setMode("magic")} className="text-[var(--text2)] hover:text-[var(--text-primary)] transition-colors">
              Magic link
            </button>
          )}
        </div>

        {/* Messages */}
        {message && (
          <p className="mt-4 text-sm text-success animate-fade-in">{message}</p>
        )}
        {error && (
          <p className="mt-4 text-sm text-critical animate-fade-in">{error}</p>
        )}
      </div>
    </div>
  );
}
