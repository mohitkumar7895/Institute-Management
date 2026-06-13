import { courseCardImage } from "@/utils/unsplashImage";

export type FrontCourseItem = {
  slug: string;
  name: string;
  description: string;
  image: string;
};

export const FRONT_COURSE_LIST: FrontCourseItem[] = [
  {
    slug: "fashion-designing",
    name: "Fashion designing",
    description: "Learn garment design, styling, and creative fashion skills for the apparel industry.",
    image: courseCardImage("fashion-designing"),
  },
  {
    slug: "leather-goods-products",
    name: "Leather goods products training",
    description: "Training in leather product making, finishing, and quality skills for industry work.",
    image: courseCardImage("leather-goods-products"),
  },
  {
    slug: "leather-stitching-operator",
    name: "Leather stitching opretor",
    description: "Hands-on leather stitching, cutting, and assembly skills for production work.",
    image: courseCardImage("leather-stitching-operator"),
  },
  {
    slug: "garments-manufacturing",
    name: "Garments manufacturing",
    description: "Industrial garment production, quality control, and factory workflow training.",
    image: courseCardImage("garments-manufacturing"),
  },
  {
    slug: "juet-product-training",
    name: "Juet product training",
    description: "Jute product making, eco-friendly crafts, and natural fiber industry skills.",
    image: courseCardImage("juet-product-training"),
  },
  {
    slug: "glass-art",
    name: "Glass art",
    description: "Creative glass artwork, decorative forms, and artistic finishing techniques.",
    image: courseCardImage("glass-art"),
  },
  {
    slug: "glass-designing",
    name: "Glass designing",
    description: "Creative and technical skills in glass design, patterns, and decorative applications.",
    image: courseCardImage("glass-designing"),
  },
  {
    slug: "computer-education",
    name: "Computer education",
    description: "Computer basics, office tools, digital literacy, and practical IT skills.",
    image: courseCardImage("computer-education"),
  },
  {
    slug: "beautician",
    name: "Beautician",
    description: "Beauty care, skincare, salon services, and professional grooming skills.",
    image: courseCardImage("beautician"),
  },
  {
    slug: "make-up-artist",
    name: "Make up artist",
    description: "Professional makeup techniques for bridal, party, and salon work.",
    image: courseCardImage("make-up-artist"),
  },
  {
    slug: "khadi-product-training",
    name: "Khadi product training",
    description: "Khadi weaving, spinning, and traditional handloom product development.",
    image: courseCardImage("khadi-product-training"),
  },
  {
    slug: "stitching-operator",
    name: "Stitching opretor",
    description: "Machine stitching, garment assembly, and operator-level sewing skills.",
    image: courseCardImage("stitching-operator"),
  },
  {
    slug: "skill-development-training",
    name: "Skill development training program",
    description: "Practical skill-building program to improve employability and industry readiness.",
    image: courseCardImage("skill-development-training"),
  },
  {
    slug: "industries-training",
    name: "Industries training",
    description: "Industrial workplace training, safety, and production environment skills.",
    image: courseCardImage("industries-training"),
  },
  {
    slug: "industries-development-training",
    name: "Industries development training",
    description: "Industrial growth skills, development pathways, and sector-focused learning.",
    image: courseCardImage("industries-development-training"),
  },
  {
    slug: "industries-seminar",
    name: "Industries seminar",
    description: "Seminar on industrial growth, opportunities, and development pathways.",
    image: courseCardImage("industries-seminar"),
  },
  {
    slug: "industries-mdp-esdp-electricians",
    name: "Industries Mdp and ESDP training program Electricians",
    description: "MDP and ESDP electrician training for wiring, safety, and industrial electrical work.",
    image: courseCardImage("industries-mdp-esdp-electricians"),
  },
  {
    slug: "mobile-repairing",
    name: "Mobile repairing",
    description: "Smartphone hardware, software troubleshooting, and mobile repair skills.",
    image: courseCardImage("mobile-repairing"),
  },
  {
    slug: "ac-repairing",
    name: "Ac repairing",
    description: "Air conditioner installation, servicing, and refrigeration repair training.",
    image: courseCardImage("ac-repairing"),
  },
  {
    slug: "solar-panel-installation",
    name: "Sollar pannal stolation",
    description: "Solar panel installation, mounting, wiring, and renewable energy setup skills.",
    image: courseCardImage("solar-panel-installation"),
  },
  {
    slug: "fitter-training-program",
    name: "Fitter training program",
    description: "Mechanical fitting, tools, assembly, and industrial maintenance training.",
    image: courseCardImage("fitter-training-program"),
  },
];

export const FRONT_COURSES = FRONT_COURSE_LIST.map((course) => course.name);

const FRONT_COURSE_LOOKUP = new Map(
  FRONT_COURSE_LIST.map((course) => [course.name.trim().toLowerCase().replace(/\s+/g, " "), course]),
);

export function getFrontCourseItem(name: string) {
  return FRONT_COURSE_LOOKUP.get(name.trim().toLowerCase().replace(/\s+/g, " "));
}
