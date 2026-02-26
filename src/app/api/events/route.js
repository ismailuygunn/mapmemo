// Events API — Real events: concerts, theater, standup, workshops, exhibitions
// Uses Ticketmaster (primary) + Google Places + custom categories
import { NextResponse } from 'next/server'

const TICKETMASTER_BASE = 'https://app.ticketmaster.com/discovery/v2'

// Event categories with emojis and search terms
const EVENT_CATEGORIES = {
    concert: { emoji: '🎵', name: 'Konser', tm_id: 'KZFzniwnSyZfZ7v7nJ', keywords: ['concert', 'live music', 'konser'] },
    theater: { emoji: '🎭', name: 'Tiyatro', tm_id: 'KZFzniwnSyZfZ7v7na', keywords: ['theater', 'tiyatro', 'play'] },
    standup: { emoji: '😂', name: 'Stand-up', tm_id: 'KZFzniwnSyZfZ7v7na', keywords: ['comedy', 'standup', 'stand-up'] },
    workshop: { emoji: '🎨', name: 'Atölye', tm_id: '', keywords: ['workshop', 'atölye', 'class'] },
    exhibition: { emoji: '🖼️', name: 'Sergi', tm_id: 'KZFzniwnSyZfZ7v7nn', keywords: ['exhibition', 'sergi', 'gallery', 'müze'] },
    festival: { emoji: '🎪', name: 'Festival', tm_id: 'KZFzniwnSyZfZ7v7n1', keywords: ['festival'] },
    sports: { emoji: '⚽', name: 'Spor', tm_id: 'KZFzniwnSyZfZ7v7nE', keywords: ['sports', 'match', 'game', 'maç'] },
    nightlife: { emoji: '🌙', name: 'Gece Hayatı', tm_id: '', keywords: ['nightlife', 'club', 'dj', 'party'] },
}

// Fetch from Ticketmaster
async function fetchTicketmaster(city, startDate, endDate, category, apiKey) {
    if (!apiKey) return []

    const params = new URLSearchParams({
        apikey: apiKey,
        city: city,
        startDateTime: `${startDate}T00:00:00Z`,
        endDateTime: `${endDate}T23:59:59Z`,
        size: '20',
        sort: 'date,asc',
        locale: '*',
    })

    const catConfig = EVENT_CATEGORIES[category]
    if (catConfig?.tm_id) {
        params.append('classificationId', catConfig.tm_id)
    }
    if (catConfig?.keywords?.[0]) {
        params.append('keyword', catConfig.keywords[0])
    }

    try {
        const res = await fetch(`${TICKETMASTER_BASE}/events.json?${params}`)
        if (!res.ok) return []
        const data = await res.json()

        return (data._embedded?.events || []).map(event => ({
            id: event.id,
            name: event.name,
            category: category,
            categoryEmoji: catConfig?.emoji || '🎫',
            categoryName: catConfig?.name || category,
            date: event.dates?.start?.localDate || '',
            time: event.dates?.start?.localTime || '',
            venue: event._embedded?.venues?.[0]?.name || '',
            address: event._embedded?.venues?.[0]?.address?.line1 || '',
            city: event._embedded?.venues?.[0]?.city?.name || city,
            imageUrl: event.images?.[0]?.url || '',
            url: event.url || '',
            priceRange: event.priceRanges ? {
                min: event.priceRanges[0]?.min,
                max: event.priceRanges[0]?.max,
                currency: event.priceRanges[0]?.currency || 'TRY',
            } : null,
            source: 'ticketmaster',
        }))
    } catch (err) {
        console.error('Ticketmaster error:', err.message)
        return []
    }
}

// Fetch events via Google Places text search (workshops, exhibitions, local events)
async function fetchGoogleEvents(city, category, googleKey) {
    if (!googleKey) return []

    const catConfig = EVENT_CATEGORIES[category]
    const keywords = catConfig?.keywords || [category]
    const query = `${keywords[0]} ${city} events`

    try {
        const params = new URLSearchParams({
            query,
            key: googleKey,
            language: 'tr',
        })
        const res = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`)
        if (!res.ok) return []
        const data = await res.json()

        return (data.results || []).slice(0, 10).map((place, i) => ({
            id: `google-${place.place_id}`,
            name: place.name,
            category: category,
            categoryEmoji: catConfig?.emoji || '🎫',
            categoryName: catConfig?.name || category,
            date: '',
            time: '',
            venue: place.name,
            address: place.formatted_address || '',
            city: city,
            rating: place.rating || 0,
            reviewCount: place.user_ratings_total || 0,
            imageUrl: place.photos?.[0]
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${googleKey}`
                : '',
            url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
            source: 'google',
        }))
    } catch (err) {
        console.error('Google events error:', err.message)
        return []
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const city = searchParams.get('city')
        const startDate = searchParams.get('start') || new Date().toISOString().split('T')[0]
        const endDate = searchParams.get('end') || startDate
        const category = searchParams.get('category') || 'all'

        if (!city) {
            return NextResponse.json({ error: 'City is required' }, { status: 400 })
        }

        const tmKey = process.env.TICKETMASTER_API_KEY
        const googleKey = process.env.GOOGLE_PLACES_API_KEY

        // Determine which categories to fetch
        const categoriesToFetch = category === 'all'
            ? Object.keys(EVENT_CATEGORIES)
            : [category]

        let allEvents = []

        // Fetch from all sources in parallel
        const fetchPromises = categoriesToFetch.flatMap(cat => [
            fetchTicketmaster(city, startDate, endDate, cat, tmKey),
            fetchGoogleEvents(city, cat, googleKey),
        ])

        const results = await Promise.allSettled(fetchPromises)
        results.forEach(r => {
            if (r.status === 'fulfilled' && Array.isArray(r.value)) {
                allEvents.push(...r.value)
            }
        })

        // Deduplicate by name similarity
        const seen = new Set()
        const uniqueEvents = allEvents.filter(e => {
            const key = e.name.toLowerCase().replace(/[^a-zığüşöç0-9]/g, '').substring(0, 20)
            if (seen.has(key)) return false
            seen.add(key)
            return true
        })

        // Sort: events with dates first, then by date
        uniqueEvents.sort((a, b) => {
            if (a.date && !b.date) return -1
            if (!a.date && b.date) return 1
            if (a.date && b.date) return a.date.localeCompare(b.date)
            return 0
        })

        // Group by category
        const grouped = {}
        for (const cat of Object.keys(EVENT_CATEGORIES)) {
            const events = uniqueEvents.filter(e => e.category === cat)
            if (events.length > 0) {
                grouped[cat] = {
                    ...EVENT_CATEGORIES[cat],
                    count: events.length,
                    events: events.slice(0, 8),
                }
            }
        }

        return NextResponse.json({
            available: true,
            city,
            startDate,
            endDate,
            totalEvents: uniqueEvents.length,
            categories: EVENT_CATEGORIES,
            grouped,
            events: uniqueEvents.slice(0, 30),
        })
    } catch (err) {
        console.error('Events API error:', err)
        return NextResponse.json({ available: false, events: [], message: err.message }, { status: 500 })
    }
}
