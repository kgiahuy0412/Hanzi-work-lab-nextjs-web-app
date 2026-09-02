import { NextResponse } from "next/server";
import { isUuid } from "@/lib/admin-content-validation";
import { getCurrentUser } from "@/lib/auth-session";
import { isSameOriginRequest } from "@/lib/request-security";
import { createOrReuseSepayPaymentOrder } from "@/lib/sepay-payment-service";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const planId = body && typeof body === "object" && "planId" in body
    ? (body as { planId?: unknown }).planId
    : null;
  if (typeof planId !== "string" || !isUuid(planId)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const result = await createOrReuseSepayPaymentOrder({ planId, userId: user.id });
  if (!result.ok) {
    const status = result.error === "vip_plan_inactive" ? 409
      : result.error === "vip_request_ineligible" ? 403
        : 503;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ order: result.order }, {
    status: 201,
    headers: { "Cache-Control": "no-store" },
  });
}
