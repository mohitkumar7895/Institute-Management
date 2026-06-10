import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { resolveTeamImageUrl } from "@/lib/teamMedia";
import { getActiveTeamMembers } from "@/lib/syncDefaultTeam";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const members = await getActiveTeamMembers();

    return NextResponse.json(
      members.map((member) => ({
        _id: String(member._id),
        name: member.name,
        role: member.role,
        description: member.description,
        image: resolveTeamImageUrl({
          _id: String(member._id),
          image: member.image,
        }),
      })),
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
