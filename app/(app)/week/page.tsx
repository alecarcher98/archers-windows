import { redirect } from "next/navigation";

export default function WeekRedirect() {
  redirect("/schedule?tab=week");
}
