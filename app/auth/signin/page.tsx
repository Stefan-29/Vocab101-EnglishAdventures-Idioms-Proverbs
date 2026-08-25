"use client";

import { useState } from "react";

export default function SignInPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const payload = {
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      password: (form.elements.namedItem("password") as HTMLInputElement).value,
      name: (form.elements.namedItem("name") as HTMLInputElement)?.value || "",
    };

    setBusy(true);
    setMessage(null);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");
      setMessage(mode === "login" ? "Signed in successfully." : "Account created successfully.");
      if (mode === "login") window.location.href = "/admin";
      else window.location.href = "/auth/signin";
    } catch (err: any) {
      setMessage(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600">English Adventures</p>
        <h1 className="mt-2 text-3xl font-bold">{mode === "login" ? "Sign in" : "Create account"}</h1>
        <p className="mt-2 text-sm text-slate-600">Use your email and password to access the public dashboard and admin management area.</p>

        <div className="mt-5 flex rounded-full bg-slate-100 p-1">
          <button type="button" onClick={() => setMode("login")} className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>
            Login
          </button>
          <button type="button" onClick={() => setMode("register")} className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}>
            Register
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={submit}>
          {mode === "register" && (
            <div>
              <label className="mb-1 block text-sm font-medium">Full name</label>
              <input name="name" type="text" className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Your name" />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input name="email" type="email" required className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="you@example.com" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input name="password" type="password" required className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="••••••••" />
          </div>

          {message && <p className="text-sm text-slate-700">{message}</p>}

          <button type="submit" disabled={busy} className="w-full rounded-xl bg-violet-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60">
            {busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="mt-5 text-sm text-slate-600">
          Owner access: <strong>stefanustankaemingk2@gmail.com</strong> / <strong>$T3f2110129</strong>
        </div>
      </div>
    </main>
  );
}
