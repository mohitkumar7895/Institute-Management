"use client";

import { useRef, useState, useEffect, useMemo, type FormEvent } from "react";
import NextImage from "next/image";
import { Users, PlusCircle, CheckCircle, FileText, User, BookOpen, MapPin, CreditCard, RefreshCw, ShieldCheck, Download, XCircle, Search, Hash, X, Trash2 } from "lucide-react";
import StudentIdCard from "@/components/common/StudentIdCard";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/utils/api";
import {
  HIGHEST_QUALIFICATION_SELECT_OPTIONS,
  formatHighestQualificationMulti,
  parseHighestQualificationMulti,
  type QualificationSelectValue,
  formatQualSchoolDisplay,
} from "@/lib/qualificationOptions";
import HighestQualificationMultiSelect from "@/components/common/HighestQualificationMultiSelect";
import {
  DEFAULT_MARKSHEET_GRADE_BANDS,
  MARKSHEET_GRADE_BANDS_KEY,
  gradeFromMarksOrSubjectRows,
  parseGradeBandsJson,
  type GradeBand,
} from "@/lib/marksheetGradeScaleCore";

interface Student {
  _id: string;
  enrollmentNo: string;
  name: string;
  fatherName: string;
  motherName?: string;
  dob?: string;
  gender?: string;
  email?: string;
  currentAddress?: string;
  permanentAddress?: string;
  highestQualification?: string;
  qualSchool?: string;
  qualSchoolOther?: string;
  qualYearPassing?: string;
  qualPercentObtained?: string;
  credentialEntries?: string;
  qualificationDetail?: string;
  parentsMobile?: string;
  nationality?: string;
  religion?: string;
  maritalStatus?: string;
  disabilityDetails?: string;
  aadharNo?: string;
  category?: string;
  disability?: boolean;
  referredBy?: string;
  mobile: string;
  course: string;
  status: string;
  createdAt: string;
  admissionDate: string;
  photo?: string;
  examMode?: string;
  courseType?: string;
  offlineExamStatus?: "not_appeared" | "appeared" | "review_pending" | "published";
  offlineExamMarks?: string;
  offlineExamResult?: "Pass" | "Fail" | "Waiting";
  offlineExamCopy?: string;
  session?: string;
  aadharDoc?: string;
  studentSignature?: string;
  totalFee?: number;
  paidAmount?: number;
  duesAmount?: number;
  admissionFees?: string;
  marksheet10th?: string;
  marksheet12th?: string;
  graduationDoc?: string;
  highestQualDoc?: string;
  qualificationDoc?: string;
  otherDocs?: string;
  aadhaarNo?: string;
  parentMobile?: string;
  emergencyMobile?: string;
  referenceBy?: string;
}

interface Course {
  _id: string;
  name: string;
  shortName: string;
}

type CredentialDocumentType =
  | "marksheet10th"
  | "marksheet12th"
  | "graduationDoc"
  | "highestQualDoc"
  | "aadharDoc"
  | "otherDocs";

type CredentialEntry = {
  id: string;
  courseName: string;
  schoolName: string;
  courseTitle: string;
  yearPassing: string;
  obtained: string;
  documentFile: File | null;
};

const createCredentialEntry = (): CredentialEntry => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  courseName: "",
  schoolName: "",
  courseTitle: "",
  yearPassing: "",
  obtained: "",
  documentFile: null,
});

const guessCredentialDocumentType = (courseName: string): CredentialDocumentType => {
  const text = courseName.toLowerCase();
  if (text.includes("10") || text.includes("matric")) return "marksheet10th";
  if (text.includes("12") || text.includes("inter")) return "marksheet12th";
  if (text.includes("grad") || text.includes("b.a") || text.includes("b.sc") || text.includes("b.com")) return "graduationDoc";
  if (text.includes("aadhar") || text.includes("aadhaar")) return "aadharDoc";
  if (text.includes("post") || text.includes("master") || text.includes("pg")) return "highestQualDoc";
  return "otherDocs";
};

const QUALIFICATION_KEYS = new Set(["Below matric", "10th", "12th", "Graduation", "Other"]);

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

interface StudentManagerProps {
  isDirectAdmission?: boolean;
  initialFilter?: "all" | "pending" | "approved" | "rejected" | "disabled";
}

export default function StudentManager({ isDirectAdmission = false, initialFilter }: StudentManagerProps) {
  const [tab, setTab] = useState<"list" | "add">("list");
  const [students, setStudents] = useState<Student[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sameAddress, setSameAddress] = useState(false);
  const [currentAddr, setCurrentAddr] = useState("");
  const [disability, setDisability] = useState("No");
  const [qualSelected, setQualSelected] = useState<QualificationSelectValue[]>([]);
  const [qualOther, setQualOther] = useState("");
  const [qualSchool, setQualSchool] = useState("");
  const [qualYearPassing, setQualYearPassing] = useState("");
  const [qualPercent, setQualPercent] = useState("");
  const [credentialEntries, setCredentialEntries] = useState<CredentialEntry[]>([]);
  const [draftCredential, setDraftCredential] = useState<CredentialEntry>(createCredentialEntry());
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentFilter, setStudentFilter] = useState<"all" | "pending" | "approved" | "rejected" | "disabled">(
    initialFilter || (isDirectAdmission ? "pending" : "all")
  );
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastRegNo, setLastRegNo] = useState("");
  const [lookupRegNo, setLookupRegNo] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [requestExamStudent, setRequestExamStudent] = useState<Student | null>(null);
  const [examReqForm, setExamReqForm] = useState({ examMode: "online", preferredDate: "", preferredCenter: "" });
  const [editForm, setEditForm] = useState({ 
    name: "", fatherName: "", motherName: "", dob: "", gender: "", 
    mobile: "", parentsMobile: "", email: "", course: "", courseType: "Regular", session: "",
    admissionDate: "", currentAddress: "", permanentAddress: "", 
    highestQualification: "", qualSchool: "", qualYearPassing: "", qualPercentObtained: "",
    credentialEntriesText: "",
    aadharNo: "",
    category: "", nationality: "Indian", religion: "", maritalStatus: "", disability: false,
    disabilityDetails: "", referredBy: "", totalFee: 0
  });
  const [updating, setUpdating] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [showResultModal, setShowResultModal] = useState<Student | null>(null);
  const [viewIdCard, setViewIdCard] = useState<Student | null>(null);
  const [resultForm, setResultForm] = useState({
    marks: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [resultSubmitting, setResultSubmitting] = useState(false);
  const [resultGradeBands, setResultGradeBands] = useState<GradeBand[]>(() => [
    ...DEFAULT_MARKSHEET_GRADE_BANDS,
  ]);
  
  // Local validation states for modals
  const [modalInvalidFields, setModalInvalidFields] = useState<Set<string>>(new Set());
  const { loading: authLoading, user: authUser } = useAuth();

  const fetchStudents = async () => {
    if (authLoading || !authUser) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/atc/students?direct=${isDirectAdmission}`);
      console.log(`[StudentManager] Fetching students (direct=${isDirectAdmission}). Status: ${res.status}`);
      if(res.ok) {
        const data = await res.json();
        console.log(`[StudentManager] Received ${data.students?.length || 0} students`);
        setStudents(data.students || []);
      }
    } catch {
      console.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    if (authLoading || !authUser) return;
    try {
      const res = await apiFetch("/api/atc/courses");
      if (res.ok) {
        const data = await res.json();
        setAvailableCourses(data);
      }
    } catch { /* ignore */ }
  };


  useEffect(() => {
    if (selectedStudent) {
      const fetchMedia = async () => {
        if (authLoading || !authUser) return;
        try {
          const res = await apiFetch(`/api/atc/students/media?studentId=${selectedStudent._id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.media) {
              setSelectedStudent(prev => prev ? ({ ...prev, ...data.media }) : null);
            }
          }
        } catch (e) {
          console.error("Failed to fetch media", e);
        }
      };
      void fetchMedia();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent?._id]);

  useEffect(() => {
    if (!showResultModal) return;
    let cancelled = false;
    fetch(`/api/public/settings?key=${MARKSHEET_GRADE_BANDS_KEY}`)
      .then((r) => r.json())
      .then((d: { value?: string | null }) => {
        if (!cancelled) setResultGradeBands(parseGradeBandsJson(d?.value ?? null));
      })
      .catch(() => {
        if (!cancelled) setResultGradeBands([...DEFAULT_MARKSHEET_GRADE_BANDS]);
      });
    return () => {
      cancelled = true;
    };
  }, [showResultModal]);

  const simpleOfflineResultGrade = useMemo(() => {
    if (!showResultModal) return { pct: 0, grade: "—" as string };
    return gradeFromMarksOrSubjectRows([], resultForm.marks, 100, resultGradeBands);
  }, [showResultModal, resultForm.marks, resultGradeBands]);

  const handleLookup = async () => {
    if (!lookupRegNo.trim()) return;
    setIsFetching(true);
    setMsg(null);
    try {
      const res = await apiFetch(`/api/atc/students/fetch?regNo=${encodeURIComponent(lookupRegNo.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "error", text: data.message || "Student not found" });
        return;
      }
      
      const s = data.student;
      if (formRef.current) {
        // Auto-fill fields
        const fields = [
          'name', 'fatherName', 'motherName', 'dob', 'gender', 'category', 
          'nationality', 'religion', 'maritalStatus', 'mobile', 'parentsMobile', 
          'email', 'currentAddress', 'permanentAddress',
          'examMode', 'admissionFees'
        ];
        
        fields.forEach(field => {
          const input = formRef.current?.elements.namedItem(field) as HTMLInputElement | HTMLSelectElement;
          if (input && s[field] !== undefined) {
             input.value = s[field];
          }
        });

        // Handle specific states
        if (s.currentAddress) setCurrentAddr(s.currentAddress);
        if (s.disability) setDisability(s.disability ? "Yes" : "No");
        if (s.highestQualification) {
          const p = parseHighestQualificationMulti(s.highestQualification);
          setQualSelected(p.selected);
          setQualOther(p.otherDetail);
        } else {
          setQualSelected([]);
          setQualOther("");
        }
        setQualSchool(formatQualSchoolDisplay(s.qualSchool, s.qualSchoolOther));
        setQualYearPassing(String(s.qualYearPassing ?? "").replace(/\D/g, "").slice(0, 4));
        setQualPercent(String(s.qualPercentObtained ?? ""));
        setCredentialEntries([]);
        setDraftCredential({
          ...createCredentialEntry(),
          courseName: s.highestQualification || "",
          schoolName: formatQualSchoolDisplay(s.qualSchool, s.qualSchoolOther),
          yearPassing: String(s.qualYearPassing ?? "").replace(/\D/g, "").slice(0, 4),
          obtained: String(s.qualPercentObtained ?? ""),
        });
        
        setMsg({ type: "success", text: "Student details fetched and auto-filled!" });
      }
    } catch {
      setMsg({ type: "error", text: "Network error while fetching student data" });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (authLoading || !authUser) return;
    void fetchCourses(); // Always fetch courses on mount
    if (tab === "list") void fetchStudents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, authLoading, authUser]);

  useEffect(() => {
    const selectedQualification = qualSelected[0] === "Other" ? (qualOther.trim() || "Other") : (qualSelected[0] || "");
    setDraftCredential((prev) => {
      const shouldAutoMap = !prev.courseName.trim() || QUALIFICATION_KEYS.has(prev.courseName.trim());
      if (!shouldAutoMap) return prev;
      return { ...prev, courseName: selectedQualification };
    });
  }, [qualSelected, qualOther]);

  const handleAddSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const requiredInputs = formEl.querySelectorAll("[required]");
    const invalid = new Set<string>();
    
    requiredInputs.forEach((input) => {
      if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement || input instanceof HTMLTextAreaElement)) return;
      if (!input.value || (input instanceof HTMLInputElement && input.type === "file" && input.files?.length === 0)) {
        invalid.add(input.name);
      }
    });
    const fileInputs = formEl.querySelectorAll("input[type='file']");
    let fileError = "";
    fileInputs.forEach((input) => {
      if (!(input instanceof HTMLInputElement)) return;
      const file = input.files?.[0];
      if (file) {
        if (file.type.startsWith("image/")) {
          if (file.size > 100 * 1024) {
            invalid.add(input.name);
            fileError = "Image files (Photo, Signature, etc) must be under 100 KB.";
          }
        } else if (file.type === "application/pdf") {
          if (file.size > 500 * 1024) {
            invalid.add(input.name);
            fileError = "PDF documents (Aadhar, Marksheets, etc) must be under 500 KB.";
          }
        }
      }
    });

    if (invalid.size > 0) {
      setInvalidFields(invalid);
      setMsg({ type: "error", text: fileError || "Please fill all required fields highlighted in red." });
      setLoading(false);
      return;
    }
    setInvalidFields(new Set());
    
    setLoading(true);
    try {
      const form = new FormData(formEl);
      if (sameAddress) form.set("permanentAddress", currentAddr);
      const filledCredentialEntries = credentialEntries.filter((entry) =>
        Boolean(
          entry.courseName.trim() ||
          entry.schoolName.trim() ||
          entry.yearPassing.trim() ||
          entry.obtained.trim() ||
          entry.documentFile
        )
      );
      const firstCredential = filledCredentialEntries[0];
      form.set("highestQualification", formatHighestQualificationMulti(qualSelected, qualOther));
      form.set("qualSchool", firstCredential?.schoolName.trim() || qualSchool);
      form.set("qualSchoolOther", "");
      form.set("qualYearPassing", firstCredential?.yearPassing.trim() || qualYearPassing);
      form.set("qualPercentObtained", firstCredential?.obtained.trim() || qualPercent);
      form.set(
        "credentialEntries",
        JSON.stringify(
          filledCredentialEntries.map((entry) => ({
            courseName: entry.courseName.trim(),
            schoolName: entry.schoolName.trim(),
            courseTitle: entry.courseTitle.trim(),
            yearPassing: entry.yearPassing.trim(),
            obtained: entry.obtained.trim(),
            documentType: guessCredentialDocumentType(entry.courseName),
            documentName: entry.documentFile?.name || "",
          }))
        )
      );

      const mappedDocs = new Set<CredentialDocumentType>();
      for (const entry of filledCredentialEntries) {
        const docType = guessCredentialDocumentType(entry.courseName);
        if (entry.documentFile && !mappedDocs.has(docType)) {
          form.set(docType, entry.documentFile);
          mappedDocs.add(docType);
        }
      }

      // Auto-compress photo and signature
      const compressImage = async (file: File): Promise<File | Blob> => {
        if (!file.type.startsWith("image/")) return file;
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const MAX_SIZE = 800;
              let width = img.width; let height = img.height;
              if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
              else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
              canvas.width = width; canvas.height = height;
              const ctx = canvas.getContext("2d");
              ctx?.drawImage(img, 0, 0, width, height);
              canvas.toBlob((blob) => {
                if (blob) resolve(new File([blob], file.name, { type: "image/jpeg" }));
                else resolve(file);
              }, "image/jpeg", 0.7);
            };
          };
        });
      };

      // Extract all media files to upload separately to avoid Vercel 4.5MB limit
      const docFields = ["photo", "studentSignature", "marksheet10th", "marksheet12th", "graduationDoc", "highestQualDoc", "aadharDoc", "otherDocs"];
      const filesToUpload: { field: string, file: File | Blob }[] = [];
      
      for (const field of docFields) {
        const file = form.get(field);
        if (file instanceof File && file.size > 0) {
          // File Size Validation
          const isImage = file.type.startsWith("image/");
          const isPdf = file.type === "application/pdf";
          const sizeKb = file.size / 1024;

          if (isImage && sizeKb > 100) {
            setMsg({ type: "error", text: `${field}: Image size must be under 100KB. Currently ${Math.round(sizeKb)}KB.` });
            setLoading(false);
            return;
          }
          if (isPdf && sizeKb > 500) {
            setMsg({ type: "error", text: `${field}: PDF size must be under 500KB. Currently ${Math.round(sizeKb)}KB.` });
            setLoading(false);
            return;
          }

          const processedFile = await compressImage(file);
          filesToUpload.push({ field, file: processedFile });
          form.delete(field); // Remove from main request
        }
      }

      setMsg({ type: "success", text: "Creating student record..." });
      const res = await apiFetch("/api/atc/students", { 
        method: "POST", 
        body: form,
      });
      
      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text.slice(0, 100) || "Server returned an invalid response");
      }

      if (!res.ok) {
        const errText = JSON.stringify(data);
        throw new Error(errText);
      }

      const studentId = data.student._id;

      // Upload files sequentially
      for (let i = 0; i < filesToUpload.length; i++) {
        const { field, file } = filesToUpload[i];
        setMsg({ type: "success", text: `Uploading document ${i + 1} of ${filesToUpload.length}...` });
        
        const mediaForm = new FormData();
        mediaForm.append("studentId", studentId);
        mediaForm.append("fieldName", field);
        mediaForm.append("file", file);

        const mediaRes = await apiFetch("/api/atc/students/media", { 
          method: "POST", 
          body: mediaForm,
        });
        if (!mediaRes.ok) {
           console.warn(`Failed to upload ${field}`);
        }
      }

      setLastRegNo(data.student.enrollmentNo);
      setShowSuccessModal(true);
      setMsg({ type: "success", text: "Student admitted successfully!" });
      (e.target as HTMLFormElement).reset();
      setSameAddress(false);
      setCurrentAddr("");
      setDisability("No");
      setQualSelected([]);
      setQualOther("");
      setQualSchool("");
      setQualYearPassing("");
      setQualPercent("");
      setCredentialEntries([]);
      setDraftCredential(createCredentialEntry());
      await fetchStudents();
      setTab("list");
    } catch (err: unknown) {
      console.error("Submission Error:", err);
      let errorMsg = err instanceof Error ? err.message : "Unknown error";
      try {
         const errorData = JSON.parse(err instanceof Error ? err.message : "");
         if (errorData.message) errorMsg = errorData.message + (errorData.details ? " (" + errorData.details + ")" : "");
      } catch { /* not json */ }
      
      setMsg({ type: "error", text: "Submission Failed: " + errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestExam = async (e: FormEvent) => {
    e.preventDefault();
    if (!requestExamStudent) return;

    // Check validation
    const formEl = e.currentTarget as HTMLFormElement;
    const requiredInputs = formEl.querySelectorAll("[required]");
    const invalid = new Set<string>();
    requiredInputs.forEach((input) => {
      if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement || input instanceof HTMLTextAreaElement)) return;
      if (!input.value) invalid.add(input.name || input.id);
    });

    if (invalid.size > 0) {
      setModalInvalidFields(invalid);
      return;
    }
    setModalInvalidFields(new Set());

    setRequesting(true);
    try {
      const res = await apiFetch("/api/atc/exams/request", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          studentId: requestExamStudent._id, 
          examMode: examReqForm.examMode,
          offlineDetails: examReqForm.examMode === 'offline' ? {
            preferredDate: examReqForm.preferredDate,
            preferredCenter: examReqForm.preferredCenter
          } : undefined
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: "success", text: "Exam request submitted successfully" });
        setRequestExamStudent(null);
      } else {
        setMsg({ type: "error", text: data.message || "Request failed" });
      }
    } catch {
      setMsg({ type: "error", text: "Something went wrong" });
    } finally {
      setRequesting(false);
    }
  };

  const handleResultSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!showResultModal) return;

    // Check validation
    const formEl = e.currentTarget as HTMLFormElement;
    const requiredInputs = formEl.querySelectorAll("[required]");
    const invalid = new Set<string>();
    requiredInputs.forEach((input) => {
      if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement || input instanceof HTMLTextAreaElement)) return;
      if (!input.value) invalid.add(input.name || input.id);
    });

    if (invalid.size > 0) {
      setModalInvalidFields(invalid);
      return;
    }
    setModalInvalidFields(new Set());

    setResultSubmitting(true);
    try {
      const { grade: submitGrade } = gradeFromMarksOrSubjectRows(
        [],
        resultForm.marks,
        100,
        resultGradeBands,
      );
      const res = await apiFetch("/api/atc/exams/offline-result", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: showResultModal._id,
          offlineExamStatus: "review_pending",
          totalScore: resultForm.marks,
          offlineExamResult: parseInt(resultForm.marks, 10) >= 33 ? "Pass" : "Fail",
          grade: submitGrade,
          session: showResultModal.session?.trim() || "",
        })
      });
      if (res.ok) {
        setMsg({ type: "success", text: "Result submitted for Admin review" });
        setShowResultModal(null);
        void fetchStudents();
      } else {
        const data = await res.json();
        setMsg({ type: "error", text: data.message || "Submission failed" });
      }
    } catch {
      setMsg({ type: "error", text: "Something went wrong" });
    } finally {
      setResultSubmitting(false);
    }
  };


  const handleDirectAction = async (studentId: string, action: "approved" | "rejected") => {
    if (action === "approved") {
      const fee = prompt("Enter Total Course Fee for this student:");
      if (fee === null) return;
      if (!fee || isNaN(Number(fee))) {
        alert("Please enter a valid fee amount.");
        return;
      }
      setUpdating(true);
      try {
        const res = await apiFetch("/api/atc/students/direct-action", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ studentId, action, totalFee: Number(fee) }),
        });
        const data = await res.json();
        if (res.ok) {
          setMsg({ type: "success", text: "Application approved and forwarded to Admin review!" });
          void fetchStudents();
        } else {
          setMsg({ type: "error", text: data.message || "Action failed" });
        }
      } catch {
        setMsg({ type: "error", text: "Network error" });
      } finally {
        setUpdating(false);
      }
    } else {
      if (!confirm("Are you sure you want to reject this application?")) return;
      setUpdating(true);
      try {
        const res = await apiFetch("/api/atc/students/direct-action", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ studentId, action }),
        });
        const data = await res.json();
        if (res.ok) {
          setMsg({ type: "success", text: "Application rejected." });
          void fetchStudents();
        } else {
          setMsg({ type: "error", text: data.message || "Action failed" });
        }
      } catch {
        setMsg({ type: "error", text: "Network error" });
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleUpdateStudent = async () => {
    if (!authUser || !selectedStudent) return;
    setUpdating(true);
    try {
      const { credentialEntriesText, ...restEditForm } = editForm as typeof editForm & { credentialEntriesText?: string };
      const res = await apiFetch("/api/atc/students", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          studentId: selectedStudent._id,
          ...restEditForm,
          credentialEntries: editorTextToCredentialEntries(String(credentialEntriesText ?? "")),
          qualSchoolOther: "",
        })
      });
      if (res.ok) {
        setMsg({ type: "success", text: "Student profile updated successfully" });
        setIsEditing(false);
        void fetchStudents();
        const data = await res.json();
        setSelectedStudent(data.student);
      } else {
        const data = await res.json();
        setMsg({ type: "error", text: data.message || "Failed to update student" });
      }
    } catch {
      setMsg({ type: "error", text: "Error updating student" });
    } finally {
      setUpdating(false);
    }
  };


  const updateDraftCredential = <K extends keyof CredentialEntry>(field: K, value: CredentialEntry[K]) => {
    setDraftCredential((prev) => ({ ...prev, [field]: value }));
  };

  const addCredentialEntry = () => {
    const next = {
      ...draftCredential,
      courseName: draftCredential.courseName.trim(),
      schoolName: draftCredential.schoolName.trim(),
      courseTitle: draftCredential.courseTitle.trim(),
      yearPassing: draftCredential.yearPassing.trim(),
      obtained: draftCredential.obtained.trim(),
    };
    if (!next.courseName || !next.schoolName || !next.courseTitle || !next.yearPassing || !next.obtained) {
      setMsg({ type: "error", text: "Please fill qualification, school/college, course name, year, and obtained before adding." });
      return;
    }
    setCredentialEntries((prev) => [...prev, { ...next, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }]);
    setDraftCredential((prev) => ({ ...createCredentialEntry(), courseName: prev.courseName }));
  };

  const removeCredentialEntry = (id: string) => {
    setCredentialEntries((prev) => prev.filter((entry) => entry.id !== id));
  };
  const shouldShowCredentialEntries = qualSelected.length > 0 || qualOther.trim().length > 0;

  const inputCls = (name?: string) => `w-full px-4 py-2.5 bg-white border ${invalidFields.has(name || "") ? "border-red-800 bg-red-50/60 ring-4 ring-red-100" : "border-slate-200"} rounded-xl text-sm focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition placeholder:text-slate-400`;
  const labelCls = (name?: string) =>
    `block text-[11px] font-bold uppercase tracking-wider mb-1.5 ${invalidFields.has(name || "") ? "text-red-800 after:ml-2 after:text-[10px] after:font-black after:tracking-normal after:text-red-700 after:content-['Required_field']" : "text-slate-500"}`;
  const sectionCls = "bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5";
  const basicLabelCls = "block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5";
  const basicInputCls = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition placeholder:text-slate-400";
  const pickValue = (...values: Array<unknown>) => {
    for (const value of values) {
      const text = String(value ?? "").trim();
      if (text) return text;
    }
    return "N/A";
  };

  // Modal Input Styles with validation
  const modalInputCls = (name?: string) => `w-full px-4 py-2.5 bg-white border ${modalInvalidFields.has(name || "") ? "border-red-700 ring-4 ring-red-50" : "border-slate-200"} rounded-xl text-sm focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition placeholder:text-slate-400`;

  const filteredStudents = students.filter(s => {
    // If we are in Front Admission mode
    if (isDirectAdmission) {
      if (studentFilter === "all") return true; 
      if (studentFilter === "pending") return s.status === "pending_atc";
      if (studentFilter === "approved") return s.status === "pending_admin";
      if (studentFilter === "disabled") return s.status === "disabled" || s.status === "blocked";
      return s.status === studentFilter;
    } 
    
    // If we are in My Students mode
    else {
      if (studentFilter === "all") return true; // Show everything in "All"
      if (studentFilter === "pending") return s.status === "pending" || s.status === "pending_admin";
      if (studentFilter === "approved") return s.status === "approved" || s.status === "active";
      if (studentFilter === "rejected") return s.status === "rejected";
      if (studentFilter === "disabled") return s.status === "disabled" || s.status === "blocked";
      return s.status === studentFilter;
    }
  });

  const selectedDirectStudents = isDirectAdmission
    ? students.filter((student) => selectedStudents.includes(student._id))
    : [];
  const hasApprovedSelected = selectedDirectStudents.some((student) =>
    ["approved", "active", "pending_admin"].includes(student.status),
  );
  const hasRejectedSelected = selectedDirectStudents.some((student) => student.status === "rejected");
  const hasPendingSelected = selectedDirectStudents.some((student) =>
    ["pending", "pending_atc"].includes(student.status),
  );
  const showBulkApprove = isDirectAdmission && (hasRejectedSelected || hasPendingSelected);
  const showBulkReject = isDirectAdmission && (hasApprovedSelected || hasPendingSelected);

  const handleBulkDirectAction = async (action: "approved" | "rejected") => {
    if (!isDirectAdmission || selectedDirectStudents.length === 0) return;

    const targetStudents = selectedDirectStudents.filter((student) => {
      if (action === "approved") return ["rejected", "pending", "pending_atc"].includes(student.status);
      return ["approved", "active", "pending_admin", "pending", "pending_atc"].includes(student.status);
    });

    if (targetStudents.length === 0) {
      setMsg({ type: "error", text: `No eligible students found for ${action}.` });
      return;
    }

    let totalFee = 0;
    if (action === "approved") {
      const feeInput = prompt("Enter Total Course Fee for selected students:");
      if (feeInput === null) return;
      const parsedFee = Number(feeInput);
      if (!feeInput || Number.isNaN(parsedFee)) {
        setMsg({ type: "error", text: "Please enter a valid fee amount." });
        return;
      }
      totalFee = parsedFee;
    } else if (!confirm("Are you sure you want to reject selected applications?")) {
      return;
    }

    setUpdating(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const student of targetStudents) {
        const res = await apiFetch("/api/atc/students/direct-action", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            action === "approved"
              ? { studentId: student._id, action, totalFee }
              : { studentId: student._id, action },
          ),
        });

        if (res.ok) successCount += 1;
        else failCount += 1;
      }

      if (successCount > 0) {
        setMsg({
          type: "success",
          text: `${successCount} application(s) ${action === "approved" ? "approved" : "rejected"} successfully${failCount > 0 ? `, ${failCount} failed` : ""}.`,
        });
      } else {
        setMsg({ type: "error", text: `Failed to ${action} selected applications.` });
      }

      setSelectedStudents([]);
      void fetchStudents();
    } catch {
      setMsg({ type: "error", text: "Bulk action failed due to network error." });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-slate-50/30 rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-150">
      {/* Tabs */}
      <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-100 bg-white">
        <button
          onClick={() => setTab("list")}
          className={`px-4 py-3 text-sm font-bold transition-all relative ${tab === "list" ? "text-green-600" : "text-slate-400 hover:text-slate-600"}`}
        >
          <span className="flex items-center gap-2"><Users className="w-4 h-4" /> {isDirectAdmission ? "Front Admission Requests" : "All Students"}</span>
          {tab === "list" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-t-full" />}
        </button>
        {!isDirectAdmission && (
          <button
            onClick={() => setTab("add")}
            className={`px-4 py-3 text-sm font-bold transition-all relative ${tab === "add" ? "text-green-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            <span className="flex items-center gap-2"><PlusCircle className="w-4 h-4" /> New Admission</span>
            {tab === "add" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-t-full" />}
          </button>
        )}
      </div>

      <div className="p-6">
        {msg && (
          <div className={`mb-6 p-4 rounded-2xl text-sm font-bold border animate-in fade-in slide-in-from-top-2 ${msg.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {msg.text}
          </div>
        )}

        {tab === "list" && (
          <div className="animate-in fade-in duration-300">
            {/* Status Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {(isDirectAdmission
                ? (["all", "pending", "approved", "rejected"] as const)
                : (["all", "pending", "approved", "rejected", "disabled"] as const)).map((s) => {

                return (
                  <button
                    key={s}
                    onClick={() => setStudentFilter(s)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                      studentFilter === s
                        ? "bg-green-600 text-white border-green-600 shadow-lg shadow-green-100 scale-105"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {s === "all" ? (isDirectAdmission ? "All Requests" : "All Students") : s}
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 gap-4">
                <span className="w-10 h-10 rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
                <p className="text-sm font-bold text-slate-400">Loading student records...</p>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Bulk Action Bar */}
                {selectedStudents.length > 0 && (
                  <div className="bg-green-700 px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-4 text-white text-xs font-bold">
                       <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">{selectedStudents.length}</div>
                       <span className="uppercase tracking-widest">Students Selected</span>
                    </div>
                    <div className="flex items-center gap-3">
                       {isDirectAdmission && (
                         <>
                           {showBulkApprove && (
                             <button
                               disabled={updating}
                               onClick={() => void handleBulkDirectAction("approved")}
                               className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase hover:bg-emerald-700 transition disabled:opacity-50"
                             >
                               Approve
                             </button>
                           )}
                           {showBulkReject && (
                             <button
                               disabled={updating}
                               onClick={() => void handleBulkDirectAction("rejected")}
                               className="px-4 py-1.5 rounded-lg bg-red-100 text-red-600 text-[10px] font-black uppercase hover:bg-red-200 transition disabled:opacity-50"
                             >
                               Reject
                             </button>
                           )}
                         </>
                       )}
                       <button onClick={() => void fetchStudents()} className="px-4 py-1.5 rounded-lg bg-white/10 text-white text-[10px] font-black uppercase hover:bg-white/20 transition">Refresh</button>
                       <button onClick={() => setSelectedStudents([])} className="px-4 py-1.5 rounded-lg bg-white/10 text-white text-[10px] font-black uppercase hover:bg-white/20 transition">Cancel</button>
                    </div>
                  </div>
                )}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4">
                         <input 
                           type="checkbox" 
                           className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                           checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                           onChange={(e) => {
                             if (e.target.checked) setSelectedStudents(filteredStudents.map(s => s._id));
                             else setSelectedStudents([]);
                           }}
                         />
                      </th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Enrollment no.</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Student Details</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Course Info</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Fee</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Paid</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Dues</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                          No students found matching this criteria.
                        </td>
                      </tr>
                    ) : filteredStudents.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                            checked={selectedStudents.includes(s._id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedStudents(prev => [...prev, s._id]);
                              else setSelectedStudents(prev => prev.filter(id => id !== s._id));
                            }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                            {s.enrollmentNo || "PENDING"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                               {s.photo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={s.photo} alt={`${s.name} photo`} className="w-full h-full object-cover" />
                               ) : <User className="w-4 h-4 text-slate-400" />}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 leading-none mb-1">{s.name}</p>
                              <p className="text-[10px] text-slate-500 font-medium">S/O: {s.fatherName} | {s.mobile}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-semibold text-slate-700 leading-tight">{s.course}</p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase">{s.admissionDate || new Date(s.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-slate-700">₹{s.totalFee || s.admissionFees || 0}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-emerald-600">₹{s.paidAmount || 0}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-sm font-bold ${((s.totalFee || Number(s.admissionFees) || 0) - (s.paidAmount || 0)) > 0 ? "text-red-500" : "text-emerald-600"}`}>
                            ₹{(s.totalFee || Number(s.admissionFees) || 0) - (s.paidAmount || 0)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                           <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                             (s.status === "approved" || s.status === "active") ? "bg-emerald-100 text-emerald-700" : 
                             s.status === "rejected" ? "bg-red-100 text-red-700" :
                             "bg-amber-100 text-amber-700"
                           }`}>
                             {(s.status === "approved" || s.status === "active") ? "Approved" : 
                              s.status === "pending_admin" ? "Awaiting Admin" :
                              s.status === "rejected" ? "Rejected" : "Pending"}
                           </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {isDirectAdmission && s.status === "pending_atc" && (
                              <div className="flex items-center gap-2">
                                <button 
                                  disabled={updating}
                                  onClick={() => handleDirectAction(s._id, "approved")}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button 
                                  disabled={updating}
                                  onClick={() => handleDirectAction(s._id, "rejected")}
                                  className="px-3 py-1.5 rounded-lg bg-red-100 text-red-600 text-[10px] font-black uppercase hover:bg-red-200 transition disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            )}

                            <button 
                              onClick={() => {
                                setSelectedStudent(s);
                                setEditForm({
                                  name: s.name || "",
                                  fatherName: s.fatherName || "",
                                  motherName: s.motherName || "",
                                  dob: s.dob || "",
                                  gender: s.gender || "Male",
                                  mobile: s.mobile || "",
                                  parentsMobile: s.parentsMobile || "",
                                  email: s.email || "",
                                  course: s.course || "",
                                  courseType: s.courseType || "Regular",
                                  session: s.session || "",
                                  admissionDate: s.admissionDate || "",
                                  currentAddress: s.currentAddress || "",
                                  permanentAddress: s.permanentAddress || "",
                                  highestQualification: s.highestQualification || "",
                                  qualSchool: formatQualSchoolDisplay(s.qualSchool, s.qualSchoolOther),
                                  qualYearPassing: String(s.qualYearPassing || "").replace(/\D/g, "").slice(0, 4),
                                  qualPercentObtained: s.qualPercentObtained || "",
                                  credentialEntriesText: credentialEntriesToEditorText(s.credentialEntries) || fallbackCredentialTextFromStudent(s),
                                  aadharNo: s.aadharNo || "",
                                  category: s.category || "General",
                                  nationality: s.nationality || "Indian",
                                  religion: s.religion || "",
                                  maritalStatus: s.maritalStatus || "Single",
                                  disability: !!s.disability,
                                  disabilityDetails: s.disabilityDetails || "",
                                  referredBy: s.referredBy || "",
                                  totalFee: s.totalFee || 0
                                });
                              }}
                              className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 underline underline-offset-4 decoration-2"
                            >
                              View Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    )}

        {tab === "add" && (
          <form ref={formRef} onSubmit={handleAddSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 0. Enrollment lookup (optional, existing student) */}
            <div className="bg-blue-600/5 p-6 rounded-3xl border border-blue-100 flex flex-col md:flex-row items-end gap-4 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
               <div className="flex-1 w-full">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                     <Search className="w-3 h-3" /> Enrollment lookup (existing student)
                     <span className="text-slate-400 font-bold ml-auto">OPTIONAL</span>
                  </label>
                  <input 
                    type="text" 
                    value={lookupRegNo}
                    onChange={(e) => setLookupRegNo(e.target.value)}
                    onBlur={() => { if(lookupRegNo) handleLookup(); }}
                    className="w-full px-5 py-3.5 bg-white border border-blue-100 rounded-2xl text-sm font-bold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition placeholder:text-slate-300" 
                    placeholder="Enter enrollment number to auto-fill details (e.g. YCE/2024/...)" 
                  />
               </div>
               <button 
                 type="button" 
                 onClick={handleLookup}
                 disabled={isFetching || !lookupRegNo}
                 className="h-13 px-8 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-3 whitespace-nowrap shadow-lg shadow-blue-100"
               >
                 {isFetching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <RefreshCw className="w-4 h-4" />}
                 {isFetching ? "Searching..." : "Fetch Details"}
               </button>
            </div>

            {/* 1. Personal Information */}
            <div className={sectionCls}>
              <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-wide border-l-4 border-blue-500 pl-3">
                <User className="w-4 h-4 text-blue-500" /> Student Identity
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                  <label className={labelCls("name")}>Full Name (as per ID) *</label>
                  <input required name="name" className={inputCls("name")} placeholder="Student's Legal Name" />
                </div>
                <div>
                  <label className={labelCls("fatherName")}>Father&apos;s Name *</label>
                  <input required name="fatherName" className={inputCls("fatherName")} placeholder="Father&apos;s Name" />
                </div>
                <div>
                  <label className={labelCls("motherName")}>Mother&apos;s Name *</label>
                  <input required name="motherName" className={inputCls("motherName")} placeholder="Mother&apos;s Name" />
                </div>
                <div><label className={labelCls("dob")}>Date of Birth *</label><input required type="date" name="dob" className={inputCls("dob")} /></div>
                <div>
                  <label className={labelCls("gender")}>Gender *</label>
                  <select required name="gender" className={inputCls("gender")}>
                    <option value="">Select Gender</option><option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div><label className={labelCls("category")}>Category *</label>
                  <select required name="category" className={inputCls("category")}>
                    <option>General</option><option>OBC</option><option>SC</option><option>ST</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 pt-2">
                <div><label className={labelCls("nationality")}>Nationality</label><input name="nationality" defaultValue="Indian" className={inputCls("nationality")} /></div>
                <div><label className={labelCls("religion")}>Religion</label>
                  <select name="religion" className={inputCls("religion")}>
                    <option value="">Select</option><option>Hindu</option><option>Muslim</option><option>Christian</option><option>Jain</option><option>Buddhism</option><option>Other</option>
                  </select>
                </div>
                <div><label className={labelCls("maritalStatus")}>Marital Status</label>
                  <select name="maritalStatus" className={inputCls("maritalStatus")}>
                    <option value="">Select</option>
                    <option>Married</option>
                    <option>Unmarried</option>
                    <option>Others</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls("disability")}>Physically Disability *</label>
                  <select required name="disability" className={inputCls("disability")} value={disability} onChange={e => setDisability(e.target.value)}>
                    <option>No</option><option>Yes</option>
                  </select>
                </div>
                {disability === "Yes" && (
                  <div className="md:col-span-4 animate-in zoom-in-95 duration-200">
                    <label className={labelCls("disabilityDetails")}>Disability Details *</label>
                    <input required={disability === "Yes"} name="disabilityDetails" className={inputCls("disabilityDetails")} placeholder="Please describe provide details" />
                  </div>
                )}
              </div>
            </div>

            {/* 2. Admission Details */}
            <div className={sectionCls}>
              <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-wide border-l-4 border-green-500 pl-3">
                <CreditCard className="w-4 h-4 text-green-500" /> Total Fee Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                  <label className={labelCls("session")}>Session *</label>
                  <input required name="session" className={inputCls("session")} placeholder="e.g. 2024-25" />
                </div>
                <div>
                  <label className={labelCls("course")}>Course *</label>
                  <select required name="course" className={inputCls("course")} onChange={() => void fetchCourses()}>
                    <option value="">{availableCourses.length > 0 ? "Select Course" : "Select Course"}</option>
                    {availableCourses.map(c => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                   <label className={labelCls("courseType")}>Preference Mode *</label>
                   <select required name="courseType" className={inputCls("courseType")}>
                      <option value="Regular">Regular</option>
                      <option value="ODL (Open Distance Learning)">ODL (Open Distance Learning)</option>
                   </select>
                </div>
                <div>
                  <label className={labelCls("examMode")}>Exam Mode *</label>
                  <select required name="examMode" className={inputCls("examMode")}>
                    <option value="online">Online Mode</option>
                    <option value="offline">Offline Mode (Center Based)</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls("totalFee")}>Total Fee (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input required type="number" name="admissionFees" className={inputCls("totalFee") + " pl-8 font-bold"} placeholder="Total Fee" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls("admissionDate")}>Admission Date *</label>
                  <input required type="date" name="admissionDate" className={inputCls("admissionDate")} defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>
            </div>

            {/* 3. Contact information */}
            <div className={sectionCls}>
              <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-wide border-l-4 border-amber-500 pl-3">
                <MapPin className="w-4 h-4 text-amber-500" /> Contact & Residence
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className={labelCls("mobile")}>Student Mobile *</label><input required name="mobile" className={inputCls("mobile")} placeholder="10-digit primary number" maxLength={10} /></div>
                <div><label className={labelCls("parentsMobile")}>Parents Mobile</label><input name="parentsMobile" className={inputCls("parentsMobile")} placeholder="Emergency contact" maxLength={10} /></div>
                <div className="md:col-span-2"><label className={labelCls("email")}>Email Address</label><input type="email" name="email" className={inputCls("email")} placeholder="Student's email ID" /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
                <div>
                  <label className={labelCls("currentAddress")}>Current Address *</label>
                  <textarea 
                    required 
                    name="currentAddress" 
                    rows={3} 
                    className={inputCls("currentAddress")} 
                    placeholder="Complete block, post, city address" 
                    value={currentAddr}
                    onChange={(e) => setCurrentAddr(e.target.value)}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelCls("permanentAddress")}>Permanent Address *</label>
                    <label className="flex items-center gap-2 text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full cursor-pointer hover:bg-green-100 transition border border-green-100">
                      <input 
                        type="checkbox" 
                        className="w-3 h-3 rounded border-green-300 text-green-600 focus:ring-green-500"
                        checked={sameAddress}
                        onChange={(e) => setSameAddress(e.target.checked)}
                      />
                      SAME AS CURRENT
                    </label>
                  </div>
                  <textarea 
                    required={!sameAddress}
                    disabled={sameAddress}
                    name="permanentAddress" 
                    rows={3} 
                    className={`${inputCls("permanentAddress")} ${sameAddress ? "bg-slate-50/50 text-slate-400 border-dashed" : ""}`}
                    placeholder={sameAddress ? "Mailing address is same as current" : "Official residence address"}
                    value={sameAddress ? currentAddr : undefined}
                  />
                </div>
              </div>
            </div>

            {/* 4. Credentials & Docs */}
            <div className={sectionCls}>
              <h4 className="flex items-center gap-2 text-sm font-black text-slate-800 uppercase tracking-wide border-l-4 border-purple-500 pl-3">
                <FileText className="w-4 h-4 text-purple-500" /> Credentials & Documentation
              </h4>
              <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Upload Limit: JPG/PNG up to 100KB, PDF up to 500KB</p>
              <div className="space-y-5">
                <HighestQualificationMultiSelect
                  selected={qualSelected}
                  otherDetail={qualOther}
                  onSelectedChange={setQualSelected}
                  onOtherDetailChange={setQualOther}
                  labelCls={labelCls}
                  inputCls={inputCls}
                />
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="space-y-3">
                    {credentialEntries.length > 0 && (
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">Added Details</p>
                    )}
                    {credentialEntries.map((entry, index) => (
                      <div key={entry.id} className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="mb-2 text-[11px] font-bold text-slate-600">
                          Details for: <span className="text-slate-900">{entry.courseName.trim() || `Qualification ${index + 1}`}</span>
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div><label className={labelCls("courseName")}>Qualification</label><input type="text" value={entry.courseName} readOnly className={`${inputCls("courseName")} py-2.5 bg-slate-50`} /></div>
                          <div><label className={labelCls("qualSchool")}>School / College</label><input type="text" value={entry.schoolName} readOnly className={`${inputCls("qualSchool")} py-2.5 bg-slate-50`} /></div>
                          <div><label className={labelCls("courseTitle")}>Course Name</label><input type="text" value={entry.courseTitle} readOnly className={`${inputCls("courseTitle")} py-2.5 bg-slate-50`} /></div>
                          <div><label className={labelCls("qualYearPassing")}>Year of Passing</label><input type="text" value={entry.yearPassing} readOnly className={`${inputCls("qualYearPassing")} py-2.5 bg-slate-50`} /></div>
                          <div><label className={labelCls("qualPercentObtained")}>Obtained / Grade</label><input type="text" value={entry.obtained} readOnly className={`${inputCls("qualPercentObtained")} py-2.5 bg-slate-50`} /></div>
                          <div className="flex items-end gap-2">
                            <span className="text-[10px] font-semibold text-slate-500">
                              {entry.documentFile?.name || "No file"}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeCredentialEntry(entry.id)}
                              className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-red-700 hover:bg-red-100"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {shouldShowCredentialEntries ? (
                    <div className="rounded-xl border border-green-100 bg-green-50/40 p-3 mt-3">
                      <p className="mb-2 text-[11px] font-bold text-slate-700">Add qualification details</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className={labelCls("courseName")}>Qualification</label>
                          <input
                            type="text"
                            value={draftCredential.courseName}
                            readOnly
                            className={`${inputCls("courseName")} py-2.5 bg-slate-50`}
                            placeholder="e.g. 10th, 12th, Graduation"
                            autoComplete="off"
                          />
                        </div>
                        <div>
                          <label className={labelCls("qualSchool")}>School / College</label>
                          <input
                            type="text"
                            value={draftCredential.schoolName}
                            onChange={(e) => updateDraftCredential("schoolName", e.target.value)}
                            className={`${inputCls("qualSchool")} py-2.5`}
                            placeholder="Institution name"
                            autoComplete="off"
                          />
                        </div>
                        <div>
                          <label className={labelCls("courseTitle")}>Course Name</label>
                          <input
                            type="text"
                            value={draftCredential.courseTitle}
                            onChange={(e) => updateDraftCredential("courseTitle", e.target.value)}
                            className={`${inputCls("courseTitle")} py-2.5`}
                            placeholder="e.g. Science, Commerce, BCA"
                            autoComplete="off"
                          />
                        </div>
                        <div>
                          <label className={labelCls("qualYearPassing")}>Year of Passing</label>
                          <input
                            type="text"
                            value={draftCredential.yearPassing}
                            onChange={(e) =>
                              updateDraftCredential("yearPassing", e.target.value.replace(/\D/g, "").slice(0, 4))
                            }
                            className={`${inputCls("qualYearPassing")} py-2.5`}
                            placeholder="YYYY"
                            inputMode="numeric"
                            maxLength={4}
                            autoComplete="off"
                          />
                        </div>
                        <div>
                          <label className={labelCls("qualPercentObtained")}>Obtained / Grade</label>
                          <input
                            type="text"
                            value={draftCredential.obtained}
                            onChange={(e) => updateDraftCredential("obtained", e.target.value)}
                            className={`${inputCls("qualPercentObtained")} py-2.5`}
                            placeholder="e.g. 72% / A Grade"
                            autoComplete="off"
                          />
                        </div>
                        <div>
                          <label className={labelCls("credentialDoc")}>Upload Document (Max 500KB)</label>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => updateDraftCredential("documentFile", e.target.files?.[0] ?? null)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[11px] text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-slate-100 file:px-3 file:py-1.5 file:text-[10px] file:font-bold file:uppercase file:text-slate-700 file:cursor-pointer"
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={addCredentialEntry}
                          className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-100 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-green-800 hover:bg-green-200"
                        >
                          <PlusCircle className="h-4 w-4" /> Add
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Select qualification to continue.
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelCls("aadharNo")}>Aadhar Number</label><input name="aadharNo" className={`${inputCls("aadharNo")} py-3 text-base`} placeholder="12-digit UID" maxLength={12} /></div>
                  <div><label className={labelCls("referredBy")}>Referred By</label><input name="referredBy" className={`${inputCls("referredBy")} py-3 text-base`} placeholder="Staff or Partner name" /></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                  {[
                    { label: "Student Photo (JPG/PNG) * - Max 100KB", name: "photo", required: true },
                    { label: "Student Signature (JPG/PNG) * - Max 100KB", name: "studentSignature", required: true },
                  ].map(doc => (
                    <div key={doc.name} className={`group relative p-3 rounded-2xl border transition-all ${invalidFields.has(doc.name) ? "border-red-800 bg-red-50/60 ring-4 ring-red-100" : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200"}`}>
                      <label className={`block text-[10px] font-black uppercase mb-2 tracking-tighter ${invalidFields.has(doc.name) ? "text-red-800" : "text-slate-400 group-hover:text-blue-500"}`}>
                        {doc.label}
                        {invalidFields.has(doc.name) && <span className="ml-1 normal-case text-[10px] tracking-normal text-red-700">Required field</span>}
                      </label>
                      <input 
                        type="file" 
                        name={doc.name} 
                        required={doc.required}
                        accept="image/*,application/pdf" 
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[11px] text-slate-600 file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-slate-100 file:px-3 file:py-1.5 file:text-[10px] file:font-black file:uppercase file:text-slate-700 file:cursor-pointer"
                      />
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button disabled={loading} type="submit" className="w-full md:w-auto flex items-center justify-center gap-2 px-10 py-4 bg-green-600 text-white rounded-2xl text-sm font-black hover:bg-green-700 transition shadow-xl shadow-green-100 active:scale-95 disabled:opacity-75">
                {loading ? <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"/> : <CheckCircle className="w-5 h-5" />}
                {loading ? "PROCESSING..." : "COMPLETE TOTAL FEE & ADMIT"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Premium Student Profile Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border border-white/20 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-500">
            {/* Modal Header */}
            <div className={`shrink-0 px-10 py-8 flex items-center justify-between border-b border-slate-100 ${
              (selectedStudent.status === 'active' || selectedStudent.status === 'approved') 
                ? 'bg-linear-to-r from-emerald-50 to-white' 
                : 'bg-linear-to-r from-blue-50 to-white'
            }`}>
              <div className="flex items-center gap-6">
                <div className="relative group">
                   <div className="w-20 h-20 rounded-3xl overflow-hidden bg-white border-4 border-white shadow-2xl transition-transform group-hover:scale-105 duration-300">
                      {selectedStudent.photo ? (
                        <NextImage src={selectedStudent.photo} alt={`${selectedStudent.name} photo`} width={80} height={80} unoptimized className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-50">
                           <User className="w-8 h-8 text-slate-300" />
                        </div>
                      )}
                   </div>
                   <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-2xl border-4 border-white flex items-center justify-center shadow-lg ${
                     (selectedStudent.status === 'active' || selectedStudent.status === 'approved') ? 'bg-emerald-500' : 'bg-blue-500'
                   }`}>
                      <CheckCircle className="w-4 h-4 text-white" />
                   </div>
                </div>
                <div>
                   <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedStudent.name}</h3>
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        (selectedStudent.status === 'active' || selectedStudent.status === 'approved')
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        {selectedStudent.status.replace('_', ' ')}
                      </span>
                   </div>
                   <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-blue-600" /> {selectedStudent.enrollmentNo || "ENROLLMENT PENDING"}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-blue-600" /> {selectedStudent.course}</span>
                   </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <button 
                    onClick={handleUpdateStudent}
                    disabled={updating}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2"
                  >
                    {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Save Profile
                  </button>
                ) : (
                  (selectedStudent.status === 'pending' || selectedStudent.status === 'pending_admin' || selectedStudent.status === 'pending_atc') && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" /> Edit Profile
                    </button>
                  )
                )}
                <button 
                  onClick={() => { setSelectedStudent(null); setIsEditing(false); }}
                  className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all shadow-sm"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 p-10">
              {/* Profile Overview Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: Essential Stats & Info */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Personal Information Card */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-8">
                    <div className="flex items-center justify-between">
                       <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                          <User className="w-4 h-4 text-blue-600" /> Personal Identity details
                       </h4>
                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Verified Record</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-12">
                       {[
                         { label: "Father Name", key: "fatherName" },
                         { label: "Mother Name", key: "motherName" },
                         { label: "Date of Birth", key: "dob", type: "date" },
                         { label: "Gender", key: "gender", type: "select", options: ["Male", "Female", "Other"] },
                         { label: "Category", key: "category", type: "select", options: ["General", "OBC", "SC", "ST"] },
                         { label: "Religion", key: "religion" },
                         { label: "Aadhar Number", key: "aadharNo" },
                         { label: "Nationality", key: "nationality" },
                         { label: "Marital Status", key: "maritalStatus", type: "select", options: ["Single", "Married", "Others"] },
                         { label: "Disability", key: "disability" },
                         { label: "Disability Details", key: "disabilityDetails" },
                       ].map((item, idx) => (
                         <div key={idx} className="space-y-1.5">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                            {isEditing ? (
                              item.type === "select" ? (
                                <select 
                                  value={String(editForm[item.key as keyof typeof editForm] ?? "")}
                                  onChange={e => setEditForm({...editForm, [item.key]: e.target.value})}
                                  className={modalInputCls(item.key)}
                                >
                                  {item.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              ) : (
                                <input 
                                  type={item.type || "text"}
                                  value={String(editForm[item.key as keyof typeof editForm] ?? "")}
                                  onChange={e => setEditForm({...editForm, [item.key]: e.target.value})}
                                  className={modalInputCls(item.key)}
                                />
                              )
                            ) : (
                              <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                                 {item.key === 'dob' 
                                   ? (selectedStudent.dob ? new Date(selectedStudent.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A') 
                                   : item.key === "disability"
                                     ? (selectedStudent.disability ? "Yes" : "No")
                                   : pickValue(
                                      selectedStudent[item.key as keyof Student],
                                      item.key === "aadharNo" ? selectedStudent.aadhaarNo : "",
                                     )}
                              </p>
                            )}
                         </div>
                       ))}
                    </div>
                  </div>
                  {/* Contact & Location Card */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-8">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                       <MapPin className="w-4 h-4 text-rose-600" /> Contact & Residence
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-6">
                          <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-blue-200 transition-colors">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Primary Mobile</p>
                             {isEditing ? (
                               <input 
                                 type="text"
                                 value={editForm.mobile}
                                 onChange={e => setEditForm({...editForm, mobile: e.target.value})}
                                 className={modalInputCls("mobile")}
                               />
                             ) : (
                               <p className="text-lg font-black text-slate-800 tracking-tighter flex items-center gap-2">
                                  {selectedStudent.mobile}
                                  <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-600 text-[8px] font-black uppercase">Primary</span>
                               </p>
                             )}
                          </div>
                          <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-blue-200 transition-colors">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Parents/Emergency Mobile</p>
                             {isEditing ? (
                               <input 
                                 type="text"
                                 value={editForm.parentsMobile}
                                 onChange={e => setEditForm({...editForm, parentsMobile: e.target.value})}
                                 className={modalInputCls("parentsMobile")}
                               />
                             ) : (
                              <p className="text-lg font-black text-slate-800 tracking-tighter">{pickValue(selectedStudent.parentsMobile, selectedStudent.parentMobile, selectedStudent.emergencyMobile)}</p>
                             )}
                          </div>
                          <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-blue-200 transition-colors">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</p>
                             {isEditing ? (
                               <input 
                                 type="email"
                                 value={editForm.email}
                                 onChange={e => setEditForm({...editForm, email: e.target.value})}
                                 className={modalInputCls("email")}
                               />
                             ) : (
                              <p className="text-sm font-bold text-slate-800 lowercase tracking-tight">{pickValue(selectedStudent.email)}</p>
                             )}
                          </div>
                          <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-blue-200 transition-colors">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Referred By</p>
                             {isEditing ? (
                               <input
                                 type="text"
                                 value={editForm.referredBy}
                                 onChange={e => setEditForm({...editForm, referredBy: e.target.value})}
                                 className={modalInputCls("referredBy")}
                               />
                             ) : (
                               <p className="text-base font-black text-slate-800 tracking-tight">{pickValue(selectedStudent.referredBy, selectedStudent.referenceBy)}</p>
                             )}
                          </div>
                       </div>
                       <div className="space-y-6">
                          <div className="p-6 bg-blue-50/30 rounded-4xl border border-blue-100 h-full">
                             <div className="space-y-6">
                                <div>
                                   <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">Current Address</p>
                                   {isEditing ? (
                                     <textarea 
                                       value={editForm.currentAddress}
                                       onChange={e => setEditForm({...editForm, currentAddress: e.target.value})}
                                       className={modalInputCls("currentAddress") + " h-20"}
                                     />
                                   ) : (
                                     <p className="text-xs font-bold text-slate-700 leading-relaxed uppercase">{selectedStudent.currentAddress}</p>
                                   )}
                                </div>
                                <div className="pt-6 border-t border-blue-100">
                                   <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">Permanent Address</p>
                                   {isEditing ? (
                                     <textarea 
                                       value={editForm.permanentAddress}
                                       onChange={e => setEditForm({...editForm, permanentAddress: e.target.value})}
                                       className={modalInputCls("permanentAddress") + " h-20"}
                                     />
                                   ) : (
                                     <p className="text-xs font-bold text-slate-700 leading-relaxed uppercase">{selectedStudent.permanentAddress}</p>
                                   )}
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Academic Profile Card */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-8">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                       <BookOpen className="w-4 h-4 text-emerald-600" /> Academic & admission info
                    </h4>
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className={basicLabelCls}>College / School name</label>
                            <input
                              type="text"
                              value={editForm.qualSchool}
                              onChange={(e) => setEditForm({ ...editForm, qualSchool: e.target.value })}
                              className={modalInputCls("qualSchool")}
                              placeholder="e.g. as on marksheet"
                              autoComplete="off"
                            />
                          </div>
                          <div>
                            <label className={basicLabelCls}>Year of passing</label>
                            <input
                              type="text"
                              value={editForm.qualYearPassing}
                              onChange={(e) => setEditForm({ ...editForm, qualYearPassing: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                              className={modalInputCls("qualYearPassing")}
                              placeholder="e.g. 2024"
                              inputMode="numeric"
                              maxLength={4}
                              autoComplete="off"
                            />
                          </div>
                          <div>
                            <label className={basicLabelCls}>% Obtained</label>
                            <input
                              type="text"
                              value={editForm.qualPercentObtained}
                              onChange={(e) => setEditForm({ ...editForm, qualPercentObtained: e.target.value })}
                              className={modalInputCls("qualPercentObtained")}
                              placeholder="e.g. 72% or CGPA"
                              autoComplete="off"
                            />
                          </div>
                        </div>
                        <div>
                          <label className={basicLabelCls}>Added Qualifications (one per line)</label>
                          <textarea
                            value={String((editForm as Record<string, unknown>).credentialEntriesText ?? "")}
                            onChange={(e) => setEditForm({ ...editForm, credentialEntriesText: e.target.value })}
                            className={modalInputCls("credentialEntries")}
                            rows={4}
                            placeholder="Qualification | School/College | Course Name | Year | Obtained"
                          />
                          <p className="mt-1 text-[10px] font-semibold text-slate-400">
                            Format: Qualification | School/College | Course Name | Year | Obtained
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/60">
                        <table className="w-full min-w-[320px] text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 bg-white text-[10px] font-black uppercase tracking-wider text-slate-500">
                              <th className="px-4 py-2">College / School name</th>
                              <th className="px-4 py-2">Year of passing</th>
                              <th className="px-4 py-2">% Obtained</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="px-4 py-3 font-semibold text-slate-800">
                                {pickValue(
                                  formatQualSchoolDisplay(
                                    selectedStudent.qualSchool,
                                    selectedStudent.qualSchoolOther,
                                  ),
                                )}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-800">
                                {pickValue(selectedStudent.qualYearPassing)}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-800">
                                {pickValue(selectedStudent.qualPercentObtained)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                    {!isEditing && Boolean(selectedStudent.credentialEntries) && (
                      <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Added Qualifications</p>
                        <pre className="whitespace-pre-wrap text-xs font-semibold text-slate-700">
                          {credentialEntriesToEditorText(selectedStudent.credentialEntries)}
                        </pre>
                      </div>
                    )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                          { label: "Course Name", key: "course", type: "select", options: availableCourses.map(c => c.name) },
                          { label: "Session", key: "session" },
                          { label: "Admission Date", key: "admissionDate", type: "date" },
                          {
                            label: "Highest Qualification",
                            key: "highestQualification",
                            type: "select",
                            options: HIGHEST_QUALIFICATION_SELECT_OPTIONS.map((o) => o.value),
                          },
                          { label: "Exam Mode", key: "examMode", type: "select", options: ["online", "offline"] },
                          { label: "Course Type", key: "courseType", type: "select", options: ["Regular", "ODL (Open Distance Learning)"] },
                          { label: "Referred By", key: "referredBy" },
                        ].map((item, idx) => {
                          const accKey = item.key;
                          return (
                            <div key={idx} className="space-y-1.5">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                              {isEditing ? (
                                item.type === "select" ? (
                                  <select
                                    value={String((editForm as unknown as Record<string, string>)[accKey] ?? "")}
                                    onChange={e => setEditForm({...editForm, [accKey]: e.target.value})}
                                    className={modalInputCls(accKey)}
                                  >
                                    <option value="">Select</option>
                                    {(() => {
                                      const current = String((editForm as unknown as Record<string, string>)[accKey] ?? "");
                                      const optionList = (item.options ?? []).map((opt) => String(opt));
                                      return current && !optionList.includes(current) ? (
                                        <option value={current}>{current}</option>
                                      ) : null;
                                    })()}
                                    {item.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                  </select>
                                ) : (
                                  <input
                                    type={item.type || "text"}
                                    value={String((editForm as unknown as Record<string, string>)[accKey] ?? "")}
                                    onChange={e => setEditForm({...editForm, [accKey]: e.target.value})}
                                    className={modalInputCls(accKey)}
                                  />
                                )
                              ) : (
                                <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                                  {pickValue((selectedStudent as unknown as Record<string, unknown>)[accKey])}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                  </div>
                </div>

                {/* Right Column: Financials & Documents Preview */}
                <div className="lg:col-span-4 space-y-8">
                  
                  {/* Financial Status Card */}
                  <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <h4 className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-8">Financial Overview</h4>
                    
                    <div className="space-y-6">
                       <div className="flex items-end justify-between border-b border-white/10 pb-4">
                          <p className="text-xs font-bold text-white/60">Total Agreed Fee</p>
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                               <span className="text-lg font-black opacity-50">₹</span>
                               <input 
                                 type="number"
                                 value={editForm.totalFee}
                                 onChange={e => setEditForm({...editForm, totalFee: Number(e.target.value)})}
                                 className="w-24 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-right text-lg font-black outline-none focus:border-white/40"
                               />
                            </div>
                          ) : (
                            <p className="text-3xl font-black tracking-tighter">₹{selectedStudent.totalFee || selectedStudent.admissionFees || 0}</p>
                          )}
                       </div>
                       <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-emerald-400">Total Amount Paid</p>
                          <p className="text-lg font-black text-emerald-400">₹{selectedStudent.paidAmount || 0}</p>
                       </div>
                       <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-red-400">Pending Dues</p>
                          <p className="text-lg font-black text-red-400">₹{(selectedStudent.totalFee || Number(selectedStudent.admissionFees) || 0) - (selectedStudent.paidAmount || 0)}</p>
                       </div>
                    </div>

                    <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
                       <CreditCard className="w-5 h-5 text-amber-400" />
                       <p className="text-[9px] font-bold text-white/70 leading-tight uppercase tracking-wider">Payments are synchronized with the central accounts registry.</p>
                    </div>
                  </div>

                  {/* Documents Section */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                       <FileText className="w-4 h-4 text-blue-600" /> Uploaded Documents
                    </h4>
                    
                    <div className="grid grid-cols-1 gap-4">
                       {[
                         { label: 'Student Photo', key: 'photo', data: selectedStudent.photo },
                         { label: 'Aadhar Document', key: 'aadharDoc', data: selectedStudent.aadharDoc },
                         { label: '10th Marksheet', key: 'marksheet10th', data: selectedStudent.marksheet10th },
                         { label: '12th Marksheet', key: 'marksheet12th', data: selectedStudent.marksheet12th },
                         { label: 'Graduation Doc', key: 'graduationDoc', data: selectedStudent.graduationDoc },
                         { label: 'Highest Qualification Doc', key: 'highestQualDoc', data: selectedStudent.highestQualDoc },
                         { label: 'Qualification Doc', key: 'qualificationDoc', data: selectedStudent.qualificationDoc },
                         { label: 'Signature Copy', key: 'studentSignature', data: selectedStudent.studentSignature },
                         { label: 'Other Document', key: 'otherDocs', data: selectedStudent.otherDocs },
                       ].filter(d => d.data).map((doc, idx) => (
                         <div key={idx} className="group flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors overflow-hidden">
                                  {doc.data?.includes('image/') || doc.data?.endsWith('.jpg') || doc.data?.endsWith('.png') ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={doc.data} alt={doc.label} className="w-full h-full object-cover" />
                                  ) : (
                                    <FileText className="w-5 h-5" />
                                  )}
                               </div>
                               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{doc.label}</span>
                            </div>
                            <button 
                              onClick={() => {
                                const win = window.open();
                                if (win) {
                                  win.document.write(`<iframe src="${doc.data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                }
                              }}
                              className="px-4 py-2 bg-white text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                            >
                               View Full
                            </button>
                         </div>
                       ))}

                       {![
                         selectedStudent.photo,
                         selectedStudent.aadharDoc,
                         selectedStudent.marksheet10th,
                         selectedStudent.marksheet12th,
                         selectedStudent.graduationDoc,
                         selectedStudent.highestQualDoc,
                         selectedStudent.qualificationDoc,
                         selectedStudent.studentSignature,
                         selectedStudent.otherDocs
                       ].some(Boolean) && (
                         <div className="p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Documents Uploaded</p>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="shrink-0 px-10 py-6 bg-white border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 Last Sync: {new Date(selectedStudent.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-4">
                 <button 
                   onClick={() => setSelectedStudent(null)}
                   className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl"
                 >
                   Dismiss View
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {requestExamStudent && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                 </div>
                 Exam Request Schedule
              </h3>
              <button onClick={() => setRequestExamStudent(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                 <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRequestExam} className="p-8 space-y-6">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-xs font-bold text-blue-800 leading-tight">
                  Student: {requestExamStudent.name}<br/>
                  Course: {requestExamStudent.course}
                </p>
              </div>

              <div className="space-y-4">
                 <div className="space-y-1.5">
                    <label className={basicLabelCls}>Exam Mode</label>
                    <select 
                      value={examReqForm.examMode}
                      onChange={e => setExamReqForm({...examReqForm, examMode: e.target.value})}
                      className={basicInputCls}
                      required
                    >
                       <option value="online">Online Exam</option>
                       <option value="offline">Offline Exam (Center Based)</option>
                    </select>
                 </div>

                 {examReqForm.examMode === 'offline' && (
                   <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="space-y-1.5">
                         <label className={basicLabelCls}>Preferred Date</label>
                         <input 
                           type="date"
                           value={examReqForm.preferredDate}
                           onChange={e => setExamReqForm({...examReqForm, preferredDate: e.target.value})}
                          className={basicInputCls}
                           required
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className={basicLabelCls}>Preferred Center / Location</label>
                         <input 
                           value={examReqForm.preferredCenter}
                           onChange={e => setExamReqForm({...examReqForm, preferredCenter: e.target.value})}
                          className={basicInputCls}
                           placeholder="Enter center name or location"
                           required
                         />
                      </div>
                   </div>
                 )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                 <button 
                   type="button" 
                   onClick={() => setRequestExamStudent(null)}
                   className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit" 
                   disabled={requesting}
                   className="py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-emerald-700 transition shadow-lg shadow-emerald-100 disabled:opacity-50"
                 >
                   {requesting ? "SUBMITTING..." : "SUBMIT REQUEST"}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Result Submission Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white">
                    <BookOpen className="w-4 h-4" />
                 </div>
                 Submit Exam Result
              </h3>
              <button onClick={() => setShowResultModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                 <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleResultSubmit} className="p-8 space-y-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 divide-y divide-slate-200">
                <div className="pb-3 flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-tight">
                  <span>Student</span>
                  <span className="text-slate-800">{showResultModal.name}</span>
                </div>
                <div className="pt-3 flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-tight">
                  <span>Enrollment number</span>
                  <span className="text-slate-800">{showResultModal.enrollmentNo}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-1.5">
                  <label className={basicLabelCls}>Marks obtained *</label>
                  <input 
                    type="number"
                    value={resultForm.marks}
                    onChange={e => setResultForm({...resultForm, marks: e.target.value})}
                    className={basicInputCls}
                    placeholder="Out of 100"
                    required
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={basicLabelCls}>Grade (auto)</label>
                  <div className={`${basicInputCls} bg-slate-50 text-slate-800`}>
                    <span className="font-bold tabular-nums">{simpleOfflineResultGrade.grade}</span>
                    <span className="text-slate-500 font-medium ml-2 tabular-nums">
                      ({simpleOfflineResultGrade.pct}%)
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Academic session sent from the student profile:{" "}
                    <span className="text-slate-700">{showResultModal.session?.trim() || "—"}</span>
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl flex gap-3 border border-blue-100">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-[10px] font-bold text-blue-800 leading-tight">
                  By submitting, you confirm that the result is accurate. It will be sent to the Head Office for final approval and document generation.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                 <button 
                   type="button" 
                   onClick={() => setShowResultModal(null)}
                   className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit" 
                   disabled={resultSubmitting}
                   className="py-4 bg-black text-white rounded-2xl font-black uppercase text-xs hover:bg-slate-800 transition shadow-xl disabled:opacity-50"
                 >
                   {resultSubmitting ? "SUBMITTING..." : "CONFIRM & SEND"}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
        {/* ID CARD VIEW MODAL */}
        {viewIdCard && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-100 flex items-center justify-center p-4">
             <div className="relative group">
                <div className="absolute -top-12 right-0 flex gap-4">
                   <button 
                     onClick={() => window.print()}
                     className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 backdrop-blur-md transition border border-white/20 flex items-center gap-2 px-4 shadow-lg"
                   >
                      <Download className="w-4 h-4" /> <span className="text-[10px] font-black uppercase tracking-widest">Print ID</span>
                   </button>
                   <button 
                     onClick={() => setViewIdCard(null)} 
                     className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 backdrop-blur-md transition border border-white/20 shadow-lg"
                   >
                     <XCircle className="w-5 h-5" />
                   </button>
                </div>
                <div id="student-id-card-container" className="animate-in zoom-in-95 duration-300">
                   <StudentIdCard 
                     student={{
                       ...viewIdCard,
                       enrollmentNo: viewIdCard.enrollmentNo || "PENDING",
                       dob: viewIdCard.dob || "N/A"
                     }} 
                   />
                </div>
             </div>
          </div>
        )}

        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { margin: 0; size: auto; }
            body * { visibility: hidden !important; }
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
          }
        ` }} />

      {/* SUCCESS POPUP MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-300 text-center p-10 relative">
             <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
             <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <CheckCircle className="w-10 h-10 text-green-600" />
             </div>
             <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Enrollment Success</h3>
             <p className="text-slate-500 text-sm mb-6 leading-relaxed">Admission form submitted successfully. <br /> Student enrollment number: <b>{lastRegNo}</b></p>
             <button 
               onClick={() => {
                 setShowSuccessModal(false);
                 setTab("list");
               }}
               className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
             >
               Awesome, Continue
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
