import { count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { challenges, industryOffers } from "@/db/schema";
import { getSessionUser } from "@/app/user-auth";

const types = new Set(["Mentorship", "Equipment", "Pilot access", "Technical expertise", "Funding pledge", "Other"]);
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const challengeId = Number.parseInt((await params).id, 10);
  const body = await request.json() as { organization?: string; supportType?: string; message?: string; submitterKey?: string };
  const organization = body.organization?.trim() ?? "", supportType = body.supportType?.trim() ?? "", message = body.message?.trim() ?? "", submitterKey = body.submitterKey?.trim() ?? "";
  if (!Number.isInteger(challengeId) || organization.length < 2 || organization.length > 120 || !types.has(supportType) || message.length < 20 || message.length > 1000 || !/^[a-zA-Z0-9_-]{16,80}$/.test(submitterKey)) return Response.json({ error: "Please provide a clear support offer." }, { status: 400 });
  const db = getDb();
  const user = await getSessionUser(request);
  if (user && user.role !== "industry") return Response.json({ error: "Please use an industry account to submit support." }, { status: 403 });
  if (user && !user.isVerified) return Response.json({ error: "Your industry account is awaiting admin verification." }, { status: 403 });
  const [challenge] = await db.select({ status: challenges.status }).from(challenges).where(eq(challenges.id, challengeId));
  if (!challenge || challenge.status !== "approved") return Response.json({ error: "Challenge not found." }, { status: 404 });
  const [submitted] = await db.select({ value: count() }).from(industryOffers).where(eq(industryOffers.submitterKey, submitterKey));
  if ((submitted?.value ?? 0) >= 10) return Response.json({ error: "Offer limit reached." }, { status: 429 });
  const [offer] = await db.insert(industryOffers).values({ challengeId, organization, supportType, message, submitterKey, userId: user?.id }).returning({ id: industryOffers.id, status: industryOffers.status });
  return Response.json({ offer }, { status: 201 });
}
