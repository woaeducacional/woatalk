import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const { id } = await params

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 },
      )
    }

    const { data: certificate, error } = await supabase
      .from('certificates')
      .select(`
        id,
        certificate_code,
        verification_code,
        verification_url,
        ocean_name,
        level,
        program_name,
        total_study_hours,
        total_activities,
        completed_activities,
        completion_percentage,
        total_xp,
        total_woa_coins,
        content_summary,
        issued_at,
        issuing_organization,
        status
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !certificate) {
      return NextResponse.json(
        { error: 'Certificado não encontrado.' },
        { status: 404 },
      )
    }

    if (certificate.status !== 'issued') {
      return NextResponse.json(
        { error: 'Este certificado não está válido para download.' },
        { status: 409 },
      )
    }

    const pdf = await PDFDocument.create()

    const page = pdf.addPage([842, 595])

    const regular = await pdf.embedFont(StandardFonts.Helvetica)
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

    const navy = rgb(0.04, 0.08, 0.16)
    const cyan = rgb(0.05, 0.65, 0.85)
    const gold = rgb(0.88, 0.68, 0.18)
    const white = rgb(1, 1, 1)
    const gray = rgb(0.42, 0.45, 0.50)

    page.drawRectangle({
      x: 0,
      y: 0,
      width: 842,
      height: 595,
      color: navy,
    })

    page.drawRectangle({
      x: 22,
      y: 22,
      width: 798,
      height: 551,
      borderColor: cyan,
      borderWidth: 2,
    })

    page.drawRectangle({
      x: 32,
      y: 32,
      width: 778,
      height: 531,
      borderColor: gold,
      borderWidth: 1,
    })

    const center = (text: string, fontSize: number, font: any) =>
      (842 - font.widthOfTextAtSize(text, fontSize)) / 2

    page.drawText('WOA EDUCACIONAL', {
      x: center('WOA EDUCACIONAL', 20, bold),
      y: 510,
      size: 20,
      font: bold,
      color: cyan,
    })

    page.drawText('CERTIFICADO DE CONCLUSÃO', {
      x: center('CERTIFICADO DE CONCLUSÃO', 30, bold),
      y: 450,
      size: 30,
      font: bold,
      color: white,
    })

    const ocean = `Oceano ${certificate.ocean_name}`

    page.drawText(ocean, {
      x: center(ocean, 27, bold),
      y: 405,
      size: 27,
      font: bold,
      color: gold,
    })

    const program = certificate.program_name

    page.drawText(program, {
      x: center(program, 13, regular),
      y: 375,
      size: 13,
      font: regular,
      color: white,
    })

    page.drawText(
      'Certificamos que o aluno concluiu os requisitos acadêmicos registrados',
      {
        x: center(
          'Certificamos que o aluno concluiu os requisitos acadêmicos registrados',
          13,
          regular,
        ),
        y: 335,
        size: 13,
        font: regular,
        color: white,
      },
    )

    page.drawText(
      'nesta Jornada da WOA Educacional.',
      {
        x: center(
          'nesta Jornada da WOA Educacional.',
          13,
          regular,
        ),
        y: 315,
        size: 13,
        font: regular,
        color: white,
      },
    )

    const stats = [
      `Aproveitamento: ${certificate.completion_percentage}%`,
      `Atividades: ${certificate.completed_activities}/${certificate.total_activities}`,
      `XP: ${certificate.total_xp}`,
      `WOA Coins: ${certificate.total_woa_coins}`,
    ]

    stats.forEach((text, index) => {
      page.drawText(text, {
        x: 105 + index * 170,
        y: 250,
        size: 11,
        font: bold,
        color: white,
      })
    })

    const hours =
      Number(certificate.total_study_hours) > 0
        ? `${certificate.total_study_hours} horas`
        : 'Carga horária em contabilização'

    page.drawText(`Carga horária: ${hours}`, {
      x: center(`Carga horária: ${hours}`, 12, regular),
      y: 205,
      size: 12,
      font: regular,
      color: white,
    })

    const issued = new Date(certificate.issued_at).toLocaleDateString(
      'pt-BR',
    )

    page.drawText(`Emitido em: ${issued}`, {
      x: 100,
      y: 125,
      size: 11,
      font: regular,
      color: gray,
    })

    page.drawText(
      `Código: ${certificate.certificate_code}`,
      {
        x: 100,
        y: 105,
        size: 10,
        font: regular,
        color: gray,
      },
    )

    page.drawText(
      `Verificação: ${certificate.verification_code}`,
      {
        x: 100,
        y: 87,
        size: 10,
        font: regular,
        color: gray,
      },
    )

    page.drawText(
      certificate.issuing_organization || 'WOA Educacional',
      {
        x: 620,
        y: 105,
        size: 11,
        font: bold,
        color: white,
      },
    )

    page.drawText(
      'Documento verificável eletronicamente',
      {
        x: 620,
        y: 87,
        size: 9,
        font: regular,
        color: gray,
      },
    )

    const bytes = await pdf.save()

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          `attachment; filename="WOA-Certificado-${certificate.ocean_name}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('Certificate PDF error:', error)

    return NextResponse.json(
      { error: 'Erro ao gerar certificado.' },
      { status: 500 },
    )
  }
}
