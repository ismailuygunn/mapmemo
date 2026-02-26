// Currency Exchange API — real-time rates for travel budgeting
// Free API: exchangerate.host (no key required for basic use)
import { NextResponse } from 'next/server'

const CACHE_DURATION = 3600 // 1 hour
let cachedRates = null
let cacheTime = 0

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const from = (searchParams.get('from') || 'TRY').toUpperCase()
        const to = (searchParams.get('to') || 'EUR').toUpperCase()
        const amount = parseFloat(searchParams.get('amount') || '1')

        // Check cache
        const now = Date.now()
        if (cachedRates && (now - cacheTime) < CACHE_DURATION * 1000) {
            const rate = calculateRate(cachedRates, from, to)
            return NextResponse.json({
                from, to, amount,
                rate,
                result: Math.round(amount * rate * 100) / 100,
                cached: true,
            })
        }

        // Fetch latest rates (base: USD)
        const res = await fetch('https://open.er-api.com/v6/latest/USD', {
            next: { revalidate: 3600 },
        })

        if (!res.ok) {
            // Fallback: use approximate rates
            return NextResponse.json({
                from, to, amount,
                rate: getFallbackRate(from, to),
                result: Math.round(amount * getFallbackRate(from, to) * 100) / 100,
                fallback: true,
            })
        }

        const data = await res.json()
        cachedRates = data.rates
        cacheTime = now

        const rate = calculateRate(cachedRates, from, to)

        // Return popular travel currencies too
        const popularCurrencies = ['TRY', 'EUR', 'USD', 'GBP', 'JPY', 'AED', 'THB']
        const popular = {}
        for (const curr of popularCurrencies) {
            if (cachedRates[curr] && cachedRates[from]) {
                popular[curr] = {
                    code: curr,
                    rate: Math.round((cachedRates[curr] / cachedRates[from]) * 10000) / 10000,
                    symbol: getCurrencySymbol(curr),
                    name: getCurrencyName(curr),
                }
            }
        }

        return NextResponse.json({
            from, to, amount,
            rate,
            result: Math.round(amount * rate * 100) / 100,
            popular,
            updated: data.time_last_update_utc || new Date().toISOString(),
        })
    } catch (err) {
        console.error('Currency API error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

function calculateRate(rates, from, to) {
    if (!rates[from] || !rates[to]) return 1
    return rates[to] / rates[from]
}

function getFallbackRate(from, to) {
    const approx = { TRY: 36, EUR: 0.92, USD: 1, GBP: 0.79, JPY: 150, AED: 3.67, THB: 34 }
    const fromUsd = approx[from] || 1
    const toUsd = approx[to] || 1
    return toUsd / fromUsd
}

function getCurrencySymbol(code) {
    const symbols = { TRY: '₺', EUR: '€', USD: '$', GBP: '£', JPY: '¥', AED: 'د.إ', THB: '฿' }
    return symbols[code] || code
}

function getCurrencyName(code) {
    const names = {
        TRY: 'Türk Lirası', EUR: 'Euro', USD: 'ABD Doları', GBP: 'İngiliz Sterlini',
        JPY: 'Japon Yeni', AED: 'BAE Dirhemi', THB: 'Tayland Bahtı',
    }
    return names[code] || code
}
