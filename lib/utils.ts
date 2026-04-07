import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCookie(key: string) {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(new RegExp('(?:^|; )' + key + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : null
}
export function setCookie(key: string, val: string) {
  document.cookie = `${key}=${encodeURIComponent(val)};path=/;max-age=604800`
}
export function deleteCookie(key: string) {
  document.cookie = `${key}=;path=/;max-age=0`
}
