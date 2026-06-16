export type OpenAIModel =
  | "gpt-4o"
  | "gpt-4o-mini"
  | "gpt-4.1"
  | "gpt-4.1-mini"
  | "o3-mini"
  | "o4-mini"

export type AnthropicModel =
  | "claude-3-7-sonnet-20250219"
  | "claude-3-5-sonnet-latest"
  | "claude-3-5-haiku-latest"
  | "claude-3-opus-latest"

export type GeminiModel =
  | "gemini-2.5-pro-exp-03-25"
  | "gemini-2.0-flash-001"
  | "gemini-1.5-pro"
  | "gemini-1.5-flash"

export type MistralModel =
  | "mistral-large-latest"
  | "mistral-small-latest"
  | "ministral-8b-latest"

export type XaiModel =
  | "grok-3"
  | "grok-3-mini"
  | "grok-2"

export type Provider =
  | "openai"
  | "anthropic"
  | "google"
  | "mistral"
  | "xai"

export type SupportedModel =
  | OpenAIModel
  | AnthropicModel
  | GeminiModel
  | MistralModel
  | XaiModel
