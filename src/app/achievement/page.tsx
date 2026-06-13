import InternalPageLayout from "@/components/InternalPageLayout";
import { getBrandName } from "@/lib/settings";

const achievements = [
  "Successful implementation of skill development and vocational training programmes across India",
  "Training in Fashion Designing, Interior Designing, Glass Designing, Leather Goods, Embroidery and more",
  "Special focus on training unemployed youth, especially from Scheduled Castes and Scheduled Tribes",
  "Active participation in trade fairs, exhibitions and vendor development programmes",
  "Entrepreneurship and self-employment support through practical industry-oriented training",
  "MDP-ESDP and government-linked awareness programmes for industrial development",
  "Growing network of Authorized Training Centers (ATC) and franchise partners",
  "Strong emphasis on employability, wage employment and self-employment outcomes",
];

export default async function AchievementPage() {
  const brandName = await getBrandName();

  return (
    <InternalPageLayout
      title="Achievement"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "About Us", href: "/about-institute" },
        { label: "Achievement" },
      ]}
    >
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="max-w-4xl space-y-4 text-sm leading-8 text-slate-500 sm:text-base sm:leading-9">
          <h2 className="text-2xl font-extrabold text-slate-900">Our Achievements</h2>
          <p>
            {brandName}, undertaken by Sunil Group of Education Fashion and Technology Trust
            (SGEFTT), has steadily built a strong reputation in skill development, vocational education
            and industry-oriented training across India. Under the leadership of Dr. Sunil Kumar Jain,
            the institute has worked to bridge the gap between formal education and real employment
            needs in a rapidly changing economy.
          </p>
          <p>
            Our achievements reflect our commitment to practical learning, entrepreneurship development
            and social empowerment. We believe vocational training must provide a complete package of
            competence for both wage employment and self-employment, and our programmes are designed
            with this goal at the center.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            { value: "15+", label: "Skill & Vocational Programmes" },
            { value: "Pan India", label: "Training Network" },
            { value: "SGEFTT", label: "Govt. of India Initiative" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-6 text-center shadow-sm"
            >
              <p className="text-2xl font-black text-[#0a0aa1] sm:text-3xl">{item.value}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-extrabold text-slate-900">Key Milestones</h3>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-8 text-slate-600 sm:text-base">
            {achievements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="max-w-4xl space-y-4 text-sm leading-8 text-slate-500 sm:text-base sm:leading-9">
          <h3 className="text-xl font-extrabold text-slate-900">Courses & Training Areas</h3>
          <p>
            Over the years, {brandName} has expanded its training scope to cover Electrician programmes,
            Mobile Repairing, AC Repairing, Solar Panel Installation, Leather Stitching, Fashion
            Designing, Khadi Products, Interior Designing, Makeup Artist, Beautician, Computer Education,
            Leather Goods, Shoe Making, Jute Handicraft, Glass Designing, Glass Art and many other
            skill development courses.
          </p>
          <p>
            Through seminars, industrial grievance resolution support, government scheme awareness,
            vendor development and training &amp; awareness programmes, the institute continues to
            create new opportunities for learners to build independent and sustainable careers.
          </p>
        </div>
      </div>
    </InternalPageLayout>
  );
}
