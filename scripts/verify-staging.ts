import { and, eq, inArray, or } from "drizzle-orm";
import { readDb, writeDb } from "../db/index.ts";
import {
  auditLogs,
  subscriptions,
  users,
  vipActivationRequests,
} from "../db/schema.ts";
import { hashPassword } from "../lib/auth-crypto.ts";

type RouteResult = { route: string; status: number; location?: string };
type InputFields = Record<string, string>;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function stagingBaseUrl() {
  const value = process.env.STAGING_APP_URL?.trim();
  if (!value) throw new Error("Thiếu STAGING_APP_URL.");

  const url = new URL(value);
  assert(url.protocol === "https:", "STAGING_APP_URL phải dùng HTTPS.");
  assert(url.hostname !== "localhost" && url.hostname !== "127.0.0.1", "Không chạy staging verification trên localhost.");
  return url.origin;
}

function locationPath(response: Response) {
  const value = response.headers.get("location");
  return value ? new URL(value, baseUrl).pathname + new URL(value, baseUrl).search : undefined;
}

function inputFields(form: string): InputFields {
  const fields: InputFields = {};
  for (const match of form.matchAll(/<input\b[^>]*>/giu)) {
    const tag = match[0];
    const name = tag.match(/\bname="([^"]+)"/iu)?.[1];
    if (!name) continue;
    fields[name] = tag.match(/\bvalue="([^"]*)"/iu)?.[1] ?? "";
  }
  return fields;
}

function findForm(html: string, predicate: (form: string) => boolean) {
  for (const match of html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/giu)) {
    if (predicate(match[0])) return match[0];
  }
  throw new Error("Không tìm thấy form Server Action cần kiểm tra.");
}

function actionPayload(form: string, overrides: InputFields) {
  const fields = { ...inputFields(form), ...overrides };
  const actionName = Object.keys(fields).find((name) => name.startsWith("$ACTION_ID_"));
  assert(actionName, "Form không chứa Server Action id.");

  const body = new FormData();
  for (const [name, value] of Object.entries(fields)) body.set(name, value);
  return body;
}

class BrowserSession {
  private readonly cookies = new Map<string, string>();

  async request(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    headers.set("User-Agent", "HanziWork-Staging-Verification/1.0");
    if (this.cookies.size > 0) {
      headers.set("Cookie", [...this.cookies].map(([name, value]) => `${name}=${value}`).join("; "));
    }
    if (init.method && init.method !== "GET" && init.method !== "HEAD") headers.set("Origin", baseUrl);

    const response = await fetch(new URL(path, baseUrl), {
      ...init,
      headers,
      redirect: "manual",
    });
    const responseHeaders = response.headers as Headers & { getSetCookie?: () => string[] };
    const setCookies = responseHeaders.getSetCookie?.() ?? [response.headers.get("set-cookie")].filter(Boolean) as string[];
    for (const setCookie of setCookies) {
      const [pair] = setCookie.split(";", 1);
      const separator = pair.indexOf("=");
      if (separator < 1) continue;
      const name = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      if (value) this.cookies.set(name, value);
      else this.cookies.delete(name);
    }
    return response;
  }

  hasSessionCookie() {
    return [...this.cookies.keys()].some((name) => name.includes("session"));
  }
}

async function login(session: BrowserSession, email: string, password: string, mode: "admin" | "learner") {
  const body = new URLSearchParams({ email, password, mode, returnTo: mode === "admin" ? "/admin" : "/account" });
  const response = await session.request("/api/auth/login", { method: "POST", body });
  assert(response.status === 303, `${mode} login trả ${response.status}, cần 303.`);
  assert(locationPath(response) === (mode === "admin" ? "/admin" : "/account"), `${mode} login redirect sai.`);
  assert(session.hasSessionCookie(), `${mode} login không tạo session cookie.`);
}

async function publicSmoke(): Promise<RouteResult[]> {
  const expectations = new Map<string, number>([
    ["/", 200],
    ["/vip", 200],
    ["/courses", 200],
    ["/practice", 200],
    ["/games", 200],
    ["/writing", 307],
    ["/notifications", 307],
    ["/admin", 307],
  ]);
  const results: RouteResult[] = [];

  for (const [route, expectedStatus] of expectations) {
    const response = await fetch(new URL(route, baseUrl), { redirect: "manual" });
    assert(response.status === expectedStatus, `${route} trả ${response.status}, cần ${expectedStatus}.`);
    results.push({ route, status: response.status, ...(locationPath(response) ? { location: locationPath(response) } : {}) });
  }
  return results;
}

const baseUrl = stagingBaseUrl();
const runId = crypto.randomUUID().slice(0, 8);
const learnerEmail = `qa-staging-learner-${runId}@example.com`;
const adminEmail = `qa-staging-admin-${runId}@example.com`;
const registrationEmail = `qa-staging-register-${runId}@example.com`;
const qaEmails = [learnerEmail, adminEmail, registrationEmail];
const password = `Qa!${crypto.randomUUID()}Aa1`;

let requestId: string | null = null;
let subscriptionId: string | null = null;

async function setupUsers() {
  const passwordHash = await hashPassword(password);
  const inserted = await writeDb((db) => db.insert(users).values([
    {
      email: learnerEmail,
      displayName: "QA Staging Learner",
      passwordHash,
      role: "learner",
      emailVerifiedAt: new Date(),
    },
    {
      email: adminEmail,
      displayName: "QA Staging Admin",
      passwordHash,
      role: "admin",
      emailVerifiedAt: new Date(),
    },
  ]).returning({ id: users.id, email: users.email }));
  assert(inserted.length === 2, "Không tạo đủ fixture staging.");
}

async function verifyRegistrationWithoutResend() {
  const session = new BrowserSession();
  const body = new URLSearchParams({
    displayName: "QA Staging Register",
    email: registrationEmail,
    password,
    confirmPassword: password,
    returnTo: "/",
  });
  const response = await session.request("/api/auth/register", { method: "POST", body });
  assert(response.status === 303, `Register trả ${response.status}, cần 303.`);
  const destination = locationPath(response) ?? "";
  assert(destination.startsWith("/verify-email?"), "Register không chuyển sang trang xác minh.");
  assert(destination.includes("sent=1") && destination.includes("error=delivery_failed"), "Register chưa phản ánh đúng trạng thái thiếu Resend.");
  assert(!session.hasSessionCookie(), "Tài khoản chưa xác minh không được nhận session.");
  return destination;
}

async function verifyVipFlow() {
  const learner = new BrowserSession();
  const admin = new BrowserSession();
  await login(learner, learnerEmail, password, "learner");
  await login(admin, adminEmail, password, "admin");

  const learnerAdmin = await learner.request("/admin");
  assert(learnerAdmin.status === 307, "Learner không bị chặn khỏi admin.");
  assert(locationPath(learnerAdmin)?.startsWith("/admin/login"), "Learner admin redirect sai.");
  const adminHome = await admin.request("/admin");
  assert(adminHome.status === 200, `Admin dashboard trả ${adminHome.status}.`);

  const vipPage = await learner.request("/vip");
  assert(vipPage.status === 200, `VIP page cho learner trả ${vipPage.status}.`);
  const vipHtml = await vipPage.text();
  const requestForm = findForm(vipHtml, (form) => form.includes("vip-plan-request-form") && !form.includes("disabled"));
  const requestFields = inputFields(requestForm);
  assert(requestFields.planId, "Không tìm thấy planId trên VIP page.");
  const requestResponse = await learner.request("/vip", {
    method: "POST",
    body: actionPayload(requestForm, { planId: requestFields.planId, userNote: "Staging E2E verification" }),
  });
  assert(requestResponse.status === 303, `Gửi yêu cầu VIP trả ${requestResponse.status}.`);
  assert(locationPath(requestResponse) === "/vip?success=requested", "Gửi yêu cầu VIP redirect sai.");

  const pendingRows = await readDb((db) => db.select({ id: vipActivationRequests.id })
    .from(vipActivationRequests)
    .innerJoin(users, eq(users.id, vipActivationRequests.userId))
    .where(and(eq(users.email, learnerEmail), eq(vipActivationRequests.status, "pending")))
    .limit(1));
  requestId = pendingRows[0]?.id ?? null;
  assert(requestId, "Yêu cầu VIP không được ghi vào PostgreSQL.");

  const subscriptionsPage = await admin.request("/admin/subscriptions");
  assert(subscriptionsPage.status === 200, `Admin subscriptions trả ${subscriptionsPage.status}.`);
  const subscriptionsHtml = await subscriptionsPage.text();
  const learnerIndex = subscriptionsHtml.indexOf(learnerEmail);
  assert(learnerIndex >= 0, "Hàng đợi admin không hiển thị learner QA.");
  const articleStart = subscriptionsHtml.lastIndexOf("<article", learnerIndex);
  const articleEnd = subscriptionsHtml.indexOf("</article>", learnerIndex);
  assert(articleStart >= 0 && articleEnd > articleStart, "Không tách được yêu cầu VIP trong hàng đợi admin.");
  const requestArticle = subscriptionsHtml.slice(articleStart, articleEnd + 10);
  const approveForm = findForm(requestArticle, (form) => form.includes("Duyệt") && form.includes("requestId"));
  const approveResponse = await admin.request("/admin/subscriptions", {
    method: "POST",
    body: actionPayload(approveForm, { requestId, adminNote: "Approved by staging E2E" }),
  });
  assert(approveResponse.status === 303, `Duyệt VIP trả ${approveResponse.status}.`);
  assert(locationPath(approveResponse) === "/admin/subscriptions?success=vip_request_approved", "Duyệt VIP redirect sai.");

  const approvedRows = await readDb((db) => db.select({
    status: vipActivationRequests.status,
    subscriptionId: vipActivationRequests.subscriptionId,
  }).from(vipActivationRequests).where(eq(vipActivationRequests.id, requestId!)).limit(1));
  assert(approvedRows[0]?.status === "approved", "Yêu cầu VIP chưa chuyển approved trong PostgreSQL.");
  subscriptionId = approvedRows[0]?.subscriptionId ?? null;
  assert(subscriptionId, "Duyệt VIP chưa tạo subscription.");

  const notificationPage = await learner.request("/notifications");
  assert(notificationPage.status === 200, `Notifications trả ${notificationPage.status}.`);
  const notificationHtml = await notificationPage.text();
  assert(notificationHtml.includes("VIP đã được kích hoạt"), "Learner chưa nhận thông báo VIP.");
  assert(notificationHtml.includes("1</strong><span>chưa đọc"), "Unread count của thông báo VIP không đúng.");

  const accountPage = await learner.request("/account");
  assert(accountPage.status === 200, `Account trả ${accountPage.status}.`);
  const accountHtml = await accountPage.text();
  assert(accountHtml.includes("Hiệu lực đến"), "Account chưa hiển thị entitlement VIP.");

  const practicePage = await learner.request("/practice");
  assert(practicePage.status === 200, `Practice trả ${practicePage.status}.`);
  const practiceHtml = await practicePage.text();
  const audioPath = practiceHtml.match(/\/api\/media\/practice-audio\/[0-9a-f-]{36}/iu)?.[0];
  assert(audioPath, "Practice page không chứa media route đã được cấp quyền.");
  const audioResponse = await learner.request(audioPath);
  assert([302, 303, 307, 308].includes(audioResponse.status), `Media route trả ${audioResponse.status}, cần redirect CDN.`);
  const audioLocation = audioResponse.headers.get("location");
  assert(audioLocation && new URL(audioLocation).hostname.endsWith("cloudinary.com"), "Media route không redirect tới Cloudinary.");
  const cloudinaryResponse = await fetch(audioLocation, { method: "HEAD" });
  assert(cloudinaryResponse.ok, `Cloudinary audio HEAD trả ${cloudinaryResponse.status}.`);
  assert(cloudinaryResponse.headers.get("content-type")?.startsWith("audio/"), "Cloudinary không trả content-type audio.");

  return {
    learnerLogin: "ok",
    adminLogin: "ok",
    learnerRbac: "blocked",
    request: "pending_to_approved",
    notification: "unread_created",
    entitlement: "active",
    audio: `redirect_${audioResponse.status}_cdn_${cloudinaryResponse.status}`,
  };
}

async function cleanupFixtures() {
  const qaUsers = await readDb((db) => db.select({ id: users.id }).from(users).where(inArray(users.email, qaEmails)));
  const userIds = qaUsers.map((user) => user.id);
  if (userIds.length === 0) return 0;

  const requestRows = await readDb((db) => db.select({ id: vipActivationRequests.id, subscriptionId: vipActivationRequests.subscriptionId })
    .from(vipActivationRequests).where(inArray(vipActivationRequests.userId, userIds)));
  const requestIds = requestRows.map((request) => request.id);
  const subscriptionIds = requestRows.flatMap((request) => request.subscriptionId ? [request.subscriptionId] : []);
  const relatedEntityIds = [...userIds, ...requestIds, ...subscriptionIds];

  await writeDb((db) => db.transaction(async (tx) => {
    if (relatedEntityIds.length > 0) {
      await tx.delete(auditLogs).where(or(
        inArray(auditLogs.actorId, userIds),
        inArray(auditLogs.entityId, relatedEntityIds),
      ));
    }
    await tx.delete(vipActivationRequests).where(inArray(vipActivationRequests.userId, userIds));
    await tx.delete(subscriptions).where(inArray(subscriptions.userId, userIds));
    await tx.delete(users).where(inArray(users.id, userIds));
  }));

  const remaining = await readDb((db) => db.select({ id: users.id }).from(users).where(inArray(users.email, qaEmails)));
  return remaining.length;
}

let report: Record<string, unknown> = {};
try {
  const healthResponse = await fetch(new URL("/api/health", baseUrl));
  const health = await healthResponse.json() as { status?: string; checks?: { database?: string } };
  assert(healthResponse.status === 200 && health.status === "ok" && health.checks?.database === "ok", "Health/readiness staging chưa đạt.");
  const routes = await publicSmoke();
  await setupUsers();
  const registration = await verifyRegistrationWithoutResend();
  const vip = await verifyVipFlow();
  report = { baseUrl, health: "ok", routes, registration, vip };
} finally {
  const qaUsersRemaining = await cleanupFixtures();
  report.cleanup = { qaUsersRemaining };
  console.log(JSON.stringify(report, null, 2));
}
