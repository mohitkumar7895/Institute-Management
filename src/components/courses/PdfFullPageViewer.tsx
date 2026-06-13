"use client";

import { FileText, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type PdfFullPageViewerProps = {
  src: string;
  title: string;
  featured?: boolean;
  forceLoad?: boolean;
};

function buildViewUrl(src: string) {
  const base = src.split("#")[0];
  return `${base}#view=FitH&zoom=page-fit&toolbar=0&navpanes=0`;
}

export default function PdfFullPageViewer({ src, title, featured = false, forceLoad = false }: PdfFullPageViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const viewSrc = buildViewUrl(src);

  useEffect(() => {
    if (forceLoad) setShouldLoad(true);
  }, [forceLoad]);

  useEffect(() => {
    if (shouldLoad) setIsReady(false);
  }, [viewSrc, shouldLoad]);

  useEffect(() => {
    if (featured || shouldLoad) return;

    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "80px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [featured, shouldLoad]);

  return (
    <div
      ref={containerRef}
      id="course-pdf-viewer"
      className={`relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 ${
        featured ? "bg-slate-50 py-2 sm:py-3" : "bg-slate-100/80 py-2 sm:py-3"
      }`}
    >
      <div className={`mx-auto w-full px-3 sm:px-4 ${featured ? "max-w-[1280px]" : "max-w-[1100px]"}`}>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div
            className={`flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5 ${
              featured ? "bg-[#0a0aa1] text-white" : "bg-slate-50 text-slate-800"
            }`}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  featured ? "bg-white/15" : "bg-rose-50 text-rose-600"
                }`}
              >
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className={`text-[10px] font-bold uppercase tracking-wider ${featured ? "text-blue-100" : "text-slate-400"}`}>
                  {featured ? "Course Brochure" : "Document"}
                </p>
                <p className="truncate text-sm font-bold">{title}</p>
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                featured ? "bg-white/15" : "bg-slate-200 text-slate-600"
              }`}
            >
              PDF
            </span>
          </div>

          <div className="relative bg-slate-100">
            {!shouldLoad ? (
              <div className="flex h-[78vh] min-h-[520px] flex-col items-center justify-center gap-4 px-6 text-center">
                <FileText className="h-10 w-10 text-[#0a0aa1]" />
                <div>
                  <p className="text-base font-bold text-slate-800">Courses brochure ready</p>
                  <p className="mt-1 text-sm text-slate-500">Open only when needed so the page stays fast.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShouldLoad(true)}
                  className="rounded-xl bg-[#0a0aa1] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#080885]"
                >
                  Open Brochure
                </button>
              </div>
            ) : (
              <>
                {!isReady ? (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/90">
                    <Loader2 className="h-8 w-8 animate-spin text-[#0a0aa1]" />
                    <p className="text-sm font-semibold text-slate-600">Loading brochure...</p>
                  </div>
                ) : null}
                <iframe
                  src={viewSrc}
                  title={title}
                  loading="lazy"
                  onLoad={() => setIsReady(true)}
                  className="block h-[78vh] w-full min-h-[520px] border-0 bg-white sm:h-[82vh]"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
