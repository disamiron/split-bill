import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { create, getNumericDate } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

// Edge Function: POST /functions/v1/dev-auth
// DEV ONLY — выдаёт JWT для тестового пользователя без проверки initData
// Body: { telegramId: number, telegramChatId?: number }

const JWT_SECRET = Deno.env.get('APP_JWT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const APP_ENV = Deno.env.get('APP_ENV') ?? 'production';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  // Блокируем в production
  if (APP_ENV === 'production') {
    return jsonResponse({ error: 'dev-auth disabled in production' }, 403);
  }

  try {
    const { telegramId, telegramChatId } = await req.json() as {
      telegramId: number;
      telegramChatId?: number;
    };

    if (!telegramId) {
      return jsonResponse({ error: 'telegramId required' }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Находим пользователя по telegram_id
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    if (userErr || !user) {
      return jsonResponse({ error: `User with telegram_id=${telegramId} not found` }, 404);
    }

    // Если передан chatId — добавляем в группу
    let effectiveChatId: number | null = telegramChatId ?? null;
    if (effectiveChatId) {
      const { data: group } = await supabase
        .from('groups')
        .select('id')
        .eq('telegram_chat_id', effectiveChatId)
        .single();

      if (group) {
        await supabase
          .from('group_members')
          .upsert({ group_id: group.id, user_id: user.id }, { onConflict: 'group_id,user_id' });
      }
    }

    // Генерируем JWT
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
        sub: user.id,
        role: 'authenticated',
        telegram_id: telegramId,
        exp: getNumericDate(60 * 60 * 24),
      },
      key,
    );

    return jsonResponse({ token, user, telegramChatId: effectiveChatId });
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
});
