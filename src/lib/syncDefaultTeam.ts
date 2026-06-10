import { teamMembers } from "@/data/team";
import { TeamMember } from "@/models/TeamMember";

export async function ensureTeamSeeded() {
  const count = await TeamMember.countDocuments();
  if (count > 0) return;

  await TeamMember.insertMany(
    teamMembers.map((member, index) => ({
      name: member.name,
      role: member.role,
      description: member.description,
      image: member.image,
      sortOrder: index,
      status: "active" as const,
    })),
  );
}

export async function getActiveTeamMembers() {
  await ensureTeamSeeded();
  return TeamMember.find({ status: "active" })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
}
