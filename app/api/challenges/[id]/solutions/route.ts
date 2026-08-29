import { count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { challenges, solutionProposals } from "@/db/schema";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const challengeId = Number.parseInt((await params).id, 10);
  const body = await request.json() as { teamName?: string; institution?: string; summary?: string; approach?: string; memberCount?: number; submitterKey?: string };
  const teamName = body.teamName?.trim() ?? "", institution = body.institution?.trim() ?? "", summary = body.summary?.trim() ?? "", approach = body.approach?.trim() ?? "", submitterKey = body.submitterKey?.trim() ?? "";
  if (!Number.isInteger(challengeId) || teamName.length < 2 || teamName.length > 80 || institution.length < 2 || institution.length > 120 || summary.length < 20 || summary.length > 500 || approach.length < 30 || approach.length > 1500 || !/^[a-zA-Z0-9_-]{16,80}$/.test(submitterKey)) return Response.json({ error: "Please complete every field with a clear proposal." }, { status: 400 });
  const memberCount = Math.min(12, Math.max(1, Number(body.memberCount) || 1));
  const db = getDb();
  const [challenge] = await db.select({ status: challenges.status }).from(challenges).where(eq(challenges.id, challengeId));
  if (!challenge || challenge.status !== "approved") return Response.json({ error: "Challenge not found." }, { status: 404 });
  const [submitted] = await db.select({ value: count() }).from(solutionProposals).where(eq(solutionProposals.submitterKey, submitterKey));
  if ((submitted?.value ?? 0) >= 10) return Response.json({ error: "Proposal limit reached." }, { status: 429 });
  const [proposal] = await db.insert(solutionProposals).values({ challengeId, teamName, institution, summary, approach, memberCount, submitterKey }).returning({ id: solutionProposals.id, status: solutionProposals.status });
  return Response.json({ proposal }, { status: 201 });
}
