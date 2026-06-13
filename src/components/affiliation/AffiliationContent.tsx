import { getBrandName } from "@/lib/settings";

const minimumRequirements = [
  "5 Computers",
  "5 Silai Machines",
  "IT Labs",
  "300 Sq. Ft. Area with 3 Rooms",
  "Office",
  "Reception",
  "CCTV",
  "Internet Connection",
  "Printer & Scanner",
  "White Board & Notice Board",
  "Drinking Water",
  "Washroom",
  "Library",
];

const whoCanApply = [
  "Any individual with IT background/Non IT background",
  "Any One who is the resident of India",
  "Exiting Computer Center",
  "Regd. Societies & Trusts",
  "Schools up to Sen. Sec. Level",
  "Religious / Charitable Organization",
  "Should be willing to invest required amount of money in setting up a center with proper infrastructure and man power",
];

export default async function AffiliationContent() {
  const brandName = await getBrandName();
  return (
    <div className="mx-auto w-full max-w-6xl text-slate-700">
      <div className="max-w-5xl space-y-10">
        <section>
          <h2 className="text-2xl font-extrabold leading-tight text-slate-800 sm:text-4xl lg:text-5xl">
            Computer Education Franchise, Computer Training Institute Affiliation
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base sm:leading-8">
            For the first time {brandName} launching offer to provide franchise all over India
            without taking any franchise fees. {brandName} is one of the best institutions to
            provide computer education in India.
          </p>
        </section>

        <section>
          <h3 className="text-2xl font-bold text-slate-800 sm:text-3xl lg:text-[2.6rem]">
            How to open computer education center?
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base sm:leading-8">
            Computer education center provides self-employment opportunity. But Mostly People do Now know
            about How to open computer education Center? They have no proper information to affiliation &
            franchisee for new computer education center. Here, we will discuss requirements for starting up
            new computer education center.
          </p>
        </section>

        <section>
          <h3 className="text-2xl font-bold leading-tight text-slate-800 sm:text-3xl lg:text-[2.6rem]">
            Start your own IT Education & Training Franchise with {brandName}
          </h3>
          <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base sm:leading-8">
            If you are looking for business opportunity in the education sector then {brandName} franchise
            will be the perfect platform to achieve your business goals. {brandName} has been one of the fast
            growing computer education providers in India. {brandName} is a Govt. Registered
            organization. You can start {brandName} franchisee if you meet minimum requirements mentioned below.
          </p>
        </section>

        <section>
          <h3 className="text-2xl font-bold text-slate-800 sm:text-3xl lg:text-[2.6rem]">Minimum Requirements</h3>
          <div className="mt-4 space-y-2 text-sm text-slate-500 sm:text-base">
            {minimumRequirements.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-2xl font-bold text-slate-800 sm:text-3xl lg:text-[2.6rem]">Who Can Apply?</h3>
          <div className="mt-4 space-y-2 text-sm text-slate-500 sm:text-base">
            {whoCanApply.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
