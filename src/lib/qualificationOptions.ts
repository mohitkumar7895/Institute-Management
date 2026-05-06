/** Stored in `Student.highestQualification` as comma-separated values; `Other (…)` when details given. */

export const HIGHEST_QUALIFICATION_SELECT_OPTIONS = [
  { value: "Below matric", label: "Below matric" },
  { value: "10th", label: "10th" },
  { value: "12th", label: "12th" },
  { value: "Graduation", label: "Graduation" },
  { value: "Other", label: "Other" },
] as const;

export type QualificationSelectValue =
  (typeof HIGHEST_QUALIFICATION_SELECT_OPTIONS)[number]["value"];

/** Four standard levels (no “Other”) — legacy helpers / admin list. */
export const HIGHEST_QUALIFICATION_LEVELS = HIGHEST_QUALIFICATION_SELECT_OPTIONS.filter(
  (o) => o.value !== "Other",
);

export type HighestQualLevel = (typeof HIGHEST_QUALIFICATION_LEVELS)[number]["value"];

/** Build stored string from multi-select values + optional Other note. */
export function formatHighestQualificationMulti(
  selected: readonly string[],
  otherDetail: string,
): string {
  const picked = new Set(selected.map((s) => s.trim()).filter(Boolean));
  const parts: string[] = [];
  for (const { value } of HIGHEST_QUALIFICATION_SELECT_OPTIONS) {
    if (value === "Other") continue;
    if (picked.has(value)) parts.push(value);
  }
  if (picked.has("Other")) {
    const o = otherDetail.trim();
    parts.push(o ? `Other (${o})` : "Other");
  }
  return parts.join(", ");
}

/** Parse stored / legacy strings into multi-select state. */
export function parseHighestQualificationMulti(
  raw: string,
): { selected: QualificationSelectValue[]; otherDetail: string } {
  const selected: QualificationSelectValue[] = [];
  let otherDetail = "";
  const s = String(raw || "").trim();
  if (!s) return { selected: [], otherDetail: "" };

  const otherParen = s.match(/Other\s*\(([^)]*)\)/i);
  if (otherParen) {
    otherDetail = otherParen[1].trim();
    selected.push("Other");
  }

  const segments = s.split(",").map((p) => p.trim()).filter(Boolean);
  for (const seg of segments) {
    const low = seg.toLowerCase();
    if (low.startsWith("other")) continue;

    if (low.includes("below") && low.includes("matric")) {
      if (!selected.includes("Below matric")) selected.push("Below matric");
      continue;
    }
    if (/^10th$/i.test(seg) || low === "matriculation" || /\bssc\b|\b10\b/.test(low)) {
      if (!selected.includes("10th")) selected.push("10th");
      continue;
    }
    if (/^12th$/i.test(seg) || low === "intermediate" || /\bhsc\b/.test(low)) {
      if (!selected.includes("12th")) selected.push("12th");
      continue;
    }
    if (
      /graduation|graduate|\bb\.?a\b|\bb\.?sc\b|\bb\.?tech\b|\bma\b|\bm\.?sc\b|post graduation|phd/i.test(
        seg,
      )
    ) {
      if (!selected.includes("Graduation")) selected.push("Graduation");
      continue;
    }

    for (const { value } of HIGHEST_QUALIFICATION_SELECT_OPTIONS) {
      if (value === "Other") continue;
      if (low === value.toLowerCase() && !selected.includes(value)) {
        selected.push(value);
      }
    }
  }

  if (/\bOther\b/i.test(s) && !selected.includes("Other")) {
    selected.push("Other");
  }

  return { selected, otherDetail };
}

/** Admin / single-select fallback list (legacy spellings). */
export const ADMIN_QUALIFICATION_DROPDOWN_OPTIONS = [
  ...HIGHEST_QUALIFICATION_SELECT_OPTIONS.map((l) => l.value),
  "Matriculation",
  "Intermediate",
  "Post Graduation",
  "PHD Above",
] as const;

/** @deprecated use parseHighestQualificationMulti */
export function parseHighestQualificationFromStored(
  raw: string,
): { checks: Partial<Record<HighestQualLevel, boolean>>; otherNote: string } {
  const { selected, otherDetail } = parseHighestQualificationMulti(raw);
  const checks: Partial<Record<HighestQualLevel, boolean>> = {};
  for (const v of selected) {
    if (v === "Other") continue;
    if (v === "Below matric" || v === "10th" || v === "12th" || v === "Graduation") {
      checks[v] = true;
    }
  }
  return { checks, otherNote: otherDetail };
}

/** @deprecated use formatHighestQualificationMulti */
export function formatHighestQualificationForSave(
  checks: Partial<Record<HighestQualLevel, boolean>>,
  otherNote: string,
): string {
  const sel: string[] = [];
  for (const l of HIGHEST_QUALIFICATION_LEVELS) {
    if (checks[l.value]) sel.push(l.value);
  }
  return formatHighestQualificationMulti(sel, otherNote);
}

/** Legacy dropdown values → display label (older records). Free text is returned as-is. */
const LEGACY_QUAL_SCHOOL_VALUE_TO_LABEL: Record<string, string> = {
  "N/A": "N/A",
  "As on marksheet": "As on marksheet / certificate",
  "Government school": "Government school",
  "Private school": "Private school",
  "Kendriya / Navodaya / Eklavya": "Kendriya / Navodaya / Eklavya",
  "State board school": "State board school",
  "CBSE school": "CBSE school",
  "ICSE school": "ICSE school",
  "Junior college (+2)": "Junior college (+2)",
  "Undergraduate college": "Undergraduate college",
  University: "University",
  "ITI / Polytechnic": "ITI / Polytechnic",
  "Open / Distance": "Open / Distance learning",
};

/**
 * One line for college/school: supports legacy stored dropdown + `qualSchoolOther`,
 * and plain text in `qualSchool` (current forms).
 */
export function formatQualSchoolDisplay(
  qualSchool?: string,
  qualSchoolOther?: string,
): string {
  const qs = String(qualSchool ?? "").trim();
  const qo = String(qualSchoolOther ?? "").trim();
  if (qs === "__other__") return qo;
  if (!qs) return qo;
  return LEGACY_QUAL_SCHOOL_VALUE_TO_LABEL[qs] ?? qs;
}
