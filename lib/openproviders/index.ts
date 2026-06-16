import { createAnthropic, anthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI, google } from "@ai-sdk/google"
import { createMistral, mistral } from "@ai-sdk/mistral"
import { createOpenAI, openai } from "@ai-sdk/openai"
import { createXai, xai } from "@ai-sdk/xai"
import type { LanguageModel } from "ai"
import { getProviderForModel } from "./provider-map"
import type { SupportedModel } from "./types"

export function openproviders(
  modelId: SupportedModel,
  apiKey?: string
): LanguageModel {
  const provider = getProviderForModel(modelId)

  if (provider === "openai") {
    if (apiKey) return createOpenAI({ apiKey })(modelId)
    return openai(modelId)
  }

  if (provider === "anthropic") {
    if (apiKey) return createAnthropic({ apiKey })(modelId)
    return anthropic(modelId)
  }

  if (provider === "google") {
    if (apiKey) return createGoogleGenerativeAI({ apiKey })(modelId)
    return google(modelId)
  }

  if (provider === "mistral") {
    if (apiKey) return createMistral({ apiKey })(modelId)
    return mistral(modelId)
  }

  if (provider === "xai") {
    if (apiKey) return createXai({ apiKey })(modelId)
    return xai(modelId)
  }

  throw new Error(`Unsupported provider for model: ${modelId}`)
}
