export function duration(seconds) {
  const n = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${Math.floor(n / 3600)}h ${Math.floor(n % 3600 / 60)}m ${n % 60}s`;
}

export function menuText(mode = 'self') {
  const p = process.env.PREFIX || '.';
  const name = process.env.BOT_NAME || 'MANUKA-MD';
  return `╭━━━〔 ✦ ${name} ✦ 〕━━━╮
┃  💚  MORE THAN A BOT • YOUR DIGITAL FRIEND
┃  🟢  ONLINE  •  V4.2  •  ${mode.toUpperCase()}
┃  👑  ${process.env.OWNER_NAME || 'Manuka Chamath'}
╰━━━━━━━━━━━━━━━━━━━━━━━╯

╭───〔 🤖 AI & VOICE 〕
│ ◈ ${p}ai <question>
│ ◈ ${p}aivoice <question>
│ ◈ ${p}voice si <text>
│ ◈ ${p}translate / ${p}study <text>
│ ◈ ${p}resetai
╰─────────────────────

╭───〔 🎶 MUSIC PLAYER 〕
│ ◈ ${p}song <title or singer>
│ ◈ ${p}musicfile <authorized audio HTTPS URL>
╰─ Jamendo downloads • Apple • MusicBrainz ─

╭───〔 🎬 MOVIE ZONE 〕
│ ◈ ${p}movie Avatar  •  ${p}film Avatar
│ ◈ ${p}moviefile <authorized video HTTPS URL>
│ ◈ ${p}film <authorized direct HTTPS file URL>
│ ◈ ${p}movies <film name>
╰─ Verified legal full-film links when found ─

╭───〔 📥 DOWNLOAD STUDIO 〕
│ ◈ ${p}tiktok <URL>
│ ◈ ${p}video <URL>  •  ${p}audio <URL>
│ ◈ ${p}file <direct HTTPS URL>
│ ◈ ${p}document  (reply to a file)
╰─ Website restrictions/size limits apply ─

╭───〔 🎨 CREATOR TOOLS 〕
│ ◈ ${p}sticker meme/love/funny  •  ${p}stickers\n│ ◈ ${p}sticker (reply to image/video)
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
│ ◈ ${p}grouplist (owner)  •  ${p}groupstats
│ ◈ ${p}groupcount / ${p}groupadmins
│ ◈ ${p}exportrequest (tap ✅/❌ to consent)
│ ◈ ${p}exportconsent on/off
│ ◈ ${p}groupexport (owner, opted-in members only)
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
│ ◈ Robot voice + original background tune
│ ◈ ${p}poster  — neon photo banner
│ ◈ ${p}jingle  — original welcome music
│ ◈ ${p}status  •  ${p}health
│ ◈ ${p}delegate add/remove <number>  •  ${p}delegate list
│ ◈ ${p}settings  •  ${p}owner
╰─────────────────────

🎧 Menu includes a short original audio intro.
✦ Powered by ${name}
🌐 https://manuka-md.vercel.app
_Use only content you may access or download._`;
}
