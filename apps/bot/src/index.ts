import { Bot } from 'grammy';
import { handleStart } from './commands/start.js';
import { handleBotAdded, handleNewMember, handleMemberLeft } from './handlers/group.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set');

const bot = new Bot(token);

// ── Commands ──────────────────────────────────────────────
bot.command('start', handleStart);

// ── Group lifecycle ───────────────────────────────────────

// Бот добавлен в группу
bot.on('message:new_chat_members', async (ctx) => {
  const botId = ctx.me.id;
  const isBotAdded = ctx.message.new_chat_members.some((m) => m.id === botId);

  if (isBotAdded) {
    await handleBotAdded(ctx);
  } else {
    await handleNewMember(ctx);
  }
});

// Участник покинул группу
bot.on('message:left_chat_member', handleMemberLeft);

// ── Error handling ────────────────────────────────────────
bot.catch((err) => {
  console.error('Bot error:', err.message);
});

// ── Start ─────────────────────────────────────────────────
bot.start({
  onStart: (info) => console.log(`Bot @${info.username} started`),
});
