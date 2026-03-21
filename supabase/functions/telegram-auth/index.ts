import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { create, getNumericDate } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

// Edge Function: POST /functions/v1/telegram-auth
// Body: { initData: string }  — строка из Telegram.WebApp.initData
// Returns: { token: string }  — Supabase-совместимый JWT

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const JWT_SECRET = Deno.env.get('APP_JWT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Верифицирует подпись initData согласно документации Telegram
async function verifyTelegramInitData(initData: string): Promise<Record<string, string> | null> {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  params.delete('hash');

  // Сортируем параметры и строим data-check-string
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  // secret_key = HMAC-SHA256("WebAppData", bot_token)
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const secretKey = await crypto.subtle.sign('HMAC', keyMaterial, encoder.encode(BOT_TOKEN));

  // expected_hash = HMAC-SHA256(secret_key, data_check_string)
  const verifyKey = await crypto.subtle.importKey(
    'raw', secretKey,
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const expectedHashBuffer = await crypto.subtle.sign('HMAC', verifyKey, encoder.encode(dataCheckString));
  const expectedHash = Array.from(new Uint8Array(expectedHashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (expectedHash !== hash) return null;

  // Проверяем что initData не старше 1 часа
  const authDate = parseInt(params.get('auth_date') ?? '0', 10);
  if (Date.now() / 1000 - authDate > 3600) return null;

  return Object.fromEntries(params.entries());
}

// Уведомляет группу о регистрации нового участника в мини-аппе
async function notifyGroupAboutRegistration(
  telegramChatId: number,
  groupId: string,
  firstName: string,
  supabase: ReturnType<typeof createClient>,
) {
  try {
    // Считаем зарегистрированных участников
    const { count: registeredCount } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);

    // Получаем общее число участников группы через Telegram Bot API
    const countRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getChatMemberCount?chat_id=${telegramChatId}`,
    );
    const countData = await countRes.json() as { ok: boolean; result?: number };
    // Вычитаем бота из общего числа
    const totalMembers = countData.ok && countData.result ? countData.result - 1 : null;

    const registered = registeredCount ?? 0;

    let text: string;
    if (totalMembers && registered >= totalMembers) {
      text = `✅ ${firstName} в Split Bill! Все ${registered} участников зарегистрированы — можно создавать счёт!`;
    } else if (totalMembers) {
      text = `✅ ${firstName} в Split Bill! Зарегистрированы ${registered} из ${totalMembers} участников.`;
    } else {
      text = `✅ ${firstName} зарегистрирован(а) в Split Bill!`;
    }

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: telegramChatId, text }),
    });
  } catch (err) {
    // Не блокируем авторизацию из-за ошибки уведомления
    console.error('Failed to notify group about registration:', err);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { initData, telegramChatId } = await req.json() as { initData: string; telegramChatId?: number };
    if (!initData) return new Response(JSON.stringify({ error: 'initData required' }), { status: 400 });

    // 1. Верифицируем подпись Telegram
    const params = await verifyTelegramInitData(initData);
    if (!params) {
      return new Response(JSON.stringify({ error: 'Invalid initData' }), { status: 401 });
    }

    // 2. Парсим данные пользователя
    const tgUser = JSON.parse(params.user ?? '{}') as {
      id: number; username?: string; first_name: string; last_name?: string; photo_url?: string;
    };
    if (!tgUser.id) return new Response(JSON.stringify({ error: 'No user in initData' }), { status: 400 });

    // 3. Upsert пользователя в БД
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: user, error: userErr } = await supabase.rpc('upsert_telegram_user', {
      p_telegram_id: tgUser.id,
      p_username:    tgUser.username ?? null,
      p_first_name:  tgUser.first_name,
      p_last_name:   tgUser.last_name ?? null,
      p_avatar_url:  tgUser.photo_url ?? null,
    });
    if (userErr) throw userErr;

    // 4. Определяем chatId из верифицированного start_param (надёжный источник)
    //    или из переданного telegramChatId (клиентский fallback)
    const startParam = params.start_param;
    const chatIdFromParam = startParam?.startsWith('g')
      ? parseInt(startParam.slice(1), 10)
      : null;
    const effectiveChatId = chatIdFromParam ?? telegramChatId ?? null;

    // Добавляем пользователя в group_members
    let groupId: string | null = null;
    if (effectiveChatId) {
      const { data: group } = await supabase
        .from('groups')
        .select('id')
        .eq('telegram_chat_id', effectiveChatId)
        .single();

      if (group) {
        groupId = group.id;

        // Проверяем, новый ли это участник
        const { data: existing } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', group.id)
          .eq('user_id', user.id)
          .maybeSingle();

        await supabase
          .from('group_members')
          .upsert(
            { group_id: group.id, user_id: user.id },
            { onConflict: 'group_id,user_id' },
          );

        // Уведомляем группу о новой регистрации
        if (!existing) {
          await notifyGroupAboutRegistration(
            effectiveChatId,
            group.id,
            tgUser.first_name,
            supabase,
          );
        }
      }
    }

    // 5. Генерируем JWT с telegram_id в claims (для RLS)
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const token = await create(
      { alg: 'HS256', typ: 'JWT' },
      {
        sub:         user.id,           // UUID пользователя в БД
        role:        'authenticated',
        telegram_id: tgUser.id,         // используется в RLS функциях
        exp:         getNumericDate(60 * 60 * 24), // 24 часа
      },
      key,
    );

    return new Response(JSON.stringify({ token, user, telegramChatId: effectiveChatId }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
