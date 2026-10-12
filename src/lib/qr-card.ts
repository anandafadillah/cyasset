import { readFile } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import { buildPublicUrl } from "@/lib/qr";

export type QrCardImage = {
  dataUrl: string;
  width: number;
  height: number;
  alt: string;
};

type QrCardData = {
  path: string;
  nama: string;
  kategori: string;
  kode?: string | null;
  lokasi?: string | null;
  canReportDamage?: boolean;
};

let logoDataUrl: Promise<string> | undefined;

function getLogoDataUrl() {
  return (logoDataUrl ??= readFile(path.join(process.cwd(), "public/qr/logo-smk-cyber-media.jpeg"))
    .then((buffer) => `data:image/jpeg;base64,${buffer.toString("base64")}`));
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[character]!);
}

// Keep long names, locations and unbroken asset codes inside their columns.
function wrapText(value: string, maxWidth: number, fontSize: number, mono = false) {
  function textWidth(text: string) {
    return Array.from(text).reduce((width, character) => {
      const factor = mono ? 0.61 : /[ilI.,' :;|!]/.test(character) ? 0.3
        : /[MW@%]/.test(character) ? 0.95 : /[A-Z]/.test(character) ? 0.7 : 0.57;
      return width + factor * fontSize;
    }, 0);
  }

  const lines: string[] = [];
  let line = "";
  for (const word of value.trim().split(/\s+/)) {
    if (line && textWidth(`${line} ${word}`) > maxWidth) {
      lines.push(line);
      line = "";
    }
    for (const character of Array.from(word)) {
      if (line && textWidth(line + character) > maxWidth) {
        lines.push(line);
        line = "";
      }
      line += character;
    }
    line += " ";
  }
  if (line.trim()) lines.push(line.trim());
  return lines.map((text) => text.trim());
}

function svgText(lines: string[], x: number, y: number, lineHeight: number, attributes = "") {
  return `<text x="${x}" y="${y}" ${attributes}>${lines.map((line, index) =>
    `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
  ).join("")}</text>`;
}

function wrapName(value: string) {
  const lines = wrapText(value, 276, 16);
  if (lines.length < 2) return lines;
  // Match the template's balanced heading instead of leaving a single word on the last line.
  let minWidth = 0;
  let maxWidth = 276;
  while (maxWidth - minWidth > 1) {
    const candidate = (minWidth + maxWidth) / 2;
    if (wrapText(value, candidate, 16).length <= lines.length) maxWidth = candidate;
    else minWidth = candidate;
  }
  return wrapText(value, maxWidth, 16);
}

/** One self-contained, vector card for the preview, print/PDF and PNG export. */
export async function generateQrCardImage(data: QrCardData): Promise<QrCardImage> {
  const width = 320;
  const kode = data.kode?.trim() || "—";
  const lokasi = data.lokasi?.trim() || "Belum diatur";
  const kategori = data.kategori.trim() || "Inventaris";
  const nameLines = wrapName(data.nama.trim() || "Aset");
  const categoryLines = wrapText(kategori, 254, 11, true);
  const codeLines = wrapText(kode, 124, 11, true);
  const locationLines = wrapText(lokasi, 124, 11);
  const categoryTop = 302 + nameLines.length * 21 + 8;
  const categoryHeight = categoryLines.length * 14 + 8;
  const detailsTop = categoryTop + categoryHeight + 18;
  const detailsHeight = Math.max(codeLines.length, locationLines.length) * 14 + 33;
  const footerTop = detailsTop + detailsHeight;
  const height = footerTop + 30;
  const footer = data.canReportDamage
    ? "Scan untuk melihat detail & lapor kerusakan"
    : "Scan untuk melihat detail prasarana";

  const qr = QRCode.create(buildPublicUrl(data.path), { errorCorrectionLevel: "M" });
  const quietZone = 4;
  const qrSize = qr.modules.size + quietZone * 2;
  const qrPaths: string[] = [];
  for (let row = 0; row < qr.modules.size; row++) {
    for (let column = 0; column < qr.modules.size; column++) {
      if (qr.modules.get(row, column)) {
        qrPaths.push(`M${column + quietZone} ${row + quietZone}h1v1h-1z`);
      }
    }
  }

  const logo = await getLogoDataUrl();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <clipPath id="card"><rect x="0.5" y="0.5" width="319" height="${height - 1}" rx="14"/></clipPath>
      <clipPath id="logo"><rect x="18" y="17" width="30" height="30" rx="6"/></clipPath>
    </defs>
    <g clip-path="url(#card)" font-family="Arial, sans-serif" fill="#18181b">
      <rect width="320" height="${height}" fill="#fff"/>
      <rect width="320" height="64" fill="#1e3a8a"/>
      <image href="${logo}" x="18" y="17" width="30" height="30" clip-path="url(#logo)"/>
      <text x="58" y="30" font-size="13" font-weight="600" fill="#fff">SMK Cyber Media</text>
      <text x="58" y="45" font-size="10" fill="#e0e7ff" font-family="Consolas, Courier New, monospace">CyAsset · Sarana &amp; Prasarana</text>
      <svg x="60" y="86" width="200" height="200" viewBox="0 0 ${qrSize} ${qrSize}" shape-rendering="crispEdges">
        <rect width="${qrSize}" height="${qrSize}" fill="#fff"/>
        <path d="${qrPaths.join("")}" fill="#000"/>
      </svg>
      ${svgText(nameLines, 160, 317, 21, 'font-size="16" font-weight="600" text-anchor="middle"')}
      <rect x="${160 - Math.min(138, Math.max(38, kategori.length * 3.4 + 10))}" y="${categoryTop}" width="${Math.min(276, Math.max(76, kategori.length * 6.8 + 20))}" height="${categoryHeight}" rx="${categoryHeight / 2}" fill="#eff2fb"/>
      ${svgText(categoryLines, 160, categoryTop + 15, 14, 'font-size="11" text-anchor="middle" fill="#1e3a8a" font-family="Consolas, Courier New, monospace"')}
      <path d="M0 ${detailsTop}H320 M160 ${detailsTop}v${detailsHeight}" stroke="#d4d4d8" stroke-dasharray="4 3" fill="none"/>
      <text x="18" y="${detailsTop + 19}" font-size="9" fill="#71717a" letter-spacing="0.54">KODE ASET</text>
      <text x="178" y="${detailsTop + 19}" font-size="9" fill="#71717a" letter-spacing="0.54">LOKASI</text>
      ${svgText(codeLines, 18, detailsTop + 35, 14, 'font-size="11" font-weight="500" font-family="Consolas, Courier New, monospace"')}
      ${svgText(locationLines, 178, detailsTop + 35, 14, 'font-size="11" font-weight="500"')}
      <rect y="${footerTop}" width="320" height="30" fill="#fafafa"/>
      <path d="M0 ${footerTop}H320" stroke="#f0f0f0"/>
      <text x="160" y="${footerTop + 19}" font-size="10" fill="#71717a" text-anchor="middle">${escapeXml(footer)}</text>
    </g>
    <rect x="0.5" y="0.5" width="319" height="${height - 1}" rx="14" fill="none" stroke="#e4e4e7"/>
  </svg>`;

  return {
    dataUrl: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
    width,
    height,
    alt: `Kartu QR ${data.nama}. Kategori: ${kategori}. Kode aset: ${kode}. Lokasi: ${lokasi}.`,
  };
}
