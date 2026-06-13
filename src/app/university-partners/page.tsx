import InternalPageLayout from "@/components/InternalPageLayout";
import { getBrandName } from "@/lib/settings";

const universityPartners = [
  {
    name: "Yashwantrao Chavan Maharashtra Open University (YCMOU)",
    location: "Nashik, Maharashtra",
    description:
      "Collaborative academic association for open learning, vocational skill enhancement and structured certification pathways. This partnership supports distance-friendly education models and industry-oriented training for students seeking flexible learning opportunities.",
    highlights: [
      "Vocational and open learning support",
      "Skill-based certification pathways",
      "Flexible education for working learners",
    ],
  },
  {
    name: "Indira Gandhi National Open University (IGNOU)",
    location: "New Delhi, India",
    description:
      "National-level university collaboration focused on skill development, vocational programmes and learner-centric education. The partnership strengthens access to quality training, professional development and career-oriented learning across India.",
    highlights: [
      "National open university collaboration",
      "Skill and vocational programme alignment",
      "Broader access to higher learning opportunities",
    ],
  },
];

export default async function UniversityPartnersPage() {
  const brandName = await getBrandName();

  return (
    <InternalPageLayout
      title="University Partner"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "About Us", href: "/about-institute" },
        { label: "University Partner" },
      ]}
    >
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="max-w-4xl space-y-4 text-sm leading-8 text-slate-500 sm:text-base sm:leading-9">
          <h2 className="text-2xl font-extrabold text-slate-900">University Partner</h2>
          <p>
            {brandName} maintains academic collaborations with reputed university partners to strengthen
            the quality of vocational education, skill development and career-oriented training offered
            to students across India.
          </p>
          <p>
            These university partnerships help bridge practical institute-level training with recognized
            academic frameworks. Students benefit from structured learning, certification support and
            better opportunities for higher education, self-employment and professional growth.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {universityPartners.map((partner) => (
            <article
              key={partner.name}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{partner.location}</p>
              <h3 className="mt-2 text-lg font-extrabold leading-snug text-[#0a0aa1] sm:text-xl">
                {partner.name}
              </h3>
              <p className="mt-4 text-sm leading-8 text-slate-600 sm:text-base">{partner.description}</p>
              <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                {partner.highlights.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-slate-600">
                    <span className="font-bold text-[#0a0aa1]">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="max-w-4xl rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h3 className="text-xl font-extrabold text-slate-900">Benefits for Students</h3>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-8 text-slate-600 sm:text-base">
            <li>Better alignment between skill training and academic recognition</li>
            <li>Improved certification and career development opportunities</li>
            <li>Access to open and flexible university learning models</li>
            <li>Stronger foundation for employment and entrepreneurship</li>
            <li>Enhanced credibility through university-linked programmes</li>
          </ul>
        </div>

        <div className="max-w-4xl text-sm leading-8 text-slate-500 sm:text-base sm:leading-9">
          <p>
            Through these university partnerships, {brandName} continues to expand meaningful learning
            pathways for students in fashion, interior, glass design, leather goods, computer education,
            handicrafts and other vocational disciplines under SGEFTT.
          </p>
        </div>
      </div>
    </InternalPageLayout>
  );
}
