import { redirect } from "next/navigation";

export default function TodayRedirect() {
  redirect("/schedule?tab=day");
}
