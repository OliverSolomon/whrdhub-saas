/**
 * Content and asset URLs rebuilt from the Hub's existing pages on whrdhub.org.
 * Descriptions are written in the Hub's own voice; images and documents point
 * at the Hub's hosted assets. Swap to self-hosted copies under public/ later.
 */

const U = "https://whrdhub.org/wp-content/uploads";

export const CONTACT = {
  address: "P.O. Box 7403 - 00100, Nairobi, Kenya",
  phone: "+254 797 538 183",
  email: "info@whrdhub.org",
};

// ── Partners ────────────────────────────────────────────────────────────────
export const PARTNERS: { name: string; logo: string }[] = [
  { name: "Hivos", logo: `${U}/2024/06/HIVOS.jpg` },
  { name: "WSF", logo: `${U}/2024/06/WSF.jpg` },
  { name: "Amkeni Wakenya", logo: `${U}/2024/06/Amkeni.jpg` },
  { name: "CSA", logo: `${U}/2024/06/CSA.png` },
  { name: "MWARP", logo: `${U}/2024/03/MWARP.png` },
  { name: "UNDP", logo: `${U}/2024/11/UNDP.jpg` },
  { name: "Front Line Defenders", logo: `${U}/2024/11/Frontline-Defenders-1.png` },
  { name: "Protection International", logo: `${U}/2024/11/Protection-International.png` },
  { name: "Partner", logo: `${U}/2024/03/download-4.png` },
  { name: "Partner", logo: `${U}/2024/03/download-3.png` },
  { name: "Partner", logo: `${U}/2024/03/download-2.png` },
  { name: "Partner", logo: `${U}/2024/03/download-1.png` },
  { name: "Partner", logo: `${U}/2024/03/download.png` },
  { name: "Partner", logo: `${U}/2024/03/download-_5_.jpg` },
  { name: "Partner", logo: `${U}/2024/11/download.png` },
  { name: "Partner", logo: `${U}/2024/11/download-1.png` },
  { name: "Partner", logo: `${U}/2024/11/download-5.jpg` },
  { name: "Partner", logo: `${U}/2024/06/imageedit_3_2962871786.png` },
  { name: "Partner", logo: `${U}/2024/03/imageedit_2_5858238066-1.png` },
  { name: "Partner", logo: `${U}/2024/06/Capture.jpg` },
];

// ── Activity gallery (by county) ────────────────────────────────────────────
export const GALLERY: { caption: string; img: string }[] = [
  { caption: "16 Days of Activism", img: `${U}/2024/04/16days-300x300.jpg` },
  { caption: "Defenders convening", img: `${U}/2024/05/IMG_0122-scaled-300x300.jpg` },
  { caption: "Community training", img: `${U}/2024/05/WH-3-300x300.jpg` },
  { caption: "Network gathering", img: `${U}/2024/05/IMG_1564-scaled-300x300.jpg` },
  { caption: "In the field", img: `${U}/2024/05/a1359d2a-704d-4f5d-8e03-01426512a2bf-transformed-300x300.jpeg` },
  { caption: "Solidarity in action", img: `${U}/2024/05/WhatsApp-Image-2023-08-30-at-21.11.09-1-300x300.jpeg` },
  { caption: "Defenders together", img: `${U}/2024/05/WhatsApp-Image-2024-01-19-at-21.22.50-3-300x300.jpeg` },
  { caption: "Workshop", img: `${U}/2024/05/IMG_2182-scaled-300x300.jpg` },
  { caption: "Strategic Plan launch", img: `${U}/2024/05/0I2A2706-scaled-300x300.jpg` },
];

// ── Press releases ──────────────────────────────────────────────────────────
export const PRESS: { title: string; cover: string; date: string }[] = [
  { title: "Accelerate Action: International Women's Day 2025", cover: `${U}/2025/03/Accelarate-Action-IWD-2025-212x300.jpg`, date: "March 2025" },
  { title: "Livelihood and Well-Being Impacts of the Climate Crisis and Flooding in Kenya for WHRDs", cover: `${U}/2025/03/Livelihood-and-Well-Being-Impacts-of-the-Climate-Crisis-and-Flooding-in-Kenya-for-WHRDs-Page-1_page-00011-212x300.jpg`, date: "2025" },
  { title: "16 Days of Activism 2024", cover: `${U}/2024/11/Press-Release-16DaysOfActivism2024_page-0001-212x300.jpg`, date: "November 2024" },
  { title: "Statement on the Finance Bill", cover: `${U}/2024/08/Finance-Bill-Page1-212x300.jpg`, date: "August 2024" },
  { title: "Public Statement", cover: `${U}/2024/05/Statement-212x300.jpg`, date: "May 2024" },
];

// ── Resources / downloads ───────────────────────────────────────────────────
export const RESOURCES: { title: string; cover: string; pdf: string; kind: string }[] = [
  { title: "Annual Report 2024", kind: "Report", cover: `${U}/2025/03/Annual-Report-2024_page-0001-212x300.jpg`, pdf: `${U}/dlm_uploads/2025/03/Annual-Report-2024.pdf` },
  { title: "Rooted in Courage and Resilience", kind: "Report", cover: `${U}/2025/03/Rooted-in-Courage-211x300.jpg`, pdf: `${U}/dlm_uploads/2025/03/Rooted-in-Courage-and-Resilience.pdf` },
  { title: "Pillars of Transformation: The State of WHRDs in Kenya", kind: "Research", cover: `${U}/2025/12/Pillars-of-Transformation-The-State-of-Women-Human-Rights-Defenders-in-Kenya_page-0001-211x300.jpg`, pdf: `${U}/2026/01/Research-Report-of-the-Legal-2.pdf` },
  { title: "Building Communities of Action Towards Ending GBV", kind: "Report", cover: `${U}/2026/01/Building-Communities-of-Action-Towards-Ending-GBV-Cover-Page_page-0001-1-213x300.jpg`, pdf: `${U}/2026/01/Building-Communities-of-Action-Towards-Ending-GBV.pdf` },
  { title: "Turning Barriers into Bridges: Access to Services for GBV Survivors", kind: "Report", cover: `${U}/2026/01/Turning-Barriers-To-Bridges-Cover_page-0001-232x300.jpg`, pdf: `${U}/2026/02/Turning-Barriers-into-Bridges_-Enhancing-Access-to-Service-Delivery-for-GBV-Survivors-7.pdf` },
  { title: "Safety and Security Training Guide", kind: "Guide", cover: `${U}/2026/01/Safeguarding-Holistic-Protection-Cover_page-0001-212x300.jpg`, pdf: `${U}/2026/01/we-lead-safety-and-security-tr-2.pdf` },
  { title: "Policy Brief", kind: "Policy", cover: `${U}/2024/05/Policy-Pic-221x300.png`, pdf: `${U}/dlm_uploads/2024/05/POLICY-BRIEF.pdf` },
  { title: "Photo Book 2024 to 2025", kind: "Photo book", cover: `${U}/2026/01/2024-2025-PhotoBook-300x155.jpg`, pdf: `${U}/2026/02/Photo-Book-2.pdf` },
];

// ── Newsletter ──────────────────────────────────────────────────────────────
export const NEWSLETTER = {
  title: "Pulse of Progress",
  subtitle: "The Hub's bi-annual newsletter",
  cover: `${U}/2026/02/1-212x300.png`,
  pdf: `${U}/2026/02/Pulse-of-Progress-Bi-annual-Newsletter.pdf`,
};

// ── Opportunities ───────────────────────────────────────────────────────────
export const OPPORTUNITIES: { title: string; cover: string; type: string; blurb: string }[] = [
  {
    title: "Building Communities of Action Towards Ending GBV",
    type: "Expression of Interest",
    cover: `${U}/2024/11/UNDP-EOI-1_page-0001-212x300.jpg`,
    blurb: "An opportunity to partner with the Hub on community-led action to end gender-based violence.",
  },
  {
    title: "Enhancing Access to Information and Service Delivery for GBV Survivors in Informal Settlements",
    type: "Expression of Interest",
    cover: `${U}/2024/11/1-212x300.png`,
    blurb: "Working to improve how survivors in informal settlements reach the services and information they need.",
  },
];
