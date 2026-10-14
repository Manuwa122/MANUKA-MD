export function duration(seconds) {
  const n = Math.floor(seconds);
  return `╭━━━〔 ✦ ${name} ✦ 〕━━━╮
┃  🤖  YOUR SMART WHATSAPP COMPANION
┃  🟢  ACTIVE  •  V4.1  •  ${mode.toUpperCase()}
┃  👑  ${process.env.OWNER_NAME || 'Manuka Chamath'}
╰━━━━━━━━━━━━━━━━━━━━━━━╯

╭───〔 🤖 AI & VOICE 〕
│ ◈ ${p}ai <question>
│ ◈ ${p}aivoice <question>
│ ◈ ${p}voice si <text>
│ ◈ ${p}translate / ${p}study <text>
│ ◈ ${p}resetai
╰─────────────────────

╭───〔 🎬 MOVIE ZONE 〕
│ ◈ ${p}movie Avatar  •  ${p}film Avatar
│ ◈ ${p}film <authorized direct HTTPS file URL>
│ ◈ ${p}movies <film name>
╰─ Official viewing links • legal files ─

╭───〔 📥 DOWNLOAD STUDIO 〕
│ ◈ ${p}tiktok <URL>
│ ◈ ${p}video <URL>  •  ${p}audio <URL>
│ ◈ ${p}file <direct HTTPS URL>
│ ◈ ${p}document  (reply to a file)
╰─ Website restrictions/size limits apply ─

╭───〔 🎨 CREATOR TOOLS 〕
│ ◈ ${p}sticker  •  ${p}style <text>
│ ◈ ${p}caption <topic>
│ ◈ ${p}ideas <topic>
│ ◈ ${p}poll Question | Yes | No
╰─────────────────────

╭───〔 💬 SMART AUTOMATION 〕
│ ◈ ${p}autoreact on/off
│ ◈ ${p}autostatus on/off
│ ◈ ${p}autoreply on/off
│ ◈ ${p}autovoice on/off
│ ◈ ${p}presence online/offline
╰─ Owner controls ──────

╭───〔 👥 GROUP & CHAT 〕
│ ◈ ${p}group open/close
│ ◈ ${p}welcome on/off
│ ◈ ${p}kick  •  ${p}promote
│ ◈ ${p}chat mute 8h / pin / archive
│ ◈ ${p}channel info <ID>
╰─────────────────────

╭───〔 🧰 PERSONAL & STUDY 〕
│ ◈ ${p}quiz  •  ${p}note list
│ ◈ ${p}task list  •  ${p}expense list
│ ◈ ${p}bookmark list
│ ◈ ${p}mydata
╰─────────────────────

╭───〔 📊 BOT CONTROL 〕
│ ◈ ${p}alive  •  ${p}ping
│ ◈ ${p}status  •  ${p}health
│ ◈ ${p}settings  •  ${p}owner
╰─────────────────────

✦ Powered by ${name}
🌐 https://manuka-md.vercel.app
_Use only content you may access or download._`;
}
