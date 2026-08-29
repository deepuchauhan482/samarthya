import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { challengeUpdates, challenges, industryOffers, solutionProposals } from "@/db/schema";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number.parseInt((await params).id, 10);
  if (!Number.isInteger(id)) return Response.json({ error: "Invalid challenge." }, { status: 400 });
  const db = getDb();
  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id)).limit(1);
  if (!challenge || challenge.status !== "approved") return Response.json({ error: "Challenge not found." }, { status: 404 });
  const [solutions, offers, updates] = await Promise.all([
    db.select({ id: solutionProposals.id, teamName: solutionProposals.teamName, institution: solutionProposals.institution, summary: solutionProposals.summary, approach: solutionProposals.approach, memberCount: solutionProposals.memberCount, createdAt: solutionProposals.createdAt }).from(solutionProposals).where(and(eq(solutionProposals.challengeId, id), eq(solutionProposals.status, "approved"))).orderBy(asc(solutionProposals.createdAt)),
    db.select({ id: industryOffers.id, organization: industryOffers.organization, supportType: industryOffers.supportType, message: industryOffers.message, createdAt: industryOffers.createdAt }).from(industryOffers).where(and(eq(industryOffers.challengeId, id), eq(industryOffers.status, "approved"))).orderBy(asc(industryOffers.createdAt)),
    db.select().from(challengeUpdates).where(eq(challengeUpdates.challengeId, id)).orderBy(asc(challengeUpdates.createdAt)),
  ]);
  return Response.json({ challenge: { ...challenge, reporterKey: undefined, photoData: undefined, photoUrl: challenge.photoData ? `/api/challenges/${id}/photo` : null }, solutions, offers, updates });
}
