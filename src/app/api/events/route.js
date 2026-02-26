// Events API — etkinlik.io integration
// Türkiye'deki tüm etkinlikler: konser, tiyatro, stand-up, sergi, festival
// API: https://etkinlik.io — Free with attribution
import { NextResponse } from 'next/server'

const BASE_URL = 'https://etkinlik.io/api/v2'

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
    'Konser': '🎵', 'Müzik': '🎵',
    'Tiyatro': '🎭', 'Sahne Sanatları': '🎭',
    'Stand Up': '😂', 'Gösteri': '😂',
    'Sergi': '🖼️', 'Sanat': '🖼️',
    'Festival': '🎪',
    'Spor': '⚽',
    'Söyleşi': '💬',
    'Sinema': '🎬',
    'Çocuk': '👶',
    'Eğitim': '📚', 'Workshop': '🎨', 'Atölye': '🎨',
    'Gece Hayatı': '🌙', 'Party': '🎉',
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
    // Direct lookup
    if (CITY_SLUGS[city]) return CITY_SLUGS[city]
    // Case-insensitive
    const lower = city.toLowerCase().trim()
    for (const [key, val] of Object.entries(CITY_SLUGS)) {
        if (key.toLowerCase() === lower) return val
    }
    // Fallback: slugify
    return lower.replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
        .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
        .replace(/\s+/g, '-')
}

function stripHtml(html) {
    if (!html) return ''
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim()
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const city = searchParams.get('city')
        const format = searchParams.get('format') || ''
        const page = searchParams.get('page') || '1'

        if (!city) {
            return NextResponse.json({ error: 'City is required' }, { status: 400 })
        }

        const token = process.env.ETKINLIK_TOKEN
        if (!token) {
            return NextResponse.json({
                events: [], total: 0,
                setup_required: true,
                message: 'ETKINLIK_TOKEN not configured. Add it to .env.local',
            })
        }

        const citySlug = getCitySlug(city)

        // Build URL with query params
        const params = new URLSearchParams()
        if (citySlug) params.append('city', citySlug)
        if (format) params.append('format', format)
        params.append('page', page)

        const res = await fetch(`${BASE_URL}/events?${params}`, {
            headers: {
                'X-Etkinlik-Token': token,
                'Accept': 'application/json',
            },
            next: { revalidate: 300 }, // Cache 5 min
        })

        if (!res.ok) {
            const errText = await res.text()
            console.error('Etkinlik.io API error:', res.status, errText)
            return NextResponse.json({ events: [], total: 0, error: 'Event API error' })
        }

        const raw = await res.json()
        const items = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.events || [])

        const events = items.map(event => ({
            id: event.id,
            name: event.name || '',
            slug: event.slug || '',
            description: stripHtml(event.content || ''),
            url: event.url || `https://etkinlik.io/etkinlik/${event.id}/${event.slug}`,
            poster_url: event.poster_url || '',
            ticket_url: event.ticket_url || '',
            start: event.start || '',
            end: event.end || '',
            is_free: event.is_free || false,
            // Format & Category
            format: event.format?.name || '',
            format_slug: event.format?.slug || '',
            category: event.category?.name || '',
            category_slug: event.category?.slug || '',
            emoji: getEmoji(event.format?.name || event.category?.name),
            // Venue
            venue_name: event.venue?.name || event.venue_data?.name || '',
            venue_address: event.venue?.address || event.venue_data?.address || '',
            venue_lat: parseFloat(event.venue?.lat || event.venue_data?.lat || 0),
            venue_lng: parseFloat(event.venue?.lng || event.venue_data?.lng || 0),
            city_name: event.venue?.city?.name || event.venue_data?.city?.name || city,
            district: event.venue?.district?.name || event.venue_data?.district?.name || '',
            // Contact
            phone: event.phone || event.venue?.phone || '',
            web_url: event.web_url || event.venue?.web_url || '',
            // Tags
            tags: (event.tags || []).map(t => t.name || t),
            // Source attribution
            source: 'etkinlik.io',
        }))

        // Group by format
        const grouped = {}
        for (const event of events) {
            const key = event.format || 'Diğer'
            if (!grouped[key]) {
                grouped[key] = {
                    name: key,
                    emoji: event.emoji,
                    events: [],
                }
            }
            grouped[key].events.push(event)
        }

        return NextResponse.json({
            events,
            grouped,
            city,
            total: events.length,
            source: 'etkinlik.io',
            attribution: 'Etkinlik verileri etkinlik.io tarafından sağlanmaktadır.',
        })
    } catch (err) {
        console.error('Events API error:', err)
        return NextResponse.json({ events: [], error: err.message }, { status: 500 })
    }
}
