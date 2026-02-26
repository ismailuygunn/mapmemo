// Google Directions API — Real route, duration, distance between two points
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const origin = searchParams.get('origin')           // "41.0082,28.9784" or "Istanbul"
        const destination = searchParams.get('destination') // "39.9334,32.8597" or "Ankara"
        const mode = searchParams.get('mode') || 'driving'  // driving, walking, transit, bicycling
        const language = searchParams.get('lang') || 'tr'

        if (!origin || !destination) {
            return NextResponse.json({ error: 'Origin and destination are required' }, { status: 400 })
        }

        const apiKey = process.env.GOOGLE_PLACES_API_KEY
        if (!apiKey) {
            return NextResponse.json({
                available: false,
                message: 'Google Directions API not configured',
            })
        }

        const params = new URLSearchParams({
            origin,
            destination,
            mode,
            language,
            key: apiKey,
            alternatives: 'true',
        })

        const res = await fetch(`https://maps.googleapis.com/maps/api/directions/json?${params}`)
        const data = await res.json()

        if (data.status !== 'OK') {
            return NextResponse.json({
                available: false,
                message: `Directions API: ${data.status}`,
                error_message: data.error_message || null,
            })
        }

        // Format routes
        const routes = data.routes.map((route, idx) => {
            const leg = route.legs[0]
            return {
                routeIndex: idx,
                summary: route.summary,
                distance: leg.distance.text,
                distanceMeters: leg.distance.value,
                duration: leg.duration.text,
                durationSeconds: leg.duration.value,
                durationInTraffic: leg.duration_in_traffic?.text || null,
                startAddress: leg.start_address,
                endAddress: leg.end_address,
                steps: leg.steps.map(step => ({
                    instruction: step.html_instructions?.replace(/<[^>]*>/g, '') || '',
                    distance: step.distance.text,
                    duration: step.duration.text,
                    travelMode: step.travel_mode,
                    transitDetails: step.transit_details ? {
                        line: step.transit_details.line?.short_name || step.transit_details.line?.name,
                        vehicle: step.transit_details.line?.vehicle?.type,
                        departureStop: step.transit_details.departure_stop?.name,
                        arrivalStop: step.transit_details.arrival_stop?.name,
                        numStops: step.transit_details.num_stops,
                    } : null,
                })),
                polyline: route.overview_polyline?.points || null,
            }
        })

        return NextResponse.json({
            available: true,
            mode,
            routes,
        })
    } catch (err) {
        console.error('Directions API error:', err)
        return NextResponse.json({ available: false, message: err.message }, { status: 500 })
    }
}
