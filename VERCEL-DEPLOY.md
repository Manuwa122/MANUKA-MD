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
