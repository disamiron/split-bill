import type { Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { supabase } from '../lib/supabase.js';

const MINI_APP_URL = process.env.MINI_APP_URL ?? 'https://split-bill.vercel.app';

export async function handleStart(ctx: Context) {
  const user = ctx.from;
  if (!user) return;

  // Регистрируем пользователя при первом /start
  await supabase.rpc('upsert_telegram_user', {
    p_telegram_id: user.id,
    p_username:    user.username ?? null,
    p_first_name:  user.first_name,
    p_last_name:   user.last_name ?? null,
  });

  const isPrivate = ctx.chat?.type === 'private';

  if (isPrivate) {
    const keyboard = new InlineKeyboard().webApp('💸 Открыть Split Bill', MINI_APP_URL);
    await ctx.reply(
      `Привет, ${user.first_name}! 👋\n\n` +
      'Split Bill помогает делить счета в группах.\n\n' +
      '📌 Как начать:\n' +
      '1. Добавь меня в групповой чат\n' +
      '2. Открой приложение кнопкой ниже или через меню в группе\n' +
      '3. Создавай счета и отслеживай кто сколько должен',
      { reply_markup: keyboard },
    );
  } else {
    const keyboard = new InlineKeyboard().webApp('💸 Открыть Split Bill', MINI_APP_URL);
    await ctx.reply('Нажми кнопку, чтобы открыть Split Bill:', { reply_markup: keyboard });
  }
}
