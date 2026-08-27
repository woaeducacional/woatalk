import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ verificationCode: string }> },
) {
  try {
    const { verificationCode } = await params

    if (!verificationCode) {
      return NextResponse.json(
        { valid: false, error: 'Código de verificação não informado.' },
        { status: 400 },
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
        certificate_type,
        level,
        program_name,
        certificate_version,
        total_study_minutes,
        total_study_hours,
        total_activities,
        completed_activities,
        completion_percentage,
        total_xp,
        total_woa_coins,
        content_summary,
        skills,
        learning_outcomes,
        activity_types,
        issuer_name,
        issuing_organization,
        issued_at,
        status
      `)
      .eq('verification_code', verificationCode)
      .maybeSingle()

    if (error) {
      console.error('Certificate verification error:', error)

      return NextResponse.json(
        { valid: false, error: 'Erro ao consultar certificado.' },
        { status: 500 },
      )
    }

    if (!certificate) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Certificado não encontrado.',
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      valid: certificate.status === 'issued',

      certificate: {
        certificateCode: certificate.certificate_code,
        verificationCode: certificate.verification_code,
        verificationUrl: certificate.verification_url,

        oceanName: certificate.ocean_name,
        certificateType: certificate.certificate_type,
        level: certificate.level,

        programName: certificate.program_name,
        certificateVersion: certificate.certificate_version,

        totalStudyMinutes: certificate.total_study_minutes,
        totalStudyHours: certificate.total_study_hours,

        totalActivities: certificate.total_activities,
        completedActivities: certificate.completed_activities,
        completionPercentage: certificate.completion_percentage,

        totalXp: certificate.total_xp,
        totalWoaCoins: certificate.total_woa_coins,

        contentSummary: certificate.content_summary,
        skills: certificate.skills,
        learningOutcomes: certificate.learning_outcomes,
        activityTypes: certificate.activity_types,

        issuerName: certificate.issuer_name,
        issuingOrganization: certificate.issuing_organization,

        issuedAt: certificate.issued_at,
        status: certificate.status,
      },
    })
  } catch (error) {
    console.error('Certificate verification error:', error)

    return NextResponse.json(
      { valid: false, error: 'Erro interno.' },
      { status: 500 },
    )
  }
}
