"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import PdfFullPageViewer from "@/components/courses/PdfFullPageViewer";
import { COURSES_OFFERED_PDF_TITLE, COURSES_OFFERED_PDF_URL, COURSES_OFFERED_PDF_VIEW_URL } from "@/data/coursesOfferedPdf";

interface Course {
  _id: string;
  name: string;
  shortName: string;
  courseFee: number;
  hasPdf?: boolean;
  pdfUrl?: string | null;
}

export default function CoursesOfferedContent() {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerSrc, setViewerSrc] = useState(COURSES_OFFERED_PDF_VIEW_URL);
  const [viewerTitle, setViewerTitle] = useState(COURSES_OFFERED_PDF_TITLE);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [enquiryCourse, setEnquiryCourse] = useState<Course | null>(null);

  const [formData, setFormData] = useState({ name: "", email: "", mobile: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const coursesRes = await fetch("/api/public/courses", { cache: "no-store" });

        if (!cancelled && coursesRes.ok) {
          const data = await coursesRes.json();
          setCourses(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  const showPdf = (title: string, url: string) => {
    setPdfLoaded(true);
    setViewerTitle(title);
    setViewerSrc(url);
    viewerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const resetBrochure = () => {
    setViewerTitle(COURSES_OFFERED_PDF_TITLE);
    setViewerSrc(COURSES_OFFERED_PDF_VIEW_URL);
    viewerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryCourse) return;
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/public/course-enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          courseId: enquiryCourse._id,
          courseName: enquiryCourse.name,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Enquiry submitted successfully!" });
        setFormData({ name: "", email: "", mobile: "" });
        setTimeout(() => {
          setEnquiryCourse(null);
          setMessage(null);
        }, 2000);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to submit enquiry" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex h-40 w-full max-w-6xl items-center justify-center text-sm font-medium text-slate-500">
        Loading courses...
      </div>
    );
  }

  const showingBrochure = viewerSrc === COURSES_OFFERED_PDF_VIEW_URL || viewerSrc === COURSES_OFFERED_PDF_URL;

  return (
    <div className="w-full">
      <div ref={viewerRef}>
        <PdfFullPageViewer src={viewerSrc} title={viewerTitle} featured forceLoad={pdfLoaded} />
      </div>

      {!showingBrochure ? (
        <div className="mx-auto mt-3 flex w-full max-w-6xl justify-end px-4">
          <button
            type="button"
            onClick={resetBrochure}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
            Back to main brochure
          </button>
        </div>
      ) : null}

      {courses.length > 0 ? (
        <div className="mx-auto mt-8 w-full max-w-6xl overflow-x-auto border border-slate-300 bg-white px-0 sm:px-0">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead className="bg-[#f1f1f1] text-slate-700">
              <tr>
                <th className="border border-slate-300 px-4 py-3 text-sm font-semibold">Sr. No.</th>
                <th className="border border-slate-300 px-4 py-3 text-sm font-semibold">Course Name</th>
                <th className="border border-slate-300 px-4 py-3 text-sm font-semibold">Short Name</th>
                <th className="border border-slate-300 px-4 py-3 text-sm font-semibold">Total Course Fee (INR)</th>
                <th className="border border-slate-300 px-4 py-3 text-sm font-semibold">PDF</th>
                <th className="border border-slate-300 px-4 py-3 text-sm font-semibold">Enquiry</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700">
              {courses.map((course, index) => {
                const coursePdf = course.pdfUrl || COURSES_OFFERED_PDF_URL;

                return (
                  <tr key={course._id} className="align-top hover:bg-slate-50">
                    <td className="border border-slate-300 px-4 py-3 text-center font-medium">{index + 1}</td>
                    <td className="border border-slate-300 px-4 py-3 font-semibold">{course.name}</td>
                    <td className="border border-slate-300 px-4 py-3">{course.shortName}</td>
                    <td className="border border-slate-300 px-4 py-3 font-semibold text-slate-800">
                      ₹{course.courseFee || 0}
                    </td>
                    <td className="border border-slate-300 px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => showPdf(course.name, coursePdf)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 ring-1 ring-rose-100 transition hover:bg-rose-100"
                      >
                        View PDF
                      </button>
                    </td>
                    <td className="border border-slate-300 px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setEnquiryCourse(course)}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        Enquiry
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {enquiryCourse ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="font-bold text-slate-800">Course Enquiry</h3>
              <button
                type="button"
                onClick={() => setEnquiryCourse(null)}
                className="text-slate-400 transition hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEnquirySubmit} className="space-y-4 p-6">
              <p className="text-sm text-slate-500">
                You are enquiring for <span className="font-bold text-slate-800">{enquiryCourse.name}</span>.
              </p>

              {message ? (
                <div
                  className={`rounded-xl p-3 text-sm font-medium ${
                    message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {message.text}
                </div>
              ) : null}

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Full Name *</label>
                <input
                  required
                  type="text"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Mobile Number *</label>
                <input
                  required
                  type="tel"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                  placeholder="Enter your mobile number"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Email Address</label>
                <input
                  type="email"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                  placeholder="Enter your email (optional)"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Submitting..." : "Submit Enquiry"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
