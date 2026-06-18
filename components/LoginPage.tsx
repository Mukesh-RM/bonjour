"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ALLOWED_USERNAMES } from "@/lib/types";
import { getDisplayName, getAvatarLabel } from "@/lib/display-names";
import { getUserTheme } from "@/lib/theme";

export default function LoginPage() {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!selectedUser) {
      setError("Select an account first");
      return;
    }

    if (!password) {
      setError("Enter your password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: selectedUser, password }),
      });

      const text = await res.text();
      let data: { error?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError(
          res.status === 500
            ? "Server error. Check environment variables on Vercel."
            : `Unexpected server response (${res.status})`
        );
        return;
      }

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push("/chat");
      router.refresh();
    } catch {
      setError("Cannot reach server. Is the app running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-pink-50 p-4">
      <div className="w-full max-w-md animate-fade-in rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/60">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-pink-400 text-2xl font-bold text-white shadow-lg">
            B
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Bonjour</h1>
          <p className="mt-2 text-sm text-slate-500">
            Select your account and enter password
          </p>
        </div>

        <div className="space-y-3">
          {ALLOWED_USERNAMES.map((name) => {
            const theme = getUserTheme(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedUser(name)}
                disabled={loading}
                className={`flex w-full items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                  selectedUser === name
                    ? `${theme.loginSelected} shadow-md`
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${theme.loginRing}`}
                >
                  {getAvatarLabel(name)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{getDisplayName(name)}</p>
                  <p className="text-xs text-slate-500">
                    {name === "user1" ? "Light blue theme" : "Light pink theme"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Password"
            disabled={loading}
            className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:bg-white disabled:opacity-50 ${
              selectedUser ? getUserTheme(selectedUser).inputFocus : "focus:border-slate-300"
            }`}
          />
        </div>

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading || !selectedUser}
          className={`mt-4 w-full rounded-xl py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            selectedUser
              ? `${getUserTheme(selectedUser).button} ${getUserTheme(selectedUser).buttonHover}`
              : "bg-slate-300"
          }`}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
