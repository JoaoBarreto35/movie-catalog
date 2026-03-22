import { Resend } from 'https://esm.sh/resend@2.0.0'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SITE_URL = Deno.env.get('SITE_URL') || 'https://barretoflix.com'

const resend = new Resend(RESEND_API_KEY)

export async function sendWelcomeEmail(email: string, customerName: string, recoveryLink: string) {
  try {
    await resend.emails.send({
      from: 'BarretoFlix <onboarding@resend.dev>',
      to: [email],
      subject: '🎬 Bem-vindo ao BarretoFlix! Complete seu acesso',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; background-color: #141414; color: #ffffff; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; color: #ff5e00; }
            .card { background-color: #1f1f1f; border-radius: 12px; padding: 30px; margin-bottom: 20px; }
            .title { color: #ff5e00; font-size: 24px; margin-bottom: 20px; }
            .button { background-color: #ff5e00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 10px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎬 BarretoFlix</div>
            </div>
            
            <div class="card">
              <h1 class="title">Olá, ${customerName}!</h1>
              <p>Sua assinatura foi <strong>ativada com sucesso</strong>! 🎉</p>
              <p>Agora você tem acesso ilimitado a todos os filmes e séries.</p>
              
              <div style="background: #2a2a2a; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #aaa;">📧 Email da sua conta:</p>
                <p style="margin: 5px 0 0; font-size: 18px; font-weight: bold; color: #ff5e00;">${email}</p>
              </div>

              <p style="text-align: center;">
                <a href="${recoveryLink}" class="button" style="color: white;">
                  🔐 CRIAR MINHA SENHA
                </a>
              </p>

              <p style="color: #888; font-size: 14px; text-align: center;">
                ⚡ Ou acesse agora com link mágico:<br/>
                <a href="${SITE_URL}/magic-link?email=${encodeURIComponent(email)}" style="color: #ff5e00;">
                  Enviar link de acesso rápido
                </a>
              </p>
            </div>

            <div class="footer">
              <p>Este é um email automático do BarretoFlix.</p>
              <p>Precisa de ajuda? <a href="mailto:suporte@barretoflix.com" style="color: #ff5e00;">suporte@barretoflix.com</a></p>
            </div>
          </div>
        </body>
        </html>
      `
    })
    console.log(`✅ Email enviado para: ${email}`)
  } catch (error) {
    console.error(`❌ Erro ao enviar email para ${email}:`, error)
  }
}