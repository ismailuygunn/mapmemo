// Hotels search API — Google Places + detailed info
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const city = searchParams.get('city')
        const checkIn = searchParams.get('checkin')
        const checkOut = searchParams.get('checkout')
        const page = searchParams.get('page') // next_page_token

        if (!city) {
            return NextResponse.json({ error: 'City is required' }, { status: 400 })
        }

        const apiKey = process.env.GOOGLE_PLACES_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
        }

        let url
        if (page) {
            // Pagination
            url = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${page}&key=${apiKey}`
        } else {
            const params = new URLSearchParams({
                query: `hotels in ${city}`,
                key: apiKey,
                language: 'tr',
                type: 'lodging',
            })
            url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`
        }

        const res = await fetch(url)
        const data = await res.json()

        const hotels = (data.results || []).map(place => {
            // Determine hotel class from types/price_level
            let hotelClass = 'Hotel'
            if (place.types?.includes('lodging')) {
                if (place.price_level >= 4) hotelClass = 'Luxury Hotel'
                else if (place.price_level >= 3) hotelClass = 'Premium Hotel'
                else if (place.price_level >= 2) hotelClass = 'Mid-Range Hotel'
                else if (place.price_level >= 1) hotelClass = 'Budget Hotel'
            }

            // Photo URL
            let photoUrl = ''
            const photos = []
            if (place.photos?.length > 0) {
                photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${place.photos[0].photo_reference}&key=${apiKey}`
                photos.push(...place.photos.slice(0, 5).map(p =>
                    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${apiKey}`
                ))
            }

            // Price indicator
            const priceLevel = place.price_level || 0
            const priceText = '₺'.repeat(Math.max(1, priceLevel))

            return {
                place_id: place.place_id,
                name: place.name,
                class: hotelClass,
                address: place.formatted_address || '',
                lat: place.geometry?.location?.lat,
                lng: place.geometry?.location?.lng,
                rating: place.rating || 0,
                review_count: place.user_ratings_total || 0,
                photo_url: photoUrl,
                photos,
                price_level: priceLevel,
                price_text: priceText,
                open_now: place.opening_hours?.open_now ?? null,
                // Booking links
                booking_url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(place.name + ' ' + city)}&checkin=${checkIn || ''}&checkout=${checkOut || ''}`,
                airbnb_url: `https://www.airbnb.com/s/${encodeURIComponent(city)}/homes`,
                maps_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            }
        })

        return NextResponse.json({
            hotels,
            city,
            total: hotels.length,
            next_page: data.next_page_token || null,
        })
    } catch (err) {
        console.error('Hotels search error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
