import { eq, inArray, or } from "drizzle-orm";
import { readDb, writeDb } from "../db/index.ts";
import {
  auditLogs,
  paymentEvents,
  paymentOrders,
  subscriptions,
  users,
  vipActivationRequests,
  vipPlans,
} from "../db/schema.ts";
import { hashPassword } from "../lib/auth-crypto.ts";

type RouteResult = { route: string; status: number; location?: string };

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

let subscriptionId: string | null = null;

async function signSepayWebhook(timestamp: string, rawBody: string) {
  const secret = process.env.SEPAY_WEBHOOK_SECRET?.trim();
  assert(secret, "Thiếu SEPAY_WEBHOOK_SECRET để kiểm tra staging.");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${rawBody}`));
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `sha256=${hex}`;
}

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
  const planRows = await readDb((db) => db.select({ id: vipPlans.id, priceVnd: vipPlans.priceVnd })
    .from(vipPlans).where(eq(vipPlans.isActive, true)).limit(1));
  const plan = planRows[0];
  assert(plan, "Không tìm thấy gói VIP đang hoạt động.");
  const orderResponse = await learner.request("/api/payments/sepay/orders", {
    method: "POST",
    body: JSON.stringify({ planId: plan.id }),
    headers: { "Content-Type": "application/json" },
  });
  assert(orderResponse.status === 201, `Tạo đơn SePay trả ${orderResponse.status}.`);
  const orderBody = await orderResponse.json() as { order?: {
    id: string;
    amountVnd: number;
    referenceCode: string;
    bankAccount: { accountNumber: string };
  } };
  const order = orderBody.order;
  assert(order, "API không trả đơn thanh toán SePay.");

  const timestamp = String(Math.floor(Date.now() / 1_000));
  const webhookPayload = JSON.stringify({
    id: Number(`${Date.now()}`.slice(-10)),
    gateway: process.env.SEPAY_BANK_CODE?.trim() || "ACB",
    transactionDate: new Date().toLocaleString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }),
    accountNumber: order.bankAccount.accountNumber,
    subAccount: "",
    code: order.referenceCode,
    content: `${order.referenceCode} staging verification`,
    transferType: "in",
    description: "HanziWork staging verification",
    transferAmount: order.amountVnd,
    accumulated: order.amountVnd,
    referenceCode: `QA${Date.now()}`,
  });
  const webhookResponse = await fetch(new URL("/api/webhooks/sepay", baseUrl), {
    method: "POST",
    body: webhookPayload,
    headers: {
      "Content-Type": "application/json",
      "X-SePay-Signature": await signSepayWebhook(timestamp, webhookPayload),
      "X-SePay-Timestamp": timestamp,
    },
  });
  assert(webhookResponse.status === 200, `Webhook SePay trả ${webhookResponse.status}.`);
  assert((await webhookResponse.json() as { success?: boolean }).success === true, "Webhook SePay không trả success=true.");

  const paidRows = await readDb((db) => db.select({
    status: paymentOrders.status,
    subscriptionId: paymentOrders.subscriptionId,
  }).from(paymentOrders).where(eq(paymentOrders.id, order.id)).limit(1));
  assert(paidRows[0]?.status === "paid", "Đơn SePay chưa chuyển paid trong PostgreSQL.");
  subscriptionId = paidRows[0]?.subscriptionId ?? null;
  assert(subscriptionId, "Webhook SePay chưa tạo subscription.");

  const subscriptionsPage = await admin.request("/admin/subscriptions");
  assert(subscriptionsPage.status === 200, `Admin subscriptions trả ${subscriptionsPage.status}.`);
  const subscriptionsHtml = await subscriptionsPage.text();
  assert(subscriptionsHtml.includes(learnerEmail), "Admin subscriptions chưa hiển thị giao dịch SePay của learner QA.");

  const notificationPage = await learner.request("/notifications");
  assert(notificationPage.status === 200, `Notifications trả ${notificationPage.status}.`);
  const notificationHtml = await notificationPage.text();
  assert(notificationHtml.includes("Thanh toán SePay thành công"), "Learner chưa nhận thông báo thanh toán SePay.");
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
    payment: "sepay_pending_to_paid",
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
    const paymentRows = await tx.select({ id: paymentOrders.id }).from(paymentOrders).where(inArray(paymentOrders.userId, userIds));
    const paymentIds = paymentRows.map((order) => order.id);
    if (paymentIds.length > 0) {
      await tx.delete(auditLogs).where(inArray(auditLogs.entityId, paymentIds));
      await tx.delete(paymentEvents).where(inArray(paymentEvents.orderId, paymentIds));
      await tx.delete(paymentOrders).where(inArray(paymentOrders.id, paymentIds));
    }
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
