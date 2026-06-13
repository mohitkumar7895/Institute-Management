"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  FaChevronCircleRight,
  FaFacebookF,
  FaGooglePlusG,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaRegClock,
  FaTwitter,
  FaUniversity,
  FaYoutube,
} from "react-icons/fa";
import OurCertificates from "@/components/OurCertificates";
import { FOOTER_LINKS, SITE_INFO, SOCIAL_LINKS } from "@/utils/constants";
import { useBrand } from "@/context/BrandContext";

export default function Footer() {
  const { brandName, brandMobile, brandUrl, brandAddress } = useBrand();
  const socialIcons = [FaFacebookF, FaTwitter, FaYoutube, FaGooglePlusG];
  const prefersReducedMotion = useReducedMotion();

  const bannerCycleDuration = 4.5 + 6.5;

  return (
    <>
      <OurCertificates />
      <footer id="contact" className="scroll-mt-28 mt-12 bg-[#767171] text-white sm:scroll-mt-32">
      <div className="bg-white text-slate-700">
        <div className="bg-[#090995] text-white">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-4 px-4 py-7 sm:gap-6 sm:px-6 sm:py-9 md:flex-row md:items-center md:px-10 lg:px-16">
            <div className="max-w-3xl space-y-3">
              <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                Need More Service?
              </h2>
              <p className="text-sm leading-6 text-slate-100 sm:text-base sm:leading-7">
                Need More Services Kindly Contact us or email us.
              </p>
              <p className="text-sm leading-6 text-slate-100 sm:text-base sm:leading-7">
                We provide Franchises services all over India kidly share your requirements us..
              </p>
            </div>

            <Link
              href="#contact"
              className="inline-flex w-full items-center justify-center rounded-sm border-2 border-white px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white hover:text-[#090995] sm:w-auto sm:min-w-36"
            >
              CONTACT US
            </Link>
          </div>
        </div>

        <div className="overflow-hidden">
          <motion.div
            className="mx-auto flex w-full max-w-7xl items-center justify-center gap-2 px-4 py-6 text-center text-sm font-light text-[#7f7f7f] will-change-transform sm:px-6 sm:py-8 sm:text-xl lg:text-2xl"
            initial={{ x: "-8%" }}
            animate={
              prefersReducedMotion
                ? { x: 0 }
                : { x: ["-8%", "8%", "-8%"] }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : {
                    duration: bannerCycleDuration,
                    ease: "easeInOut",
                    repeat: Infinity,
                    times: [0, 4.5 / bannerCycleDuration, 1],
                  }
            }
          >
            <FaUniversity className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
            <p>
             Welcome to <span className="font-extrabold text-[#666666]">{brandName}</span>
            </p>
            <FaUniversity className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
          </motion.div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:gap-10 sm:px-6 sm:py-12 md:grid-cols-2 xl:grid-cols-[1.1fr_1fr_1.1fr_1.2fr]">
        <div className="flex items-start justify-center md:justify-start">
          <div className="inline-flex flex-col items-center text-center md:items-start md:text-left">
            <div className="leading-none">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-black text-white uppercase tracking-tighter">
                {brandName}
              </span>
            </div>
            </div>
            <p className="mt-3 text-sm text-slate-200">{brandUrl || "Official Website"}</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-extrabold uppercase tracking-[0.12em] text-white sm:text-xl">
            Quick Links
          </h3>
          <div className="mt-4 h-1 w-19 bg-[#13139f]" />
          <div className="mt-6 space-y-3">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-center gap-3 text-sm font-medium text-white transition hover:text-slate-100 sm:text-base"
              >
                <FaChevronCircleRight className="h-4 w-4 shrink-0 text-slate-200" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-extrabold uppercase tracking-[0.12em] text-white sm:text-xl">
            Stay With Us
          </h3>
          <div className="mt-4 h-1 w-19 bg-[#13139f]" />

          <div className="mt-6 space-y-5 text-slate-100">
            <div className="flex items-start gap-5">
              <FaMapMarkerAlt className="mt-1 h-5 w-5 shrink-0 text-[#0f0fbf]" />
              <div className="space-y-2 text-sm leading-6 sm:text-sm sm:leading-7">
                 <p className="font-extrabold text-white">{brandName}:</p>
                <p>{brandAddress || "Address not available"}</p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <FaPhoneAlt className="mt-1 h-4 w-4 shrink-0 text-[#0f0fbf]" />
              <div className="space-y-2 text-sm leading-6 sm:text-sm sm:leading-7">
                <p className="font-extrabold text-white">Phone Number:</p>
                <p>{brandMobile || "Mobile not available"}</p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <FaRegClock className="mt-1 h-4 w-4 shrink-0 text-[#0f0fbf]" />
              <div className="space-y-2 text-sm leading-6 sm:text-sm sm:leading-7">
                <p className="font-extrabold text-white">Door Open:</p>
                <p>{SITE_INFO.hours}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-extrabold uppercase tracking-[0.12em] text-white sm:text-xl">
            Map View
          </h3>
          <div className="mt-4 h-1 w-19 bg-[#13139f]" />

          <div className="mt-6 overflow-hidden border border-white/20 bg-white shadow-lg">
            <iframe
               title={`${brandName} Map`}
              src={brandAddress ? `https://www.google.com/maps?q=${encodeURIComponent(brandAddress)}&z=15&output=embed` : SITE_INFO.mapEmbedUrl}
              className="h-48 w-full sm:h-56 md:h-62.5"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {socialIcons.map((Icon, index) => {
              const social = SOCIAL_LINKS[index];
              return (
                <Link
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#3e3a3a] text-white transition hover:bg-[#13139f]"
                  aria-label={social.label}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-[#08089d] px-4 py-4 text-white sm:px-6 sm:py-5">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 text-center text-xs font-medium md:flex-row md:text-left sm:text-sm">
           <p>{brandName.toUpperCase()}  © {new Date().getFullYear()}</p>
          <p>
            Designed by <span className="font-bold">{SITE_INFO.designer}</span>
          </p>
        </div>
      </div>
    </footer>
    </>
  );
}
