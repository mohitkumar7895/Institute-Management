import InternalPageLayout from "@/components/InternalPageLayout";
import { getBrandName } from "@/lib/settings";

const trainingAreas = [
  "Government scheme awareness programmes",
  "SC/ST entrepreneur support initiatives",
  "Skill development and vocational training camps",
  "Industrial development and grievance resolution support",
  "Vendor development and liaison programmes",
  "Trade fairs and exhibitions participation",
  "MDP-ESDP training programmes",
  "Training & awareness for self-employment",
  "Women and youth entrepreneurship development",
  "Community-level employment generation activities",
];

const governmentFocus = [
  "Promoting wage employment and self-employment",
  "Supporting unemployed girls and boys across India",
  "Special training focus for Scheduled Caste and Scheduled Tribe youth",
  "Linking vocational education with local industry needs",
  "Encouraging small business, handicraft and manufacturing skills",
  "Building awareness about government training and subsidy schemes",
];

export default async function TrainingWithGovernmentOrganizationPage() {
  const brandName = await getBrandName();

  return (
    <InternalPageLayout
      title="Training with Government Organization"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "About Us", href: "/about-institute" },
        { label: "Training with Government Organization" },
      ]}
    >
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="max-w-4xl space-y-4 text-sm leading-8 text-slate-500 sm:text-base sm:leading-9">
          <h2 className="text-2xl font-extrabold text-slate-900">Training with Government Organization</h2>
          <p>
            {brandName}, through Sunil Group of Education Fashion and Technology Trust (SGEFTT),
            actively works with government organizations and supported schemes to strengthen skill
            development, vocational training and entrepreneurship across India.
          </p>
          <p>
            In a developing economy, general education alone cannot meet the diverse needs of industry
            and self-employment. Government-linked training plays a vital role in preparing youth with
            practical skills, business awareness and employment readiness. Our institute participates
            in such initiatives to ensure training reaches unemployed and underprivileged sections of
            society, especially in rural and semi-urban areas.
          </p>
        </div>

        <div className="rounded-xl border border-[#0a0aa1]/15 bg-[#0a0aa1]/5 p-6">
          <h3 className="text-lg font-extrabold text-[#0a0aa1]">Our Government Training Objective</h3>
          <p className="mt-3 text-sm leading-8 text-slate-600 sm:text-base">
            To provide vocational and skill-based training that creates direct employment, supports
            small enterprise development, and helps learners become self-reliant through government
            supported programmes and local industry engagement.
          </p>
        </div>

        <div className="max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-extrabold text-slate-900">Training Programmes &amp; Activities</h3>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {trainingAreas.map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-7 text-slate-600 sm:text-base">
                <span className="font-bold text-[#0a0aa1]">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="max-w-4xl space-y-4">
          <h3 className="text-xl font-extrabold text-slate-900">Social &amp; Employment Focus</h3>
          <ul className="list-disc space-y-3 pl-5 text-sm leading-8 text-slate-600 sm:text-base">
            {governmentFocus.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="max-w-4xl space-y-4 text-sm leading-8 text-slate-500 sm:text-base sm:leading-9">
          <h3 className="text-xl font-extrabold text-slate-900">Training Sectors Covered</h3>
          <p>
            Government-linked training through {brandName} includes programmes in fashion designing,
            interior designing, glass designing, leather goods, embroidery, computer education, mobile
            repairing, AC repairing, solar panel installation, beautician, makeup artist, shoe making,
            jute handicraft, khadi products and other vocational trades.
          </p>
          <p>
            By coordinating with government organizations, local industry and training partners, the
            institute continues to expand opportunities for youth to earn, learn and build sustainable
            livelihoods through recognized skill development pathways.
          </p>
        </div>
      </div>
    </InternalPageLayout>
  );
}
