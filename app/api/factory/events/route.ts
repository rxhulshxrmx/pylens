import { createAgentEvent } from "@/lib/db/factory"

export async function POST(req: Request) {
  try {
    const {
      projectId,
      actor = "user",
      text,
    }: {
      projectId?: string
      actor?: "agent" | "user"
      text?: string
    } = await req.json()

    if (!projectId || !text?.trim()) {
      return Response.json({ error: "Project id and text are required" }, { status: 400 })
    }

    const event = await createAgentEvent(projectId, actor, text.trim())
    return Response.json(event)
  } catch (err) {
    console.error("Error creating factory event:", err)
    return Response.json({ error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 })
  }
}
