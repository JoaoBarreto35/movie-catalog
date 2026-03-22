import { supabaseAdmin } from '../utils/supabaseClient.ts'
import type { UserData } from '../types.ts'

export async function findOrCreateUser(email: string, fullName?: string): Promise<UserData | null> {
  console.log(`🔍 Buscando usuário: ${email}`)

  // 1. Procurar na tabela users
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name')
    .eq('email', email)
    .maybeSingle()

  if (user) {
    console.log(`✅ Usuário encontrado: ${user.id}`)
    return user
  }

  // 2. Verificar no auth
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
  const existingAuthUser = authUsers.users.find(u => u.email === email)
  
  if (existingAuthUser) {
    console.log(`✅ Usuário no auth, criando na tabela...`)
    
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: existingAuthUser.id,
        email: email,
        full_name: fullName || email.split('@')[0],
        created_at: new Date().toISOString()
      })
      .select('id, email, full_name')
      .single()

    if (!insertError) return newUser
  }

  // 3. Criar novo usuário
  console.log(`🆕 Criando novo usuário: ${email}`)

  const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: null,
    email_confirm: true,
    user_metadata: {
      full_name: fullName || email.split('@')[0],
      created_from_purchase: true
    }
  })

  if (createError) throw createError

  const { data: newUser, error: insertError } = await supabaseAdmin
    .from('users')
    .insert({
      id: authUser.user.id,
      email: email,
      full_name: fullName || email.split('@')[0],
      created_at: new Date().toISOString()
    })
    .select('id, email, full_name')
    .single()

  if (insertError) throw insertError

  console.log(`✅ Usuário criado: ${newUser.id}`)
  return newUser
}