import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAdmin } from "@/lib/auth";
import { TeamMember } from "@/models/TeamMember";
import { resolveTeamImageUrl } from "@/lib/teamMedia";
import { ensureTeamSeeded } from "@/lib/syncDefaultTeam";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function approxBase64Bytes(dataUrl: string): number {
  const base64Part = dataUrl.split(",")[1] ?? "";
  return Math.ceil((base64Part.length * 3) / 4);
}

function validateImage(image: string): string | null {
  if (!image) return null;
  if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/")) {
    return null;
  }
  if (!image.startsWith("data:image/")) return "Only image files are allowed.";
  if (approxBase64Bytes(image) > MAX_IMAGE_BYTES) return "Image must be under 2 MB.";
  return null;
}

export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

    await connectDB();
    await ensureTeamSeeded();

    const members = await TeamMember.find().sort({ sortOrder: 1, createdAt: 1 }).lean();
    return NextResponse.json({
      members: members.map((member) => ({
        _id: String(member._id),
        name: member.name,
        role: member.role,
        description: member.description,
        image: resolveTeamImageUrl({
          _id: String(member._id),
          image: member.image,
        }),
        sortOrder: member.sortOrder,
        status: member.status,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

    const body = (await request.json()) as {
      name?: string;
      role?: string;
      description?: string;
      image?: string;
    };

    const name = body.name?.trim();
    const role = body.role?.trim();
    const description = body.description?.trim() ?? "";
    const image = body.image?.trim() ?? "";

    if (!name || !role) {
      return NextResponse.json({ message: "Name and role are required." }, { status: 400 });
    }

    const imageError = validateImage(image);
    if (imageError) {
      return NextResponse.json({ message: imageError }, { status: 400 });
    }

    await connectDB();
    const last = await TeamMember.findOne().sort({ sortOrder: -1 }).select("sortOrder").lean();
    const sortOrder = (last?.sortOrder ?? -1) + 1;

    const member = await TeamMember.create({
      name,
      role,
      description,
      image,
      sortOrder,
      status: "active",
    });

    return NextResponse.json(
      {
        member: {
          _id: String(member._id),
          name: member.name,
          role: member.role,
          description: member.description,
          image: resolveTeamImageUrl({
            _id: String(member._id),
            image: member.image,
          }),
          sortOrder: member.sortOrder,
          status: member.status,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
