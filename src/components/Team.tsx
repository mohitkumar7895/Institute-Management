"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { teamMembers as fallbackTeam } from "@/data/team";

type TeamMember = {
  _id?: string;
  name: string;
  role: string;
  description: string;
  image: string;
};

export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>(
    fallbackTeam.map((member) => ({
      name: member.name,
      role: member.role,
      description: member.description,
      image: member.image,
    })),
  );

  useEffect(() => {
    async function fetchTeam() {
      try {
        const res = await fetch("/api/public/team");
        if (!res.ok) return;
        const data = (await res.json()) as TeamMember[];
        if (Array.isArray(data) && data.length > 0) {
          setMembers(data);
        }
      } catch {
        /* keep fallback */
      }
    }
    void fetchTeam();
  }, []);

  return (
    <section id="team" className="scroll-mt-28 bg-white px-4 py-12 sm:scroll-mt-32 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="text-center">
          <h2 className="text-xl font-black uppercase tracking-wide text-slate-900 sm:text-2xl lg:text-[2rem]">
            Our <span className="text-[#0a0aa1]">Team</span>
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 bg-slate-200" />
        </div>

        <div className="mt-10 grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
          {members.map((member) => (
            <article
              key={member._id ?? member.name}
              className="text-center text-slate-700"
            >
              <div className="mx-auto w-full max-w-52 overflow-hidden bg-slate-100">
                <div className="relative aspect-4/5 w-full">
                  <Image
                    src={member.image || "/team-placeholder.svg"}
                    alt={member.name}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(max-width: 640px) 280px, (max-width: 1280px) 45vw, 22vw"
                  />
                </div>
              </div>

              <h3 className="mt-4 text-lg font-extrabold text-slate-800 sm:text-xl">
                {member.name}
              </h3>
              <p className="mt-1.5 text-xs font-bold text-[#1a2198] sm:text-sm">
                ({member.role})
              </p>
              <p className="mx-auto mt-3 max-w-60 text-sm leading-6 text-slate-500">
                {member.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
