import type { Plugin } from "@opencode-ai/plugin"

/**
 * opencode-timestamp
 *
 * Prefixes user (and, on V1, assistant) messages with an ISO 8601 timestamp,
 * and strips those timestamps before messages reach the LLM.
 *
 * OpenCode 2 removed the assistant-message-completion hook, so on V2 only user
 * messages are timestamped. V1 keeps all three original hooks.
 */

/** Shared timestamp helpers (also covered by plugin.test.ts). */

export function formatTimestamp(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0")
  const y = date.getFullYear()
  const M = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const h = pad(date.getHours())
  const m = pad(date.getMinutes())
  const s = pad(date.getSeconds())
  return `(${y}-${M}-${d}T${h}:${m}:${s})`
}

// Anchored, non-global: safe to reuse with .test() (no lastIndex state) and
// applied repeatedly by stripTimestamps.
export const TIMESTAMP_RE = /^\(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\)\n/

export function addTimestamp(text: string, date: Date = new Date()): string {
  if (TIMESTAMP_RE.test(text)) return text
  return `${formatTimestamp(date)}\n${text}`
}

export function stripTimestamps(text: string): string {
  let out = text
  while (TIMESTAMP_RE.test(out)) out = out.replace(TIMESTAMP_RE, "")
  return out
}

/**
 * V1 entrypoint. OpenCode 1.x reads `server()` and uses the returned hooks.
 * OpenCode >= 1.18.29 accepts this object form; older V1 releases stay on the
 * 1.x line of this package.
 */
export const server: Plugin = async () => ({
  // Prepend a timestamp to the first text part of a user message.
  "chat.message": async (_input, output) => {
    const firstText = output.parts.find((p) => p.type === "text")
    if (firstText) firstText.text = addTimestamp(firstText.text)
  },

  // Prepend a timestamp to every assistant text completion.
  "experimental.text.complete": async (_input, output) => {
    output.text = addTimestamp(output.text)
  },

  // Strip timestamps from all text parts before they reach the LLM.
  "experimental.chat.messages.transform": async (_input, output) => {
    for (const msg of output.messages) {
      for (const part of msg.parts) {
        if (part.type === "text") part.text = stripTimestamps(part.text)
      }
    }
  },
})

/**
 * V2 setup. OpenCode 2 reads the default export's `id` and `setup()`.
 *
 * `prompt` timestamps the user's message as it is admitted (so it persists and
 * is visible in the UI); `context` strips timestamps from the model-visible
 * messages immediately before dispatch. Both are Promise hooks.
 */
async function setup(ctx: {
  session: { hook(name: string, callback: (event: any) => void): Promise<unknown> }
}): Promise<void> {
  // V1 (>= 1.18.29) also invokes default.setup(), but with a context that has
  // no session-hook API. Bail quietly; V1 is served entirely by server().
  if (!ctx || !ctx.session || typeof ctx.session.hook !== "function") return

  await ctx.session.hook("prompt", (event: { prompt?: { text?: string } }) => {
    if (typeof event.prompt?.text === "string") {
      event.prompt.text = addTimestamp(event.prompt.text)
    }
  })

  await ctx.session.hook("context", (event: { messages?: any[] }) => {
    for (const msg of event.messages ?? []) {
      const parts = msg?.content ?? msg?.parts ?? []
      for (const part of parts) {
        if (part?.type === "text" && typeof part.text === "string") {
          part.text = stripTimestamps(part.text)
        }
      }
    }
  })
}

export default {
  id: "opencode-timestamp",
  server,
  setup,
}
