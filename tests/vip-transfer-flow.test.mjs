import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("VIP payment opens a SePay QR flow and waits for automatic confirmation", async () => {
  const [page, transferFlow, styles, motionStyles, seed, subscriptionService, webhookRoute, orderRoute] = await Promise.all([
    read("app/vip/page.tsx"),
    read("components/vip-transfer-flow.tsx"),
    read("app/globals.css"),
    read("app/motion.css"),
    read("db/seed.ts"),
    read("lib/admin-subscription-service.ts"),
    read("app/api/webhooks/sepay/route.ts"),
    read("app/api/payments/sepay/orders/route.ts"),
  ]);

  assert.match(page, /VipTransferFlow/);
  assert.match(transferFlow, /onClick=\{openTransfer\}/);
  assert.match(transferFlow, /<h2 id=\{titleId\}>Quét QR chuyển khoản<\/h2>/);
  assert.match(transferFlow, /fetch\("\/api\/payments\/sepay\/orders"/);
  assert.match(transferFlow, /\/api\/payments\/sepay\/orders\/\$\{pollingOrderId\}/);
  assert.match(transferFlow, /Đang chờ SePay xác nhận/);
  assert.match(transferFlow, /Thanh toán thành công/);
  assert.match(transferFlow, /role="dialog"/);
  assert.match(transferFlow, /<Image/);
  assert.match(page, /displayPlans\.map/);
  assert.match(page, /vipPlanAccessLabel/);
  assert.doesNotMatch(page, /Học miễn phí|Tiếp tục học miễn phí|is-free/);
  assert.match(seed, /name: "VIP vĩnh viễn"[\s\S]*priceVnd: 1_090_000/);
  assert.match(subscriptionService, /calculateVipPlanEndsAt/);
  assert.match(subscriptionService, /endsAt: endsAt\?\.toISOString\(\) \?\? null/);
  assert.doesNotMatch(transferFlow, /requestVipActivationAction|name="userNote"/);
  assert.match(webhookRoute, /authenticateSepayWebhook/);
  assert.match(webhookRoute, /processSepayWebhook/);
  assert.match(webhookRoute, /success: true/);
  assert.match(orderRoute, /createOrReuseSepayPaymentOrder/);
  assert.match(styles, /\.vip-plan-request-form \.button:hover:not\(:disabled\)[\s\S]*translateY\(-3px\)/);
  assert.match(styles, /\.vip-plan-request-form \.button:active:not\(:disabled\)/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(styles, /transform 220ms cubic-bezier\(\.22, 1, \.36, 1\)/);
  assert.match(styles, /transform: translateY\(-2px\)/);
  assert.match(motionStyles, /\.vip-plan-request-form \.button[\s\S]*transition-duration: 220ms, 180ms, 180ms, 180ms !important/);
});
