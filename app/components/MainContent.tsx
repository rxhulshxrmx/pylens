"use client"

import { DEFAULT_MODEL_ID } from "@/lib/models"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { ArrowUp, Image, PanelLeft, Square } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import ModelSelector from "./ModelSelector"

type Props = {
  sidebarOpen: boolean
  onExpandSidebar: () => void
  activeChatId: string | null
  onChatCreated: (chatId: string) => void
}

export default function MainContent({ sidebarOpen, onExpandSidebar, activeChatId, onChatCreated }: Props) {
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID)
  const [input, setInput] = useState("")
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const modelIdRef = useRef(modelId)
  const chatIdRef = useRef<string | null>(null)
  modelIdRef.current = modelId
  chatIdRef.current = currentChatId

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ modelId: modelIdRef.current, chatId: chatIdRef.current }),
      }),
    []
  )

  const { messages, sendMessage, setMessages, status, stop } = useChat({ transport })

  const isStreaming = status === "streaming" || status === "submitted"

  // When activeChatId changes from the sidebar, load that chat's messages
  useEffect(() => {
    if (activeChatId === null) {
      // New chat
      setMessages([])
      setCurrentChatId(null)
      return
    }
    if (activeChatId === currentChatId) return

    // Load existing chat messages
    fetch(`/api/chats/${activeChatId}`)
      .then((r) => r.json())
      .then((dbMessages: { id: string; role: string; content: string }[]) => {
        const uiMessages = dbMessages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          parts: [{ type: "text" as const, text: m.content }],
          metadata: {},
        }))
        setMessages(uiMessages)
        setCurrentChatId(activeChatId)
      })
      .catch(() => {})
  }, [activeChatId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function submit() {
    if (!input.trim() || isStreaming) return
    const text = input
    setInput("")

    // Create a chat in DB on first message
    let chatId = currentChatId
    if (!chatId) {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId }),
      })
      const chat = await res.json()
      chatId = chat.id
      setCurrentChatId(chatId)
      onChatCreated(chatId!)
    }

    sendMessage({ text })
  }

  const hasMessages = messages.length > 0

  return (
    <main className="relative flex-1 flex flex-col h-screen bg-[#0a0a0a]">
      {!sidebarOpen && (
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={onExpandSidebar}
            className="p-1.5 rounded-md text-[#666] hover:text-[#999] hover:bg-[#1a1a1a] transition-colors"
            title="Expand sidebar"
          >
            <PanelLeft size={16} />
          </button>
        </div>
      )}

      {/* Messages area */}
      {hasMessages && (
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[600px] flex flex-col gap-6">
              {messages.map((msg) => {
                const textContent = msg.parts
                  .filter((p) => p.type === "text")
                  .map((p) => (p as { type: "text"; text: string }).text)
                  .join("")

                return (
                  <div key={msg.id}>
                    {msg.role === "user" ? (
                      <div className="flex justify-end">
                        <div className="bg-[#1a1a1a] border border-[#252525] rounded-2xl px-4 py-2.5 max-w-[85%] text-sm text-[#d4d4d4] leading-relaxed whitespace-pre-wrap">
                          {textContent}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-[#c0c0c0] leading-relaxed whitespace-pre-wrap">
                        {textContent}
                        {isStreaming && msg.id === messages[messages.length - 1]?.id && (
                          <span className="inline-block w-1.5 h-3.5 bg-[#555] ml-0.5 animate-pulse rounded-sm" />
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
          </div>
        </div>
      )}

      {!hasMessages && <div className="h-[100px] pointer-events-none" />}

      {/* Chat input */}
      <div className={`flex justify-center px-6 ${hasMessages ? "pb-6" : "pb-0"}`}>
        <div className="w-full max-w-[600px]">
          <div className="bg-[#141414] border border-[#252525] rounded-xl overflow-hidden">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask to build, fix bugs, explore"
              rows={1}
              className="w-full bg-transparent px-4 pt-4 pb-2 text-[#ccc] text-sm placeholder-[#444] resize-none outline-none leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  submit()
                }
              }}
            />

            <div className="flex items-center justify-between px-3 pb-3 pt-1">
              <div className="flex items-center gap-1">
                <ModelSelector selectedModelId={modelId} onChange={setModelId} />
                <button
                  type="button"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[#666] text-xs hover:bg-[#1f1f1f] hover:text-[#999] transition-colors"
                >
                  MCPs
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="p-1.5 rounded-md text-[#555] hover:text-[#888] hover:bg-[#1f1f1f] transition-colors"
                >
                  <Image size={15} />
                </button>
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={stop}
                    className="w-7 h-7 rounded-full flex items-center justify-center bg-[#e5e5e5] text-black hover:bg-white transition-colors"
                  >
                    <Square size={10} fill="currentColor" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={!input.trim()}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                      input.trim()
                        ? "bg-[#e5e5e5] text-black hover:bg-white cursor-pointer"
                        : "bg-[#1f1f1f] text-[#444] cursor-not-allowed"
                    }`}
                  >
                    <ArrowUp size={14} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {!hasMessages && <div className="flex-1" />}
    </main>
  )
}
