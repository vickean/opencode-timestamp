# opencode-timestamp

An OpenCode plugin that prefixes messages with an ISO 8601 timestamp, stripped
before messages reach the LLM.

## Install

OpenCode 2 (`opencode.json`):

```jsonc
"plugins": ["opencode-timestamp@git+https://github.com/vickean/opencode-timestamp.git"]
```

OpenCode 1 (`opencode.json`):

```json
"plugin": ["opencode-timestamp@git+https://github.com/vickean/opencode-timestamp.git"]
```

## What it does

Each timestamped message looks like:

```
(2026-06-16T14:30:00)
How do I implement this feature?
```

Timestamps are stripped from all text parts before they reach the LLM, so the
model never sees them.

## Hooks

| Behavior | V1 | V2 |
| --- | --- | --- |
| Timestamp user messages | `chat.message` | `session.hook("prompt")` |
| Timestamp assistant messages | `experimental.text.complete` | — (no V2 equivalent) |
| Strip before the LLM | `experimental.chat.messages.transform` | `session.hook("context")` |

OpenCode 2 has no assistant-message-completion hook, so V2 timestamps **user**
messages only. V1 keeps the full behavior.

One package serves both: V1 uses the `server()` export (OpenCode >= 1.18.29),
V2 uses the `setup()` export.

## Format

`(YYYY-MM-DDThh:mm:ss)` in the system's local timezone.

## Test

```sh
node --test plugin.test.ts
```
