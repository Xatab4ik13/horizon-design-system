-- Функция для авто-удаления неоплаченных заказов старше 24 часов.
-- Клиент вызывает её через RPC перед показом кабинета, и она же безопасна для повторных вызовов.
CREATE OR REPLACE FUNCTION public.expire_unpaid_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH d AS (
    DELETE FROM public.orders
    WHERE status = 'pending_payment'
      AND created_at < now() - interval '24 hours'
    RETURNING id
  )
  SELECT count(*) INTO deleted_count FROM d;
  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_unpaid_orders() TO authenticated, anon, service_role;

-- Попытка включить pg_cron и повесить ежечасную задачу (работает не на всех self-hosted;
-- если расширений нет — блок молча пропускается, и остаётся lazy-очистка через RPC).
DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron unavailable, skipping schedule';
    RETURN;
  END;

  PERFORM cron.unschedule(jobid)
  FROM cron.job WHERE jobname = 'expire-unpaid-orders';

  PERFORM cron.schedule(
    'expire-unpaid-orders',
    '15 * * * *',
    $cron$ SELECT public.expire_unpaid_orders(); $cron$
  );
END $$;