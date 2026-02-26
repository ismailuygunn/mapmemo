// Price Alert CRON — Checks flight prices and sends alerts
// Deploy as Vercel CRON: vercel.json → crons: [{ path: "/api/cron/check-prices", schedule: "0 9 * * *" }]
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request) {
    try {
        // Verify CRON secret (Vercel sends this)
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // Allow in development
            if (process.env.NODE_ENV === 'production') {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )

        // Get active price alerts
        const { data: alerts } = await supabase
            .from('price_alerts')
            .select('*')
            .eq('is_active', true)

        if (!alerts?.length) {
            return NextResponse.json({ checked: 0, message: 'No active alerts' })
        }

        let triggered = 0
        for (const alert of alerts) {
            try {
                // Check current price
                const params = new URLSearchParams({
                    origin: alert.origin_code,
                    destination: alert.destination_code,
                    departure: alert.departure_date,
                    adults: '2',
                    currency: alert.currency || 'TRY',
                })
                if (alert.return_date) params.append('return', alert.return_date)

                const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/flights?${params}`)
                const data = await res.json()

                if (data.available && data.flights?.length > 0) {
                    const lowestPrice = Math.min(...data.flights.map(f => parseFloat(f.price)))

                    // Update last checked price
                    await supabase
                        .from('price_alerts')
                        .update({
                            last_price: lowestPrice,
                            last_checked: new Date().toISOString(),
                        })
                        .eq('id', alert.id)

                    // Check if price dropped below target
                    if (alert.target_price && lowestPrice <= alert.target_price) {
                        triggered++
                        await supabase
                            .from('price_alerts')
                            .update({ is_triggered: true })
                            .eq('id', alert.id)
                    }
                }
            } catch (e) {
                console.error(`Alert ${alert.id} check failed:`, e)
            }
        }

        return NextResponse.json({
            checked: alerts.length,
            triggered,
            timestamp: new Date().toISOString(),
        })
    } catch (err) {
        console.error('CRON price check error:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
