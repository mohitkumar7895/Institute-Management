import Link from "next/link";
import Image from "next/image";
import { faqData } from "@/data/faq";
import { getBrandName } from "@/lib/settings";

export default async function FaqAbout() {
  const brandName = await getBrandName();
  return (
    <section id="about" className="scroll-mt-24 bg-white px-3 py-10 sm:scroll-mt-28 sm:px-6 sm:py-12 lg:scroll-mt-32 lg:px-8 lg:py-16">
      <div className="mx-auto grid w-full max-w-6xl gap-8 md:gap-10 lg:grid-cols-[0.98fr_1.02fr] lg:gap-12 lg:items-start">
        <div id="faq" className="scroll-mt-24 sm:scroll-mt-28 lg:scroll-mt-32">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl lg:text-[2.35rem]">
              Frequently <span className="text-[#0a0aa1]">Questions</span>
            </h2>
            <div className="mt-4 h-1 w-18 bg-slate-200" />
          </div>

          <div className="mt-8 space-y-1 sm:mt-10">
            {faqData.map((item, index) => (
              <div
                key={item.question}
                className="grid grid-cols-[1.75rem_1fr] gap-4 sm:grid-cols-[2rem_1fr] sm:gap-5"
              >
                <div className="relative flex justify-center">
                  {index !== faqData.length - 1 ? (
                    <span className="absolute left-1/2 top-6 bottom-[-1.4rem] w-px -translate-x-1/2 bg-slate-300 sm:bottom-[-1.6rem]" />
                  ) : null}
                  <span
                    className={`relative z-10 mt-1 flex h-6 w-6 items-center justify-center rounded-full border-[3px] transition-colors ${
                      item.active
                        ? "border-[#3747b0] bg-white"
                        : "border-[#0a0aa1] bg-[#0a0aa1]"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        item.active ? "bg-[#0a0aa1]" : "bg-white"
                      }`}
                    />
                  </span>
                </div>

                <div className="pb-6 sm:pb-7">
                  <h3 className="max-w-md text-sm font-bold leading-6 text-slate-600 sm:text-base sm:leading-7">
                    {item.question}
                  </h3>
                  {item.answer ? (
                    <p className="mt-2 text-sm font-medium text-slate-500 sm:text-[0.95rem]">
                      {item.answer}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:pt-0.5">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 sm:text-3xl lg:text-[2.35rem]">
              About <span className="text-[#0a0aa1]">Us</span>
            </h2>
            <div className="mt-4 h-1 w-18 bg-slate-200" />
          </div>

          <div className="relative mt-9 sm:mt-10">
            <div className="absolute -left-5 top-5 h-28 w-full bg-slate-100 sm:-left-6 sm:top-6 sm:h-32 lg:w-[106%]" />
            <div className="relative h-32 overflow-hidden sm:h-36 lg:h-40">
              <Image
                src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80"
                alt="Computer lab"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

          <div className="mt-5 max-w-xl text-slate-500">
            <h3 id="about-institute" className="scroll-mt-24 text-xl font-black tracking-tight text-slate-900 sm:scroll-mt-28 sm:text-2xl lg:text-[1.9rem]">
              Who we are?
            </h3>
            <div className="mt-3 space-y-2 text-sm leading-7 text-slate-500 sm:text-[0.98rem] sm:leading-8">
              <p>We {brandName}, approved under MSME act by government of India,</p>
              <p>
                We have been started in the year 2018, with motto to educate students according to current industrial trend .Till date we have trained more than 500+ student right now most of them are working in well reputed Industries.
              </p>
              <p>
                We have very high qualified team who has wide range of experience in IT industry.
              </p>
            </div>

            <Link
              href="/about-institute"
              className="mt-5 inline-flex items-center gap-2 rounded-sm bg-[#0a0aa1] px-6 py-3 text-xs font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#080885]"
            >
              Read More
              <span className="text-sm leading-none">▶</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}