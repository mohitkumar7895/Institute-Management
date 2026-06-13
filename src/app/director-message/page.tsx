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
              In the Context of rapid education and economic development it is felt that the general education system is not adequate to meet the growing demands for growing diversifying economy . It is generally felt that, there is much need for growing children to have better systematic education by proper trained teacher that is why teacher Vocational training should be seen as not merely it terms creating positive attitude towards work and general increase in the skill base, among the student but also as a strategy for giving a full package of Competence, required for giving, required for wage and self employment, to meet the man-power, needs on various sectors.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
              Sunil Group of Education Fashion and Technology Trust (All India )
            </h3>
            <div className="mt-4 space-y-4 text-sm leading-8 sm:text-base sm:leading-9">
              <p>
             Sunil Group of Education Fashion and Technology Trust (All India ) Organization started Electricians, Mobile repairing, AC repairing, Sollar pannal stolation, leather stitching operator,Fashion Designing, Khadi product,Interior Designing, Makeup Artist,Beautician, Computer Education,Lether Good product, Shoes Making, Juet handicraft, Glass Designing,Glass Art and Other skill development Course and SC,ST entrepreneur support, Skill development, industrial grievance resolution, Vendor development programs,Government scheme awareness,Trade fairs & exhibitions Industrial development, Training & awareness,MDP-ESDP Training program, Government liaison, Vendor development. Course all over India, with the help & co-operation of educational experts and Successful entrepreneur with a view of train unemployed educated girls & Boys, particularly the girls & Boys  of Scheduled Caste 
              </p>
              <p className="font-medium text-slate-700">
                हमारा उद्देश्य समाज को विभिन्न ट्रेड जैसे  ग्लास डिजाइनिंग, बैंगल्स डिजाइनिंग, गारमेंट्स मैन्युफैक्चरिंग, फैशन डिजाइनिंग, इंटीरियर डिजाइनिंग, कंप्यूटर एजुकेशन, कंप्यूटर हार्डवेयर नेटवर्किंग, लेदर गुड्स प्रोडक्ट, जुट प्रोडक्ट, शूज मेकिंग, हैंडीक्राफ्ट, इंडस्टरीज डेवलपमेंट प्रोग्राम, इंडस्ट्रीज अवेयरनेस प्रोग्राम, इंडस्ट्रीज ट्रेनिंग सेमिनार आदि कराकर समाज  के छात्र एवं छात्राओं महिला एवं पुरुषों को इस तरीके से ट्रेनिंग के साथ तैयार किया जाए कि उनमें से एक अच्छा उद्यमी निकालकर आए अपने उद्यम को लगाए अपना स्वरोजगार स्थापित करें और समाज को एक नई दिशा दें एक पहचान दे और बहुत से लोगों को स्वरोजगार दे 
              </p>
              <p className="font-semibold text-slate-800">आपके उज्ज्वल भविष्य की शुभकामनाओ के साथ</p>
              <p className="font-extrabold text-slate-900">डॉ सुनील जैन</p>
              <p className="font-extrabold text-slate-900">Dr.Sunniil kumar jain</p>
            </div>
          </div>
        </div>
      </div>
    </InternalPageLayout>
  );
}
