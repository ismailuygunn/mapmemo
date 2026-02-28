// Spot Photo API — fetch Google Places photo for a spot by name + coordinates
import { NextResponse } from 'next/server'

const BASE = 'https://maps.googleapis.com/maps/api/place'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const name = searchParams.get('name')
        const lat = searchParams.get('lat')
        const lng = searchParams.get('lng')

        const apiKey = process.env.GOOGLE_PLACES_API_KEY
        if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })
        if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

        // 1. Find the place via text search near coordinates
        const query = `${name} Istanbul`
        const locationBias = lat && lng ? `&location=${lat},${lng}&radius=2000` : ''
        const searchRes = await fetch(
            `${BASE}/textsearch/json?query=${encodeURIComponent(query)}${locationBias}&key=${apiKey}&language=tr`
        )
        const searchData = await searchRes.json()
        const place = searchData.results?.[0]

        if (!place) {
            return NextResponse.json({ found: false, photo: null })
        }

        // 2. Get photo URL from the place
        const photoRef = place.photos?.[0]?.photo_reference
        const photoUrl = photoRef
            ? `${BASE}/photo?maxwidth=800&photo_reference=${photoRef}&key=${apiKey}`
            : null

        // 3. Build Google Maps link
        const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${place.place_id}`

        return NextResponse.json({
            found: true,
            place_id: place.place_id,
            name: place.name,
            photo: photoUrl,
            maps_url: mapsUrl,
            rating: place.rating || 0,
            review_count: place.user_ratings_total || 0,
            address: place.formatted_address || '',
            lat: place.geometry?.location?.lat,
            lng: place.geometry?.location?.lng,
        })
    } catch (err) {
        console.error('Spot photo error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
