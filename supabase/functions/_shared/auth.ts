// Hashing de PIN (PBKDF2-SHA256, sin dependencias externas — Web Crypto
// nativo de Deno) y tokens de sesión firmados (HMAC-SHA256), stateless.
//
// El PIN nunca se guarda en texto plano ni se compara en texto plano.
// El token de sesión no se guarda en el servidor: es autocontenido y se
// valida recalculando la firma. Esto es intencionalmente más simple que
// JWT completo porque el único claim que necesitamos es el slug + una
// expiración.

const PBKDF2_ITERATIONS = 100_000;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 días

function toHex(buf: ArrayBuffer | Uint8Array): string {
  return Array.from(new Uint8Array(buf as ArrayBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function hashPin(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return `${toHex(salt)}:${PBKDF2_ITERATIONS}:${toHex(derived)}`;
}

export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const [saltHex, iterationsStr, hashHex] = stored.split(":");
  if (!saltHex || !iterationsStr || !hashHex) return false;

  const salt = fromHex(saltHex);
  const iterations = parseInt(iterationsStr, 10);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );

  return constantTimeEqual(toHex(derived), hashHex);
}

function base64url(bytes: Uint8Array): string {
  let str = btoa(String.fromCharCode(...bytes));
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/").padEnd(str.length + ((4 - (str.length % 4)) % 4), "=");
  return new Uint8Array(atob(padded).split("").map((c) => c.charCodeAt(0)));
}

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return new Uint8Array(sig);
}

export async function createSessionToken(slug: string, secret: string): Promise<string> {
  const payload = JSON.stringify({ slug, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS });
  const payloadB64 = base64url(new TextEncoder().encode(payload));
  const sig = await hmac(secret, payloadB64);
  return `${payloadB64}.${base64url(sig)}`;
}

export async function verifySessionToken(token: string, secret: string): Promise<string | null> {
  const [payloadB64, sigB64] = (token ?? "").split(".");
  if (!payloadB64 || !sigB64) return null;

  const expectedSig = base64url(await hmac(secret, payloadB64));
  if (!constantTimeEqual(expectedSig, sigB64)) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(payloadB64)));
    if (typeof payload.slug !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload.slug;
  } catch {
    return null;
  }
}
