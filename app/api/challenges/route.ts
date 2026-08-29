import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { challenges } from "@/db/schema";

const allowedCategories = new Set(["Water", "Agriculture", "Education", "Environment", "Health", "Other"]);

export async function GET() {
  try {
    const rows = await getDb().select({
      id: challenges.id, reference: challenges.reference, title: challenges.title,
      description: challenges.description, location: challenges.location,
      category: challenges.category, supporters: challenges.supportCount,
      teams: challenges.teams, urgency: challenges.urgency, createdAt: challenges.createdAt,
      hasPhoto: sql<boolean>`${challenges.photoData} is not null`,
    }).from(challenges).where(eq(challenges.status, "approved")).orderBy(desc(challenges.createdAt)).limit(50);
    return Response.json({ challenges: rows });
  } catch (error) {
    console.error("challenge-list-failed", error);
    return Response.json({ error: "Challenges could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { description?: string; location?: string; category?: string; reporterKey?: string; website?: string; latitude?: number; longitude?: number };
    if (payload.website) return Response.json({ ok: true }, { status: 201 });
    const description = payload.description?.trim() ?? "";
    const location = payload.location?.trim() ?? "";
    const category = payload.category?.trim() ?? "";
    const reporterKey = payload.reporterKey?.trim() ?? "";
    if (description.length < 15 || description.length > 1200) return Response.json({ error: "Describe the problem in 15–1200 characters." }, { status: 400 });
    if (location.length < 2 || location.length > 120) return Response.json({ error: "Enter a valid location." }, { status: 400 });
    if (!allowedCategories.has(category)) return Response.json({ error: "Choose a valid category." }, { status: 400 });
    if (!/^[a-zA-Z0-9_-]{16,80}$/.test(reporterKey)) return Response.json({ error: "Your device could not be verified. Refresh and try again." }, { status: 400 });

    const db = getDb();
    const [recent] = await db.select({ value: count() }).from(challenges).where(and(eq(challenges.reporterKey, reporterKey), gte(challenges.createdAt, sql`NOW() - INTERVAL '1 day'`)));
    if ((recent?.value ?? 0) >= 5) return Response.json({ error: "Submission limit reached. Please try again tomorrow." }, { status: 429 });

    const firstSentence = description.split(/[.!?\n]/)[0]?.trim() || description;
    const title = firstSentence.length > 78 ? `${firstSentence.slice(0, 75)}…` : firstSentence;
    const reference = `SAM-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
    const latitude = Number.isFinite(payload.latitude) ? Number(payload.latitude).toFixed(3) : null;
    const longitude = Number.isFinite(payload.longitude) ? Number(payload.longitude).toFixed(3) : null;
    const [challenge] = await db.insert(challenges).values({ reference, title, description, location, category, reporterKey, latitude, longitude }).returning({ id: challenges.id, reference: challenges.reference, status: challenges.status });
    return Response.json({ challenge }, { status: 201 });
  } catch (error) {
    console.error("challenge-submit-failed", error);
    return Response.json({ error: "Your report could not be submitted. Please try again." }, { status: 500 });
  }
}
