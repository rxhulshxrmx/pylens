"use client";

import { useState } from "react";
import { ChevronDown, Image, ArrowUp } from "lucide-react";

export default function MainContent() {
  const [message, setMessage] = useState("");

  return (
    <main className="flex-1 flex flex-col h-screen bg-[#0a0a0a] overflow-hidden">
      <div className="flex justify-center px-6 pt-[100px]">
        <div className="w-full max-w-[600px]">
        <div className="bg-[#141414] border border-[#252525] rounded-xl overflow-hidden">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask to build, fix bugs, explore"
            rows={3}
            className="w-full bg-transparent px-4 pt-4 pb-2 text-[#ccc] text-sm placeholder-[#444] resize-none outline-none leading-relaxed"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
              }
            }}
          />

          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 pb-3 pt-1">
            <div className="flex items-center gap-1">
              <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[#666] text-xs hover:bg-[#1f1f1f] hover:text-[#999] transition-colors">
                <span>GPT-5.5 High</span>
                <ChevronDown size={12} />
              </button>
              <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[#666] text-xs hover:bg-[#1f1f1f] hover:text-[#999] transition-colors">
                <span>MCPs</span>
                <ChevronDown size={12} />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button className="p-1.5 rounded-md text-[#555] hover:text-[#888] hover:bg-[#1f1f1f] transition-colors">
                <Image size={15} />
              </button>
              <button
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors
                  ${message.trim()
                    ? "bg-[#e5e5e5] text-black hover:bg-white"
                    : "bg-[#1f1f1f] text-[#444]"
                  }`}
              >
                <ArrowUp size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
      <div className="flex-1" />

    </main>
  );
}
