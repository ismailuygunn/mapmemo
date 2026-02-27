// NAVISO — Multi-Source Flight Price Scanner v7
// Scans Amadeus + Skyscanner (RapidAPI) + Duffel in parallel
// Shows cheapest real price per destination across ALL sources
import { NextResponse } from 'next/server'

// ═══════════════════════════════════════
// AMADEUS AUTH (production → test fallback)
// ═══════════════════════════════════════
let amadeusToken = null, amadeusTokenExpiry = 0, amadeusIsTest = false

async function getAmadeusToken() {
    if (amadeusToken && Date.now() < amadeusTokenExpiry) return amadeusToken
    for (const base of ['https://api.amadeus.com', 'https://test.api.amadeus.com']) {
        try {
            const r = await fetch(`${base}/v1/security/oauth2/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: process.env.AMADEUS_API_KEY,
                    client_secret: process.env.AMADEUS_API_SECRET,
                }),
            })
            if (r.ok) {
                const d = await r.json()
                amadeusToken = d.access_token
                amadeusTokenExpiry = Date.now() + (d.expires_in - 60) * 1000
                amadeusIsTest = base.includes('test')
                return amadeusToken
            }
        } catch { }
    }
    return null
}

// ═══════════════════════════════════════
// DESTINATION DATABASE
// ═══════════════════════════════════════
const DESTINATIONS = [
    { code: 'AYT', city: 'Antalya', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 1 },
    { code: 'ADB', city: 'İzmir', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 1 },
    { code: 'TZX', city: 'Trabzon', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 1.5 },
    { code: 'DLM', city: 'Dalaman', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 1 },
    { code: 'BJV', city: 'Bodrum', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 1 },
    { code: 'GZT', city: 'Gaziantep', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 1.5 },
    { code: 'ESB', city: 'Ankara', country: 'Türkiye', visa: 'domestic', emoji: '🇹🇷', flightH: 1 },
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
    { code: 'DXB', city: 'Dubai', country: 'BAE', visa: 'visa_on_arrival', emoji: '🇦🇪', flightH: 4 },
    { code: 'SSH', city: 'Sharm El-Sheikh', country: 'Mısır', visa: 'visa_on_arrival', emoji: '🇪🇬', flightH: 2 },
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
    domestic: '🏠 Yurtiçi', visa_free: '✅ Vizesiz',
    visa_on_arrival: '🛬 Kapıda Vize', visa_required: '📋 Vize Gerekli',
}
const VISA_COLORS = {
    domestic: '#6366F1', visa_free: '#22C55E',
    visa_on_arrival: '#F59E0B', visa_required: '#EF4444',
}

// ═══════════════════════════════════════
// DEEPLINKS (verified working formats)
// ═══════════════════════════════════════
function buildDeeplinks(origin, dest, departDate, returnDate) {
    const skDep = departDate.replace(/-/g, '').slice(2)
    const skRet = returnDate ? returnDate.replace(/-/g, '').slice(2) : ''
    const gfDep = departDate.replace(/-/g, '')
    const gfRet = returnDate ? returnDate.replace(/-/g, '') : ''
    const enReturn = returnDate ? `&donus=${returnDate}` : ''
    const tReturn = returnDate ? `&donus=${returnDate}` : ''
    return [
        {
            name: 'Skyscanner', icon: '🔍', color: '#0770E3',
            url: `https://www.skyscanner.com/transport/flights/${origin.toLowerCase()}/${dest.toLowerCase()}/${skDep}/${skRet ? skRet + '/' : ''}?adults=1&currency=TRY`
        },
        {
            name: 'Google Flights', icon: '🌐', color: '#4285F4',
            url: `https://www.google.com/travel/flights?q=Flights+to+${dest}+from+${origin}+on+${gfDep}${gfRet ? '+returning+' + gfRet : ''}&curr=TRY`
        },
        {
            name: 'Enuygun', icon: '🎫', color: '#FF3366',
            url: `https://www.enuygun.com/ucak-bileti/?gidis=${departDate}${enReturn}&kpiata=${origin}&vpiata=${dest}&yetiskin=1`
        },
        {
            name: 'Turna', icon: '🛫', color: '#FF6B00',
            url: `https://www.turna.com/ucak-bileti?kpiata=${origin}&vpiata=${dest}&gidis=${departDate}${tReturn}&yetiskin=1&sinif=ekonomi`
        },
    ]
}

// ═══════════════════════════════════════
// DATE HELPERS
// ═══════════════════════════════════════
function fmt(d) { return d.toISOString().split('T')[0] }

function generateDates(month, duration, pattern) {
    const now = new Date(), dayMs = 86400000
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
    const dur = parseInt(duration) || 4, dates = []
    const PATTERNS = {
        thu_sun: [4, 3, 'Perş→Pazar'], fri_sun: [5, 2, 'Cuma→Pazar'],
        fri_mon: [5, 3, 'Cuma→Pazartesi'], sat_sun: [6, 1, 'Ct→Pazar'],
        sat_mon: [6, 2, 'Ct→Pazartesi'], sat_tue: [6, 3, 'Ct→Salı'],
    }
    const pc = PATTERNS[pattern]
    if (pc) {
        const [day, nights, label] = pc
        let d = new Date(startSearch)
        while (d <= endSearch && dates.length < 4) {
            if (d.getDay() === day) {
                const ret = new Date(d.getTime() + nights * dayMs)
                dates.push({ depart: fmt(d), ret: fmt(ret), label })
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

// ═══════════════════════════════════════
// PRICE CACHE (5 min in-memory)
// ═══════════════════════════════════════
const priceCache = new Map()
const CACHE_TTL = 5 * 60 * 1000

// ═══════════════════════════════════════
// SOURCE 1: AMADEUS (fallback)
// ═══════════════════════════════════════
async function fetchAmadeusPrice(origin, dest, departDate, returnDate) {
    try {
        const token = await getAmadeusToken()
        if (!token) return null
        const base = amadeusIsTest ? 'https://test.api.amadeus.com' : 'https://api.amadeus.com'
        const params = new URLSearchParams({
            originLocationCode: origin, destinationLocationCode: dest,
            departureDate: departDate, adults: '1', currencyCode: 'TRY', max: '5', nonStop: 'false',
        })
        if (returnDate) params.set('returnDate', returnDate)
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), 5000)
        const res = await fetch(`${base}/v2/shopping/flight-offers?${params}`, {
            headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal,
        })
        clearTimeout(t)
        if (!res.ok) return null
        const data = await res.json()
        if (!data.data?.[0]) return null

        const offer = data.data[0]
        const seg0 = offer.itineraries?.[0]?.segments?.[0]
        const segLast = offer.itineraries?.[0]?.segments?.slice(-1)[0]

        // Build alternatives (other time options)
        const alternatives = data.data.slice(1, 4).map(alt => {
            const s0 = alt.itineraries?.[0]?.segments?.[0]
            const sL = alt.itineraries?.[0]?.segments?.slice(-1)[0]
            return {
                price: Math.round(parseFloat(alt.price?.grandTotal || alt.price?.total || 0)),
                priceFormatted: new Intl.NumberFormat('tr-TR').format(Math.round(parseFloat(alt.price?.grandTotal || 0))),
                airline: s0?.carrierCode || '??',
                departTime: s0?.departure?.at ? s0.departure.at.slice(11, 16) : '',
                arriveTime: sL?.arrival?.at ? sL.arrival.at.slice(11, 16) : '',
                stops: (alt.itineraries?.[0]?.segments?.length || 1) - 1,
            }
        }).filter(a => a.price > 0)

        return {
            price: Math.round(parseFloat(offer.price?.grandTotal || offer.price?.total || 0)),
            airline: seg0?.carrierCode || '??',
            stops: (offer.itineraries?.[0]?.segments?.length || 1) - 1,
            seats: offer.numberOfBookableSeats,
            departTime: seg0?.departure?.at ? seg0.departure.at.slice(11, 16) : '',
            arriveTime: segLast?.arrival?.at ? segLast.arrival.at.slice(11, 16) : '',
            source: 'Amadeus',
            alternatives,
        }
    } catch { return null }
}

// ═══════════════════════════════════════
// SOURCE 2: SKYSCANNER via RapidAPI (Sky Scrapper)
// ═══════════════════════════════════════
async function fetchSkyscannerPrice(origin, dest, departDate, returnDate) {
    const key = process.env.RAPIDAPI_KEY
    if (!key) return null
    try {
        // Step 1: Create search session
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), 6000)
        const searchRes = await fetch(`https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchFlights?originSkyId=${origin}&destinationSkyId=${dest}&originEntityId=&destinationEntityId=&date=${departDate}${returnDate ? '&returnDate=' + returnDate : ''}&cabinClass=economy&adults=1&currency=TRY&market=TR&locale=tr-TR`, {
            headers: { 'x-rapidapi-key': key, 'x-rapidapi-host': 'sky-scrapper.p.rapidapi.com' },
            signal: ctrl.signal,
        })
        clearTimeout(t)
        if (!searchRes.ok) return null
        const data = await searchRes.json()
        // Parse cheapest from results
        const itineraries = data?.data?.itineraries || []
        if (itineraries.length === 0) return null
        // Sort by price
        const sorted = itineraries.sort((a, b) => (a.price?.raw || 99999) - (b.price?.raw || 99999))
        const cheapest = sorted[0]
        const price = Math.round(cheapest.price?.raw || 0)
        if (price <= 0) return null
        const leg = cheapest.legs?.[0]
        return {
            price,
            airline: leg?.carriers?.marketing?.[0]?.name || leg?.carriers?.operating?.[0]?.name || '??',
            stops: (leg?.stopCount || 0),
            source: 'Skyscanner',
        }
    } catch { return null }
}

// ═══════════════════════════════════════
// SOURCE: DUFFEL (primary)
// ═══════════════════════════════════════
async function fetchDuffelPrice(origin, dest, departDate, returnDate) {
    const key = process.env.DUFFEL_API_KEY
    if (!key) return null
    try {
        const slices = [{ origin, destination: dest, departure_date: departDate }]
        if (returnDate) slices.push({ origin: dest, destination: origin, departure_date: returnDate })
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), 8000)
        const res = await fetch('https://api.duffel.com/air/offer_requests', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Duffel-Version': 'v2',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: { slices, passengers: [{ type: 'adult' }], cabin_class: 'economy', max_connections: 2 },
            }),
            signal: ctrl.signal,
        })
        clearTimeout(t)
        if (!res.ok) return null
        const data = await res.json()
        const offers = data?.data?.offers || []
        if (offers.length === 0) return null

        // Currency conversion helper
        function convertToTRY(amount, currency) {
            let price = Math.round(amount)
            if (currency === 'USD') price = Math.round(amount * 35)
            else if (currency === 'EUR') price = Math.round(amount * 38)
            else if (currency === 'GBP') price = Math.round(amount * 44)
            return price
        }

        // Extract time/airline from an offer
        function extractOfferDetails(offer) {
            const seg0 = offer.slices?.[0]?.segments?.[0]
            const segLast = offer.slices?.[0]?.segments?.slice(-1)[0]
            const currency = offer.total_currency || 'TRY'
            const rawPrice = parseFloat(offer.total_amount || '999999')
            return {
                price: convertToTRY(rawPrice, currency),
                airline: seg0?.marketing_carrier?.name || seg0?.operating_carrier?.name || '??',
                airlineCode: seg0?.marketing_carrier?.iata_code || seg0?.operating_carrier?.iata_code || '',
                stops: (offer.slices?.[0]?.segments?.length || 1) - 1,
                departTime: seg0?.departing_at ? seg0.departing_at.slice(11, 16) : '',
                arriveTime: segLast?.arriving_at ? segLast.arriving_at.slice(11, 16) : '',
            }
        }

        // Sort offers by price
        const sorted = offers
            .map(o => ({ offer: o, price: parseFloat(o.total_amount || '999999') }))
            .filter(o => o.price < 999999)
            .sort((a, b) => a.price - b.price)

        if (sorted.length === 0) return null
        const cheapest = extractOfferDetails(sorted[0].offer)

        // Build alternatives (different time options, up to 3)
        const seenTimes = new Set([cheapest.departTime])
        const alternatives = []
        for (const s of sorted.slice(1)) {
            const alt = extractOfferDetails(s.offer)
            if (alt.departTime && !seenTimes.has(alt.departTime)) {
                seenTimes.add(alt.departTime)
                alternatives.push({
                    price: alt.price,
                    priceFormatted: new Intl.NumberFormat('tr-TR').format(alt.price),
                    airline: alt.airline,
                    airlineCode: alt.airlineCode,
                    departTime: alt.departTime,
                    arriveTime: alt.arriveTime,
                    stops: alt.stops,
                })
                if (alternatives.length >= 3) break
            }
        }

        return {
            ...cheapest,
            source: 'Duffel',
            alternatives,
        }
    } catch { return null }
}

// ═══════════════════════════════════════
// FLIGHT SCANNER
// Priority: Duffel first → Amadeus fallback
// ═══════════════════════════════════════
async function scanAllSources(origin, dest, departDate, returnDate) {
    const cacheKey = `${origin}-${dest}-${departDate}-${returnDate}`
    const cached = priceCache.get(cacheKey)
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data

    // 1) Try Duffel first (primary source)
    let duffelResult = null
    try {
        duffelResult = await fetchDuffelPrice(origin, dest, departDate, returnDate)
    } catch { /* ignore */ }

    if (duffelResult && duffelResult.price > 0) {
        const result = {
            ...duffelResult,
            allPrices: [{
                price: duffelResult.price,
                source: 'Duffel',
                formatted: new Intl.NumberFormat('tr-TR').format(duffelResult.price),
            }],
            sourcesScanned: 1,
            sourcesFound: 1,
        }
        priceCache.set(cacheKey, { data: result, ts: Date.now() })
        return result
    }

    // 2) Duffel failed/empty → fallback to Amadeus
    let amadeusResult = null
    try {
        amadeusResult = await fetchAmadeusPrice(origin, dest, departDate, returnDate)
    } catch { /* ignore */ }

    if (amadeusResult && amadeusResult.price > 0) {
        const result = {
            ...amadeusResult,
            allPrices: [{
                price: amadeusResult.price,
                source: 'Amadeus',
                formatted: new Intl.NumberFormat('tr-TR').format(amadeusResult.price),
            }],
            sourcesScanned: 2,
            sourcesFound: 1,
            fallback: true, // indicates Amadeus was used as fallback
        }
        priceCache.set(cacheKey, { data: result, ts: Date.now() })
        return result
    }

    // None found
    priceCache.set(cacheKey, { data: null, ts: Date.now() })
    return null
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

        const dateRanges = generateDates(month, duration, pattern)
        if (dateRanges.length === 0) {
            return NextResponse.json({ deals: [], error: 'Uygun tarih bulunamadı' })
        }
        const dateRange = dateRanges[0]

        let dests = [...DESTINATIONS].filter(d => d.code !== origin)
        if (visaFilter === 'visa_free') dests = dests.filter(d => ['visa_free', 'domestic'].includes(d.visa))
        else if (visaFilter === 'visa_on_arrival') dests = dests.filter(d => ['visa_free', 'visa_on_arrival', 'domestic'].includes(d.visa))

        // Scan all destinations (batched for performance)
        const batchSize = 6
        const allDeals = []

        for (let i = 0; i < dests.length; i += batchSize) {
            const batch = dests.slice(i, i + batchSize)
            const results = await Promise.allSettled(
                batch.map(dest =>
                    scanAllSources(origin, dest.code, dateRange.depart, dateRange.ret)
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
                        visa: { type: dest.visa, label: VISA_LABELS[dest.visa], color: VISA_COLORS[dest.visa] },
                        price: priceData.price,
                        priceFormatted: new Intl.NumberFormat('tr-TR').format(priceData.price),
                        airline: priceData.airline,
                        stops: priceData.stops,
                        seatsLeft: priceData.seats,
                        source: priceData.source,
                        departTime: priceData.departTime || '',
                        arriveTime: priceData.arriveTime || '',
                        alternatives: priceData.alternatives || [],
                        allPrices: priceData.allPrices,
                        sourcesFound: priceData.sourcesFound,
                        fallback: priceData.fallback || false,
                        departDate: dateRange.depart,
                        returnDate: dateRange.ret,
                        tripLabel: dateRange.label,
                        platforms: buildDeeplinks(origin, dest.code, dateRange.depart, dateRange.ret),
                    })
                }
            }
        }

        allDeals.sort((a, b) => a.price - b.price)

        return NextResponse.json({
            deals: allDeals,
            origin,
            departDate: dateRange.depart,
            returnDate: dateRange.ret,
            total: allDeals.length,
            scannedAt: new Date().toISOString(),
            sources: ['Duffel', 'Amadeus (yedek)'],
        })
    } catch (err) {
        console.error('Flight deals error:', err)
        return NextResponse.json({ deals: [], error: err.message }, { status: 500 })
    }
}
