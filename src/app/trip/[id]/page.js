'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useSpace } from '@/context/SpaceContext'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import {
    ArrowLeft, MoreHorizontal, Calendar, Minus, Plus, FileText, MapPin,
    ChevronRight, X, Compass, ExternalLink, Check, Search, Star,
    Bed, Clock, Loader2, Navigation, Heart
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import 'mapbox-gl/dist/mapbox-gl.css'

// ═══════════════════════════════════════════════════════════
// SPOT CATEGORIES with colors
// ═══════════════════════════════════════════════════════════
const CATEGORY_COLORS = {
    'MUSEUMS': '#7C3AED',
    'SIGHTS & LANDMARKS': '#0D9488',
    'RELIGIOUS SITES': '#D97706',
    'RESTAURANTS': '#DC2626',
    'CAFES': '#92400E',
    'NATURE & PARKS': '#16A34A',
    'SHOPPING': '#DB2777',
    'NIGHTLIFE': '#7C3AED',
    'ART & CULTURE': '#4F46E5',
    'ENTERTAINMENT': '#EA580C',
    'HOTELS': '#2563EB',
    'WELLNESS': '#0891B2',
    'EDUCATION': '#4338CA',
    'TRANSPORT': '#64748B',
}

export default function TripPage() {
    const { id } = useParams()
    const router = useRouter()
    const mapContainer = useRef(null)
    const mapRef = useRef(null)
    const markersRef = useRef([])

    // State
    const [trip, setTrip] = useState(null)
    const [spots, setSpots] = useState([])
    const [stays, setStays] = useState([])
    const [notes, setNotes] = useState('')
    const [editingNotes, setEditingNotes] = useState(false)
    const [activeTab, setActiveTab] = useState('plan') // discover | plan
    const [popularSpots, setPopularSpots] = useState([])
    const [loading, setLoading] = useState(true)
    const [mapLoaded, setMapLoaded] = useState(false)

    // Modals
    const [showStayModal, setShowStayModal] = useState(false)
    const [showAddSpot, setShowAddSpot] = useState(false)
    const [selectedSpot, setSelectedSpot] = useState(null)
    const [spotSearch, setSpotSearch] = useState('')
    const [spotSearchResults, setSpotSearchResults] = useState([])
    const [searchLoading, setSearchLoading] = useState(false)

    const { user } = useAuth()
    const { space } = useSpace()
    const { theme } = useTheme()
    const { locale } = useLanguage()
    const supabase = createClient()

    // ── Load trip data ──
    useEffect(() => {
        if (!id || !space) return
        loadTrip()
    }, [id, space])

    const loadTrip = async () => {
        setLoading(true)
        const { data: tripData } = await supabase
            .from('trips')
            .select('*')
            .eq('id', id)
            .eq('space_id', space.id)
            .single()

        if (tripData) {
            setTrip(tripData)
            setNotes(tripData.notes || '')
        }

        const { data: spotsData } = await supabase
            .from('trip_spots')
            .select('*')
            .eq('trip_id', id)
            .order('sort_order', { ascending: true })

        if (spotsData) setSpots(spotsData)

        const { data: staysData } = await supabase
            .from('trip_stays')
            .select('*')
            .eq('trip_id', id)

        if (staysData) setStays(staysData)
        setLoading(false)
    }

    // ── Load popular spots ──
    useEffect(() => {
        if (!trip?.city) return
        fetchPopularSpots()
    }, [trip?.city])

    const fetchPopularSpots = async () => {
        try {
            const res = await fetch(`/api/places/search?city=${encodeURIComponent(trip.city)}&type=tourist_attraction`)
            const data = await res.json()
            if (data.places) {
                setPopularSpots(data.places.filter(p =>
                    !spots.some(s => s.place_id === p.place_id)
                ))
            }
        } catch { /* silent */ }
    }

    // ── Init Mapbox ──
    useEffect(() => {
        if (!mapContainer.current || mapRef.current || !trip) return

        import('mapbox-gl').then(mapboxgl => {
            mapboxgl.default.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

            const map = new mapboxgl.default.Map({
                container: mapContainer.current,
                style: theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
                center: [28.9784, 41.0082],
                zoom: 11,
                attributionControl: false,
                interactive: true,
            })

            map.addControl(new mapboxgl.default.NavigationControl({ showCompass: false }), 'top-right')
            map.on('load', () => setMapLoaded(true))
            mapRef.current = map
        })

        return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
    }, [trip])

    // ── Render markers ──
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return
        markersRef.current.forEach(m => m.remove())
        markersRef.current = []

        const bounds = []

        spots.filter(s => s.lat && s.lng).forEach((spot, i) => {
            const el = document.createElement('div')
            el.className = 'trip-map-marker'
            el.innerHTML = `<div class="trip-marker-dot" style="background: #0D9488">${i + 1}</div>`
            el.onclick = () => setSelectedSpot(spot)
            bounds.push([spot.lng, spot.lat])

            import('mapbox-gl').then(mapboxgl => {
                const m = new mapboxgl.default.Marker({ element: el })
                    .setLngLat([spot.lng, spot.lat])
                    .addTo(mapRef.current)
                markersRef.current.push(m)
            })
        })

        if (bounds.length > 1 && mapRef.current) {
            import('mapbox-gl').then(mapboxgl => {
                const b = new mapboxgl.default.LngLatBounds()
                bounds.forEach(c => b.extend(c))
                mapRef.current.fitBounds(b, { padding: 60, maxZoom: 14 })
            })
        } else if (bounds.length === 1) {
            mapRef.current.flyTo({ center: bounds[0], zoom: 13 })
        }
    }, [spots, mapLoaded])

    // ── Night stepper ──
    const updateNights = async (delta) => {
        if (!trip) return
        const newNights = Math.max(1, (trip.nights || 1) + delta)
        setTrip(prev => ({ ...prev, nights: newNights }))
        await supabase.from('trips').update({ nights: newNights }).eq('id', trip.id)
    }

    // ── Save notes ──
    const saveNotes = async () => {
        if (!trip) return
        await supabase.from('trips').update({ notes }).eq('id', trip.id)
        setEditingNotes(false)
    }

    // ── Add spot ──
    const addSpot = async (place) => {
        if (!trip || !space) return
        const { data, error } = await supabase.from('trip_spots').insert({
            trip_id: trip.id,
            space_id: space.id,
            place_id: place.place_id,
            name: place.name,
            category: place.category,
            address: place.address,
            lat: place.lat,
            lng: place.lng,
            photo_url: place.photo_url,
            photos: place.photos || [],
            rating: place.rating,
            review_count: place.review_count,
            opening_hours: place.opening_hours,
            external_url: place.external_url,
            is_planned: true,
            sort_order: spots.length,
            created_by: user.id,
        }).select().single()

        if (data) {
            setSpots(prev => [...prev, data])
            setPopularSpots(prev => prev.filter(p => p.place_id !== place.place_id))
        }
    }

    // ── Remove spot ──
    const removeSpot = async (spotId) => {
        await supabase.from('trip_spots').delete().eq('id', spotId)
        setSpots(prev => prev.filter(s => s.id !== spotId))
        if (selectedSpot?.id === spotId) setSelectedSpot(null)
    }

    // ── Search spots ──
    const searchSpots = async (query) => {
        setSpotSearch(query)
        if (query.length < 2) { setSpotSearchResults([]); return }
        setSearchLoading(true)
        try {
            const res = await fetch(`/api/places/search?city=${encodeURIComponent(trip.city)}&query=${encodeURIComponent(query)}`)
            const data = await res.json()
            setSpotSearchResults(data.places || [])
        } catch { setSpotSearchResults([]) }
        setSearchLoading(false)
    }

    // ── Format dates ──
    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        const d = new Date(dateStr)
        return d.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })
    }

    // ── Get hero image ──
    const heroImage = trip?.hero_image_url || trip?.cover_photo_url || (popularSpots[0]?.photo_url) || ''

    if (loading) {
        return (
            <><Sidebar /><div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={32} className="spin" style={{ color: 'var(--primary-1)' }} />
            </div></>
        )
    }

    if (!trip) {
        return (
            <><Sidebar /><div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
                <p style={{ color: 'var(--text-tertiary)' }}>Trip not found</p>
                <button className="btn btn-primary" onClick={() => router.back()}>← Geri</button>
            </div></>
        )
    }

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="trip-page">
                    {/* ═══ MAP SECTION ═══ */}
                    <div className="trip-map-section">
                        <div ref={mapContainer} className="trip-map" />
                        <button className="trip-back-btn" onClick={() => router.back()}>
                            <ArrowLeft size={20} />
                        </button>
                    </div>

                    {/* ═══ HERO CARD ═══ */}
                    <div className="trip-hero-card">
                        {heroImage && (
                            <div className="trip-hero-image" style={{ backgroundImage: `url(${heroImage})` }}>
                                <div className="trip-hero-overlay" />
                            </div>
                        )}
                        <div className="trip-hero-content">
                            {trip.country && (
                                <div className="trip-country-badge">
                                    <span>🇹🇷</span> {trip.country}
                                </div>
                            )}
                            <button className="trip-menu-btn">
                                <MoreHorizontal size={18} />
                            </button>
                            <h1 className="trip-city-title">{trip.city}</h1>
                            {trip.slogan && <p className="trip-slogan">{trip.slogan}</p>}
                        </div>
                        <div className="trip-hero-fade" />
                    </div>

                    {/* ═══ DATE / NIGHTS PILL ═══ */}
                    <div className="trip-date-pill">
                        <div className="trip-date-left">
                            <Calendar size={16} />
                            <span>{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</span>
                        </div>
                        <div className="trip-date-right">
                            <button onClick={() => updateNights(-1)} className="trip-stepper-btn"><Minus size={14} /></button>
                            <span>{trip.nights || 1} {locale === 'tr' ? 'gece' : 'night'}</span>
                            <button onClick={() => updateNights(1)} className="trip-stepper-btn"><Plus size={14} /></button>
                        </div>
                    </div>

                    {/* ═══ CONTENT ═══ */}
                    <div className="trip-content">
                        {/* NOTES */}
                        <section className="trip-section">
                            <h2 className="trip-section-title">{locale === 'tr' ? 'Notlar' : 'Notes'}</h2>
                            <div className="trip-note-card" onClick={() => setEditingNotes(true)}>
                                <div className="trip-note-accent" />
                                <div className="trip-note-inner">
                                    {editingNotes ? (
                                        <textarea
                                            autoFocus
                                            className="trip-note-textarea"
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            onBlur={saveNotes}
                                            placeholder={locale === 'tr' ? 'Notlarını ekle...' : 'Add your notes...'}
                                        />
                                    ) : (
                                        <span className={notes ? 'trip-note-text' : 'trip-note-placeholder'}>
                                            {notes || (locale === 'tr' ? 'Notlarını ekle' : 'Add your notes')}
                                        </span>
                                    )}
                                    <FileText size={18} className="trip-note-icon" />
                                </div>
                            </div>
                        </section>

                        {/* STAYS */}
                        <section className="trip-section">
                            <h2 className="trip-section-title">{locale === 'tr' ? 'Konaklama' : 'Stays'}</h2>
                            <p className="trip-section-subtitle">
                                {locale === 'tr' ? `${trip.city}'de kalacak yerler` : `Places to sleep in ${trip.city}`}
                            </p>
                            {stays.map(stay => (
                                <div key={stay.id} className="trip-stay-row">
                                    <Bed size={18} />
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{stay.hotel_name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                            {formatDate(stay.check_in)} → {formatDate(stay.check_out)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button className="trip-stay-cta" onClick={() => setShowStayModal(true)}>
                                <Plus size={16} />
                                {locale === 'tr' ? 'Konaklama ekle veya bul' : 'Add or find a stay'}
                            </button>
                        </section>

                        {/* SPOTS */}
                        <section className="trip-section">
                            <div className="trip-section-header">
                                <h2 className="trip-section-title">{locale === 'tr' ? 'Mekanlar' : 'Spots'}</h2>
                                <button className="trip-add-spot-btn" onClick={() => setShowAddSpot(true)}>
                                    <Plus size={14} /> {locale === 'tr' ? 'Mekan ekle' : 'Add a spot'}
                                </button>
                            </div>

                            {/* Planned spots */}
                            {spots.map((spot, i) => (
                                <div key={spot.id} className="trip-spot-row" onClick={() => setSelectedSpot(spot)}>
                                    <div className="trip-spot-thumb" style={{ backgroundImage: spot.photo_url ? `url(${spot.photo_url})` : 'none' }}>
                                        {!spot.photo_url && <MapPin size={16} style={{ color: '#94A3B8' }} />}
                                    </div>
                                    <div className="trip-spot-info">
                                        <span className="trip-spot-category" style={{
                                            color: CATEGORY_COLORS[spot.category] || '#0D9488'
                                        }}>{spot.category}</span>
                                        <span className="trip-spot-name">{spot.name}</span>
                                    </div>
                                    <button className="trip-spot-menu" onClick={(e) => { e.stopPropagation(); removeSpot(spot.id) }}>
                                        <MoreHorizontal size={16} />
                                    </button>
                                </div>
                            ))}

                            {/* Explore popular spots */}
                            {popularSpots.length > 0 && (
                                <>
                                    <p className="trip-explore-label">
                                        {locale === 'tr' ? 'Popüler mekanları keşfet' : 'Explore popular spots'}
                                    </p>
                                    <div className="trip-spot-carousel">
                                        {popularSpots.slice(0, 8).map(spot => (
                                            <div key={spot.place_id} className="trip-carousel-card" onClick={() => setSelectedSpot(spot)}>
                                                <div className="trip-carousel-image" style={{
                                                    backgroundImage: spot.photo_url ? `url(${spot.photo_url})` : 'none'
                                                }}>
                                                    <button className="trip-carousel-add" onClick={(e) => { e.stopPropagation(); addSpot(spot) }}>
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                                <span className="trip-carousel-category" style={{
                                                    color: CATEGORY_COLORS[spot.category] || '#64748B'
                                                }}>{spot.category}</span>
                                                <span className="trip-carousel-name">{spot.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </section>
                    </div>

                    {/* ═══ FLOATING SEGMENTED CONTROL ═══ */}
                    <div className="trip-floating-tabs">
                        <button className={`trip-tab ${activeTab === 'discover' ? 'active' : ''}`}
                            onClick={() => setActiveTab('discover')}>
                            {locale === 'tr' ? 'Keşfet' : 'Discover'}
                        </button>
                        <button className={`trip-tab ${activeTab === 'plan' ? 'active' : ''}`}
                            onClick={() => setActiveTab('plan')}>
                            {locale === 'tr' ? 'Plan' : 'Plan'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════ */}
            {/* STAY MODAL */}
            {/* ═══════════════════════════════════════════ */}
            <AnimatePresence>
                {showStayModal && (
                    <motion.div className="trip-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setShowStayModal(false)}>
                        <motion.div className="trip-modal-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            onClick={e => e.stopPropagation()}>
                            <div className="trip-modal-handle" />
                            <button className="trip-modal-close" onClick={() => setShowStayModal(false)}><X size={18} /></button>

                            <h2 className="trip-modal-title">{locale === 'tr' ? 'Konaklama ekle veya bul' : 'Add or find a stay'}</h2>

                            <h3 className="trip-modal-subtitle">{locale === 'tr' ? 'Rezervasyon yap' : 'Book a stay'}</h3>
                            <div className="trip-provider-list">
                                {[
                                    { name: 'Booking.com', color: '#003580', logo: '🅱️' },
                                    { name: 'Airbnb', color: '#FF5A5F', logo: '🏠' },
                                    { name: 'Hostelworld', color: '#F47920', logo: '🏨' },
                                ].map(provider => (
                                    <a key={provider.name} className="trip-provider-row"
                                        href={`https://www.${provider.name.toLowerCase().replace('.com', '')}.com/searchresults.html?ss=${encodeURIComponent(trip.city)}&checkin=${trip.start_date}&checkout=${trip.end_date}`}
                                        target="_blank" rel="noopener noreferrer">
                                        <span style={{ fontSize: '1.2rem' }}>{provider.logo}</span>
                                        <span className="trip-provider-name" style={{ color: provider.color }}>{provider.name}</span>
                                        <span className="trip-provider-dates">{trip.city}, {formatDate(trip.start_date)} - {formatDate(trip.end_date)}</span>
                                        <ChevronRight size={16} />
                                    </a>
                                ))}
                            </div>

                            <h3 className="trip-modal-subtitle" style={{ marginTop: 24 }}>
                                {locale === 'tr' ? 'Zaten mi rezervasyon yaptın?' : 'Already booked?'}
                            </h3>
                            <div className="trip-search-input">
                                <Search size={18} />
                                <input placeholder={locale === 'tr' ? 'İsim veya adres ile ara' : 'Search by name or address'} />
                            </div>

                            <div className="trip-or-divider">
                                <div /><span>{locale === 'tr' ? 'veya' : 'or'}</span><div />
                            </div>

                            <p className="trip-modal-hint">
                                {locale === 'tr' ? 'Planına ekleyelim' : 'Let us add it to your plan'}
                            </p>
                            <button className="trip-forward-btn">
                                <FileText size={18} />
                                {locale === 'tr' ? 'Onay e-postasını ilet' : 'Forward confirmation email'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════════════════════════════════════════ */}
            {/* ADD SPOT MODAL */}
            {/* ═══════════════════════════════════════════ */}
            <AnimatePresence>
                {showAddSpot && (
                    <motion.div className="trip-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setShowAddSpot(false)}>
                        <motion.div className="trip-modal-sheet trip-modal-full" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            onClick={e => e.stopPropagation()}>

                            <div className="trip-addspot-header">
                                <button onClick={() => setShowAddSpot(false)}><X size={20} /></button>
                                <h2>{locale === 'tr' ? 'Mekan ekle' : 'Add a spot'}</h2>
                                <div />
                            </div>

                            <div className="trip-search-input" style={{ margin: '16px 20px' }}>
                                <Search size={18} />
                                <input
                                    placeholder={locale === 'tr' ? 'Mekan ara...' : 'Search places...'}
                                    value={spotSearch}
                                    onChange={e => searchSpots(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <p className="trip-powered-by">Powered by Google Places</p>

                            <div className="trip-addspot-list">
                                {/* Search results or popular spots */}
                                <h3 className="trip-addspot-section-title">
                                    {spotSearch.length > 1
                                        ? (locale === 'tr' ? 'Sonuçlar' : 'Results')
                                        : (locale === 'tr' ? 'Popüler mekanlar' : 'Popular spots')}
                                </h3>

                                {searchLoading && (
                                    <div style={{ textAlign: 'center', padding: 20 }}>
                                        <Loader2 size={24} className="spin" />
                                    </div>
                                )}

                                {(spotSearch.length > 1 ? spotSearchResults : popularSpots).map(place => {
                                    const isAdded = spots.some(s => s.place_id === place.place_id)
                                    return (
                                        <div key={place.place_id} className="trip-addspot-row">
                                            <div className="trip-addspot-thumb" style={{
                                                backgroundImage: place.photo_url ? `url(${place.photo_url})` : 'none'
                                            }}>
                                                {!place.photo_url && <MapPin size={14} />}
                                            </div>
                                            <div className="trip-addspot-info">
                                                <span className="trip-addspot-category" style={{
                                                    color: CATEGORY_COLORS[place.category] || '#64748B'
                                                }}>{place.category}</span>
                                                <span className="trip-addspot-name">{place.name}</span>
                                                <span className="trip-addspot-address">{trip.city}, Turkey</span>
                                            </div>
                                            <button
                                                className={`trip-addspot-btn ${isAdded ? 'added' : ''}`}
                                                onClick={() => !isAdded && addSpot(place)}
                                                disabled={isAdded}
                                            >
                                                {isAdded ? <Check size={16} /> : <Plus size={16} />}
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════════════════════════════════════════ */}
            {/* SPOT DETAIL MODAL */}
            {/* ═══════════════════════════════════════════ */}
            <AnimatePresence>
                {selectedSpot && (
                    <motion.div className="trip-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setSelectedSpot(null)}>
                        <motion.div className="trip-modal-sheet trip-modal-full" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            onClick={e => e.stopPropagation()}>

                            <div className="trip-spot-detail">
                                {/* Header */}
                                <div className="trip-detail-header">
                                    <span className="trip-detail-category" style={{
                                        background: `${CATEGORY_COLORS[selectedSpot.category] || '#0D9488'}15`,
                                        color: CATEGORY_COLORS[selectedSpot.category] || '#0D9488',
                                    }}>{selectedSpot.category}</span>
                                    <button className="trip-modal-close" onClick={() => setSelectedSpot(null)}>
                                        <X size={18} />
                                    </button>
                                </div>

                                <h2 className="trip-detail-title">{selectedSpot.name}</h2>

                                {/* Action pills */}
                                <div className="trip-detail-actions">
                                    {spots.some(s => s.place_id === selectedSpot.place_id) ? (
                                        <button className="trip-action-pill active">
                                            <Check size={14} /> {locale === 'tr' ? 'Planlandı' : 'Planned'}
                                        </button>
                                    ) : (
                                        <button className="trip-action-pill" onClick={() => addSpot(selectedSpot)}>
                                            <Plus size={14} /> {locale === 'tr' ? 'Planla' : 'Plan'}
                                        </button>
                                    )}
                                    {selectedSpot.lat && selectedSpot.lng && (
                                        <a className="trip-action-pill outline"
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${selectedSpot.lat},${selectedSpot.lng}`}
                                            target="_blank" rel="noopener noreferrer">
                                            <Navigation size={14} /> {locale === 'tr' ? 'Yol Tarifi' : 'Directions'}
                                        </a>
                                    )}
                                    {selectedSpot.external_url && (
                                        <a className="trip-action-pill outline"
                                            href={selectedSpot.external_url} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink size={14} /> {locale === 'tr' ? 'Görüntüle' : 'View on'}
                                        </a>
                                    )}
                                </div>

                                {/* Opening hours */}
                                {selectedSpot.opening_hours && (
                                    <div className="trip-detail-hours">
                                        <span className="trip-detail-today">TODAY</span>
                                        <span className="trip-detail-time">
                                            <Clock size={14} />
                                            {selectedSpot.opening_hours.open_now
                                                ? (locale === 'tr' ? 'Şu an açık' : 'Open now')
                                                : (locale === 'tr' ? 'Şu an kapalı' : 'Closed now')}
                                        </span>
                                    </div>
                                )}

                                {/* Photo gallery */}
                                <div className="trip-detail-gallery">
                                    {(selectedSpot.photos || [selectedSpot.photo_url]).filter(Boolean).slice(0, 3).map((url, i) => (
                                        <div key={i} className="trip-detail-photo" style={{ backgroundImage: `url(${url})` }} />
                                    ))}
                                </div>

                                {/* Rating */}
                                {selectedSpot.rating > 0 && (
                                    <div className="trip-detail-rating">
                                        <Star size={16} style={{ color: '#FBBF24', fill: '#FBBF24' }} />
                                        <span>{selectedSpot.rating}</span>
                                        {selectedSpot.review_count > 0 && (
                                            <span className="trip-detail-reviews">({selectedSpot.review_count.toLocaleString()} {locale === 'tr' ? 'yorum' : 'reviews'})</span>
                                        )}
                                    </div>
                                )}

                                {/* Editorial block */}
                                <div className="trip-detail-editorial">
                                    <span className="trip-editorial-label">
                                        {locale === 'tr' ? 'BU MEKANI NEDEN SEVİYORUZ' : 'WHY WE LOVE THIS SPOT'}
                                    </span>
                                    <p className="trip-editorial-quote">
                                        {selectedSpot.description || (locale === 'tr'
                                            ? `${selectedSpot.name} — ${trip.city}'in en sevilen mekanlarından biri.`
                                            : `${selectedSpot.name} — one of ${trip.city}'s most beloved spots.`)}
                                    </p>
                                    <div className="trip-editorial-author">
                                        <div className="trip-author-avatar">M</div>
                                        <span>MapMemo Traveler</span>
                                    </div>
                                </div>

                                {/* Address */}
                                {selectedSpot.address && (
                                    <div className="trip-detail-address">
                                        <MapPin size={14} />
                                        <span>{selectedSpot.address}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
            `}</style>
        </>
    )
}
