// Flights API — Amadeus Flight Search
// Provides flight offers between origin and destination
import { NextResponse } from 'next/server'

let accessToken = null
let tokenExpiry = 0

async function getAmadeusToken() {
    if (accessToken && Date.now() < tokenExpiry) return accessToken

    const clientId = process.env.AMADEUS_API_KEY
    const clientSecret = process.env.AMADEUS_API_SECRET
    if (!clientId || !clientSecret) return null

    const res = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
    })

    if (!res.ok) return null
    const data = await res.json()
    accessToken = data.access_token
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
    return accessToken
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const origin = searchParams.get('origin')         // IATA code: IST
        const destination = searchParams.get('destination') // IATA code: CDG
        const departureDate = searchParams.get('departure') // 2024-03-15
        const returnDate = searchParams.get('return')       // 2024-03-20
        const adults = searchParams.get('adults') || '2'
        const currency = searchParams.get('currency') || 'TRY'

        if (!origin || !destination || !departureDate) {
            return NextResponse.json({ error: 'Origin, destination, and departure date are required' }, { status: 400 })
        }

        const token = await getAmadeusToken()
        if (!token) {
            return NextResponse.json({
                available: false,
                message: 'Flight search not configured. Add AMADEUS_API_KEY and AMADEUS_API_SECRET to .env.local',
                flights: [],
            })
        }

        const params = new URLSearchParams({
            originLocationCode: origin,
            destinationLocationCode: destination,
            departureDate,
            adults,
            currencyCode: currency,
            max: 5,
            nonStop: 'false',
        })
        if (returnDate) params.append('returnDate', returnDate)

        const res = await fetch(`https://test.api.amadeus.com/v2/shopping/flight-offers?${params}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        })

        if (!res.ok) {
            const error = await res.text()
            console.error('Amadeus error:', error)
            return NextResponse.json({ available: false, flights: [], message: 'Flight search failed' })
        }

        const data = await res.json()
        const flights = (data.data || []).map(offer => ({
            id: offer.id,
            price: offer.price.total,
            currency: offer.price.currency,
            segments: offer.itineraries.map(itin => ({
                duration: itin.duration,
                segments: itin.segments.map(seg => ({
                    departure: seg.departure.iataCode,
                    departureTime: seg.departure.at,
                    arrival: seg.arrival.iataCode,
                    arrivalTime: seg.arrival.at,
                    carrier: seg.carrierCode,
                    flightNumber: `${seg.carrierCode}${seg.number}`,
                    duration: seg.duration,
                })),
            })),
            bookingClass: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'ECONOMY',
        }))

        return NextResponse.json({ available: true, flights })
    } catch (err) {
        console.error('Flights API error:', err)
        return NextResponse.json({ available: false, flights: [], message: 'Server error' }, { status: 500 })
    }
}
