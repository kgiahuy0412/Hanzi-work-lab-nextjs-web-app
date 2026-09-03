import { NextResponse } from "next/server";
import { createIflytekIseAuthUrl, getIflytekIseConfig } from "@/lib/iflytek-ise";
import { isSameOriginRequest } from "@/lib/request-security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ code: "forbidden" }, { status: 403, headers: { "cache-control": "no-store" } });
  }

  const config = getIflytekIseConfig();
  if (!config) {
    return NextResponse.json(
      {
        code: "iflytek_not_configured",
        message: "Chưa cấu hình dịch vụ chấm phát âm iFlytek.",
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  const url = await createIflytekIseAuthUrl(config);
  return NextResponse.json(
    { appId: config.appId, url },
    { headers: { "cache-control": "no-store, max-age=0" } },
  );
}
