// Utility functions
export function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
}

export function formatDate(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateShort(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function timeAgo(dateStr) {
    const now = new Date()
    const past = new Date(dateStr)
    const seconds = Math.floor((now - past) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return formatDate(dateStr)
}

export function getFileType(file) {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.startsWith('video/')) return 'video'
    return 'other'
}

export function generateInviteToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
}

export function getCitySlug(city, country) {
    return slugify(`${city}-${country}`)
}

export function groupPinsByCity(pins) {
    const groups = {}
    pins.forEach(pin => {
        const key = `${pin.city}, ${pin.country}`
        if (!groups[key]) {
            groups[key] = {
                city: pin.city,
                country: pin.country,
                slug: getCitySlug(pin.city, pin.country),
                pins: [],
                lat: pin.lat,
                lng: pin.lng,
            }
        }
        groups[key].pins.push(pin)
    })
    return Object.values(groups)
}
