import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type GalleryRow = {
  _id: unknown;
  categoryId: unknown;
  title?: string;
  type?: string;
  sortOrder?: number;
  createdAt?: Date;
};

type CategoryRow = {
  _id: unknown;
  name: string;
  sortOrder?: number;
  createdAt?: Date;
};

export async function GET() {
  try {
    try {
      await connectDB();
    } catch (dbError: unknown) {
      const message = dbError instanceof Error ? dbError.message : "Database connection failed";
      console.error("[public/gallery] DB:", message);
      return NextResponse.json({ message: "Database connection failed." }, { status: 500 });
    }

    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ message: "Database not ready." }, { status: 500 });
    }

    const [categories, rawPhotos] = await Promise.all([
      db
        .collection("gallerycategories")
        .find({})
        .sort({ sortOrder: 1, name: 1 })
        .toArray() as Promise<CategoryRow[]>,
      db
        .collection("galleryphotos")
        .find({}, { projection: { image: 0 } })
        .sort({ sortOrder: 1, createdAt: -1 })
        .toArray() as Promise<GalleryRow[]>,
    ]);

    const safeCategories = categories.map((category) => ({
      _id: String(category._id),
      name: category.name,
      sortOrder: category.sortOrder ?? 0,
      createdAt: category.createdAt,
    }));

    const photos = rawPhotos.map((photo) => ({
      _id: String(photo._id),
      categoryId: String(photo.categoryId),
      title: photo.title ?? "",
      sortOrder: photo.sortOrder ?? 0,
      createdAt: photo.createdAt,
      type: photo.type === "video" ? "video" : "image",
    }));

    return NextResponse.json({ categories: safeCategories, photos });
  } catch (error: unknown) {
    console.error("[public/gallery]", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
