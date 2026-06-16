import { openproviders } from "@/lib/openproviders"
import type { ModelConfig } from "../types"

export const mistralModels: ModelConfig[] = [
  {
    id: "mistral-large-latest",
    name: "Mistral Large",
    provider: "Mistral",
    providerId: "mistral",
    description: "Top-tier Mistral model for complex reasoning.",
    contextWindow: 128000,
    speed: "Medium",
    apiSdk: (apiKey?) => openproviders("mistral-large-latest", apiKey),
  },
  {
    id: "mistral-small-latest",
    name: "Mistral Small",
    provider: "Mistral",
    providerId: "mistral",
    description: "Efficient Mistral model for everyday tasks.",
    contextWindow: 32000,
    speed: "Fast",
    apiSdk: (apiKey?) => openproviders("mistral-small-latest", apiKey),
  },
]
