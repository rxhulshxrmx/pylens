"use client"

import {
  AlignJustify,
  MessageSquare,
  MoreHorizontal,
  PanelLeft,
  Plus,
  Search,
  Trash2,
  X,
  Zap,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

type Chat = {
  id: string
  title: string | null
  model_id: string | null
  updated_at: string
}

type Props = {
  onCollapse: () => void
  activeChatId: string | null
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
  refreshKey: number
}

export default function Sidebar({ onCollapse, activeChatId, onSelectChat, onNewChat, refreshKey }: Props) {
  const [chats, setChats] = useState<Chat[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchChats()
  }, [refreshKey])

  async function fetchChats() {
    try {
      const res = await fetch("/api/chats")
      if (res.ok) setChats(await res.json())
    } catch {}
  }

  async function handleDelete(e: React.MouseEvent, chatId: string) {
    e.stopPropagation()
    await fetch(`/api/chats/${chatId}`, { method: "DELETE" })
    setChats((prev) => prev.filter((c) => c.id !== chatId))
  }

  function openSearch() {
    setSearching(true)
    setTimeout(() => searchRef.current?.focus(), 50)
  }

  function closeSearch() {
    setSearching(false)
    setSearchQuery("")
  }

  const filtered = chats.filter((c) =>
    (c.title ?? "New Chat").toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <aside className="flex h-screen w-[264px] shrink-0 flex-col border-r border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-200)]">
      {/* Top icons */}
      <div className="flex items-center gap-1 px-3 pb-2 pt-4">
        {searching ? (
          <div className="flex items-center gap-1 flex-1">
            <Search size={14} className="ml-1 shrink-0 text-[var(--geist-gray-700)]" />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats…"
              className="flex-1 bg-transparent text-xs text-[var(--geist-primary)] outline-none placeholder:text-[var(--geist-gray-700)]"
            />
            <button
              onClick={closeSearch}
              className="rounded-[var(--geist-radius-sm)] p-1 text-[var(--geist-gray-700)] transition-colors hover:bg-[var(--geist-gray-alpha-100)] hover:text-[var(--geist-primary)]"
              aria-label="Close Search"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={onCollapse}
              className="rounded-[var(--geist-radius-sm)] p-1.5 text-[var(--geist-gray-800)] transition-colors hover:bg-[var(--geist-gray-alpha-100)] hover:text-[var(--geist-primary)]"
              title="Collapse Sidebar"
              aria-label="Collapse Sidebar"
            >
              <PanelLeft size={16} />
            </button>
            <button
              onClick={openSearch}
              className="rounded-[var(--geist-radius-sm)] p-1.5 text-[var(--geist-gray-800)] transition-colors hover:bg-[var(--geist-gray-alpha-100)] hover:text-[var(--geist-primary)]"
              title="Search Chats"
              aria-label="Search Chats"
            >
              <Search size={16} />
            </button>
          </>
        )}
      </div>

      {/* Nav items */}
      {!searching && (
        <nav className="px-2 mt-1">
          <button
            onClick={onNewChat}
            className="flex h-10 w-full items-center gap-2.5 rounded-[var(--geist-radius-sm)] px-3 text-sm font-medium text-[var(--geist-gray-900)] transition-colors hover:bg-[var(--geist-gray-alpha-100)] hover:text-[var(--geist-primary)]"
          >
            <Plus size={15} strokeWidth={1.75} />
            <span>New Chat</span>
          </button>
        </nav>
      )}

      {/* Chat history */}
      <div className="flex-1 overflow-y-auto px-2 mt-2">
        {filtered.length === 0 ? (
          <p className="mt-8 px-4 text-center text-sm text-[var(--geist-gray-700)]">
            {searchQuery ? "No results" : "No chats yet. Start a new chat to create one."}
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {filtered.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`group flex h-9 w-full items-center gap-2 rounded-[var(--geist-radius-sm)] px-3 text-left text-xs transition-colors ${
                  chat.id === activeChatId
                    ? "bg-[var(--geist-background-100)] text-[var(--geist-primary)] shadow-[var(--geist-shadow-raised)]"
                    : "text-[var(--geist-gray-900)] hover:bg-[var(--geist-gray-alpha-100)] hover:text-[var(--geist-primary)]"
                }`}
              >
                <MessageSquare size={13} strokeWidth={1.75} className="shrink-0 text-[var(--geist-gray-700)]" />
                <span className="flex-1 truncate">{chat.title ?? "New Chat"}</span>
                <button
                  onClick={(e) => handleDelete(e, chat.id)}
                  className="rounded-[var(--geist-radius-sm)] p-0.5 text-[var(--geist-gray-700)] opacity-0 transition-all hover:bg-[var(--geist-red-100)] hover:text-[var(--geist-red-700)] group-hover:opacity-100"
                  aria-label="Delete Chat"
                >
                  <Trash2 size={11} />
                </button>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div className="border-t border-[var(--geist-gray-alpha-200)] px-3 pb-4 pt-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--geist-primary)]">
            <span className="text-[10px] font-semibold leading-none text-[var(--geist-background-100)]">R</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium leading-tight text-[var(--geist-primary)]">Rahul Sharma</p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button className="rounded-[var(--geist-radius-sm)] p-1 text-[var(--geist-gray-700)] transition-colors hover:bg-[var(--geist-gray-alpha-100)] hover:text-[var(--geist-primary)]" aria-label="Account Menu">
              <MoreHorizontal size={14} />
            </button>
            <button className="rounded-[var(--geist-radius-sm)] p-1 text-[var(--geist-gray-700)] transition-colors hover:bg-[var(--geist-gray-alpha-100)] hover:text-[var(--geist-primary)]" aria-label="Preferences">
              <AlignJustify size={14} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
