"use client"

import { ALL_MODELS, type ModelConfig } from "@/lib/models"
import { ChevronDown } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

const PROVIDERS = ["OpenAI", "Anthropic", "Google", "Mistral", "xAI"]

type Props = {
  selectedModelId: string
  onChange: (modelId: string) => void
}

export default function ModelSelector({ selectedModelId, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const selected = ALL_MODELS.find((m) => m.id === selectedModelId)

  function openMenu() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 6, left: r.left })
    }
    setOpen(true)
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          style={{ top: pos.top, left: pos.left }}
          className="fixed w-56 bg-[#141414] border border-[#252525] rounded-xl shadow-xl overflow-hidden z-[9999]"
        >
          {PROVIDERS.map((provider) => {
            const models = ALL_MODELS.filter((m) => m.provider === provider)
            if (!models.length) return null
            return (
              <div key={provider}>
                <div className="px-3 py-1.5 text-[10px] font-semibold text-[#444] uppercase tracking-wider">
                  {provider}
                </div>
                {models.map((model: ModelConfig) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onChange(model.id)
                      setOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between
                      ${
                        model.id === selectedModelId
                          ? "bg-[#1f1f1f] text-[#e5e5e5]"
                          : "text-[#888] hover:bg-[#1a1a1a] hover:text-[#ccc]"
                      }`}
                  >
                    <span>{model.name}</span>
                    {model.speed && (
                      <span className="text-[#444] text-[10px]">
                        {model.speed}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )
          })}
        </div>,
        document.body
      )
    : null

  return (
    <>
      <button
        ref={btnRef}
        onClick={openMenu}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[#666] text-xs hover:bg-[#1f1f1f] hover:text-[#999] transition-colors"
      >
        <span>{selected?.name ?? "Select model"}</span>
        <ChevronDown size={12} />
      </button>
      {menu}
    </>
  )
}
