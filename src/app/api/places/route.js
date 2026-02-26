// Google Places API — Real restaurant, attraction, cafe data with ratings
import { NextResponse } from 'next/server'

const GOOGLE_PLACES_BASE = 'https://maps.googleapis.com/maps/api/place'

// Geocode a city name to lat/lng
async function geocodeCity(city, apiKey) {
    const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${apiKey}`
    )
    const data = await res.json()
    if (data.results?.[0]?.geometry?.location) {
        return data.results[0].geometry.location // { lat, lng }
    }
    return null
}

// Nearby Search — find places by type near a location
async function nearbySearch(lat, lng, type, apiKey, radius = 5000, keyword = '') {
    const params = new URLSearchParams({
        location: `${lat},${lng}`,
        radius: String(radius),
        type,
        key: apiKey,
        language: 'tr', // Turkish results first
    })
    if (keyword) params.append('keyword', keyword)

    const res = await fetch(`${GOOGLE_PLACES_BASE}/nearbysearch/json?${params}`)
    const data = await res.json()
    return data.results || []
}

// Text Search — better for specific queries like "local food Istanbul"
async function textSearch(query, apiKey) {
    const params = new URLSearchParams({
        query,
        key: apiKey,
        language: 'tr',
    })

    const res = await fetch(`${GOOGLE_PLACES_BASE}/textsearch/json?${params}`)
    const data = await res.json()
    return data.results || []
}

// Place Details — get reviews, hours, phone
async function getPlaceDetails(placeId, apiKey) {
    const params = new URLSearchParams({
        place_id: placeId,
        key: apiKey,
        language: 'tr',
        fields: 'name,rating,user_ratings_total,price_level,formatted_address,geometry,opening_hours,reviews,photos,types,editorial_summary',
    })

    const res = await fetch(`${GOOGLE_PLACES_BASE}/details/json?${params}`)
    const data = await res.json()
    return data.result || null
}

// Format a place for consistent output
function formatPlace(place) {
    return {
        id: place.place_id,
        name: place.name,
        rating: place.rating || 0,
        reviewCount: place.user_ratings_total || 0,
        priceLevel: place.price_level ?? null, // 0-4
        address: place.formatted_address || place.vicinity || '',
        lat: place.geometry?.location?.lat,
        lng: place.geometry?.location?.lng,
        types: place.types || [],
        isOpen: place.opening_hours?.open_now ?? null,
        photoRef: place.photos?.[0]?.photo_reference || null,
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const city = searchParams.get('city')
        const type = searchParams.get('type') || 'restaurant' // restaurant, tourist_attraction, museum, cafe, bar, park
        const query = searchParams.get('query') // free text search
        const placeId = searchParams.get('place_id') // get details for specific place
        const limit = parseInt(searchParams.get('limit') || '20')

        const apiKey = process.env.GOOGLE_PLACES_API_KEY
        if (!apiKey) {
            return NextResponse.json({
                available: false,
                message: 'Google Places API not configured. Add GOOGLE_PLACES_API_KEY to .env.local',
                places: [],
            })
        }

        // Autocomplete mode — city suggestions
        const action = searchParams.get('action')
        if (action === 'autocomplete') {
            const q = searchParams.get('query') || ''
            const lang = searchParams.get('lang') || 'tr'
            if (q.length < 2) return NextResponse.json({ suggestions: [] })

            const params = new URLSearchParams({
                input: q,
                types: '(cities)',
                key: apiKey,
                language: lang,
            })
            const res = await fetch(`${GOOGLE_PLACES_BASE}/autocomplete/json?${params}`)
            const data = await res.json()
            const suggestions = (data.predictions || []).map(p => ({
                name: p.structured_formatting?.main_text || p.description,
                fullName: p.description,
                placeId: p.place_id,
            }))
            return NextResponse.json({ suggestions })
        }

        // Place Details mode
        if (placeId) {
            const details = await getPlaceDetails(placeId, apiKey)
            if (!details) {
                return NextResponse.json({ error: 'Place not found' }, { status: 404 })
            }
            return NextResponse.json({
                available: true,
                place: {
                    ...formatPlace(details),
                    hours: details.opening_hours?.weekday_text || [],
                    reviews: (details.reviews || []).slice(0, 5).map(r => ({
                        author: r.author_name,
                        rating: r.rating,
                        text: r.text,
                        time: r.relative_time_description,
                    })),
                    summary: details.editorial_summary?.overview || '',
                },
            })
        }

        // City is required for search
        if (!city) {
            return NextResponse.json({ error: 'City is required' }, { status: 400 })
        }

        // Text search mode (e.g., "best local food in Istanbul")
        if (query) {
            const results = await textSearch(`${query} ${city}`, apiKey)
            const places = results.slice(0, limit).map(formatPlace)
            return NextResponse.json({ available: true, places, source: 'text_search' })
        }

        // Nearby search mode — get real places by type
        const coords = await geocodeCity(city, apiKey)
        if (!coords) {
            return NextResponse.json({ error: `Could not geocode city: ${city}` }, { status: 400 })
        }

        const results = await nearbySearch(coords.lat, coords.lng, type, apiKey)

        // Sort by rating * reviewCount (popularity score)
        const sorted = results
            .filter(p => p.rating && p.user_ratings_total)
            .sort((a, b) => {
                const scoreA = a.rating * Math.log10(a.user_ratings_total + 1)
                const scoreB = b.rating * Math.log10(b.user_ratings_total + 1)
                return scoreB - scoreA
            })

        // Split into "popular" (top rated + many reviews) and "hidden gems" (high rating, fewer reviews)
        const popular = sorted
            .filter(p => p.user_ratings_total >= 100)
            .slice(0, Math.ceil(limit * 0.6))

        const hiddenGems = sorted
            .filter(p => p.rating >= 4.3 && p.user_ratings_total < 500 && p.user_ratings_total >= 10)
            .filter(p => !popular.find(pp => pp.place_id === p.place_id))
            .slice(0, Math.ceil(limit * 0.4))

        const places = [...popular, ...hiddenGems].map(formatPlace)

        return NextResponse.json({
            available: true,
            city,
            coords,
            type,
            total: places.length,
            popular: popular.length,
            hiddenGems: hiddenGems.length,
            places,
            source: 'nearby_search',
        })
    } catch (err) {
        console.error('Places API error:', err)
        return NextResponse.json({ available: false, places: [], message: err.message }, { status: 500 })
    }
}
