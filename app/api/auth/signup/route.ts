import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createUserSession, hashPassword, sessionCookie } from "@/app/user-auth";

const roles = new Set(["student", "university", "industry"] as const);

export async function POST(request: Request) {
  const body = await request.json() as { name?: string; email?: string; password?: string; role?: string; organization?: string };
  const name = body.name?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const role = body.role as "student" | "university" | "industry";
  const organization = body.organization?.trim() ?? "";
  if (name.length < 2 || name.length > 80 || !/^\S+@\S+\.\S+$/.test(email) || email.length > 160 || password.length < 8 || password.length > 128 || !roles.has(role) || organization.length < 2 || organization.length > 140) {
    return Response.json({ error: "Please enter valid account details. Password must have at least 8 characters." }, { status: 400 });
  }
  const db = getDb();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return Response.json({ error: "An account with this email already exists." }, { status: 409 });
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(users).values({ name, email, passwordHash, role, organization, isVerified: role === "student" }).returning({ id: users.id, name: users.name, email: users.email, role: users.role, organization: users.organization, isVerified: users.isVerified });
  const session = await createUserSession(user.id);
  const response = Response.json({ user }, { status: 201 });
  response.headers.set("Set-Cookie", sessionCookie(session.token, session.expiresAt));
  return response;
}
