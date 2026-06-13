"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { testimonials } from "@/data/testimonials";

export default function Feedback() {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeTestimonial = testimonials[activeIndex];

  const showPrevious = () => {
    setActiveIndex((current) =>
      current === 0 ? testimonials.length - 1 : current - 1,
    );
  };

  const showNext = () => {
    setActiveIndex((current) =>
      current === testimonials.length - 1 ? 0 : current + 1,
    );
  };

  return (
    <section id="feedback" className="scroll-mt-24 bg-white px-3 py-10 sm:scroll-mt-28 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <div className="mx-auto w-full max-w-6xl">
        <div className="text-center">
          <p className="text-sm font-light italic tracking-wide text-slate-500 sm:text-lg">
            our achievements
          </p>
          <h2 className="mt-3 text-2xl font-black uppercase tracking-wide text-slate-900 sm:text-3xl lg:text-[2rem]">
            Client <span className="text-[#0a0aa1]">Feedback</span>
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 bg-slate-200" />
        </div>

        <div className="mt-8 bg-[#f1f1f1] px-4 py-6 sm:mt-10 sm:px-8 sm:py-10 lg:px-12">
          <div className="flex flex-col items-center text-center">
            <Quote className="h-10 w-10 fill-[#0a0aa1] text-[#0a0aa1]" strokeWidth={1.5} />
            <p className="mt-5 max-w-4xl text-sm leading-7 text-slate-500 sm:text-base sm:leading-8">
              {activeTestimonial.quote}
            </p>
            <p className="mt-5 text-sm font-bold tracking-[0.16em] text-slate-600 sm:text-base">
              - {activeTestimonial.author}
            </p>

            <div className="mt-8 flex items-center gap-3 text-slate-400">
              <button
                type="button"
                onClick={showPrevious}
                className="rounded-full border border-transparent p-2 transition hover:border-slate-300 hover:text-slate-600"
                aria-label="Show previous feedback"
              >
                <ChevronLeft className="h-6 w-6" strokeWidth={1.25} />
              </button>
              <button
                type="button"
                onClick={showNext}
                className="rounded-full border border-transparent p-2 transition hover:border-slate-300 hover:text-slate-600"
                aria-label="Show next feedback"
              >
                <ChevronRight className="h-6 w-6" strokeWidth={1.25} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}