import {
  boolean,
  customType,
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
import { sql } from "drizzle-orm";

const bytea = customType<{ data: Uint8Array; driverData: Uint8Array }>({
  dataType: () => "bytea",
});

export const userRole = pgEnum("user_role", ["learner", "editor", "reviewer", "admin"]);
export const contentStatus = pgEnum("content_status", ["draft", "review", "published", "archived"]);
export const subscriptionStatus = pgEnum("subscription_status", ["pending", "active", "expired", "cancelled", "refunded"]);
export const vipActivationRequestStatus = pgEnum("vip_activation_request_status", ["pending", "approved", "rejected", "cancelled"]);
export const paymentStatus = pgEnum("payment_status", ["pending", "paid", "failed", "expired", "refunded", "manual_review"]);
export const reviewState = pgEnum("review_state", ["new", "learning", "reviewing", "mastered"]);
export const authTokenPurpose = pgEnum("auth_token_purpose", ["verify_email", "reset_password"]);
export const practiceAudioReviewStatus = pgEnum("practice_audio_review_status", ["pending", "approved", "re_record"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: text("password_hash"),
  displayName: varchar("display_name", { length: 120 }),
  avatarUrl: text("avatar_url"),
  avatarPublicId: varchar("avatar_public_id", { length: 500 }),
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
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
  correctCount: integer("correct_count").notNull().default(0),
  wrongCount: integer("wrong_count").notNull().default(0),
}, (table) => [
  primaryKey({ columns: [table.userId, table.vocabularyId] }),
  index("review_due_idx").on(table.userId, table.nextReviewAt),
  index("review_user_reviewed_idx").on(table.userId, table.lastReviewedAt),
]);

export const practiceAttempts = pgTable("practice_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  scenarioId: varchar("scenario_id", { length: 120 }).notNull(),
  industry: varchar("industry", { length: 80 }).notNull(),
  correctAnswers: integer("correct_answers").notNull().default(0),
  totalQuestions: integer("total_questions").notNull().default(0),
  totalReactionMs: integer("total_reaction_ms"),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("practice_attempts_user_completed_idx").on(table.userId, table.completedAt),
  index("practice_attempts_user_scenario_idx").on(table.userId, table.scenarioId),
]);

export const practiceIndustries = pgTable("practice_industries", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull(),
  label: varchar("label", { length: 120 }).notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  status: contentStatus("status").notNull().default("draft"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("practice_industries_slug_uq").on(table.slug),
  index("practice_industries_status_sort_idx").on(table.status, table.sortOrder),
]);

export const practiceScenarios = pgTable("practice_scenarios", {
  id: uuid("id").defaultRandom().primaryKey(),
  industryId: uuid("industry_id").notNull().references(() => practiceIndustries.id, { onDelete: "restrict" }),
  reviewerId: uuid("reviewer_id").references(() => users.id, { onDelete: "set null" }),
  slug: varchar("slug", { length: 120 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  brief: text("brief").notNull(),
  context: text("context").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(7),
  level: varchar("level", { length: 40 }).notNull().default("Thực tế"),
  isFree: boolean("is_free").notNull().default(false),
  sentenceZh: text("sentence_zh").notNull(),
  pinyin: text("pinyin").notNull(),
  translation: text("translation").notNull(),
  focus: jsonb("focus").notNull().default([]),
  status: contentStatus("status").notNull().default("draft"),
  reviewPriority: varchar("review_priority", { length: 16 }).notNull().default("normal"),
  reviewDueAt: timestamp("review_due_at", { withTimezone: true }),
  reviewRequestedAt: timestamp("review_requested_at", { withTimezone: true }),
  sortOrder: integer("sort_order").notNull().default(0),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("practice_scenarios_slug_uq").on(table.slug),
  index("practice_scenarios_industry_sort_idx").on(table.industryId, table.sortOrder),
  index("practice_scenarios_status_idx").on(table.status),
  index("practice_scenarios_review_queue_idx").on(table.status, table.reviewerId, table.reviewDueAt),
]);

export const practiceAudioAssets = pgTable("practice_audio_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  durationMs: integer("duration_ms"),
  checksumSha256: varchar("checksum_sha256", { length: 64 }).notNull(),
  storageProvider: varchar("storage_provider", { length: 24 }).notNull().default("database"),
  cloudinaryAssetId: varchar("cloudinary_asset_id", { length: 255 }),
  cloudinaryPublicId: varchar("cloudinary_public_id", { length: 500 }),
  cloudinaryVersion: integer("cloudinary_version"),
  cloudinarySecureUrl: text("cloudinary_secure_url"),
  cloudinaryFormat: varchar("cloudinary_format", { length: 24 }),
  content: bytea("content"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("practice_audio_assets_checksum_uq").on(table.checksumSha256),
  uniqueIndex("practice_audio_assets_cloudinary_asset_uq").on(table.cloudinaryAssetId),
  uniqueIndex("practice_audio_assets_cloudinary_public_uq").on(table.cloudinaryPublicId),
  index("practice_audio_assets_created_idx").on(table.createdAt),
]);

export const practiceExercises = pgTable("practice_exercises", {
  id: uuid("id").defaultRandom().primaryKey(),
  scenarioId: uuid("scenario_id").notNull().references(() => practiceScenarios.id, { onDelete: "cascade" }),
  audioAssetId: uuid("audio_asset_id").references(() => practiceAudioAssets.id, { onDelete: "set null" }),
  slug: varchar("slug", { length: 120 }).notNull(),
  eyebrow: varchar("eyebrow", { length: 160 }).notNull(),
  prompt: text("prompt").notNull(),
  chinese: text("chinese"),
  listeningText: text("listening_text"),
  isStatementCorrect: boolean("is_statement_correct"),
  audioUrl: text("audio_url"),
  audioReviewStatus: practiceAudioReviewStatus("audio_review_status").notNull().default("pending"),
  audioReviewIssues: jsonb("audio_review_issues").notNull().default([]),
  audioReviewNotes: text("audio_review_notes"),
  audioReviewedBy: uuid("audio_reviewed_by").references(() => users.id, { onDelete: "set null" }),
  audioReviewedAt: timestamp("audio_reviewed_at", { withTimezone: true }),
  options: jsonb("options").notNull().default([]),
  correctOption: integer("correct_option").notNull().default(0),
  explanation: text("explanation").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("practice_exercises_scenario_slug_uq").on(table.scenarioId, table.slug),
  index("practice_exercises_scenario_sort_idx").on(table.scenarioId, table.sortOrder),
  index("practice_exercises_audio_review_idx").on(table.scenarioId, table.audioReviewStatus),
]);

export const practiceScenarioVersions = pgTable("practice_scenario_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  scenarioId: uuid("scenario_id").notNull().references(() => practiceScenarios.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  changeNote: text("change_note"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("practice_scenario_version_uq").on(table.scenarioId, table.version),
]);

export const gameAttempts = pgTable("game_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  gameId: varchar("game_id", { length: 40 }).notNull(),
  score: integer("score").notNull().default(0),
  xpEarned: integer("xp_earned").notNull().default(0),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("game_attempts_user_completed_idx").on(table.userId, table.completedAt),
  index("game_attempts_user_game_idx").on(table.userId, table.gameId),
]);

export const vipPlans = pgTable("vip_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  durationDays: integer("duration_days").notNull(),
  priceVnd: integer("price_vnd").notNull(),
  discountPercent: integer("discount_percent").notNull().default(0),
  promotionLabel: varchar("promotion_label", { length: 160 }),
  isActive: boolean("is_active").notNull().default(true),
  benefits: jsonb("benefits").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
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

export const vipActivationRequests = pgTable("vip_activation_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: uuid("plan_id").notNull().references(() => vipPlans.id),
  status: vipActivationRequestStatus("status").notNull().default("pending"),
  source: varchar("source", { length: 40 }).notNull().default("vip_page"),
  userNote: text("user_note"),
  adminNote: text("admin_note"),
  reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("vip_activation_requests_user_pending_uq")
    .on(table.userId)
    .where(sql`${table.status} = 'pending'`),
  index("vip_activation_requests_status_created_idx").on(table.status, table.createdAt),
  index("vip_activation_requests_user_created_idx").on(table.userId, table.createdAt),
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 60 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  message: text("message").notNull(),
  href: varchar("href", { length: 500 }).notNull().default("/notifications"),
  entityType: varchar("entity_type", { length: 80 }),
  entityId: uuid("entity_id"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("notifications_user_type_entity_uq").on(table.userId, table.type, table.entityId),
  index("notifications_user_read_created_idx").on(table.userId, table.readAt, table.createdAt),
  index("notifications_user_created_idx").on(table.userId, table.createdAt),
]);

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
