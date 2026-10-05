import test from "node:test"
import assert from "node:assert/strict"

import plugin from "./plugin.ts"
import {
  formatTimestamp,
  addTimestamp,
  stripTimestamps,
  TIMESTAMP_RE,
} from "./plugin.ts"

// Local-time date: June 16 2026, 14:30:00
const FIXED = new Date(2026, 5, 16, 14, 30, 0)
const TS = "(2026-06-16T14:30:00)"

test("formatTimestamp renders local time as (YYYY-MM-DDThh:mm:ss)", () => {
  assert.equal(formatTimestamp(FIXED), TS)
})

test("addTimestamp prepends a timestamp line", () => {
  assert.equal(addTimestamp("hello", FIXED), `${TS}\nhello`)
})

test("addTimestamp does not double-prefix an already timestamped message", () => {
  const once = addTimestamp("hello", FIXED)
  assert.equal(addTimestamp(once, FIXED), once)
})

test("stripTimestamps removes a leading timestamp line", () => {
  assert.equal(stripTimestamps(`${TS}\nhello`), "hello")
})

test("stripTimestamps removes repeated leading timestamps", () => {
  assert.equal(stripTimestamps(`${TS}\n${TS}\nhello`), "hello")
})

test("stripTimestamps leaves untimestamped text unchanged", () => {
  assert.equal(stripTimestamps("hello"), "hello")
})

test("TIMESTAMP_RE matches only at the start of the text", () => {
  assert.ok(TIMESTAMP_RE.test(`${TS}\nhi`))
  assert.ok(!TIMESTAMP_RE.test(`hi ${TS}\n`))
})

// --- V2 wiring (setup -> session hooks) ---

function captureHooks() {
  const hooks: Record<string, (event: any) => void> = {}
  const ctx = {
    session: {
      hook: async (name: string, cb: (event: any) => void) => {
        hooks[name] = cb
        return { dispose: async () => {} }
      },
    },
  }
  return { hooks, ctx }
}

test("V2 setup registers prompt and context hooks", async () => {
  const { hooks, ctx } = captureHooks()
  await plugin.setup(ctx as any)
  assert.equal(typeof hooks.prompt, "function")
  assert.equal(typeof hooks.context, "function")
})

test("V2 prompt hook prepends a timestamp to the user prompt", async () => {
  const { hooks, ctx } = captureHooks()
  await plugin.setup(ctx as any)
  const event = { prompt: { text: "hello" } }
  hooks.prompt(event)
  assert.match(event.prompt.text, /^\(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\)\nhello$/)
})

test("V2 context hook strips timestamps from content parts", async () => {
  const { hooks, ctx } = captureHooks()
  await plugin.setup(ctx as any)
  const event = { messages: [{ content: [{ type: "text", text: `${TS}\nhi` }] }] }
  hooks.context(event)
  assert.equal(event.messages[0].content[0].text, "hi")
})

test("V2 context hook also strips from parts-shaped messages", async () => {
  const { hooks, ctx } = captureHooks()
  await plugin.setup(ctx as any)
  const event = { messages: [{ parts: [{ type: "text", text: `${TS}\nhi` }] }] }
  hooks.context(event)
  assert.equal(event.messages[0].parts[0].text, "hi")
})

test("V2 setup ignores a V1-shaped context without throwing", async () => {
  await assert.doesNotReject(async () => {
    await (plugin as any).setup({})
    await (plugin as any).setup(undefined)
  })
})
