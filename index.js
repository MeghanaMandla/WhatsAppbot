import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Customize how your bot sounds — edit this or set BOT_PERSONALITY in your .env
const SYSTEM_PROMPT =
  process.env.BOT_PERSONALITY ||
  "You are a friendly, helpful assistant replying to WhatsApp messages on behalf of the phone's owner. Keep replies short (1-3 sentences), warm, and casual — like a real text message, not an essay. If someone asks something you genuinely can't help with, say so honestly.";

// Set REPLY_IN_GROUPS=true in .env if you also want the bot to reply inside group chats
const REPLY_IN_GROUPS = process.env.REPLY_IN_GROUPS === 'true';

async function getAIReply(userMessage) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });
    return response.content[0]?.text?.trim() || "Sorry, couldn't think of a reply!";
  } catch (err) {
    console.error('Anthropic API error:', err);
    return null;
  }
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_session');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\nScan this QR code with WhatsApp > Linked Devices:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(
        'Connection closed.',
        shouldReconnect ? 'Reconnecting...' : 'Logged out — delete the auth_session folder and rescan the QR code.'
      );
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('✅ Connected to WhatsApp! Your bot is now live.');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const chatId = msg.key.remoteJid;
      const isGroup = chatId.endsWith('@g.us');
      if (isGroup && !REPLY_IN_GROUPS) continue;

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        '';

      if (!text) continue; // skip non-text messages (images, voice notes, stickers, etc.)

      console.log(`📩 Message from ${chatId}: ${text}`);

      const reply = await getAIReply(text);
      if (reply) {
        await sock.sendMessage(chatId, { text: reply });
        console.log(`📤 Replied: ${reply}`);
      }
    }
  });
}

startBot().catch((err) => console.error('Failed to start bot:', err));
