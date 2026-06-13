import Image from "next/image";
import { Handshake, Target, Users } from "lucide-react";

const processSteps = [
  {
    title: "TRADING STRATEGY",
    description:
      "Our working strategy Is to provide best situated to our clients",
    Icon: Target,
  },
  {
    title: "GROUP PLANING",
    description:
      "We move with proper planning so our students/client gets best benefit from us.",
    Icon: Users,
  },
  {
    title: "FINAL SUCCESS",
    description:
      "Final success is ours to provide best suited job to our students",
    Icon: Handshake,
  },
];

export default function WorkProcess() {
  return (
    <section className="relative overflow-hidden bg-[#1f1f1f] px-3 py-10 text-white sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
          alt="People working together"
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#111111]/76" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl">
        <div className="text-center">
          <p className="text-base font-light italic text-white/90 sm:text-lg">How work</p>
          <h2 className="mt-3 text-2xl font-black uppercase tracking-wide sm:text-3xl lg:text-[2.35rem]">
            WORK <span className="text-[#0909a5]">PROCESS</span>
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 bg-white" />
        </div>

        <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {processSteps.map(({ title, description, Icon }) => (
            <article
              key={title}
              className="border border-[#1010a8] bg-black/35 px-4 py-6 text-center shadow-[0_18px_36px_rgba(0,0,0,0.2)] backdrop-blur-[2px] transition hover:-translate-y-1 hover:bg-black/40 sm:px-6 sm:py-8"
            >
              <Icon className="mx-auto h-10 w-10 text-[#1111b8]" strokeWidth={1.5} />
              <h3 className="mt-5 text-lg font-extrabold uppercase sm:text-xl">
                {title}
              </h3>
              <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-white/95 sm:text-base">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}