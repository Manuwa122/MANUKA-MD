# Owner-approved multi-user WhatsApp bots (experimental)

This adds multi-user support **inside one always-on MANUKA-MD host**. Each approved person receives an isolated child Node.js process, `auth/` session and settings. The main owner's WhatsApp account remains separate.

**Default OFF**. After reviewing resource usage and backups, set the following **only on the main bot host**, not in public templates:
```dotenv
MULTIUSER_ENABLED=true
MULTIUSER_MAX_BOTS=1
MULTIUSER_DIR=/home/ubuntu/MANUKA-MD/data/multiuser
```
On Railway, `MULTIUSER_DIR=/data/multiuser` should point to a writable persistent volume. Do not enable on both the existing AWS bot and a duplicate Railway process that use the same owner session.

## Commands

- Other user, via private WhatsApp chat to main owner bot: `.pair 947XXXXXXXX` (number MUST match their own sender phone and include country code, digits only). Not supported from LID-only identities, groups or channels.
- Main owner (only `fromMe` on main linked account): `.approve 947XXXXXXXX`, `.listbots`, `.stopbot 947XXXXXXXX`, `.startbot 947XXXXXXXX`, `.removebot 947XXXXXXXX`.
- Approval starts a separate child process with private state. A pairing code is sent to the requesting WhatsApp chat, not to public logs/websites. Only the account holder should use the code through WhatsApp Linked devices.
- On shutdown, extra bots stop. After main host restart, approved records are retained as `stopped`; owner restarts extra bots individually using `.startbot`. This prevents unexpected RAM load.
- `.stopbot` preserves child session. `.removebot` permanently deletes child session storage, after stopping the process.

## Security and operational limits

- Never share pairing codes, auth files, `.env` or API keys. No hosting provided by Vercel.
- Main bot's owner commands are not automatically delegated to other users; a child session's local WhatsApp account controls only its own bot.
- Default maximum **one additional active bot**; cap 2. A small EC2 t3.micro may run out of RAM even with one child; monitor `free -h`, PM2 logs and AWS costs.
- This uses unofficial Baileys/WhatsApp multi-device integration. Linking and reliability may change; account restrictions are possible.
- No automatic public pairing portal, no protection against user-initiated spam, no guarantee of 24/7 hosting or always-online visibility.
- A main-account pair request from an LID-mapped JID cannot be verified by phone here and is refused rather than guessing the sender's identity.
- This code is **unverified in production**. Run `npm test`, `npm run check`, and test on a separate account before enabling.

## Deployment

The existing main bot owner can use the new code only after deployment to their EC2 server. Do not alter the existing `auth/` directory and keep backups. The environment flag must be explicitly set after tests. User sessions require separate writable paths, particularly with cloud redeploys.
