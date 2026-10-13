-- ROLLBACK 013: Eliminar tablas orders, payments
DROP TABLE IF EXISTS public.payment_methods_config CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.order_line_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;