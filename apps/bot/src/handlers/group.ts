import type { Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { supabase } from '../lib/supabase.js';

const BOT_USERNAME = process.env.BOT_USERNAME ?? 'split_billy_bot';
const APP_SHORT_NAME = process.env.APP_SHORT_NAME ?? 'app';

function miniAppKeyboard(chatId: number) {
  return new InlineKeyboard().url(
    '💸 Открыть Split Bill',
    `https://t.me/${BOT_USERNAME}/${APP_SHORT_NAME}?startapp=g${chatId}`,
  );
}

// Бот добавлен в группу
export async function handleBotAdded(ctx: Context) {
  const chat = ctx.chat;
  if (!chat || chat.type === 'private') return;

  // Создаём или обновляем группу в БД
  const { error: groupErr } = await supabase
    .from('groups')
    .upsert({ telegram_chat_id: chat.id, title: chat.title ?? 'Группа' }, { onConflict: 'telegram_chat_id' });

  if (groupErr) {
    console.error('Failed to upsert group:', groupErr.message);
    return;
  }

  // Регистрируем пользователя, который добавил бота
  const addedBy = ctx.from;
  if (addedBy && !addedBy.is_bot) {
    const { data: group } = await supabase
      .from('groups')
      .select('id')
      .eq('telegram_chat_id', chat.id)
      .single();

    if (group) {
      const { data: user } = await supabase.rpc('upsert_telegram_user', {
        p_telegram_id: addedBy.id,
        p_username:    addedBy.username ?? null,
        p_first_name:  addedBy.first_name,
        p_last_name:   addedBy.last_name ?? null,
      });

      if (user) {
        await supabase
          .from('group_members')
          .upsert({ group_id: group.id, user_id: user.id }, { onConflict: 'group_id,user_id' });
      }
    }
  }

  // Приветственное сообщение с инструкцией
  await ctx.reply(
    '💸 Split Bill подключён!\n\n' +
    'Как это работает:\n' +
    '1. Каждый участник открывает приложение (кнопка ниже)\n' +
    '2. Кто-то создаёт счёт и выбирает участников\n' +
    '3. Все видят свою долю и отмечают оплату\n\n' +
    '👉 Чтобы начать — нажмите кнопку и откройте приложение.',
    { reply_markup: miniAppKeyboard(chat.id) },
  );

  // Рекомендация дать права админа (отдельным сообщением)
  setTimeout(async () => {
    try {
      await ctx.reply(
        '💡 Совет: дайте боту права админа — тогда я смогу автоматически ' +
        'отслеживать кто вошёл и вышел из группы.\n\n' +
        'Без прав админа всё тоже работает — просто каждому нужно будет ' +
        'открыть приложение самостоятельно.',
      );
    } catch (err) {
      console.error('Failed to send admin hint:', err);
    }
  }, 3000);
}

// Новый участник вступил в группу — регистрируем и приветствуем
export async function handleNewMember(ctx: Context) {
  const chat = ctx.chat;
  const newMembers = ctx.message?.new_chat_members;
  if (!chat || !newMembers) return;

  // Находим группу в БД
  const { data: group } = await supabase
    .from('groups')
    .select('id')
    .eq('telegram_chat_id', chat.id)
    .single();

  if (!group) return;

  const registeredNames: string[] = [];

  for (const member of newMembers) {
    if (member.is_bot) continue;

    // Upsert пользователя
    const { data: user, error: userErr } = await supabase.rpc('upsert_telegram_user', {
      p_telegram_id: member.id,
      p_username:    member.username ?? null,
      p_first_name:  member.first_name,
      p_last_name:   member.last_name ?? null,
    });

    if (userErr || !user) {
      console.error('Failed to upsert user:', userErr?.message);
      continue;
    }

    // Добавляем в группу
    await supabase
      .from('group_members')
      .upsert({ group_id: group.id, user_id: user.id }, { onConflict: 'group_id,user_id' });

    registeredNames.push(member.first_name);
  }

  // Приветствуем новых участников — им нужно знать про приложение
  if (registeredNames.length === 1) {
    await ctx.reply(
      `👋 ${registeredNames[0]}, добро пожаловать!\n` +
      'Открой приложение, чтобы участвовать в разделении счетов:',
      { reply_markup: miniAppKeyboard(chat.id) },
    );
  } else if (registeredNames.length > 1) {
    await ctx.reply(
      `👋 ${registeredNames.join(', ')} — добро пожаловать!\n` +
      'Откройте приложение, чтобы участвовать в разделении счетов:',
      { reply_markup: miniAppKeyboard(chat.id) },
    );
  }
}

// Участник покинул группу
export async function handleMemberLeft(ctx: Context) {
  const chat = ctx.chat;
  const leftMember = ctx.message?.left_chat_member;
  if (!chat || !leftMember) return;

  // Если удалён сам бот — ничего не делаем с данными.
  // Группа и участники остаются в БД, при повторном добавлении всё подхватится.
  if (leftMember.id === ctx.me.id) return;

  // Пропускаем других ботов
  if (leftMember.is_bot) return;

  const { data: group } = await supabase
    .from('groups')
    .select('id')
    .eq('telegram_chat_id', chat.id)
    .single();

  if (!group) return;

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('telegram_id', leftMember.id)
    .single();

  if (!user) return;

  // Удаляем из group_members, но НЕ из users и НЕ из bill_participants.
  // Долги остаются — это финансовые данные.
  await supabase
    .from('group_members')
    .delete()
    .eq('group_id', group.id)
    .eq('user_id', user.id);
}
