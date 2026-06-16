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
    <aside className="flex flex-col h-screen w-[264px] bg-[#0f0f0f] border-r border-[#1f1f1f] shrink-0">
      {/* Top icons */}
      <div className="flex items-center gap-1 px-3 pt-4 pb-2">
        {searching ? (
          <div className="flex items-center gap-1 flex-1">
            <Search size={14} className="text-[#555] shrink-0 ml-1" />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="flex-1 bg-transparent text-[#ccc] text-xs outline-none placeholder-[#444]"
            />
            <button
              onClick={closeSearch}
              className="p-1 rounded text-[#555] hover:text-[#888] transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={onCollapse}
              className="p-1.5 rounded-md text-[#666] hover:text-[#999] hover:bg-[#1a1a1a] transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeft size={16} />
            </button>
            <button
              onClick={openSearch}
              className="p-1.5 rounded-md text-[#666] hover:text-[#999] hover:bg-[#1a1a1a] transition-colors"
              title="Search chats"
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
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm transition-colors text-[#888] hover:text-[#ccc] hover:bg-[#161616]"
          >
            <Plus size={15} strokeWidth={1.75} />
            <span>New Chat</span>
          </button>
        </nav>
      )}

      {/* Chat history */}
      <div className="flex-1 overflow-y-auto px-2 mt-2">
        {filtered.length === 0 ? (
          <p className="text-[#3a3a3a] text-sm text-center mt-8">
            {searchQuery ? "No results" : "No chats yet"}
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {filtered.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`group flex items-center gap-2 w-full px-3 py-2 rounded-md text-left text-xs transition-colors ${
                  chat.id === activeChatId
                    ? "bg-[#1a1a1a] text-[#e5e5e5]"
                    : "text-[#888] hover:text-[#ccc] hover:bg-[#161616]"
                }`}
              >
                <MessageSquare size={13} strokeWidth={1.75} className="shrink-0 text-[#555]" />
                <span className="flex-1 truncate">{chat.title ?? "New Chat"}</span>
                <button
                  onClick={(e) => handleDelete(e, chat.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[#555] hover:text-[#e05] transition-all"
                >
                  <Trash2 size={11} />
                </button>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div className="px-3 pb-4 border-t border-[#1a1a1a] pt-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#2e2e2e] flex items-center justify-center shrink-0">
            <span className="text-[#aaa] text-[10px] font-bold leading-none">R</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#d4d4d4] text-sm font-medium leading-tight truncate">Rahul Sharma</p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button className="p-1 rounded text-[#555] hover:text-[#888] hover:bg-[#1a1a1a] transition-colors">
              <MoreHorizontal size={14} />
            </button>
            <button className="p-1 rounded text-[#555] hover:text-[#888] hover:bg-[#1a1a1a] transition-colors">
              <AlignJustify size={14} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
