export function duration(seconds) {
  const n = Math.floor(seconds);
  return `${Math.floor(n / 3600)}h ${Math.floor(n % 3600 / 60)}m ${n % 60}s`;
}

export function menuText(mode = 'self') {
  const p = process.env.PREFIX || '.';
  const name = process.env.BOT_NAME || 'MANUKA-MD';
  return `╭── ✦ ${name} ✦ ──╮
   YOUR SMART WHATSAPP ASSISTANT
╰──────────────────╯
🟢 Online • v4.0.0 • ${mode.toUpperCase()}
👑 ${process.env.OWNER_NAME || 'Manuka Chamath'}

╭─ 🤖 AI ASSISTANT
│ ${p}ai <question>
│ ${p}resetai — clear your AI history
╰─ Sinhala • Singlish • English

╭─ ✨ CREATIVE & STUDY LAB
│ ${p}explain / ${p}study <topic>
│ ${p}rewrite / ${p}translate <text>
│ ${p}summarize <text> — or reply to text
│ ${p}ideas / ${p}caption <subject>
╰─ AI tools • Groq or Ollama

╭─ 🔐 YOUR PERSONAL SPACE (PRIVATE CHAT)
│ ${p}note add <text> • ${p}note list
│ ${p}task add <text> • ${p}task done <number>
│ ${p}expense add 350 lunch • ${p}expense list
│ ${p}mydata — counts & clear command
╰─ Notes/tasks/expenses: del <number>

╭─ 🎯 PLAY & CREATE
│ ${p}quiz • ${p}answer 1 / 2 / 3 (private)
│ ${p}choose tea | coffee
│ ${p}poll Question | Yes | No
│ ${p}style <text>
╰─ Offline tools • No AI needed

╭─ 🎨 STICKERS
│ ${p}sticker / ${p}s
╰─ Reply to an image or video ≤10s

╭─ 📥 DOWNLOADS
│ ${p}video <URL>
│ ${p}audio <URL>
│ ${p}tiktok / ${p}tt <TikTok URL>
│ ${p}file / ${p}download <direct HTTPS URL>
│ ${p}document [filename] — reply to media/file
╰─ Videos ≤5 min/20MB • Direct files ≤50MB default

╭─ 🎙️ VOICE STUDIO
│ ${p}voice si / en / ta <text>
│ ${p}aivoice <question>
╰─ Google TTS • Python/gTTS/FFmpeg required

╭─ 📌 PERSONAL TOOLBOX (PRIVATE CHAT)
│ ${p}bookmark add name <URL>
│ ${p}snippet add name <reply text>
│ list / get name / del name
│ ${p}exportdata — your personal JSON
╰─ Separate storage for each user

╭─ 📰 CHANNEL CONTROL (OWNER)
│ ${p}channel create Name | Description
│ ${p}channel info / follow / unfollow <ID>
│ ${p}channel mute / unmute <ID>
│ ${p}channel name / desc / post <ID> <text>
╰─ ID: 123456@newsletter • WhatsApp permissions apply

╭─ 💬 CHAT CONTROL (OWNER)
│ ${p}chat mute 8h / unmute / pin / unpin
│ ${p}chat archive / unarchive / read / unread
│ ${p}autovoice on / off — current private chat
╰─ Linked account only • Current chat

╭─ 👥 GROUP ADMIN
│ ${p}group open / close
│ ${p}subject <name> • ${p}desc <text>
│ ${p}kick • ${p}promote • ${p}demote
│ ${p}welcome on / off
╰─ Sender + bot must be admins

╭─ 👑 OWNER CONTROLS
│ ${p}mode self / public
│ ${p}autoreply on / off — current private chat
│ ${p}settings
╰─ Commands from linked account only

${p}ping • ${p}status • ${p}health • ${p}owner • ${p}help
✦ Powered by ${name}`;
}
