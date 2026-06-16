import { saveMessage, updateChatTitle } from "@/lib/db/chats"
import { getModelById } from "@/lib/models"
import { convertToModelMessages, streamText, UIMessage } from "ai"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { messages, modelId, chatId }: { messages: UIMessage[]; modelId: string; chatId?: string } =
      await req.json()

    if (!messages || !modelId) {
      return new Response(JSON.stringify({ error: "Missing messages or modelId" }), { status: 400 })
    }

    const modelConfig = getModelById(modelId)
    if (!modelConfig) {
      return new Response(JSON.stringify({ error: `Unknown model: ${modelId}` }), { status: 400 })
    }

    // Persist the latest user message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")
    const userText = lastUserMsg?.parts
      ?.filter((p: { type: string }) => p.type === "text")
      .map((p: { type: string; text?: string }) => p.text ?? "")
      .join("") ?? ""

    if (chatId && userText) {
      await saveMessage(chatId, "user", userText)
      // Use first user message as title if chat has no title yet
      if (messages.filter((m) => m.role === "user").length === 1) {
        await updateChatTitle(chatId, userText.slice(0, 80))
      }
    }

    const modelMessages = await convertToModelMessages(messages)

    let fullResponse = ""
    const result = streamText({
      model: modelConfig.apiSdk(),
      messages: modelMessages,
      system: "You are a helpful AI assistant.",
      onFinish: async ({ text }) => {
        fullResponse = text
        if (chatId && text) {
          await saveMessage(chatId, "assistant", text)
        }
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (err: unknown) {
    console.error("Error in /api/chat:", err)
    const message = err instanceof Error ? err.message : "Internal server error"
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
