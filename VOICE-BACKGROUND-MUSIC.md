# MANUKA-MD Voice Background Music

This feature plays a quiet music bed underneath synthesized voice messages. The bot rotates tracks (alphabetical filenames, round robin) for `.voice`, `.aivoice`, automatic spoken replies, `.ping`, `.alive`, and the spoken `.menu` welcome. It falls back to the built-in original jingle when no tracks are configured or accessible. It does **not** fetch, rip, or redistribute tracks from YouTube links.

## 1. Install locally held audio files

Place tracks you own or have permission to reuse in a private directory on the server, for example:

```sh
mkdir -p ~/MANUKA-MD/data/voice-music
# Copy audio files from your PC using SCP or SFTP (WinSCP); do not upload private music to GitHub.
ls -lah ~/MANUKA-MD/data/voice-music
```

Supported local extensions: `.mp3`, `.wav`, `.m4a`, `.ogg`, `.opus`, `.flac`. Audio files must be at most 30 MB each; keep files short (15–40 seconds) for fast voice responses. FFmpeg is required. Use a quiet instrumental stem or music ducked below speech for clear voice messages.

Your three suggested references:
- https://youtu.be/b3Stbu-DZOs
- https://youtu.be/R5kIaK_mo4M
- https://youtu.be/z2mDkSDiHuM

Only add these as actual files if you have the right to download, adapt, and use them in bot replies. Paste URLs by themselves does not install background audio.

## 2. Set production .env (never commit it)

```env
VOICE_MUSIC_DIR=/home/ubuntu/MANUKA-MD/data/voice-music
COMMAND_VOICE=true
MENU_JINGLE=true
```

## 3. Deploy

In `~/MANUKA-MD-LATEST`, run `git pull --ff-only origin main && npm test && npm run check`. Then stop PM2, rsync with `.env`, `auth/`, `data/`, `node_modules/`, `.venv/` and `.git/` excluded; test in `~/MANUKA-MD` and restart PM2. Do not delete WhatsApp auth data.

## 4. Test

```text
.ping
.alive
.menu
.voice si ආයුබෝවන්
.aivoice hi
```

If audio fails, check `ffmpeg -version`, Python/gTTS setup, permissions, and redacted PM2 logs. Song tracks are rotated per bot process, not permanently stored across restarts.
