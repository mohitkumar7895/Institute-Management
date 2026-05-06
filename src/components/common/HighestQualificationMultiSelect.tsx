"use client";

import {
  HIGHEST_QUALIFICATION_SELECT_OPTIONS,
  type QualificationSelectValue,
} from "@/lib/qualificationOptions";

type Props = {
  selected: QualificationSelectValue[];
  otherDetail: string;
  onSelectedChange: (next: QualificationSelectValue[]) => void;
  onOtherDetailChange: (next: string) => void;
  labelCls: (fieldName?: string) => string;
  inputCls: (fieldName?: string) => string;
};

export default function HighestQualificationMultiSelect({
  selected,
  otherDetail,
  onSelectedChange,
  onOtherDetailChange,
  labelCls,
  inputCls,
}: Props) {
  const selectedValue = selected[0] ?? "";
  const showOther = selectedValue === "Other";

  return (
    <div className="space-y-3">
      <div>
        <span className={labelCls()}>
          Highest qualification{" "}
          <span className="font-normal normal-case text-slate-400">(optional)</span>
        </span>
        <select
          value={selectedValue}
          onChange={(e) => {
            const value = e.target.value as QualificationSelectValue | "";
            onSelectedChange(value ? [value] : []);
          }}
          className={`${inputCls("highestQualification")} mt-1.5 py-3 text-base font-medium`}
          aria-label="Highest qualification dropdown"
        >
          <option value="">Select qualification</option>
          {HIGHEST_QUALIFICATION_SELECT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {showOther ? (
        <div>
          <label className={labelCls("qualOtherDetail")}>Other — specify</label>
          <input
            type="text"
            autoComplete="off"
            value={otherDetail}
            onChange={(e) => onOtherDetailChange(e.target.value)}
            className={inputCls("qualOtherDetail")}
            placeholder="e.g. diploma, ITI, board name"
          />
        </div>
      ) : null}
    </div>
  );
}
