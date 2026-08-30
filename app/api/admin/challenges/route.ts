import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { challengeUpdates, challenges, industryOffers, solutionProposals, users } from "@/db/schema";
import { isAdminRequest } from "@/app/admin-auth";

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ error: "Admin access required." }, { status: 403 });
  const db = getDb();
  const [rows, solutions, offers, accounts] = await Promise.all([
    db.select({ id:challenges.id, reference:challenges.reference, title:challenges.title, description:challenges.description, location:challenges.location, category:challenges.category, status:challenges.status, supportCount:challenges.supportCount, teams:challenges.teams, hasPhoto:sql<boolean>`${challenges.photoData} is not null`, createdAt:challenges.createdAt, reviewedAt:challenges.reviewedAt }).from(challenges).orderBy(desc(challenges.createdAt)).limit(100),
    db.select({ id:solutionProposals.id, challengeId:solutionProposals.challengeId, teamName:solutionProposals.teamName, institution:solutionProposals.institution, summary:solutionProposals.summary, approach:solutionProposals.approach, memberCount:solutionProposals.memberCount, status:solutionProposals.status, createdAt:solutionProposals.createdAt, reviewedAt:solutionProposals.reviewedAt }).from(solutionProposals).orderBy(desc(solutionProposals.createdAt)).limit(100),
    db.select({ id:industryOffers.id, challengeId:industryOffers.challengeId, organization:industryOffers.organization, supportType:industryOffers.supportType, message:industryOffers.message, status:industryOffers.status, createdAt:industryOffers.createdAt, reviewedAt:industryOffers.reviewedAt }).from(industryOffers).orderBy(desc(industryOffers.createdAt)).limit(100),
    db.select({ id:users.id, name:users.name, email:users.email, role:users.role, organization:users.organization, isVerified:users.isVerified, createdAt:users.createdAt }).from(users).orderBy(desc(users.createdAt)).limit(100),
  ]);
  return Response.json({ challenges: rows, solutions, offers, users: accounts });
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ error: "Admin access required." }, { status: 403 });
  const payload = await request.json() as { id?: number; status?: "approved" | "rejected"; entity?: "challenge" | "solution" | "offer" | "user"; verified?: boolean };
  if (!Number.isInteger(payload.id)) return Response.json({ error: "Invalid review action." }, { status: 400 });
  const db = getDb();
  if (payload.entity === "user") {
    if (typeof payload.verified !== "boolean") return Response.json({ error: "Invalid verification action." }, { status: 400 });
    const [updated] = await db.update(users).set({ isVerified: payload.verified }).where(eq(users.id, payload.id!)).returning({ id:users.id, name:users.name, email:users.email, role:users.role, organization:users.organization, isVerified:users.isVerified, createdAt:users.createdAt });
    if (!updated) return Response.json({ error: "Account not found." }, { status: 404 });
    return Response.json({ entity: "user", item: updated });
  }
  if (!payload.status || !["approved", "rejected"].includes(payload.status)) return Response.json({ error: "Invalid review action." }, { status: 400 });
  if (payload.entity === "solution") {
    const [before] = await db.select().from(solutionProposals).where(eq(solutionProposals.id, payload.id!));
    if (!before) return Response.json({ error: "Proposal not found." }, { status: 404 });
    const [updated] = await db.update(solutionProposals).set({ status: payload.status, reviewedAt: sql`CURRENT_TIMESTAMP` }).where(eq(solutionProposals.id, payload.id!)).returning();
    if (before.status !== "approved" && payload.status === "approved") await db.update(challenges).set({ teams: sql`${challenges.teams} + 1` }).where(eq(challenges.id, before.challengeId));
    if (before.status === "approved" && payload.status !== "approved") await db.update(challenges).set({ teams: sql`greatest(0, ${challenges.teams} - 1)` }).where(eq(challenges.id, before.challengeId));
    return Response.json({ entity: "solution", item: updated });
  }
  if (payload.entity === "offer") {
    const [updated] = await db.update(industryOffers).set({ status: payload.status, reviewedAt: sql`CURRENT_TIMESTAMP` }).where(eq(industryOffers.id, payload.id!)).returning();
    if (!updated) return Response.json({ error: "Offer not found." }, { status: 404 });
    return Response.json({ entity: "offer", item: updated });
  }
  const [updated] = await db.update(challenges).set({ status: payload.status, reviewedAt: sql`CURRENT_TIMESTAMP` }).where(eq(challenges.id, payload.id!)).returning();
  if (!updated) return Response.json({ error: "Challenge not found." }, { status: 404 });
  return Response.json({ challenge: updated });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ error: "Admin access required." }, { status: 403 });
  const body = await request.json() as { challengeId?: number; title?: string; content?: string; stage?: string };
  const title = body.title?.trim() ?? "", content = body.content?.trim() ?? "", stage = body.stage?.trim() ?? "Update";
  if (!Number.isInteger(body.challengeId) || title.length < 3 || title.length > 100 || content.length < 10 || content.length > 1000 || stage.length > 40) return Response.json({ error: "Complete the update fields." }, { status: 400 });
  const [update] = await getDb().insert(challengeUpdates).values({ challengeId: body.challengeId!, title, content, stage }).returning();
  return Response.json({ update }, { status: 201 });
}
