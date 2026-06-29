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
          className="fixed z-[9999] w-56 overflow-hidden rounded-[var(--geist-radius-md)] border border-[var(--geist-gray-alpha-300)] bg-[var(--geist-background-100)] shadow-[var(--geist-shadow-popover)]"
        >
          {PROVIDERS.map((provider) => {
            const models = ALL_MODELS.filter((m) => m.provider === provider)
            if (!models.length) return null
            return (
              <div key={provider}>
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--geist-gray-700)]">
                  {provider}
                </div>
                {models.map((model: ModelConfig) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onChange(model.id)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors
                      ${
                        model.id === selectedModelId
                          ? "bg-[var(--geist-blue-100)] text-[var(--geist-primary)]"
                          : "text-[var(--geist-gray-900)] hover:bg-[var(--geist-gray-alpha-100)] hover:text-[var(--geist-primary)]"
                      }`}
                  >
                    <span>{model.name}</span>
                    {model.speed && (
                      <span className="text-[10px] text-[var(--geist-gray-700)]">
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
        className="flex h-8 items-center gap-1 rounded-[var(--geist-radius-sm)] px-2.5 text-xs font-medium text-[var(--geist-gray-900)] transition-colors hover:bg-[var(--geist-gray-alpha-100)] hover:text-[var(--geist-primary)]"
      >
        <span>{selected?.name ?? "Select model"}</span>
        <ChevronDown size={12} />
      </button>
      {menu}
    </>
  )
}
