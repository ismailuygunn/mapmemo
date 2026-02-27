// NAVISO — Flight Deals Scanner
// Scans cheap flights from Istanbul for next 2 months
// Shows deals on dashboard login with visa info for Turkish passport
import { NextResponse } from 'next/server'

// Turkish passport visa requirements (commonly visited destinations)
const VISA_INFO = {
    // Vizesiz (Visa-free)
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
    'HND': { city: 'Tokyo Haneda', country: 'Japonya', visa: 'visa_free', maxDays: 90 },
    // Kapıda Vize (Visa on arrival)
    'DXB': { city: 'Dubai', country: 'BAE', visa: 'visa_on_arrival', maxDays: 30 },
    'SSH': { city: 'Sharm el-Sheikh', country: 'Mısır', visa: 'visa_on_arrival', maxDays: 30, note: 'Sinai only free' },
    'CMB': { city: 'Kolombo', country: 'Sri Lanka', visa: 'visa_on_arrival', maxDays: 30 },
    'DAR': { city: 'Tanzania', country: 'Tanzanya', visa: 'visa_on_arrival', maxDays: 90 },
    'NBO': { city: 'Nairobi', country: 'Kenya', visa: 'visa_on_arrival', maxDays: 90 },
    'MLE': { city: 'Maldivler', country: 'Maldivler', visa: 'visa_on_arrival', maxDays: 30 },
    // E-Vize (E-Visa required)
    'DEL': { city: 'Delhi', country: 'Hindistan', visa: 'e_visa', note: 'e-Vize ~25$' },
    'HNL': { city: 'Hawaii', country: 'ABD', visa: 'visa_required', note: 'B1/B2 vize gerekli' },
    'AUH': { city: 'Abu Dhabi', country: 'BAE', visa: 'visa_on_arrival', maxDays: 30 },
    'CMN': { city: 'Kazablanka', country: 'Fas', visa: 'visa_free', maxDays: 90 },
    'TUN': { city: 'Tunus', country: 'Tunus', visa: 'visa_free', maxDays: 90 },
    // Schengen / Vizeli
    'CDG': { city: 'Paris', country: 'Fransa', visa: 'visa_required', note: 'Schengen vizesi' },
    'FCO': { city: 'Roma', country: 'İtalya', visa: 'visa_required', note: 'Schengen vizesi' },
    'BCN': { city: 'Barselona', country: 'İspanya', visa: 'visa_required', note: 'Schengen vizesi' },
    'AMS': { city: 'Amsterdam', country: 'Hollanda', visa: 'visa_required', note: 'Schengen vizesi' },
    'BER': { city: 'Berlin', country: 'Almanya', visa: 'visa_required', note: 'Schengen vizesi' },
    'MUC': { city: 'Münih', country: 'Almanya', visa: 'visa_required', note: 'Schengen vizesi' },
    'VIE': { city: 'Viyana', country: 'Avusturya', visa: 'visa_required', note: 'Schengen vizesi' },
    'PRG': { city: 'Prag', country: 'Çekya', visa: 'visa_required', note: 'Schengen vizesi' },
    'BUD': { city: 'Budapeşte', country: 'Macaristan', visa: 'visa_required', note: 'Schengen vizesi' },
    'ATH': { city: 'Atina', country: 'Yunanistan', visa: 'visa_required', note: 'Schengen vizesi' },
    'LIS': { city: 'Lizbon', country: 'Portekiz', visa: 'visa_required', note: 'Schengen vizesi' },
    'WAW': { city: 'Varşova', country: 'Polonya', visa: 'visa_required', note: 'Schengen vizesi' },
    'CPH': { city: 'Kopenhag', country: 'Danimarka', visa: 'visa_required', note: 'Schengen vizesi' },
    'ARN': { city: 'Stockholm', country: 'İsveç', visa: 'visa_required', note: 'Schengen vizesi' },
    'LHR': { city: 'Londra', country: 'İngiltere', visa: 'visa_required', note: 'UK vizesi' },
    'JFK': { city: 'New York', country: 'ABD', visa: 'visa_required', note: 'B1/B2 vize gerekli' },
    'LAX': { city: 'Los Angeles', country: 'ABD', visa: 'visa_required', note: 'B1/B2 vize gerekli' },
    'SIN': { city: 'Singapur', country: 'Singapur', visa: 'e_visa', note: 'e-Vize gerekli' },
    'PEK': { city: 'Pekin', country: 'Çin', visa: 'visa_required', note: 'Vize gerekli' },
    'DPS': { city: 'Bali', country: 'Endonezya', visa: 'visa_on_arrival', maxDays: 30 },
    'MXP': { city: 'Milano', country: 'İtalya', visa: 'visa_required', note: 'Schengen vizesi' },
}

const VISA_LABELS = {
    domestic: { tr: '🏠 Yurtiçi', en: '🏠 Domestic', color: '#6366F1' },
    visa_free: { tr: '✅ Vizesiz', en: '✅ Visa-free', color: '#22C55E' },
    visa_on_arrival: { tr: '🛬 Kapıda Vize', en: '🛬 Visa on Arrival', color: '#F59E0B' },
    e_visa: { tr: '📱 E-Vize', en: '📱 E-Visa', color: '#3B82F6' },
    visa_required: { tr: '📋 Vize Gerekli', en: '📋 Visa Required', color: '#EF4444' },
}

// Popular destinations to scan from IST
const SCAN_DESTINATIONS = [
    // Vizesiz
    'SJJ', 'TBS', 'GYD', 'SKP', 'PRN', 'TGD', 'BEG', 'SOF', 'TIA', 'KIV', 'CMN', 'TUN',
    // Kapıda Vize
    'DXB', 'DPS', 'MLE', 'AUH',
    // Ucuz Avrupa (vizeli ama popüler)
    'BUD', 'PRG', 'ATH', 'BCN', 'FCO', 'CDG', 'AMS', 'BER',
    // Uzak vizesiz
    'BKK', 'KUL', 'ICN', 'NRT',
    // Yurtiçi
    'AYT', 'ADB', 'TZX', 'DLM', 'BJV', 'GZT',
]

let amadeusToken = null
let tokenExpiry = 0

async function getAmadeusToken() {
    if (amadeusToken && Date.now() < tokenExpiry) return amadeusToken
    const clientId = process.env.AMADEUS_API_KEY
    const clientSecret = process.env.AMADEUS_API_SECRET
    if (!clientId || !clientSecret) throw new Error('Amadeus not configured')

    const res = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
    })
    if (!res.ok) throw new Error('Amadeus auth failed')
    const data = await res.json()
    amadeusToken = data.access_token
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
    return amadeusToken
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const origin = searchParams.get('origin') || 'IST'
        const maxDeals = parseInt(searchParams.get('max') || '8')

        const token = await getAmadeusToken()

        // Generate date ranges: weekends and random dates for next 2 months
        const now = new Date()
        const dateRanges = []
        for (let week = 1; week <= 8; week++) {
            const fri = new Date(now)
            fri.setDate(fri.getDate() + (week * 7) - now.getDay() + 5)
            const sun = new Date(fri)
            sun.setDate(sun.getDate() + 2)
            const midWeek = new Date(now)
            midWeek.setDate(midWeek.getDate() + (week * 7) + 2)
            const midReturn = new Date(midWeek)
            midReturn.setDate(midReturn.getDate() + 4)
            dateRanges.push({
                depart: fri.toISOString().split('T')[0],
                ret: sun.toISOString().split('T')[0],
                type: 'weekend',
            })
            dateRanges.push({
                depart: midWeek.toISOString().split('T')[0],
                ret: midReturn.toISOString().split('T')[0],
                type: 'midweek',
            })
        }

        // Pick 6 random destinations + 2 random date ranges each
        const shuffled = [...SCAN_DESTINATIONS].sort(() => Math.random() - 0.5).slice(0, 6)
        const deals = []

        for (const dest of shuffled) {
            const dateRange = dateRanges[Math.floor(Math.random() * dateRanges.length)]
            try {
                const params = new URLSearchParams({
                    originLocationCode: origin,
                    destinationLocationCode: dest,
                    departureDate: dateRange.depart,
                    returnDate: dateRange.ret,
                    adults: '1',
                    currencyCode: 'TRY',
                    max: '1',
                    nonStop: 'false',
                })

                const res = await fetch(
                    `https://test.api.amadeus.com/v2/shopping/flight-offers?${params}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                )

                if (res.ok) {
                    const data = await res.json()
                    const offer = data.data?.[0]
                    if (offer) {
                        const visa = VISA_INFO[dest] || { city: dest, visa: 'unknown' }
                        const airlines = [...new Set(
                            offer.itineraries.flatMap(i => i.segments.map(s => s.carrierCode))
                        )]

                        deals.push({
                            destination: dest,
                            city: visa.city || dest,
                            country: visa.country || 'Türkiye',
                            price: parseFloat(offer.price.grandTotal || offer.price.total),
                            currency: offer.price.currency,
                            departDate: dateRange.depart,
                            returnDate: dateRange.ret,
                            tripType: dateRange.type,
                            airlines,
                            duration: offer.itineraries[0]?.duration,
                            stops: (offer.itineraries[0]?.segments?.length || 1) - 1,
                            visa: {
                                type: visa.visa,
                                label: VISA_LABELS[visa.visa] || VISA_LABELS.visa_required,
                                maxDays: visa.maxDays,
                                note: visa.note,
                            },
                            lastTicketing: offer.lastTicketingDate,
                        })
                    }
                }
            } catch (err) {
                console.error(`Deal scan ${dest} error:`, err.message)
            }
        }

        // Sort by price (cheapest first)
        deals.sort((a, b) => a.price - b.price)

        return NextResponse.json({
            deals: deals.slice(0, maxDeals),
            origin,
            scannedAt: new Date().toISOString(),
            totalScanned: shuffled.length,
        })
    } catch (err) {
        console.error('Flight deals error:', err)

        if (err.message.includes('not configured')) {
            return NextResponse.json({
                deals: [],
                error: 'Amadeus API not configured',
                setup: 'Add AMADEUS_API_KEY and AMADEUS_API_SECRET to .env.local',
            }, { status: 200 })
        }

        return NextResponse.json({ deals: [], error: err.message }, { status: 500 })
    }
}
