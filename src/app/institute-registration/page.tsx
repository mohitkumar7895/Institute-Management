import InternalPageLayout from "@/components/InternalPageLayout";
import { getBrandName } from "@/lib/settings";

export default async function InstituteRegistrationPage() {
  const brandName = await getBrandName();

  return (
    <InternalPageLayout
      title="Institute Registration"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "About Us", href: "/about-institute" },
        { label: "Institute Registration" },
      ]}
    >
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="max-w-4xl space-y-4 text-sm leading-8 text-slate-500 sm:text-base sm:leading-9">
          <h2 className="text-2xl font-extrabold text-slate-900">Institute Registration</h2>
          <p>
            {brandName} is a registered training institute under Sunil Group of Education Fashion and
            Technology Trust (SGEFTT), Government of India. The institute functions as a recognized body
            for skill development, vocational education, franchise affiliation and authorized training
            center (ATC) operations across India.
          </p>
          <p>
            Institute registration reflects our legal standing, operational transparency and commitment
            to delivering structured training programmes in compliance with applicable norms. It also
            assures students, parents, franchise partners and training centers that courses, admissions
            and certifications are conducted through an organized and accountable system.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-lg font-extrabold text-slate-900">Registered Under</h3>
            <p className="mt-3 text-sm leading-8 text-slate-600 sm:text-base">
              Sunil Group of Education Fashion and Technology Trust (SGEFTT), All India — a registered
              organization working in the field of education, fashion, technology and skill development.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-lg font-extrabold text-slate-900">SIFT Programme</h3>
            <p className="mt-3 text-sm leading-8 text-slate-600 sm:text-base">
              SIFT Skill Development Institute programmes are undertaken by SGEFTT and are designed to
              promote vocational training, entrepreneurship and industry-ready skills for youth across
              the country.
            </p>
          </div>
        </div>

        <div className="max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-extrabold text-slate-900">What Institute Registration Covers</h3>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-8 text-slate-600 sm:text-base">
            <li>Official institute identity under SGEFTT</li>
            <li>Authorized conduct of skill development and vocational courses</li>
            <li>Student enrollment, examination and certification processes</li>
            <li>Franchise and ATC affiliation across India</li>
            <li>Course registration, fee structure and training standards</li>
            <li>Verification support for students, certificates and training centers</li>
          </ul>
        </div>

        <div className="max-w-4xl space-y-4 text-sm leading-8 text-slate-500 sm:text-base sm:leading-9">
          <h3 className="text-xl font-extrabold text-slate-900">For Students &amp; Partners</h3>
          <p>
            Students seeking admission, franchise owners planning to open a training center, and ATC
            partners looking for affiliation can connect with {brandName} through the official enquiry
            and registration process. Our team provides guidance on course selection, infrastructure
            requirements, documentation and center setup support.
          </p>
          <p>
            Institute registration is the foundation of trust for every learner and partner associated
            with our organization. We remain committed to maintaining professional standards in education,
            training delivery and student support at every level.
          </p>
        </div>
      </div>
    </InternalPageLayout>
  );
}
