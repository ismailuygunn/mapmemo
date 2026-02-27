// Events API — etkinlik.io (Turkey) + Ticketmaster (International)
// etkinlik.io ignores city/format params — we filter server-side
import { NextResponse } from 'next/server'

const ETKINLIK_BASE = 'https://etkinlik.io/api/v2'
const TM_BASE = 'https://app.ticketmaster.com/discovery/v2'

const TURKISH_CITIES = new Set([
    'istanbul', 'ankara', 'izmir', 'antalya', 'bursa', 'adana', 'eskisehir',
    'trabzon', 'mersin', 'gaziantep', 'kayseri', 'konya', 'samsun',
    'diyarbakir', 'mugla', 'bodrum', 'fethiye', 'marmaris', 'cesme',
    'kusadasi', 'denizli', 'pamukkale', 'kapadokya', 'nevsehir', 'hatay',
])

// Normalize Turkish chars for comparison
// CRITICAL: Replace İ BEFORE toLowerCase() because JS toLowerCase
// turns İ into i̇ (i + combining dot above U+0307), not plain i
function normalize(str) {
    if (!str) return ''
    return str
        .replace(/İ/g, 'I')  // Must be BEFORE toLowerCase
        .toLowerCase().trim()
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
        .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
        .replace(/\u0307/g, '') // Remove any remaining combining dot above
}

function isTurkishCity(city) {
    return TURKISH_CITIES.has(normalize(city))
}

// Format category mapping — etkinlik.io format names → our filter keys
const FORMAT_MAP = {
    'konser': ['konser', 'concert', 'müzik', 'music', 'canlı müzik'],
    'sahne-sanatlari': ['tiyatro', 'sahne sanatları', 'theatre', 'opera', 'bale', 'dans', 'müzikal'],
    'stand-up': ['stand up', 'stand-up', 'komedi', 'comedy', 'gösteri'],
    'sergi': ['sergi', 'exhibition', 'sanat', 'galeri'],
    'festival': ['festival', 'fest'],
    'spor': ['spor', 'sport', 'maç', 'turnuva'],
    'cocuk': ['çocuk', 'cocuk', 'child', 'family', 'aile'],
    'soylesi': ['söyleşi', 'soylesi', 'panel', 'konferans', 'talk', 'seminer'],
}

function matchesFormat(event, filterKey) {
    if (!filterKey) return true
    const keywords = FORMAT_MAP[filterKey] || [filterKey]
    const haystack = normalize(
        `${event.format} ${event.category} ${event.name} ${(event.tags || []).join(' ')}`
    )
    return keywords.some(k => haystack.includes(normalize(k)))
}

function getEmoji(formatName) {
    if (!formatName) return '🎫'
    const FORMAT_EMOJIS = {
        'Konser': '🎵', 'Müzik': '🎵', 'Music': '🎵', 'Concert': '🎵',
        'Tiyatro': '🎭', 'Sahne Sanatları': '🎭', 'Theatre': '🎭',
        'Stand Up': '😂', 'Gösteri': '😂', 'Comedy': '😂',
        'Sergi': '🖼️', 'Sanat': '🖼️', 'Exhibition': '🖼️',
        'Festival': '🎪', 'Spor': '⚽', 'Sports': '⚽',
        'Söyleşi': '💬', 'Talk': '💬', 'Eğitim': '📚',
        'Workshop': '🎨', 'Atölye': '🎨', 'Sinema': '🎬',
        'Çocuk': '👶', 'Family': '👶', 'Gece Hayatı': '🌙',
    }
    for (const [key, emoji] of Object.entries(FORMAT_EMOJIS)) {
        if (formatName.toLowerCase().includes(key.toLowerCase())) return emoji
    }
    return '🎫'
}

function stripHtml(html) {
    if (!html) return ''
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim()
}

// ─── Etkinlik.io fetch — tries multiple approaches for future events ───
async function fetchEtkinlikEvents(city, format) {
    const token = process.env.ETKINLIK_TOKEN
    if (!token) return { events: [], error: 'no_token' }

    const today = new Date().toISOString().split('T')[0]

    try {
        // Try multiple endpoint patterns for future events
        const endpoints = [
            `${ETKINLIK_BASE}/events?start_from=${today}`,
            `${ETKINLIK_BASE}/events?start=${today}`,
            `${ETKINLIK_BASE}/events?date_from=${today}`,
            `${ETKINLIK_BASE}/events`,
        ]

        let allItems = []
        for (const url of endpoints) {
            try {
                const res = await fetch(url, {
                    headers: { 'X-Etkinlik-Token': token, 'Accept': 'application/json' },
                    next: { revalidate: 300 },
                })
                if (!res.ok) continue
                const raw = await res.json()
                const items = raw.items || raw.data || (Array.isArray(raw) ? raw : [])
                if (items.length > 0) {
                    allItems = items
                    break
                }
            } catch { continue }
        }

        if (allItems.length === 0) return { events: [], error: 'no_events' }
        let events = allItems.map(event => ({
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
            city_name: event.venue?.city?.name || '',
            district: event.venue?.district?.name || '',
            tags: (event.tags || []).map(t => t.name || t),
            source: 'etkinlik.io',
        }))

        // CRITICAL: Filter by city (since etkinlik.io ignores city param)
        const normalizedCity = normalize(city)
        events = events.filter(e => {
            const eventCity = normalize(e.city_name)
            return eventCity === normalizedCity ||
                eventCity.includes(normalizedCity) ||
                normalizedCity.includes(eventCity)
        })

        // IMPORTANT: Only keep future events (safety net regardless of API params)
        const now = new Date()
        events = events.filter(e => {
            if (!e.start) return true // Keep events without dates
            const eventDate = new Date(e.start)
            return eventDate >= now || isNaN(eventDate.getTime())
        })

        // Filter by format/category
        if (format) {
            events = events.filter(e => matchesFormat(e, format))
        }

        // Deduplicate by name + date
        const seen = new Set()
        events = events.filter(e => {
            const key = `${normalize(e.name)}-${(e.start || '').slice(0, 10)}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
        })

        return { events, source: 'etkinlik.io' }
    } catch (err) {
        return { events: [], error: err.message }
    }
}

// ─── Ticketmaster fetch (International + Turkish cities) ───
async function fetchTicketmasterEvents(city, format, startDate, endDate, isTurkish = false) {
    const apiKey = process.env.TICKETMASTER_API_KEY
    if (!apiKey) return { events: [], error: 'no_key' }

    try {
        // Always search from today if no startDate
        const today = new Date().toISOString().split('T')[0]
        const effectiveStart = startDate || today

        const params = new URLSearchParams({
            apikey: apiKey,
            keyword: city,
            size: '50',
            sort: 'date,asc',
            startDateTime: `${effectiveStart}T00:00:00Z`,
        })
        if (endDate) params.append('endDateTime', `${endDate}T23:59:59Z`)
        if (isTurkish) params.append('countryCode', 'TR')

        // Ticketmaster supports classificationName for format
        if (format) {
            const tmFormat = {
                'konser': 'Music', 'sahne-sanatlari': 'Arts & Theatre',
                'stand-up': 'Comedy', 'spor': 'Sports', 'festival': 'Festival',
            }[format]
            if (tmFormat) params.append('classificationName', tmFormat)
        }

        const res = await fetch(`${TM_BASE}/events.json?${params}`, {
            next: { revalidate: 300 },
        })
        if (!res.ok) return { events: [], error: 'api_error' }

        const data = await res.json()
        const items = data._embedded?.events || []

        return {
            events: items.map(event => {
                const venue = event._embedded?.venues?.[0] || {}
                // Get best quality image (prefer 16:9 ratio, largest width)
                const images = event.images || []
                const sorted = [...images].sort((a, b) => (b.width || 0) - (a.width || 0))
                const best16_9 = sorted.find(i => i.ratio === '16_9')
                const bestImage = best16_9?.url || sorted[0]?.url || ''
                // All photos (for gallery)
                const allPhotos = sorted.filter(i => i.width > 200).map(i => i.url).slice(0, 6)

                // Price info
                const priceRanges = event.priceRanges || []
                const minPrice = priceRanges[0]?.min || 0
                const maxPrice = priceRanges[0]?.max || 0
                const priceCurrency = priceRanges[0]?.currency || 'TRY'
                const priceLabel = minPrice > 0
                    ? (minPrice === maxPrice ? `${priceCurrency} ${minPrice}` : `${priceCurrency} ${minPrice} - ${maxPrice}`)
                    : ''

                return {
                    id: `tm-${event.id}`,
                    name: event.name || '',
                    description: (event.info || event.pleaseNote || '').substring(0, 200),
                    url: event.url || '',
                    poster_url: bestImage,
                    photos: allPhotos,
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
                    tags: (event.classifications || []).map(c => c.genre?.name).filter(Boolean),
                    source: 'ticketmaster',
                    // Price fields
                    price_min: minPrice,
                    price_max: maxPrice,
                    price_currency: priceCurrency,
                    price_label: priceLabel,
                }
            }),
            source: 'ticketmaster',
        }
    } catch (err) {
        return { events: [], error: err.message }
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const city = searchParams.get('city')
        const format = searchParams.get('format') || ''
        const startDate = searchParams.get('start') || ''
        const endDate = searchParams.get('end') || ''

        if (!city) {
            return NextResponse.json({ error: 'City is required' }, { status: 400 })
        }

        const turkish = isTurkishCity(city)
        let allEvents = []
        let sources = []
        let errors = []

        if (turkish) {
            // PRIORITY: Etkinlik.io for Turkish cities
            const etkinlik = await fetchEtkinlikEvents(city, format)
            allEvents = [...etkinlik.events]
            if (etkinlik.events.length > 0) sources.push('etkinlik.io')
            if (etkinlik.error) errors.push({ source: 'etkinlik.io', error: etkinlik.error })

            // Supplement with Ticketmaster (also for Turkish cities)
            const tm = await fetchTicketmasterEvents(city, format, startDate, endDate, true)
            if (tm.events.length > 0) {
                const existingNames = new Set(allEvents.map(e => normalize(e.name)))
                const newTm = tm.events.filter(e => !existingNames.has(normalize(e.name)))
                allEvents = [...allEvents, ...newTm]
                if (newTm.length > 0) sources.push('ticketmaster')
            }
            if (tm.error) errors.push({ source: 'ticketmaster', error: tm.error })
        } else {
            // International — Ticketmaster only
            const tm = await fetchTicketmasterEvents(city, format, startDate, endDate)
            allEvents = [...tm.events]
            if (tm.events.length > 0) sources.push('ticketmaster')
            if (tm.error) errors.push({ source: 'ticketmaster', error: tm.error })
        }

        // Sort by date
        allEvents.sort((a, b) => {
            const da = a.start ? new Date(a.start).getTime() : 0
            const db = b.start ? new Date(b.start).getTime() : 0
            return da - db
        })

        return NextResponse.json({
            events: allEvents,
            city,
            total: allEvents.length,
            sources,
            errors: errors.length > 0 ? errors : undefined,
            isTurkish: turkish,
            attribution: sources.length > 0
                ? `Veriler: ${sources.join(' + ')}`
                : 'Etkinlik verisi bulunamadı',
        })
    } catch (err) {
        console.error('Events API error:', err)
        return NextResponse.json({ events: [], error: err.message }, { status: 500 })
    }
}
