// Place Details API — full in-app details (reviews, phone, website, hours, photos)
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const placeId = searchParams.get('place_id')

        if (!placeId) {
            return NextResponse.json({ error: 'place_id is required' }, { status: 400 })
        }

        const apiKey = process.env.GOOGLE_PLACES_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
        }

        const fields = [
            'name', 'place_id', 'formatted_address', 'formatted_phone_number',
            'international_phone_number', 'website', 'url', 'rating', 'user_ratings_total',
            'price_level', 'opening_hours', 'reviews', 'photos', 'types',
            'geometry', 'business_status', 'editorial_summary',
        ].join(',')

        const res = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&language=tr&key=${apiKey}`
        )

        if (!res.ok) {
            return NextResponse.json({ error: 'Places API error' }, { status: 500 })
        }

        const data = await res.json()
        const p = data.result

        if (!p) {
            return NextResponse.json({ error: 'Place not found' }, { status: 404 })
        }

        // Build photo URLs
        const photos = (p.photos || []).slice(0, 8).map(photo =>
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${apiKey}`
        )

        // Parse reviews
        const reviews = (p.reviews || []).map(r => ({
            author: r.author_name,
            avatar: r.profile_photo_url,
            rating: r.rating,
            text: r.text,
            time: r.relative_time_description,
            language: r.language,
        }))

        // Parse hours
        const hours = p.opening_hours ? {
            open_now: p.opening_hours.open_now,
            periods: p.opening_hours.periods || [],
            weekday_text: p.opening_hours.weekday_text || [],
        } : null

        return NextResponse.json({
            place_id: p.place_id,
            name: p.name,
            address: p.formatted_address,
            phone: p.formatted_phone_number || p.international_phone_number,
            website: p.website,
            maps_url: p.url,
            rating: p.rating || 0,
            review_count: p.user_ratings_total || 0,
            price_level: p.price_level || 0,
            lat: p.geometry?.location?.lat,
            lng: p.geometry?.location?.lng,
            photos,
            reviews,
            hours,
            types: p.types || [],
            business_status: p.business_status,
            editorial_summary: p.editorial_summary?.overview || '',
        })
    } catch (err) {
        console.error('Place detail error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
