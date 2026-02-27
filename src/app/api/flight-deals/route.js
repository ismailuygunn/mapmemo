// NAVISO — Flight Deals Scanner v2
// Multi-source: Amadeus + Kiwi.com (Tequila)
// Supports: custom origin, duration, month, weekend patterns
import { NextResponse } from 'next/server'

// ═══════════════════════════════════════
// VISA INFO (Turkish passport)
// ═══════════════════════════════════════
const VISA_INFO = {
    'SAW': { city: 'Sabiha Gökçen', visa: 'domestic' },
    'AYT': { city: 'Antalya', visa: 'domestic' },
    'ADB': { city: 'İzmir', visa: 'domestic' },
    'ESB': { city: 'Ankara', visa: 'domestic' },
    'TZX': { city: 'Trabzon', visa: 'domestic' },
    'DLM': { city: 'Dalaman', visa: 'domestic' },
    'BJV': { city: 'Bodrum', visa: 'domestic' },
    'GZT': { city: 'Gaziantep', visa: 'domestic' },
    'ASR': { city: 'Kayseri', visa: 'domestic' },
    'SJJ': { city: 'Saraybosna', country: 'Bosna Hersek', visa: 'visa_free', maxDays: 90 },
    'TBS': { city: 'Tiflis', country: 'Gürcistan', visa: 'visa_free', maxDays: 365 },
    'GYD': { city: 'Bakü', country: 'Azerbaycan', visa: 'visa_free', maxDays: 90 },
    'SKP': { city: 'Üsküp', country: 'K. Makedonya', visa: 'visa_free', maxDays: 90 },
    'PRN': { city: 'Priştine', country: 'Kosova', visa: 'visa_free', maxDays: 90 },
    'TGD': { city: 'Podgorica', country: 'Karadağ', visa: 'visa_free', maxDays: 90 },
    'BEG': { city: 'Belgrad', country: 'Sırbistan', visa: 'visa_free', maxDays: 90 },
    'SOF': { city: 'Sofya', country: 'Bulgaristan', visa: 'visa_free', maxDays: 90 },
    'KUL': { city: 'Kuala Lumpur', country: 'Malezya', visa: 'visa_free', maxDays: 90 },
    'BKK': { city: 'Bangkok', country: 'Tayland', visa: 'visa_free', maxDays: 30 },
    'ICN': { city: 'Seul', country: 'Güney Kore', visa: 'visa_free', maxDays: 90 },
    'NRT': { city: 'Tokyo', country: 'Japonya', visa: 'visa_free', maxDays: 90 },
    'GRU': { city: 'São Paulo', country: 'Brezilya', visa: 'visa_free', maxDays: 90 },
    'EZE': { city: 'Buenos Aires', country: 'Arjantin', visa: 'visa_free', maxDays: 90 },
    'JNB': { city: 'Johannesburg', country: 'Güney Afrika', visa: 'visa_free', maxDays: 30 },
    'AMM': { city: 'Amman', country: 'Ürdün', visa: 'visa_free', maxDays: 90 },
    'TIA': { city: 'Tiran', country: 'Arnavutluk', visa: 'visa_free', maxDays: 90 },
    'KIV': { city: 'Kişinev', country: 'Moldova', visa: 'visa_free', maxDays: 90 },
    'DOH': { city: 'Doha', country: 'Katar', visa: 'visa_free', maxDays: 30 },
    'MNL': { city: 'Manila', country: 'Filipinler', visa: 'visa_free', maxDays: 30 },
    'CMN': { city: 'Kazablanka', country: 'Fas', visa: 'visa_free', maxDays: 90 },
    'TUN': { city: 'Tunus', country: 'Tunus', visa: 'visa_free', maxDays: 90 },
    'DXB': { city: 'Dubai', country: 'BAE', visa: 'visa_on_arrival', maxDays: 30 },
    'SSH': { city: 'Sharm el-Sheikh', country: 'Mısır', visa: 'visa_on_arrival', maxDays: 30 },
    'CMB': { city: 'Kolombo', country: 'Sri Lanka', visa: 'visa_on_arrival', maxDays: 30 },
    'MLE': { city: 'Maldivler', country: 'Maldivler', visa: 'visa_on_arrival', maxDays: 30 },
    'AUH': { city: 'Abu Dhabi', country: 'BAE', visa: 'visa_on_arrival', maxDays: 30 },
    'DPS': { city: 'Bali', country: 'Endonezya', visa: 'visa_on_arrival', maxDays: 30 },
    'NBO': { city: 'Nairobi', country: 'Kenya', visa: 'visa_on_arrival', maxDays: 90 },
    'DEL': { city: 'Delhi', country: 'Hindistan', visa: 'e_visa' },
    'SIN': { city: 'Singapur', country: 'Singapur', visa: 'e_visa' },
    'CDG': { city: 'Paris', country: 'Fransa', visa: 'visa_required', note: 'Schengen' },
    'FCO': { city: 'Roma', country: 'İtalya', visa: 'visa_required', note: 'Schengen' },
    'BCN': { city: 'Barselona', country: 'İspanya', visa: 'visa_required', note: 'Schengen' },
    'AMS': { city: 'Amsterdam', country: 'Hollanda', visa: 'visa_required', note: 'Schengen' },
    'BER': { city: 'Berlin', country: 'Almanya', visa: 'visa_required', note: 'Schengen' },
    'MUC': { city: 'Münih', country: 'Almanya', visa: 'visa_required', note: 'Schengen' },
    'VIE': { city: 'Viyana', country: 'Avusturya', visa: 'visa_required', note: 'Schengen' },
    'PRG': { city: 'Prag', country: 'Çekya', visa: 'visa_required', note: 'Schengen' },
    'BUD': { city: 'Budapeşte', country: 'Macaristan', visa: 'visa_required', note: 'Schengen' },
    'ATH': { city: 'Atina', country: 'Yunanistan', visa: 'visa_required', note: 'Schengen' },
    'LIS': { city: 'Lizbon', country: 'Portekiz', visa: 'visa_required', note: 'Schengen' },
    'WAW': { city: 'Varşova', country: 'Polonya', visa: 'visa_required', note: 'Schengen' },
    'CPH': { city: 'Kopenhag', country: 'Danimarka', visa: 'visa_required', note: 'Schengen' },
    'ARN': { city: 'Stockholm', country: 'İsveç', visa: 'visa_required', note: 'Schengen' },
    'LHR': { city: 'Londra', country: 'İngiltere', visa: 'visa_required', note: 'UK vizesi' },
    'JFK': { city: 'New York', country: 'ABD', visa: 'visa_required', note: 'B1/B2' },
    'LAX': { city: 'Los Angeles', country: 'ABD', visa: 'visa_required', note: 'B1/B2' },
    'MXP': { city: 'Milano', country: 'İtalya', visa: 'visa_required', note: 'Schengen' },
    'OTP': { city: 'Bükreş', country: 'Romanya', visa: 'visa_free', maxDays: 90 },
    'SAW': { city: 'İstanbul SAW', visa: 'domestic' },
}

const VISA_LABELS = {
    domestic: { tr: '🏠 Yurtiçi', en: '🏠 Domestic', color: '#6366F1' },
    visa_free: { tr: '✅ Vizesiz', en: '✅ Visa-free', color: '#22C55E' },
    visa_on_arrival: { tr: '🛬 Kapıda Vize', en: '🛬 Visa on Arrival', color: '#F59E0B' },
    e_visa: { tr: '📱 E-Vize', en: '📱 E-Visa', color: '#3B82F6' },
    visa_required: { tr: '📋 Vize Gerekli', en: '📋 Visa Required', color: '#EF4444' },
}

const SCAN_DESTINATIONS = [
    'SJJ', 'TBS', 'GYD', 'SKP', 'PRN', 'TGD', 'BEG', 'SOF', 'TIA', 'KIV', 'CMN', 'TUN',
    'AMM', 'DOH', 'OTP', 'DXB', 'DPS', 'MLE', 'AUH', 'SSH', 'NBO',
    'BUD', 'PRG', 'ATH', 'BCN', 'FCO', 'CDG', 'AMS', 'BER', 'LIS', 'VIE', 'WAW', 'MUC', 'MXP',
    'BKK', 'KUL', 'ICN', 'NRT',
    'AYT', 'ADB', 'TZX', 'DLM', 'BJV', 'GZT', 'ASR', 'ESB',
    'LHR', 'JFK', 'LAX', 'SIN',
]

// ═══════════════════════════════════════
// DATE GENERATORS
// ═══════════════════════════════════════
function generateDates(month, duration, pattern) {
    const now = new Date()
    const dates = []

    // Determine start/end of search window
    let startSearch, endSearch
    if (month && month !== 'any') {
        const [y, m] = month.split('-').map(Number)
        startSearch = new Date(y, m - 1, 1)
        endSearch = new Date(y, m, 0) // last day of month
        if (startSearch < now) startSearch = new Date(now.getTime() + 86400000)
    } else {
        startSearch = new Date(now.getTime() + 7 * 86400000) // 1 week from now
        endSearch = new Date(now.getTime() + 90 * 86400000) // 3 months
    }

    const dur = parseInt(duration) || 4
    const dayMs = 86400000

    if (pattern === 'fri_sun') {
        // Friday evening → Sunday night (2 nights)
        let d = new Date(startSearch)
        while (d <= endSearch && dates.length < 6) {
            const dow = d.getDay()
            if (dow === 5) { // Friday
                const ret = new Date(d.getTime() + 2 * dayMs) // Sunday
                if (ret <= endSearch) dates.push({ depart: fmt(d), ret: fmt(ret), type: 'weekend', label: 'Cuma→Pazar' })
            }
            d = new Date(d.getTime() + dayMs)
        }
    } else if (pattern === 'sat_sun') {
        let d = new Date(startSearch)
        while (d <= endSearch && dates.length < 6) {
            if (d.getDay() === 6) {
                const ret = new Date(d.getTime() + dayMs)
                if (ret <= endSearch) dates.push({ depart: fmt(d), ret: fmt(ret), type: 'weekend', label: 'Cumartesi→Pazar' })
            }
            d = new Date(d.getTime() + dayMs)
        }
    } else if (pattern === 'sat_mon') {
        let d = new Date(startSearch)
        while (d <= endSearch && dates.length < 6) {
            if (d.getDay() === 6) {
                const ret = new Date(d.getTime() + 2 * dayMs) // Monday
                if (ret <= endSearch) dates.push({ depart: fmt(d), ret: fmt(ret), type: 'weekend', label: 'Cumartesi→Pazartesi' })
            }
            d = new Date(d.getTime() + dayMs)
        }
    } else {
        // Regular duration-based — pick diverse dates
        const step = Math.max(5, Math.floor((endSearch - startSearch) / dayMs / 8))
        let d = new Date(startSearch)
        while (d <= endSearch && dates.length < 8) {
            const ret = new Date(d.getTime() + dur * dayMs)
            if (ret <= endSearch) {
                const dow = d.getDay()
                const typeLabel = dow === 5 || dow === 6 ? 'weekend' : dow >= 1 && dow <= 3 ? 'midweek' : 'flexible'
                dates.push({ depart: fmt(d), ret: fmt(ret), type: typeLabel, label: `${dur} gün` })
            }
            d = new Date(d.getTime() + step * dayMs)
        }
    }
    return dates
}

function fmt(d) { return d.toISOString().split('T')[0] }

// ═══════════════════════════════════════
// AMADEUS API
// ═══════════════════════════════════════
let amadeusToken = null
let tokenExpiry = 0

async function getAmadeusToken() {
    if (amadeusToken && Date.now() < tokenExpiry) return amadeusToken
    const clientId = process.env.AMADEUS_API_KEY
    const clientSecret = process.env.AMADEUS_API_SECRET
    if (!clientId || !clientSecret) return null

    try {
        const res = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
        })
        if (!res.ok) return null
        const data = await res.json()
        amadeusToken = data.access_token
        tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
        return amadeusToken
    } catch { return null }
}

async function searchAmadeus(origin, dest, departDate, returnDate) {
    const token = await getAmadeusToken()
    if (!token) return null

    try {
        const params = new URLSearchParams({
            originLocationCode: origin,
            destinationLocationCode: dest,
            departureDate: departDate,
            returnDate: returnDate,
            adults: '1',
            currencyCode: 'TRY',
            max: '1',
            nonStop: 'false',
        })
        const res = await fetch(
            `https://test.api.amadeus.com/v2/shopping/flight-offers?${params}`,
            { headers: { Authorization: `Bearer ${token}` } }
        )
        if (!res.ok) return null
        const data = await res.json()
        const offer = data.data?.[0]
        if (!offer) return null

        return {
            price: parseFloat(offer.price.grandTotal || offer.price.total),
            currency: offer.price.currency,
            airlines: [...new Set(offer.itineraries.flatMap(i => i.segments.map(s => s.carrierCode)))],
            duration: offer.itineraries[0]?.duration,
            stops: (offer.itineraries[0]?.segments?.length || 1) - 1,
            source: 'amadeus',
            bookUrl: `https://www.google.com/travel/flights?q=Flights+from+${origin}+to+${dest}+on+${departDate}+return+${returnDate}&curr=TRY`,
        }
    } catch { return null }
}

// ═══════════════════════════════════════
// KIWI.COM (TEQUILA) API
// ═══════════════════════════════════════
async function searchKiwi(origin, dest, departDate, returnDate) {
    const apiKey = process.env.KIWI_API_KEY
    if (!apiKey) return null

    try {
        // Kiwi uses DD/MM/YYYY format
        const fmtKiwi = (d) => d.split('-').reverse().join('/')
        const params = new URLSearchParams({
            fly_from: origin,
            fly_to: dest,
            date_from: fmtKiwi(departDate),
            date_to: fmtKiwi(departDate),
            return_from: fmtKiwi(returnDate),
            return_to: fmtKiwi(returnDate),
            adults: '1',
            curr: 'TRY',
            limit: '1',
            sort: 'price',
            flight_type: 'round',
        })
        const res = await fetch(`https://api.tequila.kiwi.com/v2/search?${params}`, {
            headers: { apikey: apiKey },
        })
        if (!res.ok) return null
        const data = await res.json()
        const offer = data.data?.[0]
        if (!offer) return null

        return {
            price: Math.round(offer.price),
            currency: 'TRY',
            airlines: [...new Set(offer.airlines || [])],
            duration: `PT${Math.floor(offer.duration?.departure / 3600)}H${Math.floor((offer.duration?.departure % 3600) / 60)}M`,
            stops: (offer.route?.filter(r => r.return === 0)?.length || 1) - 1,
            source: 'kiwi',
            bookUrl: offer.deep_link || `https://www.kiwi.com/deep?from=${origin}&to=${dest}&departure=${departDate}&return=${returnDate}`,
        }
    } catch { return null }
}

// ═══════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const origin = searchParams.get('origin') || 'IST'
        const maxDeals = parseInt(searchParams.get('max') || '8')
        const duration = searchParams.get('duration') || '4'
        const month = searchParams.get('month') || 'any'
        const pattern = searchParams.get('pattern') || 'any' // fri_sun, sat_sun, sat_mon, any

        // Generate date ranges based on filters
        const dateRanges = generateDates(month, duration, pattern)
        if (dateRanges.length === 0) {
            return NextResponse.json({ deals: [], error: 'No valid date ranges found', origin })
        }

        // Pick random destinations to scan
        const numDests = Math.min(10, SCAN_DESTINATIONS.length)
        const shuffled = [...SCAN_DESTINATIONS].sort(() => Math.random() - 0.5).slice(0, numDests)

        // Search ALL destinations + dates in parallel for speed
        const searchTasks = shuffled.map(async (dest) => {
            const dateRange = dateRanges[Math.floor(Math.random() * dateRanges.length)]

            // Search both Amadeus and Kiwi in parallel
            const [amadeusResult, kiwiResult] = await Promise.all([
                searchAmadeus(origin, dest, dateRange.depart, dateRange.ret),
                searchKiwi(origin, dest, dateRange.depart, dateRange.ret),
            ])

            // Pick best price
            let best = null
            const sources = []
            if (amadeusResult) sources.push(amadeusResult)
            if (kiwiResult) sources.push(kiwiResult)

            if (sources.length === 0) return null

            // Sort by price, take cheapest
            sources.sort((a, b) => a.price - b.price)
            best = sources[0]

            const visa = VISA_INFO[dest] || { city: dest, visa: 'unknown' }

            return {
                destination: dest,
                city: visa.city || dest,
                country: visa.country || 'Türkiye',
                price: best.price,
                currency: best.currency || 'TRY',
                departDate: dateRange.depart,
                returnDate: dateRange.ret,
                tripType: dateRange.type,
                tripLabel: dateRange.label,
                airlines: best.airlines || [],
                duration: best.duration,
                stops: best.stops,
                source: best.source,
                bookUrl: best.bookUrl,
                // Price comparison data
                priceComparison: sources.length > 1 ? sources.map(s => ({
                    source: s.source,
                    price: s.price,
                    url: s.bookUrl,
                })) : null,
                visa: {
                    type: visa.visa,
                    label: VISA_LABELS[visa.visa] || VISA_LABELS.visa_required,
                    maxDays: visa.maxDays,
                    note: visa.note,
                },
            }
        })

        const results = await Promise.all(searchTasks)
        const deals = results.filter(Boolean).sort((a, b) => a.price - b.price).slice(0, maxDeals)

        return NextResponse.json({
            deals,
            origin,
            filters: { duration, month, pattern },
            scannedAt: new Date().toISOString(),
            totalScanned: shuffled.length,
            sources: ['amadeus', process.env.KIWI_API_KEY ? 'kiwi' : null].filter(Boolean),
        })
    } catch (err) {
        console.error('Flight deals error:', err)
        if (err.message?.includes('not configured')) {
            return NextResponse.json({
                deals: [], error: 'Flight API not configured',
                setup: 'Add AMADEUS_API_KEY, AMADEUS_API_SECRET, and optionally KIWI_API_KEY to .env.local',
            }, { status: 200 })
        }
        return NextResponse.json({ deals: [], error: err.message }, { status: 500 })
    }
}
