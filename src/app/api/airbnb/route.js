// NAVISO — Airbnb Search API v2
// Uses RapidAPI Airbnb endpoint with geo support + multiple pages
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const location = searchParams.get('location') || 'Istanbul'
        const checkin = searchParams.get('checkin') || ''
        const checkout = searchParams.get('checkout') || ''
        const adults = searchParams.get('adults') || '2'
        const currency = searchParams.get('currency') || 'TRY'
        const lat = searchParams.get('lat')
        const lng = searchParams.get('lng')
        const radius = searchParams.get('radius') || ''  // km
        const KEY = process.env.RAPIDAPI_KEY
        if (!KEY) return NextResponse.json({ listings: [], error: 'API key missing' }, { status: 500 })

        // Build search URL — prefer geo search if lat/lng provided
        let baseUrl
        if (lat && lng) {
            baseUrl = `https://airbnb13.p.rapidapi.com/search-geo?lat=${lat}&lng=${lng}&checkin=${checkin}&checkout=${checkout}&adults=${adults}&currency=${currency}`
            if (radius) baseUrl += `&radius=${radius}`
        } else {
            baseUrl = `https://airbnb13.p.rapidapi.com/search-location?location=${encodeURIComponent(location)}&checkin=${checkin}&checkout=${checkout}&adults=${adults}&currency=${currency}`
        }

        // Fetch page 1
        const res = await fetch(`${baseUrl}&page=1`, {
            headers: { 'x-rapidapi-key': KEY, 'x-rapidapi-host': 'airbnb13.p.rapidapi.com' },
        })
        if (!res.ok) return NextResponse.json({ listings: [], error: `API ${res.status}` }, { status: 500 })

        const data = await res.json()
        let results = data?.results || []

        // Fetch page 2 in parallel for more results
        try {
            const res2 = await fetch(`${baseUrl}&page=2`, {
                headers: { 'x-rapidapi-key': KEY, 'x-rapidapi-host': 'airbnb13.p.rapidapi.com' },
            })
            if (res2.ok) {
                const d2 = await res2.json()
                const r2 = d2?.results || []
                if (r2.length > 0) results = [...results, ...r2]
            }
        } catch { /* page 2 is optional */ }

        // Deduplicate by ID
        const seen = new Set()
        results = results.filter(r => {
            const id = r.id || r.url
            if (seen.has(id)) return false
            seen.add(id)
            return true
        })

        const listings = results.map((item, i) => ({
            id: item.id || `l-${i}`,
            name: item.name || '',
            type: item.type || 'Entire home',
            photos: (item.images || [item.thumbnail]).filter(Boolean).slice(0, 8),
            price: item.price?.rate || item.price?.total || 0,
            totalPrice: item.price?.total || 0,
            priceDisplay: item.price?.priceItems?.[0]?.title || '',
            currency,
            rating: item.rating || 0,
            reviewCount: item.reviewsCount || 0,
            city: item.city || location,
            neighborhood: item.address || '',
            beds: item.beds || 0,
            bedrooms: item.bedrooms || 0,
            bathrooms: item.bathrooms || 0,
            guests: item.persons || 0,
            isSuperhost: item.isSuperhost || false,
            rareFind: item.rareFind || false,
            lat: item.lat || null,
            lng: item.lng || null,
            url: item.url || `https://www.airbnb.com/rooms/${item.id}`,
            deeplink: item.deeplink || '',
            amenities: (item.previewAmenities || []).slice(0, 4),
            cancelPolicy: item.cancelPolicy || '',
        }))

        return NextResponse.json({
            listings,
            location,
            total: listings.length,
            searchedAt: new Date().toISOString(),
            hasGeo: listings.some(l => l.lat && l.lng),
        })
    } catch (err) {
        console.error('Airbnb error:', err)
        return NextResponse.json({ listings: [], error: err.message }, { status: 500 })
    }
}
