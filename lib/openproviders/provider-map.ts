import type { Provider, SupportedModel } from "./types"

const MODEL_PROVIDER_MAP: Record<string, Provider> = {
  // OpenAI
  "gpt-4o": "openai",
  "gpt-4o-mini": "openai",
  "gpt-4.1": "openai",
  "gpt-4.1-mini": "openai",
  "o3-mini": "openai",
  "o4-mini": "openai",

  // Anthropic
  "claude-3-7-sonnet-20250219": "anthropic",
  "claude-3-5-sonnet-latest": "anthropic",
  "claude-3-5-haiku-latest": "anthropic",
  "claude-3-opus-latest": "anthropic",

  // Google
  "gemini-2.5-pro-exp-03-25": "google",
  "gemini-2.0-flash-001": "google",
  "gemini-1.5-pro": "google",
  "gemini-1.5-flash": "google",

  // Mistral
  "mistral-large-latest": "mistral",
  "mistral-small-latest": "mistral",
  "ministral-8b-latest": "mistral",

  // xAI
  "grok-3": "xai",
  "grok-3-mini": "xai",
  "grok-2": "xai",
}

export function getProviderForModel(model: SupportedModel): Provider {
  const provider = MODEL_PROVIDER_MAP[model]
  if (!provider) throw new Error(`Unknown provider for model: ${model}`)
  return provider
}
