import { Result, err, ok } from "../../shared/domain/result.ts";
import { OrderId, PaymentId } from "../../shared/domain/ids.ts";
import { crearPayment } from "../domain/payment.entity.ts";
import { OrderRepository, PaymentRepository, PaymentGateway, RepoError } from "../domain/commerce.repository.ts";

export interface ProcessPaymentCommand {
  readonly orderId: OrderId;
  readonly method: string;
}

export type ProcessPaymentError =
  | RepoError
  | { readonly kind: "orden_no_encontrada" }
  | { readonly kind: "cobro_fallido"; readonly cause: string };

export class ProcessPaymentHandler {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly paymentRepo: PaymentRepository,
    private readonly paymentGateway: PaymentGateway,
  ) {}

  async ejecutar(cmd: ProcessPaymentCommand): Promise<Result<PaymentId, ProcessPaymentError>> {
    const orderResult = await this.orderRepo.buscar(cmd.orderId);
    if (!orderResult.ok) return err(orderResult.error);
    const order = orderResult.value;
    if (!order) return err({ kind: "orden_no_encontrada" });

    const cobro = await this.paymentGateway.cobrar(order, cmd.method);
    if (!cobro.ok) return err({ kind: "cobro_fallido", cause: cobro.error.cause });

    const payment = crearPayment(order.id, order.tenantId, order.totalAmount, cmd.method);
    if (!payment.ok) return err({ kind: "cobro_fallido", cause: "monto_invalido" });

    const guardado = await this.paymentRepo.guardar(payment.value);
    if (!guardado.ok) return err(guardado.error);

    return ok(payment.value.id);
  }
}