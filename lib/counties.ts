/**
 * Static county-network data so the pages always render (no dependency on the
 * database being seeded). Blurbs and descriptions are written in the Hub's
 * voice; hero images and the local host networks come from whrdhub.org. The
 * page augments this with live organisation and member counts when available.
 */

export interface County {
  slug: string;
  name: string;
  hero: string;
  network: string; // local host organisation / network
  founded?: string;
  blurb: string; // short, for cards
  description: string; // longer, for the detail page
}

const U = "https://whrdhub.org/wp-content/uploads";

export const COUNTIES: County[] = [
  {
    slug: "bomet",
    name: "Bomet",
    network: "Bomet Women Human Rights Defenders",
    hero: `${U}/2024/05/WhatsApp-Image-2023-08-30-at-21.11.09-1.jpeg`,
    blurb: "Defenders in Bomet organise to keep women safe and to stand with survivors of gender-based violence.",
    description:
      "The Hub held a familiarisation meeting with women human rights defenders in Bomet, engaging directly with the women at the forefront of the fight against social injustice. The gathering underlined how solidarity and collaboration can drive change on a much larger scale, and marked the start of a growing county network.",
  },
  {
    slug: "kisumu",
    name: "Kisumu",
    network: "Kisumu Women Defenders Network",
    founded: "Formed in 2019",
    hero: `${U}/2024/04/IMG_0034-1024x683.jpg`,
    blurb: "A lakeside network promoting human rights and gender equality across Kisumu's sub-counties.",
    description:
      "The Kisumu Women Defenders Network, formed in 2019, promotes human rights and gender equality across five sub-counties of Kisumu. Its members, drawn together in a Social Justice Centre, learn from one another and collectively identify and tackle the challenges they face defending their communities in all their diversity.",
  },
  {
    slug: "kitui",
    name: "Kitui",
    network: "Kitui Women Peace and Security (KWPS)",
    hero: `${U}/2024/04/16days.jpg`,
    blurb: "A grassroots network ending violence against women and girls and growing their role in peace and security.",
    description:
      "Kitui Women Peace and Security (KWPS) is a non-partisan network of grassroots women committed to ending violence against women and girls and expanding their participation in conflict prevention, peace, and security. Established by determined women from the county's eight sub-counties, KWPS works directly with communities so women can take back control of their lives, overcome obstacles, and insist on a seat at the decisions that affect their peace and wellbeing.",
  },
  {
    slug: "marsabit",
    name: "Marsabit",
    network: "Pastoralists Peoples Initiative (PPI)",
    hero: `${U}/2024/04/WhatsApp-Image-2024-02-28-at-13.32.42-2-1024x576.jpeg`,
    blurb: "An umbrella organisation empowering women and youth across Marsabit's pastoralist communities.",
    description:
      "The Pastoralists Peoples Initiative (PPI) is a non-profit umbrella organisation committed to uplifting the whole community, with a particular focus on empowering women and youth. By opening opportunities for those who have long been overlooked, PPI sets off a positive chain reaction that reaches far beyond individual lives.",
  },
  {
    slug: "meru",
    name: "Meru",
    network: "Kiengu Women Challenged to Challenge (KWCC)",
    hero: `${U}/2024/03/405363671_326452803427343_5603795286893977408_n-1024x683.jpg`,
    blurb: "Advancing women's rights and mobilising communities to stand up for justice in Meru.",
    description:
      "In Meru, Kiengu Women Challenged to Challenge (KWCC) leads the network, advancing women's rights and mobilising communities to stand up for justice. The network brings defenders together to support one another and to reach women across the county.",
  },
  {
    slug: "mombasa",
    name: "Mombasa",
    network: "Muslim Women Advancement of Rights and Protection (MWARP)",
    hero: `${U}/2024/04/Msa-1-1024x461.jpg`,
    blurb: "Building safety and solidarity for women defenders across the coast.",
    description:
      "At the coast, Muslim Women Advancement of Rights and Protection (MWARP) builds safety and solidarity for women human rights defenders across Mombasa, championing their rights and protection and connecting them to the wider movement.",
  },
  {
    slug: "nairobi",
    name: "Nairobi",
    network: "Women Beyond Borders (WBB)",
    hero: `${U}/2024/04/WhatsApp-Image-2024-01-19-at-21.22.49-1024x768.jpeg`,
    blurb: "The capital anchors the movement and connects defenders across the country.",
    description:
      "Nairobi anchors the movement, with Women Beyond Borders (WBB) connecting defenders across the city and linking them to the wider national network. As the meeting point for many of the Hub's convenings, Nairobi keeps the county networks connected to one another.",
  },
  {
    slug: "nakuru",
    name: "Nakuru",
    network: "Women's Rights League",
    hero: `${U}/2024/04/Cover-Page-1024x381.jpg`,
    blurb: "A feminist movement of defenders, women in politics, and women journalists in the Rift Valley.",
    description:
      "In Nakuru, the Women's Rights League brings together women human rights defenders, women in politics, and women journalists in a feminist movement for gender justice and equal socio-economic and political participation.",
  },
];

export const countyBySlug = (slug: string) => COUNTIES.find((c) => c.slug === slug);
