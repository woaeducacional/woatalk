import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables not configured')
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const BUCKET_NAME = 'journey-assets'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized: admin access required')
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const formData = await req.formData()
    const file = formData.get('file') as File
    const phaseId = formData.get('phaseId') as string

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo fornecido' }, { status: 400 })
    }

    if (!phaseId || isNaN(parseInt(phaseId))) {
      return NextResponse.json({ error: 'phaseId inválido' }, { status: 400 })
    }

    // Validar tipo de arquivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de arquivo não permitido. Use: PNG, JPEG, WebP, GIF ou SVG` },
        { status: 400 }
      )
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Gerar nome do arquivo com nomenclatura padrão
    const ext = file.name.split('.').pop() || 'png'
    const fileName = `phase-${phaseId}.${ext}`
    const filePath = `journeys/icons/${fileName}`

    // Converter File para Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload para Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true, // Sobrescreve se já existir
      })

    if (uploadError) {
      console.error('[Upload Error]', uploadError)
      return NextResponse.json(
        { error: `Erro ao fazer upload: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Gerar URL pública
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    const publicUrl = publicUrlData?.publicUrl

    if (!publicUrl) {
      return NextResponse.json(
        { error: 'Falha ao gerar URL pública' },
        { status: 500 }
      )
    }

    // Salvar icon_url no banco de dados
    const { error: dbError } = await supabase
      .from('journey_content')
      .update({ icon_url: publicUrl })
      .eq('phase_id', parseInt(phaseId))

    if (dbError) {
      console.error('[DB Error]', dbError)
      return NextResponse.json(
        { error: `Upload OK mas erro ao salvar BD: ${dbError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
      fileName,
      message: `Ícone enviado com sucesso: ${fileName}`
    })
  } catch (error: unknown) {
    console.error('[Upload Error]', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: `Erro ao processar upload: ${message}` },
      { status: 500 }
    )
  }
}
