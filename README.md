# WhatsApp AI Auto-Reply Bot

This bot connects to your personal WhatsApp account and automatically replies to
incoming messages using Claude (Anthropic's AI).

**How it works:** It logs into WhatsApp the same way "WhatsApp Web" does — by
scanning a QR code with your phone. No business account or approval needed.

> ⚠️ **Important:** This uses an unofficial connection method (not Meta's official
> Business API). It's fine for personal use, but avoid using it to send bulk/spam
> messages — WhatsApp can flag or ban accounts that look like spam bots.

---

## Step 1 — Get a Claude API key

1. Go to https://console.anthropic.com/ and sign up / log in.
2. Go to **API Keys** and create a new key.
3. Copy it — you'll paste it into Railway in Step 3. Keep it secret, never share it publicly.

(Note: this requires adding billing/credits to your Anthropic console account — it's
pay-as-you-go and very cheap for a personal chat volume, usually a few cents per
day of normal use.)

## Step 2 — Push this code to GitHub

1. Go to https://github.com/new and create a new **private** repository
   (e.g. `whatsapp-ai-bot`).
2. Upload all the files in this folder to that repo (drag-and-drop on the GitHub
   website works fine, or use `git` if you're comfortable with it).
   - Do **not** upload a `.env` file if you create one locally — only `.env.example`
     should go to GitHub. Your real key stays in Railway, not in your code.

## Step 3 — Deploy it on Railway (free hosting that runs 24/7)

1. Go to https://railway.app/ and sign up using your GitHub account.
2. Click **New Project → Deploy from GitHub repo**, and pick the repo you just made.
3. Once it's created, go to your project's **Variables** tab and add:
   - `ANTHROPIC_API_KEY` = (the key you copied in Step 1)
4. Railway will automatically detect this is a Node.js app and deploy it.
5. Go to the **Deployments** tab → open the latest deployment → click **View Logs**.

## Step 4 — Link your WhatsApp

1. In the Railway logs, you'll see a QR code appear as text (this can take a minute
   on first deploy).
2. On your phone: open **WhatsApp → Settings → Linked Devices → Link a Device**.
3. Scan the QR code shown in the Railway logs.
4. Once linked, the logs will show `✅ Connected to WhatsApp! Your bot is now live.`
5. Send a test message to your number from a different phone — you should get an
   automatic AI reply within a few seconds.

---

## Customizing your bot

Open `index.js` and edit the `SYSTEM_PROMPT` text near the top (or set a
`BOT_PERSONALITY` variable in Railway) to change how your bot talks — e.g. more
formal, mention you're currently busy/unavailable, answer only certain topics, etc.

By default the bot does **not** reply in group chats. To enable that, add a
variable in Railway: `REPLY_IN_GROUPS` = `true`.

## Running it on your own computer instead (optional, for testing)

If you want to test locally before deploying:

```bash
npm install
cp .env.example .env
# edit .env and paste in your real ANTHROPIC_API_KEY
npm start
```

A QR code will print directly in your terminal — scan it the same way as above.

## Known limitations

- **Session resets on redeploy:** Railway's free tier doesn't always keep the
  `auth_session` folder between deploys, which means you may need to rescan the QR
  code after Railway restarts the app. For a fully persistent setup, you'd add a
  Railway "Volume" mounted at `/auth_session` — ask me if you want help setting
  that up.
- **One device link at a time:** if you scan the QR code again elsewhere, the old
  session disconnects.
- **Unofficial library:** WhatsApp could change something on their end that
  temporarily breaks the connection. The `@whiskeysockets/baileys` library is
  actively maintained, so updating the dependency usually fixes it.
