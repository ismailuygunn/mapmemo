// Airbnb listings search — via RapidAPI (Airbnb13)
// Get your key at: https://rapidapi.com/3b-data-3b-data-default/api/airbnb13
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const city = searchParams.get('city')
        const checkin = searchParams.get('checkin') || ''
        const checkout = searchParams.get('checkout') || ''
        const adults = searchParams.get('adults') || '2'
        const page = searchParams.get('page') || '1'

        if (!city) {
            return NextResponse.json({ error: 'City is required' }, { status: 400 })
        }

        const apiKey = process.env.RAPIDAPI_KEY
        if (!apiKey) {
            // Fallback: return structured empty response with setup instructions
            return NextResponse.json({
                listings: [],
                city,
                total: 0,
                setup_required: true,
                message: 'RapidAPI key not configured. Add RAPIDAPI_KEY to .env.local',
            })
        }

        const params = new URLSearchParams({
            location: city,
            checkin,
            checkout,
            adults,
            page,
            currency: 'TRY',
        })

        const res = await fetch(
            `https://airbnb13.p.rapidapi.com/search-location?${params}`,
            {
                headers: {
                    'X-RapidAPI-Key': apiKey,
                    'X-RapidAPI-Host': 'airbnb13.p.rapidapi.com',
                },
            }
        )

        if (!res.ok) {
            const errText = await res.text()
            console.error('Airbnb API error:', errText)
            return NextResponse.json({ listings: [], total: 0, error: 'Airbnb API error' })
        }

        const data = await res.json()

        const listings = (data.results || []).map(item => ({
            id: item.id,
            name: item.name,
            type: item.type || 'Entire home',
            city: item.city || city,
            lat: item.lat,
            lng: item.lng,
            photo_url: item.images?.[0] || '',
            photos: (item.images || []).slice(0, 8),
            price_per_night: item.price?.rate || item.price?.total || 0,
            price_total: item.price?.total || 0,
            currency: item.price?.currency || 'TRY',
            rating: item.rating || 0,
            review_count: item.reviewsCount || 0,
            bedrooms: item.bedrooms || 0,
            beds: item.beds || 0,
            bathrooms: item.bathrooms || 0,
            max_guests: item.persons || 0,
            amenities: item.previewAmenities || [],
            host_name: item.hostThumbnail ? 'Superhost' : 'Host',
            host_avatar: item.hostThumbnail || '',
            is_superhost: item.isSuperhost || false,
            url: item.url || `https://www.airbnb.com/rooms/${item.id}`,
        }))

        return NextResponse.json({
            listings,
            city,
            total: data.resultsCount || listings.length,
        })
    } catch (err) {
        console.error('Airbnb search error:', err)
        return NextResponse.json({ listings: [], error: err.message }, { status: 500 })
    }
}
