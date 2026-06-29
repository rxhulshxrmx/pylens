import { createProject, listProjects } from "@/lib/db/factory"

export async function GET() {
  try {
    const projects = await listProjects()
    return Response.json({ projects })
  } catch (err) {
    console.error("Error listing factory projects:", err)
    return Response.json({ error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, description }: { name?: string; description?: string } = await req.json()
    if (!name?.trim()) return Response.json({ error: "Workspace name is required" }, { status: 400 })

    const project = await createProject(name.trim(), description?.trim())
    return Response.json(project)
  } catch (err) {
    console.error("Error creating factory project:", err)
    return Response.json({ error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 })
  }
}
