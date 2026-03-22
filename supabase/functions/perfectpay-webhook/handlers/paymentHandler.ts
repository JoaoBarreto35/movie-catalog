import type { PerfectPayWebhook, ProcessedPayment } from '../types.ts'

export function extractPaymentData(body: PerfectPayWebhook): ProcessedPayment {
  return {
    transactionId: body.code,
    status: body.sale_status_enum_key,
    email: body.customer.email,
    productId: body.product.code,
    amount: body.sale_amount,
    paymentMethod: body.payment_type_enum_key,
    customerName: body.customer.full_name,
    subscriptionCode: body.subscription?.code,
    nextChargeDate: body.subscription?.next_charge_date
  }
}