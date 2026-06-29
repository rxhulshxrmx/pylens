import { createProject, getFactoryState } from "@/lib/db/factory"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const projectId = url.searchParams.get("projectId") ?? undefined
    const state = await getFactoryState(projectId)
    return Response.json(state)
  } catch (err) {
    console.error("Error loading factory state:", err)
    return Response.json({ error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, description }: { name?: string; description?: string } = await req.json()
    if (!name?.trim()) return Response.json({ error: "Project name is required" }, { status: 400 })

    const project = await createProject(name.trim(), description?.trim())
    const state = await getFactoryState(project.id)
    return Response.json(state)
  } catch (err) {
    console.error("Error creating factory project:", err)
    return Response.json({ error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 })
  }
}
