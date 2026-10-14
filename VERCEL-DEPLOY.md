# MANUKA-MD on Vercel + AWS EC2

## Important distinction

Vercel hosts the **public website** in the repository's root `index.html`. The persistent WhatsApp connection (Baileys) **must run on an always-on Node.js host** such as your existing AWS EC2 instance. Do not deploy `src/index.js` as a serverless function expecting a continuous connection.

## Deploy the website

1. Sign in to [Vercel](https://vercel.com) and select **Add New → Project**.
2. Import **Manuwa122/MANUKA-MD** from GitHub.
3. Select **Other** framework. Keep the repository root as the root directory.
4. No build command is needed; the static `index.html` is the site.
5. Deploy and open the resulting Vercel URL.

A deploy page does **not** start the bot, connect WhatsApp, or provide any free permanent hosting for the Baileys worker.

## Run bot on AWS

Use `/home/ubuntu/MANUKA-MD` as the worker directory. Preserve the private `.env`, `auth/`, and `data/` files. Run the tests before PM2 restart:

```bash
cd ~/MANUKA-MD
npm ci
npm test
npm run check
pm2 restart MANUKA-MD --update-env
pm2 save
```

Never upload `.env`, `auth/`, browser cookies, SSH private keys or personal session credentials to GitHub/Vercel.

## Media and movie content

Use `.movie <title>` to find catalog entries and official links (regional availability varies). Use `.file <direct public HTTPS URL>` for files you have permission to download. Do not expect unrestricted downloads from streaming services or DRM-protected sources.

## Railway: user-owned bot hosting

The [self-service deploy guide](/deploy.html) includes Railway. On Railway: create a new project, deploy from your own GitHub copy of MANUKA-MD, set **Start Command** to `npm start`, and add a persistent volume mounted at `/data`. Set service Variables:

```dotenv
AUTH_DIR=/data/auth
SETTINGS_FILE=/data/settings.json
FEATURES_FILE=/data/features.json
AI_PROVIDER=groq
GROQ_MODEL=openai/gpt-oss-20b
```

Set `GROQ_API_KEY` privately in Railway Variables. Do not commit credentials. Ensure the runtime can write to the volume and that Node.js is compatible. The bot requires an uninterrupted worker; usage incurs hosting/storage costs. A deployment's logs may show the WhatsApp QR for linking via the user's phone. It is **not** a QR rendered by the Vercel site and may require viewing Railway logs while the session is fresh. The existing repository uses QR by default; website pairing-code support requires a separate authenticated per-user backend and is not yet available. Configure FFmpeg/Python if voice or media features are needed.

Important: Do not connect the same WhatsApp linked session to both EC2 and Railway at once. The self-service wizard does not provision Railway projects by itself.

## QR and phone pairing on each user's own Railway service

QR mode (default): leave `PAIRING_PHONE` unset. During first startup, the private Railway service logs show the QR for WhatsApp → Linked devices → Link a device. Keep the logs private.

Phone pairing mode (optional): set `PAIRING_PHONE` as the user's own number in international digits-only format (e.g. `947XXXXXXXX`) in Railway service Variables. With a new empty authentication volume, the bot calls Baileys `requestPairingCode` and prints `PRIVATE WHATSAPP PAIRING CODE` to the private service logs. Enter it through WhatsApp's **Link with phone number** flow. Only the WhatsApp account holder should perform linking. The bot does not issue codes from the Vercel website.

The bot worker must have writable persistent storage mounted at `/data`, with `AUTH_DIR=/data/auth` and `SETTINGS_FILE=/data/settings.json`. Each user deploys to their own Railway project: never share auth directories between users or connect one session simultaneously on multiple hosts. Pairing codes expire, are sensitive credentials, and must not be sent in chats or stored in publicly accessible logs.

**One-click template publication:** Railway's actual [Deploy on Railway](https://docs.railway.com/templates/publish-and-share) button needs a published Railway template ID. Until a template is created and published in the maintainer's Railway workspace, the wizard links to Railway's new-project flow and cannot provision bot deployments automatically.
