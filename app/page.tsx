"use client"

import { useState } from "react"
import MainContent from "./components/MainContent"
import Sidebar from "./components/Sidebar"

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0)

  function handleNewChat() {
    setActiveChatId(null)
  }

  function handleChatCreated(chatId: string) {
    setActiveChatId(chatId)
    setSidebarRefreshKey((k) => k + 1)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a]">
      {sidebarOpen && (
        <Sidebar
          onCollapse={() => setSidebarOpen(false)}
          activeChatId={activeChatId}
          onSelectChat={setActiveChatId}
          onNewChat={handleNewChat}
          refreshKey={sidebarRefreshKey}
        />
      )}
      <MainContent
        sidebarOpen={sidebarOpen}
        onExpandSidebar={() => setSidebarOpen(true)}
        activeChatId={activeChatId}
        onChatCreated={handleChatCreated}
      />
    </div>
  )
}
