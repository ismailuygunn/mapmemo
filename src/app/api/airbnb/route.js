// NAVISO — Airbnb Search API
// Uses RapidAPI Airbnb endpoint for real listings
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const location = searchParams.get('location') || 'Istanbul'
        const checkin = searchParams.get('checkin') || ''
        const checkout = searchParams.get('checkout') || ''
        const adults = searchParams.get('adults') || '2'
        const currency = searchParams.get('currency') || 'TRY'
        const KEY = process.env.RAPIDAPI_KEY
        if (!KEY) return NextResponse.json({ listings: [], error: 'API key missing' }, { status: 500 })

        const res = await fetch(
            `https://airbnb13.p.rapidapi.com/search-location?location=${encodeURIComponent(location)}&checkin=${checkin}&checkout=${checkout}&adults=${adults}&currency=${currency}&page=1`,
            { headers: { 'x-rapidapi-key': KEY, 'x-rapidapi-host': 'airbnb13.p.rapidapi.com' } }
        )
        if (!res.ok) return NextResponse.json({ listings: [], error: `API ${res.status}` }, { status: 500 })

        const data = await res.json()
        const results = data?.results || []
        const listings = results.slice(0, 20).map((item, i) => ({
            id: item.id || `l-${i}`,
            name: item.name || '',
            type: item.type || 'Entire home',
            photos: (item.images || [item.thumbnail]).filter(Boolean).slice(0, 5),
            price: item.price?.rate || item.price?.total || 0,
            priceDisplay: item.price?.priceItems?.[0]?.title || `${item.price?.rate || 0} ${currency}`,
            currency,
            rating: item.rating || 0,
            reviewCount: item.reviewsCount || 0,
            city: item.city || location,
            neighborhood: item.address || '',
            beds: item.beds || 0,
            bathrooms: item.bathrooms || 0,
            guests: item.persons || 0,
            isSuperhost: item.isSuperhost || false,
            url: item.url || `https://www.airbnb.com/rooms/${item.id}`,
            amenities: (item.previewAmenities || []).slice(0, 4),
        }))

        return NextResponse.json({ listings, location, total: listings.length, searchedAt: new Date().toISOString() })
    } catch (err) {
        console.error('Airbnb error:', err)
        return NextResponse.json({ listings: [], error: err.message }, { status: 500 })
    }
}
