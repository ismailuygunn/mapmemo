'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import { Search, Star, Users, Bed, MapPin, Loader2, ExternalLink, Heart, Map, List, SlidersHorizontal } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const POPULAR_CITIES = [
    { name: 'İstanbul', emoji: '🇹🇷' }, { name: 'Antalya', emoji: '🏖️' },
    { name: 'Bodrum', emoji: '⛵' }, { name: 'Fethiye', emoji: '🏔️' },
    { name: 'Kapadokya', emoji: '🎈' }, { name: 'Paris', emoji: '🇫🇷' },
    { name: 'Roma', emoji: '🇮🇹' }, { name: 'Barselona', emoji: '🇪🇸' },
    { name: 'Amsterdam', emoji: '🇳🇱' }, { name: 'Dubai', emoji: '🇦🇪' },
    { name: 'Londra', emoji: '🇬🇧' }, { name: 'Prag', emoji: '🇨🇿' },
    { name: 'Budapeşte', emoji: '🇭🇺' }, { name: 'Tiflis', emoji: '🇬🇪' },
    { name: 'Bali', emoji: '🌴' },
]

const SORT_OPTIONS = [
    { key: 'price_asc', label: 'En Ucuz' },
    { key: 'price_desc', label: 'En Pahalı' },
    { key: 'rating', label: 'En Yüksek Puan' },
    { key: 'reviews', label: 'En Çok Yorum' },
]

function getTodayStr(offset = 7) {
    const d = new Date(); d.setDate(d.getDate() + offset)
    return d.toISOString().split('T')[0]
}

export default function AirbnbPage() {
    const { user } = useAuth()
    const { t } = useLanguage()
    const [location, setLocation] = useState('')
    const [checkin, setCheckin] = useState(getTodayStr(7))
    const [checkout, setCheckout] = useState(getTodayStr(11))
    const [guests, setGuests] = useState(2)
    const [listings, setListings] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchDone, setSearchDone] = useState(false)
    const [error, setError] = useState('')
    const [favorites, setFavorites] = useState([])
    const [photoIdx, setPhotoIdx] = useState({})
    const [showMap, setShowMap] = useState(false)
    const [sortBy, setSortBy] = useState('price_asc')
    const [hoveredId, setHoveredId] = useState(null)
    const [mapCenter, setMapCenter] = useState(null)
    const [searchRadius, setSearchRadius] = useState(10)  // km

    const mapContainer = useRef(null)
    const mapRef = useRef(null)
    const markersRef = useRef([])

    const searchListings = async (city, geo) => {
        const q = city || location
        if (!q && !geo) return
        setLoading(true); setSearchDone(false); setError('')
        try {
            const params = new URLSearchParams({
                location: q || '', adults: String(guests), currency: 'TRY',
            })
            if (checkin) params.set('checkin', checkin)
            if (checkout) params.set('checkout', checkout)
            // Geo-based search
            if (geo) {
                params.set('lat', String(geo.lat))
                params.set('lng', String(geo.lng))
                params.set('radius', String(searchRadius))
            }
            const res = await fetch(`/api/airbnb?${params}`)
            const data = await res.json()
            if (data.error) setError(data.error)
            setListings(data.listings || [])
            // Center map on first result if available
            const first = (data.listings || [])[0]
            if (first?.lat && first?.lng) setMapCenter({ lat: first.lat, lng: first.lng })
        } catch (e) { setError(e.message); setListings([]) }
        setLoading(false); setSearchDone(true)
    }

    const toggleFav = (id) => setFavorites(prev =>
        prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )

    const nextPhoto = (id, max) => setPhotoIdx(prev => ({
        ...prev, [id]: ((prev[id] || 0) + 1) % max,
    }))

    // Sort listings
    const sortedListings = [...listings].sort((a, b) => {
        switch (sortBy) {
            case 'price_asc': return a.price - b.price
            case 'price_desc': return b.price - a.price
            case 'rating': return b.rating - a.rating
            case 'reviews': return b.reviewCount - a.reviewCount
            default: return 0
        }
    })

    // Initialize map
    useEffect(() => {
        if (!showMap || !mapContainer.current || mapRef.current) return
        const mapboxgl = require('mapbox-gl')
        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

        const map = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: mapCenter ? [mapCenter.lng, mapCenter.lat] : [28.97, 41.01],
            zoom: 12,
        })
        map.addControl(new mapboxgl.NavigationControl(), 'top-right')

        // Add click handler for geo search
        map.on('click', (e) => {
            const { lat, lng } = e.lngLat
            setMapCenter({ lat, lng })
            searchListings(null, { lat, lng })
        })

        mapRef.current = map
        return () => { map.remove(); mapRef.current = null }
    }, [showMap]) // eslint-disable-line react-hooks/exhaustive-deps

    // Update markers when listings or map change
    useEffect(() => {
        if (!mapRef.current || !showMap) return
        const mapboxgl = require('mapbox-gl')

        // Clear existing markers
        markersRef.current.forEach(m => m.remove())
        markersRef.current = []

        const geoListings = sortedListings.filter(l => l.lat && l.lng)
        if (geoListings.length === 0) return

        // Fit bounds to all markers
        if (geoListings.length > 1) {
            const bounds = new mapboxgl.LngLatBounds()
            geoListings.forEach(l => bounds.extend([l.lng, l.lat]))
            mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 14 })
        } else if (geoListings.length === 1) {
            mapRef.current.flyTo({ center: [geoListings[0].lng, geoListings[0].lat], zoom: 13 })
        }

        // Add price markers
        geoListings.forEach(listing => {
            const el = document.createElement('div')
            el.className = 'airbnb-marker'
            el.innerHTML = `₺${new Intl.NumberFormat('tr-TR').format(listing.price)}`
            el.style.cssText = `
                background: ${hoveredId === listing.id ? '#E11D48' : 'white'};
                color: ${hoveredId === listing.id ? 'white' : '#222'};
                padding: 4px 8px; border-radius: 20px; font-size: 11px;
                font-weight: 700; cursor: pointer; white-space: nowrap;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                transition: all 150ms;
            `
            el.addEventListener('mouseenter', () => setHoveredId(listing.id))
            el.addEventListener('mouseleave', () => setHoveredId(null))

            const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
                .setHTML(`<div style="font-family:sans-serif;max-width:200px">
                    <strong style="font-size:12px">${listing.name?.slice(0, 40)}</strong>
                    <div style="font-size:11px;color:#666;margin:2px 0">${listing.type} · ⭐ ${listing.rating.toFixed(1)}</div>
                    <div style="font-size:13px;font-weight:700;color:#E11D48">₺${new Intl.NumberFormat('tr-TR').format(listing.price)}/gece</div>
                </div>`)

            const marker = new mapboxgl.Marker({ element: el })
                .setLngLat([listing.lng, listing.lat])
                .setPopup(popup)
                .addTo(mapRef.current)

            markersRef.current.push(marker)
        })
    }, [sortedListings, showMap, hoveredId]) // eslint-disable-line react-hooks/exhaustive-deps

    const sectionStyle = {
        background: 'var(--bg-secondary)', borderRadius: 20,
        border: '1px solid var(--border)', padding: '24px 28px', marginBottom: 20,
    }
    const inputStyle = {
        width: '100%', padding: '12px 16px', borderRadius: 12,
        border: '1px solid var(--border)', background: 'var(--bg-primary)',
        color: 'var(--text-primary)', fontSize: '0.88rem', fontWeight: 600,
    }

    const nightCount = checkin && checkout
        ? Math.max(1, Math.ceil((new Date(checkout) - new Date(checkin)) / 86400000))
        : 0

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-main" style={{ overflowY: 'auto' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 60px' }}>

                    {/* HERO */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                            borderRadius: 24, overflow: 'hidden', marginBottom: 24,
                            position: 'relative', minHeight: 180,
                            background: 'linear-gradient(135deg, #831843, #be185d, #f43f5e)',
                        }}>
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(135deg, rgba(0,0,0,0.3), transparent)',
                            display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px',
                        }}>
                            <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 900, margin: 0 }}>🏠 Konaklama</h1>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.92rem', margin: '6px 0 0' }}>
                                Airbnb üzerinden gerçek ilanları keşfedin · Haritada arayın
                            </p>
                        </div>
                    </motion.div>

                    {/* SEARCH */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        style={sectionStyle}>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                            <div style={{ flex: '2 1 200px' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>📍 Nerede</label>
                                <input type="text" placeholder="Şehir veya bölge yazın..." value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && searchListings()}
                                    style={inputStyle} />
                            </div>
                            <div style={{ flex: '1 1 140px' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>📅 Giriş</label>
                                <input type="date" value={checkin} onChange={e => setCheckin(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]} style={inputStyle} />
                            </div>
                            <div style={{ flex: '1 1 140px' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>📅 Çıkış</label>
                                <input type="date" value={checkout} onChange={e => setCheckout(e.target.value)}
                                    min={checkin} style={inputStyle} />
                            </div>
                            <div style={{ flex: '0 0 80px' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>👤 Kişi</label>
                                <select value={guests} onChange={e => setGuests(parseInt(e.target.value))} style={inputStyle}>
                                    {[1, 2, 3, 4, 5, 6, 8, 10].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => searchListings()} disabled={loading || !location}
                            style={{
                                width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                                background: location ? 'linear-gradient(135deg, #E11D48, #F43F5E)' : 'var(--bg-tertiary)',
                                color: location ? 'white' : 'var(--text-tertiary)',
                                fontSize: '1rem', fontWeight: 800, cursor: location ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}>
                            {loading ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
                            {loading ? 'Aranıyor...' : 'Konaklama Ara'}
                        </motion.button>
                    </motion.div>

                    {/* POPULAR CITIES */}
                    {!searchDone && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            style={sectionStyle}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 10px' }}>🔥 Popüler Şehirler</h3>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {POPULAR_CITIES.map(city => (
                                    <button key={city.name} onClick={() => { setLocation(city.name); searchListings(city.name) }}
                                        style={{
                                            padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)',
                                            background: 'var(--bg-primary)', color: 'var(--text-secondary)',
                                            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 150ms',
                                        }}
                                        onMouseOver={e => { e.currentTarget.style.background = '#E11D48'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#E11D48' }}
                                        onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                                        {city.emoji} {city.name}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* RESULTS */}
                    <AnimatePresence>
                        {searchDone && (
                            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                                {error && (
                                    <div style={{ ...sectionStyle, background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#EF4444' }}>⚠️ {error}</p>
                                    </div>
                                )}

                                {listings.length > 0 && (
                                    <>
                                        {/* Results header */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                                            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                                                🏠 {listings.length} konaklama — {location}
                                                {nightCount > 0 && <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 500 }}> · {nightCount} gece</span>}
                                            </h2>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                {/* Sort */}
                                                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                                                    style={{
                                                        padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)',
                                                        background: 'var(--bg-primary)', color: 'var(--text-secondary)',
                                                        fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                                                    }}>
                                                    {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                                                </select>
                                                {/* View toggle */}
                                                <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                                                    <button onClick={() => setShowMap(false)}
                                                        style={{
                                                            padding: '6px 10px', border: 'none', cursor: 'pointer',
                                                            background: !showMap ? '#E11D48' : 'var(--bg-primary)',
                                                            color: !showMap ? 'white' : 'var(--text-secondary)',
                                                            display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 600,
                                                        }}>
                                                        <List size={13} /> Liste
                                                    </button>
                                                    <button onClick={() => setShowMap(true)}
                                                        style={{
                                                            padding: '6px 10px', border: 'none', cursor: 'pointer',
                                                            background: showMap ? '#E11D48' : 'var(--bg-primary)',
                                                            color: showMap ? 'white' : 'var(--text-secondary)',
                                                            display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 600,
                                                        }}>
                                                        <Map size={13} /> Harita
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Map view */}
                                        {showMap && (
                                            <div style={{ marginBottom: 16 }}>
                                                {/* Radius control */}
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
                                                    padding: '10px 14px', borderRadius: 12,
                                                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                                }}>
                                                    <SlidersHorizontal size={14} style={{ color: '#E11D48' }} />
                                                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Yarıçap:</span>
                                                    <input type="range" min="1" max="50" value={searchRadius}
                                                        onChange={e => setSearchRadius(parseInt(e.target.value))}
                                                        style={{ flex: 1, accentColor: '#E11D48' }} />
                                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#E11D48', minWidth: 40 }}>{searchRadius} km</span>
                                                    <button onClick={() => mapCenter && searchListings(null, mapCenter)}
                                                        style={{
                                                            padding: '6px 12px', borderRadius: 8, border: 'none',
                                                            background: '#E11D48', color: 'white', fontSize: '0.72rem',
                                                            fontWeight: 700, cursor: 'pointer',
                                                        }}>
                                                        🔍 Bu Alanda Ara
                                                    </button>
                                                </div>
                                                <p style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', margin: '0 0 8px', textAlign: 'center' }}>
                                                    💡 Haritaya tıklayarak o konumda arama yapabilirsiniz
                                                </p>
                                                <div ref={mapContainer} style={{
                                                    width: '100%', height: 400, borderRadius: 16, overflow: 'hidden',
                                                    border: '1px solid var(--border)',
                                                }} />
                                            </div>
                                        )}

                                        {/* Listing cards */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
                                            {sortedListings.map((listing, i) => {
                                                const curPhoto = photoIdx[listing.id] || 0
                                                const isHovered = hoveredId === listing.id
                                                return (
                                                    <motion.div key={listing.id}
                                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: Math.min(i * 0.03, 0.3) }}
                                                        whileHover={{ y: -5, boxShadow: '0 14px 35px rgba(0,0,0,0.12)' }}
                                                        onMouseEnter={() => setHoveredId(listing.id)}
                                                        onMouseLeave={() => setHoveredId(null)}
                                                        style={{
                                                            background: 'var(--bg-secondary)', borderRadius: 20,
                                                            border: isHovered ? '2px solid #E11D48' : '1px solid var(--border)',
                                                            overflow: 'hidden', transition: 'all 200ms',
                                                        }}>
                                                        {/* Photo */}
                                                        <div style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden', cursor: 'pointer' }}
                                                            onClick={() => listing.photos.length > 1 && nextPhoto(listing.id, listing.photos.length)}>
                                                            {listing.photos[curPhoto] ? (
                                                                <img src={listing.photos[curPhoto]} alt={listing.name} loading="lazy"
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 300ms' }}
                                                                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                                                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
                                                            ) : (
                                                                <div style={{ width: '100%', height: '100%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <MapPin size={32} style={{ opacity: 0.3 }} />
                                                                </div>
                                                            )}
                                                            {/* Photo counter */}
                                                            {listing.photos.length > 1 && (
                                                                <span style={{
                                                                    position: 'absolute', bottom: 8, right: 8,
                                                                    background: 'rgba(0,0,0,0.6)', color: 'white',
                                                                    padding: '2px 8px', borderRadius: 8, fontSize: '0.6rem',
                                                                }}>{curPhoto + 1}/{listing.photos.length}</span>
                                                            )}
                                                            {/* Badges */}
                                                            <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                                {listing.isSuperhost && (
                                                                    <span style={{
                                                                        background: 'white', color: '#222', padding: '3px 10px',
                                                                        borderRadius: 8, fontSize: '0.62rem', fontWeight: 700,
                                                                    }}>⭐ Süper Ev Sahibi</span>
                                                                )}
                                                                {listing.rareFind && (
                                                                    <span style={{
                                                                        background: '#EC4899', color: 'white', padding: '3px 10px',
                                                                        borderRadius: 8, fontSize: '0.62rem', fontWeight: 700,
                                                                    }}>💎 Nadir Bulunur</span>
                                                                )}
                                                            </div>
                                                            {/* Fav */}
                                                            <button onClick={e => { e.stopPropagation(); toggleFav(listing.id) }}
                                                                style={{
                                                                    position: 'absolute', top: 10, right: 10,
                                                                    background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
                                                                    border: 'none', borderRadius: '50%', width: 32, height: 32,
                                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                }}>
                                                                <Heart size={15} fill={favorites.includes(listing.id) ? '#F43F5E' : 'none'}
                                                                    color={favorites.includes(listing.id) ? '#F43F5E' : 'white'} />
                                                            </button>
                                                        </div>

                                                        {/* Info */}
                                                        <div style={{ padding: '14px 18px 18px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                                                <div style={{ flex: 1 }}>
                                                                    <h3 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
                                                                        {listing.name?.slice(0, 60)}{listing.name?.length > 60 ? '...' : ''}
                                                                    </h3>
                                                                    <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                                                                        {listing.type} · {listing.neighborhood || listing.city}
                                                                    </p>
                                                                </div>
                                                                {listing.rating > 0 && (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                                                                        <Star size={13} fill="#F59E0B" color="#F59E0B" />
                                                                        <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{listing.rating.toFixed(1)}</span>
                                                                        {listing.reviewCount > 0 && (
                                                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>({listing.reviewCount})</span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Amenities */}
                                                            <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
                                                                {listing.bedrooms > 0 && (
                                                                    <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', color: '#6366F1', fontWeight: 600 }}>
                                                                        🚪 {listing.bedrooms} oda
                                                                    </span>
                                                                )}
                                                                {listing.beds > 0 && (
                                                                    <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 6, background: 'rgba(129,140,248,0.1)', color: '#818CF8', fontWeight: 600 }}>
                                                                        🛏️ {listing.beds} yatak
                                                                    </span>
                                                                )}
                                                                {listing.bathrooms > 0 && (
                                                                    <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 6, background: 'rgba(14,165,233,0.1)', color: '#0EA5E9', fontWeight: 600 }}>
                                                                        🚿 {listing.bathrooms} banyo
                                                                    </span>
                                                                )}
                                                                {listing.guests > 0 && (
                                                                    <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 6, background: 'rgba(16,185,129,0.1)', color: '#10B981', fontWeight: 600 }}>
                                                                        👤 {listing.guests} kişi
                                                                    </span>
                                                                )}
                                                                {listing.cancelPolicy && (
                                                                    <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 6, background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontWeight: 600 }}>
                                                                        {listing.cancelPolicy === 'CANCEL_FLEXIBLE' ? '✅ Esnek İptal' : listing.cancelPolicy === 'CANCEL_MODERATE' ? '⚡ Orta İptal' : '📋 İptal Politikası'}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Price + Book */}
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                                                                <div>
                                                                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                                                                        ₺{new Intl.NumberFormat('tr-TR').format(listing.price)}
                                                                    </span>
                                                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}> /gece</span>
                                                                    {nightCount > 1 && listing.totalPrice > 0 && (
                                                                        <div style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>
                                                                            Toplam: ₺{new Intl.NumberFormat('tr-TR').format(listing.totalPrice)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <a href={listing.deeplink || listing.url} target="_blank" rel="noopener noreferrer"
                                                                    style={{
                                                                        display: 'flex', alignItems: 'center', gap: 6,
                                                                        padding: '8px 16px', borderRadius: 10, textDecoration: 'none',
                                                                        background: '#E11D48', color: 'white',
                                                                        fontSize: '0.78rem', fontWeight: 700, transition: 'all 150ms',
                                                                    }}
                                                                    onMouseOver={e => e.currentTarget.style.background = '#BE123C'}
                                                                    onMouseOut={e => e.currentTarget.style.background = '#E11D48'}>
                                                                    Airbnb'de Gör <ExternalLink size={12} />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )
                                            })}
                                        </div>
                                    </>
                                )}

                                {listings.length === 0 && !error && (
                                    <div style={{ ...sectionStyle, textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                        <MapPin size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                                        <p>Bu lokasyonda ilan bulunamadı.</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
            <style jsx global>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
                .mapboxgl-popup-content { border-radius: 10px !important; padding: 10px !important; }
            `}</style>
        </div>
    )
}
