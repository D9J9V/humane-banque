import { redirect } from "next/navigation";

export default function RootPage() {
  // Redirect to the info page
  redirect("/info");
  return null;
}
