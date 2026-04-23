'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

interface ImageUploadProps {
  label?: string
  value?: string
  onUpload: (url: string, fileName: string) => void
  phaseId: number
  maxSize?: number // em MB
  disabled?: boolean
}

export function ImageUpload({
  label = 'Enviar ícone',
  value,
  onUpload,
  phaseId,
  maxSize = 5,
  disabled = false,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string>('')
  const [preview, setPreview] = useState<string>(value || '')

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')

    // Validar tamanho
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Arquivo muito grande. Máximo: ${maxSize}MB`)
      return
    }

    // Validar tipo
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      setError('Tipo de arquivo não permitido. Use: PNG, JPEG, WebP, GIF ou SVG')
      return
    }

    // Mostrar preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Fazer upload
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('phaseId', String(phaseId))

      const response = await fetch('/api/admin/journey/upload-icon', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao fazer upload')
      }

      const data = await response.json()
      onUpload(data.url, data.fileName)
      setError('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(message)
      setPreview('')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-[11px] font-bold text-blue-200/70 mb-1 uppercase tracking-wider">
        {label}
      </label>

      <div className="space-y-3">
        {/* Preview */}
        {preview && (
          <div className="relative w-full max-w-xs h-32 rounded-lg overflow-hidden border-2 border-cyan-400/30 bg-black/30">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-contain p-2"
            />
          </div>
        )}

        {/* Upload button */}
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="px-4 py-2.5 rounded-lg border-2 border-dashed border-cyan-400/50 text-cyan-300 text-sm font-bold hover:border-cyan-400 hover:bg-cyan-400/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? '⏳ Enviando...' : '📁 Escolher arquivo'}
          </button>

          {preview && (
            <button
              type="button"
              onClick={() => {
                setPreview('')
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
              className="px-3 py-2.5 rounded-lg text-red-300 text-sm font-bold hover:bg-red-500/10 transition-all"
            >
              ✕ Remover
            </button>
          )}
        </div>

        {/* Info text */}
        <p className="text-[10px] text-blue-200/50">
          PNG, JPEG, WebP, GIF ou SVG • Máximo: {maxSize}MB • Nomenclatura: phase-{phaseId}.*
        </p>

        {/* Error message */}
        {error && (
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            ❌ {error}
          </div>
        )}
      </div>
    </div>
  )
}
