'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { playClick } from '@/lib/sounds'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data: Record<string, unknown>
  read: boolean
  created_at: string
}

interface PhotoApprovalModalProps {
  notification: Notification
  onClose: () => void
  onAction: (action: 'approve' | 'reject', notification: Notification) => void
}

function PhotoApprovalModal({ notification, onClose, onAction }: PhotoApprovalModalProps) {
  const [acting, setActing] = useState(false)
  const data = notification.data as {
    requester_id: string
    requester_name: string
    requester_email: string
    avatar_url: string
  }

  const handleAction = async (action: 'approve' | 'reject') => {
    setActing(true)
    await onAction(action, notification)
    setActing(false)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl backdrop-blur-md border-2 p-6 sm:p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(5,14,26,0.95), rgba(10,25,41,0.95))',
          borderColor: 'rgba(0,212,255,0.3)',
          boxShadow: '0 8px 32px rgba(0,212,255,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-white tracking-wider">APROVAR FOTO</h2>
          <button onClick={onClose} className="text-blue-200/50 hover:text-white transition-colors text-xl">✕</button>
        </div>

        <div className="space-y-4">
          {/* User info */}
          <div className="p-4 rounded-xl" style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}>
            <p className="text-sm text-blue-200/70"><span className="text-cyan-300 font-bold">Nome:</span> {data.requester_name}</p>
            <p className="text-sm text-blue-200/70 mt-1"><span className="text-cyan-300 font-bold">Email:</span> {data.requester_email}</p>
          </div>

          {/* Photo preview */}
          <div className="flex justify-center">
            <div className="relative w-40 h-40 rounded-xl overflow-hidden" style={{ border: '2px solid rgba(0,212,255,0.3)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.avatar_url}
                alt="Foto enviada"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => handleAction('reject')}
              disabled={acting}
              className="flex-1 py-3 rounded-xl font-black tracking-widest text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              style={{
                background: 'rgba(239,68,68,0.15)',
                color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.4)',
              }}
            >
              {acting ? '...' : 'REJEITAR'}
            </button>
            <button
              onClick={() => handleAction('approve')}
              disabled={acting}
              className="flex-1 py-3 rounded-xl font-black tracking-widest text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #006622, #00AA44)',
                color: 'white',
                border: '1px solid rgba(34,197,94,0.4)',
                boxShadow: '0 0 16px rgba(34,197,94,0.2)',
              }}
            >
              {acting ? '...' : 'APROVAR'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [approvalModal, setApprovalModal] = useState<Notification | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async (p = 1, append = false) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/notifications?page=${p}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(prev => append ? [...prev, ...data.notifications] : data.notifications)
        setUnread(data.unread)
        setTotal(data.total)
        setHasMore(data.hasMore)
        setPage(p)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every 30 seconds
    const interval = setInterval(() => fetchNotifications(), 30000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const toggleOpen = async () => {
    playClick()
    const nextOpen = !open
    setOpen(nextOpen)
    if (nextOpen && unread > 0) {
      // Mark all as read
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      setUnread(0)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === 'photo_approval') {
      setApprovalModal(notification)
      setOpen(false)
    }
  }

  const handlePhotoAction = async (action: 'approve' | 'reject', notification: Notification) => {
    try {
      const data = notification.data as { requester_id: string }
      const res = await fetch('/api/admin/photo-moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: data.requester_id,
          action,
        }),
      })

      if (res.ok) {
        setApprovalModal(null)
        // Remove the notification from list
        setNotifications(prev => prev.filter(n => n.id !== notification.id))
        fetchNotifications()
      } else {
        const err = await res.json()
        alert(err.error || 'Erro ao processar ação')
      }
    } catch (error) {
      console.error('Photo action error:', error)
      alert('Erro ao processar ação')
    }
  }

  const loadMore = () => {
    fetchNotifications(page + 1, true)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'photo_approval': return '📸'
      case 'photo_approved': return '✅'
      case 'photo_rejected': return '❌'
      default: return '🔔'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={toggleOpen}
        className="relative p-2 rounded-lg transition-all hover:scale-110"
        style={{ color: '#00D4FF' }}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center animate-pulse"
            style={{ background: '#ef4444', color: 'white', boxShadow: '0 0 8px rgba(239,68,68,0.5)' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl overflow-hidden backdrop-blur-md z-50"
          style={{
            background: 'rgba(5,14,26,0.95)',
            border: '1px solid rgba(0,212,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(0,212,255,0.1)',
            maxHeight: '480px',
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(0,212,255,0.15)' }}>
            <h3 className="text-sm font-black text-white tracking-wider">NOTIFICAÇÕES</h3>
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto" style={{ maxHeight: '380px' }}>
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-blue-200/40 text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              <>
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className="w-full text-left px-4 py-3 transition-all hover:bg-white/5 flex items-start gap-3 border-b"
                    style={{ borderColor: 'rgba(0,212,255,0.08)' }}
                  >
                    <span className="text-lg mt-0.5 shrink-0">{getNotificationIcon(notif.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${notif.read ? 'text-blue-200/60' : 'text-white'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-blue-200/50 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-blue-200/30 mt-1">{timeAgo(notif.created_at)}</p>
                    </div>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: '#00D4FF' }} />
                    )}
                  </button>
                ))}

                {/* Load more */}
                {hasMore && (
                  <button
                    onClick={(e) => { e.stopPropagation(); loadMore() }}
                    className="w-full px-4 py-3 text-center text-xs font-bold tracking-wider transition-all hover:bg-white/5"
                    style={{ color: '#00D4FF' }}
                    disabled={loading}
                  >
                    {loading ? 'CARREGANDO...' : 'VEJA MAIS'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Photo approval modal - rendered via portal to avoid clipping */}
      {approvalModal && typeof document !== 'undefined' && createPortal(
        <PhotoApprovalModal
          notification={approvalModal}
          onClose={() => setApprovalModal(null)}
          onAction={handlePhotoAction}
        />,
        document.body
      )}
    </div>
  )
}
