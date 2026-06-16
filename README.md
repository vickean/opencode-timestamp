# opencode-timestamp

An OpenCode plugin that prefixes every user and assistant message with an ISO 8601 timestamp, stripped before messages reach the LLM.

## Install

Add to your `opencode.json`:

```json
"plugin": ["opencode-timestamp@git+https://github.com/vickean/opencode-timstamp.git"]
```

## What it does

Each message gets a timestamp on its own line:

```
(2026-06-16T14:30:00)
How do I implement this feature?
```

Timestamps are stripped from all text parts before they reach the LLM, so the model never sees them.

## How it works

Three hooks:

- **`chat.message`** — Prepends `(ISO timestamp)\n` to user message text
- **`experimental.text.complete`** — Prepends `(ISO timestamp)\n` to assistant responses
- **`experimental.chat.messages.transform`** — Strips timestamp lines before messages reach the LLM

## Format

`(YYYY-MM-DDThh:mm:ss)` in the system's local timezone.
