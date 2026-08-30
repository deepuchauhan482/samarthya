import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { userSessions, users } from "@/db/schema";

const scrypt = promisify(scryptCallback);
export const USER_COOKIE = "samarthya_user";
const SESSION_DAYS = 14;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;
  const actual = await scrypt(password, salt, 64) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function tokenHash(token: string) { return createHash("sha256").update(token).digest("hex"); }

export async function createUserSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await getDb().insert(userSessions).values({ userId, tokenHash: tokenHash(token), expiresAt: expiresAt.toISOString() });
  return { token, expiresAt };
}

export function sessionCookie(token: string, expiresAt: Date) {
  return `${USER_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}; Expires=${expiresAt.toUTCString()}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export async function getSessionUser(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${USER_COOKIE}=`))?.slice(USER_COOKIE.length + 1);
  if (!token) return null;
  const [row] = await getDb().select({ id: users.id, name: users.name, email: users.email, role: users.role, organization: users.organization, isVerified: users.isVerified })
    .from(userSessions).innerJoin(users, eq(userSessions.userId, users.id))
    .where(and(eq(userSessions.tokenHash, tokenHash(token)), gt(userSessions.expiresAt, new Date().toISOString()))).limit(1);
  return row ?? null;
}

export async function revokeSession(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${USER_COOKIE}=`))?.slice(USER_COOKIE.length + 1);
  if (token) await getDb().delete(userSessions).where(eq(userSessions.tokenHash, tokenHash(token)));
}

export const clearSessionCookie = `${USER_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
