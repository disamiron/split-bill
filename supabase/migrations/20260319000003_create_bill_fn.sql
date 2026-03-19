-- ============================================================
-- create_bill() — атомарная операция:
--   1. Создаёт запись в bills
--   2. Вычисляет доли
--   3. Вставляет bill_participants
-- Вызывается с клиента через rpc('create_bill', {...})
-- ============================================================

create type participant_input as (
  user_id uuid,
  share   numeric  -- используется только при split_type = 'custom'
);

create or replace function public.create_bill(
  p_group_id          uuid,
  p_title             text,
  p_total_amount      numeric,
  p_currency          text,
  p_split_type        split_type,
  p_receipt_image_url text,
  p_participant_ids   uuid[]          -- для equal split
)
returns public.bills language plpgsql security definer as $$
declare
  v_bill       public.bills;
  v_share      numeric;
  v_user_id    uuid;
begin
  -- Проверяем, что вызывающий состоит в группе
  if not public.is_group_member(p_group_id) then
    raise exception 'Access denied: not a group member';
  end if;

  -- Создаём счёт
  insert into public.bills (
    group_id, title, total_amount, currency,
    paid_by, split_type, receipt_image_url
  )
  values (
    p_group_id, p_title, p_total_amount, p_currency,
    public.current_user_id(), p_split_type, p_receipt_image_url
  )
  returning * into v_bill;

  -- Вставляем участников
  if p_split_type = 'equal' then
    v_share := round(p_total_amount / array_length(p_participant_ids, 1), 2);
    foreach v_user_id in array p_participant_ids loop
      insert into public.bill_participants (bill_id, user_id, share)
      values (v_bill.id, v_user_id, v_share);
    end loop;
  end if;

  return v_bill;
end;
$$;
