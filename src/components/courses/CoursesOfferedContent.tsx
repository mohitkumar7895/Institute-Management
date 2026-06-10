"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface Course {
  _id: string;
  name: string;
  shortName: string;
  courseFee: number;
}

export default function CoursesOfferedContent() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enquiryCourse, setEnquiryCourse] = useState<Course | null>(null);

  // Form state
  const [formData, setFormData] = useState({ name: "", email: "", mobile: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch("/api/public/courses");
        if (res.ok) {
          const data = await res.json();
          setCourses(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

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
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <h2 className="text-2xl font-extrabold text-slate-800 sm:text-4xl lg:text-5xl">Courses Offered</h2>

      <div className="mt-5 overflow-x-auto border border-slate-300 bg-white relative">
        <table className="w-full min-w-[800px] border-collapse text-left">
          <thead className="bg-[#f1f1f1] text-slate-700">
            <tr>
              <th className="border border-slate-300 px-4 py-3 text-sm font-semibold">Sr. No.</th>
              <th className="border border-slate-300 px-4 py-3 text-sm font-semibold">Course Name</th>
              <th className="border border-slate-300 px-4 py-3 text-sm font-semibold">Short Name</th>
              <th className="border border-slate-300 px-4 py-3 text-sm font-semibold">Total Course Fee (INR)</th>
              <th className="border border-slate-300 px-4 py-3 text-sm font-semibold">Enquiry</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Loading courses...
                </td>
              </tr>
            ) : courses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No courses added yet. Admin will publish courses here.
                </td>
              </tr>
            ) : (
              courses.map((course, index) => (
                <tr key={course._id} className="align-top hover:bg-slate-50">
                  <td className="border border-slate-300 px-4 py-3 font-medium text-center">{index + 1}</td>
                  <td className="border border-slate-300 px-4 py-3 font-semibold">{course.name}</td>
                  <td className="border border-slate-300 px-4 py-3">{course.shortName}</td>
                  <td className="border border-slate-300 px-4 py-3 font-semibold text-slate-800">
                    ₹{course.courseFee || 0}
                  </td>
                  <td className="border border-slate-300 px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => setEnquiryCourse(course)}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 shadow-sm"
                    >
                      Enquiry
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {enquiryCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between bg-slate-50 px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Course Enquiry</h3>
              <button
                onClick={() => setEnquiryCourse(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEnquirySubmit} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-4">
                  You are enquiring for <span className="font-bold text-slate-800">{enquiryCourse.name}</span>.
                </p>
              </div>

              {message && (
                <div className={`p-3 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  {message.text}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name *</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile Number *</label>
                <input
                  required
                  type="tel"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm"
                  placeholder="Enter your mobile number"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm"
                  placeholder="Enter your email (optional)"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : "Submit Enquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
