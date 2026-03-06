import { createClient } from '@supabase/supabase-js'
import { hashPassword } from './password'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export interface User {
  id: string
  email: string
  name: string
  password_hash: string
  avatar_url: string | null
  xp_total: number
  coins_balance: number
  current_phase: number
  errors_today: number
  last_error_reset: string
  created_at: string
  updated_at: string
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function createUser(
  email: string,
  name: string,
  password: string
): Promise<User> {
  const passwordHash = await hashPassword(password)

  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        email,
        name,
        password_hash: passwordHash,
        xp_total: 0,
        coins_balance: 0,
        current_phase: 1,
        errors_today: 0,
        last_error_reset: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`)
  }

  return data
}
