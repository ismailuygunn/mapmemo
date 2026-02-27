// NAVISO — Flight Deals Scanner v3
// Smart deeplink-based approach with real booking platform URLs
// Generates date-based search links for Skyscanner, Google Flights, Enuygun, Turna
import { NextResponse } from 'next/server'

// ═══════════════════════════════════════
// DESTINATION DATABASE (curated routes from IST)
// ═══════════════════════════════════════
const DESTINATIONS = [
    // VISA-FREE
    { code: 'SJJ', city: 'Saraybosna', country: 'Bosna Hersek', visa: 'visa_free', maxDays: 90, priceRange: [800, 2200], flightH: 1.5, emoji: '🇧🇦' },
    { code: 'TBS', city: 'Tiflis', country: 'Gürcistan', visa: 'visa_free', maxDays: 365, priceRange: [900, 2500], flightH: 2, emoji: '🇬🇪' },
    { code: 'GYD', city: 'Bakü', country: 'Azerbaycan', visa: 'visa_free', maxDays: 90, priceRange: [1100, 3000], flightH: 3, emoji: '🇦🇿' },
    { code: 'SKP', city: 'Üsküp', country: 'K. Makedonya', visa: 'visa_free', maxDays: 90, priceRange: [700, 1800], flightH: 1.5, emoji: '🇲🇰' },
    { code: 'PRN', city: 'Priştine', country: 'Kosova', visa: 'visa_free', maxDays: 90, priceRange: [600, 1500], flightH: 1.5, emoji: '🇽🇰' },
    { code: 'TGD', city: 'Podgorica', country: 'Karadağ', visa: 'visa_free', maxDays: 90, priceRange: [900, 2000], flightH: 2, emoji: '🇲🇪' },
    { code: 'BEG', city: 'Belgrad', country: 'Sırbistan', visa: 'visa_free', maxDays: 90, priceRange: [800, 2200], flightH: 1.5, emoji: '🇷🇸' },
    { code: 'SOF', city: 'Sofya', country: 'Bulgaristan', visa: 'visa_free', maxDays: 90, priceRange: [500, 1500], flightH: 1, emoji: '🇧🇬' },
    { code: 'TIA', city: 'Tiran', country: 'Arnavutluk', visa: 'visa_free', maxDays: 90, priceRange: [800, 2000], flightH: 1.5, emoji: '🇦🇱' },
    { code: 'OTP', city: 'Bükreş', country: 'Romanya', visa: 'visa_free', maxDays: 90, priceRange: [600, 1800], flightH: 1.5, emoji: '🇷🇴' },
    { code: 'BKK', city: 'Bangkok', country: 'Tayland', visa: 'visa_free', maxDays: 30, priceRange: [4500, 9000], flightH: 9.5, emoji: '🇹🇭' },
    { code: 'ICN', city: 'Seul', country: 'Güney Kore', visa: 'visa_free', maxDays: 90, priceRange: [6000, 12000], flightH: 10, emoji: '🇰🇷' },
    { code: 'NRT', city: 'Tokyo', country: 'Japonya', visa: 'visa_free', maxDays: 90, priceRange: [7000, 14000], flightH: 11, emoji: '🇯🇵' },
    { code: 'KUL', city: 'Kuala Lumpur', country: 'Malezya', visa: 'visa_free', maxDays: 90, priceRange: [4000, 8500], flightH: 10, emoji: '🇲🇾' },
    { code: 'CMN', city: 'Kazablanka', country: 'Fas', visa: 'visa_free', maxDays: 90, priceRange: [2000, 4500], flightH: 4, emoji: '🇲🇦' },
    { code: 'TUN', city: 'Tunus', country: 'Tunus', visa: 'visa_free', maxDays: 90, priceRange: [1800, 4000], flightH: 3, emoji: '🇹🇳' },
    { code: 'EZE', city: 'Buenos Aires', country: 'Arjantin', visa: 'visa_free', maxDays: 90, priceRange: [12000, 25000], flightH: 16, emoji: '🇦🇷' },
    { code: 'AMM', city: 'Amman', country: 'Ürdün', visa: 'visa_free', maxDays: 90, priceRange: [1500, 3500], flightH: 2, emoji: '🇯🇴' },
    { code: 'KIV', city: 'Kişinev', country: 'Moldova', visa: 'visa_free', maxDays: 90, priceRange: [700, 2000], flightH: 1.5, emoji: '🇲🇩' },
    { code: 'DOH', city: 'Doha', country: 'Katar', visa: 'visa_free', maxDays: 30, priceRange: [2500, 5500], flightH: 4.5, emoji: '🇶🇦' },
    // VISA ON ARRIVAL
    { code: 'DXB', city: 'Dubai', country: 'BAE', visa: 'visa_on_arrival', maxDays: 30, priceRange: [2000, 4500], flightH: 4, emoji: '🇦🇪' },
    { code: 'SSH', city: 'Sharm el-Sheikh', country: 'Mısır', visa: 'visa_on_arrival', maxDays: 30, priceRange: [1500, 3500], flightH: 2, emoji: '🇪🇬' },
    { code: 'DPS', city: 'Bali', country: 'Endonezya', visa: 'visa_on_arrival', maxDays: 30, priceRange: [5000, 10000], flightH: 13, emoji: '🇮🇩' },
    { code: 'MLE', city: 'Maldivler', country: 'Maldivler', visa: 'visa_on_arrival', maxDays: 30, priceRange: [5000, 12000], flightH: 7, emoji: '🇲🇻' },
    { code: 'NBO', city: 'Nairobi', country: 'Kenya', visa: 'visa_on_arrival', maxDays: 90, priceRange: [4000, 8000], flightH: 7, emoji: '🇰🇪' },
    { code: 'AUH', city: 'Abu Dabi', country: 'BAE', visa: 'visa_on_arrival', maxDays: 30, priceRange: [2200, 5000], flightH: 4.5, emoji: '🇦🇪' },
    { code: 'CMB', city: 'Kolombo', country: 'Sri Lanka', visa: 'visa_on_arrival', maxDays: 30, priceRange: [4000, 7500], flightH: 8, emoji: '🇱🇰' },
    // E-VISA
    { code: 'DEL', city: 'Delhi', country: 'Hindistan', visa: 'e_visa', priceRange: [3500, 7000], flightH: 6, emoji: '🇮🇳' },
    { code: 'SIN', city: 'Singapur', country: 'Singapur', visa: 'e_visa', priceRange: [5000, 10000], flightH: 10, emoji: '🇸🇬' },
    // VISA REQUIRED (Schengen etc)
    { code: 'CDG', city: 'Paris', country: 'Fransa', visa: 'visa_required', note: 'Schengen', priceRange: [2500, 6000], flightH: 3.5, emoji: '🇫🇷' },
    { code: 'FCO', city: 'Roma', country: 'İtalya', visa: 'visa_required', note: 'Schengen', priceRange: [2200, 5000], flightH: 2.5, emoji: '🇮🇹' },
    { code: 'BCN', city: 'Barselona', country: 'İspanya', visa: 'visa_required', note: 'Schengen', priceRange: [2500, 5500], flightH: 3.5, emoji: '🇪🇸' },
    { code: 'AMS', city: 'Amsterdam', country: 'Hollanda', visa: 'visa_required', note: 'Schengen', priceRange: [2800, 6000], flightH: 3.5, emoji: '🇳🇱' },
    { code: 'BER', city: 'Berlin', country: 'Almanya', visa: 'visa_required', note: 'Schengen', priceRange: [2200, 5000], flightH: 3, emoji: '🇩🇪' },
    { code: 'VIE', city: 'Viyana', country: 'Avusturya', visa: 'visa_required', note: 'Schengen', priceRange: [2000, 4500], flightH: 2.5, emoji: '🇦🇹' },
    { code: 'PRG', city: 'Prag', country: 'Çekya', visa: 'visa_required', note: 'Schengen', priceRange: [1800, 4000], flightH: 2.5, emoji: '🇨🇿' },
    { code: 'BUD', city: 'Budapeşte', country: 'Macaristan', visa: 'visa_required', note: 'Schengen', priceRange: [1500, 3500], flightH: 2, emoji: '🇭🇺' },
    { code: 'ATH', city: 'Atina', country: 'Yunanistan', visa: 'visa_required', note: 'Schengen', priceRange: [1200, 3000], flightH: 1.5, emoji: '🇬🇷' },
    { code: 'LIS', city: 'Lizbon', country: 'Portekiz', visa: 'visa_required', note: 'Schengen', priceRange: [3000, 6500], flightH: 4.5, emoji: '🇵🇹' },
    { code: 'WAW', city: 'Varşova', country: 'Polonya', visa: 'visa_required', note: 'Schengen', priceRange: [1500, 3500], flightH: 2.5, emoji: '🇵🇱' },
    { code: 'MXP', city: 'Milano', country: 'İtalya', visa: 'visa_required', note: 'Schengen', priceRange: [2000, 4500], flightH: 2.5, emoji: '🇮🇹' },
    { code: 'LHR', city: 'Londra', country: 'İngiltere', visa: 'visa_required', note: 'UK vizesi', priceRange: [3000, 7000], flightH: 4, emoji: '🇬🇧' },
    // DOMESTIC
    { code: 'AYT', city: 'Antalya', country: 'Türkiye', visa: 'domestic', priceRange: [400, 1200], flightH: 1, emoji: '🇹🇷' },
    { code: 'ADB', city: 'İzmir', country: 'Türkiye', visa: 'domestic', priceRange: [300, 900], flightH: 1, emoji: '🇹🇷' },
    { code: 'TZX', city: 'Trabzon', country: 'Türkiye', visa: 'domestic', priceRange: [400, 1100], flightH: 1.5, emoji: '🇹🇷' },
    { code: 'DLM', city: 'Dalaman', country: 'Türkiye', visa: 'domestic', priceRange: [400, 1200], flightH: 1, emoji: '🇹🇷' },
    { code: 'BJV', city: 'Bodrum', country: 'Türkiye', visa: 'domestic', priceRange: [400, 1200], flightH: 1, emoji: '🇹🇷' },
    { code: 'GZT', city: 'Gaziantep', country: 'Türkiye', visa: 'domestic', priceRange: [500, 1300], flightH: 1.5, emoji: '🇹🇷' },
    { code: 'ESB', city: 'Ankara', country: 'Türkiye', visa: 'domestic', priceRange: [300, 800], flightH: 1, emoji: '🇹🇷' },
    { code: 'ASR', city: 'Kayseri', country: 'Türkiye', visa: 'domestic', priceRange: [400, 1000], flightH: 1.5, emoji: '🇹🇷' },
]

const VISA_LABELS = {
    domestic: { tr: '🏠 Yurtiçi', color: '#6366F1' },
    visa_free: { tr: '✅ Vizesiz', color: '#22C55E' },
    visa_on_arrival: { tr: '🛬 Kapıda Vize', color: '#F59E0B' },
    e_visa: { tr: '📱 E-Vize', color: '#3B82F6' },
    visa_required: { tr: '📋 Vize Gerekli', color: '#EF4444' },
}

// ═══════════════════════════════════════
// DEEPLINK BUILDERS
// ═══════════════════════════════════════
function buildDeeplinks(origin, dest, departDate, returnDate) {
    // Skyscanner format: YYMMDD
    const skDep = departDate.replace(/-/g, '').slice(2)
    const skRet = returnDate.replace(/-/g, '').slice(2)

    return {
        skyscanner: `https://www.skyscanner.com.tr/transport/flights/${origin.toLowerCase()}/${dest.toLowerCase()}/${skDep}/${skRet}/?adults=1&currency=TRY`,
        googleFlights: `https://www.google.com/travel/flights?q=Flights+from+${origin}+to+${dest}+departing+${departDate}+returning+${returnDate}&curr=TRY`,
        enuygun: `https://www.enuygun.com/ucak-bileti/arama/${origin.toLowerCase()}-${dest.toLowerCase()}/?gidis=${departDate}&donus=${returnDate}&yetiskin=1`,
        turna: `https://www.turna.com/ucak-bileti/${origin.toLowerCase()}-${dest.toLowerCase()}?departureDate=${departDate}&returnDate=${returnDate}&adult=1`,
    }
}

// ═══════════════════════════════════════
// DATE GENERATORS
// ═══════════════════════════════════════
function generateDates(month, duration, pattern) {
    const now = new Date()
    const dates = []
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

    if (pattern === 'fri_sun') {
        let d = new Date(startSearch)
        while (d <= endSearch && dates.length < 4) {
            if (d.getDay() === 5) {
                const ret = new Date(d.getTime() + 2 * dayMs)
                if (ret <= endSearch) dates.push({ depart: fmt(d), ret: fmt(ret), label: 'Cuma→Pazar' })
            }
            d = new Date(d.getTime() + dayMs)
        }
    } else if (pattern === 'sat_sun') {
        let d = new Date(startSearch)
        while (d <= endSearch && dates.length < 4) {
            if (d.getDay() === 6) {
                const ret = new Date(d.getTime() + dayMs)
                if (ret <= endSearch) dates.push({ depart: fmt(d), ret: fmt(ret), label: 'Ct→Pz' })
            }
            d = new Date(d.getTime() + dayMs)
        }
    } else if (pattern === 'sat_mon') {
        let d = new Date(startSearch)
        while (d <= endSearch && dates.length < 4) {
            if (d.getDay() === 6) {
                const ret = new Date(d.getTime() + 2 * dayMs)
                if (ret <= endSearch) dates.push({ depart: fmt(d), ret: fmt(ret), label: 'Ct→Pt' })
            }
            d = new Date(d.getTime() + dayMs)
        }
    } else {
        const step = Math.max(7, Math.floor((endSearch - startSearch) / dayMs / 6))
        let d = new Date(startSearch)
        while (d <= endSearch && dates.length < 6) {
            const ret = new Date(d.getTime() + dur * dayMs)
            if (ret <= endSearch) dates.push({ depart: fmt(d), ret: fmt(ret), label: `${dur} gün` })
            d = new Date(d.getTime() + step * dayMs)
        }
    }
    return dates
}

function fmt(d) { return d.toISOString().split('T')[0] }

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
        const destFilter = searchParams.get('dest') || ''

        // Generate date ranges
        const dateRanges = generateDates(month, duration, pattern)
        if (dateRanges.length === 0) {
            return NextResponse.json({ deals: [], error: 'No valid date ranges', origin })
        }

        // Filter destinations
        let dests = [...DESTINATIONS]
        if (destFilter) dests = dests.filter(d => d.code === destFilter)
        if (visaFilter === 'visa_free') dests = dests.filter(d => ['visa_free', 'domestic'].includes(d.visa))
        else if (visaFilter === 'visa_on_arrival') dests = dests.filter(d => ['visa_free', 'visa_on_arrival', 'domestic'].includes(d.visa))
        if (maxBudget > 0) dests = dests.filter(d => d.priceRange[0] <= maxBudget)

        // Remove origin from destinations
        dests = dests.filter(d => d.code !== origin)

        // Build deals with deeplinks for each destination
        const deals = dests.map(dest => {
            // Pick best date range for this destination
            const dateRange = dateRanges[0] // Use first available date
            const links = buildDeeplinks(origin, dest.code, dateRange.depart, dateRange.ret)
            const visa = VISA_LABELS[dest.visa] || VISA_LABELS.visa_required

            return {
                destination: dest.code,
                city: dest.city,
                country: dest.country,
                emoji: dest.emoji,
                priceRange: dest.priceRange,
                priceMin: dest.priceRange[0],
                priceMax: dest.priceRange[1],
                flightHours: dest.flightH,
                departDate: dateRange.depart,
                returnDate: dateRange.ret,
                tripLabel: dateRange.label,
                visa: {
                    type: dest.visa,
                    label: visa,
                    maxDays: dest.maxDays,
                    note: dest.note,
                },
                links,
                // Multiple date options for this destination
                dateOptions: dateRanges.slice(0, 3).map(dr => ({
                    depart: dr.depart,
                    ret: dr.ret,
                    label: dr.label,
                    links: buildDeeplinks(origin, dest.code, dr.depart, dr.ret),
                })),
            }
        })

        // Sort by minimum price
        deals.sort((a, b) => a.priceMin - b.priceMin)

        return NextResponse.json({
            deals,
            origin,
            filters: { duration, month, pattern, visa: visaFilter },
            dateRanges: dateRanges.slice(0, 3),
            scannedAt: new Date().toISOString(),
            totalDestinations: deals.length,
        })
    } catch (err) {
        console.error('Flight deals error:', err)
        return NextResponse.json({ deals: [], error: err.message }, { status: 500 })
    }
}
