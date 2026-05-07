"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, Printer } from "lucide-react";
import { apiFetch } from "@/utils/api";
import { useBrand } from "@/context/BrandContext";
import { downloadElementAsA4Pdf } from "@/lib/downloadA4";
import CertificateBackgroundOverlay, {
  type CertificatePageData,
} from "@/components/certificate/CertificateBackgroundOverlay";
import DocumentTemplateBackground from "@/components/documents/DocumentTemplateBackground";

export default function AtcCertificatePage() {
  const { examId } = useParams();
  const router = useRouter();
  const { brandName } = useBrand();

  const [data, setData] = useState<CertificatePageData | null>(null);
  const [bg, setBg] = useState("");
  const [sig, setSig] = useState("");
  const [atcSig, setAtcSig] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const verifyUrl =
    typeof window !== "undefined" ? `${window.location.origin}/verification/certificate` : "";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);
    setBg("");
    setSig("");
    setAtcSig("");

    void apiFetch("/api/public/background/certificate")
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return;
        const nextBg = typeof body?.url === "string" && body.url.trim() !== "" ? body.url : "";
        setBg(nextBg);
      })
      .catch(() => {});

    void apiFetch("/api/public/settings?key=auth_signature")
      .then((r) => r.json())
      .then((sigRes) => {
        if (cancelled) return;
        if (sigRes?.value) {
          setSig(sigRes.value);
          return;
        }
        return apiFetch("/api/public/settings?key=authorized_signature")
          .then((r2) => r2.json())
          .then((sigRes2) => {
            if (!cancelled && sigRes2?.value) setSig(sigRes2.value);
          });
      })
      .catch(() => {});

    void (async () => {
      try {
        const docRes = await apiFetch(`/api/atc/documents/certificate?examId=${examId}`).then((r) =>
          r.json(),
        );
        if (cancelled) return;
        if (!docRes?.data) {
          router.push("/atc/dashboard");
          return;
        }
        setData(docRes.data as CertificatePageData);
        setAtcSig(typeof docRes.atcSignature === "string" ? docRes.atcSignature : "");
      } catch {
        if (!cancelled) router.push("/atc/dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [examId, router]);

  const handleDownloadPdf = useCallback(async () => {
    const el = document.getElementById("cert-a4");
    if (!el || !data) return;
    setDownloading(true);
    try {
      const studentObj =
        data?.studentId && typeof data.studentId === "object" ? data.studentId : null;
      const fileName = String(
        data?.serialNo || studentObj?.name || data?.enrollmentNo || "certificate",
      ).replace(/\s+/g, "_");
      await downloadElementAsA4Pdf(el, `${fileName}_Certificate`, "landscape");
    } catch (err) {
      console.error("Certificate download failed", err);
    } finally {
      setDownloading(false);
    }
  }, [data]);

  const docPending = loading && !data;
  const pdfReady = !!data;
  const showTextOverlay = !!data;

  return (
    <div className="flex min-h-screen flex-col items-center bg-slate-100 py-10 print:bg-white print:p-0">
      <div className="mb-8 flex flex-wrap gap-4 print:hidden">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold uppercase tracking-tight hover:bg-slate-50"
        >
          Back
        </button>
        {data ? (
          <>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading || !pdfReady}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-xs font-bold uppercase tracking-tight text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-60"
            >
              <Download size={16} /> {downloading ? "Preparing…" : "Download PDF (with background)"}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!pdfReady}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-xs font-bold uppercase tracking-tight text-white shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50"
            >
              <Printer size={16} /> Print (text only)
            </button>
          </>
        ) : null}
      </div>

      <div
        id="cert-a4"
        className="relative h-[210mm] w-[297mm] overflow-hidden bg-white shadow-2xl print:shadow-none"
      >
        {bg ? <DocumentTemplateBackground src={bg} /> : null}
        {showTextOverlay ? (
          <CertificateBackgroundOverlay
            data={data}
            brandName={brandName || undefined}
            signatureUrl={sig || undefined}
            atcSignatureUrl={atcSig || undefined}
            verifyUrl={verifyUrl}
          />
        ) : null}
        {docPending ? (
          <div className="pointer-events-none absolute inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-white/25 backdrop-blur-[1px] print:hidden">
            <div className="h-11 w-11 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Loading details…
            </p>
          </div>
        ) : null}
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
