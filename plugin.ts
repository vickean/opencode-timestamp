import type { Plugin } from "@opencode-ai/plugin"

function formatTimestamp(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0")
  const y = date.getFullYear()
  const M = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const h = pad(date.getHours())
  const m = pad(date.getMinutes())
  const s = pad(date.getSeconds())
  return `(${y}-${M}-${d}T${h}:${m}:${s})`
}

const TIMESTAMP_RE = /^\(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\)\n/

export default (async () => {
  return {
    "chat.message": async (_input, output) => {
      const ts = formatTimestamp(new Date())
      const firstText = output.parts.find(p => p.type === "text")
      if (firstText) {
        firstText.text = ts + "\n" + firstText.text
      }
    },

    "experimental.text.complete": async (_input, output) => {
      if (/^\(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\)\n/.test(output.text)) return
      const ts = formatTimestamp(new Date())
      output.text = ts + "\n" + output.text
    },

    "experimental.chat.messages.transform": async (_input, output) => {
      for (const msg of output.messages) {
        for (const part of msg.parts) {
          if (part.type === "text") {
            while (TIMESTAMP_RE.test(part.text)) {
              part.text = part.text.replace(TIMESTAMP_RE, "")
            }
          }
        }
      }
    },
  }
}) satisfies Plugin
