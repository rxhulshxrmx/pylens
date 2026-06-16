import { openproviders } from "@/lib/openproviders"
import type { ModelConfig } from "../types"

export const anthropicModels: ModelConfig[] = [
  {
    id: "claude-3-7-sonnet-20250219",
    name: "Claude 3.7 Sonnet",
    provider: "Anthropic",
    providerId: "anthropic",
    description: "Most intelligent Claude model with extended thinking.",
    contextWindow: 200000,
    speed: "Medium",
    apiSdk: (apiKey?) => openproviders("claude-3-7-sonnet-20250219", apiKey),
  },
  {
    id: "claude-3-5-sonnet-latest",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    providerId: "anthropic",
    description: "Balanced model for reasoning and general tasks.",
    contextWindow: 200000,
    speed: "Medium",
    apiSdk: (apiKey?) => openproviders("claude-3-5-sonnet-latest", apiKey),
  },
  {
    id: "claude-3-5-haiku-latest",
    name: "Claude 3.5 Haiku",
    provider: "Anthropic",
    providerId: "anthropic",
    description: "Fast and lightweight Claude model.",
    contextWindow: 200000,
    speed: "Fast",
    apiSdk: (apiKey?) => openproviders("claude-3-5-haiku-latest", apiKey),
  },
]
