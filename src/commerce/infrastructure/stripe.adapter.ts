import { Result, err, ok } from "../../shared/domain/result.ts";
import { OrderState } from "../../commerce/domain/order.entity.ts";
import { PaymentGateway, PaymentError } from "../../commerce/domain/commerce.repository.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

export class StripeAdapter implements PaymentGateway {
  async cobrar(order: OrderState, metodo: string): Promise<Result<string, PaymentError>> {
    try {
      const { data, error } = await supabase.rpc("stripe_create_payment_intent", {
        p_order_id: order.id,
        p_amount: order.totalAmount,
        p_currency: order.currency.toLowerCase(),
        p_method: metodo,
      });
      if (error) return err({ kind: "cobro_fallido", cause: error.message });
      return ok(data as string);
    } catch (e) {
      return err({ kind: "cobro_fallido", cause: String(e) });
    }
  }

  async reembolsar(payment: PaymentState): Promise<Result<void, PaymentError>> {
    try {
      const { error } = await supabase.rpc("stripe_refund_payment", {
        p_payment_id: payment.id,
      });
      if (error) return err({ kind: "reembolso_fallido", cause: error.message });
      return ok(undefined);
    } catch (e) {
      return err({ kind: "reembolso_fallido", cause: String(e) });
    }
  }
}

import { PaymentState } from "../../commerce/domain/payment.entity.ts";