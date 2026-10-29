/**
 * HUB by Raisen — Catalogo de plantillas HUB (lote 1 = 25).
 * imp=true -> import instantaneo de la biblioteca de Meta (nombre exacto confirmado).
 * Sin imp -> se crea con cuerpo estatico (sin variables = maxima aprobacion). C4 <=75.
 */
export interface CatalogItem {
  readonly name: string;
  readonly cat: "utility" | "marketing";
  readonly desc: string;
  readonly body: string;
  readonly imp?: boolean;
}

export const TEMPLATE_CATALOG: readonly CatalogItem[] = [
  { name: "order_delivered", cat: "utility", desc: "Pedido entregado (Meta)", body: "", imp: true },
  { name: "order_shipped", cat: "utility", desc: "Pedido enviado (Meta)", body: "", imp: true },
  { name: "seguimiento_postventa", cat: "utility", desc: "Seguimiento postventa", body: "Queremos asegurarnos de que todo haya quedado bien con tu compra. Si necesitas algo mas, escribenos por aqui." },
  { name: "appointment_reminder", cat: "utility", desc: "Recordatorio de cita (Meta)", body: "", imp: true },
  { name: "appointment_rescheduled", cat: "utility", desc: "Cita reprogramada (Meta)", body: "", imp: true },
  { name: "confirmacion_pedido", cat: "utility", desc: "Confirmacion de pedido", body: "Gracias por tu pedido. Lo recibimos y ya lo estamos preparando. Te avisamos por aqui cuando este listo." },
  { name: "pedido_en_proceso", cat: "utility", desc: "Pedido en preparacion", body: "Tu pedido ya esta en preparacion. Pronto tendras novedades por este chat." },
  { name: "pedido_listo", cat: "utility", desc: "Pedido listo", body: "Tu pedido esta listo. Puedes pasar a recogerlo o coordinar la entrega por aqui." },
  { name: "confirmacion_cita", cat: "utility", desc: "Cita agendada", body: "Tu cita quedo agendada. Si necesitas cambiarla, escribenos por aqui y con gusto te ayudamos." },
  { name: "recordatorio_cita", cat: "utility", desc: "Recordatorio de cita", body: "Te recordamos tu proxima cita con nosotros. Aqui estamos para lo que necesites." },
  { name: "cita_cancelada", cat: "utility", desc: "Cita cancelada", body: "Tu cita fue cancelada. Si quieres reagendar, escribenos y con gusto te ayudamos." },
  { name: "aviso_pago_recibido", cat: "utility", desc: "Pago recibido", body: "Recibimos tu pago. Gracias por tu confianza. Cualquier duda, por aqui estamos." },
  { name: "recordatorio_pago", cat: "utility", desc: "Pago pendiente", body: "Te recordamos que tienes un pago pendiente. Escribenos por aqui para ayudarte a completarlo." },
  { name: "factura_disponible", cat: "utility", desc: "Factura disponible", body: "Tu factura ya esta disponible. Si necesitas una copia, pidela por este chat." },
  { name: "servicio_agendado", cat: "utility", desc: "Servicio programado", body: "Tu servicio quedo programado. Te confirmamos los detalles por aqui." },
  { name: "tecnico_en_camino", cat: "utility", desc: "Tecnico en camino", body: "Nuestro tecnico va en camino hacia tu direccion. Gracias por tu paciencia." },
  { name: "servicio_completado", cat: "utility", desc: "Servicio completado", body: "Tu servicio quedo completado. Gracias por elegirnos. Cualquier detalle, escribenos por aqui." },
  { name: "bienvenida_cliente", cat: "utility", desc: "Bienvenida", body: "Bienvenido. Gracias por escribirnos. Estamos aqui para ayudarte con lo que necesites." },
  { name: "actualizacion_pedido", cat: "utility", desc: "Actualizacion de pedido", body: "Tenemos una actualizacion sobre tu pedido. Escribenos por aqui para darte los detalles." },
  { name: "membresia_activada", cat: "utility", desc: "Membresia activada", body: "Tu membresia esta activa. Gracias por unirte. Disfruta de tus beneficios." },
  { name: "oferta_especial", cat: "marketing", desc: "Oferta especial", body: "Tenemos una oferta especial para ti. Escribenos por aqui y te contamos los detalles." },
  { name: "nuevo_servicio", cat: "marketing", desc: "Nuevo servicio", body: "Tenemos un nuevo servicio disponible. Preguntanos por aqui y con gusto te explicamos." },
  { name: "reactivacion_cliente", cat: "marketing", desc: "Reactivacion", body: "Te extranamos. Vuelve y descubre lo nuevo que tenemos para ti. Escribenos por aqui." },
  { name: "promo_referido", cat: "marketing", desc: "Refiere y gana", body: "Refiere a un amigo y ambos ganan. Escribenos por aqui para contarte como." },
  { name: "recordatorio_mantenimiento", cat: "marketing", desc: "Mantenimiento", body: "Es buen momento para tu mantenimiento. Agenda con nosotros por este chat." },
];
