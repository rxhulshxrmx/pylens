import { createAgentEvent, createTickets, getFeatureSpec } from "@/lib/db/factory"
import { FACTORY_SYSTEM_PROMPT, ticketPrompt } from "@/lib/factory/prompts"
import { DEFAULT_MODEL_ID, getModelById } from "@/lib/models"
import { generateText } from "ai"
import { z } from "zod"

const ticketSchema = z.object({
  tickets: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      priority: z.enum(["P0", "P1", "P2"]),
      type: z.enum(["Epic", "Story", "Task", "Bug"]),
      owner: z.string().min(1),
      acceptance: z.array(z.string().min(1)).min(2),
    })
  ).min(3),
})

export async function POST(req: Request) {
  try {
    const {
      specId,
      modelId = DEFAULT_MODEL_ID,
    }: {
      specId?: string
      modelId?: string
    } = await req.json()

    if (!specId) return Response.json({ error: "Spec id is required" }, { status: 400 })

    const modelConfig = getModelById(modelId)
    if (!modelConfig) return Response.json({ error: `Unknown model: ${modelId}` }, { status: 400 })

    const spec = await getFeatureSpec(specId)
    const result = await generateText({
      model: modelConfig.apiSdk(),
      system: FACTORY_SYSTEM_PROMPT,
      prompt: `${ticketPrompt(spec.title, spec.summary, spec.sections)}

Return only valid JSON in this exact shape:
{
  "tickets": [
    {
      "title": "string",
      "description": "string",
      "priority": "P0" | "P1" | "P2",
      "type": "Epic" | "Story" | "Task" | "Bug",
      "owner": "string",
      "acceptance": ["string", "string"]
    }
  ]
}`,
    })

    const parsed = ticketSchema.parse(extractJson(result.text))
    const tickets = await createTickets(spec.project_id, spec.id, parsed.tickets.slice(0, 10))
    await createAgentEvent(spec.project_id, "agent", `Created ${tickets.length} ticket drafts from ${spec.title}.`)

    return Response.json({ tickets })
  } catch (err) {
    console.error("Error generating tickets:", err)
    return Response.json({ error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 })
  }
}

function extractJson(text: string): unknown {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  const candidate = fenced?.[1] ?? trimmed
  const start = candidate.indexOf("{")
  const end = candidate.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return JSON")
  }
  return JSON.parse(candidate.slice(start, end + 1))
}
