-- ============================================================
-- Обновляем create_bill() — поддержка custom split
-- Добавляем параметр p_participant_shares jsonb[] для произвольных долей
-- Формат: [{"user_id": "uuid", "share": 123.45}, ...]
-- Если split_type = 'equal' — используем p_participant_ids (как раньше)
-- Если split_type = 'custom' — используем p_participant_shares
-- ============================================================

create or replace function public.create_bill(
  p_group_id          uuid,
  p_title             text,
  p_total_amount      numeric,
  p_currency          text,
  p_split_type        split_type,
  p_receipt_image_url text,
  p_participant_ids   uuid[]        default null,  -- для equal split
  p_participant_shares jsonb         default null   -- для custom split: [{"user_id":"...","share":100}, ...]
)
returns public.bills language plpgsql security definer as $$
declare
  v_bill       public.bills;
  v_share      numeric;
  v_user_id    uuid;
  v_item       jsonb;
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
  elsif p_split_type = 'custom' then
    for v_item in select * from jsonb_array_elements(p_participant_shares)
    loop
      insert into public.bill_participants (bill_id, user_id, share)
      values (
        v_bill.id,
        (v_item->>'user_id')::uuid,
        (v_item->>'share')::numeric
      );
    end loop;
  end if;

  return v_bill;
end;
$$;
