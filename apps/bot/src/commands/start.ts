import type { Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { supabase } from '../lib/supabase.js';

const MINI_APP_URL = process.env.MINI_APP_URL ?? 'https://split-bill.vercel.app';

export async function handleStart(ctx: Context) {
  const user = ctx.from;
  if (!user || ctx.chat?.type !== 'private') return;

  // Регистрируем пользователя
  await supabase.rpc('upsert_telegram_user', {
    p_telegram_id: user.id,
    p_username:    user.username ?? null,
    p_first_name:  user.first_name,
    p_last_name:   user.last_name ?? null,
  });

  // Если пришли по deep link из группы: /start g-1001234567
  const startParam = ctx.match as string | undefined;
  if (startParam?.startsWith('g')) {
    const url = `${MINI_APP_URL}?startapp=${startParam}`;
    const keyboard = new InlineKeyboard().webApp('💸 Открыть Split Bill', url);
    await ctx.reply(
      '💸 Нажмите кнопку чтобы открыть Split Bill для вашей группы:',
      { reply_markup: keyboard },
    );
    return;
  }

  // Обычный /start без параметра
  const keyboard = new InlineKeyboard().webApp('💸 Открыть Split Bill', MINI_APP_URL);
  await ctx.reply(
    `Привет, ${user.first_name}! 👋\n\n` +
    'Split Bill помогает делить счета в группах.\n\n' +
    '📌 Как начать:\n' +
    '1. Добавь меня в групповой чат\n' +
    '2. Нажми кнопку в группе — откроется личка с кнопкой ниже\n' +
    '3. Создавай счета и отслеживай кто сколько должен',
    { reply_markup: keyboard },
  );
}
