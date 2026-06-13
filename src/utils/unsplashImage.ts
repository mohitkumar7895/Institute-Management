export function courseCardImage(slug: string, width = 800, height = 500) {
  const safe = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `https://picsum.photos/seed/sift-${safe}/${width}/${height}`;
}

export function unsplashCourseImage(photoId: string, width = 800) {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&h=500&q=75`;
}

export function courseImageFallback(title: string) {
  return courseCardImage(title.replace(/\s+/g, "-"));
}
