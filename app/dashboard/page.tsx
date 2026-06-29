import { auth } from "@/auth"
import { redirect } from "next/navigation"
import FactoryWorkspace from "../components/FactoryWorkspace"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/sign-in")
  return <FactoryWorkspace />
}
