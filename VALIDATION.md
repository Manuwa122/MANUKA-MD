# v3.0 validation

- Node dependencies installed successfully with npm ci --ignore-scripts.
- 24 automated tests passed (14 existing + 10 new).
- npm run check: every src/*.js passed syntax checks.
- Python TTS helper passed syntax validation. Offline voice smoke used a stub speech provider with real Python + FFmpeg and verified an Ogg/Opus WhatsApp voice-note payload; it did not contact Google.
- Existing Baileys 6.7.24 newsletter and chat API signatures checked against installed type definitions.
- Tests cover owner permission guards, current-chat modifications, channel API arguments/rejections, voice command routing and text fallback, persisted/migrated autovoice settings, personal data isolation/export/clear, bounded streamed downloads, private redirect refusal, file delivery and temporary-file cleanup.
- Live WhatsApp login, channel operations, TikTok downloads, Ollama and Google speech requests were not exercised. These need the user's connected account and local dependencies/internet. No auth/session data bundled.
- Voice output requires optional Python gTTS plus FFmpeg. Voice does not transcribe incoming audio.
- Direct file URLs must be public HTTPS links served by IPv4 hosts, not login or sharing pages. Default 50MB, hard configurable cap 100MB. Existing video downloads remain 20MB/5min.

Sources consulted:
- https://github.com/WhiskeySockets/Baileys
- https://github.com/yt-dlp/yt-dlp
- https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md
- https://gtts.readthedocs.io/en/v2.5.1/module.html
