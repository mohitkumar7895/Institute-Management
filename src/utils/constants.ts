export type NavChildLink = {
  label: string;
  href: string;
};

export type NavLink = {
  label: string;
  href: string;
  children?: NavChildLink[];
};

export const NAV_LINKS: NavLink[] = [
  { label: "HOME", href: "/" },
  {
    label: "ABOUT US",
    href: "#about",
    children: [
      { label: "About Institute", href: "/about-institute" },
      { label: "Director Message", href: "/director-message" },
      { label: "Our Mission", href: "/our-mission" },
      { label: "Our Vision", href: "/our-vision" },
      { label: "Achievement", href: "/achievement" },
      { label: "Institute Registration", href: "/institute-registration" },
      { label: "Training with Government Organization", href: "/training-with-government-organization" },
      { label: "University Partner", href: "/university-partners" },
    ],
  },
  {
    label: "STUDENTS ZONE",
    href: "/student-zone/registration-process",
    children: [
      { label: "Registration Process", href: "/student-zone/registration-process" },
      { label: "Direct Admission", href: "/direct-admission" },
      { label: "Examination Process", href: "/student-zone/examination-process" },
      { label: "Download Admit Card", href: "/student-zone/download-admit-card" },
      { label: "Registered Student", href: "/student-zone/registered-student" },
    ],
  },
  { label: "COURSES OFFERED", href: "/courses-offered" },
  {
    label: "VERIFICATION",
    href: "#",
    children: [
      { label: "Student Verification", href: "/verification/student" },
      { label: "ATC Verification", href: "/verification/atc" },
      { label: "Certificate Verification", href: "/verification/certificate" },
      { label: "Marksheet Verification", href: "/verification/marksheet" },
    ],
  },
  {
    label: "AFFILIATION PROCESS",
    href: "/affiliation-process",
    children: [
      { label: "Affiliation Process", href: "/affiliation-process" },
      { label: "Become ATC", href: "/become-atc" },
    ],
  },
  { label: "GALLERY", href: "/gallery" },
  {
    label: "LOGIN",
    href: "#",
    children: [
      { label: "Admin Login", href: "/admin/login" },
      { label: "ATC Login", href: "/atc/login" },
      { label: "Student Login", href: "/student/login" },
    ],
  },
  { label: "CONTACT US", href: "/contact-us" },
];

export const SITE_INFO = {
  name: "Institution",
  tagline: "Official education portal.",
  email: "",
  phone: "",
  address: "",
  hours: "Mon - Sat : 09:00 A.M. - 5:00 P.M.",
  designer: "Provisioningtech",
  mapEmbedUrl:
    "https://www.google.com/maps?q=India&z=5&output=embed",
};

export const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://facebook.com" },
  { label: "Twitter", href: "https://twitter.com" },
  { label: "YouTube", href: "https://youtube.com" },
  { label: "Google", href: "https://google.com" },
];

export const FOOTER_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About Us", href: "#about" },
  { label: "Courses", href: "/courses-offered" },
  { label: "Contact", href: "/contact-us" },
  { label: "Director's Message", href: "#about" },
];
