import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { hashPassword } from './password'
import { inMemoryDB } from './inMemoryDB'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Flag para saber se estamos usando Supabase ou fallback
const useSupabase = !!(supabaseUrl && supabaseKey)

let supabase: any = null

if (useSupabase) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey)
  } catch (error) {
    console.warn('Failed to initialize Supabase, using in-memory database')
  }
}

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
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error) return null
      return data
    } catch (error) {
      console.warn('Supabase error, falling back to in-memory DB:', error)
      return inMemoryDB.getUserByEmail(email)
    }
  }

  return inMemoryDB.getUserByEmail(email)
}

export async function getUserById(id: string): Promise<User | null> {
  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (error) return null
      return data
    } catch (error) {
      console.warn('Supabase error, falling back to in-memory DB:', error)
      return inMemoryDB.getUserById(id)
    }
  }

  return inMemoryDB.getUserById(id)
}

export async function createUser(
  email: string,
  name: string,
  password: string
): Promise<User> {
  const passwordHash = await hashPassword(password)
  const id = uuidv4()
  const now = new Date().toISOString()

  const newUser: User = {
    id,
    email,
    name,
    password_hash: passwordHash,
    avatar_url: null,
    xp_total: 0,
    coins_balance: 0,
    current_phase: 1,
    errors_today: 0,
    last_error_reset: now,
    created_at: now,
    updated_at: now,
  }

  if (useSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single()

      if (error) {
        console.warn('Supabase insert error, using in-memory DB:', error)
        return inMemoryDB.createUser(newUser)
      }

      return data
    } catch (error) {
      console.warn('Supabase error, falling back to in-memory DB:', error)
      return inMemoryDB.createUser(newUser)
    }
  }

  return inMemoryDB.createUser(newUser)
}
