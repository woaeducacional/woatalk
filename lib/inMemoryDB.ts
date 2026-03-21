// In-memory database para desenvolvimento
// Quando Supabase não está configurado

interface InMemoryUser {
  id: string
  email: string
  name: string
  password_hash: string
  avatar_url: string | null
  role: string
  xp_total: number
  coins_balance: number
  current_phase: number
  errors_today: number
  last_error_reset: string
  created_at: string
  updated_at: string
}

class InMemoryDB {
  private users: Map<string, InMemoryUser> = new Map()

  async getUserByEmail(email: string): Promise<InMemoryUser | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user
      }
    }
    return null
  }

  async getUserById(id: string): Promise<InMemoryUser | null> {
    return this.users.get(id) || null
  }

  async createUser(user: InMemoryUser): Promise<InMemoryUser> {
    this.users.set(user.id, user)
    return user
  }

  getAllUsers(): InMemoryUser[] {
    return Array.from(this.users.values())
  }

  clear(): void {
    this.users.clear()
  }
}

export const inMemoryDB = new InMemoryDB()

// Adicione alguns usuários de teste
if (typeof window === 'undefined') {
  // Apenas no servidor
  const crypto = require('crypto')
  const bcrypt = require('bcryptjs')

  // Este usuário será adicionado ao iniciar
  // Senha teste: "Teste123"
  const hashedPassword = require('crypto')
    .createHash('md5')
    .update('Teste123test-salt')
    .digest('hex')

  // Não vamos pré-adicionar, deixe vazio para o usuário testar
}
