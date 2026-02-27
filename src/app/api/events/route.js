// Events API — etkinlik.io (Turkey) + Ticketmaster (International)
// Priority: Etkinlik.io for Turkish cities, Ticketmaster for international
import { NextResponse } from 'next/server'

const ETKINLIK_BASE = 'https://etkinlik.io/api/v2'
const TM_BASE = 'https://app.ticketmaster.com/discovery/v2'

// Turkish cities → always use etkinlik.io first
const TURKISH_CITIES = new Set([
    'istanbul', 'ankara', 'izmir', 'antalya', 'bursa', 'adana', 'eskişehir',
    'trabzon', 'mersin', 'gaziantep', 'kayseri', 'konya', 'samsun',
    'diyarbakır', 'muğla', 'bodrum', 'fethiye', 'marmaris', 'çeşme',
    'kuşadası', 'denizli', 'pamukkale', 'kapadokya', 'nevşehir', 'hatay',
])

// City slug mapping for etkinlik.io
const CITY_SLUGS = {
    'istanbul': 'istanbul', 'İstanbul': 'istanbul',
    'ankara': 'ankara', 'Ankara': 'ankara',
    'izmir': 'izmir', 'İzmir': 'izmir',
    'antalya': 'antalya', 'Antalya': 'antalya',
    'bursa': 'bursa', 'Bursa': 'bursa',
    'adana': 'adana', 'Adana': 'adana',
    'eskişehir': 'eskisehir', 'Eskişehir': 'eskisehir',
    'trabzon': 'trabzon', 'Trabzon': 'trabzon',
    'mersin': 'mersin', 'Mersin': 'mersin',
    'gaziantep': 'gaziantep', 'Gaziantep': 'gaziantep',
    'kayseri': 'kayseri', 'Kayseri': 'kayseri',
    'konya': 'konya', 'Konya': 'konya',
    'samsun': 'samsun', 'Samsun': 'samsun',
    'diyarbakır': 'diyarbakir', 'Diyarbakır': 'diyarbakir',
    'muğla': 'mugla', 'Muğla': 'mugla',
    'bodrum': 'mugla',
}

// Format emoji mapping
const FORMAT_EMOJIS = {
    'Konser': '🎵', 'Müzik': '🎵', 'Music': '🎵', 'Concert': '🎵',
    'Tiyatro': '🎭', 'Sahne Sanatları': '🎭', 'Theatre': '🎭', 'Arts': '🎭',
    'Stand Up': '😂', 'Gösteri': '😂', 'Comedy': '😂',
    'Sergi': '🖼️', 'Sanat': '🖼️', 'Exhibition': '🖼️',
    'Festival': '🎪',
    'Spor': '⚽', 'Sports': '⚽',
    'Söyleşi': '💬', 'Talk': '💬',
    'Sinema': '🎬', 'Film': '🎬',
    'Çocuk': '👶', 'Family': '👶',
    'Eğitim': '📚', 'Workshop': '🎨', 'Atölye': '🎨',
    'Gece Hayatı': '🌙', 'Party': '🎉', 'Nightlife': '🌙',
    'Miscellaneous': '🎫', 'Undefined': '🎫',
}

function getEmoji(formatName) {
    if (!formatName) return '🎫'
    for (const [key, emoji] of Object.entries(FORMAT_EMOJIS)) {
        if (formatName.toLowerCase().includes(key.toLowerCase())) return emoji
    }
    return '🎫'
}

function getCitySlug(city) {
    if (!city) return null
    if (CITY_SLUGS[city]) return CITY_SLUGS[city]
    const lower = city.toLowerCase().trim()
    for (const [key, val] of Object.entries(CITY_SLUGS)) {
        if (key.toLowerCase() === lower) return val
    }
    return lower.replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
        .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
        .replace(/\s+/g, '-')
}

function isTurkishCity(city) {
    if (!city) return false
    const lower = city.toLowerCase().trim()
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
        .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
    return TURKISH_CITIES.has(lower) || !!CITY_SLUGS[city]
}

function stripHtml(html) {
    if (!html) return ''
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim()
}

// ─── Etkinlik.io fetch (Turkey only) ───
async function fetchEtkinlikEvents(city, format, page) {
    const token = process.env.ETKINLIK_TOKEN
    if (!token) return { events: [], source: 'etkinlik.io', error: 'no_token' }

    const citySlug = getCitySlug(city)
    const params = new URLSearchParams()
    if (citySlug) params.append('city', citySlug)
    if (format) params.append('format', format)
    params.append('page', page || '1')

    try {
        const res = await fetch(`${ETKINLIK_BASE}/events?${params}`, {
            headers: { 'X-Etkinlik-Token': token, 'Accept': 'application/json' },
            next: { revalidate: 300 },
        })
        if (!res.ok) return { events: [], source: 'etkinlik.io', error: 'api_error' }

        const raw = await res.json()
        const items = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.events || [])

        return {
            events: items.map(event => ({
                id: `etk-${event.id}`,
                name: event.name || '',
                description: stripHtml(event.content || ''),
                url: event.url || `https://etkinlik.io/etkinlik/${event.id}/${event.slug}`,
                poster_url: event.poster_url || '',
                ticket_url: event.ticket_url || '',
                start: event.start || '',
                end: event.end || '',
                is_free: event.is_free || false,
                format: event.format?.name || '',
                category: event.category?.name || '',
                emoji: getEmoji(event.format?.name || event.category?.name),
                venue_name: event.venue?.name || event.venue_data?.name || '',
                venue_address: event.venue?.address || event.venue_data?.address || '',
                venue_lat: parseFloat(event.venue?.lat || event.venue_data?.lat || 0),
                venue_lng: parseFloat(event.venue?.lng || event.venue_data?.lng || 0),
                city_name: event.venue?.city?.name || city,
                district: event.venue?.district?.name || '',
                tags: (event.tags || []).map(t => t.name || t),
                source: 'etkinlik.io',
            })),
            source: 'etkinlik.io',
        }
    } catch (err) {
        return { events: [], source: 'etkinlik.io', error: err.message }
    }
}

// ─── Ticketmaster fetch (International) ───
async function fetchTicketmasterEvents(city, startDate, endDate) {
    const apiKey = process.env.TICKETMASTER_API_KEY
    if (!apiKey) return { events: [], source: 'ticketmaster', error: 'no_key' }

    try {
        const params = new URLSearchParams({
            apikey: apiKey,
            keyword: city,
            size: '20',
            sort: 'date,asc',
        })
        if (startDate) {
            params.append('startDateTime', `${startDate}T00:00:00Z`)
        }
        if (endDate) {
            params.append('endDateTime', `${endDate}T23:59:59Z`)
        }

        const res = await fetch(`${TM_BASE}/events.json?${params}`, {
            next: { revalidate: 300 },
        })
        if (!res.ok) return { events: [], source: 'ticketmaster', error: 'api_error' }

        const data = await res.json()
        const items = data._embedded?.events || []

        return {
            events: items.map(event => {
                const venue = event._embedded?.venues?.[0] || {}
                return {
                    id: `tm-${event.id}`,
                    name: event.name || '',
                    description: (event.info || event.pleaseNote || '').substring(0, 200),
                    url: event.url || '',
                    poster_url: event.images?.find(i => i.ratio === '16_9')?.url || event.images?.[0]?.url || '',
                    ticket_url: event.url || '',
                    start: event.dates?.start?.dateTime || event.dates?.start?.localDate || '',
                    end: event.dates?.end?.dateTime || '',
                    is_free: false,
                    format: event.classifications?.[0]?.segment?.name || 'Event',
                    category: event.classifications?.[0]?.genre?.name || '',
                    emoji: getEmoji(event.classifications?.[0]?.segment?.name),
                    venue_name: venue.name || '',
                    venue_address: venue.address?.line1 || '',
                    venue_lat: parseFloat(venue.location?.latitude || 0),
                    venue_lng: parseFloat(venue.location?.longitude || 0),
                    city_name: venue.city?.name || city,
                    district: venue.state?.name || '',
                    tags: [event.classifications?.[0]?.genre?.name, event.classifications?.[0]?.subGenre?.name].filter(Boolean),
                    source: 'ticketmaster',
                    priceRange: event.priceRanges?.[0] ? `${event.priceRanges[0].min}-${event.priceRanges[0].max} ${event.priceRanges[0].currency}` : null,
                }
            }),
            source: 'ticketmaster',
        }
    } catch (err) {
        return { events: [], source: 'ticketmaster', error: err.message }
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const city = searchParams.get('city')
        const format = searchParams.get('format') || ''
        const page = searchParams.get('page') || '1'
        const startDate = searchParams.get('start') || ''
        const endDate = searchParams.get('end') || ''

        if (!city) {
            return NextResponse.json({ error: 'City is required' }, { status: 400 })
        }

        const turkish = isTurkishCity(city)
        let allEvents = []
        let sources = []

        // PRIORITY: Etkinlik.io for Turkish cities
        if (turkish) {
            const etkinlik = await fetchEtkinlikEvents(city, format, page)
            allEvents = [...etkinlik.events]
            if (etkinlik.events.length > 0) sources.push('etkinlik.io')

            // Also try Ticketmaster as supplement (if available)
            const tm = await fetchTicketmasterEvents(city, startDate, endDate)
            if (tm.events.length > 0) {
                // Don't duplicate — only add TM events not already from etkinlik
                const existingNames = new Set(allEvents.map(e => e.name.toLowerCase()))
                const newTm = tm.events.filter(e => !existingNames.has(e.name.toLowerCase()))
                allEvents = [...allEvents, ...newTm]
                if (newTm.length > 0) sources.push('ticketmaster')
            }
        } else {
            // International city — Ticketmaster only
            const tm = await fetchTicketmasterEvents(city, startDate, endDate)
            allEvents = [...tm.events]
            if (tm.events.length > 0) sources.push('ticketmaster')
        }

        // Group by format
        const grouped = {}
        for (const event of allEvents) {
            const key = event.format || 'Diğer'
            if (!grouped[key]) {
                grouped[key] = { name: key, emoji: event.emoji, events: [] }
            }
            grouped[key].events.push(event)
        }

        return NextResponse.json({
            events: allEvents,
            grouped,
            city,
            total: allEvents.length,
            sources,
            isTurkish: turkish,
            attribution: turkish
                ? 'Etkinlik verileri etkinlik.io ve Ticketmaster tarafından sağlanmaktadır.'
                : 'Event data provided by Ticketmaster.',
        })
    } catch (err) {
        console.error('Events API error:', err)
        return NextResponse.json({ events: [], error: err.message }, { status: 500 })
    }
}
