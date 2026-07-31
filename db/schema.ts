import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["learner", "editor", "reviewer", "admin"]);
export const contentStatus = pgEnum("content_status", ["draft", "review", "published", "archived"]);
export const subscriptionStatus = pgEnum("subscription_status", ["pending", "active", "expired", "cancelled", "refunded"]);
export const paymentStatus = pgEnum("payment_status", ["pending", "paid", "failed", "expired", "refunded", "manual_review"]);
export const reviewState = pgEnum("review_state", ["new", "learning", "reviewing", "mastered"]);
export const authTokenPurpose = pgEnum("auth_token_purpose", ["verify_email", "reset_password"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: text("password_hash"),
  displayName: varchar("display_name", { length: 120 }),
  role: userRole("role").notNull().default("learner"),
  isActive: boolean("is_active").notNull().default(true),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("users_email_uq").on(table.email)]);

export const authSessions = pgTable("auth_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("auth_sessions_token_hash_uq").on(table.tokenHash), index("auth_sessions_user_idx").on(table.userId), index("auth_sessions_expiry_idx").on(table.expiresAt)]);

export const authTokens = pgTable("auth_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  purpose: authTokenPurpose("purpose").notNull(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("auth_tokens_token_hash_uq").on(table.tokenHash),
  index("auth_tokens_user_purpose_idx").on(table.userId, table.purpose),
  index("auth_tokens_expiry_idx").on(table.expiresAt),
]);

export const authRateLimits = pgTable("auth_rate_limits", {
  action: varchar("action", { length: 50 }).notNull(),
  keyHash: varchar("key_hash", { length: 64 }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull().defaultNow(),
  blockedUntil: timestamp("blocked_until", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.action, table.keyHash] }),
  index("auth_rate_limits_updated_idx").on(table.updatedAt),
]);

export const courses = pgTable("courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull(),
  titleVi: varchar("title_vi", { length: 180 }).notNull(),
  titleZh: varchar("title_zh", { length: 180 }).notNull(),
  hanzi: varchar("hanzi", { length: 12 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description").notNull(),
  level: varchar("level", { length: 40 }).notNull(),
  lessonCount: integer("lesson_count").notNull().default(0),
  totalMinutes: integer("total_minutes").notNull().default(0),
  freeLessonCount: integer("free_lesson_count").notNull().default(0),
  themeColor: varchar("theme_color", { length: 20 }).notNull().default("#dcebe2"),
  themeInk: varchar("theme_ink", { length: 20 }).notNull().default("#176b5b"),
  status: contentStatus("status").notNull().default("draft"),
  sortOrder: integer("sort_order").notNull().default(0),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("courses_slug_uq").on(table.slug), index("courses_status_idx").on(table.status)]);

export const modules = pgTable("modules", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 160 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
}, (table) => [uniqueIndex("modules_course_slug_uq").on(table.courseId, table.slug), index("modules_course_idx").on(table.courseId)]);

export const lessons = pgTable("lessons", {
  id: uuid("id").defaultRandom().primaryKey(),
  moduleId: uuid("module_id").notNull().references(() => modules.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 160 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  summary: text("summary"),
  situation: varchar("situation", { length: 180 }),
  estimatedMinutes: integer("estimated_minutes").notNull().default(10),
  isFree: boolean("is_free").notNull().default(false),
  status: contentStatus("status").notNull().default("draft"),
  sortOrder: integer("sort_order").notNull().default(0),
  content: jsonb("content").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("lessons_module_slug_uq").on(table.moduleId, table.slug), index("lessons_module_idx").on(table.moduleId)]);

export const vocabulary = pgTable("vocabulary", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 180 }).notNull(),
  hanzi: varchar("hanzi", { length: 120 }).notNull(),
  pinyin: varchar("pinyin", { length: 220 }).notNull(),
  meaningVi: text("meaning_vi").notNull(),
  exampleZh: text("example_zh"),
  exampleVi: text("example_vi"),
  audioUrl: text("audio_url"),
  tags: jsonb("tags").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("vocabulary_slug_uq").on(table.slug)]);

export const lessonVocabulary = pgTable("lesson_vocabulary", {
  lessonId: uuid("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  vocabularyId: uuid("vocabulary_id").notNull().references(() => vocabulary.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
}, (table) => [primaryKey({ columns: [table.lessonId, table.vocabularyId] })]);

export const lessonProgress = pgTable("lesson_progress", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonId: uuid("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  completionPercent: integer("completion_percent").notNull().default(0),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  lastOpenedAt: timestamp("last_opened_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.userId, table.lessonId] }), index("lesson_progress_user_idx").on(table.userId)]);

export const reviewItems = pgTable("review_items", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  vocabularyId: uuid("vocabulary_id").notNull().references(() => vocabulary.id, { onDelete: "cascade" }),
  state: reviewState("state").notNull().default("new"),
  easeScore: integer("ease_score").notNull().default(250),
  intervalDays: integer("interval_days").notNull().default(0),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }).notNull().defaultNow(),
  correctCount: integer("correct_count").notNull().default(0),
  wrongCount: integer("wrong_count").notNull().default(0),
}, (table) => [primaryKey({ columns: [table.userId, table.vocabularyId] }), index("review_due_idx").on(table.userId, table.nextReviewAt)]);

export const vipPlans = pgTable("vip_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  durationDays: integer("duration_days").notNull(),
  priceVnd: integer("price_vnd").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  benefits: jsonb("benefits").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("vip_plans_code_uq").on(table.code)]);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  planId: uuid("plan_id").notNull().references(() => vipPlans.id),
  status: subscriptionStatus("status").notNull().default("pending"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  activatedBy: uuid("activated_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("subscriptions_user_status_idx").on(table.userId, table.status)]);

export const paymentOrders = pgTable("payment_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  planId: uuid("plan_id").notNull().references(() => vipPlans.id),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
  referenceCode: varchar("reference_code", { length: 60 }).notNull(),
  amountVnd: integer("amount_vnd").notNull(),
  provider: varchar("provider", { length: 30 }).notNull().default("sepay"),
  status: paymentStatus("status").notNull().default("pending"),
  qrContent: text("qr_content"),
  providerTransactionId: varchar("provider_transaction_id", { length: 120 }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("payment_reference_uq").on(table.referenceCode), uniqueIndex("provider_transaction_uq").on(table.provider, table.providerTransactionId), index("payment_user_status_idx").on(table.userId, table.status)]);

export const paymentEvents = pgTable("payment_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").references(() => paymentOrders.id, { onDelete: "set null" }),
  providerEventId: varchar("provider_event_id", { length: 160 }),
  payload: jsonb("payload").notNull(),
  signatureValid: boolean("signature_valid").notNull().default(false),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("payment_provider_event_uq").on(table.providerEventId)]);

export const contentVersions = pgTable("content_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  lessonId: uuid("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  changeNote: text("change_note"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("content_version_uq").on(table.lessonId, table.version)]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 80 }).notNull(),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("audit_entity_idx").on(table.entityType, table.entityId), index("audit_actor_idx").on(table.actorId)]);
