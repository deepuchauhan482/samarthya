import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { challenges, industryOffers, mentorships, solutionProposals } from "@/db/schema";
import { getSessionUser } from "@/app/user-auth";

export async function GET(request: Request) {
  const user = await getSessionUser(request);
  if (!user) return Response.json({ error: "Please sign in." }, { status: 401 });
  const db = getDb();
  const available = await db.select({ id: challenges.id, title: challenges.title, location: challenges.location, category: challenges.category, teams: challenges.teams, supportCount: challenges.supportCount }).from(challenges).where(eq(challenges.status, "approved")).orderBy(desc(challenges.createdAt)).limit(30);
  if (user.role === "student") {
    const proposals = await db.select({ id: solutionProposals.id, challengeId: solutionProposals.challengeId, challengeTitle: challenges.title, teamName: solutionProposals.teamName, summary: solutionProposals.summary, status: solutionProposals.status, createdAt: solutionProposals.createdAt }).from(solutionProposals).innerJoin(challenges, eq(solutionProposals.challengeId, challenges.id)).where(eq(solutionProposals.userId, user.id)).orderBy(desc(solutionProposals.createdAt));
    return Response.json({ user, challenges: available, proposals });
  }
  if (user.role === "university") {
    const [proposals, assigned] = await Promise.all([
      db.select({ id: solutionProposals.id, challengeId: solutionProposals.challengeId, challengeTitle: challenges.title, teamName: solutionProposals.teamName, summary: solutionProposals.summary, status: solutionProposals.status, createdAt: solutionProposals.createdAt }).from(solutionProposals).innerJoin(challenges, eq(solutionProposals.challengeId, challenges.id)).where(eq(solutionProposals.institution, user.organization)).orderBy(desc(solutionProposals.createdAt)),
      db.select({ id: mentorships.id, challengeId: mentorships.challengeId, challengeTitle: challenges.title, mentorName: mentorships.mentorName, note: mentorships.note, createdAt: mentorships.createdAt }).from(mentorships).innerJoin(challenges, eq(mentorships.challengeId, challenges.id)).where(eq(mentorships.universityUserId, user.id)).orderBy(desc(mentorships.createdAt)),
    ]);
    return Response.json({ user, challenges: available, proposals, mentorships: assigned });
  }
  const offers = await db.select({ id: industryOffers.id, challengeId: industryOffers.challengeId, challengeTitle: challenges.title, supportType: industryOffers.supportType, message: industryOffers.message, status: industryOffers.status, createdAt: industryOffers.createdAt }).from(industryOffers).innerJoin(challenges, eq(industryOffers.challengeId, challenges.id)).where(eq(industryOffers.userId, user.id)).orderBy(desc(industryOffers.createdAt));
  return Response.json({ user, challenges: available, offers });
}

export async function POST(request: Request) {
  const user = await getSessionUser(request);
  if (!user || user.role !== "university") return Response.json({ error: "University account required." }, { status: 403 });
  if (!user.isVerified) return Response.json({ error: "Admin verification is required before assigning a mentor." }, { status: 403 });
  const body = await request.json() as { challengeId?: number; mentorName?: string; note?: string };
  const mentorName = body.mentorName?.trim() ?? "", note = body.note?.trim() ?? "";
  if (!Number.isInteger(body.challengeId) || mentorName.length < 2 || mentorName.length > 100 || note.length < 10 || note.length > 500) return Response.json({ error: "Please provide valid mentorship details." }, { status: 400 });
  const db = getDb();
  const [challenge] = await db.select({ id: challenges.id }).from(challenges).where(and(eq(challenges.id, body.challengeId!), eq(challenges.status, "approved"))).limit(1);
  if (!challenge) return Response.json({ error: "Challenge not found." }, { status: 404 });
  try {
    const [mentorship] = await db.insert(mentorships).values({ challengeId: challenge.id, universityUserId: user.id, mentorName, note }).returning();
    return Response.json({ mentorship }, { status: 201 });
  } catch { return Response.json({ error: "Your university already mentors this challenge." }, { status: 409 }); }
}
