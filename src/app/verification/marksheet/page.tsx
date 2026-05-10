"use client";

import { useMemo, useState } from "react";
import InternalPageLayout from "@/components/InternalPageLayout";
import { Search, FileText, User, Calendar, BookOpen, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { ISO_DATE_MIN, isoDateToday, sanitizeIsoDateInput } from "@/lib/isoDate";

export default function MarksheetVerification() {
  const dobMax = useMemo(() => isoDateToday(), []);
  const [enrollment, setEnrollment] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/public/verify/marksheet?enrollment=${enrollment}&dob=${dob}`);
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.message || "Marksheet record not found");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <InternalPageLayout 
      title="Marksheet Verification"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Verification" },
        { label: "Marksheet Verification" }
      ]}
    >
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-[#0a0aa1] p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-2">Verify Marksheet</h2>
              <p className="text-blue-100">Enter student details to verify academic performance</p>
            </div>
            <div className="absolute right-[-20px] top-[-20px] opacity-10">
              <FileText size={160} />
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleVerify} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Enrollment Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Enter Enrollment Number"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0a0aa1] focus:border-transparent transition-all outline-none"
                    value={enrollment}
                    onChange={(e) => setEnrollment(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Date of Birth</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <input
                    type="date"
                    required
                    min={ISO_DATE_MIN}
                    max={dobMax}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0a0aa1] focus:border-transparent transition-all outline-none"
                    value={dob}
                    onChange={(e) => setDob(sanitizeIsoDateInput(e.target.value))}
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0a0aa1] hover:bg-[#080885] text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:transform-none"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      VERIFY MARKSHEET
                    </>
                  )}
                </button>
              </div>
            </form>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 animate-in fade-in slide-in-from-top-2">
                <XCircle className="w-5 h-5 shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            {result && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-slate-100 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{result.studentName}</h3>
                    <p className="text-slate-500 font-medium">Enrollment: {result.enrollmentNumber}</p>
                  </div>
                  <div className={`flex items-center gap-2 px-6 py-2 rounded-xl border text-lg font-bold shadow-sm ${result.result === 'Pass' ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'}`}>
                    {result.result === 'Pass' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                    {result.result.toUpperCase()} (Grade: {result.grade})
                  </div>
                </div>

                <div className="overflow-hidden border border-slate-200 rounded-2xl mb-8">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Subject Name</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Marks Obtained</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Max Marks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {result.subjects.map((sub: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-800">{sub.name}</td>
                          <td className="px-6 py-4 text-center font-bold text-slate-900">{sub.marks}</td>
                          <td className="px-6 py-4 text-center text-slate-500">{sub.maxMarks}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50/80 font-bold">
                        <td className="px-6 py-4 text-slate-900 uppercase">Total Marks</td>
                        <td className="px-6 py-4 text-center text-xl text-[#0a0aa1]">{result.totalMarks}</td>
                        <td className="px-6 py-4 text-center text-slate-600">{result.maxTotalMarks}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-500 uppercase">Percentage</span>
                    <span className="text-lg font-bold text-slate-900">{((result.totalMarks / result.maxTotalMarks) * 100).toFixed(2)}%</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-500 uppercase">Examination Year</span>
                    <span className="text-lg font-bold text-slate-900">{result.examYear || '2024'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6 flex gap-4">
          <AlertCircle className="w-6 h-6 text-blue-600 shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-bold mb-1">Notice:</p>
            <p>This is a computer-generated marksheet verification page. The official hard copy marksheet issued by the authorized body should be considered final for all official purposes.</p>
          </div>
        </div>
      </div>
    </InternalPageLayout>
  );
}
