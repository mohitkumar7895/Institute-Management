import Image from "next/image";
import InternalPageLayout from "@/components/InternalPageLayout";

export default function DirectorMessagePage() {
  return (
    <InternalPageLayout
      title="Director Message"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "About Us", href: "/about-institute" },
        { label: "Director Message" },
      ]}
    >
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[320px_1fr] lg:items-start">
        <div className="mx-auto w-full max-w-90 lg:sticky lg:top-28">
          <div className="relative z-10 overflow-hidden border border-slate-300 bg-white shadow-sm">
            <div className="relative aspect-4/5 w-full">
              <Image
                src="/Director.jpeg"
                alt="Dr. Sunil Kumar Jain"
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 360px, 28vw"
                priority
              />
            </div>
          </div>
          <div className="-mt-8 ml-4 bg-slate-100 px-5 pt-10 pb-4 text-center shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">Dr. Sunil Kumar Jain</h2>
            <p className="text-lg font-extrabold leading-tight text-slate-900 sm:text-xl">Director</p>
          </div>
        </div>

        <div className="space-y-6 text-slate-600">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Introduction</h2>
            <div className="mt-4 space-y-4 text-sm leading-8 sm:text-base sm:leading-9">
              <p>
                The need to provide skill/vocational training is of pressing concern in the wake of rapid
                economic development and change on account of the scientific and technological advancement
                taking place in the country. There is no justification for continuation of a system of
                general education that is divorced from the socioeconomic needs of the communities.
                Vocationalisation of education is a need to be seen as a strategy to provide a full package
                of competence required for wage and self employment.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
              Sunil Group of Education Fashion and Technology Trust (All India)
            </h3>
            <div className="mt-4 space-y-4 text-sm leading-8 sm:text-base sm:leading-9">
              <p>
                The group covers various programmes including Electricians, Mobile Repairing, AC Repairing,
                Solar Panel Installation, Leather Stitching Operator, Fashion Designing, Khadi Product,
                Interior Designing, Makeup Artist, Beautician, Computer Education, Leather Goods Product,
                Shoes Making, Jute Handicraft, Glass Designing, Glass Art, other skill development courses,
                SC/ST entrepreneur support, skill development, industrial grievance resolution, vendor
                development programmes, government schemes awareness, trade fairs &amp; exhibitions,
                industrial development programmes, training &amp; awareness, MDP-ESDP training programme,
                government liaison, vendor development and more all over India to train unemployed girls and
                boys, especially those belonging to scheduled castes and scheduled tribes.
              </p>
              <p className="font-medium text-slate-700">
                सुनिल ग्रुप ऑफ एजुकेशन फैशन एंड टेक्नोलॉजी ट्रस्ट (ऑल इंडिया) भारत भर में बेरोज़गार
                युवाओं, विशेष रूप से अनुसूचित जाति व अनुसूचित जनजाति के युवाओं को ग्लास डिज़ाइनिंग,
                बंगल्स डिज़ाइनिंग, गारमेंट्स मैन्युफैक्चरिंग, फैशन डिजाइनिंग, इंटीरियर डिजाइनिंग,
                कंप्यूटर एजुकेशन, हार्डवेयर नेटवर्किंग, लेदर गुड्स, जूट प्रोडक्ट्स, शू मेकिंग,
                हैंडीक्राफ्ट्स आदि विभिन्न व्यावसायिक एवं कौशल विकास कार्यक्रमों के माध्यम से प्रशिक्षित
                कर उन्हें स्वावलंबी एवं उद्यमी बनाने हेतु प्रतिबद्ध है। हमारा उद्देश्य पुरुषों और
                महिलाओं को सफल उद्यमी बनाकर समाज को एक नई दिशा देना है।
              </p>
              <p className="font-semibold text-slate-800">आपके उज्ज्वल भविष्य की शुभकामनाओं के साथ</p>
              <p className="font-extrabold text-slate-900">डॉ. सुनील कुमार जैन</p>
            </div>
          </div>
        </div>
      </div>
    </InternalPageLayout>
  );
}
