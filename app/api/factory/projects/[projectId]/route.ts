import { deleteProject, updateProject } from "@/lib/db/factory"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const { name, description }: { name?: string; description?: string | null } = await req.json()

    if (name !== undefined && !name.trim()) {
      return Response.json({ error: "Workspace name is required" }, { status: 400 })
    }

    const project = await updateProject(projectId, { name, description })
    return Response.json(project)
  } catch (err) {
    console.error("Error updating factory project:", err)
    return Response.json({ error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    await deleteProject(projectId)
    return new Response(null, { status: 204 })
  } catch (err) {
    console.error("Error deleting factory project:", err)
    return Response.json({ error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 })
  }
}
