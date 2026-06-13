import { ReactNode } from "react";

type SectionWrapperProps = {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export default function SectionWrapper({
  id,
  title,
  subtitle,
  children,
  className = "",
}: SectionWrapperProps) {
  return (
    <section id={id} className={`scroll-mt-24 py-10 sm:scroll-mt-28 sm:py-12 lg:scroll-mt-32 lg:py-14 ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-6 lg:px-8">
        <div className="mb-6 text-center sm:mb-8">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mx-auto mt-2 max-w-2xl px-1 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              {subtitle}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}
