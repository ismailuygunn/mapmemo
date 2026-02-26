import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const city = searchParams.get('city')
        if (!city) return NextResponse.json({ error: 'City required' }, { status: 400 })

        const apiKey = process.env.GOOGLE_PLACES_API_KEY
        if (!apiKey) return NextResponse.json({ error: 'API not configured' }, { status: 500 })

        // Geocode the city
        const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${apiKey}`)
        const geoData = await geoRes.json()
        const coords = geoData.results?.[0]?.geometry?.location
        if (!coords) return NextResponse.json({ spots: [] })

        const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place'

        const fetchSpots = async (type, keyword = '') => {
            const params = new URLSearchParams({
                location: `${coords.lat},${coords.lng}`,
                radius: '10000',
                type,
                key: apiKey,
                language: 'tr',
            })
            if (keyword) params.append('keyword', keyword)
            const res = await fetch(`${PLACES_BASE}/nearbysearch/json?${params}`)
            const data = await res.json()
            return (data.results || []).filter(p => p.rating && p.photos?.length > 0)
        }

        const [viewpoints, parks, monuments, landmarks] = await Promise.all([
            fetchSpots('point_of_interest', 'viewpoint panorama manzara'),
            fetchSpots('park', 'scenic garden botanical'),
            fetchSpots('tourist_attraction', 'monument bridge tower castle'),
            fetchSpots('tourist_attraction', 'instagram iconic photo spot'),
        ])

        // Combine, deduplicate, sort by rating * log(reviews)
        const seen = new Set()
        const all = [...viewpoints, ...parks, ...monuments, ...landmarks]
            .filter(p => {
                if (seen.has(p.place_id)) return false
                seen.add(p.place_id)
                return true
            })
            .sort((a, b) => (b.rating * Math.log10((b.user_ratings_total || 1) + 1)) - (a.rating * Math.log10((a.user_ratings_total || 1) + 1)))
            .slice(0, 20)

        const spots = all.map(p => ({
            place_id: p.place_id,
            name: p.name,
            rating: p.rating,
            review_count: p.user_ratings_total || 0,
            address: p.vicinity || p.formatted_address || '',
            photo_url: p.photos?.[0]
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${p.photos[0].photo_reference}&key=${apiKey}`
                : null,
            types: p.types || [],
            map_url: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
            lat: p.geometry?.location?.lat,
            lng: p.geometry?.location?.lng,
        }))

        return NextResponse.json({ spots })
    } catch (err) {
        console.error('Photo spots error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
