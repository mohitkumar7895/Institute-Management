import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { GalleryCategory } from "@/models/GalleryCategory";
import { GalleryPhoto } from "@/models/GalleryPhoto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();

    const categories = await GalleryCategory.find().sort({ sortOrder: 1, name: 1 }).lean();

    // Only metadata — never load full base64 `image` into this response (causes 500 with large videos).
    const photos = await GalleryPhoto.aggregate([
      { $sort: { sortOrder: 1, createdAt: -1 } },
      {
        $project: {
          _id: 1,
          categoryId: 1,
          title: 1,
          sortOrder: 1,
          createdAt: 1,
          mediaPrefix: { $substrCP: [{ $ifNull: ["$image", ""] }, 0, 20] },
          storedType: "$type",
        },
      },
      {
        $project: {
          _id: 1,
          categoryId: 1,
          title: 1,
          sortOrder: 1,
          createdAt: 1,
          type: {
            $cond: {
              if: {
                $or: [
                  { $eq: ["$storedType", "video"] },
                  { $regexMatch: { input: "$mediaPrefix", regex: "^data:video/" } },
                ],
              },
              then: "video",
              else: "image",
            },
          },
        },
      },
    ]);

    return NextResponse.json({ categories, photos });
  } catch (error: unknown) {
    console.error("[public/gallery]", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
