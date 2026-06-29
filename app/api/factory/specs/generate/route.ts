import { createAgentEvent, createFeatureSpec, createFileBlueprints, getProject } from "@/lib/db/factory"
import { FACTORY_SYSTEM_PROMPT, featureSpecPrompt } from "@/lib/factory/prompts"
import { DEFAULT_MODEL_ID, getModelById } from "@/lib/models"
import { generateText } from "ai"
import { z } from "zod"

const specSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  sections: z.array(
    z.object({
      title: z.string().min(1),
      body: z.string().min(1),
    })
  ).min(4),
  fileBlueprints: z.array(
    z.object({
      path: z.string().min(1),
      purpose: z.string().min(1),
    })
  ).min(3),
})

export async function POST(req: Request) {
  try {
    const {
      projectId,
      prompt,
      modelId = DEFAULT_MODEL_ID,
    }: {
      projectId?: string
      prompt?: string
      modelId?: string
    } = await req.json()

    if (!projectId || !prompt?.trim()) {
      return Response.json({ error: "Project id and prompt are required" }, { status: 400 })
    }

    const modelConfig = getModelById(modelId)
    if (!modelConfig) return Response.json({ error: `Unknown model: ${modelId}` }, { status: 400 })

    const project = await getProject(projectId)
    await createAgentEvent(project.id, "user", prompt.trim())

    const result = await generateText({
      model: modelConfig.apiSdk(),
      system: FACTORY_SYSTEM_PROMPT,
      prompt: `${featureSpecPrompt(project.name, prompt.trim())}

Return only valid JSON in this exact shape:
{
  "title": "string",
  "summary": "string",
  "sections": [
    { "title": "string", "body": "string" }
  ],
  "fileBlueprints": [
    { "path": "string", "purpose": "string" }
  ]
}

Rules:
- sections must contain at least 4 items.
- body must always be a string. If you need bullets or structured content, put markdown text inside the string.
- fileBlueprints must contain at least 3 implementation files.
- Do not duplicate keys.
- Do not include prose outside JSON.`,
    })

    const parsed = specSchema.parse(normalizeSpec(extractJson(result.text)))

    const spec = await createFeatureSpec({
      projectId: project.id,
      title: parsed.title,
      summary: parsed.summary,
      sourcePrompt: prompt.trim(),
      sections: parsed.sections,
    })

    await createFileBlueprints(project.id, parsed.fileBlueprints)
    await createAgentEvent(project.id, "agent", `Generated FS: ${spec.title}`)

    return Response.json({ spec })
  } catch (err) {
    console.error("Error generating feature spec:", err)
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

function normalizeSpec(value: unknown): unknown {
  if (!value || typeof value !== "object") return value
  const input = value as Record<string, unknown>
  const sections = Array.isArray(input.sections)
    ? input.sections.map((section) => {
        if (!section || typeof section !== "object") return section
        const s = section as Record<string, unknown>
        return {
          title: String(s.title ?? "Untitled"),
          body: typeof s.body === "string" ? s.body : JSON.stringify(s.body, null, 2),
        }
      })
    : []

  const fromSectionBody = sections.flatMap((section) => {
    if (!section || typeof section !== "object") return []
    const body = (section as Record<string, unknown>).body
    if (typeof body !== "string") return []
    try {
      const parsed = JSON.parse(body)
      if (!Array.isArray(parsed)) return []
      return parsed
        .filter((item) => item && typeof item === "object")
        .map((item) => {
          const blueprint = item as Record<string, unknown>
          return {
            path: String(blueprint.path ?? ""),
            purpose: String(blueprint.purpose ?? ""),
          }
        })
        .filter((item) => item.path && item.purpose)
    } catch {
      return []
    }
  })

  const fileBlueprints = Array.isArray(input.fileBlueprints)
    ? input.fileBlueprints
    : fromSectionBody.length
      ? fromSectionBody
      : [
          { path: "README.md", purpose: "Document setup, usage, and product decisions" },
          { path: "src/index.ts", purpose: "Application entry point" },
          { path: "src/core/workflow.ts", purpose: "Core workflow orchestration logic" },
        ]

  return {
    title: String(input.title ?? "Generated Feature Spec"),
    summary: String(input.summary ?? ""),
    sections,
    fileBlueprints,
  }
}
