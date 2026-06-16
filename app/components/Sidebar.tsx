"use client";

import {
  PanelLeft,
  Search,
  Zap,
  Clock,
  MoreHorizontal,
  AlignJustify,
} from "lucide-react";

const navItems = [
  { icon: Zap, label: "New Agent" },
  { icon: Clock, label: "Automations" },
];

export default function Sidebar() {
  return (
    <aside className="flex flex-col h-screen w-[264px] bg-[#0f0f0f] border-r border-[#1f1f1f] shrink-0">
      {/* Top icons */}
      <div className="flex items-center gap-1 px-3 pt-4 pb-2">
        <button className="p-1.5 rounded-md text-[#666] hover:text-[#999] hover:bg-[#1a1a1a] transition-colors">
          <PanelLeft size={16} />
        </button>
        <button className="p-1.5 rounded-md text-[#666] hover:text-[#999] hover:bg-[#1a1a1a] transition-colors">
          <Search size={16} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="px-2 mt-1">
        {navItems.map(({ icon: Icon, label }) => (
          <button
            key={label}
            className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm transition-colors
              ${label === "New Agent"
                ? "bg-[#1a1a1a] text-[#e5e5e5]"
                : "text-[#888] hover:text-[#ccc] hover:bg-[#161616]"
              }`}
          >
            <Icon size={15} strokeWidth={1.75} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Empty state */}
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#3a3a3a] text-sm">No Agents Yet</p>
      </div>

      {/* Bottom section */}
      <div className="px-3 pb-4 border-t border-[#1a1a1a] pt-3">
        {/* User row */}
        <div className="flex items-center gap-2">
          {/* Avatar */}
          <div className="w-6 h-6 rounded-full bg-[#2e2e2e] flex items-center justify-center shrink-0 overflow-hidden">
            <span className="text-[#aaa] text-[10px] font-bold leading-none">R</span>
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0">
            <p className="text-[#d4d4d4] text-sm font-medium leading-tight truncate">
              Rahul Sharma
            </p>
          </div>

          {/* Actions */}
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
  );
}
