const IFLYTEK_ISE_HOST = "ise-api-sg.xf-yun.com";
const IFLYTEK_ISE_PATH = "/v2/ise";

function bytesToBase64(bytes: ArrayBuffer | Uint8Array) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function createIflytekIseAuthUrl({
  apiKey,
  apiSecret,
  now = new Date(),
}: {
  apiKey: string;
  apiSecret: string;
  now?: Date;
}) {
  const date = now.toUTCString();
  const signatureOrigin = `host: ${IFLYTEK_ISE_HOST}\ndate: ${date}\nGET ${IFLYTEK_ISE_PATH} HTTP/1.1`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(apiSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = bytesToBase64(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signatureOrigin)));
  const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const query = new URLSearchParams({
    authorization: bytesToBase64(new TextEncoder().encode(authorizationOrigin)),
    date,
    host: IFLYTEK_ISE_HOST,
  });

  return `wss://${IFLYTEK_ISE_HOST}${IFLYTEK_ISE_PATH}?${query.toString()}`;
}

export function getIflytekIseConfig() {
  const appId = process.env.IFLYTEK_ISE_APP_ID?.trim();
  const apiKey = process.env.IFLYTEK_ISE_API_KEY?.trim();
  const apiSecret = process.env.IFLYTEK_ISE_API_SECRET?.trim();

  if (!appId || !apiKey || !apiSecret) return null;
  return { appId, apiKey, apiSecret };
}
