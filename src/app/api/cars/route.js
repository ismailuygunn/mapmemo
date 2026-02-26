// Car rental agencies — real listings from Google Places
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const city = searchParams.get('city')

        if (!city) {
            return NextResponse.json({ error: 'City is required' }, { status: 400 })
        }

        const apiKey = process.env.GOOGLE_PLACES_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
        }

        const params = new URLSearchParams({
            query: `car rental in ${city}`,
            key: apiKey,
            language: 'tr',
            type: 'car_rental',
        })

        const res = await fetch(
            `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`
        )

        if (!res.ok) {
            return NextResponse.json({ error: 'Places API error' }, { status: 500 })
        }

        const data = await res.json()

        const agencies = (data.results || []).map(place => {
            let photoUrl = ''
            if (place.photos?.[0]?.photo_reference) {
                photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${apiKey}`
            }

            return {
                place_id: place.place_id,
                name: place.name,
                address: place.formatted_address || '',
                lat: place.geometry?.location?.lat,
                lng: place.geometry?.location?.lng,
                rating: place.rating || 0,
                review_count: place.user_ratings_total || 0,
                photo_url: photoUrl,
                open_now: place.opening_hours?.open_now ?? null,
                price_level: place.price_level || 0,
            }
        })

        return NextResponse.json({ agencies, city, total: agencies.length })
    } catch (err) {
        console.error('Car rental search error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
