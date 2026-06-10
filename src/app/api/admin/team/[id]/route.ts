import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAdmin } from "@/lib/auth";
import { TeamMember } from "@/models/TeamMember";
import { resolveTeamImageUrl } from "@/lib/teamMedia";

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

    const { id } = await params;
    const body = (await request.json()) as {
      name?: string;
      role?: string;
      description?: string;
      image?: string;
      sortOrder?: number;
      status?: "active" | "inactive";
    };

    const update: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) return NextResponse.json({ message: "Name is required." }, { status: 400 });
      update.name = name;
    }

    if (body.role !== undefined) {
      const role = body.role.trim();
      if (!role) return NextResponse.json({ message: "Role is required." }, { status: 400 });
      update.role = role;
    }

    if (body.description !== undefined) update.description = body.description.trim();
    if (body.sortOrder !== undefined) update.sortOrder = body.sortOrder;
    if (body.status === "active" || body.status === "inactive") update.status = body.status;

    if (body.image !== undefined) {
      const image = body.image.trim();
      const imageError = validateImage(image);
      if (imageError) return NextResponse.json({ message: imageError }, { status: 400 });
      update.image = image;
    }

    await connectDB();
    const member = await TeamMember.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!member) return NextResponse.json({ message: "Team member not found." }, { status: 404 });

    return NextResponse.json({
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
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const member = await TeamMember.findByIdAndDelete(id);
    if (!member) return NextResponse.json({ message: "Team member not found." }, { status: 404 });

    return NextResponse.json({ message: "Team member deleted." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
