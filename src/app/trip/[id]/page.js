'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useSpace } from '@/context/SpaceContext'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import {
    ArrowLeft, MoreHorizontal, Calendar, Minus, Plus, FileText, MapPin,
    ChevronRight, X, Compass, Check, Search, Star, Bed, Clock, Loader2,
    Navigation, Plane, Car, Hotel, Phone, Globe, ChevronDown, ChevronUp,
    MessageCircle, User, Home, Users, Bath, Wifi, Wind, Waves, Ticket
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import 'mapbox-gl/dist/mapbox-gl.css'

const CAT_COLORS = {
    'MUSEUMS': '#7C3AED', 'SIGHTS & LANDMARKS': '#0D9488', 'RELIGIOUS SITES': '#D97706',
    'RESTAURANTS': '#DC2626', 'CAFES': '#92400E', 'NATURE & PARKS': '#16A34A',
    'SHOPPING': '#DB2777', 'NIGHTLIFE': '#7C3AED', 'ART & CULTURE': '#4F46E5',
    'ENTERTAINMENT': '#EA580C', 'HOTELS': '#2563EB', 'WELLNESS': '#0891B2',
}

const CITY_IATA = {
    'istanbul': 'IST', 'ankara': 'ANK', 'izmir': 'ADB', 'antalya': 'AYT',
    'paris': 'CDG', 'london': 'LHR', 'rome': 'FCO', 'barcelona': 'BCN',
    'new york': 'JFK', 'tokyo': 'NRT', 'dubai': 'DXB', 'berlin': 'BER',
    'amsterdam': 'AMS', 'madrid': 'MAD', 'lisbon': 'LIS', 'prague': 'PRG',
    'vienna': 'VIE', 'athens': 'ATH', 'bangkok': 'BKK', 'singapore': 'SIN',
    'bodrum': 'BJV', 'dalaman': 'DLM', 'trabzon': 'TZX',
}

export default function TripPage() {
    const { id } = useParams()
    const router = useRouter()
    const mapContainer = useRef(null)
    const mapRef = useRef(null)
    const markersRef = useRef([])

    const [trip, setTrip] = useState(null)
    const [spots, setSpots] = useState([])
    const [stays, setStays] = useState([])
    const [notes, setNotes] = useState('')
    const [editingNotes, setEditingNotes] = useState(false)
    const [activeTab, setActiveTab] = useState('plan')
    const [popularSpots, setPopularSpots] = useState([])
    const [loading, setLoading] = useState(true)
    const [mapLoaded, setMapLoaded] = useState(false)

    // Travel services
    const [hotels, setHotels] = useState([])
    const [hotelsLoading, setHotelsLoading] = useState(false)
    const [flights, setFlights] = useState([])
    const [flightsLoading, setFlightsLoading] = useState(false)
    const [carAgencies, setCarAgencies] = useState([])
    const [carsLoading, setCarsLoading] = useState(false)
    const [airbnbListings, setAirbnbListings] = useState([])
    const [airbnbLoading, setAirbnbLoading] = useState(false)
    const [events, setEvents] = useState([])
    const [eventsLoading, setEventsLoading] = useState(false)
    const [serviceTab, setServiceTab] = useState('hotels')
    const [flightOrigin, setFlightOrigin] = useState('IST')

    // Detail modals
    const [showAddSpot, setShowAddSpot] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null) // hotel/spot/car detail
    const [itemDetail, setItemDetail] = useState(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [spotSearch, setSpotSearch] = useState('')
    const [spotSearchResults, setSpotSearchResults] = useState([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [expandedFlight, setExpandedFlight] = useState(null)

    const { user } = useAuth()
    const { space } = useSpace()
    const { theme } = useTheme()
    const { locale } = useLanguage()
    const supabase = createClient()
    const t = (tr, en) => locale === 'tr' ? tr : en

    // ── Load trip ──
    useEffect(() => { if (id && space) loadTrip() }, [id, space])

    const loadTrip = async () => {
        setLoading(true)
        const { data: tripData } = await supabase.from('trips').select('*').eq('id', id).eq('space_id', space.id).single()
        if (tripData) { setTrip(tripData); setNotes(tripData.notes || '') }
        const { data: spotsData } = await supabase.from('trip_spots').select('*').eq('trip_id', id).order('sort_order', { ascending: true })
        if (spotsData) setSpots(spotsData)
        const { data: staysData } = await supabase.from('trip_stays').select('*').eq('trip_id', id)
        if (staysData) setStays(staysData)
        setLoading(false)
    }

    // ── Popular spots ──
    useEffect(() => { if (trip?.city) fetchPopularSpots() }, [trip?.city])
    const fetchPopularSpots = async () => {
        try {
            const res = await fetch(`/api/places/search?city=${encodeURIComponent(trip.city)}&type=tourist_attraction`)
            const data = await res.json()
            if (data.places) setPopularSpots(data.places.filter(p => !spots.some(s => s.place_id === p.place_id)))
        } catch { }
    }

    // ── Discover tab data loading ──
    useEffect(() => {
        if (activeTab !== 'discover' || !trip?.city) return
        if (serviceTab === 'hotels' && hotels.length === 0) fetchHotels()
        if (serviceTab === 'flights' && flights.length === 0) fetchFlights()
        if (serviceTab === 'cars' && carAgencies.length === 0) fetchCars()
        if (serviceTab === 'airbnb' && airbnbListings.length === 0) fetchAirbnb()
        if (serviceTab === 'events' && events.length === 0) fetchEvents()
    }, [activeTab, serviceTab, trip?.city])

    const fetchHotels = async () => {
        setHotelsLoading(true)
        try {
            const p = new URLSearchParams({ city: trip.city })
            if (trip.start_date) p.append('checkin', trip.start_date)
            if (trip.end_date) p.append('checkout', trip.end_date)
            const res = await fetch(`/api/hotels?${p}`)
            const data = await res.json()
            if (data.hotels) setHotels(data.hotels)
        } catch { }
        setHotelsLoading(false)
    }

    const fetchFlights = async () => {
        if (!trip.start_date) return
        setFlightsLoading(true)
        try {
            const dest = CITY_IATA[trip.city.toLowerCase()] || 'IST'
            const p = new URLSearchParams({ origin: flightOrigin, destination: dest, departure: trip.start_date, adults: '1' })
            if (trip.end_date) p.append('return', trip.end_date)
            const res = await fetch(`/api/flights?${p}`)
            const data = await res.json()
            if (data.flights) setFlights(data.flights)
        } catch { }
        setFlightsLoading(false)
    }

    const fetchCars = async () => {
        setCarsLoading(true)
        try {
            const res = await fetch(`/api/cars?city=${encodeURIComponent(trip.city)}`)
            const data = await res.json()
            if (data.agencies) setCarAgencies(data.agencies)
        } catch { }
        setCarsLoading(false)
    }

    const fetchAirbnb = async () => {
        setAirbnbLoading(true)
        try {
            const p = new URLSearchParams({ city: trip.city })
            if (trip.start_date) p.append('checkin', trip.start_date)
            if (trip.end_date) p.append('checkout', trip.end_date)
            const res = await fetch(`/api/airbnb?${p}`)
            const data = await res.json()
            if (data.listings) setAirbnbListings(data.listings)
        } catch { }
        setAirbnbLoading(false)
    }

    const fetchEvents = async () => {
        setEventsLoading(true)
        try {
            const res = await fetch(`/api/events?city=${encodeURIComponent(trip.city)}`)
            const data = await res.json()
            if (data.events) setEvents(data.events)
        } catch { }
        setEventsLoading(false)
    }

    // ── Place detail (in-app) ──
    const openDetail = async (item) => {
        setSelectedItem(item)
        setItemDetail(null)
        // Airbnb listings don't use Google Places detail
        if (item.type && item.price_per_night !== undefined) {
            // It's an Airbnb listing — show directly, no API call
            setItemDetail(item)
            return
        }
        if (!item.place_id) return
        setDetailLoading(true)
        try {
            const res = await fetch(`/api/places/detail?place_id=${item.place_id}`)
            const data = await res.json()
            if (data.name) setItemDetail(data)
        } catch { }
        setDetailLoading(false)
    }

    // ── Mapbox ──
    useEffect(() => {
        if (!mapContainer.current || mapRef.current || !trip) return
        import('mapbox-gl').then(mapboxgl => {
            mapboxgl.default.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
            const map = new mapboxgl.default.Map({
                container: mapContainer.current,
                style: theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
                center: [28.9784, 41.0082], zoom: 11, attributionControl: false,
            })
            map.addControl(new mapboxgl.default.NavigationControl({ showCompass: false }), 'top-right')
            map.on('load', () => setMapLoaded(true))
            mapRef.current = map
        })
        return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
    }, [trip])

    // ── Markers ──
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return
        markersRef.current.forEach(m => m.remove())
        markersRef.current = []
        const bounds = []
        spots.filter(s => s.lat && s.lng).forEach((spot, i) => {
            const el = document.createElement('div')
            el.className = 'trip-map-marker'
            el.innerHTML = `<div class="trip-marker-dot" style="background:#0D9488">${i + 1}</div>`
            el.onclick = () => openDetail(spot)
            bounds.push([spot.lng, spot.lat])
            import('mapbox-gl').then(mapboxgl => {
                const m = new mapboxgl.default.Marker({ element: el }).setLngLat([spot.lng, spot.lat]).addTo(mapRef.current)
                markersRef.current.push(m)
            })
        })
        if (bounds.length > 1) import('mapbox-gl').then(mapboxgl => {
            const b = new mapboxgl.default.LngLatBounds(); bounds.forEach(c => b.extend(c))
            mapRef.current.fitBounds(b, { padding: 60, maxZoom: 14 })
        })
        else if (bounds.length === 1) mapRef.current.flyTo({ center: bounds[0], zoom: 13 })
    }, [spots, mapLoaded])

    // ── Helpers ──
    const updateNights = async (d) => { const n = Math.max(1, (trip.nights || 1) + d); setTrip(p => ({ ...p, nights: n })); await supabase.from('trips').update({ nights: n }).eq('id', trip.id) }
    const saveNotes = async () => { await supabase.from('trips').update({ notes }).eq('id', trip.id); setEditingNotes(false) }
    const addSpot = async (place) => {
        if (!trip || !space) return
        const { data } = await supabase.from('trip_spots').insert({
            trip_id: trip.id, space_id: space.id, place_id: place.place_id,
            name: place.name, category: place.category, address: place.address,
            lat: place.lat, lng: place.lng, photo_url: place.photo_url,
            photos: place.photos || [], rating: place.rating, review_count: place.review_count,
            opening_hours: place.opening_hours, external_url: place.external_url,
            is_planned: true, sort_order: spots.length, created_by: user.id,
        }).select().single()
        if (data) { setSpots(p => [...p, data]); setPopularSpots(p => p.filter(x => x.place_id !== place.place_id)) }
    }
    const removeSpot = async (id) => { await supabase.from('trip_spots').delete().eq('id', id); setSpots(p => p.filter(s => s.id !== id)); if (selectedItem?.id === id) setSelectedItem(null) }
    const searchSpots = async (q) => {
        setSpotSearch(q); if (q.length < 2) { setSpotSearchResults([]); return }
        setSearchLoading(true)
        try { const res = await fetch(`/api/places/search?city=${encodeURIComponent(trip.city)}&query=${encodeURIComponent(q)}`); const data = await res.json(); setSpotSearchResults(data.places || []) } catch { setSpotSearchResults([]) }
        setSearchLoading(false)
    }
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' }) : ''
    const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
    const fmtDur = (d) => d ? d.replace('PT', '').replace('H', 's ').replace('M', 'dk') : ''
    const heroImage = trip?.hero_image_url || trip?.cover_photo_url || popularSpots[0]?.photo_url || ''

    // ── Price stars ──
    const PriceStars = ({ level }) => (<span className="trip-price-dots">{'₺'.repeat(Math.max(1, level))}<span style={{ opacity: 0.2 }}>{'₺'.repeat(Math.max(0, 4 - Math.max(1, level)))}</span></span>)
    // ── Rating bar ──
    const RatingBar = ({ rating, count }) => (
        <div className="trip-rating-bar">
            <Star size={13} style={{ color: '#FBBF24', fill: '#FBBF24' }} />
            <strong>{rating}</strong>
            {count > 0 && <span className="trip-rating-count">({count.toLocaleString()})</span>}
        </div>
    )

    if (loading) return (<><Sidebar /><div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><Loader2 size={32} className="spin" style={{ color: '#0D9488' }} /></div></>)
    if (!trip) return (<><Sidebar /><div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}><MapPin size={40} style={{ color: 'var(--text-tertiary)' }} /><p style={{ color: 'var(--text-tertiary)' }}>{t('Trip bulunamadı', 'Trip not found')}</p><button className="btn btn-primary" onClick={() => router.back()}>← {t('Geri', 'Back')}</button></div></>)

    // ── Render detail data or fallback ──
    const detail = itemDetail || selectedItem

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="trip-page">
                    {/* ═══ MAP ═══ */}
                    <div className="trip-map-section">
                        <div ref={mapContainer} className="trip-map" />
                        <button className="trip-back-btn" onClick={() => router.back()}><ArrowLeft size={20} /></button>
                    </div>

                    {/* ═══ HERO ═══ */}
                    <div className="trip-hero-card">
                        {heroImage && (<div className="trip-hero-image" style={{ backgroundImage: `url(${heroImage})` }}><div className="trip-hero-overlay" /></div>)}
                        <div className="trip-hero-content">
                            {trip.country && <div className="trip-country-badge">🇹🇷 {trip.country}</div>}
                            <h1 className="trip-city-title">{trip.city}</h1>
                            {trip.slogan && <p className="trip-slogan">{trip.slogan}</p>}
                        </div>
                        <div className="trip-hero-fade" />
                    </div>

                    {/* ═══ DATE PILL ═══ */}
                    <div className="trip-date-pill">
                        <div className="trip-date-left"><Calendar size={16} /><span>{fmtDate(trip.start_date)} — {fmtDate(trip.end_date)}</span></div>
                        <div className="trip-date-right">
                            <button onClick={() => updateNights(-1)} className="trip-stepper-btn"><Minus size={14} /></button>
                            <span className="trip-night-count">{trip.nights || 1} {t('gece', 'nights')}</span>
                            <button onClick={() => updateNights(1)} className="trip-stepper-btn"><Plus size={14} /></button>
                        </div>
                    </div>

                    {/* ═══ CONTENT ═══ */}
                    <div className="trip-content">
                        <AnimatePresence mode="wait">
                            {activeTab === 'plan' ? (
                                <motion.div key="plan" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                                    {/* NOTES */}
                                    <section className="trip-section">
                                        <h2 className="trip-section-title"><FileText size={18} /> {t('Notlar', 'Notes')}</h2>
                                        <div className="trip-note-card" onClick={() => setEditingNotes(true)}>
                                            <div className="trip-note-accent" />
                                            <div className="trip-note-inner">
                                                {editingNotes ? <textarea autoFocus className="trip-note-textarea" value={notes} onChange={e => setNotes(e.target.value)} onBlur={saveNotes} placeholder={t('Notlarını ekle...', 'Add your notes...')} />
                                                    : <span className={notes ? 'trip-note-text' : 'trip-note-placeholder'}>{notes || t('Notlarını ekle', 'Add your notes')}</span>}
                                                <FileText size={18} className="trip-note-icon" />
                                            </div>
                                        </div>
                                    </section>

                                    {/* STAYS */}
                                    <section className="trip-section">
                                        <h2 className="trip-section-title"><Bed size={18} /> {t('Konaklama', 'Stays')}</h2>
                                        {stays.map(stay => (<div key={stay.id} className="trip-stay-row"><Bed size={18} /><div><div style={{ fontWeight: 600 }}>{stay.hotel_name}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{fmtDate(stay.check_in)} → {fmtDate(stay.check_out)}</div></div></div>))}
                                        <button className="trip-stay-cta" onClick={() => { setActiveTab('discover'); setServiceTab('hotels') }}><Hotel size={16} /> {t('Otel bul', 'Find a hotel')}</button>
                                    </section>

                                    {/* SPOTS */}
                                    <section className="trip-section">
                                        <div className="trip-section-header">
                                            <h2 className="trip-section-title"><MapPin size={18} /> {t('Mekanlar', 'Spots')}</h2>
                                            <button className="trip-add-spot-btn" onClick={() => setShowAddSpot(true)}><Plus size={14} /> {t('Ekle', 'Add')}</button>
                                        </div>
                                        {spots.map(spot => (
                                            <div key={spot.id} className="trip-spot-row" onClick={() => openDetail(spot)}>
                                                <div className="trip-spot-thumb" style={{ backgroundImage: spot.photo_url ? `url(${spot.photo_url})` : 'none' }}>{!spot.photo_url && <MapPin size={16} style={{ color: '#94A3B8' }} />}</div>
                                                <div className="trip-spot-info">
                                                    <span className="trip-spot-category" style={{ color: CAT_COLORS[spot.category] || '#0D9488' }}>{spot.category}</span>
                                                    <span className="trip-spot-name">{spot.name}</span>
                                                    {spot.rating > 0 && <RatingBar rating={spot.rating} count={spot.review_count || 0} />}
                                                </div>
                                                <button className="trip-spot-menu" onClick={e => { e.stopPropagation(); removeSpot(spot.id) }}><X size={14} /></button>
                                            </div>
                                        ))}
                                        {popularSpots.length > 0 && (<>
                                            <p className="trip-explore-label">{t('Popüler mekanları keşfet', 'Explore popular spots')}</p>
                                            <div className="trip-spot-carousel">
                                                {popularSpots.slice(0, 10).map(spot => (
                                                    <div key={spot.place_id} className="trip-carousel-card" onClick={() => openDetail(spot)}>
                                                        <div className="trip-carousel-image" style={{ backgroundImage: spot.photo_url ? `url(${spot.photo_url})` : 'none' }}>
                                                            <button className="trip-carousel-add" onClick={e => { e.stopPropagation(); addSpot(spot) }}><Plus size={14} /></button>
                                                        </div>
                                                        <span className="trip-carousel-category" style={{ color: CAT_COLORS[spot.category] || '#64748B' }}>{spot.category}</span>
                                                        <span className="trip-carousel-name">{spot.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>)}
                                    </section>
                                </motion.div>
                            ) : (
                                /* ════════ DISCOVER ════════ */
                                <motion.div key="discover" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                                    <div className="trip-service-tabs">
                                        {[
                                            { key: 'hotels', icon: <Hotel size={15} />, label: t('Oteller', 'Hotels') },
                                            { key: 'airbnb', icon: <Home size={15} />, label: 'Airbnb' },
                                            { key: 'flights', icon: <Plane size={15} />, label: t('Uçuşlar', 'Flights') },
                                            { key: 'cars', icon: <Car size={15} />, label: t('Araç Kiralama', 'Car Rental') },
                                            { key: 'events', icon: <Ticket size={15} />, label: t('Etkinlikler', 'Events') },
                                        ].map(tab => (
                                            <button key={tab.key} className={`trip-service-tab ${serviceTab === tab.key ? 'active' : ''}`} onClick={() => setServiceTab(tab.key)}>{tab.icon} {tab.label}</button>
                                        ))}
                                    </div>

                                    {/* ── HOTELS ── */}
                                    {serviceTab === 'hotels' && (
                                        <section className="trip-section">
                                            <h2 className="trip-section-title">{t(`${trip.city} Otelleri`, `Hotels in ${trip.city}`)}</h2>
                                            {hotelsLoading ? <LoadingPlaceholder text={t('Oteller aranıyor...', 'Searching hotels...')} /> : hotels.length === 0 ? <EmptyPlaceholder icon={<Hotel size={36} />} text={t('Otel bulunamadı', 'No hotels found')} /> : (
                                                <div className="trip-hotel-grid">
                                                    {hotels.map(hotel => (
                                                        <div key={hotel.place_id} className="trip-hotel-card" onClick={() => openDetail(hotel)}>
                                                            <div className="trip-hotel-image" style={{ backgroundImage: hotel.photo_url ? `url(${hotel.photo_url})` : 'none' }}>
                                                                <div className="trip-hotel-badge">{hotel.class}</div>
                                                                <div className="trip-hotel-price"><PriceStars level={hotel.price_level} /></div>
                                                            </div>
                                                            <div className="trip-hotel-info">
                                                                <h3 className="trip-hotel-name">{hotel.name}</h3>
                                                                {hotel.rating > 0 && <RatingBar rating={hotel.rating} count={hotel.review_count} />}
                                                                <p className="trip-hotel-address"><MapPin size={11} /> {hotel.address?.split(',').slice(0, 2).join(',')}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </section>
                                    )}

                                    {/* ── FLIGHTS ── */}
                                    {serviceTab === 'flights' && (
                                        <section className="trip-section">
                                            <h2 className="trip-section-title">{t(`${trip.city} Uçuşları`, `Flights to ${trip.city}`)}</h2>
                                            <div className="trip-flight-origin">
                                                <Plane size={15} />
                                                <span>{t('Kalkış:', 'From:')}</span>
                                                <select value={flightOrigin} onChange={e => { setFlightOrigin(e.target.value); setFlights([]) }} className="trip-origin-select">
                                                    <option value="IST">İstanbul (IST)</option>
                                                    <option value="ANK">Ankara (ANK)</option>
                                                    <option value="ADB">İzmir (ADB)</option>
                                                    <option value="AYT">Antalya (AYT)</option>
                                                    <option value="LHR">London (LHR)</option>
                                                    <option value="CDG">Paris (CDG)</option>
                                                    <option value="BER">Berlin (BER)</option>
                                                </select>
                                                <button className="trip-search-flight-btn" onClick={fetchFlights}><Search size={14} /> {t('Ara', 'Search')}</button>
                                            </div>
                                            {!trip.start_date ? <EmptyPlaceholder icon={<Calendar size={36} />} text={t('Tarih eklenmemiş', 'No dates set')} /> :
                                                flightsLoading ? <LoadingPlaceholder text={t('Uçuşlar aranıyor...', 'Searching flights...')} /> :
                                                    flights.length === 0 ? <EmptyPlaceholder icon={<Plane size={36} />} text={t('Uçuş bulunamadı', 'No flights found')} /> : (
                                                        <div className="trip-flight-list">
                                                            {flights.map((flight, fi) => (
                                                                <div key={flight.id} className={`trip-flight-card ${expandedFlight === fi ? 'expanded' : ''}`}>
                                                                    <div className="trip-flight-header" onClick={() => setExpandedFlight(expandedFlight === fi ? null : fi)}>
                                                                        <div className="trip-flight-route">
                                                                            <span className="trip-route-code">{flight.segments[0]?.segments[0]?.departure}</span>
                                                                            <div className="trip-route-line"><Plane size={14} /></div>
                                                                            <span className="trip-route-code">{flight.segments[0]?.segments[flight.segments[0].segments.length - 1]?.arrival}</span>
                                                                        </div>
                                                                        <div className="trip-flight-price-tag">
                                                                            <span className="trip-price-amount">{Number(flight.price).toLocaleString()} {flight.currency}</span>
                                                                            <span className="trip-flight-class">{flight.bookingClass}</span>
                                                                        </div>
                                                                        {expandedFlight === fi ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                                    </div>
                                                                    <AnimatePresence>
                                                                        {expandedFlight === fi && (
                                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="trip-flight-details">
                                                                                {flight.segments.map((itin, idx) => (
                                                                                    <div key={idx} className="trip-flight-itinerary">
                                                                                        <span className="trip-itin-label">{idx === 0 ? t('Gidiş', 'Outbound') : t('Dönüş', 'Return')}</span>
                                                                                        {itin.segments.map((seg, si) => (
                                                                                            <div key={si} className="trip-flight-segment">
                                                                                                <div className="trip-seg-time"><span className="trip-seg-hour">{fmtTime(seg.departureTime)}</span><span className="trip-seg-code">{seg.departure}</span></div>
                                                                                                <div className="trip-seg-line"><div className="trip-seg-dot" /><div className="trip-seg-dash" /><div className="trip-seg-dot" /></div>
                                                                                                <div className="trip-seg-time"><span className="trip-seg-hour">{fmtTime(seg.arrivalTime)}</span><span className="trip-seg-code">{seg.arrival}</span></div>
                                                                                                <div className="trip-seg-meta"><span className="trip-seg-flight">{seg.flightNumber}</span><span className="trip-seg-dur">{fmtDur(seg.duration)}</span></div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                ))}
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                        </section>
                                    )}

                                    {/* ── AIRBNB ── */}
                                    {serviceTab === 'airbnb' && (
                                        <section className="trip-section">
                                            <h2 className="trip-section-title">{t(`${trip.city} Airbnb`, `Airbnb in ${trip.city}`)}</h2>
                                            {airbnbLoading ? <LoadingPlaceholder text={t('Airbnb ilanları aranıyor...', 'Searching Airbnb...')} /> : airbnbListings.length === 0 ? (
                                                <div className="trip-placeholder">
                                                    <Home size={36} />
                                                    <p>{t('Airbnb ilanı bulunamadı', 'No Airbnb listings found')}</p>
                                                    <p style={{ fontSize: '0.75rem', maxWidth: 260 }}>{t('RAPIDAPI_KEY eklemen gerekiyor. Aşağıdaki adımları izle.', 'Add RAPIDAPI_KEY to .env.local')}</p>
                                                </div>
                                            ) : (
                                                <div className="trip-airbnb-grid">
                                                    {airbnbListings.map(listing => (
                                                        <div key={listing.id} className="trip-airbnb-card" onClick={() => openDetail(listing)}>
                                                            <div className="trip-airbnb-image" style={{ backgroundImage: listing.photo_url ? `url(${listing.photo_url})` : 'none' }}>
                                                                {listing.is_superhost && <span className="trip-airbnb-superhost">★ Superhost</span>}
                                                                <div className="trip-airbnb-price-badge">{listing.price_per_night ? `${listing.price_per_night.toLocaleString()} ${listing.currency}` : ''}<span>/ {t('gece', 'night')}</span></div>
                                                            </div>
                                                            <div className="trip-airbnb-info">
                                                                <span className="trip-airbnb-type">{listing.type}</span>
                                                                <h3 className="trip-airbnb-name">{listing.name}</h3>
                                                                <div className="trip-airbnb-meta">
                                                                    {listing.rating > 0 && <RatingBar rating={listing.rating} count={listing.review_count} />}
                                                                    <span className="trip-airbnb-specs">
                                                                        {listing.bedrooms > 0 && <><Bed size={12} /> {listing.bedrooms}</>}
                                                                        {listing.beds > 0 && <> · {listing.beds} {t('yatak', 'beds')}</>}
                                                                        {listing.bathrooms > 0 && <> · <Bath size={12} /> {listing.bathrooms}</>}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </section>
                                    )}

                                    {/* ── CARS ── */}
                                    {serviceTab === 'cars' && (
                                        <section className="trip-section">
                                            <h2 className="trip-section-title">{t('Araç Kiralama Noktaları', 'Car Rental Agencies')}</h2>
                                            {carsLoading ? <LoadingPlaceholder text={t('Aranıyor...', 'Searching...')} /> : carAgencies.length === 0 ? <EmptyPlaceholder icon={<Car size={36} />} text={t('Araç kiralama bulunamadı', 'No car rentals found')} /> : (
                                                <div className="trip-car-grid">
                                                    {carAgencies.map(agency => (
                                                        <div key={agency.place_id} className="trip-car-card" onClick={() => openDetail(agency)}>
                                                            <div className="trip-car-thumb" style={{ backgroundImage: agency.photo_url ? `url(${agency.photo_url})` : 'none' }}>{!agency.photo_url && <Car size={20} style={{ color: '#94A3B8' }} />}</div>
                                                            <div className="trip-car-info">
                                                                <span className="trip-car-name">{agency.name}</span>
                                                                {agency.rating > 0 && <RatingBar rating={agency.rating} count={agency.review_count} />}
                                                                <span className="trip-car-address"><MapPin size={11} /> {agency.address?.split(',').slice(0, 2).join(',')}</span>
                                                            </div>
                                                            <ChevronRight size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </section>
                                    )}

                                    {/* ── EVENTS (etkinlik.io) ── */}
                                    {serviceTab === 'events' && (
                                        <section className="trip-section">
                                            <h2 className="trip-section-title">{t(`${trip.city} Etkinlikleri`, `Events in ${trip.city}`)}</h2>
                                            {eventsLoading ? <LoadingPlaceholder text={t('Etkinlikler aranıyor...', 'Searching events...')} /> : events.length === 0 ? <EmptyPlaceholder icon={<Ticket size={36} />} text={t('Etkinlik bulunamadı', 'No events found')} /> : (
                                                <div className="trip-events-grid">
                                                    {events.map(event => (
                                                        <div key={event.id} className="trip-event-card" onClick={() => event.url && window.open(event.url, '_blank')}>
                                                            <div className="trip-event-poster" style={{ backgroundImage: event.poster_url ? `url(${event.poster_url})` : 'none' }}>
                                                                {!event.poster_url && <Ticket size={24} style={{ color: '#94A3B8' }} />}
                                                                {event.is_free && <span className="trip-event-free">{t('Ücretsiz', 'Free')}</span>}
                                                                <span className="trip-event-format">{event.emoji} {event.format || event.category}</span>
                                                            </div>
                                                            <div className="trip-event-info">
                                                                <h3 className="trip-event-name">{event.name}</h3>
                                                                {event.start && (
                                                                    <span className="trip-event-date">
                                                                        <Calendar size={11} />
                                                                        {new Date(event.start).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                )}
                                                                {event.venue_name && (
                                                                    <span className="trip-event-venue"><MapPin size={11} /> {event.venue_name}</span>
                                                                )}
                                                                {event.ticket_url && (
                                                                    <a href={event.ticket_url} target="_blank" rel="noopener noreferrer" className="trip-event-ticket-btn" onClick={e => e.stopPropagation()}>
                                                                        <Ticket size={12} /> {t('Bilet Al', 'Get Tickets')}
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="trip-events-attribution">{t('Etkinlik verileri etkinlik.io tarafından sağlanmaktadır.', 'Event data provided by etkinlik.io')}</p>
                                        </section>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ═══ FLOATING TABS ═══ */}
                    <div className="trip-floating-tabs">
                        <button className={`trip-tab ${activeTab === 'plan' ? 'active' : ''}`} onClick={() => setActiveTab('plan')}><MapPin size={15} /> {t('Plan', 'Plan')}</button>
                        <button className={`trip-tab ${activeTab === 'discover' ? 'active' : ''}`} onClick={() => setActiveTab('discover')}><Compass size={15} /> {t('Keşfet', 'Discover')}</button>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/*  IN-APP DETAIL MODAL — Hotels, Spots, Cars                    */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {selectedItem && (
                    <motion.div className="trip-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setSelectedItem(null); setItemDetail(null) }}>
                        <motion.div className="trip-modal-sheet trip-modal-full" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} onClick={e => e.stopPropagation()}>
                            <div className="trip-modal-handle" />
                            <button className="trip-modal-close" onClick={() => { setSelectedItem(null); setItemDetail(null) }}><X size={18} /></button>

                            {detailLoading && !itemDetail ? (
                                <div style={{ textAlign: 'center', padding: '60px 0' }}><Loader2 size={28} className="spin" style={{ color: '#0D9488' }} /><p style={{ color: 'var(--text-tertiary)', marginTop: 12, fontSize: '0.85rem' }}>{t('Detaylar yükleniyor...', 'Loading details...')}</p></div>
                            ) : detail ? (
                                <div className="trip-detail-view">
                                    {/* Photo gallery */}
                                    {(detail.photos?.length > 0 || detail.photo_url) && (
                                        <div className="trip-detail-gallery">
                                            {(detail.photos?.length > 0 ? detail.photos : [detail.photo_url]).filter(Boolean).map((url, i) => (
                                                <div key={i} className="trip-detail-photo" style={{ backgroundImage: `url(${url})` }} />
                                            ))}
                                        </div>
                                    )}

                                    {/* Category pill */}
                                    {detail.category && (
                                        <span className="trip-detail-category" style={{ background: `${CAT_COLORS[detail.category] || '#0D9488'}15`, color: CAT_COLORS[detail.category] || '#0D9488' }}>{detail.category}</span>
                                    )}

                                    <h2 className="trip-detail-title">{detail.name}</h2>

                                    {/* Rating + Price */}
                                    <div className="trip-detail-meta-row">
                                        {detail.rating > 0 && <RatingBar rating={detail.rating} count={detail.review_count || 0} />}
                                        {detail.price_level > 0 && <PriceStars level={detail.price_level} />}
                                        {detail.price_per_night > 0 && <span className="trip-airbnb-price-inline">{detail.price_per_night.toLocaleString()} {detail.currency} / {t('gece', 'night')}</span>}
                                    </div>

                                    {/* Airbnb specs */}
                                    {detail.bedrooms !== undefined && (
                                        <div className="trip-airbnb-detail-specs">
                                            <span className="trip-spec-item"><Bed size={15} /> {detail.bedrooms} {t('oda', 'bedrooms')}</span>
                                            <span className="trip-spec-item"><Users size={15} /> {detail.max_guests || '—'} {t('misafir', 'guests')}</span>
                                            <span className="trip-spec-item"><Bath size={15} /> {detail.bathrooms} {t('banyo', 'bath')}</span>
                                            {detail.beds > 0 && <span className="trip-spec-item"><Bed size={15} /> {detail.beds} {t('yatak', 'beds')}</span>}
                                        </div>
                                    )}

                                    {/* Amenities */}
                                    {detail.amenities?.length > 0 && (
                                        <div className="trip-airbnb-amenities">
                                            {detail.amenities.slice(0, 8).map((a, i) => <span key={i} className="trip-amenity-chip">{a}</span>)}
                                        </div>
                                    )}

                                    {/* Host */}
                                    {detail.host_name && (
                                        <div className="trip-airbnb-host">
                                            <div className="trip-host-avatar" style={{ backgroundImage: detail.host_avatar ? `url(${detail.host_avatar})` : 'none' }}>{!detail.host_avatar && <User size={16} />}</div>
                                            <div><strong>{detail.host_name}</strong>{detail.is_superhost && <span className="trip-superhost-badge">★ Superhost</span>}</div>
                                        </div>
                                    )}

                                    {/* Action pills */}
                                    <div className="trip-detail-actions">
                                        {detail.place_id && spots.some(s => s.place_id === detail.place_id) ? (
                                            <button className="trip-action-pill planned"><Check size={14} /> {t('Planlandı', 'Planned')}</button>
                                        ) : detail.place_id ? (
                                            <button className="trip-action-pill add" onClick={() => addSpot(detail)}><Plus size={14} /> {t('Plana ekle', 'Add to plan')}</button>
                                        ) : null}
                                    </div>

                                    {/* Contact info */}
                                    {(detail.phone || detail.website) && (
                                        <div className="trip-detail-contact">
                                            {detail.phone && (<div className="trip-contact-row"><Phone size={15} /><span>{detail.phone}</span></div>)}
                                            {detail.website && (<div className="trip-contact-row"><Globe size={15} /><span className="trip-website">{detail.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</span></div>)}
                                        </div>
                                    )}

                                    {/* Address */}
                                    {detail.address && (<div className="trip-detail-address-block"><MapPin size={15} /><span>{detail.address}</span></div>)}

                                    {/* Opening hours */}
                                    {detail.hours?.weekday_text?.length > 0 && (
                                        <div className="trip-detail-hours-block">
                                            <div className="trip-hours-header"><Clock size={15} /><span>{detail.hours.open_now ? <span className="trip-open-badge">{t('Açık', 'Open')}</span> : <span className="trip-closed-badge">{t('Kapalı', 'Closed')}</span>}</span></div>
                                            <div className="trip-hours-list">{detail.hours.weekday_text.map((day, i) => (<div key={i} className="trip-hours-row">{day}</div>))}</div>
                                        </div>
                                    )}

                                    {/* Editorial */}
                                    {detail.editorial_summary && (
                                        <div className="trip-detail-editorial"><p className="trip-editorial-text">{detail.editorial_summary}</p></div>
                                    )}

                                    {/* Reviews */}
                                    {detail.reviews?.length > 0 && (
                                        <div className="trip-detail-reviews-section">
                                            <h3 className="trip-reviews-title"><MessageCircle size={16} /> {t('Yorumlar', 'Reviews')} <span className="trip-review-count">{detail.reviews.length}</span></h3>
                                            {detail.reviews.slice(0, 5).map((review, i) => (
                                                <div key={i} className="trip-review-card">
                                                    <div className="trip-review-header">
                                                        <div className="trip-review-avatar" style={{ backgroundImage: review.avatar ? `url(${review.avatar})` : 'none' }}>{!review.avatar && <User size={14} />}</div>
                                                        <div className="trip-review-author">
                                                            <strong>{review.author}</strong>
                                                            <span className="trip-review-time">{review.time}</span>
                                                        </div>
                                                        <div className="trip-review-stars">
                                                            {[...Array(5)].map((_, j) => (<Star key={j} size={11} style={{ color: j < review.rating ? '#FBBF24' : '#E2E8F0', fill: j < review.rating ? '#FBBF24' : 'none' }} />))}
                                                        </div>
                                                    </div>
                                                    <p className="trip-review-text">{review.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ ADD SPOT MODAL ═══ */}
            <AnimatePresence>
                {showAddSpot && (
                    <motion.div className="trip-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddSpot(false)}>
                        <motion.div className="trip-modal-sheet trip-modal-full" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} onClick={e => e.stopPropagation()}>
                            <div className="trip-addspot-header"><button onClick={() => setShowAddSpot(false)}><X size={20} /></button><h2>{t('Mekan ekle', 'Add a spot')}</h2><div /></div>
                            <div className="trip-search-input" style={{ margin: '16px 20px' }}>
                                <Search size={18} /><input placeholder={t('Mekan ara...', 'Search places...')} value={spotSearch} onChange={e => searchSpots(e.target.value)} autoFocus />
                            </div>
                            <p className="trip-powered-by">Powered by Google Places</p>
                            <div className="trip-addspot-list">
                                {searchLoading && <div style={{ textAlign: 'center', padding: 20 }}><Loader2 size={24} className="spin" /></div>}
                                {(spotSearch.length > 1 ? spotSearchResults : popularSpots).map(place => {
                                    const isAdded = spots.some(s => s.place_id === place.place_id)
                                    return (
                                        <div key={place.place_id} className="trip-addspot-row">
                                            <div className="trip-addspot-thumb" style={{ backgroundImage: place.photo_url ? `url(${place.photo_url})` : 'none' }}>{!place.photo_url && <MapPin size={14} />}</div>
                                            <div className="trip-addspot-info">
                                                <span className="trip-addspot-category" style={{ color: CAT_COLORS[place.category] || '#64748B' }}>{place.category}</span>
                                                <span className="trip-addspot-name">{place.name}</span>
                                            </div>
                                            <button className={`trip-addspot-btn ${isAdded ? 'added' : ''}`} onClick={() => !isAdded && addSpot(place)} disabled={isAdded}>{isAdded ? <Check size={16} /> : <Plus size={16} />}</button>
                                        </div>
                                    )
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 1s linear infinite}`}</style>
        </>
    )
}

// ── Reusable placeholders ──
function LoadingPlaceholder({ text }) {
    return (<div className="trip-placeholder"><Loader2 size={28} className="spin" style={{ color: '#0D9488' }} /><p>{text}</p></div>)
}
function EmptyPlaceholder({ icon, text }) {
    return (<div className="trip-placeholder">{icon}<p>{text}</p></div>)
}
