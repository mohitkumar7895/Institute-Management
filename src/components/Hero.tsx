"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FRONT_COURSES } from "@/data/frontCourses";

const siftLine = " Promotion of MSMEs SC/ST entrepreneur support Skill development Industrial grievance resolution Vendor development programs Government scheme awareness Trade fairs & exhibitions. MSME support Industrial development Training & awareness Government liaison Vendor development. SIFT skill development by SGEFTT Ragister by government of india.";

const heroImages = [
  {
    src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
    alt: "Students working together",
  },
  {
    src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    alt: "Computer lab training session",
  },
  {
    src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80",
    alt: "Teacher guiding students",
  },
  {
    src: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80",
    alt: "Professional classroom environment",
  },
];

export default function Hero() {
  const [activeImage, setActiveImage] = useState(0);
  const programs = FRONT_COURSES;

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setActiveImage((current) => (current + 1) % heroImages.length);
    }, 3500);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section
      id="home"
      className="relative scroll-mt-20 min-h-[min(100dvh,920px)] overflow-hidden pt-6 sm:scroll-mt-24 sm:min-h-[620px] sm:pt-8 lg:min-h-[680px] lg:pt-10"
    >
      {heroImages.map((image, index) => (
        <div
          key={image.src}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === activeImage ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            priority={index === 0}
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-linear-to-br from-slate-950/80 via-slate-900/70 to-[#0a0aa1]/55" />

      <div className="relative mx-auto flex w-full max-w-6xl items-end px-3 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="w-full max-w-5xl space-y-3 sm:space-y-4">
          <p className="inline-flex max-w-full items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md sm:px-4 sm:py-1.5 sm:text-xs md:text-sm">
            SIFT Skill Development Institute
          </p>

          <h1 className="max-w-4xl text-xl font-black uppercase leading-snug text-white sm:text-2xl md:text-3xl lg:text-[2.35rem] lg:leading-tight">
            Upgrade Your Skills development and industries development Institute training Program.
          </h1>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-3 shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-md sm:p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-100 sm:text-[11px]">
              Training Programs Offered
            </p>
            <div className="max-h-32 overflow-y-auto pr-1 sm:max-h-44 md:max-h-none md:overflow-visible">
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {programs.map((program) => (
                  <span
                    key={program}
                    className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[9px] font-medium leading-snug text-white/95 sm:px-3 sm:py-1 sm:text-[10px] md:text-[11px]"
                  >
                    {program}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#0a0aa1]/40 bg-[#0a0aa1]/35 px-3 py-2.5 backdrop-blur-sm sm:px-5 sm:py-4">
            <p className="text-xs font-semibold leading-relaxed text-white sm:text-sm md:text-base md:leading-8">
              {siftLine}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:flex-wrap sm:gap-3">
            <Link
              href="#courses"
              className="inline-flex w-full items-center justify-center rounded-lg bg-[#0a0aa1] px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-[#08088a] sm:w-auto"
            >
              Explore Courses
            </Link>
            <Link
              href="#contact"
              className="inline-flex w-full items-center justify-center rounded-lg border border-white/50 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20 sm:w-auto"
            >
              Talk to Us
            </Link>
          </div>

          <div className="flex items-center gap-2 pt-2">
            {heroImages.map((image, index) => (
              <button
                key={image.src}
                type="button"
                onClick={() => setActiveImage(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === activeImage ? "w-10 bg-white" : "w-2.5 bg-white/55"
                }`}
                aria-label={`Show slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
