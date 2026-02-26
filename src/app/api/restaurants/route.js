// Restaurant Discovery API — Google Places
import { NextResponse } from 'next/server'

const CATEGORIES = {
    all: { query: 'restaurants', emoji: '🍽️', name: 'Tümü' },
    kebab: { query: 'kebap restaurant', emoji: '🥩', name: 'Kebap & Et' },
    fish: { query: 'balık restaurant', emoji: '🐟', name: 'Balık' },
    fine_dining: { query: 'fine dining restaurant', emoji: '✨', name: 'Fine Dining' },
    cafe: { query: 'cafe', emoji: '☕', name: 'Kafe' },
    street: { query: 'sokak yemekleri street food', emoji: '🌯', name: 'Sokak Lezzetleri' },
    breakfast: { query: 'kahvaltı breakfast', emoji: '🥐', name: 'Kahvaltı' },
    dessert: { query: 'tatlıcı pastane dessert', emoji: '🍰', name: 'Tatlı & Pasta' },
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const city = searchParams.get('city')
        const category = searchParams.get('category') || 'all'
        const page = searchParams.get('page')

        if (!city) return NextResponse.json({ error: 'City is required' }, { status: 400 })

        const apiKey = process.env.GOOGLE_PLACES_API_KEY
        if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

        const cat = CATEGORIES[category] || CATEGORIES.all
        let url
        if (page) {
            url = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${page}&key=${apiKey}`
        } else {
            const params = new URLSearchParams({ query: `${cat.query} in ${city}`, key: apiKey, language: 'tr', type: 'restaurant' })
            url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`
        }

        const res = await fetch(url)
        const data = await res.json()

        const restaurants = (data.results || []).map(place => {
            let photoUrl = ''
            const photos = []
            if (place.photos?.length > 0) {
                photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${place.photos[0].photo_reference}&key=${apiKey}`
                photos.push(...place.photos.slice(0, 5).map(p =>
                    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${apiKey}`
                ))
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
                photos,
                price_level: place.price_level || 0,
                price_text: '₺'.repeat(Math.max(1, place.price_level || 1)),
                open_now: place.opening_hours?.open_now ?? null,
                category: category,
                category_emoji: cat.emoji,
                category_name: cat.name,
                maps_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            }
        })

        return NextResponse.json({
            restaurants, city,
            total: restaurants.length,
            categories: CATEGORIES,
            next_page: data.next_page_token || null,
        })
    } catch (err) {
        console.error('Restaurant API error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
