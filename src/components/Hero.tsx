"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

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
    <section id="home" className="scroll-mt-20 relative min-h-[58vh] overflow-hidden pt-8 sm:scroll-mt-24 sm:pt-10 lg:min-h-[64vh] lg:pt-12">
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
            className="object-cover"
            sizes="100vw"
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-slate-900/45" />

      <div className="relative mx-auto flex min-h-[58vh] w-full max-w-6xl items-center px-4 py-12 sm:min-h-[60vh] sm:px-6 lg:min-h-[64vh] lg:px-8">
        <div className="max-w-xl space-y-4 text-white">
          <p className="inline-block rounded-full bg-white/12 px-4 py-1 text-sm font-medium text-white backdrop-blur-sm">
            Career-focused training programs
          </p>
          <h1 className="text-3xl font-black leading-tight sm:text-4xl lg:text-[2.75rem] uppercase">
            Upgrade Your Skills With Professional Training Programs
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-slate-100 sm:text-base sm:leading-8">
            Fashion designing, interior designing, glass design, leather goods,
            skill development, seminars and S-IFT programs under SGEFTT, Govt of India.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="#courses"
              className="rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Explore Courses
            </Link>
            <Link
              href="#contact"
              className="rounded-md border border-white/60 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Talk to Us
            </Link>
          </div>

          <div className="flex items-center gap-2 pt-4">
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
