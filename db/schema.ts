import { boolean, index, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["student", "university", "industry"] }).notNull(),
  organization: text("organization").notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [index("users_role_verified_idx").on(table.role, table.isVerified)]);

export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [index("sessions_user_expiry_idx").on(table.userId, table.expiresAt)]);

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  category: text("category").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  reporterKey: text("reporter_key").notNull(),
  supportCount: integer("support_count").notNull().default(0),
  teams: integer("teams").notNull().default(0),
  urgency: text("urgency").notNull().default("Open for ideas"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  photoData: text("photo_data"),
  photoType: text("photo_type"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "string" }),
}, (table) => [
  index("challenges_status_created_idx").on(table.status, table.createdAt),
  index("challenges_reporter_created_idx").on(table.reporterKey, table.createdAt),
]);

export const supportVotes = pgTable("support_votes", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  voterKey: text("voter_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("support_votes_challenge_voter_idx").on(table.challengeId, table.voterKey),
]);

export const solutionProposals = pgTable("solution_proposals", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  teamName: text("team_name").notNull(),
  institution: text("institution").notNull(),
  summary: text("summary").notNull(),
  approach: text("approach").notNull(),
  memberCount: integer("member_count").notNull().default(1),
  submitterKey: text("submitter_key").notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "string" }),
}, (table) => [index("solutions_challenge_status_idx").on(table.challengeId, table.status)]);

export const industryOffers = pgTable("industry_offers", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  organization: text("organization").notNull(),
  supportType: text("support_type").notNull(),
  message: text("message").notNull(),
  submitterKey: text("submitter_key").notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "string" }),
}, (table) => [index("offers_challenge_status_idx").on(table.challengeId, table.status)]);

export const challengeUpdates = pgTable("challenge_updates", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  stage: text("stage").notNull().default("Update"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [index("updates_challenge_created_idx").on(table.challengeId, table.createdAt)]);

export const mentorships = pgTable("mentorships", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  universityUserId: integer("university_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mentorName: text("mentor_name").notNull(),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
}, (table) => [uniqueIndex("mentorship_challenge_university_idx").on(table.challengeId, table.universityUserId)]);
