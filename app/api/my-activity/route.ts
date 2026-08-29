import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { challenges, industryOffers, solutionProposals } from "@/db/schema";

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key") ?? "";
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(key)) return Response.json({ error: "This device has no valid activity key." }, { status: 400 });
  const db = getDb();
  const [reports, solutions, offers] = await Promise.all([
    db.select({ id: challenges.id, reference: challenges.reference, title: challenges.title, location: challenges.location, category: challenges.category, status: challenges.status, createdAt: challenges.createdAt }).from(challenges).where(eq(challenges.reporterKey, key)).orderBy(desc(challenges.createdAt)).limit(30),
    db.select({ id: solutionProposals.id, challengeId: solutionProposals.challengeId, teamName: solutionProposals.teamName, institution: solutionProposals.institution, status: solutionProposals.status, createdAt: solutionProposals.createdAt }).from(solutionProposals).where(eq(solutionProposals.submitterKey, key)).orderBy(desc(solutionProposals.createdAt)).limit(30),
    db.select({ id: industryOffers.id, challengeId: industryOffers.challengeId, organization: industryOffers.organization, supportType: industryOffers.supportType, status: industryOffers.status, createdAt: industryOffers.createdAt }).from(industryOffers).where(eq(industryOffers.submitterKey, key)).orderBy(desc(industryOffers.createdAt)).limit(30),
  ]);
  return Response.json({ reports, solutions, offers });
}
