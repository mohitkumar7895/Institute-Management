"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { courseImageFallback } from "@/utils/unsplashImage";

type CardProps = {
  title: string;
  description: string;
  image: string;
  pdfUrl?: string | null;
};

export default function Card({ title, description, image, pdfUrl }: CardProps) {
  const primary = image?.trim() || courseImageFallback(title);
  const fallback = useMemo(() => courseImageFallback(title), [title]);

  const [imageSrc, setImageSrc] = useState(primary);
  const [showPlaceholder, setShowPlaceholder] = useState(false);

  useEffect(() => {
    setImageSrc(image?.trim() || fallback);
    setShowPlaceholder(false);
  }, [image, fallback]);

  return (
    <article className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-36 w-full overflow-hidden bg-slate-200 sm:h-40 md:h-44 lg:h-48">
        {showPlaceholder ? (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-[#0a0aa1] to-[#1212c8] p-4 text-center">
            <span className="text-sm font-bold uppercase tracking-wide text-white sm:text-base">{title}</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={title}
            loading="lazy"
            decoding="async"
            className="course-card-image h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
            onError={() => {
              if (imageSrc !== fallback) {
                setImageSrc(fallback);
                return;
              }
              setShowPlaceholder(true);
            }}
          />
        )}
      </div>

      <div className="space-y-1.5 p-3 sm:p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 sm:text-base">{title}</h3>
        <p className="line-clamp-2 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">{description}</p>

        {pdfUrl ? (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-rose-700 ring-1 ring-rose-100 transition hover:bg-rose-100"
          >
            <FileText className="h-3.5 w-3.5" />
            View PDF
          </a>
        ) : null}
      </div>
    </article>
  );
}
