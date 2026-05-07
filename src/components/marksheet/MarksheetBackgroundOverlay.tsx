"use client";

import { useMemo, useState, useEffect, type CSSProperties } from "react";
import { gradeFromPercentage, splitInternalExternal } from "@/lib/examDocumentSplit";
import {
  DEFAULT_MARKSHEET_GRADE_BANDS,
  MARKSHEET_GRADE_BANDS_KEY,
  parseGradeBandsJson,
  type GradeBand,
} from "@/lib/marksheetGradeScaleCore";

/**
 * Yukti-style portrait A4 marksheet (210×297mm).
 *
 * The admin-uploaded blank template is the only visible chrome — this overlay
 * just drops student values onto the printed dotted lines / table cells.
 *
 * If your replacement blank shifts a row by a millimetre or two, only retune
 * the affected entry inside `L` below.
 */
const L = {
  photo: { top: "9mm", left: "11mm", w: "27mm", h: "31mm" },
  qrBox: { top: "9mm", right: "21mm", w: "21mm", h: "21mm" },

  /** Value starts after printed “Learning Center” label — not on top of it. */
  learningCenter: { top: "53mm", left: "49mm", right: "10mm" },

  enrollment: { top: "65mm", left: "39mm", w: "59mm" },
  regNo: { top: "65mm", left: "120mm", right: "10mm" },

  studentName: { top: "76mm", left: "37mm", w: "88mm" },
  dob: { top: "76mm", left: "136mm", right: "8mm" },

  father: { top: "88mm", left: "38mm", right: "9mm" },
  mother: { top: "99mm", left: "39mm", right: "9mm" },
  course: { top: "108.5mm", left: "37mm", right: "10mm" },

  /**
   * Subject data rows — slightly higher so names sit closer to the printed headers.
   * Totals row uses `tableFooterTop` so it stays on the original template line.
   */
  table: { subjectTop: "142mm", footerTop: "208mm", left: "10mm", width: "188mm" },
  rowH: "7.5mm",

  summaryTop: "218mm",
  gradeCx: "13mm",
  pctCx: "35mm",
  maxCx: "59mm",
  obtCx: "80mm",

  date: { top: "225mm", left: "34mm" },
  /** Signature slot moved further up and slightly left. */
  sigAtc: { top: "223mm", right: "128mm", w: "52mm", h: "18mm" },
  sigAuth: { top: "220mm", right: "34mm", w: "52mm", h: "18mm" },
} as const;

/** Lift so glyphs sit clearly *above* dotted rules (dots were striking through text). */
const fieldNudge: CSSProperties = { transform: "translateY(-1.05mm)" };
const learningCenterNudge: CSSProperties = { transform: "translateY(-1mm)" };
/** DOB: a bit more gap from the “DOB” label; still above the dotted line. */
const dobNudge: CSSProperties = { transform: "translateY(-0.85mm)" };
/** Mother — was floating too high between rows. */
const motherNudge: CSSProperties = { transform: "translateY(-0.55mm)" };
/** Course — pull *down* toward its own dotted line (was riding up near mother). */
const courseNudge: CSSProperties = { transform: "translateY(0.5mm)" };
/** Footer total marks row: slight lift to sit on printed line. */
const footerRowNudge: CSSProperties = { transform: "translateY(-3.5mm)" };

function summaryNudge(cx: string, top: string): CSSProperties {
  return { top, left: cx, transform: "translate(-50%, -1mm)" };
}

export type MarksheetBgStudent = {
  name?: string;
  fatherName?: string;
  motherName?: string;
  photo?: string;
  enrollmentNo?: string;
  registrationNo?: string;
  dob?: string;
};

export type MarksheetBgSubject = {
  subjectName: string;
  marksObtained: number;
  totalMarks: number;
  internalObtained?: number;
  internalMax?: number;
  externalObtained?: number;
  externalMax?: number;
};

export type MarksheetBgOverlayData = {
  enrollmentNo: string;
  rollNo?: string;
  courseName: string;
  subjects?: MarksheetBgSubject[];
  totalObtained: number;
  totalMax: number;
  percentage: number | string;
  grade: string;
  issueDate: string | Date;
  /** May arrive populated (object) or as a raw id string before hydration. */
  studentId?: MarksheetBgStudent | string | null;
};

export type MarksheetPageData = MarksheetBgOverlayData & {
  _id?: string;
  examId?: string;
  atcId?: string;
  result?: "Pass" | "Fail";
  isApproved?: boolean;
};

type Props = {
  data: MarksheetBgOverlayData;
  /** Center / institute name printed on the "Learning Center ___" line. */
  learningCenter?: string;
  /** Optional verify URL — encoded into the QR shown in the top-right box. */
  verifyUrl?: string;
  /** Admin setting signature image. */
  signatureUrl?: string;
  /** ATC application signature image. */
  atcSignatureUrl?: string;
};

/** DD-MM-YYYY for DOB and issue date on marksheet. */
function formatDateDDMMYYYY(input?: string | Date | null): string {
  if (input == null || input === "") return "";
  if (typeof input === "string") {
    const t = input.trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(t)) return t;
    // Wrong DB values sometimes store an ID in dob — hide instead of printing it.
    if (/ATC-|REG-|PENDING-|DIRECT-/i.test(t) && !/^\d{4}-\d{1,2}-\d{1,2}/.test(t)) return "";
  }
  try {
    const dt = typeof input === "string" ? new Date(input) : input;
    if (Number.isNaN(dt.getTime())) return "";
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  } catch {
    return String(input).trim();
  }
}

function pickStudent(s: MarksheetBgOverlayData["studentId"]): MarksheetBgStudent | null {
  return s && typeof s === "object" ? s : null;
}

function safeText(v?: string | number | null): string {
  if (v == null) return "";
  return String(v).trim();
}

/** Long “Name · Address · ATC Reg:” lines must not be shown as enrollment/reg. */
function looksLikeLearningCenterLine(t: string): boolean {
  const u = t.toUpperCase();
  if (u.length < 24) return false;
  return u.includes("ATC REG:") || (u.includes(" · ") && u.includes("ATC"));
}

export default function MarksheetBackgroundOverlay({
  data,
  learningCenter,
  verifyUrl,
  signatureUrl,
  atcSignatureUrl,
}: Props) {
  const [gradeBands, setGradeBands] = useState<GradeBand[]>(() => [...DEFAULT_MARKSHEET_GRADE_BANDS]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/public/settings?key=${MARKSHEET_GRADE_BANDS_KEY}`)
      .then((r) => r.json())
      .then((body: { value?: string | null }) => {
        if (!cancelled) setGradeBands(parseGradeBandsJson(body?.value ?? null));
      })
      .catch(() => {
        if (!cancelled) setGradeBands([...DEFAULT_MARKSHEET_GRADE_BANDS]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const s = pickStudent(data.studentId);
  const regNoOnly = (s?.registrationNo && String(s.registrationNo).trim()) || "";
  const stEnr = (s?.enrollmentNo && String(s.enrollmentNo).trim()) || "";
  const msEnr = (typeof data.enrollmentNo === "string" && data.enrollmentNo.trim()) || "";
  const roll = (data.rollNo && String(data.rollNo).trim()) || "";
  const enrollDisplay = (() => {
    if (stEnr && !looksLikeLearningCenterLine(stEnr)) return stEnr;
    if (msEnr && !looksLikeLearningCenterLine(msEnr)) return msEnr;
    if (stEnr) return stEnr;
    if (msEnr) return msEnr;
    return roll;
  })();
  const regDisplay = regNoOnly || enrollDisplay;
  const displayGrade =
    safeText(data.grade) || gradeFromPercentage(Number(data.percentage) || 0, gradeBands);

  type Cell = { intO: number; intM: number; extO: number; extM: number };
  const { rows, rowMarks, footerMarks } = useMemo(() => {
    const subjects = data.subjects ?? [];
    const r = Array.from({ length: 7 }, (_, i) => subjects[i] ?? null);
    const resolve = (row: MarksheetBgSubject | null): Cell | null => {
      if (!row) return null;
      const name = String(row.subjectName ?? "").trim();
      const intO = Math.max(0, Number(row.internalObtained ?? 0) || 0);
      const intM = Math.max(0, Number(row.internalMax ?? 0) || 0);
      const extO = Math.max(0, Number(row.externalObtained ?? 0) || 0);
      const extM = Math.max(0, Number(row.externalMax ?? 0) || 0);
      const mo = Number(row.marksObtained ?? 0) || 0;
      const tm = Number(row.totalMarks ?? 0) || 0;

      // Only the legacy single total row uses 30/70 split. Real subjects (any name
      // except exact "Course") print stored Internal/External as-is — including
      // lowercase "course" as a subject title, case-insensitive match for aggregate.
      const isLegacyTotalOnlyRow = /^course$/i.test(name);

      if (name && !isLegacyTotalOnlyRow) {
        return { intO, intM, extO, extM };
      }

      const sp = splitInternalExternal(mo, tm > 0 ? tm : Math.max(1, mo));
      return { intO: sp.internalObtained, intM: sp.internalMax, extO: sp.externalObtained, extM: sp.externalMax };
    };
    const marks = r.map(resolve);
    let fi = 0,
      fim = 0,
      feo = 0,
      fem = 0;
    let any = false;
    for (let i = 0; i < r.length; i++) {
      if (r[i] && marks[i]) {
        any = true;
        fi += marks[i]!.intO;
        fim += marks[i]!.intM;
        feo += marks[i]!.extO;
        fem += marks[i]!.extM;
      }
    }
    const footer: Cell = any
      ? { intO: fi, intM: fim, extO: feo, extM: fem }
      : (() => {
          const sp = splitInternalExternal(data.totalObtained, data.totalMax);
          return {
            intO: sp.internalObtained,
            intM: sp.internalMax,
            extO: sp.externalObtained,
            extM: sp.externalMax,
          };
        })();
    return { rows: r, rowMarks: marks, footerMarks: footer };
  }, [data.subjects, data.totalObtained, data.totalMax]);

  const qrSrc = verifyUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}`
    : "";

  const ink = "#000000";
  const valFont: CSSProperties = {
    fontFamily: 'system-ui, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    fontWeight: 800,
    color: ink,
    WebkitTextFillColor: ink,
  };
  const lineCls =
    "absolute max-w-none truncate uppercase leading-none [font-size:10.25px] text-black [font-weight:800]";
  const lcCls =
    "absolute max-w-none whitespace-normal break-words text-left uppercase leading-tight [font-size:9.25px] max-h-[14mm] overflow-hidden text-black [font-weight:800]";
  const nameCls =
    "absolute max-w-none truncate leading-none [font-size:10.25px] [text-transform:none] text-black [font-weight:800]";

  return (
    <div className="pointer-events-none absolute inset-0 z-10" style={{ color: ink }}>
      <div
        className="absolute overflow-hidden bg-white ring-1 ring-black/6"
        style={{ top: L.photo.top, left: L.photo.left, width: L.photo.w, height: L.photo.h }}
      >
        {s?.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={s.photo}
            alt=""
            className="h-full w-full object-cover object-top"
            referrerPolicy="no-referrer"
          />
        ) : null}
      </div>

      <div
        className="absolute flex items-center justify-center overflow-hidden bg-white ring-1 ring-black/6"
        style={{ top: L.qrBox.top, right: L.qrBox.right, width: L.qrBox.w, height: L.qrBox.h }}
      >
        {qrSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrSrc} alt="" className="max-h-[92%] max-w-[92%] object-contain" />
        ) : null}
      </div>

      <p
        className={lcCls}
        style={{
          ...learningCenterNudge,
          ...valFont,
          top: L.learningCenter.top,
          left: L.learningCenter.left,
          right: L.learningCenter.right,
        }}
      >
        {safeText(learningCenter)}
      </p>

      <p
        className={lineCls}
        style={{
          ...fieldNudge,
          ...valFont,
          top: L.enrollment.top,
          left: L.enrollment.left,
          width: L.enrollment.w,
        }}
      >
        {safeText(enrollDisplay)}
      </p>
      <p
        className={lineCls}
        style={{
          ...fieldNudge,
          ...valFont,
          top: L.regNo.top,
          left: L.regNo.left,
          right: L.regNo.right,
        }}
      >
        {safeText(regDisplay)}
      </p>

      <p
        className={nameCls}
        style={{
          ...fieldNudge,
          ...valFont,
          top: L.studentName.top,
          left: L.studentName.left,
          width: L.studentName.w,
        }}
      >
        {safeText(s?.name)}
      </p>
      <p
        className={nameCls}
        style={{
          ...dobNudge,
          ...valFont,
          top: L.dob.top,
          left: L.dob.left,
          right: L.dob.right,
        }}
      >
        {formatDateDDMMYYYY(s?.dob)}
      </p>

      <p
        className={nameCls}
        style={{
          ...fieldNudge,
          ...valFont,
          top: L.father.top,
          left: L.father.left,
          right: L.father.right,
        }}
      >
        {safeText(s?.fatherName)}
      </p>
      <p
        className={nameCls}
        style={{
          ...motherNudge,
          ...valFont,
          top: L.mother.top,
          left: L.mother.left,
          right: L.mother.right,
        }}
      >
        {safeText(s?.motherName)}
      </p>
      <p
        className={`${nameCls} leading-tight!`}
        style={{
          ...courseNudge,
          ...valFont,
          top: L.course.top,
          left: L.course.left,
          right: L.course.right,
        }}
      >
        {safeText(data.courseName)}
      </p>

      <div className="absolute" style={{ top: L.table.subjectTop, left: L.table.left, width: L.table.width }}>
        <table className="w-full table-fixed border-collapse text-[10px] text-black font-extrabold">
          <colgroup>
            <col style={{ width: "88mm" }} />
            <col style={{ width: "25mm" }} />
            <col style={{ width: "25mm" }} />
            <col style={{ width: "25mm" }} />
            <col style={{ width: "25mm" }} />
          </colgroup>
          <tbody>
            {rows.map((row, idx) => {
              const m = rowMarks[idx];
              return (
                <tr key={idx} style={{ height: L.rowH }}>
                  <td
                    className="box-border truncate pl-[4mm] pr-[2mm] align-middle text-left uppercase leading-tight"
                    style={valFont}
                  >
                    {row?.subjectName ?? ""}
                  </td>
                  <td
                    className="box-border px-0 text-center align-middle tabular-nums"
                    style={valFont}
                  >
                    {row && m ? m.intO : ""}
                  </td>
                  <td
                    className="box-border px-0 text-center align-middle tabular-nums"
                    style={valFont}
                  >
                    {row && m ? m.intM : ""}
                  </td>
                  <td
                    className="box-border px-0 text-center align-middle tabular-nums"
                    style={valFont}
                  >
                    {row && m ? m.extO : ""}
                  </td>
                  <td
                    className="box-border px-0 text-center align-middle tabular-nums"
                    style={valFont}
                  >
                    {row && m ? m.extM : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="absolute" style={{ top: L.table.footerTop, left: L.table.left, width: L.table.width }}>
        <table className="w-full table-fixed border-collapse text-[10px] text-black font-extrabold">
          <colgroup>
            <col style={{ width: "88mm" }} />
            <col style={{ width: "25mm" }} />
            <col style={{ width: "25mm" }} />
            <col style={{ width: "25mm" }} />
            <col style={{ width: "25mm" }} />
          </colgroup>
          <tbody>
            <tr style={{ height: L.rowH }}>
              <td className="box-border pl-[4mm] pr-[2mm] align-middle" aria-hidden />
              <td
                className="box-border px-0 text-center align-middle tabular-nums"
                style={{ ...valFont, ...footerRowNudge }}
              >
                {footerMarks.intO}
              </td>
              <td
                className="box-border px-0 text-center align-middle tabular-nums"
                style={{ ...valFont, ...footerRowNudge }}
              >
                {footerMarks.intM}
              </td>
              <td
                className="box-border px-0 text-center align-middle tabular-nums"
                style={{ ...valFont, ...footerRowNudge }}
              >
                {footerMarks.extO}
              </td>
              <td
                className="box-border px-0 text-center align-middle tabular-nums"
                style={{ ...valFont, ...footerRowNudge }}
              >
                {footerMarks.extM}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p
        className="absolute whitespace-nowrap text-center tabular-nums leading-none text-[10.5px] text-black font-extrabold"
        style={{ ...summaryNudge(L.gradeCx, L.summaryTop), ...valFont }}
      >
        {safeText(displayGrade)}
      </p>
      <p
        className="absolute whitespace-nowrap text-center tabular-nums leading-none text-[10.5px] text-black font-extrabold"
        style={{ ...summaryNudge(L.pctCx, L.summaryTop), ...valFont }}
      >
        {data.percentage !== "" && data.percentage != null
          ? `${Math.round(Number(data.percentage) || 0)}%`
          : ""}
      </p>
      <p
        className="absolute whitespace-nowrap text-center tabular-nums leading-none text-[10.5px] text-black font-extrabold"
        style={{ ...summaryNudge(L.maxCx, L.summaryTop), ...valFont }}
      >
        {data.totalMax}
      </p>
      <p
        className="absolute whitespace-nowrap text-center tabular-nums leading-none text-[10.5px] text-black font-extrabold"
        style={{ ...summaryNudge(L.obtCx, L.summaryTop), ...valFont }}
      >
        {data.totalObtained}
      </p>

      <p
        className="absolute tabular-nums leading-none text-[10.25px] text-black font-extrabold"
        style={{ ...fieldNudge, ...valFont, top: L.date.top, left: L.date.left }}
      >
        {formatDateDDMMYYYY(data.issueDate)}
      </p>

      <div
        className="absolute flex items-end justify-center pb-[1mm]"
        style={{
          top: L.sigAtc.top,
          right: L.sigAtc.right,
          width: L.sigAtc.w,
          height: L.sigAtc.h,
        }}
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
        style={{
          top: L.sigAuth.top,
          right: L.sigAuth.right,
          width: L.sigAuth.w,
          height: L.sigAuth.h,
        }}
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
