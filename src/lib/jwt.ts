// src/lib/jwt.ts

// Helper: base64url encode
function base64url(input: Uint8Array | string): string {
  let str = typeof input === "string" ? Buffer.from(input).toString("base64") : Buffer.from(input).toString("base64");
  str = str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return str;
}

// Helper: base64url decode
function base64urlDecode(str: string): string {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Buffer.from(str, "base64").toString();
}

// Create JWT (HS256)
export async function create_jwt(payload: object, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const enc = new TextEncoder();
  const header_b64 = base64url(JSON.stringify(header));
  const payload_b64 = base64url(JSON.stringify(payload));
  const data = `${header_b64}.${payload_b64}`;

  // Only HS256 supported here
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  const sig_b64 = base64url(new Uint8Array(sig));
  return `${data}.${sig_b64}`;
}

// Verify JWT (HS256)
export async function verify_jwt(token: string, secret: string): Promise<object | null> {
  const [header_b64, payload_b64, sig_b64] = token.split(".");
  if (!header_b64 || !payload_b64 || !sig_b64) return null;
  const data = `${header_b64}.${payload_b64}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const sig = Uint8Array.from(atob(sig_b64.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  const valid = await crypto.subtle.verify("HMAC", key, sig, enc.encode(data));
  if (!valid) return null;
  return JSON.parse(base64urlDecode(payload_b64));
} 