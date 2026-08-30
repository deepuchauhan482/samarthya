"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, BookOpen, Building2, Camera, CheckCircle2, ChevronRight, GraduationCap, HandHeart, Languages, Loader2, LocateFixed, MapPin, Menu, Mic, Plus, Search, Sprout, Users, Waves, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Challenge = { id: number; reference?: string; title: string; hi?: string; description: string; location: string; category: string; supporters: number; teams: number; urgency: string; sample?: boolean; hasPhoto?: boolean };
const categories = ["All", "Water", "Agriculture", "Education", "Environment"];
const examples: Challenge[] = [
  { id: -1, title: "Clean drinking water needed in Bero village", hi: "बेड़ो गांव में स्वच्छ पेयजल की जरूरत", description: "Three hand pumps serve over 600 people, but two stop working every summer.", location: "Bero, Ranchi", category: "Water", supporters: 148, teams: 3, urgency: "Example challenge", sample: true },
  { id: -2, title: "Farmers need low-cost crop storage", hi: "किसानों को कम लागत वाले भंडारण की जरूरत", description: "Vegetables spoil before reaching the market. The community seeks a simple solar solution.", location: "Gumla, Jharkhand", category: "Agriculture", supporters: 96, teams: 2, urgency: "Example challenge", sample: true },
  { id: -3, title: "Learning support for village students", hi: "गांव के विद्यार्थियों के लिए पढ़ाई में सहायता", description: "Students need reusable, low-data lessons for science and mathematics after school.", location: "Dumka, Jharkhand", category: "Education", supporters: 72, teams: 4, urgency: "Example challenge", sample: true },
];

function deviceKey() {
  const existing = window.localStorage.getItem("samarthya-device-key");
  if (existing) return existing;
  const created = `${crypto.randomUUID()}-${Date.now().toString(36)}`;
  window.localStorage.setItem("samarthya-device-key", created);
  return created;
}

function categoryVisual(category: string) {
  if (category === "Water") return { Icon: Waves, accent: "water" };
  if (category === "Agriculture" || category === "Environment") return { Icon: Sprout, accent: "farm" };
  return { Icon: BookOpen, accent: "learn" };
}

export default function Home() {
  const [hindi, setHindi] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [realChallenges, setRealChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [supported, setSupported] = useState<number[]>([]);
  const [supporting, setSupporting] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function loadChallenges() {
    setLoading(true);
    try {
      const response = await fetch("/api/challenges", { cache: "no-store" });
      const data = await response.json() as { challenges?: Challenge[] };
      if (response.ok) setRealChallenges(data.challenges ?? []);
    } finally { setLoading(false); }
  }
  useEffect(() => { void loadChallenges(); }, []);

  const source = realChallenges.length ? realChallenges : examples;
  const challenges = useMemo(() => source.filter((item) => (category === "All" || item.category === category) && `${item.title} ${item.hi ?? ""} ${item.location} ${item.category}`.toLowerCase().includes(query.toLowerCase())), [source, category, query]);
  const totalTeams = realChallenges.reduce((sum, item) => sum + item.teams, 0);
  const totalSupporters = realChallenges.reduce((sum, item) => sum + item.supporters, 0);

  async function support(challenge: Challenge) {
    if (challenge.sample) { setSupported((current) => current.includes(challenge.id) ? current.filter((id) => id !== challenge.id) : [...current, challenge.id]); return; }
    setSupporting(challenge.id);
    try {
      const response = await fetch(`/api/challenges/${challenge.id}/support`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ voterKey: deviceKey() }) });
      const data = await response.json() as { supported?: boolean; supporters?: number };
      if (response.ok) {
        setSupported((current) => data.supported ? [...current.filter((id) => id !== challenge.id), challenge.id] : current.filter((id) => id !== challenge.id));
        setRealChallenges((current) => current.map((item) => item.id === challenge.id ? { ...item, supporters: data.supporters ?? item.supporters } : item));
      }
    } finally { setSupporting(null); }
  }

  return <main><a className="skip-link" href="#main-content">Skip to main content</a>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><ReportDialog onClose={() => setDialogOpen(false)} onSubmitted={loadChallenges} /></Dialog>
    <header className="site-header"><div className="shell header-inner">
      <a className="brand" href="/" aria-label="Samarthya home"><span className="brand-mark"><HandHeart /></span><span><strong>समर्थ्य</strong><small>Samarthya</small></span></a>
      <nav className={menuOpen ? "nav-links open" : "nav-links"} aria-label="Main navigation"><a href="#challenges">{hindi?"चुनौतियाँ":"Challenges"}</a><a href="#how">{hindi?"कैसे काम करता है":"How it works"}</a><a href="/track">{hindi?"मेरी गतिविधि":"My activity"}</a><a href="/help">{hindi?"सहायता":"Help"}</a><button className="language" onClick={() => setHindi(!hindi)} aria-pressed={hindi}><Languages /> {hindi ? "English" : "हिंदी"}</button></nav>
      <div className="header-actions"><Button asChild variant="ghost" className="login-button"><a href="/account"><Users/> Sign in</a></Button><Button className="report-top" onClick={() => setDialogOpen(true)}><Plus /> Report a problem</Button><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button></div>
    </div></header>

    <section id="main-content" className="hero"><div className="shell hero-grid">
      <div className="hero-copy"><div className="eyebrow"><BadgeCheck /> Verified community challenges</div><h1>{hindi ? "आपकी समस्या। हमारी सामूहिक शक्ति।" : "Your problem. Our collective strength."}</h1><p>{hindi ? "नागरिकों की वास्तविक समस्याओं को विद्यार्थियों, विशेषज्ञों और उद्योग के साथ जोड़कर समाधान तक पहुंचाएं।" : "Turn real community problems into practical solutions by connecting citizens with students, experts, and industry."}</p><div className="hero-actions"><Button size="lg" className="primary-cta" onClick={() => setDialogOpen(true)}><Mic /> Tell us your problem</Button><Button asChild size="lg" variant="outline" className="secondary-cta"><a href="#challenges">Explore challenges <ArrowRight /></a></Button></div><p className="help-note"><CheckCircle2 /> Simple language · Takes less than 3 minutes</p></div>
      <div className="connection-card" aria-label="How people collaborate"><div className="connection-top"><span>ONE SHARED MISSION</span><strong>From local voice to lasting change</strong></div><div className="path-line" /><div className="people-grid"><div><span className="person-icon citizen"><Users /></span><strong>Citizens</strong><small>Share needs</small></div><div><span className="person-icon student"><GraduationCap /></span><strong>Universities</strong><small>Build solutions</small></div><div><span className="person-icon industry"><Building2 /></span><strong>Industry</strong><small>Support scale</small></div></div><div className="solution-pill"><CheckCircle2 /> One measurable solution</div></div>
    </div></section>

    <section className="trust-strip" aria-label="Live platform statistics"><div className="shell trust-grid"><div><strong>{loading ? "—" : realChallenges.length}</strong><span>verified challenges</span></div><div><strong>{loading ? "—" : totalTeams}</strong><span>approved teams</span></div><div><strong>{loading ? "—" : totalSupporters}</strong><span>community supports</span></div><div><strong>24/7</strong><span>problem reporting</span></div></div></section>

    <section id="challenges" className="challenges-section"><div className="shell">
      <div className="section-heading"><div><span className="section-kicker">NEEDS AROUND US</span><h2>{hindi ? "जहाँ आपकी मदद बदलाव ला सकती है" : "Where your help can make a difference"}</h2></div><span className="live-data-badge"><span /> {realChallenges.length ? "Live verified data" : "Showing examples until first approval"}</span></div>
      <div className="filter-bar"><label className="search-box"><Search /><span className="sr-only">Search challenges</span><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by need or location…" /></label><div className="category-list" aria-label="Challenge categories">{categories.map((item) => <button key={item} className={category === item ? "active" : ""} aria-pressed={category===item} onClick={() => setCategory(item)}>{item}</button>)}</div></div>
      <div className="challenge-grid">{challenges.map((challenge) => { const { Icon, accent } = categoryVisual(challenge.category); const isSupported = supported.includes(challenge.id); return <article className="challenge-card" key={challenge.id}><div className={`challenge-visual ${accent}`}>{challenge.hasPhoto&&!challenge.sample?<img src={`/api/challenges/${challenge.id}/photo`} alt="Community evidence"/>:<span className="challenge-icon"><Icon /></span>}<span className="priority"><span /> {challenge.urgency}</span><span className="category-tag">{challenge.category}</span></div><div className="challenge-body"><div className="location"><MapPin /> {challenge.location}</div><h3>{hindi && challenge.hi ? challenge.hi : challenge.title}</h3><p>{challenge.description}</p><div className="challenge-meta"><span><Users /> {challenge.teams} teams working</span><span>{challenge.supporters + (challenge.sample && isSupported ? 1 : 0)} support this</span></div><div className="card-actions"><button disabled={supporting === challenge.id} className={isSupported ? "support active" : "support"} onClick={() => support(challenge)}>{supporting === challenge.id ? <Loader2 className="spin" /> : <HandHeart />} {isSupported ? "Supported" : "I support this"}</button>{challenge.sample?<button className="open-challenge" disabled aria-label="Example challenge"><ChevronRight /></button>:<a className="open-challenge" href={`/challenges/${challenge.id}`} aria-label={`Open ${challenge.title}`}><ChevronRight /></a>}</div></div></article>; })}</div>
      {!loading && challenges.length === 0 && <div className="empty-state"><Search /><h3>No challenges found</h3><p>Try another word or category.</p></div>}
    </div></section>

    <section id="how" className="how-section"><div className="shell"><div className="center-heading"><span className="section-kicker">SIMPLE BY DESIGN</span><h2>One problem. Three steps. Real progress.</h2></div><div className="steps-grid"><article><span>01</span><div className="step-icon"><Mic /></div><h3>Share the problem</h3><p>Speak or type in simple language. Your report is saved privately for review.</p></article><article><span>02</span><div className="step-icon"><GraduationCap /></div><h3>Admin verifies it</h3><p>Only genuine, useful challenges are approved and shown publicly.</p></article><article><span>03</span><div className="step-icon"><Building2 /></div><h3>Build and scale</h3><p>Partners mentor, provide resources, test solutions, and track impact.</p></article></div></div></section>
    <section id="impact" className="impact-banner"><div className="shell impact-inner"><div><span>BUILT FOR EVERY VOICE</span><h2>A stronger Jharkhand starts with listening.</h2><p>No technical knowledge needed. Tell us what your community needs and we’ll help structure it.</p></div><Button size="lg" onClick={() => setDialogOpen(true)}>Report your first problem <ArrowRight /></Button></div></section>
    <footer><div className="shell footer-inner"><div className="brand footer-brand"><span className="brand-mark"><HandHeart /></span><span><strong>समर्थ्य</strong><small>Ideas into impact</small></span></div><p>A collaborative platform for citizens, universities, industry, and government.</p><nav aria-label="Footer navigation"><a href="/track">My activity</a><a href="/help">Help</a><a href="/privacy">Privacy</a><a href="/admin">Admin</a></nav><span>SIH 2026 · Smart Education</span></div></footer>
  </main>;
}

function ReportDialog({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: () => Promise<void> }) {
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [listening, setListening] = useState(false);
  function useLocation() {
    if (!navigator.geolocation) { setError("Location is not supported on this device."); return; }
    setLocating(true); setError("");
    navigator.geolocation.getCurrentPosition((position) => { setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude }); setLocating(false); }, () => { setError("Location permission was not granted. You can still type the place."); setLocating(false); }, { enableHighAccuracy: false, timeout: 10000 });
  }
  function startVoice() {
    type SpeechResult = { results: ArrayLike<{ 0: { transcript: string } }> };
    type Recognition = { lang: string; interimResults: boolean; onresult: (event: SpeechResult) => void; onerror: () => void; onend: () => void; start: () => void };
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) { setError("Voice typing is not supported in this browser. Try Chrome or type the problem."); return; }
    const recognition = new SpeechRecognition(); recognition.lang = "hi-IN"; recognition.interimResults = false; setListening(true); setError("");
    recognition.onresult = (event) => setDescription((current) => `${current}${current ? " " : ""}${event.results[0][0].transcript}`);
    recognition.onerror = () => setError("Voice could not be understood. Please try again or type instead."); recognition.onend = () => setListening(false); recognition.start();
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSubmitting(true);
    try {
      const reporterKey = deviceKey();
      const response = await fetch("/api/challenges", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description, location, category, reporterKey, website: "", ...coordinates }) });
      const data = await response.json() as { error?: string; challenge?: { id: number; reference: string } };
      if (!response.ok) { setError(data.error ?? "Submission failed."); return; }
      if (photo && data.challenge?.id) { const cleanPhoto = await sanitizePhoto(photo); const form = new FormData(); form.append("photo", cleanPhoto); form.append("reporterKey", reporterKey); const upload = await fetch(`/api/challenges/${data.challenge.id}/photo`, { method: "POST", body: form }); if (!upload.ok) setError("The report was saved, but the photo could not be uploaded."); }
      setReference(data.challenge?.reference ?? "Submitted"); await onSubmitted();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not connect. Check your internet and try again."); }
    finally { setSubmitting(false); }
  }
  return <DialogContent className="report-dialog">{reference ? <div className="success-message"><span><CheckCircle2 /></span><DialogTitle>Thank you for speaking up!</DialogTitle><DialogDescription>Your report is safely stored and waiting for admin verification. Reference: <strong>{reference}</strong></DialogDescription><Button asChild variant="outline"><a href="/track">Track this report</a></Button><Button onClick={onClose}>Done</Button></div> : <><DialogHeader><span className="dialog-step">QUICK REPORT</span><DialogTitle>What problem do you see?</DialogTitle><DialogDescription>Use your own words. A short and simple description is perfect.</DialogDescription></DialogHeader><form onSubmit={submit} className="report-form"><label>Describe the problem<textarea value={description} onChange={(event) => setDescription(event.target.value)} minLength={15} maxLength={1200} required placeholder="Example: Our village hand pump stops working every summer…" /></label><button type="button" className={listening?"voice-button active":"voice-button"} onClick={startVoice} disabled={listening}><Mic /> {listening?"Listening… speak now":"Speak in Hindi or English"}</button><div className="form-row"><label>Where is it happening?<Input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={120} required placeholder="Village, block or district" /></label><label>Type of problem<Select value={category} onValueChange={setCategory} required><SelectTrigger className="w-full"><SelectValue placeholder="Choose category" /></SelectTrigger><SelectContent><SelectItem value="Water">Water</SelectItem><SelectItem value="Agriculture">Agriculture</SelectItem><SelectItem value="Education">Education</SelectItem><SelectItem value="Environment">Environment</SelectItem><SelectItem value="Health">Health</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></label></div><div className="report-tools"><label className="file-tool"><Camera/><span>{photo?photo.name:"Add one photo (optional)"}</span><Input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setPhoto(e.target.files?.[0]??null)}/></label><button type="button" className={coordinates?"location-tool active":"location-tool"} onClick={useLocation} disabled={locating}><LocateFixed/>{locating?"Finding…":coordinates?"Approximate location added":"Add approximate location"}</button></div><p className="location-safety">Share the problem area only—not a private home address. Coordinates are rounded before saving.</p><label className="honeypot" aria-hidden="true">Website<Input tabIndex={-1} autoComplete="off" /></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="privacy-note"><BadgeCheck /> Do not include phone numbers, passwords, or other private information.</div><Button disabled={submitting || !category} size="lg" type="submit">{submitting ? <><Loader2 className="spin" /> Saving…</> : <>Submit for verification <ArrowRight /></>}</Button></form></>}</DialogContent>;
}

async function sanitizePhoto(file: File) {
  if (file.size > 8 * 1024 * 1024) throw new Error("Choose a photo under 8 MB.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d"); if (!context) throw new Error("This photo could not be processed.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", .82));
  if (!blob) throw new Error("This photo could not be processed.");
  return new File([blob], "community-evidence.jpg", { type: "image/jpeg" });
}
