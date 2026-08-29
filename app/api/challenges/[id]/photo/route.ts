import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { challenges } from "@/db/schema";
import { isAdminRequest } from "@/app/admin-auth";

const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number.parseInt((await params).id, 10);
  const form = await request.formData();
  const file = form.get("photo"), reporterKey = String(form.get("reporterKey") ?? "");
  if (!(file instanceof File) || !allowed.has(file.type) || file.size > 4 * 1024 * 1024) return Response.json({ error: "Use a JPG, PNG, or WebP image under 4 MB." }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const validJpeg = file.type === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const validPng = file.type === "image/png" && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const validWebp = file.type === "image/webp" && String.fromCharCode(...bytes.slice(0,4)) === "RIFF" && String.fromCharCode(...bytes.slice(8,12)) === "WEBP";
  if (!validJpeg && !validPng && !validWebp) return Response.json({ error: "The uploaded file is not a valid image." }, { status: 400 });
  const db = getDb();
  const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
  if (!challenge || challenge.reporterKey !== reporterKey || challenge.photoData) return Response.json({ error: "Photo upload is not allowed." }, { status: 403 });
  const photoData = Buffer.from(bytes).toString("base64");
  await db.update(challenges).set({ photoData, photoType: file.type }).where(eq(challenges.id, id));
  return Response.json({ uploaded: true });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number.parseInt((await params).id, 10);
  const [challenge] = await getDb().select().from(challenges).where(eq(challenges.id, id));
  const canModerate = await isAdminRequest(request);
  if (!challenge?.photoData || (challenge.status !== "approved" && !canModerate)) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(challenge.photoData, "base64"), { headers: { "Content-Type": challenge.photoType ?? "image/jpeg", "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
}
