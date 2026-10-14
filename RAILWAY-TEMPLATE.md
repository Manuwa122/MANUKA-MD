# MANUKA-MD Railway Template — Publishing Checklist

Template name: **MANUKA-MD WhatsApp Bot**

Description: **Deploy your own Sinhala-friendly WhatsApp automation assistant, with Groq AI chat, media tools, message reactions and optional QR or phone-number pairing. Requires your own Railway service, a persistent volume and private credentials.**

Template icon URL:
https://raw.githubusercontent.com/Manuwa122/MANUKA-MD/main/assets/manuka-md-icon.svg

## Service
- Repo: `https://github.com/Manuwa122/MANUKA-MD`, branch `main`
- Builder: Railpack
- Start: `npm start`
- Healthcheck: leave blank (there is no HTTP health endpoint)
- Cron: none
- Restart policy: on failure
- Persistent volume: mount at `/data`
- No public TCP proxy or HTTP domain is needed for a WhatsApp worker.

## Template variables
Preset values: `MODE=self`, `AI_PROVIDER=groq`, `GROQ_MODEL=openai/gpt-oss-20b`, `AUTH_DIR=/data/auth`, `SETTINGS_FILE=/data/settings.json`, `FEATURES_FILE=/data/features.json`.
- `GROQ_API_KEY`: required **user input**, empty default; never commit actual credentials.
- `PAIRING_PHONE`: **optional**, empty default. Omit entirely for QR. For pairing code, provide the WhatsApp owner's country code plus number, digits only.

## Before publishing
1. Set transparent service icon separately from the template-level icon; check Railway Template Guidelines.
2. Resolve Environment Variables guideline errors and avoid publishing example passwords, API keys or phone numbers as defaults.
3. Apply staged template changes.
4. Test on a paid/eligible Railway workspace using **a test WhatsApp account**, not the same session as your AWS bot. This has not been done yet.
5. Test first startup QR; separately test optional pairing code (never display codes on public websites).
6. Confirm that `/data/auth` persists across a redeployment.
7. Publish to marketplace only after successful tests and Railway policy checks. Obtain published template URL, then update the website's Railway deployment link.

## Limits
The public Vercel website is a guide, not a secure pairing server. Users deploy to their own Railway workspace and must check their own **private service logs**. An actual Vercel-site pairing interface requires authentication and protected per-user infrastructure. Railway plan costs may apply. The template is not yet verified or published.
