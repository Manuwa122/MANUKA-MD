# MANUKA-MD Advanced AI setup

This update improves Sinhala / Singlish / Tamil / English prompts and keeps configurable recent context for each chat. It does not provide internet search, external app access, or a new AI model.

Edit the **private production** `.env` file (never commit keys):

```env
AI_PROVIDER=groq
GROQ_MODEL=openai/gpt-oss-20b
AI_MAX_TOKENS=1000
AI_MEMORY_TURNS=6
AI_TEMPERATURE=0.5
```

- `AI_MAX_TOKENS`: 128–4096; default 1000. Provider/model quotas still apply.
- `AI_MEMORY_TURNS`: 1–12, default 6; in-memory conversation turns, expiring after 30 minutes of inactivity. Not persisted across restarts.
- `AI_TEMPERATURE`: 0–1.5, default 0.5; smaller = more consistent.
- `.ai question`: chat with AI.
- `.resetai`: clear your conversation context.

Deploy: `git pull --ff-only origin main` in staging; run `npm test && npm run check`; sync to production preserving `.env`, `auth/` and `data/`; test again and restart PM2. Never share the Groq key or auth folder.
