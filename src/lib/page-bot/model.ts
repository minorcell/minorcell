/** Prebuilt 1B instruct weights, with a 128K native context window. */
export const DEFAULT_MODEL_ID = 'Llama-3.2-1B-Instruct-q4f16_1-MLC'

/** Override WebLLM's 4K preset at engine initialization. */
export const DEFAULT_CONTEXT_WINDOW = 64 * 1024
export const CONTEXT_PRUNE_THRESHOLD = 0.8
export const CONTEXT_PRUNE_TARGET = 0.6
