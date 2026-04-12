"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { auth as authApi, setToken } from "@/lib/api";
import { Home } from "lucide-react";

export default function LoginScreen() {
  const { setAuth, setScreen } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup" | "magic">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
        setScreen("projects");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8">
      <div className="animate-slide-up text-center w-full max-w-xs">
        {/* Logo */}
        <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-brand to-orange-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-brand/30">
          <Home className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-1">SnagFlow</h1>
        <p className="text-[var(--text3)] text-sm mb-8">Site snagging, simplified.</p>

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
