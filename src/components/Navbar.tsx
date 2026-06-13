"use client";

// Navigation Bar Component with Brand Integration

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Clock3, Download, LogIn, Mail, Menu, Phone, Wallet, X, UserPlus } from "lucide-react";
import { type MouseEvent, useEffect, useMemo, useState } from "react";
import { NAV_LINKS } from "@/utils/constants";

import { useBrand } from "@/context/BrandContext";

export default function Navbar() {
  const { brandName, brandMobile, brandEmail, brandLogo } = useBrand();
  const [activeSection, setActiveSection] = useState("#home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(null);

  const sectionLinks = useMemo(
    () =>
      NAV_LINKS.flatMap((item) => [item.href, ...(item.children?.map((child) => child.href) ?? [])]).filter((href) =>
        href.startsWith("#") && href.length > 1,
      ),
    [],
  );

  useEffect(() => {
    const entries = sectionLinks
      .map((href) => {
        try {
          const section = document.querySelector(href);
          return section ? { href, section } : null;
        } catch {
          return null;
        }
      })
      .filter((entry): entry is { href: string; section: Element } => entry !== null);

    if (!entries.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (observedEntries) => {
        const visibleEntries = observedEntries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (!visibleEntries.length) return;

        const targetId = `#${visibleEntries[0].target.id}`;
        setActiveSection((current) => (current === targetId ? current : targetId));
      },
      {
        root: null,
        rootMargin: "-35% 0px -45% 0px",
        threshold: [0.2, 0.4, 0.7],
      },
    );

    entries.forEach((entry) => observer.observe(entry.section));
    return () => observer.disconnect();
  }, [sectionLinks]);

  useEffect(() => {
    const onHashChange = () => {
      if (sectionLinks.includes(window.location.hash)) {
        setActiveSection(window.location.hash);
      }
    };

    onHashChange();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [sectionLinks]);

  const scrollToSection = (href: string) => {
    if (!href.startsWith("#")) return;

    const section = document.querySelector(href);
    const stickyNav = document.querySelector('[data-sticky-nav="true"]');
    if (!section || !stickyNav) return;

    const headerHeight = stickyNav.getBoundingClientRect().height;
    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    const target = Math.max(0, sectionTop - headerHeight + 2);

    window.scrollTo({
      top: target,
      behavior: "smooth",
    });

    window.history.replaceState(null, "", href);
  };

  const handleNavClick = (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (!href.startsWith("#")) {
      setIsMobileMenuOpen(false);
      setOpenMobileDropdown(null);
      return;
    }

    event.preventDefault();
    setIsMobileMenuOpen(false);
    setOpenMobileDropdown(null);
    scrollToSection(href);
  };

  const isLinkActive = (href: string, children?: { href: string }[]) => {
    if (activeSection === href) return true;
    return children?.some((child) => child.href === activeSection) ?? false;
  };

  const shouldOpenInNewTab = (href: string) => href === "/admin/login" || href === "/student/login";

  return (
    <header className="relative z-50">
      <div className="bg-[#0a0aa1] text-xs text-white">
        <div className="mx-auto flex w-full max-w-330 items-center justify-between gap-2 px-3 py-2 sm:px-6 sm:py-2.5 lg:px-8">
          <p className="flex min-w-0 items-center gap-1.5 font-medium text-[9px] sm:text-xs md:text-sm">
            <Clock3 className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" />
            <span className="truncate">Mon to Sat: 9AM to 5PM</span>
          </p>
          <div className="hidden items-center gap-4 sm:flex">
            <Link href="/atc/login" className="inline-flex items-center gap-1 hover:text-blue-200">
              <LogIn className="h-3 w-3" />
              ATC Login
            </Link>
            <Link href="/student/login" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-blue-200">
              <LogIn className="h-3 w-3" />
              Student Login
            </Link>
            <Link href="/download-section" className="inline-flex items-center gap-1 hover:text-blue-200">
              <Download className="h-3 w-3" />
              Downloads
            </Link>
            <Link href="/direct-admission" className="inline-flex items-center gap-1 hover:text-blue-200">
              <UserPlus className="h-3 w-3" />
              Direct Admission
            </Link>
            <Link href="#" className="inline-flex items-center gap-1 hover:text-blue-200">
              <Wallet className="h-3 w-3" />
              Pay Fees
            </Link>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex w-full max-w-330 flex-wrap items-center justify-between gap-3 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3 lg:gap-6 lg:px-8">
          <Link href="/" onClick={handleNavClick("/")} className="group flex min-w-0 flex-1 items-center gap-2 sm:ml-1 sm:gap-3 lg:ml-4 lg:gap-4">
            {brandLogo ? (
              <img
                src={brandLogo}
                alt={brandName}
                className="h-auto max-h-24 w-28 shrink-0 object-contain sm:max-h-32 sm:w-40 md:max-h-40 md:w-52 lg:max-h-48 lg:w-64"
              />
            ) : (
              <Image
                src="/ygroup-logo.svg"
                alt={brandName}
                width={400}
                height={168}
                className="h-auto w-28 shrink-0 object-contain sm:w-40 md:w-52 lg:w-64"
                priority
              />
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:gap-1">
              <span className="truncate text-sm font-black uppercase leading-none tracking-tight text-[#0a0aa1] sm:text-base lg:text-xl">
                {brandName}
              </span>
              <div className="hidden min-w-0 border-l-2 border-[#0a0aa1]/20 pl-2 sm:block sm:pl-2.5">
                <p className="text-[10px] font-bold uppercase leading-snug tracking-wide text-[#0a0aa1]/90 sm:text-[11px] lg:text-xs">
                  SIFT Skill Development Institute
                </p>
                <p className="max-w-[220px] text-[9px] font-medium leading-snug text-slate-600 sm:max-w-xs sm:text-[10px] lg:max-w-sm lg:text-[11px]">
                  Undertaken by Sunil Group of Education Fashion and Technology Trust
                </p>
              </div>
            </div>
          </Link>

          <div className="hidden shrink-0 items-center lg:flex">
            <div className="flex flex-col gap-3 border-l border-slate-200 pl-4 lg:gap-4 lg:pl-6">
              <a
                href={brandEmail ? `mailto:${brandEmail}` : undefined}
                className={`inline-flex items-center gap-2.5 lg:gap-3 ${brandEmail ? "hover:opacity-80" : "pointer-events-none"}`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#0a0aa1] text-white shadow-sm">
                  <Mail className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 lg:text-[11px]">Email Us</p>
                  <p className="truncate text-xs font-semibold text-slate-800 lg:text-sm">{brandEmail || "Not available"}</p>
                </div>
              </a>

              <a
                href={brandMobile ? `tel:${brandMobile.replace(/\s/g, "")}` : undefined}
                className={`inline-flex items-center gap-2.5 lg:gap-3 ${brandMobile ? "hover:opacity-80" : "pointer-events-none"}`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-[#0a0aa1] shadow-sm ring-1 ring-slate-200">
                  <Phone className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 lg:text-[11px]">Call Us</p>
                  <p className="whitespace-nowrap text-xs font-semibold text-slate-800 lg:text-sm">{brandMobile || "Not available"}</p>
                </div>
              </a>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="inline-flex shrink-0 items-center justify-center rounded-md border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-100 lg:hidden"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMobileMenuOpen ? (
          <div className="border-t border-slate-100 px-3 py-3 lg:hidden sm:px-6">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <a
                href={brandEmail ? `mailto:${brandEmail}` : undefined}
                className={`flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 ${brandEmail ? "" : "pointer-events-none"}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#0a0aa1] text-white">
                  <Mail className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Email Us</p>
                  <p className="truncate text-xs font-semibold text-slate-800">{brandEmail || "Not available"}</p>
                </div>
              </a>
              <a
                href={brandMobile ? `tel:${brandMobile.replace(/\s/g, "")}` : undefined}
                className={`flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 ${brandMobile ? "" : "pointer-events-none"}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-[#0a0aa1] ring-1 ring-slate-200">
                  <Phone className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Call Us</p>
                  <p className="text-xs font-semibold text-slate-800">{brandMobile || "Not available"}</p>
                </div>
              </a>
            </div>
          </div>
        ) : null}
      </div>

      <nav
        data-sticky-nav="true"
        className="sticky top-0 z-50 -mb-4 bg-transparent sm:-mb-6 lg:-mb-10"
      >
        <div
          id="mobile-nav"
          className={`mx-auto w-full max-w-330 overflow-x-clip px-2 py-2 lg:flex lg:items-center lg:justify-center lg:px-8 ${
            isMobileMenuOpen ? "flex flex-col" : "hidden"
          } lg:flex`}
        >
          <div className="flex w-full flex-col bg-[#0a0aa1] lg:max-w-280 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:px-5 lg:py-2.5 lg:shadow-[0_14px_28px_rgba(12,12,84,0.18)]">
            {NAV_LINKS.map((link) =>
              link.children?.length ? (
                <div key={link.label} className="group relative">
                  <button
                    type="button"
                    onClick={() => setOpenMobileDropdown((current) => (current === link.label ? null : link.label))}
                    className={`flex w-full items-center px-4 py-3 text-xs font-semibold text-white transition lg:w-auto lg:px-3 lg:py-2 xl:px-4 ${
                      isLinkActive(link.href, link.children) ? "text-blue-100" : "hover:text-blue-100"
                    }`}
                  >
                    {link.label}
                    <ChevronDown className="ml-2 h-3.5 w-3.5" />
                  </button>

                  <div className="hidden min-w-56 bg-[#0a0aa1]/95 py-2 text-sm text-white lg:absolute lg:left-0 lg:top-full lg:block lg:translate-y-2 lg:rounded-sm lg:opacity-0 lg:shadow-lg lg:ring-1 lg:ring-white/10 lg:transition lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
                    {link.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        target={shouldOpenInNewTab(child.href) ? "_blank" : undefined}
                        rel={shouldOpenInNewTab(child.href) ? "noopener noreferrer" : undefined}
                        onClick={handleNavClick(child.href)}
                        className="block px-4 py-2.5 text-left text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>

                  {openMobileDropdown === link.label ? (
                    <div className="space-y-1 bg-[#06067c] px-4 py-2 lg:hidden">
                      {link.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          target={shouldOpenInNewTab(child.href) ? "_blank" : undefined}
                          rel={shouldOpenInNewTab(child.href) ? "noopener noreferrer" : undefined}
                          onClick={handleNavClick(child.href)}
                          className="block py-2 text-xs font-medium text-white/85 transition hover:text-white"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={handleNavClick(link.href)}
                  className={`flex items-center px-4 py-3 text-xs font-semibold text-white transition lg:px-3 lg:py-2 xl:px-4 ${
                    isLinkActive(link.href) ? "text-blue-100" : "hover:text-blue-100"
                  }`}
                >
                  {link.label}
                </Link>
              ),
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
