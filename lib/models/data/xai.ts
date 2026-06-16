import { openproviders } from "@/lib/openproviders"
import type { ModelConfig } from "../types"

export const xaiModels: ModelConfig[] = [
  {
    id: "grok-3",
    name: "Grok 3",
    provider: "xAI",
    providerId: "xai",
    description: "xAI's most powerful model.",
    contextWindow: 131072,
    speed: "Medium",
    apiSdk: (apiKey?) => openproviders("grok-3", apiKey),
  },
  {
    id: "grok-3-mini",
    name: "Grok 3 Mini",
    provider: "xAI",
    providerId: "xai",
    description: "Lightweight Grok model with fast responses.",
    contextWindow: 131072,
    speed: "Fast",
    apiSdk: (apiKey?) => openproviders("grok-3-mini", apiKey),
  },
]
