"use client";

import { useState } from "react";
import { 
  UserPlus, LogIn, FileText, Search, 
  Monitor, GraduationCap, 
  Download, ListChecks, ArrowRight, ExternalLink
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { useBrand } from "@/context/BrandContext";

type StudentSearchResult = {
  student: {
    name?: string;
    enrollmentNo?: string;
    course?: string;
    createdAt?: string;
    photo?: string;
  };
  examStatus?: string;
};

export default function StudentZonePage() {
  const { brandName, brandEmail } = useBrand();
  const [regNo, setRegNo] = useState("");
  const [searchResult, setSearchResult] = useState<StudentSearchResult | null>(null);
  const [searching, setSearching] = useState(false);

  const handleQuickSearch = async () => {
    if (!regNo.trim()) return;
    setSearching(true);
    setSearchResult(null);
    try {
      // Create a quick public info API for student status
      const res = await fetch(`/api/public/student-status?regNo=${regNo}`);
      const data = await res.json();
      if (res.ok) {
        setSearchResult(data);
      } else {
        alert(data.message || "Student not found");
      }
    } catch {
      alert("Error searching student details");
    } finally {
      setSearching(false);
    }
  };

  const zones = [
    {
      title: "Registration Process",
      desc: "Detailed guide on how to register for our professional training courses.",
      icon: ListChecks,
      link: "/admission",
      color: "bg-blue-500",
      tag: "Process"
    },

    {
      title: "Examination Process",
      desc: "Understand the pattern, duration, and rules of our examination system.",
      icon: FileText,
      link: "/about/exams",
      color: "bg-purple-500",
      tag: "Guidelines"
    },
    {
      title: "Online Exam Portal",
      desc: "Direct access to the secure online examination environment.",
      icon: Monitor,
      link: "/student/login",
      color: "bg-indigo-600",
      tag: "Live"
    },
    {
      title: "Student Login",
      desc: "Access your personalized dashboard to manage courses and results.",
      icon: LogIn,
      link: "/student/login",
      color: "bg-slate-900",
      tag: "Dashboard"
    },
    {
      title: "Download Admit Card",
      desc: "Enter your registration number to download your examination admit card.",
      icon: Download,
      link: "/student/dashboard",
      color: "bg-blue-600",
      tag: "Urgent"
    },
    {
      title: "Registered Students",
      desc: `Directory and search for currently enrolled students in ${brandName}.`,
      icon: GraduationCap,
      link: "#search",
      color: "bg-teal-500",
      tag: "Directory"
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero / Header */}
      <section className="bg-gradient-to-br from-[#0a0a2e] to-[#12124d] py-20 px-6 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight uppercase">
            STUDENT <span className="text-blue-400">ZONE</span>
          </h1>
          <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto font-medium opacity-80 mb-10">
            One-stop destination for admission, exams, results, and official student services.
          </p>

          {/* Global Search Interface */}
          <div id="search" className="max-w-3xl mx-auto bg-white/10 backdrop-blur-xl p-2 rounded-[2.5rem] border border-white/20 shadow-2xl flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center px-6">
              <Search className="text-blue-300 mr-4" size={24} />
              <input 
                type="text" 
                placeholder="Enter enrollment number or roll no…"
                className="bg-transparent border-none outline-none text-lg font-bold w-full placeholder:text-blue-200/50"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
              />
            </div>
            <button 
              onClick={handleQuickSearch}
              disabled={searching}
              className="px-10 py-5 bg-blue-500 hover:bg-blue-600 rounded-[2rem] font-black uppercase tracking-widest text-sm transition-all shadow-xl shadow-blue-900/40"
            >
              {searching ? "Searching..." : "Search Records"}
            </button>
          </div>
        </div>
        
        {/* Animated Background Blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -ml-48 -mb-48" />
      </section>

      {/* Search Result Overlay/Panel */}
      {searchResult && (
        <section className="max-w-7xl mx-auto px-6 -mt-10 mb-20 relative z-20">
          <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-8 md:p-12 animate-in slide-in-from-bottom-10 fade-in duration-500">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-50 pb-8 mb-8">
                <div className="flex items-center gap-6">
                   <div className="relative w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center border-2 border-white shadow-lg overflow-hidden shrink-0">
                      {searchResult.student?.photo ? (
                        <Image src={searchResult.student.photo} alt="Student" fill unoptimized className="object-cover" />
                      ) : (
                        <UserPlus className="text-blue-600 w-10 h-10" />
                      )}
                   </div>
                   <div>
                      <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">{searchResult.student?.name}</h2>
                      <p className="text-blue-600 font-black tracking-[0.2em] uppercase text-xs mt-1">Official Student Record</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Enrollment number</p>
                   <p className="text-xl font-black text-slate-800">{searchResult.student?.enrollmentNo}</p>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100/50">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Course</p>
                   <p className="text-lg font-black text-slate-700">{searchResult.student?.course}</p>
                </div>
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100/50">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Admission Date</p>
                   <p className="text-lg font-black text-slate-700">
                     {searchResult.student?.createdAt
                       ? new Date(searchResult.student.createdAt).toLocaleDateString()
                       : "—"}
                   </p>
                </div>
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100/50">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Exam Status</p>
                   <span className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                     {searchResult.examStatus || "Regular Student"}
                   </span>
                </div>
             </div>

             <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/student/login" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition flex items-center gap-2">
                   Login to Dashboard <ArrowRight size={14} />
                </Link>
                <button onClick={() => setSearchResult(null)} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition">
                   Close Search
                </button>
             </div>
          </div>
        </section>
      )}

      {/* Hub Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
           <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.4em] mb-4">Quick Links Hub</h2>
           <h3 className="text-3xl md:text-5xl font-black text-slate-800 uppercase tracking-tight">Explore the <span className="text-blue-600">Student Zone</span></h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {zones.map((zone, idx) => (
            <Link
              key={idx}
              href={zone.link}
              target={zone.link === "/student/login" ? "_blank" : undefined}
              rel={zone.link === "/student/login" ? "noopener noreferrer" : undefined}
              className="group relative flex flex-col justify-between p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden"
            >
               <div className={`absolute top-0 right-0 w-24 h-24 ${zone.color} opacity-[0.03] rounded-bl-[4rem] group-hover:scale-150 transition-transform duration-500`} />
               
               <div className="relative z-10">
                  <div className={`w-14 h-14 ${zone.color} rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-${zone.color.split('-')[1]}-200 animate-in fade-in zoom-in`}>
                     <zone.icon className="text-white" size={28} />
                  </div>
                  <span className="text-[9px] font-black uppercase text-blue-500 bg-blue-50 px-3 py-1 rounded-full mb-4 inline-block tracking-widest">
                    {zone.tag}
                  </span>
                  <h4 className="text-xl font-black text-slate-800 mb-3 group-hover:text-blue-600 transition-colors uppercase leading-tight tracking-tight">
                    {zone.title}
                  </h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    {zone.desc}
                  </p>
               </div>

               <div className="relative z-10 pt-8 mt-auto border-t border-slate-50 flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 group-hover:text-blue-600 transition-colors tracking-widest">
                  Process Now <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
               </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer Support */}
      <section className="max-w-4xl mx-auto px-6 pb-20 text-center">
         <div className="bg-blue-50 p-10 rounded-[3rem] border border-blue-100 relative overflow-hidden">
            <h5 className="text-2xl font-black text-slate-800 mb-2 uppercase">Any Issues / Doubts?</h5>
            <p className="text-slate-500 font-medium mb-8">Our support team is available from 10:00 AM to 06:00 PM (Mon-Sat).</p>
            <div className="flex flex-wrap justify-center gap-4">
               <a href={brandEmail ? `mailto:${brandEmail}` : "#"} className="px-6 py-3 bg-white border border-blue-200 rounded-full text-sm font-bold text-blue-600 hover:bg-blue-600 hover:text-white transition flex items-center gap-2">
                  <FileText size={16} /> Contact Support
               </a>
               <Link href="/help" className="px-6 py-3 bg-white border border-blue-200 rounded-full text-sm font-bold text-blue-600 hover:bg-blue-600 hover:text-white transition flex items-center gap-2">
                  <ExternalLink size={16} /> Help Center
               </Link>
            </div>
            <div className="absolute top-0 left-0 w-24 h-24 bg-blue-100/40 rounded-br-full -ml-10 -mt-10" />
         </div>
      </section>
    </div>
  );
}
