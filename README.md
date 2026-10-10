<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:020617,45:1d4ed8,100:06b6d4&height=235&section=header&text=MANUKA-MD&fontSize=64&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=THE%20NEXT%20GEN%20WHATSAPP%20ASSISTANT&descSize=19&descAlignY=61" alt="MANUKA-MD — The next generation WhatsApp assistant" width="100%" />

### ⚡ Automate smarter. Chat better. Create more.

**Your all-in-one WhatsApp companion — AI conversations, multilingual tools, voice, downloads and powerful admin controls.**

<br/>

[![Node](https://img.shields.io/badge/NODE.JS-22%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/JAVASCRIPT-ESM-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![WhatsApp](https://img.shields.io/badge/BAILEYS-WHATSAPP-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://github.com/WhiskeySockets/Baileys)
[![AI](https://img.shields.io/badge/AI-GROQ%20%2B%20OLLAMA-A855F7?style=for-the-badge&logo=probot&logoColor=white)](#-configuration)

<br/>

[![Stars](https://img.shields.io/github/stars/Manuwa122/MANUKA-MD?style=flat-square&logo=github&label=Stars)](https://github.com/Manuwa122/MANUKA-MD/stargazers)
[![Forks](https://img.shields.io/github/forks/Manuwa122/MANUKA-MD?style=flat-square&logo=github&label=Forks)](https://github.com/Manuwa122/MANUKA-MD/forks)
[![Issues](https://img.shields.io/github/issues/Manuwa122/MANUKA-MD?style=flat-square&logo=github&label=Issues)](https://github.com/Manuwa122/MANUKA-MD/issues)
[![Last commit](https://img.shields.io/github/last-commit/Manuwa122/MANUKA-MD?style=flat-square&logo=github&label=Updated)](https://github.com/Manuwa122/MANUKA-MD/commits/main)

**[🚀 Get started](#-quick-start) · [✨ Explore features](#-features) · [⌨️ Try commands](#-command-showcase) · [☁️ Deploy](#%EF%B8%8F-deployment)**

<br/>

<a href="https://github.com/Manuwa122/MANUKA-MD/stargazers"><img src="https://img.shields.io/badge/⭐_STAR_THIS_REPO-Show_some_love-0ea5e9?style=for-the-badge" alt="Star MANUKA-MD" /></a>
<a href="https://github.com/Manuwa122/MANUKA-MD/fork"><img src="https://img.shields.io/badge/⑂_FORK-Start_building-334155?style=for-the-badge" alt="Fork MANUKA-MD" /></a>

</div>

---

## 🖥️ Bot preview

```text
╭─────────────────────────────────────────────╮
│           ✦ M A N U K A - M D ✦           │
│         YOUR SMART WHATSAPP ASSISTANT       │
├─────────────────────────────────────────────┤
│  🤖  AI ASSISTANT      .ai / .study         │
│  🎙️  VOICE STUDIO      .voice / .aivoice    │
│  📥  MEDIA TOOLS       .tiktok / .file      │
│  🎨  STICKER MAKER     .sticker             │
│  👥  GROUP MANAGER     .group / .welcome   │
│  🧠  PERSONAL SPACE    .note / .task       │
├─────────────────────────────────────────────┤
│         Type .menu in WhatsApp              │
╰─────────────────────────────────────────────╯
```

> **Built for real use:** Run on Windows, Linux or a cloud server. Pair your WhatsApp account with a QR code, choose your AI provider, and control who can use your commands.

## 💎 Meet MANUKA-MD

**MANUKA-MD** is a personal WhatsApp assistant with AI-powered messaging and practical everyday tools. It uses [Baileys](https://github.com/WhiskeySockets/Baileys) to connect through WhatsApp's linked-device flow, with QR pairing and configurable owner-only or public command access.

> 💡 **Highlights:** Chat in Sinhala, Singlish or English; automate selected private-chat replies; make stickers; manage groups; use voice features; and organize your personal notes and tasks.

## 🚀 Features

| Category | What you can do |
| :--- | :--- |
| 🤖 **AI Assistant** | Ask questions, translate, rewrite, summarize, study and brainstorm using Groq or Ollama |
| 🌏 **Multilingual** | Sinhala, Singlish and English AI conversations |
| 💬 **Smart Replies** | Enable AI auto-replies for selected private chats |
| 🎙️ **Voice Studio** | Turn text into speech, ask for AI voice responses and enable voice replies |
| 🎨 **Sticker Maker** | Convert images and short videos into WhatsApp stickers |
| 📥 **Media Downloads** | Download supported audio/video, TikTok links and direct HTTPS files with size limits |
| 👥 **Group Admin** | Open/close groups, update details, manage members and welcome new participants |
| 📰 **Channel Tools** | Channel actions such as info, follow, mute and posting, subject to WhatsApp permissions |
| 🗂️ **Personal Organizer** | Notes, tasks, expenses, bookmarks, snippets and JSON data export |
| 🎯 **Fun & Learning** | Quizzes, polls, random choices, text styles and study helpers |
| 🛡️ **Owner Controls** | Self/public mode, health, status, settings and chat controls |

**Note:** Some commands depend on administrator rights, WhatsApp capabilities, external dependencies, API credentials or platform restrictions.

## 🧱 Technology stack

<div align="center">

| Core | AI | Media | Deployment |
| :---: | :---: | :---: | :---: |
| **Node.js + JavaScript** | **Groq / Ollama** | **FFmpeg + yt-dlp** | **Windows / Linux / AWS EC2** |
| Baileys linked-device connection | Cloud or local AI | Stickers, downloads & voice | Run locally or with a process manager |

</div>

## ⚡ Quick Start

### 1. Requirements

- **Node.js 22+** and npm
- A WhatsApp account with **Linked devices**
- **FFmpeg** for video stickers, downloads and voice features
- **yt-dlp** for supported media downloads
- **Python 3 + gTTS** for voice features
- Optional: a **Groq API key** or **Ollama** for AI features

### 2. Clone the repository

```bash
git clone https://github.com/Manuwa122/MANUKA-MD.git
cd MANUKA-MD
npm ci
```

### 3. Configure your environment

Copy the example file to a local `.env`:

```bash
cp .env.example .env
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead.

Make sure **each environment setting is on its own line**, then adjust values such as:

```dotenv
BOT_NAME=MANUKA-MD
OWNER_NAME=Manuka Chamath
PREFIX=.
MODE=self
AUTH_DIR=./auth

# Choose groq or ollama
AI_PROVIDER=groq
GROQ_API_KEY=your_key_here
GROQ_MODEL=openai/gpt-oss-20b

# For local Ollama instead:
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
```

Never commit real API keys or WhatsApp authentication/session files.

### 4. Start the bot

```bash
npm start
```

A QR code should appear in your terminal. On WhatsApp, go to **Linked devices → Link a device** and scan it.

Once connected, send **`.menu` inside WhatsApp**. Commands are WhatsApp messages, **not Linux terminal commands**.

### ✅ First-time connection checklist

- [ ] Node.js 22+ installed
- [ ] Dependencies installed with `npm ci`
- [ ] `.env` configured without exposing secrets
- [ ] QR successfully scanned from **WhatsApp → Linked devices**
- [ ] `.ping` or `.menu` works **inside a WhatsApp chat**

## 🧩 Command Showcase

The default prefix is `.`. Change it using `PREFIX` in your `.env`.

| Command | Purpose |
| :--- | :--- |
| `.menu` | Interactive command overview |
| `.ai Explain machine learning in Sinhala` | Ask the AI |
| `.study networking` | Study assistance |
| `.translate Hello` | Translation assistant |
| `.summarize <text>` | Summarize content |
| `.sticker` | Reply to an image or short video to make a sticker |
| `.tiktok <url>` | Download supported TikTok media |
| `.audio <url>` / `.video <url>` | Download supported media |
| `.file <https-url>` | Fetch a direct file |
| `.voice si ආයුබෝවන්` | Sinhala voice output |
| `.aivoice <question>` | AI answer with voice |
| `.note add Buy groceries` | Save a personal note |
| `.task add Finish project` | Add a task |
| `.expense add 350 lunch` | Track an expense |
| `.quiz` | Start a quiz |
| `.group close` | Admin-only group control |
| `.welcome on` | Enable group welcome messages |
| `.autoreply on` | Enable auto-reply in the current private chat (owner) |
| `.autovoice on` | Enable voice reply in the current private chat (owner) |
| `.mode public` / `.mode self` | Switch command-access mode (owner) |
| `.ping` / `.status` / `.health` | Check bot connectivity and runtime |

For all available commands, send **`.menu`** in WhatsApp.

## ⚙️ Configuration

| Setting | Description |
| :--- | :--- |
| `BOT_NAME` | Name displayed by the bot |
| `OWNER_NAME` | Owner display name |
| `PREFIX` | Command prefix; default `.` |
| `MODE` | `self` (linked account only) or `public` for commands |
| `AUTH_DIR` | Local WhatsApp session directory |
| `AI_PROVIDER` | `groq` or `ollama` |
| `GROQ_API_KEY` | Groq credentials if selected |
| `OLLAMA_URL` | Address of a running Ollama instance |
| `YTDLP_PATH` / `FFMPEG_PATH` | Paths to media utilities |
| `VOICE_LANG` | Default voice language |
| `PYTHON_PATH` | Python executable for voice support |
| `MAX_FILE_MB` | Direct file download limit; defaults to 50 MB |

**Security tip:** Start in `MODE=self`; enable public commands or chat auto-replies only when you understand who can interact with the bot.

## 🖥️ Deployment

MANUKA-MD can be run locally on Windows/Linux or on an always-on Linux server such as an **AWS EC2 instance**. Install Node.js and optional media/voice dependencies, protect your `.env` and auth state, then use a process supervisor if you want the bot to restart after a crash.

```bash
npm run check    # Source syntax checks
npm test         # Run tests
npm start        # Launch bot
```

Use a separate `AUTH_DIR` for each independent WhatsApp bot session. Do **not** point multiple active processes to the same authentication directory.

## 🔐 Privacy & Safety

- This is an **unofficial** project using Baileys; it is **not affiliated with, endorsed by or supported by WhatsApp or Meta**.
- Connecting or automating WhatsApp accounts can be subject to platform rules, feature changes and account restrictions.
- Keep `.env`, API keys and the `auth/` directory private. Never post pairing credentials or session backups.
- AI provider requests and optional online text-to-speech may send content to third-party services. Avoid sending sensitive information.
- Download only content you have permission to access and respect copyright and service terms.
- Apply least-privilege admin settings and use the bot responsibly; avoid spam or unsolicited bulk messaging.

## 🤝 Contributing

Ideas, bug reports and pull requests are welcome!

1. [Fork the repository](https://github.com/Manuwa122/MANUKA-MD/fork).
2. Create a feature branch.
3. Make and test your changes with `npm run check` and `npm test`.
4. Submit a pull request describing the improvement.

Found a problem or have a feature idea? [Open an issue](https://github.com/Manuwa122/MANUKA-MD/issues).

## ❓ Frequently asked questions

<details>
<summary><b>Why does .menu say “command not found” on my Ubuntu server?</b></summary>

`.menu` is a message you send **inside WhatsApp**, not a Linux shell command. Start the bot using `npm start`, pair via the QR code, then message `.menu` from the linked account.
</details>

<details>
<summary><b>Can I use multiple WhatsApp numbers?</b></summary>

Yes, run separate bot processes with distinct `AUTH_DIR` values and environment configurations. Never share the same auth directory between processes.
</details>

<details>
<summary><b>Does AI work without a cloud API key?</b></summary>

Ollama can run models locally if you have installed and started the server. Groq requires valid credentials. Voice and media features have their own optional dependencies.
</details>

<details>
<summary><b>Why doesn't a particular download or channel action work?</b></summary>

Website restrictions, file-size limits, changing WhatsApp support, permissions or missing utilities can block individual actions. Check the bot logs and update relevant tools when appropriate.
</details>

## 🌟 Support the project

If you enjoy using MANUKA-MD, consider **starring** ⭐ the repository or sharing it with other developers.

<div align="center">

### 👨‍💻 Designed & maintained by Manuka Chamath

[![GitHub Profile](https://img.shields.io/badge/GitHub-Manuwa122-181717?style=for-the-badge&logo=github)](https://github.com/Manuwa122)
[![Repository](https://img.shields.io/badge/Explore-MANUKA--MD-2563eb?style=for-the-badge&logo=github)](https://github.com/Manuwa122/MANUKA-MD)

**Made with 💙 using JavaScript, Node.js and Baileys.**

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f172a,50:2563eb,100:06b6d4&height=110&section=footer" alt="Footer" width="100%" />

</div>
