import QRCode from "qrcode";

/**
 * Basis URL publik yang di-encode ke QR Code — env var terpisah dari header
 * Host request supaya konsisten meski app diakses lewat beberapa alamat
 * (IP VPS vs domain resmi). Lihat PRD "QR Code & Mode Pelacakan Per-Unit".
 */
function getAppUrl(): string {
  const url = process.env.APP_URL;
  if (!url) throw new Error("APP_URL is not set");
  return url.replace(/\/+$/, "");
}

export function buildPublicUrl(path: string): string {
  return `${getAppUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Data URL PNG siap pakai di tag <img>, meng-encode URL publik dari `path`. */
export async function generateQrDataUrl(path: string): Promise<string> {
  return QRCode.toDataURL(buildPublicUrl(path), { margin: 1, width: 320 });
}
