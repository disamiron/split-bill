import type { Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { supabase } from '../lib/supabase.js';

const BOT_USERNAME = process.env.BOT_USERNAME ?? 'split_billy_bot';

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

  // Deep link: открывает личку с ботом и передаёт chat_id как start_param
  const deepLink = `https://t.me/${BOT_USERNAME}?start=g${chat.id}`;
  const keyboard = new InlineKeyboard().url('💸 Открыть Split Bill', deepLink);

  await ctx.reply(
    '👋 Привет! Я помогу вашей группе делить счета.\n\n' +
    'Нажмите кнопку ниже чтобы открыть приложение:',
    { reply_markup: keyboard },
  );
}

// Новый участник вступил в группу — регистрируем его
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
  }
}

// Участник покинул группу
export async function handleMemberLeft(ctx: Context) {
  const chat = ctx.chat;
  const leftMember = ctx.message?.left_chat_member;
  if (!chat || !leftMember || leftMember.is_bot) return;

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

  await supabase
    .from('group_members')
    .delete()
    .eq('group_id', group.id)
    .eq('user_id', user.id);
}
