import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Midtrans SNAP webhook.
 * Status codes: 200 (success), 201 (success but card is not captured yet), 202 (challenge)
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const order_id = body.order_id as string
  const status = body.transaction_status as string
  const fraud = body.fraud_status as string | undefined

  if (!order_id) return NextResponse.json({ error: 'no order_id' }, { status: 400 })

  // Midtrans mengirim ulang notifikasi — idempoten via order_id unik
  let payStatus: 'success' | 'failed' | 'expired' = 'failed'
  if (status === 'capture' || status === 'settlement') {
    if (fraud && fraud !== 'accept') payStatus = 'failed'
    else payStatus = 'success'
  } else if (status === 'pending') {
    return NextResponse.json({ ok: true, note: 'pending' })
  } else if (status === 'expire' || status === 'cancel' || status === 'deny') {
    payStatus = 'expired'
  }

  const supabase = createAdminClient()

  const { data: payment } = await supabase
    .from('payments').select('id,couple_id').eq('order_id', order_id).single()

  if (!payment) return NextResponse.json({ error: 'order not found' }, { status: 404 })

  await supabase.from('payments')
    .update({ status: payStatus })
    .eq('id', payment.id)

  if (payStatus === 'success') {
    await supabase.from('couples')
      .update({ plan: 'premium' })
      .eq('id', payment.couple_id)
  }

  return NextResponse.json({ ok: true })
}
