// signed download tokens: HMAC-SHA256 over "trackId|version|exp"; valid 7 days after purchase
import { createHmac, timingSafeEqual } from 'crypto';

const secret = () => process.env.DOWNLOAD_SECRET || 'dev-secret-change-me';

export function sign(trackId: string, version: string, days = 7) {
  const exp = Math.floor(Date.now() / 1000) + days * 86400;
  const msg = `${trackId}|${version}|${exp}`;
  const mac = createHmac('sha256', secret()).update(msg).digest('base64url');
  return Buffer.from(`${msg}|${mac}`).toString('base64url');
}

export function verify(token: string): { trackId: string; version: string } | null {
  try {
    const [trackId, version, exp, mac] = Buffer.from(token, 'base64url').toString().split('|');
    if (!trackId || !version || !exp || !mac) return null;
    if (Number(exp) < Math.floor(Date.now() / 1000)) return null;
    const want = createHmac('sha256', secret()).update(`${trackId}|${version}|${exp}`).digest('base64url');
    if (want.length !== mac.length || !timingSafeEqual(Buffer.from(want), Buffer.from(mac))) return null;
    if (!/^[a-z0-9_-]{1,32}$/i.test(version)) return null;
    return { trackId, version };
  } catch {
    return null;
  }
}
