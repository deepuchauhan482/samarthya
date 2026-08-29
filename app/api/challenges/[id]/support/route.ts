import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { challenges, supportVotes } from "@/db/schema";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = Number.parseInt((await params).id, 10);
    const { voterKey } = await request.json() as { voterKey?: string };
    if (!Number.isInteger(id) || !voterKey || !/^[a-zA-Z0-9_-]{16,80}$/.test(voterKey)) return Response.json({ error: "Invalid request." }, { status: 400 });
    const db = getDb();
    const [challenge] = await db.select({ id: challenges.id, status: challenges.status }).from(challenges).where(eq(challenges.id, id)).limit(1);
    if (!challenge || challenge.status !== "approved") return Response.json({ error: "Challenge not found." }, { status: 404 });
    const [existing] = await db.select({ id: supportVotes.id }).from(supportVotes).where(and(eq(supportVotes.challengeId, id), eq(supportVotes.voterKey, voterKey))).limit(1);
    if (existing) {
      await db.delete(supportVotes).where(eq(supportVotes.id, existing.id));
      await db.update(challenges).set({ supportCount: sql`greatest(0, ${challenges.supportCount} - 1)` }).where(eq(challenges.id, id));
    } else {
      await db.insert(supportVotes).values({ challengeId: id, voterKey });
      await db.update(challenges).set({ supportCount: sql`${challenges.supportCount} + 1` }).where(eq(challenges.id, id));
    }
    const [updated] = await db.select({ supporters: challenges.supportCount }).from(challenges).where(eq(challenges.id, id));
    return Response.json({ supported: !existing, supporters: updated?.supporters ?? 0 });
  } catch (error) {
    console.error("challenge-support-failed", error);
    return Response.json({ error: "Support could not be saved." }, { status: 500 });
  }
}
