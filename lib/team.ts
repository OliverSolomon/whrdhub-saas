/**
 * Board and staff. Names, roles and photos are the Hub's own (photos live in
 * /public/board and /public/staff). The bios are condensed in the Hub's voice
 * from the profiles on whrdhub.org.
 */

export interface Person {
  name: string;
  role: string;
  photo?: string;
  blurb?: string;
}

export const LEADERSHIP: Person[] = [
  {
    name: "Salome Nduta",
    role: "Executive Director & Founder",
    photo: "/board/Salome-Nduta-scaled-1.jpg",
    blurb:
      "Founder of the Kenya Hub and recipient of the inaugural Scottish Bar International Human Rights Award. With a background in social work and gender and development studies, Salome also serves on the boards of HAKI and PEMA Kenya and sits on the committee of the Global Gas and Oil Network.",
  },
];

export const BOARD: Person[] = [
  {
    name: "Yvonne Owino Omari",
    role: "Board Chairperson",
    photo: "/board/1Profile-YvonneOwinoWamari.jpg.jpg",
    blurb:
      "An advocate of the High Court of Kenya with over a decade advancing human rights and social justice. Yvonne has campaigned for marginalised and at-risk communities, from survivors of the 2007/8 post-election violence to women and gender minorities, and is pursuing a Master's in Human Rights at the University of Nairobi.",
  },
  {
    name: "Carolyne Tunnen",
    role: "Board Member",
    photo: "/board/Tunnen-headshot-.jpg",
    blurb:
      "A communications and advocacy professional with over ten years in journalism, media, and research. Carolyne uses strategy and partnerships to push institutional and policy reform, holds a Master's in International Relations, and is Communications Manager at the Mawazo Institute.",
  },
  {
    name: "Julia Majale",
    role: "Board Member",
    photo: "/board/Julia-Headshot-Photoroom-1.png-Photoroom-1-e1740399478564.png",
    blurb:
      "Managing Director at Tuko Media, Kenya's leading digital media house, and a multi-skilled journalist and editor with over a decade of experience. A Women in News Leadership alumna and SOMA Top 25 Women in Digital honouree, she holds an Executive Master's in Media Leadership & Innovation from Aga Khan University.",
  },
  {
    name: "Fridah Githuku",
    role: "Board Member",
    photo: "/board/Frida-Photoroom.png-Photoroom.png",
    blurb:
      "Head of the Women Rights Programme at the IMS Foundation and former Executive Director of GROOTS Kenya. Fridah has spent years organising grassroots women and girls to claim their rights, from political representation to freedom from violence, and is a Certified Public Accountant.",
  },
  {
    name: "Eunice Chepkemoi",
    role: "Board Member",
    photo: "/board/eunice-picture3.jpg",
    blurb:
      "Gender Officer at the Ogiek Peoples' Development Program, with over a decade working with Indigenous peoples on gender, land rights, climate justice, and cultural preservation. Eunice is active in the Indigenous Women Council and the East Africa Indigenous Women Assembly, championing Indigenous women's leadership.",
  },
];

export const STAFF: Person[] = [
  { name: "Diana Letion", role: "Safety and Security", photo: "/staff/diana%20letion.jpg" },
  { name: "Firdaus Hussein", role: "Femtorship Support", photo: "/staff/firdaus%20hussein.jpg" },
  { name: "Ruth Kinuthia", role: "Livelihoods Support", photo: "/staff/ruth%20kinuthia.jpg" },
  { name: "Dorcas Phelesia", role: "Finance and Admin", photo: "/staff/DORCASphelesia.jpeg" },
  { name: "Sidney Mwaura", role: "Admin Assistant", photo: "/staff/Sidney%20Mwaura.jpg" },
];

export const SOCIALS = {
  facebook: "https://www.facebook.com/whrdhub",
  x: "https://x.com/WHRDhub",
  instagram: "https://www.instagram.com/whrdhub/",
  linkedin: "https://www.linkedin.com/company/women-human-rights-defenders-hub-the-hub/",
  youtube: "https://www.youtube.com/@TheHubKenya-w7y",
};
