import { openproviders } from "@/lib/openproviders"
import type { ModelConfig } from "../types"

export const googleModels: ModelConfig[] = [
  {
    id: "gemini-2.5-pro-exp-03-25",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    providerId: "google",
    description: "Most capable Gemini model with deep reasoning.",
    contextWindow: 1000000,
    speed: "Slow",
    apiSdk: (apiKey?) => openproviders("gemini-2.5-pro-exp-03-25", apiKey),
  },
  {
    id: "gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    providerId: "google",
    description: "Fast, multimodal Gemini model.",
    contextWindow: 1000000,
    speed: "Fast",
    apiSdk: (apiKey?) => openproviders("gemini-2.0-flash-001", apiKey),
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: "Google",
    providerId: "google",
    description: "Efficient model for high-frequency tasks.",
    contextWindow: 1000000,
    speed: "Fast",
    apiSdk: (apiKey?) => openproviders("gemini-1.5-flash", apiKey),
  },
]
