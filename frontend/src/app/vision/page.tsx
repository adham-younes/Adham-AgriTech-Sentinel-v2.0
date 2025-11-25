import { redirect } from "next/navigation"

export default function VisionPage() {
  // Redirect /vision to /about to keep links stable
  redirect("/about")
}

