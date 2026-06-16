import { sql } from "./index"

export type Chat = {
  id: string
  title: string | null
  model_id: string | null
  created_at: string
  updated_at: string
}

export type Message = {
  id: string
  chat_id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

export async function createChat(modelId: string, title?: string): Promise<Chat> {
  const rows = await sql`
    INSERT INTO chats (model_id, title)
    VALUES (${modelId}, ${title ?? null})
    RETURNING *
  `
  return rows[0] as Chat
}

export async function updateChatTitle(chatId: string, title: string): Promise<void> {
  await sql`
    UPDATE chats SET title = ${title}, updated_at = NOW()
    WHERE id = ${chatId}
  `
}

export async function listChats(): Promise<Chat[]> {
  const rows = await sql`
    SELECT * FROM chats ORDER BY updated_at DESC LIMIT 50
  `
  return rows as Chat[]
}

export async function deleteChat(chatId: string): Promise<void> {
  await sql`DELETE FROM chats WHERE id = ${chatId}`
}

export async function saveMessage(
  chatId: string,
  role: "user" | "assistant",
  content: string
): Promise<Message> {
  const rows = await sql`
    INSERT INTO messages (chat_id, role, content)
    VALUES (${chatId}, ${role}, ${content})
    RETURNING *
  `
  await sql`UPDATE chats SET updated_at = NOW() WHERE id = ${chatId}`
  return rows[0] as Message
}

export async function getChatMessages(chatId: string): Promise<Message[]> {
  const rows = await sql`
    SELECT * FROM messages WHERE chat_id = ${chatId} ORDER BY created_at ASC
  `
  return rows as Message[]
}
