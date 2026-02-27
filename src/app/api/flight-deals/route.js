// NAVISO — Flight Search v5 (Real Amadeus API)
// Returns REAL flight offers with actual prices, airlines, times
import { NextResponse } from 'next/server'

// ═══════════════════════════════════════
// AMADEUS AUTH — get access token
// ═══════════════════════════════════════
let cachedToken = null
let tokenExpiry = 0

async function getAmadeusToken() {
    if (cachedToken && Date.now() < tokenExpiry) return cachedToken

    const res = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: process.env.AMADEUS_API_KEY,
            client_secret: process.env.AMADEUS_API_SECRET,
        }),
    })

    if (!res.ok) {
        // Fallback to test API if production fails
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
        const testData = await testRes.json()
        cachedToken = testData.access_token
        tokenExpiry = Date.now() + (testData.expires_in - 60) * 1000
        return cachedToken
    }

    const data = await res.json()
    cachedToken = data.access_token
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
    return cachedToken
}

// ═══════════════════════════════════════
// AIRLINE DATABASE
// ═══════════════════════════════════════
const AIRLINES = {
    TK: { name: 'Turkish Airlines', logo: '🇹🇷', color: '#C8102E' },
    PC: { name: 'Pegasus', logo: '🟡', color: '#FFD100' },
    AJ: { name: 'AnadoluJet', logo: '🔵', color: '#003DA5' },
    XQ: { name: 'SunExpress', logo: '🌞', color: '#E2001A' },
    LH: { name: 'Lufthansa', logo: '🇩🇪', color: '#05164D' },
    BA: { name: 'British Airways', logo: '🇬🇧', color: '#075AAA' },
    AF: { name: 'Air France', logo: '🇫🇷', color: '#002157' },
    KL: { name: 'KLM', logo: '🇳🇱', color: '#00A1DE' },
    EK: { name: 'Emirates', logo: '🇦🇪', color: '#D71921' },
    QR: { name: 'Qatar Airways', logo: '🇶🇦', color: '#5C0632' },
    EY: { name: 'Etihad', logo: '🇦🇪', color: '#9B7042' },
    W6: { name: 'Wizz Air', logo: '🟣', color: '#C6007E' },
    FR: { name: 'Ryanair', logo: '💛', color: '#073590' },
    U2: { name: 'easyJet', logo: '🟠', color: '#FF6600' },
    OS: { name: 'Austrian Airlines', logo: '🇦🇹', color: '#E10019' },
    LX: { name: 'SWISS', logo: '🇨🇭', color: '#D50000' },
    AZ: { name: 'ITA Airways', logo: '🇮🇹', color: '#0032A0' },
    SK: { name: 'SAS', logo: '🇸🇪', color: '#000066' },
    MS: { name: 'EgyptAir', logo: '🇪🇬', color: '#003262' },
    RJ: { name: 'Royal Jordanian', logo: '🇯🇴', color: '#1B3F8B' },
    SV: { name: 'Saudia', logo: '🇸🇦', color: '#006747' },
    TG: { name: 'Thai Airways', logo: '🇹🇭', color: '#3B2674' },
    SQ: { name: 'Singapore Airlines', logo: '🇸🇬', color: '#003C6C' },
    CX: { name: 'Cathay Pacific', logo: '🇭🇰', color: '#006564' },
    NH: { name: 'ANA', logo: '🇯🇵', color: '#003F87' },
    JL: { name: 'Japan Airlines', logo: '🇯🇵', color: '#C8102E' },
    KE: { name: 'Korean Air', logo: '🇰🇷', color: '#003087' },
    OZ: { name: 'Asiana', logo: '🇰🇷', color: '#E60012' },
    MH: { name: 'Malaysia Airlines', logo: '🇲🇾', color: '#002B5C' },
    GA: { name: 'Garuda Indonesia', logo: '🇮🇩', color: '#009B3A' },
    WY: { name: 'Oman Air', logo: '🇴🇲', color: '#006B3F' },
    FZ: { name: 'flydubai', logo: '🇦🇪', color: '#F26522' },
    PS: { name: 'Ukraine Airlines', logo: '🇺🇦', color: '#005BBB' },
    BT: { name: 'airBaltic', logo: '🇱🇻', color: '#01A14B' },
    LO: { name: 'LOT Polish', logo: '🇵🇱', color: '#003087' },
    OK: { name: 'Czech Airlines', logo: '🇨🇿', color: '#004A98' },
    RO: { name: 'TAROM', logo: '🇷🇴', color: '#003399' },
    JU: { name: 'Air Serbia', logo: '🇷🇸', color: '#CA0813' },
    OU: { name: 'Croatia Airlines', logo: '🇭🇷', color: '#0053A0' },
    BJ: { name: 'Nouvelair', logo: '🇹🇳', color: '#E30613' },
    SU: { name: 'Aeroflot', logo: '🇷🇺', color: '#0032A0' },
    '8Q': { name: 'Onur Air', logo: '🟢', color: '#006838' },
    '6Y': { name: 'SmartLynx', logo: '🟢', color: '#5CB85C' },
    VY: { name: 'Vueling', logo: '🟡', color: '#FFD100' },
    DY: { name: 'Norwegian', logo: '🇳🇴', color: '#D81939' },
    '4O': { name: 'Interjet', logo: '🔴', color: '#CF0A2C' },
}

function getAirline(code) {
    return AIRLINES[code] || { name: code, logo: '✈️', color: '#6366F1' }
}

// ═══════════════════════════════════════
// SEARCH AMADEUS FLIGHT OFFERS
// ═══════════════════════════════════════
async function searchFlights(token, params) {
    const { origin, destination, departDate, returnDate, adults, maxPrice, nonStop } = params

    const searchParams = new URLSearchParams({
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate: departDate,
        adults: String(adults || 1),
        currencyCode: 'TRY',
        max: '20',
    })

    if (returnDate) searchParams.set('returnDate', returnDate)
    if (maxPrice) searchParams.set('maxPrice', maxPrice)
    if (nonStop) searchParams.set('nonStop', 'true')

    // Try production first, then test
    let res = await fetch(`https://api.amadeus.com/v2/shopping/flight-offers?${searchParams}`, {
        headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
        // Try test endpoint
        const testToken = await getTestToken()
        res = await fetch(`https://test.api.amadeus.com/v2/shopping/flight-offers?${searchParams}`, {
            headers: { Authorization: `Bearer ${testToken}` },
        })
    }

    if (!res.ok) {
        const errText = await res.text()
        console.error('Amadeus search error:', res.status, errText)
        throw new Error(`Amadeus search failed: ${res.status}`)
    }

    return res.json()
}

async function getTestToken() {
    const res = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: process.env.AMADEUS_API_KEY,
            client_secret: process.env.AMADEUS_API_SECRET,
        }),
    })
    const data = await res.json()
    return data.access_token
}

// ═══════════════════════════════════════
// PARSE AMADEUS RESPONSE INTO CLEAN FORMAT
// ═══════════════════════════════════════
function parseFlightOffers(data) {
    if (!data?.data) return []

    return data.data.map((offer, idx) => {
        const price = parseFloat(offer.price?.grandTotal || offer.price?.total || 0)
        const currency = offer.price?.currency || 'TRY'

        // Parse outbound itinerary
        const outbound = offer.itineraries?.[0]
        const inbound = offer.itineraries?.[1]

        const outSegments = (outbound?.segments || []).map(seg => ({
            departure: {
                airport: seg.departure?.iataCode,
                time: seg.departure?.at,
                terminal: seg.departure?.terminal,
            },
            arrival: {
                airport: seg.arrival?.iataCode,
                time: seg.arrival?.at,
                terminal: seg.arrival?.terminal,
            },
            airline: seg.carrierCode,
            airlineName: getAirline(seg.carrierCode).name,
            airlineLogo: getAirline(seg.carrierCode).logo,
            flightNumber: `${seg.carrierCode}${seg.number}`,
            aircraft: seg.aircraft?.code,
            duration: seg.duration,
            cabinClass: offer.travelerPricings?.[0]?.fareDetailsBySegment?.find(f => f.segmentId === seg.id)?.cabin || 'ECONOMY',
        }))

        const inSegments = inbound ? (inbound.segments || []).map(seg => ({
            departure: {
                airport: seg.departure?.iataCode,
                time: seg.departure?.at,
                terminal: seg.departure?.terminal,
            },
            arrival: {
                airport: seg.arrival?.iataCode,
                time: seg.arrival?.at,
                terminal: seg.arrival?.terminal,
            },
            airline: seg.carrierCode,
            airlineName: getAirline(seg.carrierCode).name,
            airlineLogo: getAirline(seg.carrierCode).logo,
            flightNumber: `${seg.carrierCode}${seg.number}`,
            aircraft: seg.aircraft?.code,
            duration: seg.duration,
            cabinClass: offer.travelerPricings?.[0]?.fareDetailsBySegment?.find(f => f.segmentId === seg.id)?.cabin || 'ECONOMY',
        })) : []

        // Calculate total duration
        const outDuration = outbound?.duration || ''
        const inDuration = inbound?.duration || ''

        // Determine stops
        const outStops = outSegments.length - 1
        const inStops = inSegments.length - 1

        // Primary airline (first segment carrier)
        const mainAirline = outSegments[0]?.airline || 'TK'
        const airline = getAirline(mainAirline)

        return {
            id: offer.id || `flight-${idx}`,
            price,
            currency,
            priceFormatted: new Intl.NumberFormat('tr-TR').format(Math.round(price)),
            airline: {
                code: mainAirline,
                name: airline.name,
                logo: airline.logo,
                color: airline.color,
            },
            outbound: {
                segments: outSegments,
                duration: outDuration,
                stops: outStops,
                departTime: outSegments[0]?.departure?.time,
                arriveTime: outSegments[outSegments.length - 1]?.arrival?.time,
                departAirport: outSegments[0]?.departure?.airport,
                arriveAirport: outSegments[outSegments.length - 1]?.arrival?.airport,
            },
            inbound: inSegments.length > 0 ? {
                segments: inSegments,
                duration: inDuration,
                stops: inStops,
                departTime: inSegments[0]?.departure?.time,
                arriveTime: inSegments[inSegments.length - 1]?.arrival?.time,
                departAirport: inSegments[0]?.departure?.airport,
                arriveAirport: inSegments[inSegments.length - 1]?.arrival?.airport,
            } : null,
            totalStops: outStops + inStops,
            bookable: offer.numberOfBookableSeats || 0,
            lastTicketDate: offer.lastTicketingDate,
            isNonStop: outStops === 0 && inStops === 0,
        }
    })
}

// ═══════════════════════════════════════
// FORMAT DURATION (PT2H30M → 2sa 30dk)
// ═══════════════════════════════════════
function formatDuration(iso) {
    if (!iso) return ''
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
    if (!match) return iso
    const h = match[1] || '0'
    const m = match[2] || '0'
    return `${h}sa ${m}dk`
}

// ═══════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const origin = searchParams.get('origin') || 'IST'
        const destination = searchParams.get('destination')
        const departDate = searchParams.get('departDate')
        const returnDate = searchParams.get('returnDate') || ''
        const adults = searchParams.get('adults') || '1'
        const maxPrice = searchParams.get('maxPrice') || ''
        const nonStop = searchParams.get('nonStop') === 'true'

        if (!destination || !departDate) {
            return NextResponse.json({
                flights: [],
                error: 'destination and departDate are required',
            }, { status: 400 })
        }

        // Get token
        const token = await getAmadeusToken()

        // Search flights
        const raw = await searchFlights(token, {
            origin, destination, departDate, returnDate, adults, maxPrice, nonStop,
        })

        // Parse into clean format
        const flights = parseFlightOffers(raw)

        // Sort by price ascending
        flights.sort((a, b) => a.price - b.price)

        return NextResponse.json({
            flights,
            origin,
            destination,
            departDate,
            returnDate,
            total: flights.length,
            dictionaries: raw.dictionaries || {},
            searchedAt: new Date().toISOString(),
        })
    } catch (err) {
        console.error('Flight search error:', err)
        return NextResponse.json({
            flights: [],
            error: err.message || 'Flight search failed',
        }, { status: 500 })
    }
}
