// Events API Proxy — PredictHQ / Ticketmaster fallback
// Provides events and activities happening at destination during trip dates
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const city = searchParams.get('city')
        const startDate = searchParams.get('start')
        const endDate = searchParams.get('end')
        const category = searchParams.get('category') // concerts, festivals, sports, etc.

        if (!city) {
            return NextResponse.json({ error: 'City is required' }, { status: 400 })
        }

        const predictHqKey = process.env.PREDICTHQ_API_KEY
        const ticketmasterKey = process.env.TICKETMASTER_API_KEY

        // Try PredictHQ first
        if (predictHqKey) {
            return await fetchPredictHQ(city, startDate, endDate, category, predictHqKey)
        }

        // Fallback to Ticketmaster
        if (ticketmasterKey) {
            return await fetchTicketmaster(city, startDate, endDate, category, ticketmasterKey)
        }

        // No API key — return empty with status
        return NextResponse.json({
            available: false,
            message: 'Events API not configured',
            events: [],
        })
    } catch (err) {
        console.error('Events API error:', err)
        return NextResponse.json({ available: false, events: [], message: 'Server error' }, { status: 500 })
    }
}

async function fetchPredictHQ(city, startDate, endDate, category, apiKey) {
    const params = new URLSearchParams({
        q: city,
        limit: 20,
        sort: 'rank',
        'rank.gte': 50,
    })

    if (startDate) params.append('start.gte', startDate)
    if (endDate) params.append('start.lte', endDate)
    if (category) params.append('category', category)

    const res = await fetch(`https://api.predicthq.com/v1/events/?${params}`, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
        },
    })

    if (!res.ok) {
        console.error('PredictHQ error:', await res.text())
        return NextResponse.json({ available: false, events: [], message: 'Events lookup failed' })
    }

    const data = await res.json()
    const events = data.results.map(e => ({
        id: e.id,
        title: e.title,
        category: e.category,
        date: e.start?.split('T')[0],
        time: e.start?.split('T')[1]?.substring(0, 5),
        venue: e.entities?.[0]?.name || '',
        description: e.description || '',
        rank: e.rank,
        source: 'predicthq',
    }))

    return NextResponse.json({ available: true, events, source: 'predicthq' })
}

async function fetchTicketmaster(city, startDate, endDate, category, apiKey) {
    const params = new URLSearchParams({
        apikey: apiKey,
        city: city,
        size: 20,
        sort: 'relevance,desc',
    })

    if (startDate) params.append('startDateTime', `${startDate}T00:00:00Z`)
    if (endDate) params.append('endDateTime', `${endDate}T23:59:59Z`)
    if (category) params.append('classificationName', category)

    const res = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`)

    if (!res.ok) {
        console.error('Ticketmaster error:', await res.text())
        return NextResponse.json({ available: false, events: [], message: 'Events lookup failed' })
    }

    const data = await res.json()
    const events = (data._embedded?.events || []).map(e => ({
        id: e.id,
        title: e.name,
        category: e.classifications?.[0]?.genre?.name || 'Event',
        date: e.dates?.start?.localDate,
        time: e.dates?.start?.localTime?.substring(0, 5),
        venue: e._embedded?.venues?.[0]?.name || '',
        description: e.info || '',
        image: e.images?.[0]?.url || '',
        url: e.url || '',
        source: 'ticketmaster',
    }))

    return NextResponse.json({ available: true, events, source: 'ticketmaster' })
}
