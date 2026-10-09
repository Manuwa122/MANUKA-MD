# MANUKA-MD v4.0 — upgrade notes
Existing v3 capabilities preserved: AI auto-reply per chat (.autoreply on/off), voice (.voice, .aivoice, .autovoice), direct files (.file), TikTok/YouTube audio/video, channel and chat owner commands, group admin commands, bookmarks/tasks/notes/expense tracker, stickers and polls.
New: cloud Groq AI provider as alternative to Ollama; clearer cloud API errors; updated menu/status; .health; excluded runtime data and local backups from Git.
On AWS EC2 t3.micro use AI_PROVIDER=groq; GROQ_MODEL=openai/gpt-oss-20b. Never commit GROQ_API_KEY, auth/, data/, or .env.
Install optional voice dependencies: python3 -m venv .venv && .venv/bin/pip install -r requirements-voice.txt ; set PYTHON_PATH to the absolute .venv/bin/python path in .env.
For downloadable video: install yt-dlp and ffmpeg separately. Do not use external links you do not trust.
Staged deployment: stop bot only after backup and passing npm test/check; replace code without overwriting .env/auth/data.
Security: .autoreply is opt-in per private chat. Do not enable public commands unless needed. Baileys is unofficial and may lose sessions / be restricted by WhatsApp.
