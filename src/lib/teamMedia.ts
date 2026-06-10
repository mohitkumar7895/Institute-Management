import { parseDataUrl } from "@/lib/galleryMedia";

export function teamMediaUrl(id: string): string {
  return `/api/public/team/media/${id}`;
}

export function resolveTeamImageUrl(member: {
  _id: string;
  image?: string;
}): string {
  const image = member.image?.trim() ?? "";
  if (!image) return "/team-placeholder.svg";
  if (image.startsWith("data:")) return teamMediaUrl(member._id);
  return image;
}

export { parseDataUrl };
