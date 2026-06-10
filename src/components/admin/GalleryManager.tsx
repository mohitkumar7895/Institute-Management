"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FolderOpen,
  ImageIcon,
  Loader2,
  Play,
  Plus,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/utils/api";
import SkeletonLoader from "@/components/common/SkeletonLoader";
import { galleryMediaUrl, isGalleryVideo } from "@/lib/galleryMedia";

interface Category {
  _id: string;
  name: string;
}

interface Photo {
  _id: string;
  categoryId: string;
  title?: string;
  image: string;
  type?: "image" | "video";
}

export default function GalleryManager() {
  const { loading: authLoading, user: authUser } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const photoCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of allPhotos) map[p.categoryId] = (map[p.categoryId] ?? 0) + 1;
    return map;
  }, [allPhotos]);

  const selectedCategory = categories.find((c) => c._id === selectedCategoryId);

  const fetchCategories = useCallback(async () => {
    const res = await apiFetch("/api/admin/gallery/categories");
    const data = await res.json();
    return (Array.isArray(data.categories) ? data.categories : []) as Category[];
  }, []);

  const fetchPhotos = useCallback(async (categoryId?: string) => {
    const query = categoryId ? `?categoryId=${categoryId}` : "";
    const res = await apiFetch(`/api/admin/gallery/photos${query}`);
    const data = await res.json();
    return (Array.isArray(data.photos) ? data.photos : []) as Photo[];
  }, []);

  const refreshAllPhotos = useCallback(async () => {
    const every = await fetchPhotos();
    setAllPhotos(every);
    return every;
  }, [fetchPhotos]);

  const loadAll = useCallback(async () => {
    if (authLoading || !authUser) return;
    setLoading(true);
    setError(null);
    try {
      const [list, every] = await Promise.all([fetchCategories(), fetchPhotos()]);
      setCategories(list);
      setAllPhotos(every);

      const activeId =
        selectedCategoryId && list.some((c) => c._id === selectedCategoryId)
          ? selectedCategoryId
          : list[0]?._id ?? null;

      setSelectedCategoryId(activeId);
      setPhotos(activeId ? every.filter((p) => p.categoryId === activeId) : []);
    } catch {
      setError("Gallery load failed.");
    } finally {
      setLoading(false);
    }
  }, [authLoading, authUser, fetchCategories, fetchPhotos, selectedCategoryId]);

  useEffect(() => {
    void loadAll();
  }, [authLoading, authUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectCategory = async (id: string) => {
    setSelectedCategoryId(id);
    setPhotosLoading(true);
    setError(null);
    try {
      setPhotos(await fetchPhotos(id));
    } finally {
      setPhotosLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;

    setSavingCategory(true);
    setError(null);
    try {
      const res = await apiFetch("/api/admin/gallery/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Could not add category.");
        return;
      }

      setNewCategoryName("");
      const list = await fetchCategories();
      setCategories(list);

      const newId = data.category?._id ?? null;
      if (newId) {
        setSelectedCategoryId(newId);
        setPhotos([]);
      }
    } catch {
      setError("Could not add category.");
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete category and all photos?")) return;
    try {
      const res = await apiFetch("/api/admin/gallery/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? "Delete failed.");
        return;
      }

      const list = await fetchCategories();
      const every = await refreshAllPhotos();
      setCategories(list);
      const nextId = list[0]?._id ?? null;
      setSelectedCategoryId(nextId);
      setPhotos(nextId ? every.filter((p) => p.categoryId === nextId) : []);
    } catch {
      setError("Delete failed.");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedCategoryId) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      setError("Only image or video files allowed.");
      return;
    }
    if (isImage && file.size > 2 * 1024 * 1024) {
      setError("Image max 2 MB.");
      return;
    }
    if (isVideo && file.size > 4 * 1024 * 1024) {
      setError("Video max 4 MB.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("Read failed"));
        reader.readAsDataURL(file);
      });

      const res = await apiFetch("/api/admin/gallery/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: selectedCategoryId,
          image,
          type: isVideo ? "video" : "image",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Upload failed.");
        return;
      }

      const [categoryPhotos, every] = await Promise.all([
        fetchPhotos(selectedCategoryId),
        refreshAllPhotos(),
      ]);
      setPhotos(categoryPhotos);
      setAllPhotos(every);
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!confirm("Delete photo?")) return;
    if (!selectedCategoryId) return;
    try {
      const res = await apiFetch("/api/admin/gallery/photos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) return;
      const [categoryPhotos, every] = await Promise.all([
        fetchPhotos(selectedCategoryId),
        refreshAllPhotos(),
      ]);
      setPhotos(categoryPhotos);
      setAllPhotos(every);
    } catch {
      setError("Delete failed.");
    }
  };

  if (authLoading || loading) {
    return <SkeletonLoader type="card" className="min-h-[520px] w-full rounded-[2rem]" />;
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
      {error && (
        <div className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Categories — top bar + list below */}
      <div className="border-b border-slate-200 bg-linear-to-r from-[#0a0a2e] to-[#0d1554] px-6 py-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <FolderOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Categories</h3>
            <p className="text-[11px] text-blue-200">{categories.length} album{categories.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <form onSubmit={handleAddCategory} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Category name — e.g. Annual Function"
            className="flex-1 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-blue-300/50 outline-none focus:border-white/30 focus:bg-white/15"
          />
          <button
            type="submit"
            disabled={savingCategory}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#0a0aa1] transition hover:bg-blue-50 disabled:opacity-60"
          >
            {savingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Category
          </button>
        </form>

        {categories.length === 0 ? (
          <p className="mt-4 text-sm text-blue-200/70">No categories yet — add one above.</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((cat) => {
              const active = selectedCategoryId === cat._id;
              const count = photoCountMap[cat._id] ?? 0;
              return (
                <div
                  key={cat._id}
                  className={`inline-flex items-center gap-1 rounded-xl border transition ${
                    active
                      ? "border-white bg-white text-[#0a0aa1] shadow-md"
                      : "border-white/20 bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => void handleSelectCategory(cat._id)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold"
                  >
                    {cat.name}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        active ? "bg-blue-100 text-blue-700" : "bg-white/15 text-blue-100"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteCategory(cat._id)}
                    className={`mr-1 rounded-lg p-1.5 transition ${
                      active ? "text-red-500 hover:bg-red-50" : "text-red-300 hover:bg-red-500/20"
                    }`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Photos — full width below */}
      <section className="flex flex-col bg-slate-50">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <ImageIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {selectedCategory ? selectedCategory.name : "Photos"}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedCategory
                    ? `${photos.length} item${photos.length !== 1 ? "s" : ""}`
                    : "Pick a category above"}
                </p>
              </div>
            </div>

            {selectedCategoryId && (
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0a0aa1] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-800">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload Photo / Video
                <input
                  type="file"
                  accept="image/*,video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          <div className="flex-1 p-6">
            {!selectedCategoryId ? (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100">
                  <FolderOpen className="h-10 w-10 text-slate-300" />
                </div>
                <p className="text-base font-bold text-slate-600">Select a category</p>
                <p className="mt-1 text-sm text-slate-400">Choose from categories above</p>
              </div>
            ) : photosLoading ? (
              <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : photos.length === 0 ? (
              <label className="flex h-full min-h-[400px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 transition hover:border-blue-300 hover:bg-blue-50">
                {uploading ? (
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                ) : (
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-100">
                    <Upload className="h-10 w-10 text-blue-600" />
                  </div>
                )}
                <p className="text-base font-bold text-slate-700">No media yet</p>
                <p className="mt-1 text-sm text-slate-500">Photo or video upload karein</p>
                <input
                  type="file"
                  accept="image/*,video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {photos.map((photo) => {
                  const isVideo = isGalleryVideo(photo);
                  const mediaUrl = galleryMediaUrl(photo._id);
                  if (!mediaUrl) return null;
                  return (
                    <div
                      key={photo._id}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                    >
                      <div className="relative aspect-square bg-slate-900">
                        {isVideo ? (
                          <>
                            <video
                              src={mediaUrl}
                              className="h-full w-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                              controls
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
                                <Play className="h-5 w-5 text-slate-800" />
                              </div>
                            </div>
                            <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                              <Video className="h-3 w-3" /> Video
                            </span>
                          </>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={mediaUrl} alt="" className="h-full w-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => void handleDeletePhoto(photo._id)}
                          className="absolute right-2 top-2 rounded-xl bg-red-600 p-2 text-white shadow-lg opacity-0 transition group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add more tile */}
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white text-slate-400 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-500">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-8 w-8" />
                      <span className="mt-2 text-xs font-bold">Add More</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*,video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            )}
          </div>
      </section>
    </div>
  );
}
