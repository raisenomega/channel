-- HUB by Raisen — Parte B: el agente captura los 5 datos base del cliente (nombre/telefono/direccion/email/
-- producto-servicio) y los guarda en el contacto. Los 4 primeros ya son columnas (display_name/primary_phone/
-- primary_email/address); falta el 5to: product_interest (que producto/servicio quiere). Solo se llena si esta
-- vacio (nunca se pisa un dato bueno). Lo usa la cotizacion para ser precisa.
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS product_interest text;
