
-- Заменяем permissive INSERT-политики на проверки базовой валидности данных
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
ON public.orders FOR INSERT
WITH CHECK (
  length(trim(customer_name)) BETWEEN 2 AND 100
  AND length(trim(customer_phone)) BETWEEN 5 AND 30
  AND length(trim(delivery_method)) > 0
  AND length(trim(payment_method)) > 0
  AND total_amount >= 0
  AND jsonb_typeof(items) = 'array'
  AND jsonb_array_length(items) > 0
  AND status = 'new'
);

DROP POLICY IF EXISTS "Anyone can create contact requests" ON public.contact_requests;
CREATE POLICY "Anyone can create contact requests"
ON public.contact_requests FOR INSERT
WITH CHECK (
  length(trim(name)) BETWEEN 2 AND 100
  AND length(trim(contact)) BETWEEN 3 AND 100
  AND length(trim(message)) BETWEEN 1 AND 5000
  AND is_read = false
);

-- Сужаем storage SELECT-политики чтобы запретить листинг
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can read product image files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'product-images'
  AND (storage.foldername(name))[1] IS NOT NULL
);

DROP POLICY IF EXISTS "Public can view blog images" ON storage.objects;
CREATE POLICY "Public can read blog image files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'blog-images'
  AND (storage.foldername(name))[1] IS NOT NULL
);
