"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  Building2, LayoutDashboard, LogOut, CheckCircle,
  Phone, Mail, User, Menu, XCircle, Users, Monitor, BookOpen, FileText,
  Lock, Eye, EyeOff, ShieldAlert, Clock, CreditCard, UserPlus
} from "lucide-react";
import dynamic from "next/dynamic";

const StudentManager = dynamic(() => import("@/components/atc/StudentManager"), { 
  loading: () => <div className="p-10 text-center font-bold text-slate-400">Loading Student Manager...</div>,
  ssr: false 
});
const ExamRequestManager = dynamic(() => import("@/components/admin/ExamRequestManager"), { 
  loading: () => <div className="p-10 text-center font-bold text-slate-400">Loading Exam Manager...</div>,
  ssr: false 
});
const ExamSetManager = dynamic(() => import("@/components/admin/ExamSetManager"), { 
  loading: () => <div className="p-10 text-center font-bold text-slate-400">Loading Exam Sets...</div>,
  ssr: false 
});
const StudyMaterialManager = dynamic(() => import("@/components/admin/StudyMaterialManager"), { 
  loading: () => <div className="p-10 text-center font-bold text-slate-400">Loading Materials...</div>,
  ssr: false 
});
const CertificateRequestManager = dynamic(() => import("@/components/atc/CertificateRequestManager"), { 
  loading: () => <div className="p-10 text-center font-bold text-slate-400">Loading Certificates...</div>,
  ssr: false 
});
const FeeManager = dynamic(() => import("@/components/common/FeeManager"), { 
  loading: () => <div className="p-10 text-center font-bold text-slate-400">Loading Fee Manager...</div>,
  ssr: false 
});
const AtcReports = dynamic(() => import("@/components/atc/AtcReports"), { 
  loading: () => <div className="p-10 text-center font-bold text-slate-400">Loading Reports...</div>,
  ssr: false 
});

interface AtcUser {
  id: string;
  tpCode: string;
  trainingPartnerName: string;
  mobile?: string;
  email?: string;
  application?: {
    chiefName: string;
    designation: string;
    trainingPartnerAddress: string;
    district: string;
    state: string;
    pin: string;
    yearOfEstablishment: string;
    statusOfInstitution: string;
    educationQualification: string;
    dob: string;
  };
}

import { useBrand } from "@/context/BrandContext";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/utils/api";
import WalletSection from "@/components/atc/WalletSection";

export default function AtcDashboardPage() {
  const { brandName, brandLogo, brandMobile, brandEmail } = useBrand();
  usePageTitle("atc");
  const router = useRouter();
  const [user, setUser] = useState<AtcUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tab, setTab] = useState<"dashboard" | "students" | "frontAdmission" | "profile" | "exams" | "examSets" | "materials" | "certificates" | "fees" | "wallet">("dashboard");
  const [studentInitialFilter, setStudentInitialFilter] = useState<"all" | "pending" | "approved" | "rejected" | "disabled">("all");
  const [stats, setStats] = useState({ 
    total: 0, pendingReview: 0, active: 0, rejected: 0, blocked: 0, directPending: 0,
    frontAll: 0, frontPending: 0, frontApproved: 0, frontRejected: 0
  });
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [centerInfo, setCenterInfo] = useState({ trainingPartnerName: "", mobile: "", email: "" });
  const [passData, setPassData] = useState({ old: "", new: "", confirm: "" });
  const [passSaving, setPassSaving] = useState(false);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { user: authUser, loading: authLoading, sessionReady, logout } = useAuth();

  useEffect(() => {
    if (!sessionReady || authLoading) return;

    if (!authUser || authUser.role !== "atc") {
      setLoading(false);
      router.replace("/atc/login");
      return;
    }

    setUser(authUser as unknown as AtcUser);

    let cancelled = false;
    const loadStats = async () => {
      try {
        const res = await apiFetch("/api/atc/me");
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (data.stats) setStats(data.stats);
        }
      } catch (err) {
        console.error("Dashboard stats error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadStats();
    return () => {
      cancelled = true;
    };
  }, [authUser, authLoading, sessionReady, router]);

  useEffect(() => {
    if (!user) return;
    setCenterInfo({
      trainingPartnerName: user.trainingPartnerName,
      mobile: user.mobile ?? "",
      email: user.email ?? "",
    });
  }, [user]);

  const handleLogout = async () => {
    await logout();
  };

  const handleProfileSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveMsg(null);
    setSaving(true);

    if (!centerInfo.trainingPartnerName.trim()) {
      setSaveMsg({ type: "error", text: "Center name is required." });
      setSaving(false);
      return;
    }

    if (!/^[0-9]{10}$/.test(centerInfo.mobile)) {
      setSaveMsg({ type: "error", text: "Mobile number must be 10 digits." });
      setSaving(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(centerInfo.email)) {
      setSaveMsg({ type: "error", text: "Please enter a valid email address." });
      setSaving(false);
      return;
    }

    try {
      const res = await apiFetch("/api/atc/me", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(centerInfo),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveMsg({ type: "error", text: data.message || "Update failed." });
      } else {
        setSaveMsg({ type: "success", text: data.message || "Center details updated." });
        if (data.user) {
          setUser({
            id: data.user.id,
            tpCode: data.user.tpCode,
            trainingPartnerName: data.user.trainingPartnerName,
            mobile: data.user.mobile,
            email: data.user.email,
          });
        }
        setEditMode(false);
      }
    } catch {
      setSaveMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    if (!passData.old || !passData.new) { setPassMsg({ type: "error", text: "All fields are required." }); return; }
    if (passData.new !== passData.confirm) { setPassMsg({ type: "error", text: "Passwords do not match." }); return; }
    if (passData.new.length < 6) { setPassMsg({ type: "error", text: "Password must be 6+ chars." }); return; }

    setPassSaving(true);
    try {
      const res = await apiFetch("/api/atc/settings/password", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ oldPassword: passData.old, newPassword: passData.new }),
      });
      const data = await res.json();
      if (!res.ok) { setPassMsg({ type: "error", text: data.message || "Failed." }); }
      else { 
        setPassMsg({ type: "success", text: "Password updated!" });
        setPassData({ old: "", new: "", confirm: "" });
      }
    } catch { setPassMsg({ type: "error", text: "Network error." }); }
    finally { setPassSaving(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 rounded-full border-4 border-green-200 border-t-green-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const currentDate = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-slate-50 flex relative">
      <title>Institute Panel | {brandName}</title>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-linear-to-b from-[#0a2e1a] to-[#0a7a3b] text-white flex flex-col shadow-2xl z-50 transition-transform duration-300 transform lg:translate-x-0 lg:static lg:block ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-4 py-1 border-b border-white/10 flex items-start justify-between">
          <div className="flex-1 flex flex-col items-center text-center gap-0">
            <div className="h-24 w-24 shrink-0 overflow-hidden flex items-center justify-center">
              {brandLogo ? (
                <Image src={brandLogo} alt={brandName} width={96} height={96} unoptimized className="h-full w-full object-contain scale-[1.75]" />
              ) : (
                <Building2 className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="-mt-2 overflow-hidden w-full">
              <p className="font-bold text-sm leading-none">{brandName || "Institution Brand"}</p>
              <p className="text-green-300 text-[10px] font-black uppercase tracking-widest mt-0">{user.tpCode}</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition">
            <XCircle className="w-5 h-5 text-green-200" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-2">
          <button
            onClick={() => { setTab("dashboard"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "dashboard" ? "bg-white/20 text-white" : "text-green-200 hover:bg-white/10 hover:text-white"}`}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
          <button
            onClick={() => { setTab("frontAdmission"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "frontAdmission" ? "bg-white/20 text-white" : "text-green-200 hover:bg-white/10 hover:text-white"}`}
          >
            <UserPlus className="w-4 h-4" /> Front Admission
            {stats.frontPending > 0 && (
              <span className="ml-auto bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                {stats.frontPending}
              </span>
            )}
          </button>
          <button
            onClick={() => { setTab("students"); setStudentInitialFilter("all"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "students" ? "bg-white/20 text-white" : "text-green-200 hover:bg-white/10 hover:text-white"}`}
          >
            <Users className="w-4 h-4" /> My Students
          </button>
          <button
            onClick={() => { setTab("exams"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "exams" ? "bg-white/20 text-white" : "text-green-200 hover:bg-white/10 hover:text-white"}`}
          >
            <Monitor className="w-4 h-4" /> Exam Requests
          </button>

          <button
            onClick={() => { setTab("certificates"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "certificates" ? "bg-white/20 text-white" : "text-green-200 hover:bg-white/10 hover:text-white"}`}
          >
            <CheckCircle className="w-4 h-4" /> Certificate Requests
          </button>
          <button
            onClick={() => { setTab("materials"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "materials" ? "bg-white/20 text-white" : "text-green-200 hover:bg-white/10 hover:text-white"}`}
          >
            <FileText className="w-4 h-4" /> Study Materials
          </button>
          <button
            onClick={() => { setTab("wallet"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "wallet" ? "bg-white/20 text-white" : "text-green-200 hover:bg-white/10 hover:text-white"}`}
          >
            <CreditCard className="w-4 h-4" /> Wallet
          </button>
          <button
            onClick={() => { setTab("fees"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "fees" ? "bg-white/20 text-white" : "text-green-200 hover:bg-white/10 hover:text-white"}`}
          >
            <CreditCard className="w-4 h-4" /> Fee Management
          </button>
          <button
            onClick={() => { setTab("examSets"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "examSets" ? "bg-white/20 text-white" : "text-green-200 hover:bg-white/10 hover:text-white"}`}
          >
            <BookOpen className="w-4 h-4" /> My Exam Sets
          </button>
          <button
            onClick={() => { setTab("profile"); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${tab === "profile" ? "bg-white/20 text-white" : "text-green-200 hover:bg-white/10 hover:text-white"}`}
          >
            <User className="w-4 h-4" /> Profile
          </button>
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-300 hover:bg-red-500/20 hover:text-red-200 transition"
          >
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
              <Building2 className="w-6 h-6 text-green-700" />
              <span className="font-bold text-slate-800 text-sm">ATC Portal</span>
            </div>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-xl font-bold text-slate-800">
              {tab === "dashboard" ? "Dashboard" : 
               tab === "students" ? "Student Management" : 
               tab === "frontAdmission" ? "Front Admission" : 
               tab === "exams" ? "Exam Requests" :
               tab === "certificates" ? "Certificate Requests" :
               tab === "examSets" ? "My Exam Sets" :
               tab === "materials" ? "Study Materials" :
               tab === "wallet" ? "Wallet" :
               tab === "fees" ? "Fee Management" :
               "My Profile"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">{currentDate}</p>
          </div>
          <div className="lg:hidden">
            <span className="text-[10px] bg-green-50 text-green-700 px-3 py-1 rounded-full font-bold uppercase">{tab}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-200 text-blue-700 text-xs sm:text-sm font-semibold hover:bg-blue-50 transition"
            >
              Back to Website
            </Link>
            <button 
              onClick={() => setTab("profile")}
              className="w-9 h-9 rounded-xl bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow hover:scale-105 transition"
            >
              {user.trainingPartnerName?.charAt(0).toUpperCase() || "U"}
            </button>
            <button onClick={handleLogout} className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {(tab === "dashboard" || tab === "profile") && (
            <>
              {/* Welcome Banner */}
              <div className="bg-linear-to-r from-[#0a2e1a] via-[#0d4d2e] to-[#0a7a3b] rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-5 h-5 text-green-300" />
                    <span className="text-green-300 text-sm font-semibold">Account Active</span>
                  </div>
                  <h2 className="text-2xl font-extrabold leading-tight">
                    Welcome, {user.trainingPartnerName || "User"}!
                  </h2>
                  <p className="text-green-200 text-sm mt-1">Your Authorized Training Center portal is ready.</p>
                </div>
                {tab === "profile" && (
                  <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-center">
                    <p className="text-xs text-green-300 font-semibold mb-0.5">Your TP Code</p>
                    <p className="text-2xl font-extrabold tracking-wider">{user.tpCode}</p>
                  </div>
                )}
              </div>

              {tab === "dashboard" && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Front Admission Overview</h3>
                      <button onClick={() => setTab("frontAdmission")} className="text-[10px] font-black text-green-600 uppercase hover:underline">View All</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-x divide-slate-100">
                      {[
                        { label: "Total Requests", value: stats.frontAll, icon: Users, color: "text-blue-600" },
                        { label: "Pending", value: stats.frontPending, icon: Clock, color: "text-amber-600" },
                        { label: "Approved", value: stats.frontApproved, icon: CheckCircle, color: "text-green-600" },
                        { label: "Rejected", value: stats.frontRejected, icon: XCircle, color: "text-rose-600" },
                      ].map((card) => (
                        <div key={card.label} className="p-6 flex items-center gap-4 group hover:bg-slate-50 transition">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center group-hover:scale-110 transition">
                            <card.icon className={`w-6 h-6 ${card.color}`} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{card.label}</p>
                            <p className="text-2xl font-black text-slate-800">{card.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { label: "Total Students", value: stats.total || 0, icon: Users, bgColor: "bg-blue-50", textColor: "text-blue-600", dotColor: "bg-blue-100", labelColor: "text-blue-700" },
                      { label: "Pending Review", value: stats.pendingReview || 0, icon: Clock, bgColor: "bg-amber-50", textColor: "text-amber-600", dotColor: "bg-amber-100", labelColor: "text-amber-700" },
                      { label: "Active Students", value: stats.active || 0, icon: CheckCircle, bgColor: "bg-green-50", textColor: "text-green-600", dotColor: "bg-green-100", labelColor: "text-green-700" },
                      { label: "Rejected Students", value: stats.rejected || 0, icon: XCircle, bgColor: "bg-rose-50", textColor: "text-rose-600", dotColor: "bg-rose-100", labelColor: "text-rose-700" },
                      { label: "Disabled Students", value: stats.blocked || 0, icon: ShieldAlert, bgColor: "bg-slate-50", textColor: "text-slate-600", dotColor: "bg-slate-100", labelColor: "text-slate-700" },
                    ].map((card) => (
                      <div
                        key={card.label}
                        className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm cursor-default select-none pointer-events-none"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className={`w-10 h-10 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                            <card.icon className={`w-5 h-5 ${card.textColor}`} />
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.dotColor} ${card.labelColor} uppercase tracking-wider`}>Live</span>
                        </div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">{card.label}</p>
                        <p className="text-2xl font-black text-slate-800 mt-1">{card.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Reports Component */}
                  <AtcReports />

                </div>
              )}

              {tab === "profile" && (
                <>
                  {/* Info Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "TP Code", value: user.tpCode, icon: Building2, bgColor: "bg-green-50", textColor: "text-green-600" },
                      { label: "Portal Status", value: "Active", icon: CheckCircle, bgColor: "bg-emerald-50", textColor: "text-emerald-600" },
                      { label: "Role", value: "ATC Partner", icon: User, bgColor: "bg-teal-50", textColor: "text-teal-600" },
                      { label: "Access Level", value: "Standard", icon: LayoutDashboard, bgColor: "bg-green-50", textColor: "text-green-600" },
                    ].map((card) => (
                      <div key={card.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${card.bgColor} flex items-center justify-center shrink-0`}>
                          <card.icon className={`w-5 h-5 ${card.textColor}`} />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">{card.label}</p>
                          <p className="font-bold text-slate-800 text-sm mt-0.5">{card.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Contact Info Block */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                      <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-green-600" /> Account Information
                        </h3>
                        <p className="text-sm text-slate-500">Edit your center contact details and team information here.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSaveMsg(null);
                          setEditMode((current) => !current);
                        }}
                        className="inline-flex items-center justify-center rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100 transition"
                      >
                        {editMode ? "Cancel Edit" : "Edit Center Info"}
                      </button>
                    </div>

                    {saveMsg && (
                      <div className={`mb-4 rounded-2xl px-4 py-3 text-sm font-semibold ${saveMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                        {saveMsg.text}
                      </div>
                    )}

                    {editMode ? (
                      <form className="space-y-4" onSubmit={handleProfileSave}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="block text-xs font-black uppercase tracking-[0.24em] text-slate-400 mb-2">Center Name</label>
                            <input
                              type="text"
                              value={centerInfo.trainingPartnerName}
                              onChange={(e) => setCenterInfo((prev) => ({ ...prev, trainingPartnerName: e.target.value }))}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                              placeholder="Authorized Training Center Name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-black uppercase tracking-[0.24em] text-slate-400 mb-2">Mobile Number</label>
                            <input
                              type="tel"
                              value={centerInfo.mobile}
                              onChange={(e) => setCenterInfo((prev) => ({ ...prev, mobile: e.target.value.replace(/\D/g, "") }))}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                              placeholder="10-digit mobile number"
                              maxLength={10}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-black uppercase tracking-[0.24em] text-slate-400 mb-2">Email Address</label>
                          <input
                            type="email"
                            value={centerInfo.email}
                            onChange={(e) => setCenterInfo((prev) => ({ ...prev, email: e.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                            placeholder="center@example.com"
                          />
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                          <button
                            type="button"
                            onClick={() => setEditMode(false)}
                            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={saving}
                            className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 transition disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {saving ? "Saving..." : "Save Center Info"}
                          </button>
                        </div>
                      </form>
                    ) : (
                    <div className="space-y-3">
                        {[
                          { icon: Building2, label: "Training Partner", value: user.trainingPartnerName },
                          { icon: Mail, label: "Email", value: user.email },
                          { icon: Phone, label: "Mobile", value: user.mobile },
                          { icon: CheckCircle, label: "Status", value: "Approved & Active" },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                              <item.icon className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">{item.label}</p>
                              <p className="text-sm font-semibold text-slate-800">{item.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ATC REGISTRATION DETAILS */}
                  {user.application && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-hidden">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 uppercase tracking-tight">Detailed Registration Records</h3>
                          <p className="text-xs text-slate-500 mt-0.5">Below are your full details as per the Approved Center Application.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {[
                          { label: "Director / Chief Name", value: user.application.chiefName },
                          { label: "Designation", value: user.application.designation },
                          { label: "Registered Address", value: user.application.trainingPartnerAddress },
                          { label: "City / District", value: user.application.district },
                          { label: "State & PIN", value: `${user.application.state} - ${user.application.pin}` },
                          { label: "Year of Establishment", value: user.application.yearOfEstablishment },
                          { label: "Status of Institution", value: user.application.statusOfInstitution },
                          { label: "Qualifications", value: user.application.educationQualification },
                          { label: "Director DOB", value: user.application.dob },
                        ].map((detail) => (
                          <div key={detail.label} className="flex flex-col border-b border-slate-50 pb-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{detail.label}</span>
                             <span className="text-xs font-bold text-slate-700 uppercase">{detail.value || "Not Provided"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Security & Password */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">Security & Credentials</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Maintain your account security by updating your login password regularly.</p>
                      </div>
                    </div>

                    {passMsg && (
                      <div className={`mb-6 rounded-2xl px-4 py-3 text-sm font-semibold ${passMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                        {passMsg.text}
                      </div>
                    )}

                    <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Password</label>
                        <div className="relative">
                          <input 
                            type={showOldPass ? "text" : "password"} 
                            value={passData.old}
                            onChange={e => setPassData(p => ({ ...p, old: e.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-orange-100 transition" 
                            placeholder="Current" 
                          />
                          <button type="button" onClick={() => setShowOldPass(!showOldPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                            {showOldPass ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Password</label>
                        <div className="relative">
                          <input 
                            type={showNewPass ? "text" : "password"} 
                            value={passData.new}
                            onChange={e => setPassData(p => ({ ...p, new: e.target.value }))}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-orange-100 transition" 
                            placeholder="6+ characters" 
                          />
                          <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                            {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirm New Password</label>
                        <input 
                          type="password" 
                          value={passData.confirm}
                          onChange={e => setPassData(p => ({ ...p, confirm: e.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-100 transition" 
                          placeholder="Repeat" 
                        />
                      </div>
                      <div className="md:col-span-3 flex justify-end">
                        <button
                          type="submit"
                          disabled={passSaving}
                          className="px-8 py-3 rounded-2xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 transition transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
                        >
                          {passSaving ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                          Update Portal Password
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Contact Support */}
                  <div className="bg-linear-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-lg">Need Help?</h3>
                      <p className="text-slate-300 text-sm mt-0.5">Contact our support team for any assistance.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <a href={brandMobile ? `tel:${brandMobile.replace(/\s+/g, "")}` : "#"} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm font-semibold hover:bg-white/20 transition">
                        <Phone className="w-4 h-4" /> {brandMobile || "Support Mobile"}
                      </a>
                      <a href={brandEmail ? `mailto:${brandEmail}` : "#"} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-sm font-semibold hover:bg-white/20 transition">
                        <Mail className="w-4 h-4" /> Email Support
                      </a>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {tab === "students" && (
            <StudentManager initialFilter={studentInitialFilter} />
          )}

          {tab === "frontAdmission" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Front Admission Overview</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-x divide-slate-100">
                  {[
                    { label: "Total Requests", value: stats.frontAll, icon: Users, color: "text-blue-600" },
                    { label: "Pending", value: stats.frontPending, icon: Clock, color: "text-amber-600" },
                    { label: "Approved", value: stats.frontApproved, icon: CheckCircle, color: "text-green-600" },
                    { label: "Rejected", value: stats.frontRejected, icon: XCircle, color: "text-rose-600" },
                  ].map((card) => (
                    <div key={card.label} className="p-6 flex items-center gap-4 group hover:bg-slate-50 transition">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center group-hover:scale-110 transition">
                        <card.icon className={`w-6 h-6 ${card.color}`} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{card.label}</p>
                        <p className="text-2xl font-black text-slate-800">{card.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <StudentManager isDirectAdmission={true} />
            </div>
          )}

          {tab === "exams" && (
            <ExamRequestManager atcId={user.id} role="atc" />
          )}

          {tab === "certificates" && (
            <CertificateRequestManager atcId={user.id} role="atc" />
          )}

          {tab === "examSets" && (
            <ExamSetManager role="atc" />
          )}

          {tab === "materials" && (
            <StudyMaterialManager role="atc" />
          )}

          {tab === "fees" && (
            <FeeManager role="atc" />
          )}

          {tab === "wallet" && (
            <WalletSection />
          )}
        </div>
      </main>
    </div>
  );
}
