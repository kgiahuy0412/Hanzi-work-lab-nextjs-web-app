import { NextResponse } from "next/server";
import { processSepayWebhook } from "@/lib/sepay-payment-service";
import { authenticateSepayWebhook, parseSepayWebhookPayload } from "@/lib/sepay";

function failed(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const authentication = await authenticateSepayWebhook({
    apiKey: process.env.SEPAY_API_KEY,
    authorization: request.headers.get("authorization"),
    rawBody,
    secret: process.env.SEPAY_WEBHOOK_SECRET,
    signature: request.headers.get("x-sepay-signature"),
    timestamp: request.headers.get("x-sepay-timestamp"),
  });
  if (!authentication.ok) {
    if (authentication.error === "misconfigured") {
      console.error("Webhook SePay chưa được cấu hình HMAC secret hoặc API key.");
      return failed("Webhook is not configured", 503);
    }
    return failed(authentication.error === "expired" ? "Request expired" : "Unauthorized", 401);
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return failed("Invalid JSON", 400);
  }
  const payload = parseSepayWebhookPayload(parsedBody);
  if (!payload) return failed("Invalid payload", 400);

  try {
    await processSepayWebhook(payload);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Không thể xử lý webhook SePay.", error instanceof Error ? error.message : "unknown");
    return failed("Processing failed", 500);
  }
}
