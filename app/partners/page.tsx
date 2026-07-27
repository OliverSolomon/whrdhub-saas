import { redirect } from "next/navigation";

// Partners now live as a section on the About page.
export default function PartnersRedirect() {
  redirect("/about#partners");
}
