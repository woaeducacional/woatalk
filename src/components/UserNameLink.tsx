'use client'

import Link from 'next/link'

interface UserNameLinkProps {
  userId: string
  name: string
  className?: string
}

/**
 * Component to render a user name as a clickable link to their public profile
 */
export function UserNameLink({ userId, name, className = '' }: UserNameLinkProps) {
  const displayName = name?.split(' ').slice(0, 2).join(' ') ?? 'Usuário'

  return (
    <Link
      href={`/profile/${userId}`}
      className={`
        hover:text-cyan-300 hover:underline transition-colors cursor-pointer
        ${className}
      `}
      title={`Ver perfil de ${displayName}`}
    >
      {displayName}
    </Link>
  )
}
