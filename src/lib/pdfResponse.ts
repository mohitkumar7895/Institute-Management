import { NextResponse } from "next/server";

export function pdfBinaryResponse(buffer: Buffer, fileName: string, contentType = "application/pdf") {
  const bytes = Uint8Array.from(buffer);
  const safeName = fileName.replace(/[^\w.\-() ]+/g, "_") || "document.pdf";

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(bytes.length),
      "Content-Disposition": `inline; filename="${safeName}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export function isPdfDataUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed.startsWith("data:")) return false;
  const mime = trimmed.slice(5, trimmed.indexOf(";")).toLowerCase();
  return mime === "application/pdf" || mime === "application/octet-stream";
}

export function sitePdfEmbedUrl(id: string): string {
  return `/api/public/course-pdfs/${encodeURIComponent(id)}/pdf`;
}

export function coursePdfEmbedUrl(id: string): string {
  return `/api/public/courses/${encodeURIComponent(id)}/pdf`;
}

export function sitePdfViewerUrl(id: string): string {
  return `/open-pdf/site/${encodeURIComponent(id)}`;
}

export function coursePdfViewerUrl(id: string): string {
  return `/open-pdf/course/${encodeURIComponent(id)}`;
}
