import { openproviders } from "@/lib/openproviders"
import type { ModelConfig } from "../types"

export const openaiModels: ModelConfig[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    providerId: "openai",
    description: "Flagship multimodal model, fast and capable.",
    contextWindow: 128000,
    speed: "Fast",
    apiSdk: (apiKey?) => openproviders("gpt-4o", apiKey),
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    providerId: "openai",
    description: "Affordable and fast for lightweight tasks.",
    contextWindow: 128000,
    speed: "Fast",
    apiSdk: (apiKey?) => openproviders("gpt-4o-mini", apiKey),
  },
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    provider: "OpenAI",
    providerId: "openai",
    description: "Latest GPT-4.1 with improved instruction following.",
    contextWindow: 1000000,
    speed: "Medium",
    apiSdk: (apiKey?) => openproviders("gpt-4.1", apiKey),
  },
  {
    id: "o4-mini",
    name: "o4 Mini",
    provider: "OpenAI",
    providerId: "openai",
    description: "Fast reasoning model for complex tasks.",
    contextWindow: 200000,
    speed: "Medium",
    apiSdk: (apiKey?) => openproviders("o4-mini", apiKey),
  },
]
