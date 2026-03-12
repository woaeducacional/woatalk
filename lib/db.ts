// Re-export do novo serviço centralizado
// Este arquivo mantém compatibilidade com imports antigos
export { apiService } from './api.service'
export type { User } from './api.service'

// Funções legadas para compatibilidade
import { apiService } from './api.service'

export const getUserByEmail = (email: string) => apiService.getUserByEmail(email)
export const getUserById = (id: string) => apiService.getUserById(id)
export const createUser = (email: string, name: string, password: string) =>
  apiService.createUser(email, name, password)
