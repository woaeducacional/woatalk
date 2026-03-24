import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { createClient } from '@supabase/supabase-js'

const RESTORE_MS = 8 * 60 * 60 * 1000 // 8 hours
const SLOT_KEYS = ['energy_slot_1', 'energy_slot_2', 'energy_slot_3'] as const

function normalize(slots: (string | null)[]): (string | null)[] {
  const cutoff = Date.now() - RESTORE_MS
  return slots.map(s => (!s || new Date(s).getTime() <= cutoff ? null : s))
}

function chargesFromSlots(normalizedSlots: (string | null)[]): number {
  return normalizedSlots.filter(s => s === null).length
}

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.id) return NextResponse.json({ charges: 3, slots: [null, null, null] })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('users')
    .select('energy_slot_1, energy_slot_2, energy_slot_3')
    .eq('id', token.id as string)
    .maybeSingle()

  if (error) {
    console.error('[energy GET] supabase error:', error.message)
    return NextResponse.json({ charges: 3, slots: [null, null, null] })
  }

  if (!data) return NextResponse.json({ charges: 3, slots: [null, null, null] })

  const raw = [data.energy_slot_1 ?? null, data.energy_slot_2 ?? null, data.energy_slot_3 ?? null]
  const slots = normalize(raw)

  return NextResponse.json({ charges: chargesFromSlots(slots), slots })
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const userId = token.id as string

  const { data, error: selectError } = await supabase
    .from('users')
    .select('energy_slot_1, energy_slot_2, energy_slot_3')
    .eq('id', userId)
    .maybeSingle()

  if (selectError) {
    console.error('[energy POST] supabase select error:', selectError.message)
    return NextResponse.json({ error: selectError.message }, { status: 500 })
  }

  if (!data) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const raw = [data.energy_slot_1 ?? null, data.energy_slot_2 ?? null, data.energy_slot_3 ?? null]
  const slots = normalize(raw)
  const charges = chargesFromSlots(slots)

  if (charges === 0) {
    // Find earliest restore time for feedback
    const restoreAt = raw.reduce<string | null>((earliest, s) => {
      if (!s) return earliest
      const t = new Date(s).getTime() + RESTORE_MS
      if (!earliest) return new Date(t).toISOString()
      return t < new Date(earliest).getTime() ? new Date(t).toISOString() : earliest
    }, null)
    return NextResponse.json({ charges: 0, slots, consumed: false, restoreAt })
  }

  // Find first available slot (null = available)
  const idx = slots.findIndex(s => s === null)
  const now = new Date().toISOString()
  await supabase
    .from('users')
    .update({ [SLOT_KEYS[idx]]: now })
    .eq('id', userId)

  const newSlots = [...slots]
  newSlots[idx] = now

  return NextResponse.json({
    charges: charges - 1,
    slots: newSlots,
    consumed: true,
  })
}
