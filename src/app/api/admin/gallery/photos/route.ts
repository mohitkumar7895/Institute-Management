import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAdmin } from "@/lib/auth";
import { GalleryPhoto } from "@/models/GalleryPhoto";
import { GalleryCategory } from "@/models/GalleryCategory";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_VIDEO_BYTES = 10 * 1024 * 1024;

function approxBase64Bytes(dataUrl: string): number {
  const base64Part = dataUrl.split(",")[1] ?? "";
  return Math.ceil((base64Part.length * 3) / 4);
}

export async function GET(request: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    await connectDB();
    const filter = categoryId ? { categoryId } : {};
    const photos = await GalleryPhoto.find(filter).sort({ sortOrder: 1, createdAt: -1 }).lean();
    return NextResponse.json({ photos });
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
      categoryId?: string;
      title?: string;
      image?: string;
      type?: "image" | "video";
    };

    const categoryId = body.categoryId?.trim();
    const image = body.image?.trim();
    const title = body.title?.trim() ?? "";
    const type = body.type === "video" ? "video" : "image";

    if (!categoryId || !image) {
      return NextResponse.json({ message: "Category and file are required." }, { status: 400 });
    }

    if (type === "video") {
      if (!image.startsWith("data:video/")) {
        return NextResponse.json({ message: "Only video files are allowed." }, { status: 400 });
      }
      if (approxBase64Bytes(image) > MAX_VIDEO_BYTES) {
        return NextResponse.json({ message: "Video must be under 10 MB." }, { status: 400 });
      }
    } else {
      if (!image.startsWith("data:image/")) {
        return NextResponse.json({ message: "Only image files are allowed." }, { status: 400 });
      }
      if (approxBase64Bytes(image) > MAX_IMAGE_BYTES) {
        return NextResponse.json({ message: "Image must be under 2 MB." }, { status: 400 });
      }
    }

    await connectDB();
    const category = await GalleryCategory.findById(categoryId);
    if (!category) {
      return NextResponse.json({ message: "Category not found." }, { status: 404 });
    }

    const count = await GalleryPhoto.countDocuments({ categoryId });
    const photo = await GalleryPhoto.create({
      categoryId,
      title,
      image,
      type,
      sortOrder: count,
    });

    return NextResponse.json({ photo }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

    const { id } = (await request.json()) as { id?: string };
    if (!id) {
      return NextResponse.json({ message: "Photo id is required." }, { status: 400 });
    }

    await connectDB();
    await GalleryPhoto.findByIdAndDelete(id);
    return NextResponse.json({ message: "Photo deleted." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
