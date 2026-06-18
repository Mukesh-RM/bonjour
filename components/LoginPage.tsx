"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ALLOWED_USERNAMES } from "@/lib/types";

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100 p-4">
      <div className="w-full max-w-md animate-fade-in rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/60">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500 text-2xl font-bold text-white shadow-lg shadow-blue-500/30">
            B
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Bonjour</h1>
          <p className="mt-2 text-sm text-slate-500">
            Select your account and enter password
          </p>
        </div>

        <div className="space-y-3">
          {ALLOWED_USERNAMES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setSelectedUser(name)}
              disabled={loading}
              className={`flex w-full items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                selectedUser === name
                  ? "border-blue-400 bg-blue-50 shadow-md"
                  : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
                {name === "user1" ? "U1" : "U2"}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{name}</p>
                <p className="text-xs text-slate-500">
                  {name === "user1" ? "Primary account" : "Secondary account"}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-5">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Password"
            disabled={loading}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-300 focus:bg-white disabled:opacity-50"
          />
        </div>

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading || !selectedUser}
          className="mt-4 w-full rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
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
