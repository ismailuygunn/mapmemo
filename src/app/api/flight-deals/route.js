// NAVISO — Flight Deals v6
// Destination cards with REAL Amadeus prices + booking platform deeplinks
// Shows cheapest real price per destination, links to Skyscanner/Google/Enuygun/Turna
import { NextResponse } from 'next/server'

// ═══════════════════════════════════════
// AMADEUS AUTH
// ═══════════════════════════════════════
let cachedToken = null
let tokenExpiry = 0
let useTestApi = false

async function getAmadeusToken() {
    if (cachedToken && Date.now() < tokenExpiry) return cachedToken

    // Try production first
    try {
        const res = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: process.env.AMADEUS_API_KEY,
                client_secret: process.env.AMADEUS_API_SECRET,
            }),
        })
        if (res.ok) {
            const data = await res.json()
            cachedToken = data.access_token
            tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
            useTestApi = false
            return cachedToken
        }
    } catch { }

    // Fallback to test
    const testRes = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: process.env.AMADEUS_API_KEY,
            client_secret: process.env.AMADEUS_API_SECRET,
        }),
    })
    if (!testRes.ok) throw new Error('Amadeus auth failed')
    const data = await testRes.json()
    cachedToken = data.access_token
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
    useTestApi = true
    return cachedToken
}

// ═══════════════════════════════════════
// DESTINATION DATABASE
// ═══════════════════════════════════════
const DESTINATIONS = [
    // DOMESTIC
    { code: 'AYT', city: 'Antalya', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 1 },
    { code: 'ADB', city: 'İzmir', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 1 },
    { code: 'TZX', city: 'Trabzon', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 1.5 },
    { code: 'DLM', city: 'Dalaman', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 1 },
    { code: 'BJV', city: 'Bodrum', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 1 },
    { code: 'GZT', city: 'Gaziantep', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 1.5 },
    { code: 'ESB', city: 'Ankara', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 1 },
    // VISA-FREE
    { code: 'SJJ', city: 'Saraybosna', country: 'Bosna', visa: 'visa_free', emoji: '🇧🇦', flightH: 1.5 },
    { code: 'TBS', city: 'Tiflis', country: 'Gürcistan', visa: 'visa_free', emoji: '🇬🇪', flightH: 2 },
    { code: 'GYD', city: 'Bakü', country: 'Azerbaycan', visa: 'visa_free', emoji: '🇦🇿', flightH: 3 },
    { code: 'SKP', city: 'Üsküp', country: 'K. Makedonya', visa: 'visa_free', emoji: '🇲🇰', flightH: 1.5 },
    { code: 'PRN', city: 'Priştine', country: 'Kosova', visa: 'visa_free', emoji: '🇽🇰', flightH: 1.5 },
    { code: 'BEG', city: 'Belgrad', country: 'Sırbistan', visa: 'visa_free', emoji: '🇷🇸', flightH: 1.5 },
    { code: 'SOF', city: 'Sofya', country: 'Bulgaristan', visa: 'visa_free', emoji: '🇧🇬', flightH: 1 },
    { code: 'OTP', city: 'Bükreş', country: 'Romanya', visa: 'visa_free', emoji: '🇷🇴', flightH: 1.5 },
    { code: 'DOH', city: 'Doha', country: 'Katar', visa: 'visa_free', emoji: '🇶🇦', flightH: 4.5 },
    { code: 'AMM', city: 'Amman', country: 'Ürdün', visa: 'visa_free', emoji: '🇯🇴', flightH: 2 },
    { code: 'BKK', city: 'Bangkok', country: 'Tayland', visa: 'visa_free', emoji: '🇹🇭', flightH: 9.5 },
    // VISA ON ARRIVAL
    { code: 'DXB', city: 'Dubai', country: 'BAE', visa: 'visa_on_arrival', emoji: '🇦🇪', flightH: 4 },
    { code: 'SSH', city: 'Sharm El-Sheikh', country: 'Mısır', visa: 'visa_on_arrival', emoji: '🇪🇬', flightH: 2 },
    // SCHENGEN
    { code: 'CDG', city: 'Paris', country: 'Fransa', visa: 'visa_required', emoji: '🇫🇷', flightH: 3.5 },
    { code: 'FCO', city: 'Roma', country: 'İtalya', visa: 'visa_required', emoji: '🇮🇹', flightH: 2.5 },
    { code: 'BCN', city: 'Barselona', country: 'İspanya', visa: 'visa_required', emoji: '🇪🇸', flightH: 3.5 },
    { code: 'AMS', city: 'Amsterdam', country: 'Hollanda', visa: 'visa_required', emoji: '🇳🇱', flightH: 3.5 },
    { code: 'BER', city: 'Berlin', country: 'Almanya', visa: 'visa_required', emoji: '🇩🇪', flightH: 3 },
    { code: 'VIE', city: 'Viyana', country: 'Avusturya', visa: 'visa_required', emoji: '🇦🇹', flightH: 2.5 },
    { code: 'PRG', city: 'Prag', country: 'Çekya', visa: 'visa_required', emoji: '🇨🇿', flightH: 2.5 },
    { code: 'BUD', city: 'Budapeşte', country: 'Macaristan', visa: 'visa_required', emoji: '🇭🇺', flightH: 2 },
    { code: 'ATH', city: 'Atina', country: 'Yunanistan', visa: 'visa_required', emoji: '🇬🇷', flightH: 1.5 },
    { code: 'LHR', city: 'Londra', country: 'İngiltere', visa: 'visa_required', emoji: '🇬🇧', flightH: 4 },
    { code: 'MXP', city: 'Milano', country: 'İtalya', visa: 'visa_required', emoji: '🇮🇹', flightH: 2.5 },
]

const VISA_LABELS = {
    domestic: '🏠 Yurtiçi',
    visa_free: '✅ Vizesiz',
    visa_on_arrival: '🛬 Kapıda Vize',
    visa_required: '📋 Vize Gerekli',
}

const VISA_COLORS = {
    domestic: '#6366F1', visa_free: '#22C55E',
    visa_on_arrival: '#F59E0B', visa_required: '#EF4444',
}

// ═══════════════════════════════════════
// DEEPLINK BUILDERS (verified working formats)
// ═══════════════════════════════════════
function buildDeeplinks(origin, dest, departDate, returnDate) {
    // Skyscanner YYMMDD format
    const skDep = departDate.replace(/-/g, '').slice(2)
    const skRet = returnDate ? returnDate.replace(/-/g, '').slice(2) : ''
    const skReturn = skRet ? `/${skRet}` : ''

    // Google Flights
    const gfReturn = returnDate ? `+return+${returnDate}` : ''

    // Enuygun
    const enReturn = returnDate ? `&donus=${returnDate}` : ''

    // Turna
    const tReturn = returnDate ? `&donus=${returnDate}` : ''

    return [
        {
            name: 'Skyscanner',
            icon: '🔍',
            color: '#0770e3',
            url: `https://www.skyscanner.com.tr/transport/flights/${origin.toLowerCase()}/${dest.toLowerCase()}/${skDep}${skReturn}/?adults=1&currency=TRY`,
        },
        {
            name: 'Google Flights',
            icon: '✈️',
            color: '#4285F4',
            url: `https://www.google.com/travel/flights?q=Flights+to+${dest}+from+${origin}+on+${departDate}${gfReturn}&curr=TRY&hl=tr`,
        },
        {
            name: 'Enuygun',
            icon: '🎫',
            color: '#FF3366',
            url: `https://www.enuygun.com/ucak-bileti/?gidis=${departDate}${enReturn}&kpiata=${origin}&vpiata=${dest}&yetiskin=1`,
        },
        {
            name: 'Turna',
            icon: '🛫',
            color: '#FF6B00',
            url: `https://www.turna.com/ucak-bileti?kpiata=${origin}&vpiata=${dest}&gidis=${departDate}${tReturn}&yetiskin=1&sinif=ekonomi`,
        },
    ]
}

// ═══════════════════════════════════════
// DATE HELPER
// ═══════════════════════════════════════
function generateDates(month, duration, pattern) {
    const now = new Date()
    const dayMs = 86400000
    let startSearch, endSearch

    if (month && month !== 'any') {
        const [y, m] = month.split('-').map(Number)
        startSearch = new Date(y, m - 1, 1)
        endSearch = new Date(y, m, 0)
        if (startSearch < now) startSearch = new Date(now.getTime() + dayMs)
    } else {
        startSearch = new Date(now.getTime() + 7 * dayMs)
        endSearch = new Date(now.getTime() + 90 * dayMs)
    }

    const dur = parseInt(duration) || 4
    const dates = []

    if (pattern === 'fri_sun') {
        let d = new Date(startSearch)
        while (d <= endSearch && dates.length < 4) {
            if (d.getDay() === 5) {
                const ret = new Date(d.getTime() + 2 * dayMs)
                dates.push({ depart: fmt(d), ret: fmt(ret), label: 'Cuma→Pazar' })
            }
            d = new Date(d.getTime() + dayMs)
        }
    } else {
        const step = Math.max(7, Math.floor((endSearch - startSearch) / dayMs / 4))
        let d = new Date(startSearch)
        while (d <= endSearch && dates.length < 4) {
            const ret = new Date(d.getTime() + dur * dayMs)
            if (ret <= endSearch) dates.push({ depart: fmt(d), ret: fmt(ret), label: `${dur} gün` })
            d = new Date(d.getTime() + step * dayMs)
        }
    }
    return dates
}

function fmt(d) { return d.toISOString().split('T')[0] }

// ═══════════════════════════════════════
// FETCH REAL PRICE FROM AMADEUS
// ═══════════════════════════════════════
async function getLowestPrice(token, origin, dest, departDate, returnDate) {
    const baseUrl = useTestApi ? 'https://test.api.amadeus.com' : 'https://api.amadeus.com'

    const params = new URLSearchParams({
        originLocationCode: origin,
        destinationLocationCode: dest,
        departureDate: departDate,
        adults: '1',
        currencyCode: 'TRY',
        max: '3', // Only need cheapest few
        nonStop: 'false',
    })
    if (returnDate) params.set('returnDate', returnDate)

    try {
        const res = await fetch(`${baseUrl}/v2/shopping/flight-offers?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) return null

        const data = await res.json()
        if (!data.data || data.data.length === 0) return null

        // Get cheapest offer
        const cheapest = data.data[0]
        const price = Math.round(parseFloat(cheapest.price?.grandTotal || cheapest.price?.total || 0))

        // Get airline info
        const mainCarrier = cheapest.itineraries?.[0]?.segments?.[0]?.carrierCode || 'TK'
        const stops = (cheapest.itineraries?.[0]?.segments?.length || 1) - 1

        return { price, airline: mainCarrier, stops, seats: cheapest.numberOfBookableSeats }
    } catch (err) {
        console.error(`Price fetch failed for ${dest}:`, err.message)
        return null
    }
}

// ═══════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const origin = searchParams.get('origin') || 'IST'
        const duration = searchParams.get('duration') || '4'
        const month = searchParams.get('month') || 'any'
        const pattern = searchParams.get('pattern') || 'any'
        const visaFilter = searchParams.get('visa') || 'all'
        const maxBudget = parseInt(searchParams.get('budget') || '0')

        // Generate dates
        const dateRanges = generateDates(month, duration, pattern)
        if (dateRanges.length === 0) {
            return NextResponse.json({ deals: [], error: 'No valid dates' })
        }

        const dateRange = dateRanges[0]

        // Filter destinations
        let dests = [...DESTINATIONS].filter(d => d.code !== origin)
        if (visaFilter === 'visa_free') dests = dests.filter(d => ['visa_free', 'domestic'].includes(d.visa))
        else if (visaFilter === 'visa_on_arrival') dests = dests.filter(d => ['visa_free', 'visa_on_arrival', 'domestic'].includes(d.visa))

        // Get Amadeus token
        const token = await getAmadeusToken()

        // Fetch real prices for all destinations (parallel, batched)
        const batchSize = 5
        const allDeals = []

        for (let i = 0; i < dests.length; i += batchSize) {
            const batch = dests.slice(i, i + batchSize)
            const results = await Promise.allSettled(
                batch.map(dest =>
                    getLowestPrice(token, origin, dest.code, dateRange.depart, dateRange.ret)
                        .then(priceData => ({ dest, priceData }))
                )
            )

            for (const result of results) {
                if (result.status === 'fulfilled' && result.value.priceData) {
                    const { dest, priceData } = result.value
                    if (maxBudget > 0 && priceData.price > maxBudget) continue

                    allDeals.push({
                        destination: dest.code,
                        city: dest.city,
                        country: dest.country,
                        emoji: dest.emoji,
                        flightHours: dest.flightH,
                        visa: {
                            type: dest.visa,
                            label: VISA_LABELS[dest.visa],
                            color: VISA_COLORS[dest.visa],
                        },
                        // REAL price from Amadeus
                        price: priceData.price,
                        priceFormatted: new Intl.NumberFormat('tr-TR').format(priceData.price),
                        airline: priceData.airline,
                        stops: priceData.stops,
                        seatsLeft: priceData.seats,
                        // Travel dates
                        departDate: dateRange.depart,
                        returnDate: dateRange.ret,
                        tripLabel: dateRange.label,
                        // Booking platform links
                        platforms: buildDeeplinks(origin, dest.code, dateRange.depart, dateRange.ret),
                    })
                }
            }
        }

        // Sort by price
        allDeals.sort((a, b) => a.price - b.price)

        return NextResponse.json({
            deals: allDeals,
            origin,
            departDate: dateRange.depart,
            returnDate: dateRange.ret,
            total: allDeals.length,
            scannedAt: new Date().toISOString(),
            isTestData: useTestApi,
        })
    } catch (err) {
        console.error('Flight deals error:', err)
        return NextResponse.json({ deals: [], error: err.message }, { status: 500 })
    }
}
