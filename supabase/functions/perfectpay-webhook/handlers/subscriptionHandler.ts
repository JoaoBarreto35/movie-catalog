import { supabaseAdmin } from '../utils/supabaseClient.ts'
import type { ProcessedPayment } from '../types.ts'

export function isRenewal(subscriptionCode?: string, chargesMade?: number): boolean {
  return chargesMade !== undefined && chargesMade > 1
}

export async function findPlanByProductId(productId: string) {
  const { data: plan, error } = await supabaseAdmin
    .from('plans')
    .select('id')
    .eq('perfectpay_product_id', productId)
    .maybeSingle()

  if (error) console.error('❌ Erro ao buscar plano:', error)
  return plan
}

export async function handleSubscription(
  userId: string,
  payment: ProcessedPayment,
  isRenewalFlag: boolean = false
): Promise<boolean> {
  try {
    const periodStart = new Date()
    const periodEnd = new Date()
    periodEnd.setDate(periodEnd.getDate() + 30)

    // Se for renovação, atualizar período
    if (isRenewalFlag && payment.subscriptionCode) {
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
          perfectpay_transaction_id: payment.transactionId,
          updated_at: new Date().toISOString()
        })
        .eq('perfectpay_subscription_id', payment.subscriptionCode)

      if (error) throw error
      console.log(`✅ Assinatura renovada: ${payment.subscriptionCode}`)
      return true
    }

    // Nova assinatura
    const plan = await findPlanByProductId(payment.productId)
    if (!plan) return false

    const { error } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_id: plan.id,
        status: 'active',
        payment_method: payment.paymentMethod,
        perfectpay_transaction_id: payment.transactionId,
        perfectpay_subscription_id: payment.subscriptionCode,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString()
      })

    if (error) throw error
    console.log(`✅ Nova assinatura criada: ${userId}`)
    return true

  } catch (error) {
    console.error('❌ Erro ao processar assinatura:', error)
    return false
  }
}