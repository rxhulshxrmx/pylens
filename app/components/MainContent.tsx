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
    <main className="relative flex h-screen flex-1 flex-col bg-[var(--geist-background-100)]">
      {!sidebarOpen && (
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={onExpandSidebar}
            className="rounded-[var(--geist-radius-sm)] p-1.5 text-[var(--geist-gray-800)] transition-colors hover:bg-[var(--geist-gray-alpha-100)] hover:text-[var(--geist-primary)]"
            title="Expand Sidebar"
            aria-label="Expand Sidebar"
          >
            <PanelLeft size={16} />
          </button>
        </div>
      )}

      {/* Messages area */}
      {hasMessages && (
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex flex-col items-center">
            <div className="flex w-full max-w-[680px] flex-col gap-6">
              {messages.map((msg) => {
                const textContent = msg.parts
                  .filter((p) => p.type === "text")
                  .map((p) => (p as { type: "text"; text: string }).text)
                  .join("")

                return (
                  <div key={msg.id}>
                    {msg.role === "user" ? (
                      <div className="flex justify-end">
                        <div className="max-w-[85%] whitespace-pre-wrap rounded-[var(--geist-radius-md)] border border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-200)] px-4 py-2.5 text-sm leading-6 text-[var(--geist-primary)]">
                          {textContent}
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-sm leading-6 text-[var(--geist-gray-1000)]">
                        {textContent}
                        {isStreaming && msg.id === messages[messages.length - 1]?.id && (
                          <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse rounded-sm bg-[var(--geist-blue-700)]" />
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

      {!hasMessages && (
        <div className="pointer-events-none flex flex-1 items-end justify-center px-6 pb-10">
          <div className="w-full max-w-[680px]">
            <h1 className="text-[32px] font-semibold leading-10 tracking-[-1.28px] text-[var(--geist-primary)]">
              What are we building?
            </h1>
          </div>
        </div>
      )}

      {/* Chat input */}
      <div className={`flex justify-center px-6 ${hasMessages ? "pb-6" : "pb-10"}`}>
        <div className="w-full max-w-[680px]">
          <div className="overflow-hidden rounded-[var(--geist-radius-md)] border border-[var(--geist-gray-alpha-300)] bg-[var(--geist-background-100)] shadow-[var(--geist-shadow-raised)]">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask to build, fix bugs, explore"
              rows={1}
              className="w-full resize-none bg-transparent px-4 pb-2 pt-4 text-sm leading-6 text-[var(--geist-primary)] outline-none placeholder:text-[var(--geist-gray-700)]"
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
                  className="flex h-8 items-center gap-1 rounded-[var(--geist-radius-sm)] px-2.5 text-xs font-medium text-[var(--geist-gray-900)] transition-colors hover:bg-[var(--geist-gray-alpha-100)] hover:text-[var(--geist-primary)]"
                >
                  MCPs
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="rounded-[var(--geist-radius-sm)] p-1.5 text-[var(--geist-gray-800)] transition-colors hover:bg-[var(--geist-gray-alpha-100)] hover:text-[var(--geist-primary)]"
                  aria-label="Attach Image"
                >
                  <Image size={15} />
                </button>
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={stop}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--geist-primary)] text-[var(--geist-background-100)] transition-colors hover:bg-[var(--geist-gray-900)]"
                    aria-label="Stop Generation"
                  >
                    <Square size={10} fill="currentColor" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={!input.trim()}
                    className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                      input.trim()
                        ? "cursor-pointer bg-[var(--geist-primary)] text-[var(--geist-background-100)] hover:bg-[var(--geist-gray-900)]"
                        : "cursor-not-allowed bg-[var(--geist-gray-100)] text-[var(--geist-gray-700)]"
                    }`}
                    aria-label="Send Message"
                  >
                    <ArrowUp size={14} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {!hasMessages && <div className="h-8" />}
    </main>
  )
}
