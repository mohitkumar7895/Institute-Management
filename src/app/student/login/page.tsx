"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { GraduationCap, Lock, User, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { useBrand } from "@/context/BrandContext";

export default function StudentLoginPage() {
  const router = useRouter();
  const { brandName, brandLogo } = useBrand();
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentNo, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      router.push("/student/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl mb-4 transform -rotate-6 hover:rotate-0 transition-transform duration-300 overflow-hidden">
            {isHydrated && brandLogo ? (
              <Image src={brandLogo} alt={brandName} width={112} height={112} unoptimized className="h-full w-full object-contain scale-125" />
            ) : (
              <GraduationCap size={44} />
            )}
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Student Portal</h1>
          <p className="text-slate-500 font-medium mt-1">Login to access your course & results</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-100 border border-slate-100 p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-700 text-sm font-semibold animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Enrollment number</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <User size={18} />
                </div>
                <input
                  required
                  type="text"
                  placeholder="e.g. ATC-0426-0001"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-semibold focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300"
                  value={enrollmentNo}
                  onChange={(e) => setEnrollmentNo(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Password (Mobile No.)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  required
                  type="password"
                  placeholder="••••••••••"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-semibold focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:from-blue-700 hover:to-indigo-800 transform hover:-translate-y-1 transition-all duration-300 shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:transform-none"
            >
              {loading ? (
                <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center">
            <p className="text-xs text-slate-500 font-medium">
              Don't have access? Please contact your <br />
              Authorized Training Center for help.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex text-xs text-blue-600 hover:text-blue-800 transition"
            >
              ← Back to Website
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-[10px] mt-8 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
          <CheckCircle2 className="w-3 h-3 text-green-500" /> Secure Login Portal
        </p>
      </div>
    </div>
  );
}
