import { createChat, listChats } from "@/lib/db/chats"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const chats = await listChats()
    return NextResponse.json(chats)
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { modelId, title } = await req.json()
    const chat = await createChat(modelId, title)
    return NextResponse.json(chat)
  } catch (err) {
    return NextResponse.json({ error: "Failed to create chat" }, { status: 500 })
  }
}
