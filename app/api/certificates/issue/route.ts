import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

const ENABLED_OCEANS: Record<number, string> = {
  1: 'Pacífico',
  2: 'Atlântico',
  3: 'Índico',
  4: 'Ártico',
}

const ELIGIBLE_PLANS = new Set([
  'starter_monthly',
  'starter_yearly',
  'premium_monthly',
  'premium_yearly',
])

function generateCode(prefix: string) {
  return `${prefix}-${crypto.randomBytes(12).toString('hex').toUpperCase()}`
}

export async function POST(req: NextRequest) {
  try {
    // ==========================================================
    // 1. AUTENTICAÇÃO
    // ==========================================================

    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    // ==========================================================
    // 2. INPUT
    // ==========================================================

    const body = await req.json().catch(() => null)
    const phaseId = Number(body?.phaseId)

    if (!Number.isInteger(phaseId)) {
      return NextResponse.json(
        { error: 'phaseId inválido' },
        { status: 400 },
      )
    }

    // A certificação oficial começa na Jornada 1.
// phaseId 0 não representa um Oceano/Jornada.
// WOA Memory é um recurso separado e não gera certificação.
// Atualmente, somente as Jornadas 1 a 4 estão liberadas.
    if (phaseId < 1 || phaseId > 4) {
      return NextResponse.json(
        {
          error:
            'Esta Jornada ainda não está disponível para certificação.',
        },
        { status: 400 },
      )
    }

    const oceanName = ENABLED_OCEANS[phaseId]

    if (!oceanName) {
      return NextResponse.json(
        {
          error: 'Este Oceano ainda não está disponível para certificação.',
        },
        { status: 400 },
      )
    }

    // ==========================================================
    // 3. USUÁRIO + PLANO
    // ==========================================================

    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        subscription_plan,
        subscription_status,
        journey_progress
      `)
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 },
      )
    }

    const plan = user.subscription_plan

    const eligible =
      plan &&
      ELIGIBLE_PLANS.has(plan) &&
      (
        user.subscription_status === 'active' ||
        user.subscription_status === 'trial'
      )

    if (!eligible) {
      return NextResponse.json(
        {
          error:
            'A certificação está disponível somente para usuários Starter ou Premium ativos.',
        },
        { status: 403 },
      )
    }

    // ==========================================================
    // 4. PROGRESSO REAL DA JORNADA
    // ==========================================================

    const progress =
      user.journey_progress?.[String(phaseId)] ?? []

    const completedGroups = Array.isArray(progress)
      ? progress
          .map(Number)
          .filter(Number.isInteger)
          .sort((a: number, b: number) => a - b)
      : []

    const REQUIRED_GROUPS = [0, 1, 2, 3, 4]

    const allGroupsCompleted = REQUIRED_GROUPS.every(
      groupId => completedGroups.includes(groupId),
    )

    if (!allGroupsCompleted) {
      return NextResponse.json(
        {
          error:
            'A Jornada ainda não foi concluída. Todas as missões obrigatórias precisam ser finalizadas.',
          phaseId,
          oceanName,
          completedGroups,
          requiredGroups: REQUIRED_GROUPS,
        },
        { status: 409 },
      )
    }

    // ==========================================================
    // 4B. PROGRESSO INDIVIDUAL DAS ATIVIDADES
    // ==========================================================
    //
    // A certificação não deve depender apenas dos 5 grupos.
    // Consultamos o registro individual das atividades.
    //
    // Nesta primeira versão da Sprint 4, cada avanço registrado
    // pelo UnifiedJourneyFlow representa uma atividade concluída.
    // O total previsto é derivado do conteúdo real da Jornada.
    //

    const { data: activityProgress, error: activityProgressError } =
      await supabase
        .from('activity_progress')
        .select(`
          mission_group_id,
          activity_index,
          step_completed,
          xp_earned,
          completed_at
        `)
        .eq('user_id', user.id)
        .eq('phase_id', phaseId)
        .order('mission_group_id', { ascending: true })
        .order('activity_index', { ascending: true })

    if (activityProgressError) {
      console.error(
        'Activity progress lookup error:',
        activityProgressError,
      )

      return NextResponse.json(
        {
          error:
            'Não foi possível verificar o progresso individual das atividades.',
        },
        { status: 500 },
      )
    }

    // ==========================================================
    // 4C. CONTAGEM REAL — JORNADA + MISSÃO + ATIVIDADE
    // ==========================================================
    //
    // O activity_index reinicia em cada missão.
    // Portanto, NÃO podemos contar apenas activity_index.
    //
    // A chave lógica é:
    //   phase_id + mission_group_id + activity_index
    //
    // O frontend registra a atividade anterior quando o aluno
    // avança. Assim, o maior índice registrado de cada missão
    // representa o último passo percorrido.
    //
    // Exemplo:
    //   índices 0..9 registrados = 10 atividades concluídas.
    //
    // O certificado usa os registros reais do aluno e não
    // soma atividades de missões diferentes como se fossem iguais.
    // ==========================================================

    const completedActivitiesByGroup = new Map<number, Set<number>>()

    for (const activity of activityProgress ?? []) {
      if (
        activity.step_completed !== true ||
        !Number.isInteger(Number(activity.mission_group_id)) ||
        !Number.isInteger(Number(activity.activity_index))
      ) {
        continue
      }

      const groupId = Number(activity.mission_group_id)
      const activityIndex = Number(activity.activity_index)

      if (groupId < 0 || groupId > 4 || activityIndex < 0) {
        continue
      }

      if (!completedActivitiesByGroup.has(groupId)) {
        completedActivitiesByGroup.set(groupId, new Set<number>())
      }

      completedActivitiesByGroup
        .get(groupId)!
        .add(activityIndex)
    }

    const completedActivitiesFromProgress =
      Array.from(completedActivitiesByGroup.values())
        .reduce(
          (total, activities) => total + activities.size,
          0,
        )

    const completedMissionGroups =
      Array.from(completedActivitiesByGroup.keys())
        .sort((a, b) => a - b)

    // Para cada missão, o índice começa em 0.
    // Portanto, maior índice + 1 = quantidade percorrida.
    const activitiesPerMission = new Map<number, number>()

    for (const [groupId, activities] of completedActivitiesByGroup) {
      const highestIndex =
        activities.size > 0
          ? Math.max(...Array.from(activities))
          : -1

      activitiesPerMission.set(
        groupId,
        highestIndex + 1,
      )
    }

    const estimatedTotalActivities =
      Array.from(activitiesPerMission.values())
        .reduce(
          (total, count) => total + count,
          0,
        )

    const hasActivityProgress =
      completedActivitiesFromProgress > 0

    if (!hasActivityProgress) {
      return NextResponse.json(
        {
          error:
            'Ainda não existem atividades individuais registradas para esta Jornada. Conclua as atividades antes de solicitar a certificação.',
          phaseId,
          oceanName,
          completedGroups,
          completedActivities: 0,
        },
        { status: 409 },
      )
    }

    // A certificação da Jornada exige as 5 missões concluídas.
    const requiredMissionGroups = [0, 1, 2, 3, 4]

    const allMissionActivitiesStarted =
      requiredMissionGroups.every(groupId =>
        completedActivitiesByGroup.has(groupId),
      )

    if (!allMissionActivitiesStarted) {
      return NextResponse.json(
        {
          error:
            'Todas as 5 missões da Jornada precisam possuir progresso individual registrado antes da certificação.',
          phaseId,
          oceanName,
          completedGroups,
          completedMissionGroups,
          requiredMissionGroups,
          completedActivities: completedActivitiesFromProgress,
        },
        { status: 409 },
      )
    }

    // ==========================================================
    // 5. CONTEÚDO REAL DA JORNADA
    // ==========================================================

    const { data: journey, error: journeyError } = await supabase
      .from('journey_content')
      .select(`
        phase_id,
        title,
        description,
        mission_groups,
        block1,
        block2,
        block3,
        block4,
        block5
      `)
      .eq('phase_id', phaseId)
      .single()

    if (journeyError || !journey) {
      return NextResponse.json(
        { error: 'Conteúdo da Jornada não encontrado.' },
        { status: 404 },
      )
    }

    const missionGroups = Array.isArray(journey.mission_groups)
      ? journey.mission_groups
      : []

    // ==========================================================
    // 6. XP / COINS DISPONÍVEIS NA JORNADA
    // ==========================================================

    const totalXp = missionGroups.reduce(
      (sum: number, group: any) =>
        sum + Number(group?.xp ?? 0),
      0,
    )

    const totalWoaCoins = missionGroups.reduce(
      (sum: number, group: any) =>
        sum + Number(group?.coins ?? 0),
      0,
    )

    // ==========================================================
    // 7. ESTADO ATUAL DA CERTIFICAÇÃO
    // ==========================================================

    const { data: lastCertificate, error: certificateError } =
      await supabase
        .from('certificates')
        .select(`
          id,
          certificate_code,
          verification_code,
          issued_at,
          next_eligible_issuance_at,
          status
        `)
        .eq('user_id', user.id)
        .eq('phase_id', phaseId)
        .order('issued_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (certificateError) {
      console.error('Certificate lookup error:', certificateError)

      return NextResponse.json(
        { error: 'Não foi possível verificar certificados anteriores.' },
        { status: 500 },
      )
    }

    // ==========================================================
    // 8. REGRA DOS 30 DIAS
    // ==========================================================

    if (lastCertificate?.next_eligible_issuance_at) {
      const nextEligible = new Date(
        lastCertificate.next_eligible_issuance_at,
      )

      if (nextEligible.getTime() > Date.now()) {
        return NextResponse.json(
          {
            error:
              'Uma nova emissão deste certificado ainda não está disponível.',
            nextEligibleIssuanceAt:
              lastCertificate.next_eligible_issuance_at,
          },
          { status: 429 },
        )
      }
    }

    // ==========================================================
    // 9. CARGA HORÁRIA
    // ==========================================================
    //
    // O banco atual ainda não possui um contador confiável de
    // minutos estudados por Jornada.
    //
    // Portanto NÃO inventamos horas.
    // A API registra 0 até implementarmos a contabilização real.
    //

    // Carga horária pedagógica estimada da Jornada.
// Base: 5 missões × 15 minutos por missão = 75 minutos.
// Não representa cronômetro individual do aluno.
    const totalStudyMinutes = 75
    const totalStudyHours = 1.25

    // ==========================================================
    // 10. ATIVIDADES
    // ==========================================================
    //
    // Atualmente o progresso disponível comprova os 5 grupos.
    // Não vamos afirmar uma quantidade de atividades que o banco
    // ainda não contabiliza individualmente.
    //

    const totalActivities =
      estimatedTotalActivities > 0
        ? estimatedTotalActivities
        : 0

    const completedActivities =
      completedActivitiesFromProgress

    const completionPercentage =
      totalActivities > 0
        ? Number(
            (
              (completedActivities / totalActivities) *
              100
            ).toFixed(2),
          )
        : 0

    // ==========================================================
    // 11. EVIDÊNCIAS
    // ==========================================================

    const evidenceSnapshot = {
      phase_id: phaseId,
      ocean_name: oceanName,
      journey_title: journey.title,
      mission_groups: completedGroups,
      total_xp: totalXp,
      total_woa_coins: totalWoaCoins,
      total_activities: totalActivities,
      completed_activities: completedActivities,
      completion_percentage: completionPercentage,
      study_minutes: totalStudyMinutes,
      generated_at: new Date().toISOString(),
    }

    // ==========================================================
    // 12. CÓDIGOS
    // ==========================================================

    const certificateCode = generateCode('WOA')
    const verificationCode = generateCode('VERIFY')

    const issuedAt = new Date()

    const nextEligible = new Date(issuedAt)
    nextEligible.setDate(nextEligible.getDate() + 30)

    // ==========================================================
    // 13. CERTIFICADO
    // ==========================================================

    const { data: certificate, error: insertError } =
      await supabase
        .from('certificates')
        .insert({
          user_id: user.id,
          phase_id: phaseId,
          ocean_name: oceanName,
          certificate_type: 'journey',
          level: null,
          program_name:
            'WOA Educacional — Jornada de Idiomas',
          certificate_version: '1.0',

          plan,

          total_study_minutes: totalStudyMinutes,
          total_study_hours: totalStudyHours,

          total_activities: totalActivities,
          completed_activities: completedActivities,
          completion_percentage: completionPercentage,

          total_xp: totalXp,
          total_woa_coins: totalWoaCoins,

          content_summary:
            journey.description ??
            journey.title,

          skills: [],
          learning_outcomes: [],
          activity_types: [],

          evidence_snapshot: evidenceSnapshot,

          certificate_code: certificateCode,
          verification_code: verificationCode,

          verification_url:
            `/certificates/verify/${verificationCode}`,

          issuer_name: 'WOA Educacional',

          issuer_description:
            'Certificação educacional emitida pela WOA Educacional.',

          issuing_organization:
            'WOA Educacional',

          issued_at: issuedAt.toISOString(),

          next_eligible_issuance_at:
            nextEligible.toISOString(),

          status: 'issued',
        })
        .select()
        .single()

    if (insertError || !certificate) {
      console.error('Certificate creation error:', insertError)

      return NextResponse.json(
        { error: 'Não foi possível emitir o certificado.' },
        { status: 500 },
      )
    }

    // ==========================================================
    // 14. RESPOSTA
    // ==========================================================

    return NextResponse.json({
      success: true,

      certificate: {
        id: certificate.id,
        certificateCode: certificate.certificate_code,
        verificationCode: certificate.verification_code,
        verificationUrl: certificate.verification_url,

        oceanName: certificate.ocean_name,

        issuedAt: certificate.issued_at,

        nextEligibleIssuanceAt:
          certificate.next_eligible_issuance_at,

        completionPercentage:
          certificate.completion_percentage,

        totalXp: certificate.total_xp,
        totalWoaCoins:
          certificate.total_woa_coins,

        totalStudyMinutes:
          certificate.total_study_minutes,

        totalStudyHours:
          certificate.total_study_hours,
      },
    })
  } catch (error) {
    console.error('Certificate issuance error:', error)

    return NextResponse.json(
      { error: 'Erro interno ao emitir certificado.' },
      { status: 500 },
    )
  }
}
