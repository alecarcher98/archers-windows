import { redirect } from "next/navigation";

// Normally never rendered — proxy.ts rewrites "/" to "/marketing" at the
// edge before Next's router gets here. Kept as a safety net in case that
// rewrite is ever bypassed.
export default function Home() {
  redirect("/marketing");
}
