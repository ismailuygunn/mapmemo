// Places search API — powered by Google Places
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('query')
        const city = searchParams.get('city')
        const type = searchParams.get('type') || 'tourist_attraction'

        if (!city) {
            return NextResponse.json({ error: 'City is required' }, { status: 400 })
        }

        const apiKey = process.env.GOOGLE_PLACES_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 500 })
        }

        const searchQuery = query ? `${query} ${city}` : `popular ${type} in ${city}`

        // Text Search API
        const params = new URLSearchParams({
            query: searchQuery,
            key: apiKey,
            language: 'tr',
            type: type,
        })

        const res = await fetch(
            `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`
        )

        if (!res.ok) {
            return NextResponse.json({ error: 'Places API error' }, { status: 500 })
        }

        const data = await res.json()

        const places = (data.results || []).map(place => {
            // Determine category from types
            let category = 'SIGHTS & LANDMARKS'
            if (place.types?.includes('museum')) category = 'MUSEUMS'
            else if (place.types?.includes('church') || place.types?.includes('mosque') || place.types?.includes('hindu_temple')) category = 'RELIGIOUS SITES'
            else if (place.types?.includes('restaurant') || place.types?.includes('food')) category = 'RESTAURANTS'
            else if (place.types?.includes('cafe')) category = 'CAFES'
            else if (place.types?.includes('park') || place.types?.includes('natural_feature')) category = 'NATURE & PARKS'
            else if (place.types?.includes('shopping_mall') || place.types?.includes('store')) category = 'SHOPPING'
            else if (place.types?.includes('night_club') || place.types?.includes('bar')) category = 'NIGHTLIFE'
            else if (place.types?.includes('spa') || place.types?.includes('gym')) category = 'WELLNESS'
            else if (place.types?.includes('lodging')) category = 'HOTELS'
            else if (place.types?.includes('art_gallery')) category = 'ART & CULTURE'
            else if (place.types?.includes('amusement_park') || place.types?.includes('aquarium') || place.types?.includes('zoo')) category = 'ENTERTAINMENT'
            else if (place.types?.includes('transit_station') || place.types?.includes('airport')) category = 'TRANSPORT'
            else if (place.types?.includes('university') || place.types?.includes('library')) category = 'EDUCATION'
            else if (place.types?.includes('point_of_interest')) category = 'SIGHTS & LANDMARKS'

            // Photo URL
            let photoUrl = ''
            if (place.photos?.[0]?.photo_reference) {
                photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${place.photos[0].photo_reference}&key=${apiKey}`
            }

            return {
                place_id: place.place_id,
                name: place.name,
                category,
                address: place.formatted_address || '',
                lat: place.geometry?.location?.lat,
                lng: place.geometry?.location?.lng,
                rating: place.rating || 0,
                review_count: place.user_ratings_total || 0,
                photo_url: photoUrl,
                photos: (place.photos || []).slice(0, 5).map(p =>
                    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${apiKey}`
                ),
                opening_hours: place.opening_hours ? {
                    open_now: place.opening_hours.open_now,
                } : null,
                external_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
                types: place.types || [],
            }
        })

        return NextResponse.json({
            places,
            city,
            total: places.length,
        })
    } catch (err) {
        console.error('Places search error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
