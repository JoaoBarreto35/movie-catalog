import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Método não permitido', { status: 405 })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Não autorizado', { status: 401 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response('Usuário não encontrado', { status: 401 })
    }

    const { subscriptionCode } = await req.json()
    if (!subscriptionCode) {
      return new Response('Código da assinatura não fornecido', { status: 400 })
    }

    // Chamar Perfect Pay
    const perfectPayResponse = await fetch('https://api.perfectpay.com.br/v1/subscription/cancel', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('PERFECTPAY_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code: subscriptionCode })
    })

    if (!perfectPayResponse.ok) {
      throw new Error('Erro ao cancelar na Perfect Pay')
    }

    // Atualizar banco
    await supabase
      .from('subscriptions')
      .update({ 
        cancel_at_period_end: true,
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('perfectpay_subscription_id', subscriptionCode)

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})