-- Ограничиваем execute только service_role (закрываем security-lint warning).
REVOKE EXECUTE ON FUNCTION public.expire_unpaid_orders() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_unpaid_orders() TO service_role;

-- Разрешаем создавать заказ с онлайн-оплатой в статусе pending_payment
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT
  WITH CHECK (
    length(TRIM(BOTH FROM customer_name)) BETWEEN 2 AND 100
    AND length(TRIM(BOTH FROM customer_phone)) BETWEEN 5 AND 30
    AND length(TRIM(BOTH FROM delivery_method)) > 0
    AND length(TRIM(BOTH FROM payment_method)) > 0
    AND total_amount >= 0
    AND jsonb_typeof(items) = 'array'
    AND jsonb_array_length(items) > 0
    AND status IN ('new', 'pending_payment')
    AND (user_id IS NULL OR user_id = auth.uid())
  );