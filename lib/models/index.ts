import { anthropicModels } from "./data/anthropic"
import { googleModels } from "./data/google"
import { mistralModels } from "./data/mistral"
import { openaiModels } from "./data/openai"
import { xaiModels } from "./data/xai"
import type { ModelConfig } from "./types"

export const ALL_MODELS: ModelConfig[] = [
  ...openaiModels,
  ...anthropicModels,
  ...googleModels,
  ...mistralModels,
  ...xaiModels,
]

export const DEFAULT_MODEL_ID = "mistral-small-latest"

export function getModelById(id: string): ModelConfig | undefined {
  return ALL_MODELS.find((m) => m.id === id)
}

export type { ModelConfig }
