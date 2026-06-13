"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/utils/api";

const MAX_PDF_BYTES = 10 * 1024 * 1024;

type PdfItem = {
  _id: string;
  title: string;
  pdfFileName?: string;
  createdAt: string;
};

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function CoursePdfUploader() {
  const { loading: authLoading, user: authUser } = useAuth();
  const [items, setItems] = useState<PdfItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [pdfData, setPdfData] = useState("");
  const [pdfName, setPdfName] = useState("");

  const fetchItems = useCallback(async () => {
    if (authLoading || !authUser) return;
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/course-pdfs");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [authLoading, authUser]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const handleUpload = async () => {
    if (!pdfData) {
      alert("Please choose a PDF file first.");
      return;
    }
    setUploading(true);
    try {
      const res = await apiFetch("/api/admin/course-pdfs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || pdfName.replace(/\.pdf$/i, ""),
          pdf: pdfData,
          pdfFileName: pdfName,
        }),
      });
      if (res.ok) {
        setTitle("");
        setPdfData("");
        setPdfName("");
        void fetchItems();
      } else {
        const data = await res.json();
        alert(data.message || "Upload failed.");
      }
    } catch {
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this PDF from website?")) return;
    try {
      const res = await apiFetch(`/api/admin/course-pdfs/${id}`, { method: "DELETE" });
      if (res.ok) void fetchItems();
    } catch {
      alert("Delete failed.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-sm space-y-4">
      <div>
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-rose-600" />
          Upload PDF for Website
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title (Optional)</label>
          <input
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-rose-500 outline-none text-sm"
            placeholder="e.g. Fashion Designing Brochure"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">PDF File</label>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > MAX_PDF_BYTES) {
                alert("PDF is too large. Max 10MB allowed.");
                e.target.value = "";
                return;
              }
              setPdfData(await readFileAsDataUrl(file));
              setPdfName(file.name);
              if (!title.trim()) {
                setTitle(file.name.replace(/\.pdf$/i, ""));
              }
            }}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-rose-50 file:px-3 file:py-1 file:text-xs file:font-bold file:text-rose-700"
          />
          {pdfName ? <p className="mt-1 text-[10px] font-bold text-emerald-600">✓ {pdfName}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => void handleUpload()}
          disabled={uploading || !pdfData}
          className="inline-flex w-full items-center justify-center gap-2 py-3 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 transition disabled:opacity-60"
        >
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading..." : "Upload PDF"}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading uploaded PDFs...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400">No PDF uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-bold text-slate-800 truncate">{item.title}</p>
                <p className="text-xs text-slate-500 truncate">{item.pdfFileName || "document.pdf"}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/open-pdf/site/${item._id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-rose-50 px-3 py-1.5 text-[10px] font-bold uppercase text-rose-700 ring-1 ring-rose-100 hover:bg-rose-100"
                >
                  View
                </a>
                <button
                  type="button"
                  onClick={() => void handleDelete(item._id)}
                  className="p-2 text-slate-400 hover:text-red-600"
                  title="Delete PDF"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
