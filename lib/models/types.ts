import type { LanguageModel } from "ai"

export type ModelConfig = {
  id: string
  name: string
  provider: string
  providerId: string
  description?: string
  contextWindow?: number
  speed?: "Fast" | "Medium" | "Slow"
  apiSdk: (apiKey?: string) => LanguageModel
}
