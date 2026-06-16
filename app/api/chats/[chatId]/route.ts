import { deleteChat, getChatMessages } from "@/lib/db/chats"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params
    const messages = await getChatMessages(chatId)
    return NextResponse.json(messages)
  } catch {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params
    await deleteChat(chatId)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete chat" }, { status: 500 })
  }
}
