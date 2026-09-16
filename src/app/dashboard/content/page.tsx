import { redirect } from "next/navigation";

export default function LegacyContentRoute() {
  redirect("/dashboard/page");
}
