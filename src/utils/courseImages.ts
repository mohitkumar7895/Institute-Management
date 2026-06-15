const SLUG_TO_FILENAME: Record<string, string> = {
  "fashion-designing": "Fashion designing.jpeg",
  "leather-goods-products": "Leather goods products.jpeg",
  "leather-stitching-operator": "Leather stitching opretor.jpeg",
  "garments-manufacturing": "Garments manufacturing.jpeg",
  "juet-product-training": "Juet product training.jpeg",
  "glass-art": "Glass art.jpeg",
  "glass-designing": "Glass designing.jpeg",
  "computer-education": "Computer education.jpeg",
  beautician: "Beautician.jpeg",
  "make-up-artist": "Makeup artist.jpeg",
  "khadi-product-training": "Khadi product.jpeg",
  "stitching-operator": "Stitching opretor.jpeg",
  "skill-development-training": "Skill development training.jpeg",
  "industries-training": "Industries training.jpeg",
  "industries-development-training": "Industries development training.jpeg",
  "industries-seminar": "Industries seminar.jpeg",
  "industries-mdp-esdp-electricians": "Industries Mdp esdp training program.jpeg",
  "mobile-repairing": "Mobile repairing.jpeg",
  "ac-repairing": "Ac repairing.jpeg",
  "solar-panel-installation": "Sollar pannal stolation.jpeg",
  "fitter-training-program": "Fitter training program.jpeg",
  "motar-car-repairing": "Motar car repairing .jpeg",
  "freeze-repairing": "Freeze repairing .jpeg",
  "belding-machine-training-program": "Belding machine training program.jpeg",
};

const NAME_TO_FILENAME: Record<string, string> = {
  "fashion designing": "Fashion designing.jpeg",
  "leather goods products training": "Leather goods products.jpeg",
  "leather stitching opretor": "Leather stitching opretor.jpeg",
  "garments manufacturing": "Garments manufacturing.jpeg",
  "juet product training": "Juet product training.jpeg",
  "glass art": "Glass art.jpeg",
  "glass designing": "Glass designing.jpeg",
  "computer education": "Computer education.jpeg",
  beautician: "Beautician.jpeg",
  "make up artist": "Makeup artist.jpeg",
  "khadi product training": "Khadi product.jpeg",
  "stitching opretor": "Stitching opretor.jpeg",
  "skill development training program": "Skill development training.jpeg",
  "industries training": "Industries training.jpeg",
  "industries development training": "Industries development training.jpeg",
  "industries seminar": "Industries seminar.jpeg",
  "industries mdp and esdp training program electricians":
    "Industries Mdp esdp training program.jpeg",
  "mobile repairing": "Mobile repairing.jpeg",
  "ac repairing": "Ac repairing.jpeg",
  "sollar pannal stolation": "Sollar pannal stolation.jpeg",
  "fitter training program": "Fitter training program.jpeg",
  "motar car repairing": "Motar car repairing .jpeg",
  "freeze repairing": "Freeze repairing .jpeg",
  "belding machine training program": "Belding machine training program.jpeg",
};

function normalizeCourseKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function publicCourseImagePath(filename: string) {
  return `/${encodeURIComponent(filename)}`;
}

export function getCourseImageBySlug(slug: string) {
  const filename = SLUG_TO_FILENAME[slug.trim().toLowerCase()];
  return filename ? publicCourseImagePath(filename) : null;
}

export function getCourseImageByName(name: string) {
  const normalized = normalizeCourseKey(name);
  const filename = NAME_TO_FILENAME[normalized];
  if (filename) return publicCourseImagePath(filename);

  const slugKey = normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return getCourseImageBySlug(slugKey);
}

export const DEFAULT_COURSE_IMAGE = publicCourseImagePath("Skill development training.jpeg");
