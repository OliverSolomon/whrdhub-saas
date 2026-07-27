import Link from "next/link";
import { ShieldAlert, MapPin, Mail, Phone } from "lucide-react";
import { NAV, links } from "@/lib/site-nav";
import { SOCIALS } from "@/lib/team";
import { CONTACT } from "@/lib/site-content";
import { FacebookIcon, XIcon, InstagramIcon, LinkedinIcon, YoutubeIcon } from "@/components/social-icons";

const LOGO = "https://whrdhub.org/wp-content/uploads/2025/05/imageedit_10_2063970092-600x198.png";

const SOCIAL_LINKS = [
  { href: SOCIALS.facebook, label: "Facebook", Icon: FacebookIcon },
  { href: SOCIALS.x, label: "X", Icon: XIcon },
  { href: SOCIALS.instagram, label: "Instagram", Icon: InstagramIcon },
  { href: SOCIALS.linkedin, label: "LinkedIn", Icon: LinkedinIcon },
  { href: SOCIALS.youtube, label: "YouTube", Icon: YoutubeIcon },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt="WHRD Hub" className="h-16 sm:h-20 w-auto" />
            <p className="mt-4 text-sm text-muted max-w-xs leading-relaxed">
              A home for women human rights defenders across Kenya. Share your work, publish your
              stories, and grow through femtorship.
            </p>
            <a href={links.reportAbuse} target="_blank" className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-magenta text-white px-4 h-10 text-sm font-bold hover:brightness-95">
              <ShieldAlert className="w-4 h-4" /> Report Abuse
            </a>

            {/* Social icons */}
            <div className="mt-5 flex items-center gap-2">
              {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-line flex items-center justify-center text-ink/70 hover:text-white hover:bg-purple hover:border-purple transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {NAV.filter((n) => n.children).slice(0, 2).map((group) => (
            <div key={group.label}>
              <p className="text-sm font-bold text-ink mb-3">{group.label}</p>
              <ul className="space-y-2">
                {group.children!.slice(0, 5).map((c) => (
                  <li key={c.label}>
                    <Link href={c.href} target={c.external ? "_blank" : undefined} className="text-sm text-muted hover:text-purple-700 transition-colors">
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <p className="text-sm font-bold text-ink mb-3">Get in touch</p>
            <ul className="space-y-2.5 text-sm text-muted">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-purple" /> {CONTACT.address}
              </li>
              <li>
                <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2 hover:text-purple-700 transition-colors">
                  <Mail className="w-4 h-4 shrink-0 text-purple" /> {CONTACT.email}
                </a>
              </li>
              <li>
                <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-purple-700 transition-colors">
                  <Phone className="w-4 h-4 shrink-0 text-purple" /> {CONTACT.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-line text-center">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Created by Women Human Rights Defenders Hub (The Hub). All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
