# MANUKA-MD v3.0 — New features + voice replies

## Windows — ඉක්මනින් පටන් ගන්න

1. ZIP එක **Extract All** කරන්න. ZIP එක ඇතුළත සිට run කරන්න එපා.
2. Extract කළ `MANUKA-MD` folder එකේ address bar එකේ `cmd` type කර Enter කරන්න.
3. පරණ bot එක නවත්වන්න. පරණ `.env`, `auth` සහ `data` folders backup කරලා මේ folder එකට copy කරන්න. `auth` එක share කරන්න එපා. Existing `.env` එකට පහළ voice/file variables එකතු කරන්න.
4. අලුත් setup එකක් නම් මේ commands යවන්න:

```bat
copy .env.example .env
npm.cmd ci
python -m pip install -r requirements-voice.txt
npm.cmd start
```

Existing `.env` තියෙනවා නම් `copy .env.example .env` **යවන්න එපා** — ඒක settings overwrite කරයි. `npm.cmd` PowerShell execution-policy error එක මඟහරිනවා. Python install කර නැත්නම් Python 3 install කර PATH එකට add කරන්න; `python --version` බලන්න. Python නොමැතිව voice හැර අනෙක් bot features run කරන්න පුළුවන්.

FFmpeg සහ yt-dlp install කර තිබිය යුතුයි:

```bat
ffmpeg -version
yt-dlp --version
```

AI features සඳහා Ollama running විය යුතුයි. QR පෙන්වූ විට WhatsApp → Linked devices → Link a device. Setup complete නම් `START-BOT.cmd` double-click කළ හැක.

## New commands

| Feature | Example |
| --- | --- |
| Direct file download | `.file https://example.com/report.pdf` / `.download URL` |
| TikTok video | `.tiktok https://www.tiktok.com/@user/video/123` / `.tt URL` |
| Send media as a downloadable document | Image/video/audio/file එකකට reply කර `.document` හෝ `.document photo.jpg` |
| Sinhala voice | `.voice si ආයුබෝවන්!` |
| English voice | `.voice en Hello Manuka!` |
| Tamil voice | `.voice ta வணக்கம்` |
| Read quoted text aloud | Text message එකකට reply කර `.voice` |
| AI text + voice answer | `.aivoice පරිගණක ජාලයක් කියන්නේ මොකක්ද?` |
| Enable AI auto voice | Current private chat එකේ linked account එකෙන් `.autoreply on`, ඉන්පසු `.autovoice on` |
| Disable auto voice | `.autovoice off` — text auto-replies පවතිනවා; `.autoreply off` ඒවාත් නවත්වයි |
| Save bookmark | `.bookmark add portfolio https://example.com` |
| Saved reply template | `.snippet add thanks Thank you for contacting me!` |
| Retrieve saved item | `.bookmark get portfolio` / `.snippet get thanks` |
| Manage saved items | `.bookmark list` / `.snippet list` / `.snippet del thanks` |
| Export personal data | `.exportdata` → own notes/tasks/expenses/bookmarks/snippets JSON |
| Clear personal data | `.mydata clear CONFIRM` → saved personal entries ද මකාදමයි |

`MODE=self` default නිසා linked account commands පමණයි. අනෙක් usersට download/voice/personal commands භාවිත කළ හැකි වීමට owner `.mode public` යවන්න. Channel/chat/autovoice settings linked account එකෙන් පමණක් ක්‍රියාත්මකයි; public usersගේ WhatsApp accounts මේ bot එකට link වෙන්නේ නැහැ.

## WhatsApp channel management — owner

```text
.channel create MANUKA News | My latest updates
.channel info https://whatsapp.com/channel/YOUR_INVITE_CODE
.channel info 123456@newsletter
.channel follow 123456@newsletter
.channel unfollow 123456@newsletter
.channel mute 123456@newsletter
.channel unmute 123456@newsletter
.channel name 123456@newsletter MANUKA Updates
.channel desc 123456@newsletter Latest news and tutorials
.channel post 123456@newsletter Welcome everyone!
```

Invite link එකෙන් `.channel info` ලබාගෙන returned `ID` එක අනෙක් commands වලට භාවිත කරන්න. උදාහරණ ID එක සැබෑ channel ID එකකින් replace කරන්න. Name/description/post සඳහා linked account එක ඒ channel එකේ owner/admin විය යුතුයි. WhatsApp විසින් reject කළ update එකක් success ලෙස පෙන්වන්නේ නැහැ. Channel commands private chat හෝ Saved messages තුළ යවන්න; channel එක තුළ commands කියවන්නේ නැහැ.

## Current chat management — owner

Manage කළ යුතු chat එක තුළ linked account එකෙන් යවන්න:

```text
.chat mute 1h
.chat mute 8h
.chat mute 24h
.chat mute 7d
.chat unmute
.chat pin
.chat unpin
.chat archive
.chat unarchive
.chat read
.chat unread
```

These actions linked WhatsApp account එකේ current chat සඳහා පමණයි. Chat history delete කරන්නේ නැහැ. Archive/unread acknowledgment යවන්නේ update එකට කලින්; final chat state WhatsApp තුළ බලන්න. WhatsApp app settings හේතුවෙන් අලුත් message එකකින් chat එක unarchive විය හැක.

## Voice setup + data

Optional Python dependency: `python -m pip install -r requirements-voice.txt`.
`.env` එකට එකතු කරන්න:

```dotenv
MAX_FILE_MB=50
VOICE_LANG=si
PYTHON_PATH=python
```

Linux සඳහා `PYTHON_PATH=python3`. `VOICE_LANG=si/en/ta` AI voice language එක සකස් කරයි. Sinhala සඳහා Sinhala අකුරු භාවිත කරන්න; Singlish pronunciation වෙනස් විය හැක.

Voice text Google Translate TTS වෙත යවයි (gTTS); internet අවශ්‍යයි. Voice disabled by default; `.voice`/`.aivoice` හෝ enabled `.autovoice` පමණක් speech service භාවිත කරයි. AI requests configured Ollama server වෙත යවයි. This is generated speech, not voice cloning. Incoming voice notes transcribe කිරීම මේ release එකේ නැහැ. Voice error එකක් ආවොත් AI text reply එක පවතිනවා. Voice text ≤1500 characters; auto voice output ඉක්මවුවහොත් truncate කරයි.

Personal entries bot computer එකේ `data/features.json` තුළ plain JSON ලෙස save වෙනවා. Private chats සඳහා එක් sender/chat key එකකට වෙනම entries ඇත; files encrypted database එකක නෙවෙයි. Export එකට auth sessions/settings/අනෙක් usersගේ data ඇතුළත් නොවේ. Snippet retrieve කරන විට එය current chat එකට යවයි; automatic canned replies නොවේ.

## Downloads: what works

Direct file: PDF, ZIP, image, audio, APK ඇතුළු file types public **HTTPS direct download URL** එකකින් document ලෙස ලබාගන්න පුළුවන්. Default ≤50MB; `MAX_FILE_MB` 1–100 අතර වෙනස් කළ හැක. 45-second download timeout, ≤5 redirects, public IPv4 hosts only. Each redirect checked; internal/private/reserved IPs blocked. Failed downloads cleaned up. Webpages, Google Drive sharing pages, sign-in pages, private/password protected files are not direct links and do not work with `.file`.

TikTok/YouTube/Instagram/Facebook video commands yt-dlp භාවිත කරයි; video ≤5 minutes / ≤20MB. Region restrictions, private content, removed videos සහ website changes නිසා සමහර links fail විය හැක. TikTok login සහ watermark removal guarantee කරන්නේ නැහැ. yt-dlp update කර retry කරන්න. `vt.tiktok.com`/`vm.tiktok.com` short links පිළිගනී.

## Validation

`npm test` සහ `npm run check` run කරන්න. Automated tests mock WhatsApp, speech and network responses. Live WhatsApp/channel/TikTok/Google speech service validation කර නොමැත. Details: `VALIDATION.md`.

---

## Earlier setup and features (v2 guide)

# MANUKA-MD 2.0 — Creative & Personal Edition

අලුත් commands 17ක් ඇතුළත් කර ඇත. වෙනත් bots වල නැති බව තහවුරු නොකළ අතර මේ edition එක Manuka සඳහා customize කර ඇත.

## ඉක්මනින් පටන් ගන්න

1. ZIP extract කර `MANUKA-MD` folder එකේ terminal open කරන්න.
2. Node.js 22+ සමඟ `npm ci` run කරන්න.
3. `.env.example` copy කර `.env` ලෙස save කර අවශ්‍ය settings දාන්න.
4. `npm start` run කර WhatsApp Linked devices හරහා QR scan කරන්න.
5. `.menu` යවන්න. Default self mode එකේ linked account එකෙන් commands යවන්න.

පරණ bot එක upgrade කරනවා නම් එය නවතා `auth/`, `data/`, `.env` backup කර අලුත් folder එකට copy කරන්න. එකම session එකෙන් bot instances දෙකක් run නොකරන්න. Source ZIP එකේ session/credentials ඇතුළත් කර නැත.

## අලුත් commands

| Command | භාවිතය |
| --- | --- |
| `.explain TCP/IP` | සරල Sinhala explanation + English terms |
| `.study OSI layers` | කෙටි study pack + practice questions |
| `.rewrite <text>` | Professional text draft |
| `.translate to Sinhala: Hello` | Translation |
| `.summarize <text>` | Summary; text message එකකට reply කරත් පුළුවන් |
| `.ideas SaveBite promotion` | Practical creative ideas |
| `.caption sunset` | Social captions |
| `.note add My project idea` | පුද්ගලික note එකක් save කිරීම |
| `.note list` / `.note del 1` | Notes බැලීම / මකා දැමීම |
| `.task add Finish portfolio` | Task එකක් save කිරීම |
| `.task done 1` / `.task list` / `.task del 1` | Tasks manage කිරීම |
| `.expense add 350 lunch` | LKR expense එකක් save කිරීම |
| `.expense list` / `.expense del 1` | Expenses සහ එකතුව බැලීම |
| `.mydata` | Saved counts සහ clear instructions |
| `.mydata clear CONFIRM` | ඔබේ notes/tasks/expenses/quiz මකා දැමීම |
| `.quiz` / `.answer 2` | Offline ICT quiz (questions 6ක්) |
| `.choose tea | coffee` | Random decision picker |
| `.poll Lunch? | Rice | Pizza` | Single-choice native WhatsApp poll |
| `.style MANUKA MD` | Decorative text styles |

Notes/tasks/expenses/quiz private chats වල පමණයි. එක chat/user key එකකට entries වෙන වෙනම save කරනවා. Linked account එක වෙනස් private chats තුළ save කරන entriesත් වෙනම තබනවා. Data `data/features.json` file එකේ plain JSON ලෙස bot computer එකේ තබනවා; encrypted vault එකක් නොවේ. එක් වර්ගයකට entries 100ක් දක්වා. Expense total එක saved entries සියල්ලේ එකතුවයි; bank connection හෝ monthly accounting නොවේ. `.mydata clear CONFIRM` AI conversation memory clear නොකරයි.

AI tools සඳහා Ollama සහ model එක running වෙන්න ඕනේ. ඒවා text drafts සකසයි; answers verify කරන්න. වෙනත් AI tool එකකට memory වෙනමයි. Offline features සඳහා API keys හෝ අලුත් npm dependencies අවශ්‍ය නැත. Sinhala අක්ෂර `.style` තුළ සුරකින අතර styled Latin glyphs device එක අනුව වෙනස් ලෙස පෙනිය හැක.

Native polls WhatsApp client support මත රඳා පවතී. Bot computer එක offline නම් commands ක්‍රියා නොකරයි. මෙම update එක live WhatsApp session එකක් සමඟ පරීක්ෂා කර නැත.

---

# MANUKA-MD — Windows setup

Prabath-MD upload එකේ project structure / feature concept reference කරලා අලුතින් ලියූ readable implementation එකක්. Original executable code, custom Baileys fork, remote session service හෝ database token system ඇතුළත් කරලා නැහැ. Official WhiskeySockets Baileys 6.7.24 legacy release pin කරලා ඇත. මෙය v1.1 personal laptop bot package එකකි.

## 1. අවශ්‍ය software

- Node.js 22 හෝ 24 LTS: https://nodejs.org/
- Git for Windows (dependency installation සඳහා): https://git-scm.com/downloads/win
- Ollama Windows: https://ollama.com/download/windows
- yt-dlp Windows executable: https://github.com/yt-dlp/yt-dlp/releases/latest
- FFmpeg: https://github.com/yt-dlp/FFmpeg-Builds/releases

yt-dlp.exe, ffmpeg.exe සහ ffprobe.exe `C:\tools` folder එකට දාලා Windows Environment Variables > Path එකට `C:\tools` add කරන්න. Terminal නැවත open කරන්න.

```powershell
node --version
git --version
yt-dlp --version
ffmpeg -version
ollama --version
```

## 2. Extract සහ install

ZIP extract කර `MANUKA-MD` folder එක `C:\MANUKA-MD` ලෙස තබන්න. PowerShell:

```powershell
cd C:\MANUKA-MD
Copy-Item .env.example .env
npm install
npm test
npm start
```

PowerShell npm.ps1 execution policy error නම් `npm.cmd install` සහ `npm.cmd start` භාවිත කරන්න. මේ project එක වෙනුවෙන් system execution policy වෙනස් කරන්න අවශ්‍ය නැහැ.

## 3. QR link කිරීම

Phone එකේ WhatsApp > Settings / ⋮ > Linked devices > Link a device. Terminal එකේ QR එක scan කරන්න. QR expire වුණොත් ඊළඟ QR එක scan කරන්න. Connected කියලා පෙන්වූ පසු linked account එකෙන් වෙනත් chat එකකට `.menu` යවන්න.

Default `MODE=self`: linked account එකෙන් යවන commands පමණක් ක්‍රියා කරයි. අනිත් අයටත් භාවිත කිරීමට `.env` තුළ `MODE=public` කර bot restart කරන්න. එවිට incoming command messages සඳහා replies යවයි; AI auto-reply සඳහා පහත explicit chat setting එක භාවිත කරන්න.

Session එක `auth` folder එකේ save වෙනවා. `.env` සහ `auth` share / GitHub upload කරන්න එපා. Logout වුණොත් bot stop කර auth folder එක remove කර QR නැවත scan කරන්න. Session credentials අනිත් කෙනෙක්ට දුන්නොත් linked account access ලබාගත හැක.

## 4. AI සකස් කිරීම

Ollama install කර:

```powershell
ollama pull llama3.2
```

Ollama background app එක running තිබිය යුතුයි. `.ai What is gravity?` උත්සාහ කරන්න. Model එකේ Sinhala/Singlish quality සහ speed laptop hardware අනුව වෙනස් වෙනවා. AI එක එක් user/chat සඳහා අවසාන messages 8ක් memory එකේ තබයි. මිනිත්තු 30ක් භාවිත නොකළ විට හෝ restart කළ විට ඉවත් වේ. `.resetai` මගින් clear කරන්න. Better multilingual Ollama model එකක් install කළොත් `.env` හි `OLLAMA_MODEL` වෙනස් කරන්න. Local model එක සඳහා cloud API key අවශ්‍ය නැහැ.

## 5. Commands

| Command | භාවිතය |
|---|---|
| `.menu`, `.help` | Command list |
| `.ping` | Connection reply |
| `.ai <question>` | AI answer |
| `.sticker`, `.s` | Image හෝ තත්පර 10ට අඩු video එකකට reply කරන්න |
| `.video <HTTPS URL>` | MP4 download |
| `.audio <HTTPS URL>` | MP3 download |
| `.group open` / `.group close` | Group messaging settings |
| `.subject <name>` | Group name |
| `.desc <text>` | Group description |
| `.kick` / `.promote` / `.demote` | Member message එකකට reply කරන්න |

Group commands සඳහා command යවන user සහ bot දෙන්නාම admins විය යුතුයි. WhatsApp member identifier mapping වෙනස් වුවහොත් permission check එක command deny කළ හැක. Owner / bot removal blocked.

Downloader: YouTube, Instagram, TikTok, Facebook supported URL hosts; public videos only, site availability අනුව extraction fail විය හැක. Playlists / live streams disabled. Duration ≤ 5 min, final file ≤ 20MB. Audio conversion සහ animated sticker සඳහා FFmpeg අවශ්‍යයි. Download permission තිබෙන content භාවිත කරන්න. Website changes නිසා downloader නිතර update කිරීම අවශ්‍ය විය හැක: `yt-dlp -U`.

## 6. දිගටම run කිරීම

Laptop එක on, internet connected, terminal running සහ sleep disabled තිබිය යුතුයි. Stop: Ctrl+C. Resume: `npm start`; saved session තිබේ නම් නැවත scan අවශ්‍ය නැහැ. මෙය official WhatsApp Business API නොවන WhatsApp Web client එකක්; account restrictions ඇති විය හැක.

## 7. Troubleshooting

- `ERR_MODULE_NOT_FOUND`: project folder එකේ `npm install` run කරන්න.
- QR connected නොවේ: phone internet / Linked devices බලන්න; වෙනත් bot process එකක් same auth folder භාවිත නොකරන්න.
- `.ai` fails: Ollama running ද, model pulled ද බලන්න.
- Sticker video fails: FFmpeg installed ද සහ PATH එකේ ද බලන්න.
- Download fails: yt-dlp update, URL public ද, size/duration limits බලන්න.
- Group command denied: bot + sender admin ද බලන්න.
- Commands ignore වෙනවා: default self mode, 3-second sender cooldown සහ one active command per chat තිබේ. Max concurrent commands 3.

## Validation

Parser, URL filtering, admin checks සඳහා automated tests ඇතුළත්ය. WhatsApp QR/session, actual AI model, downloader සහ Windows FFmpeg end-to-end tests සඳහා ඔයාගේ laptop එකේ software සහ account linking අවශ්‍යයි. Package installation status සඳහා VALIDATION.md බලන්න.

## Project files

`src/index.js`: QR/auth/reconnect/message routing. `src/commands.js`: command handlers. `src/utils.js`: parser / permission helpers. New command එකක් `handleCommand` තුළ add කළ හැක. Dependencies update කළොත් tests සහ QR flow නැවත verify කරන්න.


## v1.1 Professional menu සහ controls

Menu එක categories සහ local banner image සමග යවයි. `.env` තුළ `MENU_IMAGE=./assets/menu.jpg` යොදන්න. Image නොමැති නම් text menu එක යවයි. Banner එක වෙනස් කිරීමට ඒ file එක replace කරන්න. `OWNER_NAME` මගින් owner නම වෙනස් කළ හැක.

| Command | භාවිතය |
|---|---|
| `.status` | Uptime, mode, model සහ processed/error counts |
| `.owner` | Creator නම |
| `.resetai` | ඔයාගේ මේ chat එකේ AI history clear කරයි |
| `.mode public` / `.mode self` | Linked account එකෙන් පමණක්; restart අවශ්‍ය නැහැ |
| `.settings` | Linked account එකෙන් saved settings බලන්න |
| `.autoreply on` / `.autoreply off` | Linked account එකෙන් තෝරාගත් private chat එකේ යවන්න |
| `.welcome on` / `.welcome off` | Group එකේ; sender සහ bot admins විය යුතුයි |

Auto-reply enable කරන chat එකේ incoming සාමාන්‍ය text/caption messages සඳහා Ollama replies යවයි. Groups, status, newsletters සහ ඔයාම යවන messages සඳහා auto-reply නැහැ. Reply එක `MANUKA-MD AI` ලෙස label කරයි. Commands සඳහා mode=self/public බලපායි; enabled private-chat auto-reply mode=self තුළත් ක්‍රියා කරයි. Disable: ඒ chat එකේ `.autoreply off` යවන්න. AI unavailable නම් auto-reply එක skip කර terminal error පෙන්වයි.

Settings `data/settings.json` තුළ save වේ; saved mode එක `.env` MODE එකට වඩා ප්‍රමුඛ වේ. Existing installation upgrade කරන විට bot stop කර `.env`, `auth` සහ `data` folders රැකගෙන `src`, `assets`, package files update කරන්න. අනෙක් files overwrite කිරීමට පෙර backup එකක් තබන්න. නව `.env.example` හි අමතර settings ඔයාගේ `.env` එකට එක් කරන්න. `npm ci` සහ `npm start` run කරන්න.

AI history disk එකේ save කරන්නේ නැහැ. Cooldown තත්පර 3යි; chat එකකට එක request සහ මුළු requests 3ක limit ඇත. Busy වෙලාවේ messages skip විය හැක; queued delivery system එකක් නැහැ. Buttons/pairing-code UI මෙම package එකේ නැහැ; QR linking සහ image + text menu භාවිත කරයි.

## Ollama command හඳුනා නොගන්නා විට

`ollama : The term ... is not recognized` නම් Ollama Windows installer එක install කර app එක open කරන්න. PowerShell සියල්ල close කර අලුත් terminal එකක `ollama --version` බලන්න. තවම නැත්නම්:

```powershell
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" --version
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" pull llama3.2
```

මේ path එකෙත් executable නැත්නම් installation location එක බලන්න හෝ installer නැවත run කරන්න. Model එක pull කර Ollama app එක running තබා `.ai hello` පරීක්ෂා කරන්න.
