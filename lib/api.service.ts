import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { hashPassword, comparePasswords } from './password'
import { inMemoryDB } from './inMemoryDB'

// Interfaces
export interface User {
  id: string
  email: string
  name: string
  password_hash: string
  avatar_url: string | null
  role: string
  xp_total: number
  coins_balance: number
  current_phase: number
  created_at: string
  updated_at: string
}

// Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const useSupabase = !!(supabaseUrl && supabaseKey)
let supabaseClient: ReturnType<typeof createClient> | null = null

if (useSupabase) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey)
  } catch (error) {
    console.warn('Failed to initialize Supabase, using in-memory database')
  }
}

class ApiService {
  private isSupabaseAvailable(): boolean {
    return useSupabase && !!supabaseClient
  }

  /**
   * Buscar usuário por email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    if (this.isSupabaseAvailable()) {
      try {
        const { data, error } = await (supabaseClient! as any)
          .from('users')
          .select('*')
          .eq('email', email)
          .single()

        if (error) {
          console.warn('Supabase error:', error)
          return inMemoryDB.getUserByEmail(email)
        }
        return data as User
      } catch (error) {
        console.warn('Supabase exception, falling back to in-memory DB:', error)
        return inMemoryDB.getUserByEmail(email)
      }
    }

    return inMemoryDB.getUserByEmail(email)
  }

  /**
   * Buscar usuário por ID
   */
  async getUserById(id: string): Promise<User | null> {
    if (this.isSupabaseAvailable()) {
      try {
        const { data, error } = await (supabaseClient! as any)
          .from('users')
          .select('*')
          .eq('id', id)
          .single()

        if (error) {
          console.warn('Supabase error:', error)
          return inMemoryDB.getUserById(id)
        }
        return data as User
      } catch (error) {
        console.warn('Supabase exception, falling back to in-memory DB:', error)
        return inMemoryDB.getUserById(id)
      }
    }

    return inMemoryDB.getUserById(id)
  }

  /**
   * Criar novo usuário
   */
  async createUser(email: string, name: string, password: string): Promise<User> {
    const passwordHash = await hashPassword(password)
    const id = uuidv4()
    const now = new Date().toISOString()

    const newUser = {
      id,
      email,
      name,
      password_hash: passwordHash,
      avatar_url: null,
      role: 'user',
      xp_total: 0,
      coins_balance: 0,
      current_phase: 1,
      created_at: now,
      updated_at: now,
    }

    if (this.isSupabaseAvailable()) {
      try {
        const { data, error } = await (supabaseClient! as any)
          .from('users')
          .insert([newUser])
          .select()
          .single()

        if (error) {
          console.warn('Supabase insert error, using in-memory DB:', error)
          return inMemoryDB.createUser(newUser as User)
        }

        return data as User
      } catch (error) {
        console.warn('Supabase exception, falling back to in-memory DB:', error)
        return inMemoryDB.createUser(newUser as User)
      }
    }

    return inMemoryDB.createUser(newUser as User)
  }

  /**
   * Validar credenciais de login
   */
  async validateCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email)
    if (!user) return null

    const isValid = await comparePasswords(password, user.password_hash)
    return isValid ? user : null
  }

  /**
   * Verificar se email já existe
   */
  async emailExists(email: string): Promise<boolean> {
    const user = await this.getUserByEmail(email)
    return !!user
  }

  /**
   * Atualizar XP do usuário
   */
  async updateUserXP(userId: string, xpAmount: number): Promise<User | null> {
    const user = await this.getUserById(userId)
    if (!user) return null

    const updatedData = {
      xp_total: user.xp_total + xpAmount,
      updated_at: new Date().toISOString(),
    }

    if (this.isSupabaseAvailable()) {
      try {
        const { data, error } = await (supabaseClient! as any)
          .from('users')
          .update(updatedData)
          .eq('id', userId)
          .select()
          .single()

        if (error) {
          console.warn('Supabase update error:', error)
          return { ...user, ...updatedData } as User
        }
        return { ...user, ...updatedData } as User
      } catch (error) {
        console.warn('Supabase exception:', error)
        return { ...user, ...updatedData } as User
      }
    }

    return { ...user, ...updatedData } as User
  }

  /**
   * Atualizar moedas do usuário
   */
  async updateUserCoins(userId: string, coinAmount: number): Promise<User | null> {
    const user = await this.getUserById(userId)
    if (!user) return null

    const updatedData = {
      coins_balance: Math.max(0, user.coins_balance + coinAmount),
      updated_at: new Date().toISOString(),
    }

    if (this.isSupabaseAvailable()) {
      try {
        const { data, error } = await (supabaseClient! as any)
          .from('users')
          .update(updatedData)
          .eq('id', userId)
          .select()
          .single()

        if (error) {
          console.warn('Supabase update error:', error)
          return { ...user, ...updatedData } as User
        }
        return { ...user, ...updatedData } as User
      } catch (error) {
        console.warn('Supabase exception:', error)
        return { ...user, ...updatedData } as User
      }
    }

    return { ...user, ...updatedData } as User
  }

  /**
   * Atualizar senha do usuário (para redefinição via OTP)
   */
  async updateUserPassword(email: string, newPassword: string): Promise<boolean> {
    const user = await this.getUserByEmail(email)
    if (!user) return false

    const password_hash = await hashPassword(newPassword)
    const updatedData = { password_hash, updated_at: new Date().toISOString() }

    if (this.isSupabaseAvailable()) {
      try {
        const { error } = await (supabaseClient! as any)
          .from('users')
          .update(updatedData)
          .eq('email', email.toLowerCase().trim())

        if (error) console.warn('Supabase update password error:', error)
      } catch (error) {
        console.warn('Supabase exception updating password:', error)
      }
    } else {
      inMemoryDB.updateUser(user.id, updatedData)
    }

    return true
  }

  /**
   * Obter status do banco de dados
   */
  getDBStatus(): 'supabase' | 'fallback' {
    return this.isSupabaseAvailable() ? 'supabase' : 'fallback'
  }
}

// Exportar instância única do serviço (Singleton)
export const apiService = new ApiService()
