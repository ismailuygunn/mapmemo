import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const lat = searchParams.get('lat')
        const lng = searchParams.get('lng')
        const type = searchParams.get('type') || 'restaurant'
        const radius = searchParams.get('radius') || '1500'

        if (!lat || !lng) return NextResponse.json({ error: 'lat/lng required' }, { status: 400 })

        const apiKey = process.env.GOOGLE_PLACES_API_KEY
        if (!apiKey) return NextResponse.json({ error: 'API not configured' }, { status: 500 })

        const TYPES = {
            restaurant: 'restaurant',
            cafe: 'cafe',
            atm: 'atm',
            pharmacy: 'pharmacy',
            hospital: 'hospital',
            supermarket: 'supermarket',
            museum: 'museum',
            gas_station: 'gas_station',
            parking: 'parking',
            bus_station: 'bus_station',
            subway_station: 'subway_station',
            shopping_mall: 'shopping_mall',
        }

        const placeType = TYPES[type] || type

        const params = new URLSearchParams({
            location: `${lat},${lng}`,
            radius,
            type: placeType,
            key: apiKey,
            language: 'tr',
            rankby: 'prominence',
        })
        // rankby and radius conflict: remove rankby if radius is set
        if (radius !== '1500') params.delete('rankby')

        const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place'
        const res = await fetch(`${PLACES_BASE}/nearbysearch/json?${params}`)
        const data = await res.json()

        const places = (data.results || []).slice(0, 20).map(p => {
            // Calculate approximate distance
            const R = 6371e3
            const φ1 = lat * Math.PI / 180
            const φ2 = (p.geometry?.location?.lat || 0) * Math.PI / 180
            const Δφ = ((p.geometry?.location?.lat || 0) - lat) * Math.PI / 180
            const Δλ = ((p.geometry?.location?.lng || 0) - lng) * Math.PI / 180
            const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
            const distance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))

            return {
                place_id: p.place_id,
                name: p.name,
                rating: p.rating || 0,
                review_count: p.user_ratings_total || 0,
                address: p.vicinity || '',
                distance,
                distanceText: distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`,
                isOpen: p.opening_hours?.open_now ?? null,
                photo_url: p.photos?.[0]
                    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photos[0].photo_reference}&key=${apiKey}`
                    : null,
                price_level: p.price_level,
                map_url: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
                directions_url: `https://www.google.com/maps/dir/?api=1&destination=${p.geometry?.location?.lat},${p.geometry?.location?.lng}`,
                lat: p.geometry?.location?.lat,
                lng: p.geometry?.location?.lng,
            }
        }).sort((a, b) => a.distance - b.distance)

        return NextResponse.json({ places, total: places.length })
    } catch (err) {
        console.error('Nearby API error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
