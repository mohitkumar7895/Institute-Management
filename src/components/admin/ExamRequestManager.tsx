"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useMemo, type FormEvent } from "react";
import { Users, Clock, Search, RefreshCw, Calendar, X, AlertCircle, FileText, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/utils/api";
import {
  DEFAULT_MARKSHEET_GRADE_BANDS,
  MARKSHEET_GRADE_BANDS_KEY,
  gradeFromMarksOrSubjectRows,
  parseGradeBandsJson,
  type GradeBand,
} from "@/lib/marksheetGradeScaleCore";

interface ExamRequest {
  _id: string;
  atcId?: {
    _id?: string;
    trainingPartnerName?: string;
    tpCode?: string;
  };
  session?: string;
  studentId: {
    _id: string;
    name: string;
    enrollmentNo: string;
    course: string;
    fatherName?: string;
    mobile?: string;
    photo?: string;
    profileImage?: string;
    session?: string;
  };
  examMode: "online" | "offline";
  offlineDetails?: {
    preferredDate?: string;
    preferredCenter?: string;
    preferredTimeSlot?: string;
  };
  examDate?: string;
  examTime?: string;
  durationMinutes?: number;
  setId?: string;
  approvalStatus: "pending" | "approved" | "rejected";
  status: "pending" | "completed";
  resultDeclared?: boolean;
  marksheetReleased?: boolean;
  certificateReleased?: boolean;
  admitCardReleased?: boolean;
  totalScore?: number;
  maxScore?: number;
  offlineExamStatus?: string;
  offlineExamResult?: string;
  grade?: string;
  offlineExamCopy?: string;
  submittedAt?: string;
  createdAt?: string;
  updatedAt: string;
}

interface QuestionSet {
  _id: string;
  title: string;
  questionCount: number;
}

interface StudentCandidate {
  _id: string;
  name: string;
  enrollmentNo: string;
  course?: string;
  fatherName?: string;
  mobile?: string;
  admissionDate?: string;
  examMode?: "online" | "offline";
  status?: string;
  photo?: string;
  profileImage?: string;
}

type ZipDocType =
  | "admitCard"
  | "examCopy"
  | "certificate"
  | "marksheet"
  | "certificatePrint"
  | "marksheetPrint";

const ZIP_DOC_SUFFIX: Record<ZipDocType, string> = {
  admitCard: "Admit Card",
  examCopy: "ExamCopy",
  certificate: "Certificate",
  marksheet: "Marksheet",
  certificatePrint: "Certificate Print",
  marksheetPrint: "Marksheet Print",
};

export default function ExamRequestManager({ atcId, role = "admin" }: { atcId?: string, role?: "admin" | "atc" }) {
  const [requests, setRequests] = useState<ExamRequest[]>([]);
  const [availableStudents, setAvailableStudents] = useState<StudentCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode] = useState<"all" | "online" | "offline">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamRequest | null>(null);
  const [approvalForm, setApprovalForm] = useState({
    examDate: "",
    examTime: "",
    setId: "",
    examMode: "online",
    durationMinutes: 60
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [atcTab, setAtcTab] = useState<"new" | "history">(role === "admin" ? "history" : "new");
  const [requestExamStudent, setRequestExamStudent] = useState<StudentCandidate | null>(null);
  const [examReqForm, setExamReqForm] = useState({ 
    examDate: "",
    examTime: "",
    durationMinutes: 60,
    setId: ""
  });
  const [requesting, setRequesting] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultForm, setResultForm] = useState({
    status: "published" as "not_appeared" | "appeared" | "published",
    marks: "",
    resultStatus: "Pass" as "Pass" | "Fail" | "Waiting"
  });
  const [resultSaving, setResultSaving] = useState(false);
  const [resultCopyFile, setResultCopyFile] = useState<File | null>(null);
  const [offlineResultGradeBands, setOfflineResultGradeBands] = useState<GradeBand[]>(() => [
    ...DEFAULT_MARKSHEET_GRADE_BANDS,
  ]);
  const [zipLoading, setZipLoading] = useState(false);
  const [selectedZipDocs, setSelectedZipDocs] = useState<ZipDocType[]>(["certificate", "marksheet"]);
  const [issueDateExamId, setIssueDateExamId] = useState<string | null>(null);
  const [issueDateValue, setIssueDateValue] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const { loading: authLoading, user: authUser } = useAuth();
  const showRosterTab = role === "atc";

  const fetchRequests = useCallback(async () => {
    if (authLoading || !authUser) return;
    setLoading(true);
    try {
      const url = role === "admin" ? "/api/admin/exams/all" : "/api/atc/exams/all";
      const res = await apiFetch(url, { 
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
      
      if (role === "atc") {
        const studentRes = await apiFetch("/api/atc/students", { 
          cache: "no-store",
        });
        if (studentRes.ok) {
          const sData = await studentRes.json();
          const validStudents = (sData.students || []).filter((s: StudentCandidate) => s.status === "approved" || s.status === "active");
          setAvailableStudents(validStudents);
        }
      }
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [authLoading, authUser, role]);

  const fetchQuestionSets = useCallback(async () => {
    if (authLoading || !authUser) return;
    try {
      const endpoint = role === "admin" ? "/api/admin/question-sets" : "/api/atc/question-sets";
      const res = await apiFetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setQuestionSets(data.sets || []);
      }
    } catch (err) {
      console.error("Failed to fetch sets", err);
    }
  }, [authLoading, authUser, role]);

  useEffect(() => {
    if (authLoading || !authUser) return;
    void fetchRequests();
    void fetchQuestionSets();
  }, [atcId, fetchRequests, fetchQuestionSets, authLoading, authUser]);

  useEffect(() => {
    if (!showResultModal || !selectedExam) return;
    let cancelled = false;
    fetch(`/api/public/settings?key=${MARKSHEET_GRADE_BANDS_KEY}`)
      .then((r) => r.json())
      .then((d: { value?: string | null }) => {
        if (!cancelled) setOfflineResultGradeBands(parseGradeBandsJson(d?.value ?? null));
      })
      .catch(() => {
        if (!cancelled) setOfflineResultGradeBands([...DEFAULT_MARKSHEET_GRADE_BANDS]);
      });
    return () => {
      cancelled = true;
    };
  }, [showResultModal, selectedExam?._id]);

  const offlineDerivedGrade = useMemo(
    () =>
      selectedExam
        ? gradeFromMarksOrSubjectRows(
            [],
            resultForm.marks,
            selectedExam.maxScore,
            offlineResultGradeBands,
          )
        : { pct: 0, grade: "—" },
    [selectedExam, resultForm.marks, offlineResultGradeBands],
  );

  const toDateInputValue = (value?: string) => {
    if (!value) return "";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "";
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
  };

  const handleAction = async (requestId: string, status: string, details?: Record<string, unknown>) => {
    setActionLoading(requestId);
    try {
      const res = await apiFetch("/api/admin/exams/update", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId, status, ...details }),
      });
      if (res.ok) {
        await fetchRequests();
        setShowApproveModal(false);
      }
    } catch (err) {
      console.error("Action failed", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAtcScheduleUpdate = async (examId: string) => {
    setActionLoading(examId);
    try {
      const res = await apiFetch("/api/atc/exams/update-schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examId,
          examDate: approvalForm.examDate,
          examTime: approvalForm.examTime,
          setId: approvalForm.examMode === "online" ? approvalForm.setId : undefined,
          durationMinutes: approvalForm.durationMinutes,
        }),
      });
      if (res.ok) {
        await fetchRequests();
        setShowApproveModal(false);
      }
    } catch (err) {
      console.error("Schedule update failed", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestExam = async (e: FormEvent) => {
    e.preventDefault();
    if (!requestExamStudent) return;
    setRequesting(true);
    try {
      const res = await apiFetch("/api/atc/exams/request", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          studentId: requestExamStudent._id, 
          examMode: requestExamStudent.examMode || "online",
          examDate: examReqForm.examDate,
          examTime: examReqForm.examTime,
          durationMinutes: examReqForm.durationMinutes,
          setId: requestExamStudent.examMode === "online" ? examReqForm.setId : undefined
        }),
      });
      if (res.ok) {
        await fetchRequests();
        setRequestExamStudent(null);
        setExamReqForm({ examDate: "", examTime: "", durationMinutes: 60, setId: "" });
      }
    } catch (err) {
      console.error("Request failed", err);
    } finally {
      setRequesting(false);
    }
  };

  const handleResultSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;
    setResultSaving(true);
    try {
      const formData = new FormData();
      formData.append("studentId", selectedExam.studentId?._id);
      formData.append("examId", selectedExam._id);
      formData.append("offlineExamStatus", resultForm.status);
      formData.append("totalScore", resultForm.marks);
      formData.append("offlineExamResult", resultForm.resultStatus);
      const { grade: g } = gradeFromMarksOrSubjectRows(
        [],
        resultForm.marks,
        selectedExam.maxScore,
        offlineResultGradeBands,
      );
      formData.append("grade", g);
      formData.append(
        "session",
        selectedExam.studentId?.session?.trim() || selectedExam.session?.trim() || "",
      );
      if (resultCopyFile) formData.append("examCopy", resultCopyFile);

      const res = await apiFetch("/api/atc/exams/offline-result", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        await fetchRequests();
        setShowResultModal(false);
      }
    } catch (err) {
      console.error("Result save failed", err);
    } finally {
      setResultSaving(false);
    }
  };

  const handleApproveResult = async (
    examId: string,
    status: "published" | "appeared" = "published",
    issueDate?: string,
  ) => {
    setActionLoading(examId);
    try {
      const shouldReleaseDocs = status === "published";
      const res = await apiFetch("/api/admin/exams/approve-result", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examId,
          status,
          marksheet: shouldReleaseDocs,
          certificate: shouldReleaseDocs,
          ...(issueDate ? { issueDate } : {}),
        }),
      });
      if (res.ok) {
        alert("Result Submitted Successfully");
        await fetchRequests();
      }
    } catch (err) {
      console.error("Approve failed", err);
    } finally {
      // no-op
    }
    setActionLoading(null);
  };

  const promptIssueDateAndApprove = (examId: string) => {
    setIssueDateExamId(examId);
    setIssueDateValue(new Date().toISOString().slice(0, 10));
  };

  const confirmIssueDateApproval = async () => {
    if (!issueDateExamId) return;
    const id = issueDateExamId;
    const date = issueDateValue;
    setIssueDateExamId(null);
    await handleApproveResult(id, "published", date);
  };

  const handleBulkAction = async (action: "approve" | "reject" | "delete") => {
    if (selectedExams.length === 0) return;

    if (!confirm(`Are you sure you want to ${action} ${selectedExams.length} requests?`)) return;

    setActionLoading("bulk");
    try {
      // In a real scenario, ideally a single bulk API endpoint. 
      // For now, loop or use a /bulk endpoint if it exists.
      for (const id of selectedExams) {
        await apiFetch("/api/admin/exams/update", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestId: id,
            status: action === "approve" ? "approved" : action === "reject" ? "rejected" : "delete",
            admitCardReleased: action === "approve",
          }),
        });
      }
      setSelectedExams([]);
      await fetchRequests();
    } catch (err) {
      console.error("Bulk action failed", err);
    } finally {
      setActionLoading(null);
    }
  };

  const openApproveModal = (exam: ExamRequest) => {
    setSelectedExam(exam);
    setApprovalForm({
      examDate: toDateInputValue(exam.examDate),
      examTime: exam.examTime || "",
      setId: exam.setId || "",
      examMode: exam.examMode,
      durationMinutes: Number(exam.durationMinutes || 60),
    });
    setShowApproveModal(true);
  };

  const openResultModal = (exam: ExamRequest) => {
    if (role === "atc" && exam.examDate && exam.examTime) {
      const scheduledDateTime = new Date(`${toDateInputValue(exam.examDate)}T${exam.examTime}:00`);
      if (!Number.isNaN(scheduledDateTime.getTime()) && Date.now() < scheduledDateTime.getTime()) {
        alert(
          `Result submission is not allowed yet. The exam time has not ended.\n\nYou can submit the result after ${scheduledDateTime.toLocaleString("en-IN")}.`
        );
        return;
      }
    }

    setSelectedExam(exam);
    setResultForm({
      status: (exam.offlineExamStatus as "not_appeared" | "appeared" | "published") || "published",
      marks: exam.totalScore?.toString() || "",
      resultStatus: (exam.offlineExamResult as "Pass" | "Fail" | "Waiting") || "Pass"
    });
    setShowResultModal(true);
  };

  const toggleZipDoc = (doc: ZipDocType) => {
    setSelectedZipDocs((prev) => (
      prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]
    ));
  };

  const downloadSelectedZip = async () => {
    if (selectedExams.length === 0) {
      alert("Please select students first.");
      return;
    }
    if (selectedZipDocs.length === 0) {
      alert("Please select at least one document type.");
      return;
    }
    setZipLoading(true);
    try {
      const [{ default: JSZip }, { toJpeg }, { default: jsPDF }] = await Promise.all([
        import("jszip"),
        import("html-to-image"),
        import("jspdf"),
      ]);

      const zip = new JSZip();
      const examMap = new Map(requests.map((r) => [r._id, r]));
      let addedFiles = 0;

      const renderPageAsPdf = async (url: string, preferredSelector: string) => {
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.left = "-100000px";
        iframe.style.top = "0";
        iframe.style.width = "1800px";
        iframe.style.height = "2600px";
        iframe.style.opacity = "0";
        iframe.src = url;
        document.body.appendChild(iframe);

        await new Promise<void>((resolve, reject) => {
          const t = window.setTimeout(() => reject(new Error(`Load timeout: ${url}`)), 20000);
          iframe.onload = () => {
            window.clearTimeout(t);
            resolve();
          };
          iframe.onerror = () => {
            window.clearTimeout(t);
            reject(new Error(`Load failed: ${url}`));
          };
        });

        const waitForNode = async () => {
          const started = Date.now();
          while (Date.now() - started < 15000) {
            const doc = iframe.contentDocument;
            const node =
              (doc?.querySelector(preferredSelector) as HTMLElement | null) ||
              (doc?.querySelector("#cert-a4") as HTMLElement | null) ||
              (doc?.querySelector("#admit-card-view") as HTMLElement | null);
            if (node) return node;
            await new Promise((resolve) => window.setTimeout(resolve, 250));
          }
          return null;
        };

        const node = await waitForNode();
        if (!node) {
          document.body.removeChild(iframe);
          throw new Error(`Document root not found: ${url}`);
        }

        // Wait for fonts/images so capture matches visible design.
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (iframe.contentDocument as any)?.fonts?.ready;
        } catch {
          // ignore
        }
        const images = Array.from(iframe.contentDocument?.images || []);
        await Promise.all(
          images.map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise<void>((resolve) => {
                  img.onload = () => resolve();
                  img.onerror = () => resolve();
                })
          )
        );

        // Force A4 frame before capture so ZIP output matches opened page layout.
        node.style.width = "210mm";
        node.style.minWidth = "210mm";
        node.style.maxWidth = "210mm";
        node.style.height = "297mm";
        node.style.minHeight = "297mm";
        node.style.maxHeight = "297mm";
        node.style.aspectRatio = "210 / 297";

        await new Promise((resolve) => window.setTimeout(resolve, 350));

        const A4_W = 2480;
        const A4_H = 3508;
        const jpeg = await toJpeg(node, {
          cacheBust: true,
          pixelRatio: 1,
          quality: 0.8,
          backgroundColor: "#ffffff",
          width: A4_W,
          height: A4_H,
          canvasWidth: A4_W,
          canvasHeight: A4_H,
          skipFonts: true,
        });
        document.body.removeChild(iframe);

        const pdf = new jsPDF("p", "mm", "a4");
        // 1:1 A4 mapping for exact visual alignment.
        pdf.addImage(jpeg, "JPEG", 0, 0, 210, 297);
        return pdf.output("arraybuffer");
      };

      for (const examId of selectedExams) {
        const exam = examMap.get(examId);
        if (!exam) continue;
        const regNo = (exam.studentId?.enrollmentNo || "UNKNOWN").trim().replace(/[^a-zA-Z0-9_-]/g, "_");

        for (const docType of selectedZipDocs) {
          const needsApprovedResult =
            docType === "certificate" ||
            docType === "marksheet" ||
            docType === "certificatePrint" ||
            docType === "marksheetPrint";
          if (needsApprovedResult && !canAccessResultDocs(exam)) {
            continue;
          }
          const filename = `${regNo}_${ZIP_DOC_SUFFIX[docType]}.pdf`;
          try {
            if (docType === "examCopy") {
              const data = exam.offlineExamCopy;
              const match = typeof data === "string" ? data.match(/^data:(.+?);base64,(.+)$/) : null;
              if (match && match[1].includes("pdf")) {
                zip.file(filename, Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0)));
                addedFiles++;
              }
              continue;
            }

            let pageUrl = "";
            let selector = "#cert-a4";
            if (docType === "admitCard") {
              pageUrl = `/admin/document/admit-card/${examId}`;
              selector = "#admit-card-view";
            } else if (docType === "certificate") {
              pageUrl = `/admin/document/certificate/${examId}`;
            } else if (docType === "marksheet") {
              pageUrl = `/admin/document/marksheet/${examId}`;
            } else if (docType === "certificatePrint") {
              pageUrl = `/admin/document/certificate/${examId}?zipPrint=1`;
            } else if (docType === "marksheetPrint") {
              pageUrl = `/admin/document/marksheet/${examId}?zipPrint=1`;
            }

            if (!pageUrl) continue;
            const pdfBuffer = await renderPageAsPdf(pageUrl, selector);
            zip.file(filename, pdfBuffer);
            addedFiles++;
          } catch (error) {
            console.error(`ZIP item failed: ${filename}`, error);
          }
        }
      }

      if (addedFiles === 0) {
        alert("No files could be generated. Please verify selected documents.");
        return;
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `student-documents-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("ZIP download failed.");
    } finally {
      setZipLoading(false);
    }
  };

  const filtered = requests.filter(r => {
    const matchesSearch = 
      r.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.studentId?.enrollmentNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.atcId?.trainingPartnerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMode = filterMode === "all" || r.examMode === filterMode;
    const matchesStatus = filterStatus === "all" || r.approvalStatus === filterStatus;
    
    // For ATCs: Hide from Scheduling if result is already in review or published
    const isNotInResultPhase = role === "atc" 
      ? (r.offlineExamStatus !== 'review_pending' && r.offlineExamStatus !== 'published' && r.status !== 'completed')
      : true;

    return matchesSearch && matchesMode && matchesStatus && isNotInResultPhase;
  });

  const labelCls = "block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2";
  const inputCls = "w-full px-5 py-3 bg-slate-50 rounded-xl border-none font-bold text-slate-800 focus:ring-2 focus:ring-green-500 transition";
  const canAccessResultDocs = (exam: ExamRequest) =>
    exam.status === "completed" &&
    exam.offlineExamStatus === "published" &&
    exam.resultDeclared === true;

  return (
    <div className="bg-slate-50/30 rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-150 text-slate-800">
      {/* Top Tabs styling same as StudentManager */}
      {/* Unifed Filter Tabs */}
      <div className="flex items-center gap-6 px-8 pt-6 bg-white border-b border-slate-100">
        {[
          { id: "all_students", label: "All Request", icon: Users },
          { id: "pending", label: "Pending", icon: Clock },
          { id: "approved", label: "Admit Card", icon: ShieldCheck },
          ...(role === "admin" ? [{ id: "rejected", label: "Reject", icon: AlertCircle }] : [])
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === "all_students") {
                setAtcTab("new");
                setFilterStatus("all");
              } else {
                setAtcTab("history");
                setFilterStatus(tab.id as "all" | "pending" | "approved" | "rejected");
              }
            }}
            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative flex items-center gap-2 ${
              (tab.id === "all_students" && atcTab === "new") || 
              (atcTab === "history" && filterStatus === tab.id)
                ? "text-green-600"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {((tab.id === "all_students" && atcTab === "new") || (atcTab === "history" && filterStatus === tab.id)) && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-t-full shadow-[0_-2px_10px_rgba(22,163,74,0.3)]" />
            )}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* Search & Filter bar like StudentManager */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-50">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search student or enrollment no..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-green-500 transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={fetchRequests} className="px-4 py-2 bg-slate-50 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-100 transition flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {role === "admin" && atcTab === "history" && (
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mb-6">
            <div className="flex flex-wrap items-center gap-5">
              {[
                { id: "admitCard" as ZipDocType, label: "Admit Card" },
                { id: "examCopy" as ZipDocType, label: "Exam Copy" },
                { id: "certificate" as ZipDocType, label: "Certificate" },
                { id: "marksheet" as ZipDocType, label: "Marksheet" },
                { id: "certificatePrint" as ZipDocType, label: "Certificate Print" },
                { id: "marksheetPrint" as ZipDocType, label: "Marksheet Print" },
              ].map((opt) => (
                <label key={opt.id} className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-slate-700">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                    checked={selectedZipDocs.includes(opt.id)}
                    onChange={() => toggleZipDoc(opt.id)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <div className="mt-4">
              <button
                onClick={() => void downloadSelectedZip()}
                disabled={zipLoading || selectedExams.length === 0}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {zipLoading ? "Preparing ZIP..." : `Download Selected ZIP (${selectedExams.length})`}
              </button>
            </div>
          </div>
        )}

        {showRosterTab && atcTab === "new" ? (
          <div className="animate-in fade-in duration-300">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 gap-4">
                <span className="w-10 h-10 rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
                <p className="text-sm font-bold text-slate-400">Loading student records...</p>
              </div>
            ) : availableStudents.length === 0 ? (
              <div className="text-center p-16 bg-white rounded-3xl border border-dashed border-slate-200">
                 <Users className="w-8 h-8 text-slate-200 mx-auto mb-4" />
                 <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No active students found.</p>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Bulk Action Bar */}
                {selectedExams.length > 0 && (
                  <div className="bg-slate-900 px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-4 text-white text-xs font-bold">
                       <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">{selectedExams.length}</div>
                       <span className="uppercase tracking-widest">Requests Selected</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <button onClick={() => handleBulkAction("approve")} className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase hover:bg-emerald-600 transition shadow-lg">Approve Selective</button>
                       <button onClick={() => handleBulkAction("reject")} className="px-4 py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase hover:bg-amber-600 transition shadow-lg">Reject Selective</button>
                       <button onClick={() => setSelectedExams([])} className="px-4 py-1.5 rounded-lg bg-white/10 text-white text-[10px] font-black uppercase hover:bg-white/20 transition">Cancel</button>
                    </div>
                  </div>
                )}
                <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4 w-4">
                        <input 
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                          checked={selectedExams.length > 0 && selectedExams.length === availableStudents.length}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedExams(availableStudents.map(s => s._id));
                            else setSelectedExams([]);
                          }}
                        />
                      </th>
                      <th className="px-6 py-4">Enrollment no.</th>
                      <th className="px-6 py-4">Student Identity</th>
                      <th className="px-6 py-4">Opted Course</th>
                      <th className="px-6 py-4 text-center">Eligibility</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {availableStudents.map(s => {
                      const existingRequest = requests.find((r) => r.studentId?._id === s._id);
                      const hasTodayRequest = requests.some((r) => {
                        const sameStudent = r.studentId?._id === s._id;
                        if (!sameStudent) return false;
                        const dt = new Date(r.createdAt || r.updatedAt);
                        const now = new Date();
                        return (
                          dt.getDate() === now.getDate() &&
                          dt.getMonth() === now.getMonth() &&
                          dt.getFullYear() === now.getFullYear()
                        );
                      });
                      return (
                        <tr key={s._id} className={`hover:bg-slate-50/50 transition cursor-default ${selectedExams.includes(s._id) ? 'bg-green-50/30' : ''}`}>
                          <td className="px-6 py-5">
                            <input 
                              type="checkbox"
                              className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                              checked={selectedExams.includes(s._id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedExams(prev => [...prev, s._id]);
                                else setSelectedExams(prev => prev.filter(id => id !== s._id));
                              }}
                            />
                          </td>
                          <td className="px-6 py-5">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                              {s.enrollmentNo || "PENDING"}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              {s.profileImage || s.photo ? (
                                <Image src={s.profileImage || s.photo || ""} alt={s.name} width={36} height={36} unoptimized className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-sm" />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 font-black text-slate-400">{s.name.charAt(0)}</div>
                              )}
                              <div>
                                <p className="font-bold text-slate-800 leading-none mb-1 uppercase text-xs">{s.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">S/O: {s.fatherName} • {s.mobile}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="font-bold text-emerald-700 uppercase text-xs">{s.course}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase">{s.admissionDate ? new Date(s.admissionDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : 'NO DATE'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            {existingRequest ? (
                              <span className={`inline-flex px-3 py-1 text-[9px] font-black uppercase rounded-full border shadow-sm ${
                                existingRequest.approvalStatus === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 
                                existingRequest.approvalStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {existingRequest.approvalStatus === 'pending' ? 'Request Sent' : existingRequest.approvalStatus}
                              </span>
                            ) : (
                              <span className="inline-flex px-3 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase rounded-full border border-emerald-200 tracking-widest shadow-sm">ELIGIBLE</span>
                            )}
                          </td>
                          <td className="px-6 py-5 text-right">
                             <div className="flex items-center justify-end gap-2">
                               {existingRequest?.approvalStatus === "approved" && (
                                 <button
                                   onClick={() => window.open(`/atc/document/admit-card/${existingRequest._id}`, "_blank")}
                                   className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[9px] font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition"
                                 >
                                   Admit Card
                                 </button>
                               )}
                              <button
                                onClick={() => {
                                  setRequestExamStudent(s);
                                  setExamReqForm((prev) => ({ ...prev, examDate: "", examTime: "", durationMinutes: 60, setId: "" }));
                                }}
                                 disabled={hasTodayRequest}
                                 className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition shadow-lg shadow-slate-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-900"
                               >
                                 {hasTodayRequest ? "Requested Today" : "Exam Request"}
                               </button>
                             </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            {loading ? (
               <div className="flex flex-col items-center justify-center p-20 gap-4">
                 <span className="w-10 h-10 rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
               </div>
            ) : filtered.length === 0 ? (
               <div className="bg-white p-20 text-center rounded-2xl border border-slate-100">
                  <p className="text-slate-400 font-bold text-[10px] uppercase">No history found.</p>
               </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {role === "admin" && selectedExams.length > 0 && (
                  <div className="bg-slate-900 px-6 py-3 flex items-center justify-between animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-4 text-white text-xs font-bold">
                      <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">{selectedExams.length}</div>
                      <span className="uppercase tracking-widest">Requests Selected</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleBulkAction("approve")} className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase hover:bg-emerald-600 transition shadow-lg">
                        Approve Selected
                      </button>
                      <button onClick={() => handleBulkAction("reject")} className="px-4 py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase hover:bg-amber-600 transition shadow-lg">
                        Reject Selected
                      </button>
                      <button onClick={() => setSelectedExams([])} className="px-4 py-1.5 rounded-lg bg-white/10 text-white text-[10px] font-black uppercase hover:bg-white/20 transition">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4 w-4">
                        <input 
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                          checked={selectedExams.length > 0 && selectedExams.length === filtered.length}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedExams(filtered.map(r => r._id));
                            else setSelectedExams([]);
                          }}
                        />
                      </th>
                      <th className="px-6 py-4">Student Info</th>
                      {role === "admin" && <th className="px-6 py-4">Authorized Center</th>}
                      <th className="px-6 py-4 text-center">Mode</th>
                      <th className="px-6 py-4">Schedule / Center</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((exam) => (
                      <tr key={exam._id} className={selectedExams.includes(exam._id) ? 'bg-green-50/30' : ''}>
                        <td className="px-6 py-5">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                            checked={selectedExams.includes(exam._id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedExams(prev => [...prev, exam._id]);
                              else setSelectedExams(prev => prev.filter(id => id !== exam._id));
                            }}
                          />
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            {exam.studentId?.profileImage || exam.studentId?.photo ? (
                              <Image
                                src={exam.studentId.profileImage || exam.studentId.photo || ""}
                                alt={exam.studentId?.name || "Student"}
                                width={36}
                                height={36}
                                unoptimized
                                className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-sm"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 font-black text-slate-400">
                                {(exam.studentId?.name || "N").charAt(0)}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-800 uppercase text-xs leading-none mb-1">{exam.studentId?.name || "N/A"}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{exam.studentId?.enrollmentNo || "—"}</p>
                            </div>
                          </div>
                        </td>
                        {role === "admin" && (
                          <td className="px-6 py-5">
                            <p className="font-bold text-slate-700 uppercase text-[10px] leading-tight mb-1">{exam.atcId?.trainingPartnerName || "N/A"}</p>
                            <p className="text-[10px] font-black text-blue-600 tracking-widest uppercase">ID: {exam.atcId?.tpCode || "—"}</p>
                          </td>
                        )}
                        <td className="px-6 py-5 text-center">
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${
                            exam.examMode === 'online' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                          }`}>
                            {exam.examMode}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          {exam.status === 'completed' ? (
                            <div className="flex flex-col gap-1">
                               <span className="text-[10px] font-black text-slate-400 uppercase">Attempt Completed</span>
                               <span className="text-xs font-bold text-slate-700">{new Date(exam.submittedAt || exam.updatedAt).toLocaleDateString()}</span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {exam.examDate ? (
                                <>
                                  <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                    <Calendar size={12} className="text-slate-400" /> {new Date(exam.examDate).toLocaleDateString()}
                                  </p>
                                  <p className="text-[10px] bg-slate-100 w-fit px-2 rounded text-slate-500 font-bold">{exam.examTime}</p>
                                </>
                              ) : (
                                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none italic">Waiting for schedule...</p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-5 text-center">
                           <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase border shadow-sm ${
                             exam.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                             exam.approvalStatus === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 
                             exam.approvalStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                           }`}>
                             {exam.status === 'completed' ? 'COMPLETED' : exam.approvalStatus}
                           </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                           <div className="flex items-center justify-end gap-2 text-slate-800">
                             {role === "admin" && exam.approvalStatus === "pending" && (
                               <>
                                 <button
                                   onClick={() => handleAction(exam._id, "approved", { admitCardReleased: true })}
                                   className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition"
                                 >
                                   Approve
                                 </button>
                                 <button
                                   onClick={() => handleAction(exam._id, "rejected")}
                                   className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-[10px] font-black uppercase shadow-lg shadow-red-100 hover:bg-red-700 transition"
                                 >
                                   Reject
                                 </button>
                               </>
                             )}
                             {role === "atc" && exam.status !== "completed" && (
                               <button
                                 onClick={() => openApproveModal(exam)}
                                 className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition"
                               >
                                 Edit Request
                               </button>
                             )}
                            {role === "atc" && exam.examMode === 'offline' && exam.approvalStatus === 'approved' && exam.status !== 'completed' && (
                                <button onClick={() => openResultModal(exam)} className="text-[10px] font-black uppercase underline underline-offset-4 text-orange-600 hover:text-orange-800">Enter Result</button>
                             )}
                             {(role === "atc" || role === "admin") && (exam.approvalStatus === "approved" || exam.status === "completed") && (
                                <button
                                  onClick={() => window.open(`${role === "admin" ? "/admin" : "/atc"}/document/admit-card/${exam._id}`, "_blank")}
                                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition"
                                >
                                  Admit Card
                                </button>
                              )}
                             {exam.offlineExamCopy && (
                                <button
                                  onClick={() => {
                                    const win = window.open();
                                    win?.document.write(`<html><head><title>Exam Copy - ${exam.studentId?.name}</title></head><body style="margin:0"><iframe src="${exam.offlineExamCopy}" frameborder="0" style="border:0; width:100%; height:100vh;" allowfullscreen></iframe></body></html>`);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition text-[10px] font-black uppercase shadow-sm"
                                >
                                  <FileText size={12} />
                                  View Copy
                                </button>
                              )}
                             {role === "admin" && canAccessResultDocs(exam) && (
                               <div className="flex flex-col gap-1.5">
                                 <button
                                   onClick={() => {
                                      window.open(`/admin/document/certificate/${exam._id}?download=1`, "_blank");
                                   }}
                                   className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition uppercase shadow-sm"
                                 >
                                    Download Certificate
                                 </button>
                                 <button
                                   onClick={() => {
                                      window.open(`/admin/document/marksheet/${exam._id}?download=1`, "_blank");
                                   }}
                                   className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition uppercase shadow-sm"
                                 >
                                    Download Marksheet
                                 </button>
                               </div>
                             )}
                            {role === "admin" && exam.offlineExamStatus === "review_pending" && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => promptIssueDateAndApprove(exam._id)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition"
                                >
                                  Approve Result
                                </button>
                              </div>
                            )}
                             {role === "admin" && canAccessResultDocs(exam) && (
                               <div className="flex flex-col gap-1.5">
                                 <button
                                   onClick={() => window.open(`/admin/document/certificate/${exam._id}?print=1&download=1`, "_blank")}
                                   className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition uppercase shadow-sm"
                                 >
                                   Print Certificate
                                 </button>
                                 <button
                                   onClick={() => window.open(`/admin/document/marksheet/${exam._id}?print=1&download=1`, "_blank")}
                                   className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition uppercase shadow-sm"
                                 >
                                   Print Marksheet
                                 </button>
                               </div>
                             )}
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal overlays */}
      {showApproveModal && selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-slate-800">
          <div className="bg-white w-full max-w-md rounded-4xl shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Finalize Schedule</h3>
                  <p className="text-xs text-slate-500 font-medium">Set the official exam date and time.</p>
                </div>
                <button onClick={() => setShowApproveModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
             </div>

             {/* Highlight ATC Suggestion */}
             {selectedExam?.examDate && (
               <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Calendar className="w-5 h-5 text-blue-600" />
                     <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Suggested by ATC</p>
                        <p className="text-sm font-black text-blue-900">{new Date(selectedExam.examDate).toLocaleDateString("en-IN")}</p>
                     </div>
                  </div>
                  <div className="px-2 py-1 bg-blue-600 text-white text-[9px] font-black rounded uppercase">Pre-filled</div>
               </div>
             )}

               <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={labelCls}>Final Exam Date</label>
                    <input 
                        type="date"
                        className={inputCls}
                        value={approvalForm.examDate}
                        onChange={(e) => setApprovalForm({...approvalForm, examDate: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={labelCls}>Final Exam Time</label>
                    <input
                      type="time"
                      className={inputCls}
                      value={approvalForm.examTime}
                      onChange={(e) => setApprovalForm({ ...approvalForm, examTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={labelCls}>Duration (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    max={600}
                    className={inputCls}
                    value={approvalForm.durationMinutes}
                    onChange={(e) =>
                      setApprovalForm({
                        ...approvalForm,
                        durationMinutes: Number(e.target.value) || 60,
                      })
                    }
                  />
                </div>



                {approvalForm.examMode === "online" && (
                <div className="space-y-2">
                   <label className={labelCls}>Select Question Set</label>
                   <select 
                      className={inputCls}
                      value={approvalForm.setId}
                      onChange={(e) => setApprovalForm({...approvalForm, setId: e.target.value})}
                   >
                     <option value="">Choose Set</option>
                     {questionSets.map(set => (
                       <option key={set._id} value={set._id}>{set.title} ({set.questionCount}Q)</option>
                     ))}
                   </select>
                </div>
                )}

                <button 
                  onClick={async () => {
                    if (role === "atc" && selectedExam) {
                      await handleAtcScheduleUpdate(selectedExam._id);
                    } else if (selectedExams.length > 0) {
                      setActionLoading("bulk");
                      try {
                        for (const id of selectedExams) {
                          const exam = requests.find((req) => req._id === id);
                          await apiFetch("/api/admin/exams/update", {
                            method: "POST",
                            headers: { 
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              requestId: id,
                              status: "approved",
                              ...approvalForm,
                              examMode: exam?.examMode || approvalForm.examMode,
                              setId: (exam?.examMode || approvalForm.examMode) === "online" ? approvalForm.setId : undefined,
                              admitCardReleased: role === "admin",
                            }),
                          });
                        }
                        setSelectedExams([]);
                        await fetchRequests();
                        setShowApproveModal(false);
                      } catch (err) { console.error(err); }
                      finally { setActionLoading(null); }
                    } else if (selectedExam) {
                      handleAction(selectedExam._id, "approved", {
                        ...approvalForm,
                        setId: selectedExam.examMode === "online" ? approvalForm.setId : undefined,
                        admitCardReleased: role === "admin",
                      });
                    }
                  }}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest hover:bg-black transition shadow-xl"
                >
                  {(actionLoading === "bulk" || actionLoading) ? "Processing..." : (role === "admin" ? "Approve & Release" : "Save Request Changes")}
                </button>
             </div>
          </div>
        </div>
      )}

      {showResultModal && selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-slate-800">
           <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden p-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Offline Result</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {selectedExam.studentId?.name} • {selectedExam.studentId?.enrollmentNo}
                    </p>
                 </div>
                 <button onClick={() => setShowResultModal(false)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition">
                    <X className="w-5 h-5 text-slate-400" />
                 </button>
              </div>

              <form onSubmit={handleResultSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className={labelCls}>Exam Status</label>
                        <select 
                          className={inputCls}
                          value={resultForm.status}
                          onChange={e => setResultForm({...resultForm, status: e.target.value as "not_appeared" | "appeared" | "published"})}
                          required
                        >
                           <option value="not_appeared">Not Appeared</option>
                           <option value="appeared">Attended</option>
                           <option value="published">Result Published (In Review)</option>
                        </select>
                     </div>

                     <div className="space-y-2">
                        <label className={labelCls}>Final Score</label>
                        <input 
                          type="number"
                          className={inputCls}
                          placeholder="e.g. 85"
                          value={resultForm.marks}
                          onChange={e => setResultForm({...resultForm, marks: e.target.value})}
                          required={resultForm.status === 'published'}
                        />
                     </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs text-slate-700">
                    <span className="font-black uppercase tracking-wide text-slate-500">Grade (auto)</span>
                    <p className="mt-1 font-bold text-slate-900 tabular-nums">
                      {offlineDerivedGrade.grade}
                      <span className="font-medium text-slate-500 ml-2">({offlineDerivedGrade.pct}%)</span>
                    </p>
                  </div>

                  <div className="space-y-2">
                     <label className={labelCls}>Upload Exam Copy (PDF/Image)</label>
                     <div className="relative group">
                        <input 
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => setResultCopyFile(e.target.files?.[0] || null)}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className={`w-full py-10 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${resultCopyFile ? 'border-orange-500 bg-orange-50/30' : 'border-slate-200 bg-slate-50 group-hover:border-orange-200 group-hover:bg-orange-50/20'}`}>
                           <div className={`p-4 rounded-2xl mb-3 transition-colors ${resultCopyFile ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-orange-100 group-hover:text-orange-500'}`}>
                              <FileText size={24} />
                           </div>
                           <p className="text-xs font-black uppercase text-slate-500 tracking-widest leading-none mb-1">
                              {resultCopyFile ? resultCopyFile.name : "Click or Drag to Upload Copy"}
                           </p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase">Maximum size: 5MB (PDF or JPG)</p>
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                     <button type="button" onClick={() => setShowResultModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs">Cancel</button>
                     <button type="submit" disabled={resultSaving} className="flex-2 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-orange-700 transition shadow-xl shadow-orange-100">
                       {resultSaving ? <span className="flex items-center gap-2 justify-center"><RefreshCw size={14} className="animate-spin" /> Uploading...</span> : "Submit Result & Copy"}
                     </button>
                  </div>
               </form>
           </div>
        </div>
      )}

      {requestExamStudent && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-slate-800">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-blue-50/50">
                 <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Finalize Request</h3>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{requestExamStudent.name} • {requestExamStudent.enrollmentNo}</p>
                 </div>
                 <button onClick={() => setRequestExamStudent(null)} className="p-2 bg-white rounded-full border border-slate-100 text-slate-400">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              <form onSubmit={handleRequestExam} className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className={labelCls}>Student ID</label>
                      <input className={inputCls} value={requestExamStudent.enrollmentNo || "N/A"} readOnly />
                    </div>
                    <div className="space-y-2">
                      <label className={labelCls}>Mode (From Admission)</label>
                      <input
                        className={inputCls}
                        value={(requestExamStudent.examMode || "online").toUpperCase()}
                        readOnly
                      />
                    </div>

                    <div className="space-y-2">
                       <label className={labelCls}>Exam Date *</label>
                       <input 
                         type="date"
                         className={inputCls}
                         required
                         value={examReqForm.examDate}
                         onChange={e => setExamReqForm({...examReqForm, examDate: e.target.value})}
                       />
                    </div>




                    <div className="space-y-2">
                      <label className={labelCls}>Exam Time *</label>
                      <input
                        type="time"
                        className={inputCls}
                        required
                        value={examReqForm.examTime}
                        onChange={(e) => setExamReqForm({ ...examReqForm, examTime: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className={labelCls}>Duration (Minutes) *</label>
                      <input
                        type="number"
                        min={1}
                        max={600}
                        className={inputCls}
                        required
                        value={examReqForm.durationMinutes}
                        onChange={(e) => setExamReqForm({ ...examReqForm, durationMinutes: Number(e.target.value) || 60 })}
                      />
                    </div>

                    {requestExamStudent.examMode === "online" && (
                    <div className="space-y-2 col-span-full">
                       <label className={labelCls}>Set / Paper *</label>
                       <select 
                         className={inputCls}
                         value={examReqForm.setId}
                         onChange={e => setExamReqForm({...examReqForm, setId: e.target.value})}
                         required
                       >
                          <option value="">Choose Set</option>
                          {questionSets.map(set => (
                            <option key={set._id} value={set._id}>{set.title} ({set.questionCount}Q)</option>
                          ))}
                       </select>
                    </div>
                    )}
                  </div>

                  <div className="pt-4 flex gap-4">
                     <button type="button" onClick={() => setRequestExamStudent(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs">Cancel</button>
                     <button type="submit" disabled={requesting} className="flex-2 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs hover:bg-black transition shadow-xl">
                       {requesting ? "Submitting..." : "Submit Request"}
                     </button>
                  </div>
              </form>
           </div>
        </div>
      )}

      {issueDateExamId && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-slate-800">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Issue Date</h3>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">
                  This date will be printed on both the marksheet and the certificate.
                </p>
              </div>
              <button
                onClick={() => setIssueDateExamId(null)}
                className="p-2 bg-slate-50 rounded-full text-slate-400"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-7 py-5 space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Pick Issue Date *
              </label>
              <input
                type="date"
                value={issueDateValue}
                onChange={(e) => setIssueDateValue(e.target.value)}
                className={inputCls}
                required
              />
            </div>
            <div className="flex items-center gap-3 px-7 py-5 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setIssueDateExamId(null)}
                className="px-5 py-3 bg-white text-slate-600 rounded-xl text-xs font-black uppercase border border-slate-200 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmIssueDateApproval}
                disabled={!issueDateValue || actionLoading === issueDateExamId}
                className="ml-auto px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase hover:bg-emerald-700 transition shadow-lg shadow-emerald-100 disabled:opacity-60"
              >
                {actionLoading === issueDateExamId ? "Approving..." : "Approve & Release"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
