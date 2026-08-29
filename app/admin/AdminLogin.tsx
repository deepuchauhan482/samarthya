"use client";

import { FormEvent, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Sign in failed.");
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed.");
    } finally { setLoading(false); }
  }

  return <form className="admin-login" onSubmit={signIn}>
    <label htmlFor="admin-password">Administrator password</label>
    <Input id="admin-password" type="password" autoComplete="current-password" required minLength={12} maxLength={256} value={password} onChange={(event) => setPassword(event.target.value)} />
    {error && <p role="alert">{error}</p>}
    <Button type="submit" disabled={loading}>{loading ? <Loader2 className="spin" /> : <KeyRound />}{loading ? "Signing in…" : "Sign in"}</Button>
  </form>;
}
