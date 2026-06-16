# OpenCode Timestamp Plugin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A local-file plugin that prefixes every user and assistant message with an ISO 8601 timestamp, stripped before messages reach the LLM.

**Architecture:** Single `plugin.ts` auto-discovered from `~/.config/opencode/plugins/timestamps/`. Three hooks: `chat.message` (prepend timestamp part to user messages), `experimental.text.complete` (prepend timestamp to assistant text), `experimental.chat.messages.transform` (regex-strip timestamps from text parts before sending to LLM).

**Tech Stack:** TypeScript, `@opencode-ai/plugin`, Bun runtime (OpenCode built-in).

---

## File Structure

| File | Responsibility |
|------|---------------|
| `~/.config/opencode/plugins/timestamps/plugin.ts` | Plugin entry — all three hooks, timestamp formatting, stripping regex |

No other files needed. No `opencode.json` changes — auto-discovered from the global plugins directory.

---

### Task 1: Create the timestamp plugin

**Files:**
- Create: `~/.config/opencode/plugins/timestamps/plugin.ts`

- [ ] **Step 1: Write the plugin source**

```typescript
import type { Plugin, Part } from "@opencode-ai/plugin"

function formatTimestamp(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0")
  const y = date.getFullYear()
  const M = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const h = pad(date.getHours())
  const m = pad(date.getMinutes())
  const s = pad(date.getSeconds())
  return `[${y}-${M}-${d}T${h}:${m}:${s}]`
}

const TIMESTAMP_RE = /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\]\s*/

export default (async (): ReturnType<Plugin> => {
  return {
    // Prepend a timestamp text part to every user message
    "chat.message": async (_input, output) => {
      const ts = formatTimestamp(new Date())
      output.parts.unshift({
        type: "text",
        text: ts + " ",
      } as Part)
    },

    // Prepend a timestamp to every assistant text completion
    "experimental.text.complete": async (_input, output) => {
      const ts = formatTimestamp(new Date())
      output.text = ts + " " + output.text
    },

    // Strip timestamps from all text parts before they reach the LLM
    "experimental.chat.messages.transform": async (_input, output) => {
      for (const msg of output.messages) {
        for (const part of msg.parts) {
          if (part.type === "text" && TIMESTAMP_RE.test(part.text)) {
            part.text = part.text.replace(TIMESTAMP_RE, "")
          }
        }
      }
    },
  }
}) satisfies Plugin
```

- [ ] **Step 2: Verify the file compiles with `tsc` (optional)**

Run: `bun x tsc --noEmit --strict --target ES2022 --moduleResolution bundler ~/.config/opencode/plugins/timestamps/plugin.ts`
Expected: No type errors. (May need `bun add -g typescript` or can skip — OpenCode runs the raw `.ts` via Bun.)

- [ ] **Step 3: Commit (if part of a git-tracked project)**

```bash
git add ~/.config/opencode/plugins/timestamps/plugin.ts
git commit -m "feat: add timestamp plugin for user and assistant messages"
```

---

## Self-Review

**1. Spec coverage:**
- User messages get timestamp: ✅ `chat.message` hook prepends a text part
- Assistant messages get timestamp: ✅ `experimental.text.complete` prepends a timestamp
- Timestamps stripped from LLM context: ✅ `experimental.chat.messages.transform` regex-strips
- Format ISO 8601, local timezone: ✅ `formatTimestamp` uses `Date` getters (local time)
- User + Assistant only, no tools: ✅ Only these two hooks used

**2. Placeholder scan:** All code is concrete, no TODOs or TBDs.

**3. Type consistency:** `formatTimestamp`, `TIMESTAMP_RE`, and the three hooks all use the same `[YYYY-MM-DDThh:mm:ss]` format. The `as Part` assertion matches the `Part` union type that OpenCode expects in `output.parts`.
