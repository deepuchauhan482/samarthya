"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Building2, GraduationCap, HandHeart, Loader2, LogIn, School, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AccountPage() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [role, setRole] = useState("student"), [name, setName] = useState(""), [organization, setOrganization] = useState(""), [email, setEmail] = useState(""), [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  useEffect(() => { fetch("/api/auth/session").then((response) => { if (response.ok) window.location.href = "/dashboard"; }).catch(() => undefined); }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mode === "signup" ? { role, name, organization, email, password } : { email, password }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not continue.");
      window.location.href = "/dashboard";
    } catch (err) { setError(err instanceof Error ? err.message : "Could not continue."); setBusy(false); }
  }
  const roleDetails = role === "student" ? { Icon: GraduationCap, title: "Student", hint: "Propose solutions and track your team" } : role === "university" ? { Icon: School, title: "University", hint: "Guide student teams and assign mentors" } : { Icon: Building2, title: "Industry", hint: "Offer funding, equipment and expertise" };
  const PreviewIcon = roleDetails.Icon;
  return <main className="account-page"><div className="account-brand-panel"><a href="/"><HandHeart/> समर्थ्य <small>Samarthya</small></a><div><span>COLLABORATE WITH PURPOSE</span><h1>One platform.<br/>A role for everyone.</h1><p>Create the right account and enter a workspace designed for your contribution.</p><div className="account-role-preview"><PreviewIcon/><div><strong>{roleDetails.title} workspace</strong><small>{roleDetails.hint}</small></div></div></div><small className="account-safe"><ShieldCheck/> Passwords are securely encrypted</small></div>
    <section className="account-form-panel"><a className="account-back" href="/"><ArrowLeft/> Back to home</a><div className="account-card"><div className="account-tabs"><button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create account</button><button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Sign in</button></div><h2>{mode === "signup" ? "Join Samarthya" : "Welcome back"}</h2><p>{mode === "signup" ? "Choose your role to get the correct dashboard." : "Sign in to open your personal workspace."}</p>
      <form onSubmit={submit}>{mode === "signup" && <><label>I am joining as<Select value={role} onValueChange={setRole}><SelectTrigger className="w-full"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="student">Student</SelectItem><SelectItem value="university">University</SelectItem><SelectItem value="industry">Industry company</SelectItem></SelectContent></Select></label><label>{role === "university" ? "Contact person" : role === "industry" ? "Representative name" : "Full name"}<Input required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter full name"/></label><label>{role === "student" ? "University / college" : role === "university" ? "University name" : "Company name"}<Input required minLength={2} maxLength={140} value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Enter organization"/></label></>}
        <label>Email address<Input required type="email" maxLength={160} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com"/></label><label>Password<Input required type="password" minLength={8} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters"/></label>{error && <p className="form-error">{error}</p>}<Button disabled={busy}>{busy ? <Loader2 className="spin"/> : mode === "signup" ? <UserPlus/> : <LogIn/>}{busy ? "Please wait…" : mode === "signup" ? "Create my account" : "Sign in"}</Button></form>
      {mode === "signup" && role !== "student" && <p className="verification-note"><ShieldCheck/> University and industry profiles require admin verification.</p>}</div></section></main>;
}
