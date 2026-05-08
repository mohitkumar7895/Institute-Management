"use client";

import { useEffect, useState, useCallback, Fragment, type FormEvent, type ChangeEvent } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useBrand } from "@/context/BrandContext";
import { apiFetch } from "@/utils/api";
import {
  CheckCircle, XCircle, Clock, Users, FileText, PlusCircle,
  LogOut, ShieldCheck, ChevronDown, Eye, RefreshCw, Settings, QrCode, Upload, Menu, Layers, Monitor,
  Trash2, Lock, Edit2, AlertTriangle, ShieldAlert, MapPin, BookOpen, User, Building2, CreditCard, EyeOff, Hash, Save, Printer,
  Layout, Type, Mail, X, GraduationCap
} from "lucide-react";
import AdminAtcForm from "@/components/admin/AdminAtcForm";
import CourseManager from "@/components/admin/CourseManager";
import ExamSetManager from "@/components/admin/ExamSetManager";
import ExamRequestManager from "@/components/admin/ExamRequestManager";
import StudentIdCard from "@/components/common/StudentIdCard";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  DEFAULT_AFFILIATION_YEAR_PLANS,
  SETTINGS_AFFILIATION_YEAR_PLANS_KEY,
  SETTINGS_AFFILIATION_ZONE_FEES_KEY,
  parseAffiliationYearPlansJson,
  parseAffiliationZoneFeesJson,
  type FeeCalculationSnapshot,
  type YearPlan,
  type ZoneFeeRow,
} from "@/utils/affiliationFeeShared";
import {
  DEFAULT_MARKSHEET_GRADE_BANDS,
  MARKSHEET_GRADE_BANDS_KEY,
  normalizeGradeBands,
  parseGradeBandsJson,
  serializeGradeBandsJson,
  type GradeBand,
} from "@/lib/marksheetGradeScaleCore";
import { HIGHEST_QUALIFICATION_SELECT_OPTIONS, formatQualSchoolDisplay } from "@/lib/qualificationOptions";
import dynamic from "next/dynamic";
import StudyMaterialManager from "@/components/admin/StudyMaterialManager";
import WalletRequestManager from "@/components/admin/WalletRequestManager";

const FeeManager = dynamic(() => import("@/components/common/FeeManager"), { 
  loading: () => <div className="p-10 text-center font-bold text-slate-400">Loading Fee Manager...</div>,
  ssr: false 
});

interface Application {
  _id: string; trainingPartnerName: string; trainingPartnerAddress: string;
  email: string; mobile: string; district: string; state: string; pin?: string;
  country?: string;
  totalName?: string;
  chiefName: string; designation: string; status: "pending" | "approved" | "rejected";
  submittedByAdmin: boolean; processFee: string; yearOfEstablishment: string;
  affiliationPlanYear?: number;
  feeCalculation?: FeeCalculationSnapshot | null;
  paymentMode: string; statusOfInstitution: string; educationQualification: string;
  professionalExperience: string; dob: string; createdAt: string;
  paidAmount?: string;
  transactionNo?: string;
  tpCode?: string; photo?: string; paymentScreenshot?: string;
  signature?: string; logo?: string; aadharDoc?: string; marksheetDoc?: string; otherDocs?: string;
  instituteDocument?: string;
  infrastructure?: string;
  postalAddressOffice?: string;
  zones?: string[];
  userStatus?: "active" | "disabled";
}

interface Student {
  _id: string;
  name: string;
  enrollmentNo: string;
  tpCode: string;
  course: string;
  mobile: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: string;
  email?: string;
  currentAddress: string;
  permanentAddress: string;
  aadharNo?: string;
  courseType?: string;
  session: string;
  category: string;
  religion?: string;
  disability: boolean;
  disabilityDetails?: string;
  admissionFees: string;
  admissionDate?: string;
  highestQualification: string;
  qualSchool?: string;
  qualSchoolOther?: string;
  qualYearPassing?: string;
  qualPercentObtained?: string;
  credentialEntries?: string;
  qualificationDetail?: string;
  status: "pending" | "approved" | "rejected" | "active" | "pending_atc" | "pending_admin";
  isDirectAdmission?: boolean;
  createdAt: string;
  photo?: string;
  qualificationDoc?: string;
  marksheet10th?: string;
  marksheet12th?: string;
  graduationDoc?: string;
  highestQualDoc?: string;
  aadharDoc?: string;
  studentSignature?: string;
  otherDocs?: string;
  parentsMobile?: string;
  nationality?: string;
  maritalStatus?: string;
  referredBy?: string;
  examMode?: string;
  userId?: string;
  password?: string;
  userStatus?: "active" | "disabled";
  totalFee?: number;
  paidAmount?: number;
  duesAmount?: number;
}

const ADMIN_QUALIFICATION_DROPDOWN_OPTIONS = HIGHEST_QUALIFICATION_SELECT_OPTIONS.map(
  (o) => o.value,
);

type StudentLooseFields = {
  aadhaarNo?: string;
  parentMobile?: string;
  emergencyMobile?: string;
  referenceBy?: string;
};

type StudentEditValues = Partial<Student> &
  StudentLooseFields & {
    [key: string]: unknown;
  };

type PendingResult = {
  _id: string;
  studentId?: Student;
  atcId?: Partial<Application>;
  totalScore?: number;
  maxScore?: number;
  grade?: string;
  session?: string;
  examMode?: "online" | "offline";
  offlineExamCopy?: string;
  offlineExamResult?: string;
  subjectMarks?: Array<{
    subjectName: string;
    internalObtained: number;
    internalMax: number;
    externalObtained: number;
    externalMax: number;
    marksObtained?: number;
    totalMarks?: number;
  }>;
};

type CenterWalletHistoryItem = {
  _id: string;
  type: "credit" | "debit";
  amount: number;
  reason: string;
  adminRemark?: string;
  createdAt: string;
};


// Helper to parse infrastructure
const parseInfra = (infraStr: string | undefined): Record<string, { rooms: string; seats: string; area: string }> => {
  try {
    return JSON.parse(infraStr || "{}") as Record<string, { rooms: string; seats: string; area: string }>;
  } catch {
    return {};
  }
};

const credentialEntriesToEditorText = (raw?: string): string => {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw) as Array<{
      courseName?: string;
      schoolName?: string;
      courseTitle?: string;
      yearPassing?: string;
      obtained?: string;
    }>;
    if (!Array.isArray(parsed)) return "";
    return parsed
      .map((item) =>
        [
          String(item.courseName ?? "").trim(),
          String(item.schoolName ?? "").trim(),
          String(item.courseTitle ?? "").trim(),
          String(item.yearPassing ?? "").trim(),
          String(item.obtained ?? "").trim(),
        ].join(" | ")
      )
      .filter((line) => line.replace(/\|/g, "").trim().length > 0)
      .join("\n");
  } catch {
    return "";
  }
};

const editorTextToCredentialEntries = (text: string): string => {
  const rows = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((v) => v.trim());
      return {
        courseName: parts[0] || "",
        schoolName: parts[1] || "",
        courseTitle: parts[2] || "",
        yearPassing: parts[3] || "",
        obtained: parts[4] || "",
      };
    })
    .filter((row) => Object.values(row).some((v) => String(v).trim().length > 0));
  return rows.length > 0 ? JSON.stringify(rows) : "";
};

const fallbackCredentialTextFromStudent = (student: Pick<Student, "qualSchool" | "qualSchoolOther" | "qualYearPassing" | "qualPercentObtained" | "highestQualification">): string => {
  const school = formatQualSchoolDisplay(student.qualSchool, student.qualSchoolOther).trim();
  const year = String(student.qualYearPassing || "").trim();
  const obtained = String(student.qualPercentObtained || "").trim();
  const qual = String(student.highestQualification || "").trim();
  if (!school && !year && !obtained && !qual) return "";
  return `${qual} | ${school} |  | ${year} | ${obtained}`;
};

type Tab = "dashboard" | "create" | "courses" | "questionSets" | "centers" | "examRequests" | "materials" | "settings" | "students" | "resultReview" | "registration" | "fees" | "backgrounds" | "walletRequests" | "walletPayment";

const PrintField = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <div>
    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
    <p className="text-[11px] font-black text-slate-900 uppercase">{value || "---"}</p>
  </div>
);

export default function AdminPanelPage() {
  usePageTitle("admin");
  const { brandName: globalBrandName, brandLogo: globalBrandLogo } = useBrand();
  const { loading: authLoading, user: authUser, logout: authLogout, sessionReady } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected" | "disabled">("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["settings"]);

  const toggleMenu = (menu: string) => {
    setExpandedMenus(prev => prev.includes(menu) ? prev.filter(m => m !== menu) : [...prev, menu]);
  }; // New state
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [prefillApplication, setPrefillApplication] = useState<Application | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // QR Settings
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrSaving, setQrSaving] = useState(false);
  const [bgs, setBgs] = useState<Record<"id_front" | "id_back" | "certificate" | "marksheet" | "admit_card", string>>({ id_front: "", id_back: "", certificate: "", marksheet: "", admit_card: "" });
  const [bgSaving, setBgSaving] = useState<string | null>(null);

  // Signature Settings
  const [sigPreview, setSigPreview] = useState<string | null>(null);
  const [sigLoading, setSigLoading] = useState(false);
  const [sigSaving, setSigSaving] = useState(false);

  const [yearPlansAdmin, setYearPlansAdmin] = useState<YearPlan[]>(DEFAULT_AFFILIATION_YEAR_PLANS);
  const [zoneFeesAdmin, setZoneFeesAdmin] = useState<ZoneFeeRow[]>([]);
  const [feeSaving, setFeeSaving] = useState(false);
  const [feeSaveMsg, setFeeSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [zoneFeesSaving, setZoneFeesSaving] = useState(false);
  const [zoneFeesSaveMsg, setZoneFeesSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [students, setStudents] = useState<Student[]>([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentFilter, setStudentFilter] = useState<"all" | "pending" | "approved" | "rejected" | "disabled">("all");
  const [studentActionId, setStudentActionId] = useState<string | null>(null);

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [viewIdCard, setViewIdCard] = useState<Student | null>(null);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [centerWalletModal, setCenterWalletModal] = useState<{ _id: string; tpCode: string; trainingPartnerName: string; walletBalance: number } | null>(null);
  const [centerWalletHistory, setCenterWalletHistory] = useState<CenterWalletHistoryItem[]>([]);
  const [centerWalletLoading, setCenterWalletLoading] = useState(false);
  const [centerWalletAction, setCenterWalletAction] = useState<"credit" | "debit">("credit");
  const [centerWalletAmount, setCenterWalletAmount] = useState("");
  const [centerWalletRemark, setCenterWalletRemark] = useState("");
  const [centerWalletSubmitting, setCenterWalletSubmitting] = useState(false);
  
  // Result Review
  const [pendingResults, setPendingResults] = useState<PendingResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [reviewResult, setReviewResult] = useState<PendingResult | null>(null);
  const [reviewIssueDate, setReviewIssueDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [bulkApproveDialog, setBulkApproveDialog] = useState(false);
  const [bulkIssueDate, setBulkIssueDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );

  // Application Filters
  const [appSearch] = useState("");
  const [appStateFilter] = useState("");
  const [appDistrictFilter] = useState("");

  const [studentEditValues, setStudentEditValues] = useState<StudentEditValues>({});
  const [passData, setPassData] = useState({ old: "", new: "", confirm: "" });
  const [passSaving, setPassSaving] = useState(false);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // ID Format States
  const [centerFormat, setCenterFormat] = useState({ prefix: "ATC-", counter: 1, padding: 4 });
  const [studentFormat, setStudentFormat] = useState({ prefix: "ATC-ST-", counter: 1, padding: 4 });
  /** Stored as `reg_format_student_registration` — prefix + counter only (no padding field in UI). */
  const [studentRegistrationFormat, setStudentRegistrationFormat] = useState({ prefix: "REG-", counter: 1 });
  const [idFormatSaving, setIdFormatSaving] = useState(false);
  const [brandName, setBrandName] = useState("Institution Brand");
  const [brandMobile, setBrandMobile] = useState("");
  const [brandEmail, setBrandEmail] = useState("");
  const [brandAddress, setBrandAddress] = useState("");
  const [brandUrl, setBrandUrl] = useState("");
  const [brandLogo, setBrandLogo] = useState("");
  const [walletPayName, setWalletPayName] = useState("");
  const [walletPayUpi, setWalletPayUpi] = useState("");
  const [walletPayNote, setWalletPayNote] = useState("");
  const [walletPayQr, setWalletPayQr] = useState("");
  const [walletPaySaving, setWalletPaySaving] = useState(false);
  const [brandSaving, setBrandSaving] = useState(false);
  const [marksheetGradeBands, setMarksheetGradeBands] = useState<GradeBand[]>(() => [
    ...DEFAULT_MARKSHEET_GRADE_BANDS,
  ]);
  const [marksheetGradeBandsSaving, setMarksheetGradeBandsSaving] = useState(false);

  const showToast = (type: "success" | "error", text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 5000);
  };

  const openStudentDoc = (url: string) => {
    if (!url) return;
    try {
      const win = window.open("", "_blank");
      if (!win) return;

      let finalUrl = url;
      let mime = "";

      // Data URLs can fail to open directly in some browsers (especially large PDFs).
      // Convert to Blob URL for reliable viewing.
      if (url.startsWith("data:")) {
        const [meta, base64] = url.split(",");
        const mimeMatch = meta.match(/^data:([^;]+);base64$/i) || meta.match(/^data:([^;]+);/i);
        mime = mimeMatch?.[1] || "application/octet-stream";
        const normalizedBase64 = decodeURIComponent((base64 || "").replace(/\s/g, ""));
        const binary = atob(normalizedBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        finalUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
        // Revoke later to avoid leaking object URLs.
        setTimeout(() => URL.revokeObjectURL(finalUrl), 120_000);
      }

      const lower = `${mime} ${finalUrl}`.toLowerCase();
      const isPdf = lower.includes("application/pdf") || finalUrl.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        win.document.open();
        win.document.write(`
          <!doctype html>
          <html>
            <head><title>Document Preview</title><style>html,body,iframe{margin:0;padding:0;width:100%;height:100%;border:0;background:#0f172a;}</style></head>
            <body><iframe src="${finalUrl}" title="Document Preview"></iframe></body>
          </html>
        `);
        win.document.close();
      } else {
        win.location.replace(finalUrl);
      }
    } catch {
      const fallbackWin = window.open("", "_blank");
      if (fallbackWin) fallbackWin.location.replace(url);
    }
  };

  const getStudentDocUrl = (key: string): string => {
    const valFromEdit = studentEditValues[key];
    if (typeof valFromEdit === "string" && valFromEdit.trim()) return valFromEdit;
    const fallback = (editingStudent as unknown as Record<string, unknown> | null)?.[key];
    if (typeof fallback === "string" && fallback.trim()) return fallback;
    return "";
  };

  const getStudentFieldValue = (values: StudentEditValues, key: string) => {
    if (key === "aadharNo") return values.aadharNo || values.aadhaarNo || "";
    if (key === "parentsMobile") return values.parentsMobile || values.parentMobile || values.emergencyMobile || "";
    if (key === "referredBy") return values.referredBy || values.referenceBy || "";
    const value = values[key];
    return value === null || value === undefined ? "" : String(value);
  };

  const openStudentEditor = async (student: Student) => {
    try {
      const mediaRes = await apiFetch(`/api/admin/students/media?studentId=${student._id}`);
      const mediaData = mediaRes.ok ? await mediaRes.json() : { media: {} };
      const mergedStudent = { ...student, ...(mediaData.media || {}) };
      const mergedLoose = mergedStudent as StudentLooseFields;
      const normalizedStudent: Student = {
        ...mergedStudent,
        aadharNo: mergedStudent.aadharNo || mergedLoose.aadhaarNo || "",
        parentsMobile: mergedStudent.parentsMobile || mergedLoose.parentMobile || mergedLoose.emergencyMobile || "",
        referredBy: mergedStudent.referredBy || mergedLoose.referenceBy || "",
        qualYearPassing: String(mergedStudent.qualYearPassing || "").replace(/\D/g, "").slice(0, 4),
      };
      setEditingStudent(normalizedStudent);
      setStudentEditValues({
        ...(normalizedStudent as StudentEditValues),
        credentialEntriesText: credentialEntriesToEditorText(normalizedStudent.credentialEntries) || fallbackCredentialTextFromStudent(normalizedStudent),
      });
    } catch {
      const studentLoose = student as unknown as StudentLooseFields;
      const normalizedStudent: Student = {
        ...student,
        aadharNo: student.aadharNo || studentLoose.aadhaarNo || "",
        parentsMobile: student.parentsMobile || studentLoose.parentMobile || studentLoose.emergencyMobile || "",
        referredBy: student.referredBy || studentLoose.referenceBy || "",
        qualYearPassing: String(student.qualYearPassing || "").replace(/\D/g, "").slice(0, 4),
      };
      setEditingStudent(normalizedStudent);
      setStudentEditValues({
        ...(normalizedStudent as StudentEditValues),
        credentialEntriesText: credentialEntriesToEditorText(normalizedStudent.credentialEntries) || fallbackCredentialTextFromStudent(normalizedStudent),
      });
      showToast("error", "Could not load full document set. Showing available details.");
    }
  };

  const formatApplicationFee = (app: Application) => {
    const fc = app.feeCalculation;
    if (fc && typeof fc.payableAmount === "number") {
      const amt = `₹${fc.payableAmount.toLocaleString("en-IN")}`;
      return `${amt} (${fc.affiliationYear ?? "?"} yr, ${fc.discountPercent ?? 0}% disc.)`;
    }
    const raw = String(app.processFee ?? "").trim();
    if (raw && /^\d+$/.test(raw)) {
      return `₹${Number(raw).toLocaleString("en-IN")}`;
    }
    return raw || "—";
  };

  const openCenterWallet = async (application: Application) => {
    if (!application.tpCode) {
      showToast("error", "TP code not available for this center.");
      return;
    }
    setCenterWalletLoading(true);
    setCenterWalletModal({
      _id: application._id,
      tpCode: application.tpCode,
      trainingPartnerName: application.trainingPartnerName,
      walletBalance: 0,
    });
    try {
      const res = await apiFetch(`/api/admin/centers/wallet?tpCode=${encodeURIComponent(application.tpCode)}`);
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.message || "Failed to load center wallet.");
        return;
      }
      setCenterWalletModal({
        _id: String(data.center?._id || application._id),
        tpCode: String(data.center?.tpCode || application.tpCode),
        trainingPartnerName: String(data.center?.trainingPartnerName || application.trainingPartnerName),
        walletBalance: Number(data.center?.walletBalance || 0),
      });
      setCenterWalletHistory(Array.isArray(data.history) ? data.history : []);
      setCenterWalletAction("credit");
      setCenterWalletAmount("");
      setCenterWalletRemark("");
    } catch {
      showToast("error", "Failed to load center wallet.");
    } finally {
      setCenterWalletLoading(false);
    }
  };

  const submitCenterWalletAction = async () => {
    if (!centerWalletModal) return;
    const amount = Number(centerWalletAmount);
    if (!amount || amount <= 0) {
      showToast("error", "Please enter a valid amount.");
      return;
    }

    setCenterWalletSubmitting(true);
    try {
      const res = await apiFetch("/api/admin/centers/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tpCode: centerWalletModal.tpCode,
          action: centerWalletAction,
          amount,
          remark: centerWalletRemark.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.message || "Wallet update failed.");
        return;
      }
      showToast("success", data.message || "Wallet updated.");
      setCenterWalletAmount("");
      setCenterWalletRemark("");
      await openCenterWallet({
        ...centerWalletModal,
        email: "",
        mobile: "",
        chiefName: "",
        designation: "",
        trainingPartnerAddress: "",
        district: "",
        state: "",
        pin: "",
        processFee: "",
        yearOfEstablishment: "",
        statusOfInstitution: "",
        educationQualification: "",
        professionalExperience: "",
        dob: "",
        status: "approved",
        submittedByAdmin: false,
        paymentMode: "",
        createdAt: "",
      });
    } catch {
      showToast("error", "Wallet update failed.");
    } finally {
      setCenterWalletSubmitting(false);
    }
  };

  const fetchApplications = useCallback(async () => {
    if (!sessionReady || authLoading || !authUser) return;
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/applications");
      if (res.status === 401) {
        await authLogout();
        return;
      }
      const data = (await res.json()) as { applications: Application[] };
      setApplications(data.applications ?? []);
    } catch {
      showToast("error", "Failed to load applications.");
    } finally {
      setLoading(false);
    }

    apiFetch("/api/admin/settings/backgrounds")
      .then((res) => res.json())
      .then((data) => {
        setBgs(data);
      })
      .catch(() => undefined);
  }, [authLogout, sessionReady, authLoading, authUser]);

  const fetchSettings = useCallback(async () => {
    if (!sessionReady || authLoading || !authUser) return;
    setQrLoading(true);
    setSigLoading(true);
    try {
      const qRes = await apiFetch("/api/admin/settings?key=qr_code");
      const qData = (await qRes.json()) as { value: string | null };
      setQrPreview(qData.value ?? null);

      const sRes = await apiFetch("/api/admin/settings?key=auth_signature");
      const sData = (await sRes.json()) as { value: string | null };
      setSigPreview(sData.value ?? null);

      const ypRes = await apiFetch(`/api/admin/settings?key=${SETTINGS_AFFILIATION_YEAR_PLANS_KEY}`);
      const ypData = (await ypRes.json()) as { value: string | null };
      setYearPlansAdmin(parseAffiliationYearPlansJson(ypData.value));

      const zfRes = await apiFetch(`/api/admin/settings?key=${SETTINGS_AFFILIATION_ZONE_FEES_KEY}`);
      const zfData = (await zfRes.json()) as { value: string | null };
      setZoneFeesAdmin(parseAffiliationZoneFeesJson(zfData.value));

      const cfRes = await apiFetch("/api/admin/settings?key=reg_format_center");
      const cfData = await cfRes.json();
      if (cfData.value) setCenterFormat(JSON.parse(cfData.value));

      const sfRes = await apiFetch("/api/admin/settings?key=reg_format_student");
      const sfData = await sfRes.json();
      if (sfData.value) setStudentFormat(JSON.parse(sfData.value));

      const srfRes = await apiFetch("/api/admin/settings?key=reg_format_student_registration");
      const srfData = (await srfRes.json()) as { value: string | null };
      if (srfData.value) {
        try {
          const p = JSON.parse(srfData.value) as { prefix?: string; counter?: number };
          setStudentRegistrationFormat({
            prefix: typeof p.prefix === "string" ? p.prefix : "REG-",
            counter: typeof p.counter === "number" && Number.isFinite(p.counter) ? p.counter : 1,
          });
        } catch {
          /* keep default */
        }
      }

      const bRes = await apiFetch("/api/admin/settings?key=brand_name");
      const bData = (await bRes.json()) as { value: string | null };
      setBrandName(bData.value?.trim() || "Institution Brand");

      const bmRes = await apiFetch("/api/admin/settings?key=brand_mobile");
      const bmData = (await bmRes.json()) as { value: string | null };
      if (bmData.value) setBrandMobile(bmData.value);

      const beRes = await apiFetch("/api/admin/settings?key=brand_email");
      const beData = (await beRes.json()) as { value: string | null };
      if (beData.value) setBrandEmail(beData.value);

      const baRes = await apiFetch("/api/admin/settings?key=brand_address");
      const baData = (await baRes.json()) as { value: string | null };
      if (baData.value) setBrandAddress(baData.value);

      const buRes = await apiFetch("/api/admin/settings?key=brand_url");
      const buData = (await buRes.json()) as { value: string | null };
      if (buData.value) setBrandUrl(buData.value);

      const blRes = await apiFetch("/api/admin/settings?key=brand_logo");
      const blData = (await blRes.json()) as { value: string | null };
      if (blData.value) setBrandLogo(blData.value);

      const wpnRes = await apiFetch("/api/admin/settings?key=wallet_payment_name");
      const wpnData = (await wpnRes.json()) as { value: string | null };
      setWalletPayName(wpnData.value && wpnData.value !== "-" ? wpnData.value : "");

      const wpuRes = await apiFetch("/api/admin/settings?key=wallet_payment_upi");
      const wpuData = (await wpuRes.json()) as { value: string | null };
      setWalletPayUpi(wpuData.value && wpuData.value !== "-" ? wpuData.value : "");

      const wptRes = await apiFetch("/api/admin/settings?key=wallet_payment_note");
      const wptData = (await wptRes.json()) as { value: string | null };
      setWalletPayNote(wptData.value && wptData.value !== "-" ? wptData.value : "");

      const wpqRes = await apiFetch("/api/admin/settings?key=wallet_payment_qr");
      const wpqData = (await wpqRes.json()) as { value: string | null };
      setWalletPayQr(wpqData.value && wpqData.value !== "-" ? wpqData.value : "");

      const mgRes = await apiFetch(`/api/admin/settings?key=${MARKSHEET_GRADE_BANDS_KEY}`);
      const mgData = (await mgRes.json()) as { value: string | null };
      setMarksheetGradeBands(parseGradeBandsJson(mgData.value));
    } catch { /* ignore */ } finally {
      setQrLoading(false);
      setSigLoading(false);
    }
  }, [sessionReady, authLoading, authUser]);

  const fetchStudents = useCallback(async () => {
    if (!sessionReady || authLoading || !authUser) return;
    setStudentLoading(true);
    try {
      const res = await apiFetch("/api/admin/students");
      const data = await res.json();
      setStudents(data.students || []);
    } catch {
      showToast("error", "Failed to load students.");
    } finally {
      setStudentLoading(false);
    }
  }, [sessionReady, authLoading, authUser]);

  const fetchPendingResults = useCallback(async () => {
    if (!sessionReady || authLoading || !authUser) return;
    setResultsLoading(true);
    try {
      const res = await apiFetch("/api/admin/exams/pending-results");
      if (res.ok) {
        const data = await res.json();
        setPendingResults(data);
      }
    } catch { showToast("error", "Failed to fetch pending results"); }
    finally { setResultsLoading(false); }
  }, [sessionReady, authLoading, authUser]);

  useEffect(() => { 
    if (sessionReady && !authLoading && authUser) void fetchApplications(); 
  }, [fetchApplications, sessionReady, authLoading, authUser]);

  useEffect(() => { 
    if (tab === "settings" && sessionReady && !authLoading && authUser) void fetchSettings(); 
  }, [tab, fetchSettings, sessionReady, authLoading, authUser]);

  useEffect(() => { 
    if (tab === "dashboard" && sessionReady && !authLoading && authUser) {
      void fetchApplications();
      void fetchStudents();
    }
  }, [tab, fetchApplications, fetchStudents, sessionReady, authLoading, authUser]);

  useEffect(() => { 
    if (tab === "students" && sessionReady && !authLoading && authUser) void fetchStudents(); 
  }, [tab, fetchStudents, sessionReady, authLoading, authUser]);

  useEffect(() => { 
    if (tab === "resultReview" && sessionReady && !authLoading && authUser) void fetchPendingResults(); 
  }, [tab, fetchPendingResults, sessionReady, authLoading, authUser]);



  const handleStudentAction = async (id: string, action: "approved" | "rejected" | "toggleStatus") => {
    setStudentActionId(id + action);
    try {

      const res = await apiFetch(`/api/admin/students/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.message); return; }
      showToast("success", data.message || "Action completed");
      await fetchStudents();
    } catch {
      showToast("error", "Action failed.");
    } finally {
      setStudentActionId(null);
    }
  };

  const handleBrandSave = async () => {
    if (!authUser || !brandName.trim()) return showToast("error", "Brand name cannot be empty.");
    setBrandSaving(true);
    try {
      const h = { 
        "Content-Type": "application/json",
      };
      
      // Save Name
      await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: h,
        body: JSON.stringify({ key: "brand_name", value: brandName.trim() }),
      });
      // Save Mobile
      await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: h,
        body: JSON.stringify({ key: "brand_mobile", value: brandMobile.trim() }),
      });
      // Save URL
      await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: h,
        body: JSON.stringify({ key: "brand_url", value: brandUrl.trim() }),
      });
      // Save Email
      await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: h,
        body: JSON.stringify({ key: "brand_email", value: brandEmail.trim() }),
      });
      // Save Address
      await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: h,
        body: JSON.stringify({ key: "brand_address", value: brandAddress.trim() }),
      });
      
      showToast("success", "Global Brand settings updated!");
    } catch {
      showToast("error", "Failed to save brand settings.");
    } finally {
      setBrandSaving(false);
    }
  };

  const saveMarksheetGradeBands = async () => {
    if (!authUser) return;
    setMarksheetGradeBandsSaving(true);
    try {
      const normalized = normalizeGradeBands(marksheetGradeBands);
      const res = await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: MARKSHEET_GRADE_BANDS_KEY,
          value: serializeGradeBandsJson(normalized),
        }),
      });
      if (res.ok) {
        setMarksheetGradeBands(normalized);
        showToast("success", "Marksheet grade scale saved.");
      } else showToast("error", "Could not save grade scale.");
    } catch {
      showToast("error", "Could not save grade scale.");
    } finally {
      setMarksheetGradeBandsSaving(false);
    }
  };

  const handleBrandLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setBrandLogo(base64);
      try {
        await apiFetch("/api/admin/settings", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ key: "brand_logo", value: base64 }),
        });
        showToast("success", "Brand Logo updated globally!");
      } catch {
        showToast("error", "Failed to save logo.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleWalletQrUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setWalletPayQr(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleWalletPaymentSave = async () => {
    setWalletPaySaving(true);
    try {
      const h = { "Content-Type": "application/json" };
      await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: h,
        body: JSON.stringify({ key: "wallet_payment_name", value: walletPayName.trim() || "-" }),
      });
      await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: h,
        body: JSON.stringify({ key: "wallet_payment_upi", value: walletPayUpi.trim() || "-" }),
      });
      await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: h,
        body: JSON.stringify({ key: "wallet_payment_note", value: walletPayNote.trim() || "-" }),
      });
      await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: h,
        body: JSON.stringify({ key: "wallet_payment_qr", value: walletPayQr || "-" }),
      });
      showToast("success", "Wallet payment details saved.");
    } catch {
      showToast("error", "Failed to save wallet payment details.");
    } finally {
      setWalletPaySaving(false);
    }
  };

  const handleBulkAction = async (type: "students" | "centers", action: string) => {
    const ids = type === "students" ? selectedStudents : selectedApps;
    if (ids.length === 0 || !authUser) return;
    if (!confirm(`Are you sure you want to ${action} ${ids.length} items?`)) return;

    try {
      const res = await apiFetch(`/api/admin/${type === "students" ? "students" : "applications"}/bulk`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast("success", data.message);
      setSelectedStudents([]);
      setSelectedApps([]);
      if (type === "students") await fetchStudents(); else await fetchApplications();
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Bulk action failed.");
    }
  };

  const handleAction = async (id: string, action: "approve" | "reject" | "toggleStatus") => {
    if (!sessionReady || authLoading || !authUser) return;
    setActionLoading(id + action);
    try {
      const res = await apiFetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { message: string; tpCode?: string; defaultPassword?: string };
      if (!res.ok) { showToast("error", data.message); return; }
      if (action === "approve" && data.tpCode) {
        showToast("success", `✅ Approved! TP Code: ${data.tpCode} | Default PW: ${data.defaultPassword}`);
      } else {
        showToast(action === "reject" ? "error" : "success", data.message);
      }
      await fetchApplications();
    } catch {
      showToast("error", "Action failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const openApplicationForCreateEdit = async (application: Application) => {
    if (!sessionReady || authLoading || !authUser) return;
    setToastMsg(null);
    setActionLoading(application._id + "fetching");
    try {
      const res = await apiFetch(`/api/admin/applications/${application._id}`, {
      });
      if (!res.ok) throw new Error("Failed to fetch full application details.");
      const data = await res.json();
      setPrefillApplication(data.application);
      setTab("create");
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Failed to fetch full application details.");
    } finally {
      setActionLoading(null);
    }
  };

  const closeApplicationEditor = () => {
    setEditingApplication(null);
  };

  const printApplication = (application: Application) => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const esc = (value: unknown) =>
      String(value ?? "—")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const renderDocBlock = (title: string, src?: string) => {
      if (!src) return "";
      const isPdf = src.startsWith("data:application/pdf");
      if (isPdf) {
        return `
          <div style="border:1px solid #ddd;border-radius:10px;padding:12px;margin-bottom:12px;">
            <h3 style="margin:0 0 10px 0;font-size:13px;">${esc(title)} (PDF)</h3>
            <embed src="${src}" type="application/pdf" style="width:100%;height:480px;border:1px solid #e5e7eb;border-radius:8px;" />
          </div>
        `;
      }
      return `
        <div style="border:1px solid #ddd;border-radius:10px;padding:12px;margin-bottom:12px;">
          <h3 style="margin:0 0 10px 0;font-size:13px;">${esc(title)}</h3>
          <img src="${src}" style="max-width:100%; max-height:420px; object-fit:contain; border:1px solid #e5e7eb; border-radius:8px;" />
        </div>
      `;
    };

    const formattedZones = (application.zones ?? []).join(", ");
    const infra = parseInfra(application.infrastructure || "{}");

    const rows = Object.entries(infra).map(([key, val]) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;">${esc(key)}</td>
        <td style="padding:8px;border:1px solid #ddd;">${esc(val.rooms)}</td>
        <td style="padding:8px;border:1px solid #ddd;">${esc(val.seats)}</td>
        <td style="padding:8px;border:1px solid #ddd;">${esc(val.area)}</td>
      </tr>`).join("");

    printWindow.document.write(`
      <html><head><title>Print Application</title>
      <style>body{font-family:Arial,sans-serif;margin:20px;color:#111}h1{font-size:22px;margin-bottom:10px}h2{font-size:16px;margin:20px 0 8px}table{border-collapse:collapse;width:100%;margin-top:10px}th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f8fafc;font-weight:700}</style>
      </head><body>
      <h1>Application Form - ${esc(application.trainingPartnerName)}</h1>
      <p><strong>TP Code:</strong> ${esc(application.tpCode || "N/A")}</p>
      <p><strong>Status:</strong> ${esc(application.status)}</p>
      <h2>Basic Information</h2>
      <table><tbody>
        <tr><th>Training Partner Name</th><td>${esc(application.trainingPartnerName)}</td></tr>
        <tr><th>Training Partner Address</th><td>${esc(application.trainingPartnerAddress)}</td></tr>
        <tr><th>Postal Address</th><td>${esc(application.postalAddressOffice || "—")}</td></tr>
        <tr><th>Zones</th><td>${esc(formattedZones || "—")}</td></tr>
        <tr><th>District</th><td>${esc(application.district)}</td></tr>
        <tr><th>State</th><td>${esc(application.state)}</td></tr>
        <tr><th>PIN</th><td>${esc(application.pin ?? "—")}</td></tr>
        <tr><th>Country</th><td>${esc(application.country ?? "INDIA")}</td></tr>
        <tr><th>Tehsil / Taluka</th><td>${esc(application.totalName ?? "—")}</td></tr>
        <tr><th>Mobile</th><td>${esc(application.mobile)}</td></tr>
        <tr><th>Email</th><td>${esc(application.email)}</td></tr>
      </tbody></table>
      <h2>Institution Details</h2>
      <table><tbody>
        <tr><th>Type</th><td>${esc(application.statusOfInstitution)}</td></tr>
        <tr><th>Establishment Year</th><td>${esc(application.yearOfEstablishment)}</td></tr>
        <tr><th>Chief Name</th><td>${esc(application.chiefName)}</td></tr>
        <tr><th>Designation</th><td>${esc(application.designation)}</td></tr>
        <tr><th>Education</th><td>${esc(application.educationQualification)}</td></tr>
        <tr><th>Experience</th><td>${esc(application.professionalExperience)}</td></tr>
        <tr><th>Date of Birth</th><td>${esc(application.dob)}</td></tr>
        <tr><th>Affiliation fee</th><td>${esc(formatApplicationFee(application))}</td></tr>
      </tbody></table>

      <h2>Payment Details</h2>
      <table><tbody>
        <tr><th>Payment Mode</th><td>${esc(application.paymentMode === "gpay" ? "Google Pay" : "Online")}</td></tr>
        <tr><th>Paid Amount</th><td>${esc(application.paidAmount || "—")}</td></tr>
        <tr><th>Transaction / UTR No.</th><td>${esc(application.transactionNo || "—")}</td></tr>
      </tbody></table>

      <h2>Infrastructure</h2>
      <table><thead><tr><th>Particulars</th><th>Rooms</th><th>Seats</th><th>Area</th></tr></thead><tbody>${rows}</tbody></table>
      
      <h2>Uploaded Documents</h2>
      ${renderDocBlock("Payment Slip / Screenshot", application.paymentScreenshot)}
      ${renderDocBlock("Institute Document", application.instituteDocument)}
      ${renderDocBlock("Aadhar Card", application.aadharDoc)}
      ${renderDocBlock("Marksheet", application.marksheetDoc)}
      ${renderDocBlock("Other Documents", application.otherDocs)}
      ${renderDocBlock("Director Photo", application.photo)}
      ${renderDocBlock("Institute Logo", application.logo)}
      ${renderDocBlock("Signature", application.signature)}

      <script>window.onload=()=>{ window.print(); window.onafterprint=()=>window.close(); }</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const handleQrUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setQrPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleQrSave = async () => {
    if (!qrPreview || !authUser) return;
    setQrSaving(true);
    try {
      const res = await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: "qr_code", value: qrPreview }),
      });
      const data = (await res.json()) as { message: string };
      if (!res.ok) { showToast("error", data.message); return; }
      showToast("success", "QR Code saved successfully! It will appear on all payment receipts.");
    } catch {
      showToast("error", "Failed to save QR code.");
    } finally {
      setQrSaving(false);
    }
  };

  const handleQrRemove = async () => {
    if (!sessionReady || authLoading || !authUser) return;
    setQrPreview(null);
    await apiFetch("/api/admin/settings", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key: "qr_code", value: "" }),
    });
    showToast("success", "QR code removed.");
  };

  const handleSigUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setSigPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSigSave = async () => {
    if (!sigPreview || !authUser) return;
    setSigSaving(true);
    try {
      const res = await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: "auth_signature", value: sigPreview }),
      });
      const data = (await res.json()) as { message: string };
      if (!res.ok) { showToast("error", data.message); return; }
      showToast("success", "Signature saved successfully! It will appear on issued certificates / documents.");
    } catch {
      showToast("error", "Failed to save signature.");
    } finally {
      setSigSaving(false);
    }
  };

  const handleSigRemove = async () => {
    if (!sessionReady || authLoading || !authUser) return;
    setSigPreview(null);
    await apiFetch("/api/admin/settings", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key: "auth_signature", value: "" }),
    });
    showToast("success", "Signature removed.");
  };

  const handleBgUpload = async (e: ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;
    setBgSaving(key);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await apiFetch("/api/admin/settings/backgrounds", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ key, value: base64 })
        });
        const data = await res.json();
        if (res.ok) {
          setBgs(prev => ({ ...prev, [key]: base64 }));
          showToast("success", `${key.replace('_', ' ').toUpperCase()} background updated.`);
        } else {
          showToast("error", data.message || "Upload failed");
        }
      } catch { showToast("error", "Failed to save background"); }
      finally { setBgSaving(null); }
    };
    reader.readAsDataURL(file);
  };

  const handleBgRemove = async (key: string) => {
    if (!confirm("Are you sure?") || !authUser) return;
    setBgSaving(key);
    try {
      const res = await apiFetch("/api/admin/settings/backgrounds?key=" + key, { 
        method: "DELETE",
      });
      if (res.ok) {
        setBgs(prev => ({ ...prev, [key]: "" }));
        showToast("success", "Background removed.");
      }
    } catch { showToast("error", "Failed to remove background"); }
    finally { setBgSaving(null); }
  };

  const updateYearPlanAdmin = (index: number, field: keyof YearPlan, value: number) => {
    setYearPlansAdmin((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
    );
  };

  const addYearPlanAdmin = () => {
    setYearPlansAdmin((prev) => {
      const nextYear = Math.max(0, ...prev.map((p) => p.year)) + 1;
      return [...prev, { year: nextYear, discountPercent: 0 }];
    });
  };

  const removeYearPlanAdmin = (index: number) => {
    setYearPlansAdmin((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleYearPlansSave = async () => {
    const validPlans = yearPlansAdmin
      .map((p) => ({
        year: Math.max(1, Math.floor(Number(p.year))),
        discountPercent: Math.max(0, Math.min(100, Math.round(Number(p.discountPercent)))),
      }))
      .sort((a, b) => a.year - b.year);

    if (validPlans.length === 0 || !authUser) {
      setFeeSaveMsg({ type: "error", text: "Add at least one valid year plan." });
      return;
    }

    setFeeSaving(true);
    setFeeSaveMsg(null);
    try {
      const res = await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: SETTINGS_AFFILIATION_YEAR_PLANS_KEY,
          value: JSON.stringify(validPlans),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeeSaveMsg({ type: "error", text: data.message || "Failed to save year plans." });
        return;
      }

      setYearPlansAdmin(validPlans);
      setFeeSaveMsg({ type: "success", text: "Year & discount plans saved successfully." });
      showToast("success", "Year & discount plans saved successfully.");
    } catch {
      setFeeSaveMsg({ type: "error", text: "Unable to save year plans." });
    } finally {
      setFeeSaving(false);
    }
  };

  const updateZoneFeeAdmin = (index: number, field: "name" | "amount", raw: string) => {
    setZoneFeesAdmin((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        if (field === "name") return { ...item, name: raw };
        const n = parseInt(raw.replace(/\D/g, ""), 10);
        return { ...item, amount: Number.isFinite(n) ? Math.max(0, n) : 0 };
      }),
    );
  };

  const addZoneFeeAdmin = () => {
    setZoneFeesAdmin((prev) => [...prev, { name: "", amount: 0 }]);
  };

  const removeZoneFeeAdmin = (index: number) => {
    setZoneFeesAdmin((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleZoneFeesSave = async () => {
    const validRows = zoneFeesAdmin
      .map((r) => ({ name: r.name.trim(), amount: Math.max(0, Math.round(Number(r.amount))) }))
      .filter((r) => r.name.length > 0);

    if (validRows.length === 0 || !authUser) {
      setZoneFeesSaveMsg({ type: "error", text: "Add at least one zone with a name and fee." });
      return;
    }

    const seen = new Set<string>();
    for (const r of validRows) {
      const key = r.name.toLowerCase();
      if (seen.has(key)) {
        setZoneFeesSaveMsg({ type: "error", text: "Duplicate zone names are not allowed." });
        return;
      }
      seen.add(key);
    }

    setZoneFeesSaving(true);
    setZoneFeesSaveMsg(null);
    try {
      const res = await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: SETTINGS_AFFILIATION_ZONE_FEES_KEY,
          value: JSON.stringify(validRows),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setZoneFeesSaveMsg({ type: "error", text: data.message || "Failed to save zones." });
        return;
      }

      setZoneFeesAdmin(validRows);
      setZoneFeesSaveMsg({ type: "success", text: "Zone fees saved successfully." });
      showToast("success", "Zone fees saved successfully.");
    } catch {
      setZoneFeesSaveMsg({ type: "error", text: "Unable to save zone fees." });
    } finally {
      setZoneFeesSaving(false);
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    if (!passData.old || !passData.new || !authUser) { showToast("error", "All password fields are required."); return; }
    if (passData.new !== passData.confirm) { showToast("error", "New passwords do not match."); return; }
    if (passData.new.length < 6) { showToast("error", "Password must be at least 6 characters."); return; }
    
    setPassSaving(true);
    try {
      const res = await apiFetch("/api/admin/settings/password", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ oldPassword: passData.old, newPassword: passData.new }),
      });
      const data = await res.json();
      if (!res.ok) { showToast("error", data.message || "Failed to change password."); return; }
      showToast("success", "Password changed successfully!");
      setPassData({ old: "", new: "", confirm: "" });
    } catch { showToast("error", "Error changing password."); }
    finally { setPassSaving(false); }
  };

  const handleResultApproval = async (
    examId: string,
    status: "published" | "appeared",
    issueDate?: string,
  ) => {
    if (!sessionReady || authLoading || !authUser) return;
    try {
      const res = await apiFetch("/api/admin/exams/approve-result", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examId,
          status,
          marksheet: true,
          certificate: true,
          ...(issueDate ? { issueDate } : {}),
        })
      });
      if (res.ok) {
        alert("Result Submitted Successfully");
        void fetchPendingResults();
      }
    } catch { showToast("error", "Action failed"); }
  };

  const openReviewModal = (result: PendingResult) => {
    setReviewResult(result);
    setReviewIssueDate(new Date().toISOString().slice(0, 10));
  };

  const submitReviewApproval = async () => {
    if (!reviewResult) return;
    setReviewSubmitting(true);
    try {
      await handleResultApproval(reviewResult._id, "published", reviewIssueDate);
      setReviewResult(null);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await authLogout();
  };

  const filtered = applications.filter((app) => {
    // Status Filter
    if (filterStatus !== "all") {
      if (filterStatus === "disabled" && !(app.status === "approved" && app.userStatus === "disabled")) return false;
      if (filterStatus === "approved" && !(app.status === "approved" && app.userStatus === "active")) return false;
      if (filterStatus !== "disabled" && filterStatus !== "approved" && app.status !== filterStatus) return false;
    }
    
    // Search Filter
    if (appSearch) {
      const s = appSearch.toLowerCase();
      const match = app.trainingPartnerName.toLowerCase().includes(s) || 
                  app.email.toLowerCase().includes(s) || 
                  app.mobile.includes(s) ||
                  (app.tpCode && app.tpCode.toLowerCase().includes(s));
      if (!match) return false;
    }

    // Location Filter
    if (appStateFilter && app.state !== appStateFilter) return false;
    if (appDistrictFilter && app.district !== appDistrictFilter) return false;

    return true;
  });

  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved" && a.userStatus === "active").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    disabled: applications.filter((a) => a.status === "approved" && a.userStatus === "disabled").length,
  };

  const filteredStudents = students.filter((s) => {
    if (studentFilter === "all") return true;
    if (studentFilter === "disabled") return s.userStatus === "disabled";
    if (studentFilter === "approved") return s.status === "approved" || s.status === "active";
    if (studentFilter === "pending") return s.status === "pending" || s.status === "pending_admin";
    return s.status === studentFilter;
  });
  const studentCourseOptions = Array.from(
    new Set(
      [
        ...students.map((s) => String(s.course || "").trim()),
        String(studentEditValues.course || "").trim(),
      ].filter((v) => v.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));
  const studentCounts = {
    all: students.length,
    pending: students.filter((s) => s.status === "pending" || s.status === "pending_admin").length,
    approved: students.filter((s) => s.status === "approved" || s.status === "active").length,
    rejected: students.filter((s) => s.status === "rejected").length,
    disabled: students.filter((s) => s.userStatus === "disabled").length,
  };

  const tabLabel: Record<Tab, string> = {
    dashboard: "Admin Dashboard",
    create: "Create ATC Application",
    courses: "Course Management",
    questionSets: "Exam Sets",
    centers: "Manage Centers",
    examRequests: "Exam Requests",
    materials: "Study Materials",
    settings: "Panel Settings",
    registration: "Registration Settings",
    students: "Manage Students",
    resultReview: "Result Review",
    fees: "Fee Management",
    walletRequests: "Wallet Requests",
    walletPayment: "Wallet Payment Settings",
    backgrounds: "Background Templates",
  };

  const tabDesc: Record<Tab, string> = {
    dashboard: "Comprehensive overview of ATC applications and system metrics",
    create: "Manually create an ATC application as admin",
    courses: "Define and manage courses by zones",
    questionSets: "Build question sets and populate the exam bank",
    centers: "View and manage status of approved ATC centers",
    examRequests: "Manage online/offline exam requests and results",
    materials: "Upload and manage course study resources",
    settings: "General Configurations",
    registration: "ID Generation Logic",
    students: "Review and approve student registrations from all centers",
    resultReview: "Authorize ATC submitted results and release marksheet/certificate after review",
    fees: "Collect or return fees, view transaction history, and generate receipts for students",
    walletRequests: "Approve or reject ATC wallet add-money requests",
    walletPayment: "Configure receiver details and QR shown to ATCs for wallet payments",
    backgrounds: "Upload backgrounds for ID Cards, Certificates, and Marksheets",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <title>Admin Panel | {globalBrandName || brandName}</title>
      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 sm:max-w-md px-5 py-4 rounded-2xl shadow-2xl text-sm font-semibold transition-all ${toastMsg.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toastMsg.text}
        </div>
      )}

      <div className="flex min-h-screen relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 w-72 bg-linear-to-b from-[#0a0a2e] to-[#0a0aa1] text-white flex flex-col shadow-2xl z-50 transition-transform duration-300 transform lg:translate-x-0 lg:static lg:block ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="px-4 py-1 border-b border-white/10 flex items-start justify-between">
            <div className="flex-1 flex flex-col items-center text-center gap-0">
              <div className="h-24 w-24 shrink-0 overflow-hidden flex items-center justify-center">
                {globalBrandLogo || brandLogo ? (
                  <Image src={globalBrandLogo || brandLogo} alt={globalBrandName || brandName} width={96} height={96} unoptimized className="h-full w-full object-contain scale-[1.75]" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="-mt-2 overflow-hidden w-full">
                <p className="font-bold text-sm leading-none">{globalBrandName || brandName}</p>
                <p className="text-blue-300 text-[10px] font-black uppercase tracking-widest mt-0">Admin Panel</p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition">
              <XCircle className="w-5 h-5 text-blue-200" />
            </button>
          </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
              {[
                { id: "dashboard" as Tab, icon: Monitor, label: "Dashboard", badge: counts.pending },
                { id: "centers" as Tab, icon: ShieldCheck, label: "Manage Centers" },
                { id: "students" as Tab, icon: Users, label: "Manage Students" },
                { id: "examRequests" as Tab, icon: Layers, label: "Exam Requests" },
                { id: "questionSets" as Tab, icon: BookOpen, label: "Exam Sets" },
                { id: "materials" as Tab, icon: FileText, label: "Study Materials" },
                { id: "fees" as Tab, icon: CreditCard, label: "Fee Management" },
                { id: "walletRequests" as Tab, icon: CreditCard, label: "Wallet Requests" },
                { id: "courses" as Tab, icon: BookOpen, label: "Courses" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setTab(item.id); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === item.id ? "bg-white/20 text-white" : "text-blue-200 hover:bg-white/10 hover:text-white"}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  {item.badge ? (
                    <span className="ml-auto bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">{item.badge}</span>
                  ) : null}
                </button>
              ))}

              {/* Collapsable Settings Menu */}
              <div className="space-y-1">
                <button
                  onClick={() => toggleMenu("settings")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "settings" || tab === "registration" || tab === "walletPayment" ? "text-white" : "text-blue-200 hover:bg-white/10 hover:text-white"}`}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                  <ChevronDown className={`ml-auto w-3.5 h-3.5 transition-transform ${expandedMenus.includes("settings") ? "rotate-180" : ""}`} />
                </button>
                
                {expandedMenus.includes("settings") && (
                  <div className="pl-6 space-y-1 animate-in slide-in-from-top duration-200">
                     <button
                       onClick={() => { setTab("settings"); setIsSidebarOpen(false); }}
                       className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition ${tab === "settings" ? "bg-white/10 text-white" : "text-blue-200 hover:text-white"}`}
                     >
                       <Monitor className="w-3.5 h-3.5" />
                       General
                     </button>
                     <button
                       onClick={() => { setTab("registration"); setIsSidebarOpen(false); }}
                       className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition ${tab === "registration" ? "bg-white/10 text-white" : "text-blue-200 hover:text-white"}`}
                     >
                       <Hash className="w-3.5 h-3.5" />
                       Registration
                     </button>
                     <button
                       onClick={() => { setTab("walletPayment"); setIsSidebarOpen(false); }}
                       className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition ${tab === "walletPayment" ? "bg-white/10 text-white" : "text-blue-200 hover:text-white"}`}
                     >
                       <CreditCard className="w-3.5 h-3.5" />
                       Wallet Payment
                     </button>
                     <button
                       onClick={() => { setTab("backgrounds"); setIsSidebarOpen(false); }}
                       className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition ${tab === "backgrounds" ? "bg-white/10 text-white" : "text-blue-200 hover:text-white"}`}
                     >
                       <Layers className="w-3.5 h-3.5" />
                       Add Background
                     </button>
                  </div>
                )}
              </div>
            </nav>

          <div className="px-3 py-4 border-t border-white/10">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-300 hover:bg-red-500/20 hover:text-red-200 transition">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
            <div className="flex items-center gap-3 lg:hidden">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition">
                <Menu className="w-6 h-6 text-slate-700" />
              </button>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-blue-700" />
                <span className="font-bold text-slate-800 text-sm">Admin</span>
              </div>
            </div>
            <div className="hidden lg:block">
              <h2 className="text-xl font-bold text-slate-800">{tabLabel[tab]}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{tabDesc[tab]}</p>
            </div>
            {/* Mobile context - show current tab title */}
            <div className="lg:hidden flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
               <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{tabLabel[tab]}</span>
            </div>
            <button onClick={handleLogout} className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </header>

          <div className="flex-1 p-6">
            {/* ── DASHBOARD TAB ── */}
            {tab === "dashboard" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* Center Stats */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1.5 h-6 bg-[#0a0aa1] rounded-full" />
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">ATC Center Metrics</h3>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { label: "Total Centers", count: counts.all, icon: Building2, color: "blue" },
                      { label: "Pending ATC", count: counts.pending, icon: Clock, color: "amber" },
                      { label: "Approved ATC", count: counts.approved, icon: ShieldCheck, color: "green" },
                      { label: "Rejected ATC", count: counts.rejected, icon: XCircle, color: "red" },
                      { label: "Disabled ATC", count: counts.disabled, icon: ShieldAlert, color: "slate" },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white rounded-4xl p-5 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all group">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color === 'red' ? 'bg-red-900/10' : `bg-${stat.color}-50`} group-hover:scale-110 transition-transform`}>
                          <stat.icon className={`w-6 h-6 ${stat.color === 'red' ? 'text-red-900' : `text-${stat.color}-600`}`} />
                        </div>
                        <div>
                          <p className={`text-2xl font-black tracking-tighter ${stat.color === 'red' ? 'text-red-900' : 'text-slate-800'}`}>{stat.count}</p>
                          <p className={`text-[10px] font-black uppercase tracking-wider ${stat.color === 'red' ? 'text-red-900/60' : 'text-slate-400'}`}>{stat.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Student Stats */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Student Registration Metrics</h3>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { label: "Total Students", count: studentCounts.all, icon: Users, color: "blue" },
                      { label: "Pending Review", count: studentCounts.pending, icon: Clock, color: "amber" },
                      { label: "Approved Students", count: studentCounts.approved, icon: CheckCircle, color: "green" },
                      { label: "Rejected Students", count: studentCounts.rejected, icon: XCircle, color: "red" },
                      { label: "Disabled Students", count: studentCounts.disabled, icon: ShieldAlert, color: "slate" },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white rounded-4xl p-5 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all group">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color === 'red' ? 'bg-red-900/10' : `bg-${stat.color}-50`} group-hover:scale-110 transition-transform`}>
                          <stat.icon className={`w-6 h-6 ${stat.color === 'red' ? 'text-red-900' : `text-${stat.color}-600`}`} />
                        </div>
                        <div>
                          <p className={`text-2xl font-black tracking-tighter ${stat.color === 'red' ? 'text-red-900' : 'text-slate-800'}`}>{stat.count}</p>
                          <p className={`text-[10px] font-black uppercase tracking-wider ${stat.color === 'red' ? 'text-red-900/60' : 'text-slate-400'}`}>{stat.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === "fees" && <FeeManager role="admin" />}

            {tab === "walletRequests" && <WalletRequestManager />}

            {/* ── CREATE TAB ── */}
            {tab === "create" && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Application Form For Authorized Training Center</h3>
                <AdminAtcForm
                  mode={prefillApplication ? "edit" : "create"}
                  applicationId={prefillApplication?._id}
                  initialData={prefillApplication ?? undefined}
                  onCancel={() => {
                    if (prefillApplication) {
                      setPrefillApplication(null);
                      return;
                    }
                    setTab("centers");
                  }}
                  onSuccess={() => {
                    setPrefillApplication(null);
                    setTab("centers");
                    void fetchApplications();
                  }}
                />
              </div>
            )}

            {/* ── COURSES TAB ── */}
            {tab === "courses" && <CourseManager />}

            {/* ── EXAM SETS TAB ── */}
            {tab === "questionSets" && <ExamSetManager role="admin" />}

            {/* ── MANAGE CENTERS TAB ── */}
            {tab === "centers" && (
              <div className="space-y-4 animate-in fade-in duration-300">


                 {/* Tab Selection & Bulk Row */}
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                       <div className="flex items-center gap-2 mr-4 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-300 text-[#0a0aa1] focus:ring-[#0a0aa1]"
                            checked={filtered.length > 0 && selectedApps.length === filtered.length}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedApps(filtered.map(a => a._id));
                              else setSelectedApps([]);
                            }}
                          />
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select All</span>
                       </div>
                       {(["all", "pending", "approved", "rejected", "disabled"] as const).map((s) => (
                         <button key={s} onClick={() => setFilterStatus(s)}
                           className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${filterStatus === s ? "bg-[#0a0aa1] text-white border-[#0a0aa1] shadow-lg shadow-blue-100" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"}`}>
                           {s} ({counts[s]})
                         </button>
                       ))}
                    </div>
                    <button 
                      onClick={() => {
                        setPrefillApplication(null);
                        setTab("create");
                      }}
                      className="flex items-center gap-2 px-6 py-2.5 bg-white text-black border border-slate-300 rounded-xl text-xs font-black uppercase hover:bg-slate-50 transition shadow-sm"
                    >
                      <PlusCircle className="w-4 h-4 text-black" /> New Center
                    </button>
                 </div>

                 {/* Application Bulk Actions Bar */}
                 {selectedApps.length > 0 && (
                   <div className="bg-[#0a0aa1] px-6 py-4 rounded-3xl flex items-center justify-between animate-in slide-in-from-top duration-300 shadow-2xl shadow-blue-200">
                     <div className="flex items-center gap-4 text-white">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-black text-lg">{selectedApps.length}</div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest">Centers Selected</p>
                          <p className="text-[10px] text-blue-200 font-bold">Perform bulk actions on selection</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                         {applications.filter(a => selectedApps.includes(a._id) && a.status === "pending").length > 0 && (
                           <>
                             <button onClick={() => handleBulkAction("centers", "approve")} className="px-5 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20">Approve Select</button>
                             <button onClick={() => handleBulkAction("centers", "reject")} className="px-5 py-2 rounded-xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition shadow-lg shadow-amber-500/20">Reject Select</button>
                           </>
                         )}
                         {applications.filter(a => selectedApps.includes(a._id) && a.status === "approved").length > 0 && (
                           <>
                             <button onClick={() => handleBulkAction("centers", "enable")} className="px-5 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20">Enable Select</button>
                             <button onClick={() => handleBulkAction("centers", "disable")} className="px-5 py-2 rounded-xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition shadow-lg shadow-amber-500/20">Disable Select</button>
                           </>
                         )}
                         <button onClick={() => setSelectedApps([])} className="px-5 py-2 rounded-xl bg-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition">Cancel</button>
                     </div>
                   </div>
                 )}

                {/* List of Applications (The Nice Card Style from Dashboard) */}
                {loading ? (
                  <div className="flex items-center justify-center py-24 bg-white rounded-3xl border border-slate-100">
                    <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-bold uppercase tracking-wider">No {filterStatus !== "all" ? filterStatus : ""} centers found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filtered.map((app) => (
                      <div key={app._id} className="group relative bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                        <div className="flex flex-col md:flex-row md:items-center gap-6 px-6 py-5">
                          <div className="shrink-0 flex items-center pr-2">
                             <input 
                               type="checkbox" 
                               className="w-5 h-5 rounded border-slate-300 text-[#0a0aa1] focus:ring-[#0a0aa1] cursor-pointer"
                               checked={selectedApps.includes(app._id)}
                               onChange={(e) => {
                                 if (e.target.checked) setSelectedApps(prev => [...prev, app._id]);
                                 else setSelectedApps(prev => prev.filter(id => id !== app._id));
                               }}
                             />
                          </div>
                          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                            {app.logo ? <Image src={app.logo} alt="" width={40} height={40} unoptimized className="w-10 h-10 object-contain" /> : <ShieldCheck className="w-7 h-7 text-blue-600" />}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h4 className="font-black text-slate-800 text-lg tracking-tight uppercase">{app.trainingPartnerName}</h4>
                              {app.submittedByAdmin && (
                                <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-lg font-black uppercase border border-purple-200">Admin Created</span>
                              )}
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase ${app.status === "approved" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : app.status === "pending" ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
                                {app.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-tight flex flex-wrap gap-x-4">
                              <span>{app.email}</span>
                              <span>{app.mobile}</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {app.district}, {app.state}</span>
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 uppercase tracking-wider">
                                {formatApplicationFee(app)}
                              </span>
                              {app.tpCode && (
                                <span className="px-3 py-1 bg-slate-800 text-white rounded-lg font-black text-[11px] tracking-widest shadow-sm">
                                  ID: {app.tpCode}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                            {app.status !== "approved" && (
                                <button onClick={() => handleAction(app._id, "approve")} disabled={actionLoading !== null}
                                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500 transition shadow-lg shadow-emerald-100 disabled:opacity-50">
                                  Approve
                                </button>
                            )}
                            {app.status !== "rejected" && app.status !== "approved" && (
                                <button onClick={() => handleAction(app._id, "reject")} disabled={actionLoading !== null}
                                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-wider hover:bg-red-500 transition shadow-lg shadow-red-100 disabled:opacity-50">
                                  Reject
                                </button>
                            )}
                            {app.status === "approved" && (
                              <button
                                disabled={actionLoading === app._id + "toggleStatus"}
                                onClick={() => handleAction(app._id, "toggleStatus")}
                                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition active:scale-95 ${app.userStatus === "active" ? "bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200" : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100"}`}
                              >
                                {app.userStatus === "active" ? "Disable Center" : "Enable Center"}
                              </button>
                            )}
                            <button type="button" onClick={() => openApplicationForCreateEdit(app)}
                              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 transition">
                              Edit
                            </button>
                            <button type="button" onClick={() => printApplication(app)}
                              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 transition">
                              Print
                            </button>
                            {app.tpCode && (
                              <button
                                type="button"
                                onClick={() => void openCenterWallet(app)}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 transition flex items-center gap-1.5"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                Wallet
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

                {editingApplication && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-5xl overflow-hidden rounded-[2.5rem] bg-white shadow-2xl border border-white/20">
                      <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6 bg-slate-50/50">
                        <div>
                          <h3 className="text-xl font-black text-slate-900 uppercase">Edit ATC Application</h3>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Modify center details and credentials</p>
                        </div>
                        <button type="button" onClick={closeApplicationEditor} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 transition shadow-sm">
                          <XCircle className="w-6 h-6" />
                        </button>
                      </div>
                      <div className="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                        <AdminAtcForm
                          mode="edit"
                          applicationId={editingApplication._id}
                          initialData={editingApplication}
                          onCancel={closeApplicationEditor}
                          onSuccess={async () => {
                            closeApplicationEditor();
                            await fetchApplications();
                          }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Added Qualifications (one per line)</label>
                        <textarea
                          value={String(studentEditValues.credentialEntriesText || "")}
                          onChange={(e) => setStudentEditValues((prev) => ({ ...prev, credentialEntriesText: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition h-28"
                          placeholder="Qualification | School/College | Course Name | Year | Obtained"
                        />
                        <p className="mt-1 text-[10px] font-semibold text-slate-400">
                          Format: Qualification | School/College | Course Name | Year | Obtained
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {centerWalletModal && (
                  <div className="fixed inset-0 z-130 bg-black/50 flex items-center justify-center p-4">
                    <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Center Wallet Management</h4>
                          <p className="text-xs text-slate-500 font-bold mt-1">
                            {centerWalletModal.trainingPartnerName} ({centerWalletModal.tpCode})
                          </p>
                        </div>
                        <button
                          onClick={() => setCenterWalletModal(null)}
                          className="text-xs font-bold text-slate-500 hover:text-slate-700"
                        >
                          Close
                        </button>
                      </div>
                      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Current Balance</p>
                            <p className="text-2xl font-black text-emerald-700">₹{centerWalletModal.walletBalance}</p>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Adjust Balance</p>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => setCenterWalletAction("credit")}
                                className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase ${centerWalletAction === "credit" ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
                              >
                                Add Balance
                              </button>
                              <button
                                onClick={() => setCenterWalletAction("debit")}
                                className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase ${centerWalletAction === "debit" ? "bg-red-600 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
                              >
                                Withdraw
                              </button>
                            </div>
                            <input
                              type="number"
                              placeholder="Amount"
                              value={centerWalletAmount}
                              onChange={(e) => setCenterWalletAmount(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                            />
                            <textarea
                              value={centerWalletRemark}
                              onChange={(e) => setCenterWalletRemark(e.target.value)}
                              placeholder="Remark (optional)"
                              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 min-h-22.5"
                            />
                            <button
                              onClick={() => void submitCenterWalletAction()}
                              disabled={centerWalletSubmitting}
                              className={`w-full rounded-xl py-2.5 text-sm font-black uppercase ${centerWalletAction === "credit" ? "bg-emerald-600 text-white" : "bg-red-100 text-red-700"} disabled:opacity-60`}
                            >
                              {centerWalletSubmitting ? "Processing..." : centerWalletAction === "credit" ? "Add Amount" : "Withdraw Amount"}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Wallet History</p>
                          {centerWalletLoading ? (
                            <p className="text-sm text-slate-400">Loading history...</p>
                          ) : centerWalletHistory.length === 0 ? (
                            <p className="text-sm text-slate-400">No wallet history found.</p>
                          ) : (
                            <div className="space-y-2 max-h-107.5 overflow-y-auto pr-1">
                              {centerWalletHistory.map((item) => (
                                <div key={item._id} className="border border-slate-100 rounded-xl px-3 py-3 text-xs bg-white">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="font-black text-slate-700 uppercase">
                                      {item.type === "credit" ? "Credit" : "Debit"}
                                    </p>
                                    <p className={`font-black ${item.type === "credit" ? "text-emerald-600" : "text-red-600"}`}>
                                      {item.type === "credit" ? "+" : "-"}₹{item.amount}
                                    </p>
                                  </div>
                                  <p className="text-slate-600 mt-1">{item.reason}</p>
                                  {item.adminRemark ? (
                                    <p className="text-blue-700 font-semibold mt-1">Remark: {item.adminRemark}</p>
                                  ) : null}
                                  <p className="text-slate-500 mt-1">{new Date(item.createdAt).toLocaleString("en-IN")}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── EXAM REQUESTS TAB ── */}
            {tab === "examRequests" && <ExamRequestManager role="admin" />}

            {/* ── STUDY MATERIALS TAB ── */}
            {tab === "materials" && <StudyMaterialManager role="admin" />}

            {/* ── RESULT REVIEW TAB ── */}
            {tab === "resultReview" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Result Approval Queue</h2>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Review and authorize student exam results submitted by centers</p>
                  </div>
                  <button onClick={fetchPendingResults} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition">
                    <RefreshCw className={`w-5 h-5 text-slate-400 ${resultsLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {selectedResults.length > 0 && (
                   <div className="bg-amber-600 px-6 py-3 rounded-2xl flex items-center justify-between animate-in slide-in-from-top duration-300 shadow-lg shadow-amber-100">
                      <div className="flex items-center gap-4 text-white text-xs font-bold">
                         <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">{selectedResults.length}</div>
                         <span className="uppercase tracking-widest">Results Selected</span>
                      </div>
                      <div className="flex items-center gap-3">
                         <button 
                           onClick={() => {
                             setBulkIssueDate(new Date().toISOString().slice(0, 10));
                             setBulkApproveDialog(true);
                           }} 
                           className="px-5 py-2 rounded-xl bg-white text-amber-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition"
                         >
                           Approve Selective
                         </button>
                         <button onClick={() => setSelectedResults([])} className="px-5 py-2 rounded-xl bg-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition">Cancel</button>
                      </div>
                   </div>
                )}

                {resultsLoading ? (
                  <div className="p-20 flex flex-col items-center gap-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 border-4 border-amber-100 border-t-amber-600 rounded-full animate-spin" />
                    <p className="text-sm font-black text-slate-400 uppercase">Fetching pending reviews...</p>
                  </div>
                ) : pendingResults.length === 0 ? (
                  <div className="p-20 flex flex-col items-center gap-4 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                      <CheckCircle className="w-8 h-8 text-slate-300" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">Clean Queue</h3>
                      <p className="text-slate-400 text-sm">All submitted results have been processed.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center px-6 py-2 bg-slate-50/50 rounded-xl border border-slate-100">
                       <label className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                            checked={pendingResults.length > 0 && selectedResults.length === pendingResults.length}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedResults(pendingResults.map(r => r._id));
                              else setSelectedResults([]);
                            }}
                          />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition">Select All Pending Results</span>
                       </label>
                    </div>
                    {pendingResults.map((res) => (
                      <div key={res._id} className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center hover:border-amber-200 transition-all group ${selectedResults.includes(res._id) ? 'bg-amber-50/20 border-amber-200' : ''}`}>
                         <div className="shrink-0 flex items-center pr-2">
                            <input 
                              type="checkbox" 
                              className="w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                              checked={selectedResults.includes(res._id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedResults(prev => [...prev, res._id]);
                                else setSelectedResults(prev => prev.filter(id => id !== res._id));
                              }}
                            />
                         </div>
                         <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 shrink-0">
                            {res.studentId?.photo ? <Image src={res.studentId.photo} alt="" width={64} height={64} unoptimized className="w-full h-full object-cover" /> : <User className="w-8 h-8 m-4 text-slate-300" />}
                         </div>
                         <div className="grow space-y-1">
                            <div className="flex items-center gap-3">
                               <h4 className="font-bold text-slate-800 text-lg">{res.studentId?.name || "Unknown Student"}</h4>
                               <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-black uppercase border border-blue-100">{res.studentId?.enrollmentNo}</span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-slate-400 uppercase tracking-tight">
                               <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {res.atcId?.trainingPartnerName} ({res.atcId?.tpCode})</span>
                               <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {res.studentId?.course}</span>
                               <span className="flex items-center gap-1.5 font-black text-amber-600 italic">Score: {res.totalScore} / 100 • Grade: {res.grade || '—'}</span>
                               {res.offlineExamCopy && (
                                 <button 
                                   onClick={() => {
                                     const win = window.open();
                                     const html = `<html><body style="margin:0"><embed src="${res.offlineExamCopy}" width="100%" height="100%" type="application/pdf"></body></html>`;
                                     win?.document.write(html);
                                   }}
                                   className="text-blue-600 font-black hover:underline"
                                 >
                                   View Exam Copy
                                 </button>
                               )}
                            </div>
                         </div>
                         <div className="flex items-center gap-3 w-full md:w-auto">
                            <button 
                              onClick={() => handleResultApproval(res._id, "appeared")}
                              className="grow md:flex-none px-6 py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-black uppercase hover:bg-red-50 hover:text-red-600 transition"
                            >
                              Reject
                            </button>
                            <button 
                              onClick={() => openReviewModal(res)}
                              className="grow md:flex-none px-8 py-3 bg-amber-500 text-white rounded-xl text-xs font-black uppercase hover:bg-amber-600 transition shadow-lg shadow-amber-100"
                            >
                              Review & Approve
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>
                )}

                {reviewResult && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                      <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                        <div>
                          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                            Review &amp; Approve Result
                          </h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {reviewResult.studentId?.name} • {reviewResult.studentId?.enrollmentNo} •{" "}
                            {reviewResult.atcId?.trainingPartnerName}
                          </p>
                        </div>
                        <button
                          onClick={() => setReviewResult(null)}
                          className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition"
                          aria-label="Close"
                        >
                          <X className="w-5 h-5 text-slate-400" />
                        </button>
                      </div>

                      <div className="px-8 py-6 space-y-6 overflow-y-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-slate-50 rounded-2xl p-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode</p>
                            <p className="text-sm font-black text-slate-800 mt-1 uppercase">{reviewResult.examMode || "—"}</p>
                          </div>
                          <div className="bg-slate-50 rounded-2xl p-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Score</p>
                            <p className="text-sm font-black text-slate-800 mt-1">
                              {reviewResult.totalScore ?? 0} / {reviewResult.maxScore ?? 100}
                            </p>
                          </div>
                          <div className="bg-slate-50 rounded-2xl p-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Result</p>
                            <p className="text-sm font-black text-slate-800 mt-1 uppercase">
                              {reviewResult.offlineExamResult || "—"}
                            </p>
                          </div>
                          <div className="bg-slate-50 rounded-2xl p-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade</p>
                            <p className="text-sm font-black text-slate-800 mt-1 uppercase">
                              {reviewResult.grade || "—"}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">
                            ATC Submitted Subject-wise Marks
                          </h4>
                          {reviewResult.subjectMarks && reviewResult.subjectMarks.length > 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                <div className="col-span-4">Subject</div>
                                <div className="col-span-2 text-center">Internal</div>
                                <div className="col-span-2 text-center">Int. Max</div>
                                <div className="col-span-2 text-center">External</div>
                                <div className="col-span-2 text-center">Ext. Max</div>
                              </div>
                              {reviewResult.subjectMarks.map((row, idx) => (
                                <div
                                  key={`${row.subjectName}-${idx}`}
                                  className="grid grid-cols-12 gap-2 px-4 py-2 items-center border-t border-slate-100"
                                >
                                  <div className="col-span-4 text-xs font-bold text-slate-700 truncate">
                                    {row.subjectName}
                                  </div>
                                  <div className="col-span-2 text-center text-xs font-black text-slate-800">
                                    {row.internalObtained}
                                  </div>
                                  <div className="col-span-2 text-center text-[11px] font-bold text-slate-400">
                                    {row.internalMax}
                                  </div>
                                  <div className="col-span-2 text-center text-xs font-black text-slate-800">
                                    {row.externalObtained}
                                  </div>
                                  <div className="col-span-2 text-center text-[11px] font-bold text-slate-400">
                                    {row.externalMax}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-xs font-bold">
                              The ATC did not submit subject-wise marks. The marksheet will use overall totals or a single summary row only.
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Issue Date *
                          </label>
                          <input
                            type="date"
                            value={reviewIssueDate}
                            onChange={(e) => setReviewIssueDate(e.target.value)}
                            className="w-full md:w-1/2 px-5 py-3 bg-slate-50 rounded-xl border-none font-bold text-slate-800 focus:ring-2 focus:ring-amber-500"
                          />
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            This date will be printed as the issue date on both the marksheet and the certificate.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 px-8 py-5 border-t border-slate-100 bg-slate-50/50">
                        <button
                          onClick={() => setReviewResult(null)}
                          className="px-6 py-3 bg-white text-slate-600 rounded-xl text-xs font-black uppercase border border-slate-200 hover:bg-slate-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={submitReviewApproval}
                          disabled={reviewSubmitting || !reviewIssueDate}
                          className="ml-auto px-8 py-3 bg-amber-500 text-white rounded-xl text-xs font-black uppercase hover:bg-amber-600 transition shadow-lg shadow-amber-100 disabled:opacity-60"
                        >
                          {reviewSubmitting ? "Approving..." : "Approve & Release Documents"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {bulkApproveDialog && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
                      <div className="px-8 py-6 border-b border-slate-100">
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                          Bulk Approve {selectedResults.length} Results
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          Same issue date will apply to all marksheets and certificates.
                        </p>
                      </div>
                      <div className="px-8 py-6 space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Issue Date *
                        </label>
                        <input
                          type="date"
                          value={bulkIssueDate}
                          onChange={(e) => setBulkIssueDate(e.target.value)}
                          className="w-full px-5 py-3 bg-slate-50 rounded-xl border-none font-bold text-slate-800 focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div className="flex items-center gap-3 px-8 py-5 border-t border-slate-100 bg-slate-50/50">
                        <button
                          onClick={() => setBulkApproveDialog(false)}
                          className="px-6 py-3 bg-white text-slate-600 rounded-xl text-xs font-black uppercase border border-slate-200 hover:bg-slate-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (!bulkIssueDate) return;
                            setResultsLoading(true);
                            try {
                              for (const id of selectedResults) {
                                await apiFetch("/api/admin/exams/approve-result", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    examId: id,
                                    status: "published",
                                    marksheet: true,
                                    certificate: true,
                                    issueDate: bulkIssueDate,
                                  }),
                                });
                              }
                              setSelectedResults([]);
                              setBulkApproveDialog(false);
                              await fetchPendingResults();
                            } catch { showToast("error", "Bulk approval failed"); }
                            finally { setResultsLoading(false); }
                          }}
                          disabled={!bulkIssueDate}
                          className="ml-auto px-8 py-3 bg-amber-500 text-white rounded-xl text-xs font-black uppercase hover:bg-amber-600 transition shadow-lg shadow-amber-100 disabled:opacity-60"
                        >
                          Approve All
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* ── SETTINGS TAB ── */}
            {tab === "settings" && (
              <div className="max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Global Brand Identity */}
                <div className="md:col-span-2 bg-white rounded-4xl border border-slate-100 shadow-xl p-8 space-y-6">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                      <Layout className="w-7 h-7 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Global Brand Identity</h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">Set the primary branding for your institution. This reflects on certificates, ID cards, and all portal titles.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Institution Brand Name</label>
                         <div className="relative group">
                            <input 
                              type="text" 
                              value={brandName}
                              onChange={(e) => setBrandName(e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition group-hover:border-slate-300"
                              placeholder="e.g. Your Institution Name"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-40 transition">
                              <Type className="w-5 h-5 text-slate-900" />
                            </div>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Contact Mobile Number</label>
                         <div className="relative group">
                            <input 
                              type="text" 
                              value={brandMobile}
                              onChange={(e) => setBrandMobile(e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition group-hover:border-slate-300"
                              placeholder="e.g. +91 9876543210"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-40 transition">
                              <Building2 className="w-5 h-5 text-slate-900" />
                            </div>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Official Email Address</label>
                         <div className="relative group">
                            <input 
                              type="email" 
                              value={brandEmail}
                              onChange={(e) => setBrandEmail(e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition group-hover:border-slate-300"
                              placeholder="e.g. info@institution.com"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-40 transition">
                              <Mail className="w-5 h-5 text-slate-900" />
                            </div>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Physical Address</label>
                         <div className="relative group">
                            <textarea 
                              value={brandAddress}
                              onChange={(e) => setBrandAddress(e.target.value)}
                              rows={2}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition group-hover:border-slate-300 resize-none"
                              placeholder="e.g. 123, Main Street, City, State"
                            />
                            <div className="absolute right-4 top-4 opacity-20 group-hover:opacity-40 transition">
                              <MapPin className="w-5 h-5 text-slate-900" />
                            </div>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Website URL</label>
                         <div className="relative group">
                            <input 
                              type="text" 
                              value={brandUrl}
                              onChange={(e) => setBrandUrl(e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition group-hover:border-slate-300"
                              placeholder="e.g. www.institution.com"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-40 transition">
                              <Monitor className="w-5 h-5 text-slate-900" />
                            </div>
                         </div>
                      </div>

                      <button 
                        onClick={handleBrandSave}
                        disabled={brandSaving}
                        className="w-full group relative flex items-center justify-center gap-3 py-4 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {brandSaving ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 group-hover:scale-125 transition" />
                        )}
                        {brandSaving ? "Updating Identity..." : "Save Identity Settings"}
                      </button>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block">Institution Logo (PNG/SVG)</label>
                        <div className="relative aspect-square max-w-60 mx-auto bg-slate-50 rounded-4xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden group hover:border-indigo-300 transition">
                            {brandLogo ? (
                                <div className="relative w-full h-full p-8">
                                    <Image src={brandLogo} alt="Logo" width={240} height={240} unoptimized className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                        <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition">
                                            Change Logo
                                            <input type="file" accept="image/*" className="hidden" onChange={handleBrandLogoUpload} />
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center gap-3 cursor-pointer p-10 text-center">
                                    <Upload className="w-10 h-10 text-slate-300" />
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upload Global Logo</p>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleBrandLogoUpload} />
                                </label>
                            )}
                        </div>
                        <p className="text-[10px] text-center text-slate-400 font-medium uppercase tracking-tight">Recommended: Square logo with transparent background</p>
                    </div>
                  </div>
                </div>

                {/* Marksheet grade scale (percentage → letter) */}
                <div className="md:col-span-2 bg-white rounded-4xl border border-slate-100 shadow-xl p-8 space-y-6">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                      <GraduationCap className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Marksheet grade scale</h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Minimum percentage for each grade (highest threshold wins). Used when publishing results, when ATC syncs subject marks, and on the marksheet when grade is derived from percentage.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                      <span>Min %</span>
                      <span>Grade</span>
                      <span className="w-10" aria-hidden />
                    </div>
                    {marksheetGradeBands.map((row, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="any"
                          value={row.minPercent}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setMarksheetGradeBands((prev) =>
                              prev.map((r, j) =>
                                j === i ? { ...r, minPercent: Number.isFinite(v) ? v : 0 } : r,
                              ),
                            );
                          }}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"
                        />
                        <input
                          type="text"
                          value={row.grade}
                          onChange={(e) =>
                            setMarksheetGradeBands((prev) =>
                              prev.map((r, j) => (j === i ? { ...r, grade: e.target.value } : r)),
                            )
                          }
                          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50"
                          placeholder="e.g. S"
                        />
                        <button
                          type="button"
                          disabled={marksheetGradeBands.length <= 1}
                          onClick={() => setMarksheetGradeBands((prev) => prev.filter((_, j) => j !== i))}
                          className="p-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100 disabled:opacity-40"
                          aria-label="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setMarksheetGradeBands((prev) => [...prev, { minPercent: 0, grade: "" }])}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50"
                    >
                      Add row
                    </button>
                    <button
                      type="button"
                      onClick={() => setMarksheetGradeBands([...DEFAULT_MARKSHEET_GRADE_BANDS])}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50"
                    >
                      Reset defaults
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveMarksheetGradeBands()}
                      disabled={marksheetGradeBandsSaving}
                      className="ml-auto px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-wider hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {marksheetGradeBandsSaving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save grade scale
                    </button>
                  </div>
                </div>

                {/* QR Code Setting */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Payment QR Code</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Upload your Google Pay / UPI QR code. It will automatically appear on all applicant payment receipts.</p>
                    </div>
                  </div>

                  {/* QR Preview */}
                  {qrLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                    </div>
                  ) : qrPreview ? (
                    <div className="flex flex-col items-center gap-4">
                      <Image src={qrPreview} alt="Payment QR Code" width={192} height={192} unoptimized className="w-48 h-48 object-contain border-2 border-slate-200 rounded-xl shadow-sm" />
                      <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> QR Code is set and active
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                      <QrCode className="w-10 h-10 text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500">No QR code uploaded yet</p>
                    </div>
                  )}

                  {/* Upload */}
                  <div className="space-y-3">
                    <label className="flex flex-col items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 cursor-pointer hover:bg-blue-100 transition">
                      <Upload className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-700">Click to upload QR image</span>
                      <span className="text-xs text-blue-500">PNG, JPG, WebP supported</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleQrUpload} />
                    </label>

                    <div className="flex gap-3">
                      <button
                        onClick={handleQrSave}
                        disabled={!qrPreview || qrSaving}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {qrSaving ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        {qrSaving ? "Saving..." : "Save QR Code"}
                      </button>
                      {qrPreview && (
                        <button
                          onClick={handleQrRemove}
                          className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                    <strong>Tip:</strong> Upload your Google Pay UPI QR code image. Applicants will see this QR when they submit the Become ATC form, on their payment receipt.
                  </div>
                </div>

                {/* Affiliation zones — name + base fee (used in total × years − discount) */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Affiliation zones &amp; fees</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Add or edit zone names and base fees (₹). Applicants see these on Become ATC; total = sum of selected zones × years, then discount.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {zoneFeesAdmin.map((row, index) => (
                      <div key={`zone-${index}`} className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-12 sm:col-span-5">
                          <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Zone name</label>
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) => updateZoneFeeAdmin(index, "name", e.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                            placeholder="Zone name"
                          />
                        </div>
                        <div className="col-span-12 sm:col-span-6">
                          <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Fee (₹)</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={row.amount === 0 ? "" : String(row.amount)}
                            onChange={(e) => updateZoneFeeAdmin(index, "amount", e.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                            placeholder="2000"
                          />
                        </div>
                        <div className="col-span-12 sm:col-span-1 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => removeZoneFeeAdmin(index)}
                            className="rounded-2xl border border-red-200 bg-white px-3 py-3 text-red-600 text-sm font-semibold hover:bg-red-50 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addZoneFeeAdmin}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <PlusCircle className="w-4 h-4" /> Add zone
                    </button>

                    {zoneFeesSaveMsg && (
                      <div className={`rounded-2xl px-4 py-3 text-sm ${zoneFeesSaveMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                        {zoneFeesSaveMsg.text}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleZoneFeesSave}
                        disabled={zoneFeesSaving}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition disabled:opacity-50"
                      >
                        {zoneFeesSaving ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        {zoneFeesSaving ? "Saving..." : "Save zone fees"}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600">
                    Renaming a zone only affects new applications. Old records keep the names used at submission time.
                  </div>
                </div>

                {/* Affiliation year × discount plans */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Affiliation year &amp; discount</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Set duration options (years) and discount % applied after (zone total × years).
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {yearPlansAdmin.map((plan, index) => (
                      <div key={`${plan.year}-${index}`} className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-12 sm:col-span-5">
                          <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Years</label>
                          <input
                            type="number"
                            min={1}
                            value={plan.year}
                            onChange={(e) =>
                              updateYearPlanAdmin(index, "year", parseInt(e.target.value, 10) || 1)
                            }
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                          />
                        </div>
                        <div className="col-span-12 sm:col-span-6">
                          <label className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                            Discount %
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={plan.discountPercent}
                            onChange={(e) =>
                              updateYearPlanAdmin(index, "discountPercent", parseInt(e.target.value, 10) || 0)
                            }
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                          />
                        </div>
                        <div className="col-span-12 sm:col-span-1 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => removeYearPlanAdmin(index)}
                            className="rounded-2xl border border-red-200 bg-white px-3 py-3 text-red-600 text-sm font-semibold hover:bg-red-50 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addYearPlanAdmin}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <PlusCircle className="w-4 h-4" /> Add row
                    </button>

                    {feeSaveMsg && (
                      <div className={`rounded-2xl px-4 py-3 text-sm ${feeSaveMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                        {feeSaveMsg.text}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleYearPlansSave}
                        disabled={feeSaving}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        {feeSaving ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        {feeSaving ? "Saving..." : "Save year plans"}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600">
                    Final payable = (sum of selected zones × years) − discount. Calculations always run on the server.
                  </div>
                </div>

                {/* Signature Setting */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Authorized Signature</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Upload your authorized signature image (with transparent background). Used for certificates / documents.</p>
                    </div>
                  </div>

                  {/* Sig Preview */}
                  {sigLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <div className="w-8 h-8 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
                    </div>
                  ) : sigPreview ? (
                    <div className="flex flex-col items-center gap-4">
                      <Image src={sigPreview} alt="Signature Preview" width={192} height={96} unoptimized className="w-48 h-24 object-contain border-2 border-slate-200 rounded-xl shadow-sm bg-slate-50" />
                      <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Signature is set and active
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                      <FileText className="w-10 h-10 text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500">No signature uploaded yet</p>
                    </div>
                  )}

                  {/* Upload */}
                  <div className="space-y-3">
                    <label className="flex flex-col items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-purple-300 rounded-xl bg-purple-50 cursor-pointer hover:bg-purple-100 transition">
                      <Upload className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-700">Click to upload Signature image</span>
                      <span className="text-xs text-purple-500">PNG with transparent background recommended</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleSigUpload} />
                    </label>

                    <div className="flex gap-3">
                      <button
                        onClick={handleSigSave}
                        disabled={!sigPreview || sigSaving}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition disabled:opacity-50"
                      >
                        {sigSaving ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        {sigSaving ? "Saving..." : "Save Signature"}
                      </button>
                      {sigPreview && (
                        <button
                          onClick={handleSigRemove}
                          className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 text-xs text-purple-800">
                    <strong>Tip:</strong> Upload a clear image of your signature with a transparent background (.png format) for best results when overlaid onto certificates or official documents.
                  </div>
                </div>

                {/* Account Settings - Password Change */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Security & Password</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Change your admin login password to maintain account security.</p>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Current Password</label>
                      <div className="relative">
                        <input 
                          type={showOldPass ? "text" : "password"} 
                          value={passData.old} 
                          onChange={e => setPassData(p => ({ ...p, old: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-red-100 transition" 
                          placeholder="Current" 
                        />
                        <button type="button" onClick={() => setShowOldPass(!showOldPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          {showOldPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">New Password</label>
                      <div className="relative">
                        <input 
                          type={showNewPass ? "text" : "password"} 
                          value={passData.new} 
                          onChange={e => setPassData(p => ({ ...p, new: e.target.value }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-red-100 transition" 
                          placeholder="6+ characters" 
                        />
                        <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Confirm New Password</label>
                      <input 
                        type="password" 
                        value={passData.confirm} 
                        onChange={e => setPassData(p => ({ ...p, confirm: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-100 transition" 
                        placeholder="Repeat new password" 
                      />
                    </div>
                    <div className="md:col-span-3 flex justify-end">
                       <button
                         type="submit"
                         disabled={passSaving}
                         className="px-8 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
                       >
                         {passSaving ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                         Update Admin Password
                       </button>
                    </div>
                  </form>

                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-800">
                    <strong>Warning:</strong> Changing your password will not log out other active sessions but will be required for next login. Keep it secure.
                  </div>
                </div>
              </div>
            )}

            {/* ── REGISTRATION SETTINGS TAB ── */}
            {tab === "registration" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* reg_format_center, reg_format_student, reg_format_student_registration */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Hash className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 uppercase tracking-tight">Enrollment number formats</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Center Format Card */}
                    <div className="space-y-4 p-5 rounded-3xl border border-slate-100 bg-slate-50/50">
                       <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Center ID Format</label>
                          <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 text-[8px] font-black uppercase">Preview</span>
                       </div>
                       
                       <div className="space-y-4">
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Prefix (Text before number)</label>
                            <input 
                              type="text" 
                              value={centerFormat.prefix} 
                              onChange={(e) => setCenterFormat(prev => ({ ...prev, prefix: e.target.value }))}
                              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                              placeholder="e.g. ATC-"
                            />
                            <p className="text-[8px] text-slate-400 mt-1 italic">Tip: Use <strong>{`{YEAR}`}</strong> in prefix for automatic current year.</p>
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Internal Counter (Current Value)</label>
                            <input 
                              type="number" 
                              value={centerFormat.counter} 
                              onChange={(e) => setCenterFormat(prev => ({ ...prev, counter: parseInt(e.target.value) || 1 }))}
                              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                              placeholder="1"
                            />
                          </div>
                          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
                             <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Generated Sample</p>
                             <p className="text-xl font-black text-blue-700 tracking-tighter">
                               {centerFormat.prefix.replace("{YEAR}", new Date().getFullYear().toString())}{String(centerFormat.counter).padStart(centerFormat.padding, "0")}
                             </p>
                          </div>
                       </div>
                    </div>

                    {/* Student Format Card */}
                    <div className="space-y-4 p-5 rounded-3xl border border-slate-100 bg-slate-50/50">
                       <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Student enrollment format</label>
                          <span className="px-2 py-0.5 rounded-lg bg-purple-100 text-purple-700 text-[8px] font-black uppercase">Preview</span>
                       </div>
                       
                       <div className="space-y-4">
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Prefix (Text before number)</label>
                            <input 
                              type="text" 
                              value={studentFormat.prefix} 
                              onChange={(e) => setStudentFormat(prev => ({ ...prev, prefix: e.target.value }))}
                              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-purple-100 outline-none"
                              placeholder="e.g. ATC-ST-26-"
                            />
                            <p className="text-[8px] text-slate-400 mt-1 italic">Tip: Use <strong>{`{YEAR}`}</strong> in prefix for automatic current year.</p>
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Internal Counter (Current Value)</label>
                            <input 
                              type="number" 
                              value={studentFormat.counter} 
                              onChange={(e) => setStudentFormat(prev => ({ ...prev, counter: parseInt(e.target.value) || 1 }))}
                              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-purple-100 outline-none"
                              placeholder="1"
                            />
                          </div>
                          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
                             <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Generated Sample</p>
                             <p className="text-xl font-black text-purple-700 tracking-tighter">
                               {studentFormat.prefix.replace("{YEAR}", new Date().getFullYear().toString())}{String(studentFormat.counter).padStart(studentFormat.padding, "0")}
                             </p>
                          </div>
                       </div>
                    </div>

                    {/* Student registration format — prefix + counter only */}
                    <div className="space-y-4 p-5 rounded-3xl border border-slate-100 bg-slate-50/50 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                          Student registration format
                        </label>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">
                            Prefix (Text before number)
                          </label>
                          <input
                            type="text"
                            value={studentRegistrationFormat.prefix}
                            onChange={(e) =>
                              setStudentRegistrationFormat((prev) => ({ ...prev, prefix: e.target.value }))
                            }
                            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-100 outline-none"
                            placeholder="e.g. REG-"
                          />
                          <p className="text-[8px] text-slate-400 mt-1 italic">
                            Tip: Use <strong>{`{YEAR}`}</strong> in prefix for automatic current year.
                          </p>
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">
                            Internal Counter (Current Value)
                          </label>
                          <input
                            type="number"
                            value={studentRegistrationFormat.counter}
                            onChange={(e) =>
                              setStudentRegistrationFormat((prev) => ({
                                ...prev,
                                counter: parseInt(e.target.value, 10) || 1,
                              }))
                            }
                            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-100 outline-none"
                            placeholder="1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                      onClick={async () => {
                        setIdFormatSaving(true);
                        try {
                          await apiFetch("/api/admin/settings", {
                            method: "POST",
                            headers: { 
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ key: "reg_format_center", value: JSON.stringify(centerFormat) }),
                          });
                          await apiFetch("/api/admin/settings", {
                            method: "POST",
                            headers: { 
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ key: "reg_format_student", value: JSON.stringify(studentFormat) }),
                          });
                          await apiFetch("/api/admin/settings", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              key: "reg_format_student_registration",
                              value: JSON.stringify(studentRegistrationFormat),
                            }),
                          });
                          showToast("success", "ID Formats updated successfully!");
                        } catch {
                          showToast("error", "Failed to save ID formats.");
                        } finally {
                          setIdFormatSaving(false);
                        }
                      }}
                      disabled={idFormatSaving}
                      className="px-8 py-3 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-900 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {idFormatSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {idFormatSaving ? "Saving..." : "Save ID Formats"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── BACKGROUND TEMPLATES TAB ── */}
            {tab === "backgrounds" && (
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center border border-purple-100">
                    <Layers className="w-7 h-7 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Background Templates (A4 Size)</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Upload high-quality A4 size background images for documents</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  {([
                    { id: "id_front", label: "ID Front" },
                    { id: "id_back", label: "ID Back" },
                    { id: "certificate", label: "Certificate" },
                    { id: "marksheet", label: "Marksheet" },
                    { id: "admit_card", label: "Admit Card" },
                  ] as const).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest">{item.label}</p>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${
                          bgs[item.id] ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {bgs[item.id] ? "Uploaded" : "Not Added"}
                        </span>
                      </div>
                      <div className="relative aspect-3.5/2 bg-slate-50 rounded-xl border-2 border-slate-200 overflow-hidden group shadow-sm transition hover:border-purple-200">
                        {bgs[item.id] ? (
                          <>
                            <Image src={bgs[item.id]} alt={item.label} width={350} height={200} unoptimized className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                              <button onClick={() => handleBgRemove(item.id)} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                            <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tighter leading-tight">{item.label}</p>
                          </div>
                        )}
                        {bgSaving === item.id && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
                          </div>
                        )}
                      </div>
                      <label className="block">
                        <span className="sr-only">Upload {item.label}</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleBgUpload(e, item.id)}
                          className="block w-full text-xs text-slate-500 file:w-full file:mr-0 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition cursor-pointer"
                        />
                        <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {bgs[item.id] ? "Replace Background" : "Add Background"}
                        </p>
                      </label>
                    </div>
                  ))}
                </div>
                
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6 flex items-start gap-4">
                   <AlertTriangle className="w-5 h-5 text-purple-600 shrink-0" />
                   <div className="text-xs font-bold text-purple-800 uppercase tracking-wider space-y-1">
                      <p>Important: Upload only high-resolution JPG or PNG files.</p>
                      <p className="opacity-70">These backgrounds will be used for automated document generation for all centers.</p>
                   </div>
                </div>
              </div>
            )}

            {tab === "walletPayment" && (
              <div className="max-w-2xl">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Wallet Payment Details</h3>
                      <p className="text-xs text-slate-500 mt-0.5">ATC will see these details before submitting wallet add-money request.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      value={walletPayName}
                      onChange={(e) => setWalletPayName(e.target.value)}
                      placeholder="Receiver Name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                    />
                    <input
                      type="text"
                      value={walletPayUpi}
                      onChange={(e) => setWalletPayUpi(e.target.value)}
                      placeholder="UPI ID / Account Info"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                    />
                    <textarea
                      value={walletPayNote}
                      onChange={(e) => setWalletPayNote(e.target.value)}
                      rows={2}
                      placeholder="Payment instructions"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm resize-none"
                    />
                    <label className="flex flex-col items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-emerald-300 rounded-xl bg-emerald-50 cursor-pointer hover:bg-emerald-100 transition">
                      <Upload className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-700">Upload wallet payment QR</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleWalletQrUpload} />
                    </label>
                    {walletPayQr && walletPayQr !== "-" && (
                      <div className="flex justify-center">
                        <Image src={walletPayQr} alt="Wallet QR" width={140} height={140} unoptimized className="w-36 h-36 object-contain border border-slate-200 rounded-xl bg-white" />
                      </div>
                    )}
                    <button
                      onClick={handleWalletPaymentSave}
                      disabled={walletPaySaving}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      {walletPaySaving ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      {walletPaySaving ? "Saving..." : "Save Wallet Details"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── MANAGE STUDENTS TAB ── */}
            {tab === "students" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Student Filter Bar */}
                <div className="flex flex-wrap items-center gap-3">
                  {(["all", "pending", "active", "rejected", "disabled"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStudentFilter(s === "active" ? "approved" : s)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                        studentFilter === s
                          ? "bg-[#0a0aa1] text-white border-[#0a0aa1] shadow-lg shadow-blue-100 scale-105"
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {s === "active" ? "Approved" : s} ({studentCounts[s === "active" ? "approved" : s] || 0})
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Bulk Actions Bar */}
                  {selectedStudents.length > 0 && (
                    <div className="bg-[#0a0aa1] px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300">
                      <div className="flex items-center gap-4 text-white text-xs font-bold">
                        <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">{selectedStudents.length}</div>
                        <span className="uppercase tracking-widest">Students Selected</span>
                      </div>
                      <div className="flex items-center gap-3">
                         {students.filter(s => selectedStudents.includes(s._id) && s.status === "pending").length > 0 && (
                           <>
                             <button onClick={() => handleBulkAction("students", "approve")} className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20">Approve Select</button>
                             <button onClick={() => handleBulkAction("students", "reject")} className="px-4 py-1.5 rounded-lg bg-rose-500 text-white text-[10px] font-black uppercase hover:bg-rose-600 transition shadow-lg shadow-rose-500/20">Reject Select</button>
                           </>
                         )}
                         {students.filter(s => selectedStudents.includes(s._id) && s.status === "active").length > 0 && (
                           <>
                             <button onClick={() => handleBulkAction("students", "enable")} className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20">Enable Select</button>
                             <button onClick={() => handleBulkAction("students", "disable")} className="px-4 py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase hover:bg-amber-600 transition shadow-lg shadow-amber-500/20">Disable Select</button>
                           </>
                         )}
                         <button onClick={() => setSelectedStudents([])} className="px-4 py-1.5 rounded-lg bg-white/10 text-white text-[10px] font-black uppercase hover:bg-white/20 transition">Cancel</button>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                      <tr>
                        <th className="px-6 py-4 w-4">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-300 text-[#0a0aa1] focus:ring-[#0a0aa1]"
                            checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedStudents(filteredStudents.map(s => s._id));
                              else setSelectedStudents([]);
                            }}
                          />
                        </th>
                        <th className="px-6 py-4">ENROLLMENT NO.</th>
                        <th className="px-6 py-4">STUDENT IDENTITY</th>
                        <th className="px-6 py-4">CENTER</th>
                        <th className="px-6 py-4">COURSE</th>
                        <th className="px-6 py-4">FEE SUMMARY</th>
                        <th className="px-6 py-4 text-center">STATUS</th>
                        <th className="px-6 py-4 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentLoading ? (
                        <tr><td colSpan={8} className="px-6 py-10 text-center text-slate-400">Loading students...</td></tr>
                      ) : filteredStudents.length === 0 ? (
                        <tr><td colSpan={8} className="px-6 py-10 text-center text-slate-400">No {studentFilter !== "all" ? studentFilter : ""} students found.</td></tr>
                      ) : (
                        filteredStudents.map((s) => (
                          <Fragment key={s._id}>
                            <tr className="hover:bg-slate-50 transition group">
                              <td className="px-6 py-4">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 rounded border-slate-300 text-[#0a0aa1] focus:ring-[#0a0aa1]"
                                  checked={selectedStudents.includes(s._id)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedStudents(prev => [...prev, s._id]);
                                    else setSelectedStudents(prev => prev.filter(id => id !== s._id));
                                  }}
                                />
                              </td>
                              <td className="px-6 py-4">
                                 <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-black border border-slate-200">
                                     {s.enrollmentNo &&
                                     !s.enrollmentNo.startsWith("PENDING-") &&
                                     !s.enrollmentNo.startsWith("DIRECT-")
                                       ? s.enrollmentNo
                                       : "PENDING"}
                                 </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {s.photo ? (
                                    <Image src={s.photo} alt={s.name} width={40} height={40} unoptimized className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm ring-1 ring-slate-100" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200"><User className="w-5 h-5 text-slate-300" /></div>
                                  )}
                                  <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <p className="font-black text-slate-800 leading-none">{s.name}</p>
                                      {s.isDirectAdmission && (
                                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 text-[8px] font-black uppercase border border-blue-200">Front</span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                       S/o: {s.fatherName} • {s.mobile}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-[11px] font-black uppercase text-slate-500">{s.tpCode}</td>
                              <td className="px-6 py-4">
                                 <div className="flex flex-col">
                                    <span className="text-[11px] font-black uppercase text-emerald-700">{s.course}</span>
                                    <span className="text-[9px] font-bold text-slate-400 capitalize">{s.session}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex flex-col gap-0.5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Total Fee: <span className="text-slate-700 font-black">₹{s.totalFee || s.admissionFees || 0}</span></p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Total Paid: <span className="text-emerald-600 font-black">₹{s.paidAmount || 0}</span></p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Remaining Dues: <span className={`${((s.totalFee || Number(s.admissionFees) || 0) - (s.paidAmount || 0)) > 0 ? "text-red-600" : "text-emerald-700"} font-black`}>₹{(s.totalFee || Number(s.admissionFees) || 0) - (s.paidAmount || 0)}</span></p>
                                 </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border shadow-sm ${
                                  s.userStatus === "disabled" ? "bg-red-50 text-red-600 border-red-100" :
                                  (s.status === "active" || s.status === "approved") ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                                  s.status === "rejected" ? "bg-red-50 text-red-600 border-red-100" : 
                                  "bg-amber-50 text-amber-600 border-amber-100"
                                }`}>
                                  {s.userStatus === "disabled" ? "Disabled Account" : 
                                   (s.status === "active" || s.status === "approved") ? "Approved" : 
                                   s.status === "pending_admin" ? "Awaiting Final Approval" : s.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <div className="flex flex-col gap-1 items-end">
                                    <div className="flex gap-2">
                                      {(s.status !== "approved" && s.status !== "active" || !s.enrollmentNo) && (
                                        <button 
                                          onClick={() => handleStudentAction(s._id, "approved")} 
                                          disabled={!!studentActionId}
                                          className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
                                        >
                                          {(!s.enrollmentNo && (s.status === "active" || s.status === "approved")) ? "Assign ID" : "Approve"}
                                        </button>
                                      )}
                                      {s.status === "pending" && (
                                        <button 
                                          onClick={() => handleStudentAction(s._id, "rejected")} 
                                          disabled={!!studentActionId}
                                          className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase hover:bg-red-700 transition shadow-lg shadow-red-200"
                                        >
                                          Reject
                                        </button>
                                      )}
                                      <button onClick={() => handleStudentAction(s._id, "toggleStatus")} 
                                        className={`px-3 py-1.5 rounded-xl text-white text-[10px] font-black uppercase transition ${s.userStatus === "disabled" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-amber-500 hover:bg-amber-600"}`}>
                                        {s.userStatus === "disabled" ? "Enable" : "Disable"}
                                      </button>

                                      <button 
                                          onClick={() => setViewIdCard(s)}
                                          className="p-2 rounded-xl bg-[#0a0aa1] text-white hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                                          title="View ID Card"
                                       >
                                         <CreditCard className="w-3.5 h-3.5" />
                                       </button>

                                       <button 
                                          onClick={() => {
                                            void openStudentEditor(s);
                                          }} 
                                          className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                                          title="Edit Details"
                                       >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>

                          </Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        {/* ── STUDENT EDIT MODAL ── */}
        {editingStudent && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border border-white/20 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-500">
              <div className={`shrink-0 px-10 py-8 flex items-center justify-between border-b border-slate-100 ${
                (editingStudent.status === "active" || editingStudent.status === "approved")
                  ? "bg-linear-to-r from-emerald-50 to-white"
                  : "bg-linear-to-r from-blue-50 to-white"
              }`}>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-3xl overflow-hidden bg-white border-4 border-white shadow-2xl">
                    {studentEditValues.photo ? (
                      <Image src={String(studentEditValues.photo)} alt={editingStudent.name} width={64} height={64} unoptimized className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-50"><User className="w-8 h-8 text-slate-300" /></div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{editingStudent.name}</h3>
                    <p className="text-[10px] text-blue-600 uppercase tracking-widest font-black mt-1">Enrollment: {editingStudent.enrollmentNo}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition no-print">
                    <Printer className="w-4 h-4" /> Print Profile
                  </button>
                  <button type="button" onClick={() => setEditingStudent(null)} className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 transition shadow-sm">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 p-8">
                <form className="grid grid-cols-1 lg:grid-cols-12 gap-8" onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const { credentialEntriesText, ...restStudentEditValues } = studentEditValues as StudentEditValues & {
                      credentialEntriesText?: string;
                    };
                    const updatePayload = {
                      ...restStudentEditValues,
                      credentialEntries: editorTextToCredentialEntries(String(credentialEntriesText || "")),
                    };
                    const res = await apiFetch(`/api/admin/students/${editingStudent._id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "updateDetails", updateData: updatePayload }),
                    });
                    if (!res.ok) throw new Error("Update failed");
                    showToast("success", "Student details updated successfully");
                    setEditingStudent(null);
                    await fetchStudents();
                  } catch {
                    showToast("error", "Failed to update student");
                  }
                }}>
                  <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white rounded-4xl border border-slate-100 shadow-sm p-6">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Personal Identity</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { label: "Full Name", key: "name" },
                          { label: "Father Name", key: "fatherName" },
                          { label: "Mother Name", key: "motherName" },
                          { label: "Date of Birth", key: "dob" },
                          { label: "Gender", key: "gender", options: ["Male", "Female", "Other"] },
                          { label: "Category", key: "category", options: ["General", "OBC", "SC", "ST"] },
                          { label: "Religion", key: "religion", options: ["", "Hindu", "Muslim", "Christian", "Jain", "Buddhism", "Other"] },
                          { label: "Nationality", key: "nationality", options: ["Indian", "Other"] },
                          { label: "Marital Status", key: "maritalStatus", options: ["", "Married", "Unmarried", "Others"] },
                          { label: "Aadhar Number", key: "aadharNo" },
                          { label: "Parents/Emergency Mobile", key: "parentsMobile" },
                          { label: "Referred By", key: "referredBy" },
                        ].map((field) => (
                          <div key={field.key}>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">{field.label}</label>
                            {field.options ? (
                              <select
                                value={getStudentFieldValue(studentEditValues, field.key)}
                                onChange={(e) => setStudentEditValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition bg-white"
                              >
                                {field.options.map((opt) => (
                                  <option key={opt || "blank"} value={opt}>
                                    {opt || "Select"}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input type="text" value={getStudentFieldValue(studentEditValues, field.key)} onChange={(e) => setStudentEditValues((prev) => ({ ...prev, [field.key]: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-4xl border border-slate-100 shadow-sm p-6">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Academic & Contact</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(
                          [
                            { label: "Email Address", key: "email" },
                            { label: "Mobile Number", key: "mobile" },
                            { label: "Course Name", key: "course", kind: "courseSelect" as const },
                            { label: "Session", key: "session" },
                            { label: "Course Type", key: "courseType", kind: "courseTypeSelect" as const },
                            { label: "Highest Qualification", key: "highestQualification", kind: "qualSelect" as const },
                            { label: "College / School name", key: "qualSchool" },
                            { label: "Year of passing", key: "qualYearPassing" },
                            { label: "% Obtained", key: "qualPercentObtained" },
                            { label: "Exam Mode", key: "examMode", kind: "examSelect" as const },
                            { label: "Admission Date", key: "admissionDate" },
                            { label: "Total Fee", key: "admissionFees" },
                          ] as const
                        ).map((field) => (
                          <div key={field.key}>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">{field.label}</label>
                            {"kind" in field && field.kind === "qualSelect" ? (
                              <select
                                value={getStudentFieldValue(studentEditValues, field.key)}
                                onChange={(e) =>
                                  setStudentEditValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                                }
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition bg-white"
                              >
                                <option value="">Select qualification</option>
                                {(() => {
                                  const current = getStudentFieldValue(studentEditValues, field.key);
                                  return current && !ADMIN_QUALIFICATION_DROPDOWN_OPTIONS.includes(current as (typeof ADMIN_QUALIFICATION_DROPDOWN_OPTIONS)[number]) ? (
                                    <option value={current}>{current}</option>
                                  ) : null;
                                })()}
                                {ADMIN_QUALIFICATION_DROPDOWN_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : "kind" in field && field.kind === "courseSelect" ? (
                              <select
                                value={getStudentFieldValue(studentEditValues, field.key)}
                                onChange={(e) =>
                                  setStudentEditValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                                }
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition bg-white"
                              >
                                <option value="">Select course</option>
                                {studentCourseOptions.map((courseName) => (
                                  <option key={courseName} value={courseName}>
                                    {courseName}
                                  </option>
                                ))}
                              </select>
                            ) : "kind" in field && field.kind === "courseTypeSelect" ? (
                              <select
                                value={getStudentFieldValue(studentEditValues, field.key)}
                                onChange={(e) =>
                                  setStudentEditValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                                }
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition bg-white"
                              >
                                <option value="">Select course type</option>
                                <option value="Regular">Regular</option>
                                <option value="ODL (Open Distance Learning)">ODL (Open Distance Learning)</option>
                              </select>
                            ) : "kind" in field && field.kind === "examSelect" ? (
                              <select
                                value={(() => {
                                  const em = String(studentEditValues.examMode || "").toLowerCase();
                                  return em === "offline" ? "offline" : "online";
                                })()}
                                onChange={(e) =>
                                  setStudentEditValues((prev) => ({
                                    ...prev,
                                    examMode: e.target.value as "online" | "offline",
                                  }))
                                }
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition bg-white"
                              >
                                <option value="online">Online</option>
                                <option value="offline">Offline</option>
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={getStudentFieldValue(studentEditValues, field.key)}
                                onChange={(e) =>
                                  setStudentEditValues((prev) => ({
                                    ...prev,
                                    [field.key]:
                                      field.key === "qualYearPassing"
                                        ? e.target.value.replace(/\D/g, "").slice(0, 4)
                                        : e.target.value,
                                  }))
                                }
                                inputMode={field.key === "qualYearPassing" ? "numeric" : undefined}
                                maxLength={field.key === "qualYearPassing" ? 4 : undefined}
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                              />
                            )}
                          </div>
                        ))}
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Disability</label>
                          <select
                            value={String(Boolean(studentEditValues.disability))}
                            onChange={(e) => setStudentEditValues((prev) => ({ ...prev, disability: e.target.value === "true" }))}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                          >
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Disability Details</label>
                          <input
                            type="text"
                            value={getStudentFieldValue(studentEditValues, "disabilityDetails")}
                            onChange={(e) => setStudentEditValues((prev) => ({ ...prev, disabilityDetails: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Student Password</label>
                          <input type="text" value={String(studentEditValues.password || "")} onChange={(e) => setStudentEditValues((prev) => ({ ...prev, password: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition" placeholder="Enter student password" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Current Address</label>
                          <textarea value={String(studentEditValues.currentAddress || "")} onChange={(e) => setStudentEditValues((prev) => ({ ...prev, currentAddress: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition h-24" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Permanent Address</label>
                          <textarea value={String(studentEditValues.permanentAddress || "")} onChange={(e) => setStudentEditValues((prev) => ({ ...prev, permanentAddress: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition h-24" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-900 rounded-4xl p-6 text-white shadow-2xl">
                      <h4 className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-5">Financial Overview</h4>
                      <div className="space-y-4">
                        <p className="text-xs font-bold text-white/70">Total Fee: <span className="text-white font-black">₹{studentEditValues.admissionFees || 0}</span></p>
                        <p className="text-xs font-bold text-emerald-400">Paid: <span className="font-black">₹{editingStudent.paidAmount || 0}</span></p>
                        <p className="text-xs font-bold text-red-400">Dues: <span className="font-black">₹{(Number(studentEditValues.admissionFees || 0)) - (editingStudent.paidAmount || 0)}</span></p>
                      </div>
                    </div>

                    <div className="bg-white rounded-4xl border border-slate-100 shadow-sm p-6">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-800 mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" /> Documents & Uploads</p>
                      <p className="text-[10px] font-black uppercase tracking-wider text-blue-600 mb-3">Upload Limit: JPG/PNG up to 100KB, PDF up to 500KB</p>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: "Photo", key: "photo" }, { label: "Signature", key: "studentSignature" }, { label: "10th", key: "marksheet10th" },
                          { label: "12th", key: "marksheet12th" }, { label: "Grad", key: "graduationDoc" }, { label: "Highest", key: "highestQualDoc" },
                          { label: "Qual", key: "qualificationDoc" }, { label: "Aadhar", key: "aadharDoc" }, { label: "Other", key: "otherDocs" },
                        ].map((d) => (
                          <div key={d.key} className="flex flex-col gap-1">
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">{d.label}</p>
                            <label className="w-full h-24 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative group shadow-sm hover:border-blue-400 transition cursor-pointer">
                              {(() => {
                                const docUrl = getStudentDocUrl(String(d.key));
                                const isPdf = typeof docUrl === "string" && (docUrl.includes("application/pdf") || docUrl.toLowerCase().endsWith(".pdf"));
                                const isImage = typeof docUrl === "string" && !isPdf && (docUrl.includes("image/") || docUrl.toLowerCase().endsWith(".jpg") || docUrl.toLowerCase().endsWith(".jpeg") || docUrl.toLowerCase().endsWith(".png") || docUrl.toLowerCase().endsWith(".webp"));
                                if (isImage) return <Image src={docUrl} alt={d.label} width={160} height={96} unoptimized className="w-full h-full object-cover" />;
                                if (isPdf) return <div className="w-full h-full flex flex-col items-center justify-center text-red-500 gap-1 p-2 bg-red-50"><FileText className="w-4 h-4" /><span className="text-[7px] font-black uppercase text-center">PDF</span></div>;
                                return <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 p-2"><Upload className="w-4 h-4" /><span className="text-[7px] font-black uppercase text-center">Upload</span></div>;
                              })()}
                              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.readAsDataURL(file);
                                reader.onload = () => {
                                  const result = reader.result;
                                  if (typeof result === "string") {
                                    setStudentEditValues((prev) => ({ ...prev, [d.key]: result }));
                                  }
                                };
                              }} />
                            </label>
                            {getStudentDocUrl(String(d.key)) ? (
                              <button type="button" onClick={() => openStudentDoc(getStudentDocUrl(String(d.key)))} className="text-[8px] font-bold text-blue-600 hover:underline uppercase text-center">View</button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-12 flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                    <button type="button" onClick={() => setEditingStudent(null)} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition">Cancel</button>
                    <button type="submit" className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100">Save Changes</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
          </div>
        </main>
        {/* ID CARD VIEW MODAL */}

        {viewIdCard && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-100 flex items-center justify-center p-4">
             <div className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header with Close */}
                <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                   <div>
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Identity Preview</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reviewing ID Card for {viewIdCard.name}</p>
                   </div>
                   <button 
                     onClick={() => setViewIdCard(null)} 
                     className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 transition shadow-sm"
                   >
                     <XCircle className="w-6 h-6" />
                   </button>
                </div>
                
                {/* Preview Area with Scaling for better fit */}
                <div className="p-4 md:p-8 max-h-[80vh] overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-50/30">
                   <div className="origin-top transform scale-[0.7] sm:scale-[0.8] lg:scale-[0.9] xl:scale-100 transition-transform">
                      <StudentIdCard 
                        student={{
                          ...viewIdCard,
                          enrollmentNo: viewIdCard.enrollmentNo || "PENDING",
                          dob: viewIdCard.dob || "N/A",
                          admissionDate: viewIdCard.createdAt ? new Date(viewIdCard.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "N/A",
                          centerName: applications.find(a => a.tpCode === viewIdCard.tpCode)?.trainingPartnerName || "N/A",
                          centerAddress: applications.find(a => a.tpCode === viewIdCard.tpCode)?.trainingPartnerAddress || "N/A",
                          centerMobile: applications.find(a => a.tpCode === viewIdCard.tpCode)?.mobile || "N/A",
                          centerSign: applications.find(a => a.tpCode === viewIdCard.tpCode)?.signature || "",
                        }} 
                        backgrounds={{
                          front: bgs.id_front,
                          back: bgs.id_back
                        }}
                      />
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* ── PRINTABLE PROFILE SECTION ── */}
        {editingStudent && (
          <div id="printable-student-profile" className="hidden print:block bg-white text-slate-900 p-0 m-0 w-[210mm] min-h-[297mm]">
              <div className="p-10 flex flex-col min-h-[297mm]">
                  {/* Header Section */}
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                      <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-slate-900 flex items-center justify-center p-2.5 rounded-2xl">
                              <div className="w-full h-full border border-white/20 rounded-lg flex items-center justify-center font-black text-white text-xl italic">YCE</div>
                          </div>
                          <div>
                              <h1 className="text-2xl font-black uppercase tracking-tight leading-none text-slate-900">Student Academic Record</h1>
                              <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.3em] mt-1.5 italic">{brandName} • ISO Certified</p>
                              <div className="flex items-center gap-3 mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                  <span>Admission Report</span>
                                  <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"></span>
                                  <span>Enrollment: {editingStudent.enrollmentNo}</span>
                              </div>
                          </div>
                      </div>
                      <div className="w-28 h-36 bg-slate-50 border-2 border-slate-900 p-0.5">
                          {studentEditValues.photo ? (
                              <Image src={String(studentEditValues.photo)} alt="Student photo" width={112} height={144} unoptimized className="w-full h-full object-cover" />
                          ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 text-[6px] font-black uppercase text-center p-2 border border-dashed border-slate-200">
                                  Photo Not Provided
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                      {/* Left Column */}
                      <div className="space-y-6">
                          <section>
                              <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 border-b border-slate-100 pb-1 flex items-center gap-2">
                                  <div className="w-1 h-1 bg-blue-600 rounded-full"></div> Personal Information
                              </h2>
                              <div className="space-y-3 px-2">
                                  <PrintField label="Full Name" value={studentEditValues.name} />
                                  <PrintField label="Father's Name" value={studentEditValues.fatherName} />
                                  <PrintField label="Mother's Name" value={studentEditValues.motherName} />
                                  <PrintField label="Aadhar Number" value={studentEditValues.aadharNo} />
                                  <div className="grid grid-cols-2 gap-4">
                                      <PrintField label="Date of Birth" value={studentEditValues.dob} />
                                      <PrintField label="Gender" value={studentEditValues.gender} />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <PrintField label="Category" value={studentEditValues.category} />
                                      <PrintField label="Religion" value={studentEditValues.religion} />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <PrintField label="Nationality" value={studentEditValues.nationality} />
                                      <PrintField label="Marital Status" value={studentEditValues.maritalStatus} />
                                  </div>
                              </div>
                          </section>

                          <section>
                              <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 border-b border-slate-100 pb-1 flex items-center gap-2">
                                  <div className="w-1 h-1 bg-blue-600 rounded-full"></div> Contact Details
                              </h2>
                              <div className="space-y-3 px-2">
                                  <PrintField label="Mobile Number" value={studentEditValues.mobile} />
                                  <PrintField label="Parents / Emergency Mobile" value={studentEditValues.parentsMobile} />
                                  <PrintField label="Email Address" value={studentEditValues.email} />
                                  <PrintField label="Referred By" value={studentEditValues.referredBy} />
                              </div>
                          </section>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-6">
                          <section>
                              <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 border-b border-slate-100 pb-1 flex items-center gap-2">
                                  <div className="w-1 h-1 bg-blue-600 rounded-full"></div> Academic Details
                              </h2>
                              <div className="space-y-3 px-2">
                                  <PrintField label="Course Enrolled" value={studentEditValues.course} />
                                  <PrintField label="Center Code" value={editingStudent.tpCode} />
                                  <PrintField label="Academic Session" value={studentEditValues.session} />
                                  <PrintField label="Course Type" value={studentEditValues.courseType} />
                                  <PrintField label="Highest Qualification" value={studentEditValues.highestQualification} />
                                  <PrintField label="College / School name" value={studentEditValues.qualSchool} />
                                  <PrintField label="Year of passing" value={studentEditValues.qualYearPassing} />
                                  <PrintField label="% Obtained" value={studentEditValues.qualPercentObtained} />
                                  <PrintField label="Admission Date" value={studentEditValues.admissionDate} />
                                  <PrintField label="Total Fee" value={studentEditValues.admissionFees} />
                              </div>
                          </section>

                          <section>
                              <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 border-b border-slate-100 pb-1 flex items-center gap-2">
                                  <div className="w-1 h-1 bg-blue-600 rounded-full"></div> Residential Info
                              </h2>
                              <div className="space-y-3 px-2">
                                  <PrintField label="Current Address" value={studentEditValues.currentAddress} />
                                  <PrintField label="Permanent Address" value={studentEditValues.permanentAddress} />
                              </div>
                          </section>
                      </div>
                  </div>

                  <div className="mt-auto pt-8">
                      <div className="flex justify-between items-end border-t border-slate-100 pt-6 px-4">
                          <div className="text-center">
                              <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-1 w-40 mx-auto">Candidate Sign</p>
                              <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">{studentEditValues.name}</p>
                          </div>
                          <div className="text-center">
                              <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-1.5 mb-1 w-40 mx-auto">Director Sign</p>
                              <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">{brandName}</p>
                          </div>
                      </div>
                      <div className="mt-6 text-center">
                          <p className="text-[7px] text-slate-300 font-bold uppercase tracking-[0.4em]">This is a computer generated academic dossier. Verified on {new Date().toLocaleDateString()}.</p>
                      </div>
                  </div>
              </div>
          </div>
        )}

        <style jsx global>{`
          @media print {
            @page { margin: 0; size: A4; }
            body * { visibility: hidden !important; }
            
            /* ID CARD PRINT */
            #student-id-card-container, #student-id-card-container * {
              visibility: visible !important;
            }
            #student-id-card-container {
              position: fixed !important;
              top: 50% !important;
              left: 50% !important;
              transform: translate(-50%, -50%) scale(1.3) !important;
              width: 100% !important;
              display: flex !important;
              justify-content: center !important;
            }

            /* PROFILE PRINT - ensure it is the ONLY thing visible when printing profile */
            #printable-student-profile, #printable-student-profile * { 
                visibility: visible !important;
            }
            #printable-student-profile {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
                display: block !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                z-index: 9999 !important;
            }
            .no-print { display: none !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
