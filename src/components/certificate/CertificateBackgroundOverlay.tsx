"use client";

import { type CSSProperties } from "react";
import {
  formatCertificateFromLabel,
  formatDurationMonths,
  formatFromSessionFallback,
} from "@/lib/examDocumentSplit";

/**
 * Yukti-style landscape A4 certificate (297×210mm).
 *
 * The admin-uploaded blank template owns all of the chrome (logo, ISO seal,
 * "Yukti Computer Institute" title, dotted lines, footer band). This overlay
 * only writes filled-in values onto those blank lines + photo / QR / sig boxes.
 */
/**
 * Coordinates derived from pixel-measuring the Yukti landscape A4 template
 * (1024×709 → 297×210 mm). Each `top` value is the text container's top edge
 * such that the rendered text baseline lands on the printed label baseline.
 */
const L = {
  /** Photo placeholder (top-right white square in the template). */
  photo: { top: "21mm", right: "17mm", w: "42mm", h: "45mm" },

  /** "Presented to ___ S/o, D/o ___ has successfully" — text floats just above the dotted line. */
  nameLine: { top: "79mm", left: "55mm", w: "100mm" },
  parentLine: { top: "79mm", left: "205mm", w: "70mm" },

  /** "Completed the ___ at ___ Of Duration" — lifted off the dotted line. */
  courseLine: { top: "89mm", left: "57mm", w: "78mm" },
  centerLine: { top: "89mm", left: "168mm", w: "75mm" },

  /** "___ and obtained the grade ___ in recognition of his/her success this" */
  durationLine: { top: "99mm", left: "14mm", w: "60mm" },
  gradeCx: "172mm",
  gradeTop: "99mm",

  /** "From ___" — admission month-year. */
  fromLine: { top: "121mm", left: "30mm", w: "55mm" },

  /** Bottom-left meta — text sits just above each printed dotted underline. */
  enrollmentLine: { top: "132mm", left: "55mm", w: "78mm" },
  certNoLine: { top: "141mm", left: "55mm", w: "78mm" },
  issueDateLine: { top: "150mm", left: "55mm", w: "78mm" },

  /** Verification QR — fits snugly inside the printed square placeholder. */
  qr: { top: "119mm", left: "200mm", w: "30mm", h: "30mm" },

  /** Signature moved slightly more up and toward right side. */
  sigAtc: { top: "158mm", right: "192mm", w: "64mm", h: "18mm" },
  sigAuth: { top: "158mm", right: "16mm", w: "64mm", h: "18mm" },
} as const;

const ink = "#050505";
const fieldNudge: CSSProperties = { transform: "translateY(0.4mm)" };
function centerNudge(cx: string, top: string): CSSProperties {
  return { top, left: cx, transform: "translate(-50%, 0.4mm)" };
}

export type CertificateBgStudent = {
  name?: string;
  fatherName?: string;
  motherName?: string;
  photo?: string;
  admissionDate?: string;
};

export type CertificateBgData = {
  courseName: string;
  centerName: string;
  centerCode?: string;
  grade: string;
  session: string;
  enrollmentNo: string;
  serialNo: string;
  issueDate: string | Date;
  fromLabel?: string | null;
  durationMonths?: number | null;
  studentId?: CertificateBgStudent | string | null;
};

export type CertificatePageData = CertificateBgData & {
  _id?: string;
  examId?: string;
  atcId?: string;
  isApproved?: boolean;
};

type Props = {
  data: CertificateBgData;
  /** Optional fallback brand name (used only when center name/code is missing). */
  brandName?: string;
  signatureUrl?: string;
  atcSignatureUrl?: string;
  verifyUrl?: string;
};

function formatIssue(d: string | Date): string {
  try {
    const dt = typeof d === "string" ? new Date(d) : d;
    if (Number.isNaN(dt.getTime())) return String(d);
    return dt
      .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      .toUpperCase();
  } catch {
    return String(d);
  }
}

function pickStudent(s: CertificateBgData["studentId"]): CertificateBgStudent | null {
  return s && typeof s === "object" ? s : null;
}

function safeText(v?: string | number | null): string {
  if (v == null) return "";
  return String(v).trim();
}

export default function CertificateBackgroundOverlay({
  data,
  brandName,
  signatureUrl,
  atcSignatureUrl,
  verifyUrl,
}: Props) {
  const s = pickStudent(data.studentId);
  const parentLine = safeText(s?.fatherName) || safeText(s?.motherName);
  // After "at" we should print the issuing center name (as requested), not site brand.
  const centerDisplay =
    safeText(data.centerName) || safeText(data.centerCode) || safeText(brandName);

  const fromDisplay =
    safeText(data.fromLabel) ||
    formatCertificateFromLabel(s?.admissionDate) ||
    formatFromSessionFallback(data.session);

  const durationDisplay = formatDurationMonths(data.durationMonths ?? undefined);

  const qrSrc = verifyUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}`
    : "";

  const valFont: CSSProperties = {
    fontFamily: 'system-ui, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    fontWeight: 800,
    color: ink,
    WebkitTextFillColor: ink,
    letterSpacing: "0.02em",
  };
  const bodyCls =
    "pointer-events-none absolute truncate uppercase leading-tight text-[13px]";
  const metaCls =
    "pointer-events-none absolute truncate not-italic uppercase leading-none text-[12.5px] tabular-nums";
  const photoFrameCls =
    "absolute flex items-center justify-center overflow-hidden bg-white ring-1 ring-black/6";
  const gradeValueCls =
    "pointer-events-none absolute whitespace-nowrap text-center text-[14px] tabular-nums leading-none";

  const captureSafeCss = `
    .document-overlay-print-root,
    .document-overlay-print-root * {
      font-family: Arial, Helvetica, sans-serif !important;
    }
    .document-overlay-print-root {
      color: ${ink} !important;
      -webkit-text-fill-color: ${ink} !important;
    }
  `;

  return (
    <div
      className="document-overlay-print-root pointer-events-none absolute inset-0 z-[20]"
      style={{ fontFamily: "Arial, Helvetica, sans-serif", color: ink }}
    >
      <style dangerouslySetInnerHTML={{ __html: captureSafeCss }} />
      <div className={photoFrameCls} style={{ top: L.photo.top, right: L.photo.right, width: L.photo.w, height: L.photo.h }}>
        {s?.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={s.photo}
            alt="Student"
            className="h-full w-full object-cover object-top"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="select-none text-[8px] font-semibold uppercase tracking-wider text-slate-400">
            No Photo
          </span>
        )}
      </div>

      <p
        className={bodyCls}
        style={{ ...fieldNudge, ...valFont, top: L.nameLine.top, left: L.nameLine.left, width: L.nameLine.w }}
      >
        {safeText(s?.name)}
      </p>
      <p
        className={bodyCls}
        style={{
          ...fieldNudge,
          ...valFont,
          top: L.parentLine.top,
          left: L.parentLine.left,
          width: L.parentLine.w,
        }}
      >
        {parentLine}
      </p>

      <p
        className={bodyCls}
        style={{
          ...fieldNudge,
          ...valFont,
          top: L.courseLine.top,
          left: L.courseLine.left,
          width: L.courseLine.w,
        }}
      >
        {safeText(data.courseName)}
      </p>
      <p
        className={bodyCls}
        style={{
          ...fieldNudge,
          ...valFont,
          top: L.centerLine.top,
          left: L.centerLine.left,
          width: L.centerLine.w,
        }}
      >
        {centerDisplay}
      </p>

      <p
        className={bodyCls}
        style={{
          ...fieldNudge,
          ...valFont,
          top: L.durationLine.top,
          left: L.durationLine.left,
          width: L.durationLine.w,
        }}
      >
        {durationDisplay}
      </p>
      <p className={gradeValueCls} style={{ ...valFont, ...centerNudge(L.gradeCx, L.gradeTop) }}>
        {safeText(data.grade)}
      </p>

      <p
        className={metaCls}
        style={{ ...fieldNudge, ...valFont, top: L.fromLine.top, left: L.fromLine.left, width: L.fromLine.w }}
      >
        {fromDisplay}
      </p>
      <p
        className={metaCls}
        style={{
          ...fieldNudge,
          ...valFont,
          top: L.enrollmentLine.top,
          left: L.enrollmentLine.left,
          width: L.enrollmentLine.w,
        }}
      >
        {safeText(data.enrollmentNo)}
      </p>
      <p
        className={metaCls}
        style={{
          ...fieldNudge,
          ...valFont,
          top: L.certNoLine.top,
          left: L.certNoLine.left,
          width: L.certNoLine.w,
        }}
      >
        {safeText(data.serialNo)}
      </p>
      <p
        className={metaCls}
        style={{
          ...fieldNudge,
          ...valFont,
          top: L.issueDateLine.top,
          left: L.issueDateLine.left,
          width: L.issueDateLine.w,
        }}
      >
        {formatIssue(data.issueDate)}
      </p>

      {qrSrc ? (
        <div
          className="absolute flex items-center justify-center overflow-hidden"
          style={{ top: L.qr.top, left: L.qr.left, width: L.qr.w, height: L.qr.h }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt="" className="h-full w-full object-contain" />
        </div>
      ) : null}

      <div
        className="absolute flex items-end justify-center pb-[1mm]"
        style={{ top: L.sigAtc.top, right: L.sigAtc.right, width: L.sigAtc.w, height: L.sigAtc.h }}
      >
        {atcSignatureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={atcSignatureUrl}
            alt=""
            className="max-h-[88%] max-w-[95%] object-contain mix-blend-multiply"
          />
        ) : null}
      </div>

      <div
        className="absolute flex items-end justify-center pb-[1mm]"
        style={{ top: L.sigAuth.top, right: L.sigAuth.right, width: L.sigAuth.w, height: L.sigAuth.h }}
      >
        {signatureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={signatureUrl}
            alt=""
            className="max-h-[88%] max-w-[95%] object-contain mix-blend-multiply"
          />
        ) : null}
      </div>
    </div>
  );
}
