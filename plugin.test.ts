import test from "node:test"
import assert from "node:assert/strict"

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
