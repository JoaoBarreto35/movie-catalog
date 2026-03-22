// supabase/functions/perfectpay-webhook/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SITE_URL = Deno.env.get('SITE_URL') || 'https://barretoflix.com'

// Função para salvar logs
async function saveLog(
  supabase: any,
  eventMessage: string,
  eventType: string,
  level: string,
  metadata?: any
) {
  try {
    await supabase
      .from('webhook_logs')
      .insert({
        event_message: eventMessage,
        event_type: eventType,
        level: level,
        timestamp: Date.now(),
        metadata: metadata || {}
      });
  } catch (error) {
    console.error('Erro ao salvar log:', error);
  }
}

serve(async (req) => {
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const resend = new Resend(RESEND_API_KEY)

  try {
    // LOG DE INÍCIO
    await saveLog(supabaseAdmin, '🔥 Webhook recebido', 'Log', 'info', {
      method: req.method,
      url: req.url
    });

    if (req.method !== 'POST') {
      return new Response('Método não permitido', { status: 405 })
    }

    const body = await req.json()
    console.log('🔥 Webhook recebido:', body.code, body.sale_status_enum_key)

    const payment = {
      transactionId: body.code,
      status: body.sale_status_enum_key,
      email: body.customer?.email,
      productId: body.product?.code,
      amount: body.sale_amount,
      paymentMethod: body.payment_type_enum_key,
      customerName: body.customer?.full_name || body.customer?.email?.split('@')[0],
      subscriptionCode: body.subscription?.code
    }

    if (payment.status !== 'approved') {
      await saveLog(supabaseAdmin, `⏸️ Status ignorado: ${payment.status}`, 'Log', 'info', {
        transactionId: payment.transactionId
      });
      return new Response('OK', { status: 200 })
    }

    // Buscar ou criar usuário
    let userId: string | null = null

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', payment.email)
      .maybeSingle()

    if (existingUser) {
      userId = existingUser.id
      await saveLog(supabaseAdmin, `✅ Usuário encontrado: ${userId}`, 'Log', 'info', {
        email: payment.email,
        userId
      });
    } else {
      await saveLog(supabaseAdmin, `🆕 Criando novo usuário: ${payment.email}`, 'Log', 'info', {
        email: payment.email
      });

      const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: payment.email,
        password: null,
        email_confirm: true,
        user_metadata: {
          full_name: payment.customerName,
          created_from_purchase: true
        }
      })

      if (createError) throw createError

      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: newAuthUser.user.id,
          email: payment.email,
          full_name: payment.customerName,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      userId = newUser.id

      // Gerar link para criar senha
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: payment.email,
        options: { redirectTo: `${SITE_URL}/set-password` }
      })

      // Enviar email
      await resend.emails.send({
        from: 'BarretoFlix <onboarding@resend.dev>',
        to: [payment.email],
        subject: '🎬 Bem-vindo ao BarretoFlix! Complete seu acesso',
        html: `...` // seu template de email
      })

      await saveLog(supabaseAdmin, `✅ Usuário criado e email enviado: ${userId}`, 'Log', 'info', {
        email: payment.email,
        userId
      });
    }

    // Processar assinatura
    const periodStart = new Date()
    const periodEnd = new Date()
    periodEnd.setDate(periodEnd.getDate() + 30)

    const { data: plan } = await supabaseAdmin
      .from('plans')
      .select('id')
      .eq('perfectpay_product_id', payment.productId)
      .maybeSingle()

    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (existingSub) {
      await supabaseAdmin
        .from('subscriptions')
        .update({
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
          perfectpay_transaction_id: payment.transactionId,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSub.id)
      
      await saveLog(supabaseAdmin, `🔄 Assinatura renovada: ${existingSub.id}`, 'Log', 'info', {
        userId,
        subscriptionId: existingSub.id,
        transactionId: payment.transactionId
      });
    } else {
      await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: plan?.id,
          status: 'active',
          payment_method: payment.paymentMethod,
          perfectpay_transaction_id: payment.transactionId,
          perfectpay_subscription_id: payment.subscriptionCode,
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString()
        })
      
      await saveLog(supabaseAdmin, `✅ Nova assinatura criada: ${userId}`, 'Log', 'info', {
        userId,
        transactionId: payment.transactionId,
        subscriptionCode: payment.subscriptionCode
      });
    }

    // Registrar transação
    await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        amount: payment.amount,
        status: 'paid',
        payment_method: payment.paymentMethod,
        perfectpay_transaction_id: payment.transactionId,
        paid_at: new Date().toISOString()
      })

    await saveLog(supabaseAdmin, `💰 Transação registrada: ${payment.transactionId}`, 'Log', 'info', {
      userId,
      amount: payment.amount,
      transactionId: payment.transactionId
    });

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('❌ ERRO:', error)
    
    await saveLog(supabaseAdmin, `❌ Erro fatal: ${error.message}`, 'Error', 'error', {
      error: error.message,
      stack: error.stack
    });
    
    return new Response(`Erro: ${error.message}`, { status: 500 })
  }
})