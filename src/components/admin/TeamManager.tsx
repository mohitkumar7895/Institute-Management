"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, Pencil, Plus, Save, Trash2, Upload, User, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/utils/api";
import SkeletonLoader from "@/components/common/SkeletonLoader";

type TeamMember = {
  _id: string;
  name: string;
  role: string;
  description: string;
  image: string;
  sortOrder: number;
  status: "active" | "inactive";
};

const emptyForm = {
  name: "",
  role: "",
  description: "",
};

export default function TeamManager() {
  const { loading: authLoading, user: authUser } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Read failed"));
      reader.readAsDataURL(file);
    });

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setPhotoPreview(null);
    setPhotoDataUrl(null);
    setError(null);
  };

  const fetchMembers = useCallback(async () => {
    const res = await apiFetch("/api/admin/team");
    const data = (await res.json()) as { members?: TeamMember[]; message?: string };
    if (!res.ok) throw new Error(data.message ?? "Failed to load team");
    setMembers(Array.isArray(data.members) ? data.members : []);
  }, []);

  const loadAll = useCallback(async () => {
    if (authLoading || !authUser) return;
    setLoading(true);
    setError(null);
    try {
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }, [authLoading, authUser, fetchMembers]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handlePhotoUpload = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2 MB.");
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPhotoDataUrl(dataUrl);
      setPhotoPreview(dataUrl);
      setError(null);
    } catch {
      setError("Failed to read image.");
    }
  };

  const startEdit = (member: TeamMember) => {
    setEditingId(member._id);
    setForm({
      name: member.name,
      role: member.role,
      description: member.description,
    });
    setPhotoPreview(member.image || null);
    setPhotoDataUrl(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.role.trim()) {
      setError("Name and role are required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, string> = {
        name: form.name.trim(),
        role: form.role.trim(),
        description: form.description.trim(),
      };
      if (photoDataUrl) payload.image = photoDataUrl;

      const res = editingId
        ? await apiFetch(`/api/admin/team/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await apiFetch("/api/admin/team", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Save failed");

      await fetchMembers();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this team member?")) return;
    setError(null);
    try {
      const res = await apiFetch(`/api/admin/team/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Delete failed");
      if (editingId === id) resetForm();
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="md:col-span-2">
        <SkeletonLoader type="card" count={2} />
      </div>
    );
  }

  return (
    <div className="md:col-span-2 bg-white rounded-4xl border border-slate-100 shadow-xl p-8 space-y-6">
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center border border-violet-100">
          <Users className="w-7 h-7 text-violet-600" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Our Team</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Add team members with photo, name, role and description. This shows on the home page Our Team section.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 block">
            Member Photo
          </label>
          <div className="relative aspect-4/5 max-w-52 mx-auto bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 overflow-hidden group hover:border-violet-300 transition">
            {photoPreview ? (
              <Image src={photoPreview} alt="Preview" fill unoptimized className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <User className="w-10 h-10 mb-2" />
                <span className="text-[10px] font-bold uppercase tracking-wider">No photo</span>
              </div>
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition cursor-pointer">
              <span className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-900">
                <Upload className="w-4 h-4" />
                Upload
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void handlePhotoUpload(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          <p className="text-[10px] text-center text-slate-400 font-medium">PNG/JPG up to 2 MB</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
                placeholder="e.g. Rahul Upadhyay"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                Role
              </label>
              <input
                type="text"
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-bold text-slate-800 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
                placeholder="e.g. Director"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-medium text-slate-800 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50 resize-none"
              placeholder="Short bio about this team member..."
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {saving ? "Saving..." : editingId ? "Update Member" : "Add Member"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-slate-200 px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Current Team ({members.length})
        </h4>
        {members.length === 0 ? (
          <p className="text-sm text-slate-500">No team members yet. Add the first member above.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((member) => (
              <div
                key={member._id}
                className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
                  {member.image ? (
                    <Image src={member.image} alt={member.name} fill unoptimized className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-slate-800 truncate">{member.name}</p>
                  <p className="text-xs font-bold text-violet-700">({member.role})</p>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{member.description}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(member)}
                    className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-white"
                    aria-label={`Edit ${member.name}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(member._id)}
                    className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                    aria-label={`Delete ${member.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
