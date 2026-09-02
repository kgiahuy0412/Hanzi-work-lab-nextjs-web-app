import { NextResponse } from "next/server";
import { isUuid } from "@/lib/admin-content-validation";
import { getCurrentUser } from "@/lib/auth-session";
import { getSepayPaymentOrder } from "@/lib/sepay-payment-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { orderId } = await params;
  if (!isUuid(orderId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const order = await getSepayPaymentOrder(orderId, user.id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order }, { headers: { "Cache-Control": "no-store" } });
}
