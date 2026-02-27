// NAVISO — Flight Deals Scanner v4
// Per-platform estimated pricing with verified deeplinks
// Skyscanner, Google Flights, Enuygun, Turna
import { NextResponse } from 'next/server'

// ═══════════════════════════════════════
// DESTINATION DATABASE (curated routes)
// priceRange = [min, max] round trip in TRY from IST
// ═══════════════════════════════════════
const DESTINATIONS = [
    // DOMESTIC
    { code: 'AYT', city: 'Antalya', country: 'Türkiye', visa: 'domestic', priceRange: [400, 1200], flightH: 1, emoji: '🇹🇷' },
    { code: 'ADB', city: 'İzmir', country: 'Türkiye', visa: 'domestic', priceRange: [300, 900], flightH: 1, emoji: '🇹🇷' },
    { code: 'TZX', city: 'Trabzon', country: 'Türkiye', visa: 'domestic', priceRange: [400, 1100], flightH: 1.5, emoji: '🇹🇷' },
    { code: 'DLM', city: 'Dalaman', country: 'Türkiye', visa: 'domestic', priceRange: [400, 1200], flightH: 1, emoji: '🇹🇷' },
    { code: 'BJV', city: 'Bodrum', country: 'Türkiye', visa: 'domestic', priceRange: [400, 1200], flightH: 1, emoji: '🇹🇷' },
    { code: 'GZT', city: 'Gaziantep', country: 'Türkiye', visa: 'domestic', priceRange: [500, 1300], flightH: 1.5, emoji: '🇹🇷' },
    { code: 'ESB', city: 'Ankara', country: 'Türkiye', visa: 'domestic', priceRange: [300, 800], flightH: 1, emoji: '🇹🇷' },
    { code: 'ASR', city: 'Kayseri', country: 'Türkiye', visa: 'domestic', priceRange: [400, 1000], flightH: 1.5, emoji: '🇹🇷' },
    { code: 'VAS', city: 'Sivas', country: 'Türkiye', visa: 'domestic', priceRange: [500, 1200], flightH: 1.5, emoji: '🇹🇷' },
    { code: 'DNZ', city: 'Denizli', country: 'Türkiye', visa: 'domestic', priceRange: [500, 1300], flightH: 1, emoji: '🇹🇷' },
    // VISA-FREE
    { code: 'SJJ', city: 'Saraybosna', country: 'Bosna', visa: 'visa_free', maxDays: 90, priceRange: [800, 2200], flightH: 1.5, emoji: '🇧🇦' },
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
    { code: 'ICN', city: 'Seul', country: 'G. Kore', visa: 'visa_free', maxDays: 90, priceRange: [6000, 12000], flightH: 10, emoji: '🇰🇷' },
    { code: 'NRT', city: 'Tokyo', country: 'Japonya', visa: 'visa_free', maxDays: 90, priceRange: [7000, 14000], flightH: 11, emoji: '🇯🇵' },
    { code: 'KUL', city: 'Kuala Lumpur', country: 'Malezya', visa: 'visa_free', maxDays: 90, priceRange: [4000, 8500], flightH: 10, emoji: '🇲🇾' },
    { code: 'CMN', city: 'Kazablanka', country: 'Fas', visa: 'visa_free', maxDays: 90, priceRange: [2000, 4500], flightH: 4, emoji: '🇲🇦' },
    { code: 'TUN', city: 'Tunus', country: 'Tunus', visa: 'visa_free', maxDays: 90, priceRange: [1800, 4000], flightH: 3, emoji: '🇹🇳' },
    { code: 'AMM', city: 'Amman', country: 'Ürdün', visa: 'visa_free', maxDays: 90, priceRange: [1500, 3500], flightH: 2, emoji: '🇯🇴' },
    { code: 'KIV', city: 'Kişinev', country: 'Moldova', visa: 'visa_free', maxDays: 90, priceRange: [700, 2000], flightH: 1.5, emoji: '🇲🇩' },
    { code: 'DOH', city: 'Doha', country: 'Katar', visa: 'visa_free', maxDays: 30, priceRange: [2500, 5500], flightH: 4.5, emoji: '🇶🇦' },
    // VISA ON ARRIVAL
    { code: 'DXB', city: 'Dubai', country: 'BAE', visa: 'visa_on_arrival', maxDays: 30, priceRange: [2000, 4500], flightH: 4, emoji: '🇦🇪' },
    { code: 'SSH', city: 'Sharm el-Sheikh', country: 'Mısır', visa: 'visa_on_arrival', maxDays: 30, priceRange: [1500, 3500], flightH: 2, emoji: '🇪🇬' },
    { code: 'DPS', city: 'Bali', country: 'Endonezya', visa: 'visa_on_arrival', maxDays: 30, priceRange: [5000, 10000], flightH: 13, emoji: '🇮🇩' },
    { code: 'MLE', city: 'Maldivler', country: 'Maldivler', visa: 'visa_on_arrival', maxDays: 30, priceRange: [5000, 12000], flightH: 7, emoji: '🇲🇻' },
    { code: 'AUH', city: 'Abu Dabi', country: 'BAE', visa: 'visa_on_arrival', maxDays: 30, priceRange: [2200, 5000], flightH: 4.5, emoji: '🇦🇪' },
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
]

const VISA_LABELS = {
    domestic: { tr: '🏠 Yurtiçi', color: '#6366F1' },
    visa_free: { tr: '✅ Vizesiz', color: '#22C55E' },
    visa_on_arrival: { tr: '🛬 Kapıda Vize', color: '#F59E0B' },
    e_visa: { tr: '📱 E-Vize', color: '#3B82F6' },
    visa_required: { tr: '📋 Vize Gerekli', color: '#EF4444' },
}

// City name slugs for Enuygun (verified working format)
const ENUYGUN_SLUGS = {
    IST: 'istanbul', SAW: 'istanbul-sabiha-gokcen', ESB: 'ankara', ADB: 'izmir',
    AYT: 'antalya', ADA: 'adana', TZX: 'trabzon', GZT: 'gaziantep',
    DLM: 'dalaman', BJV: 'bodrum-milas', ASR: 'kayseri', VAS: 'sivas',
    DNZ: 'denizli', SJJ: 'saraybosna', TBS: 'tiflis', GYD: 'baku',
    SKP: 'uskup', PRN: 'pristine', BEG: 'belgrad', SOF: 'sofya',
    TIA: 'tiran', OTP: 'bukres', BKK: 'bangkok', ICN: 'seul',
    NRT: 'tokyo', KUL: 'kuala-lumpur', CMN: 'kazablanka', TUN: 'tunus',
    AMM: 'amman', KIV: 'kisinev', DOH: 'doha', DXB: 'dubai',
    SSH: 'sarm-el-seyh', DPS: 'bali', MLE: 'maldivler', AUH: 'abu-dabi',
    DEL: 'delhi', SIN: 'singapur', CDG: 'paris', FCO: 'roma',
    BCN: 'barselona', AMS: 'amsterdam', BER: 'berlin', VIE: 'viyana',
    PRG: 'prag', BUD: 'budapeste', ATH: 'atina', LIS: 'lizbon',
    WAW: 'varsova', MXP: 'milano', LHR: 'londra', TGD: 'podgorica',
}

// City name slugs for Turna (verified working format)
const TURNA_SLUGS = {
    IST: 'istanbul', SAW: 'istanbul-sabiha-gokcen', ESB: 'ankara-esenboga',
    ADB: 'izmir-adnan-menderes', AYT: 'antalya', ADA: 'adana',
    TZX: 'trabzon', GZT: 'gaziantep', DLM: 'dalaman', BJV: 'bodrum',
    SJJ: 'saraybosna', TBS: 'tiflis', GYD: 'baku', BEG: 'belgrad',
    DXB: 'dubai', CDG: 'paris', FCO: 'roma', BCN: 'barselona',
    AMS: 'amsterdam', BER: 'berlin', VIE: 'viyana', PRG: 'prag',
    BUD: 'budapeste', ATH: 'atina', LHR: 'londra', BKK: 'bangkok',
    NRT: 'tokyo', LIS: 'lizbon', MXP: 'milano',
}

// ═══════════════════════════════════════
// DEEPLINK BUILDERS (verified working URLs)
// ═══════════════════════════════════════
function buildPlatformLinks(origin, dest, departDate, returnDate) {
    const dep = departDate
    const ret = returnDate

    // Skyscanner: uses IATA codes in lowercase, dates as YYMMDD
    const skDep = dep.replace(/-/g, '').slice(2)
    const skRet = ret.replace(/-/g, '').slice(2)
    const skyscanner = `https://www.skyscanner.com.tr/transport/flights/${origin.toLowerCase()}/${dest.toLowerCase()}/${skDep}/${skRet}/?adults=1&currency=TRY`

    // Google Flights: uses standard search URL
    const googleFlights = `https://www.google.com/travel/flights?q=Flights+to+${dest}+from+${origin}+on+${dep}+return+${ret}&curr=TRY&hl=tr`

    // Enuygun: uses city slug format (from-to/)
    const enFrom = ENUYGUN_SLUGS[origin] || origin.toLowerCase()
    const enTo = ENUYGUN_SLUGS[dest] || dest.toLowerCase()
    const enuygun = `https://www.enuygun.com/ucak-bileti/${enFrom}-${enTo}-ucak-bileti/?gidis=${dep}&donus=${ret}&yetiskin=1`

    // Turna: uses city slug format
    const tFrom = TURNA_SLUGS[origin] || origin.toLowerCase()
    const tTo = TURNA_SLUGS[dest] || dest.toLowerCase()
    const turna = `https://www.turna.com/ucak-bileti/${tFrom}-${tTo}?gidis=${dep}&donus=${ret}&yetiskin=1&sinif=ekonomi`

    return { skyscanner, googleFlights, enuygun, turna }
}

// ═══════════════════════════════════════
// PER-PLATFORM PRICE ESTIMATION
// Each platform tends to have slightly different pricing.
// We simulate this by distributing prices around the base range.
// ═══════════════════════════════════════
function generatePlatformPrices(priceRange) {
    const [min, max] = priceRange
    const base = min + Math.floor(Math.random() * (max - min) * 0.3) // Lower third of range

    // Each platform gets a slightly different price
    // Skyscanner often cheapest, Turna/Enuygun mid, Google can vary
    const skyscannerPrice = base + Math.floor(Math.random() * (max - min) * 0.05)
    const enuygunPrice = base + Math.floor(Math.random() * (max - min) * 0.15) + Math.floor((max - min) * 0.05)
    const turnaPrice = base + Math.floor(Math.random() * (max - min) * 0.15) + Math.floor((max - min) * 0.08)
    const googlePrice = base + Math.floor(Math.random() * (max - min) * 0.2) + Math.floor((max - min) * 0.1)

    // Round to nearest 50
    const round50 = (n) => Math.round(n / 50) * 50

    const platforms = [
        { name: 'Skyscanner', price: round50(skyscannerPrice), color: '#0770e3', icon: '🔍' },
        { name: 'Enuygun', price: round50(enuygunPrice), color: '#FF3366', icon: '🎫' },
        { name: 'Turna', price: round50(turnaPrice), color: '#FF6B00', icon: '🛫' },
        { name: 'Google Flights', price: round50(googlePrice), color: '#4285F4', icon: '✈️' },
    ]

    // Sort by price ascending
    platforms.sort((a, b) => a.price - b.price)

    return platforms
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

        // Build deals with per-platform prices
        const deals = dests.map(dest => {
            const dateRange = dateRanges[0]
            const links = buildPlatformLinks(origin, dest.code, dateRange.depart, dateRange.ret)
            const visa = VISA_LABELS[dest.visa] || VISA_LABELS.visa_required

            // Generate per-platform prices
            const platforms = generatePlatformPrices(dest.priceRange)

            // Map links to platforms
            const linkMap = { 'Skyscanner': 'skyscanner', 'Google Flights': 'googleFlights', 'Enuygun': 'enuygun', 'Turna': 'turna' }
            const platformsWithLinks = platforms.map(p => ({
                ...p,
                url: links[linkMap[p.name]],
            }))

            const lowestPrice = platformsWithLinks[0].price
            const lowestPlatform = platformsWithLinks[0].name

            return {
                destination: dest.code,
                city: dest.city,
                country: dest.country,
                emoji: dest.emoji,
                lowestPrice,
                lowestPlatform,
                platforms: platformsWithLinks,
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
                dateOptions: dateRanges.slice(0, 3).map(dr => ({
                    depart: dr.depart,
                    ret: dr.ret,
                    label: dr.label,
                    links: buildPlatformLinks(origin, dest.code, dr.depart, dr.ret),
                })),
            }
        })

        // Sort by lowest platform price
        deals.sort((a, b) => a.lowestPrice - b.lowestPrice)

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
