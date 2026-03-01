'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useSpace } from '@/context/SpaceContext'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import TripChat from '@/components/chat/TripChat'
import ExpenseTracker from '@/components/expenses/ExpenseTracker'
import DayPlanner from '@/components/itinerary/DayPlanner'
import {
    ArrowLeft, MoreHorizontal, Calendar, Minus, Plus, FileText, MapPin,
    ChevronRight, X, Compass, Check, Search, Star, Bed, Clock, Loader2,
    Navigation, Plane, Car, Hotel, Phone, Globe, ChevronDown, ChevronUp,
    MessageCircle, User, Home, Users, Bath, Wifi, Wind, Waves, Ticket,
    UtensilsCrossed, DollarSign, ListChecks, Backpack, Languages, Shield,
    Upload, Camera, Copy, MapPinned, Tent, Sparkles, Wallet, Smartphone,
    Scale, Moon, Zap, Heart, Coffee, Music, Palette, ShoppingBag, Gamepad2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import 'mapbox-gl/dist/mapbox-gl.css'

const CAT_COLORS = {
    'MUSEUMS': '#D4A853', 'SIGHTS & LANDMARKS': '#0D9488', 'RELIGIOUS SITES': '#D97706',
    'RESTAURANTS': '#DC2626', 'CAFES': '#92400E', 'NATURE & PARKS': '#16A34A',
    'SHOPPING': '#DB2777', 'NIGHTLIFE': '#D4A853', 'ART & CULTURE': '#0F2847',
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
    const [restaurants, setRestaurants] = useState([])
    const [restaurantsLoading, setRestaurantsLoading] = useState(false)
    const [restCategory, setRestCategory] = useState('all')
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
    useEffect(() => { if (id) loadTrip() }, [id])

    const loadTrip = async () => {
        setLoading(true)
        // Load trip by ID only — don't require active space match
        const { data: tripData } = await supabase.from('trips').select('*').eq('id', id).single()
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
        if (serviceTab === 'restaurants' && restaurants.length === 0) fetchRestaurants()
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

    const fetchRestaurants = async (cat) => {
        setRestaurantsLoading(true)
        try {
            const c = cat || restCategory
            const res = await fetch(`/api/restaurants?city=${encodeURIComponent(trip.city)}&category=${c}`)
            const data = await res.json()
            if (data.restaurants) setRestaurants(data.restaurants)
        } catch { }
        setRestaurantsLoading(false)
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
                            <img src="/umae-icon.png?v=3" alt="UMAE" style={{ width: 28, height: 28, borderRadius: 8, marginBottom: 4, opacity: 0.9 }} />
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
                                            { key: 'restaurants', icon: <UtensilsCrossed size={15} />, label: t('Restoranlar', 'Restaurants') },
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

                                    {/* ── RESTAURANTS ── */}
                                    {serviceTab === 'restaurants' && (
                                        <section className="trip-section">
                                            <h2 className="trip-section-title">{t(`${trip.city} Restoranları`, `Restaurants in ${trip.city}`)}</h2>
                                            <div className="trip-rest-cats">
                                                {[{ k: 'all', e: '🍽️', l: 'Tümü' }, { k: 'kebab', e: '🥩', l: 'Kebap' }, { k: 'fish', e: '🐟', l: 'Balık' }, { k: 'cafe', e: '☕', l: 'Kafe' }, { k: 'breakfast', e: '🥐', l: 'Kahvaltı' }, { k: 'fine_dining', e: '✨', l: 'Fine Dining' }, { k: 'street', e: '🌯', l: 'Sokak' }, { k: 'dessert', e: '🍰', l: 'Tatlı' }].map(c =>
                                                    <button key={c.k} className={`trip-rest-cat ${restCategory === c.k ? 'active' : ''}`} onClick={() => { setRestCategory(c.k); setRestaurants([]); fetchRestaurants(c.k) }}>{c.e} {c.l}</button>
                                                )}
                                            </div>
                                            {restaurantsLoading ? <LoadingPlaceholder text={t('Restoranlar aranıyor...', 'Searching restaurants...')} /> : restaurants.length === 0 ? <EmptyPlaceholder icon={<UtensilsCrossed size={36} />} text={t('Restoran bulunamadı', 'No restaurants found')} /> : (
                                                <div className="trip-hotel-grid">
                                                    {restaurants.map(r => (
                                                        <div key={r.place_id} className="trip-hotel-card" onClick={() => openDetail(r)}>
                                                            <div className="trip-hotel-image" style={{ backgroundImage: r.photo_url ? `url(${r.photo_url})` : 'none' }}>
                                                                <div className="trip-hotel-badge">{r.category_emoji} {r.category_name}</div>
                                                                <div className="trip-hotel-price">{r.price_text}</div>
                                                            </div>
                                                            <div className="trip-hotel-info">
                                                                <h3 className="trip-hotel-name">{r.name}</h3>
                                                                {r.rating > 0 && <RatingBar rating={r.rating} count={r.review_count} />}
                                                                <p className="trip-hotel-address"><MapPin size={11} /> {r.address?.split(',').slice(0, 2).join(',')}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </section>
                                    )}
                                </motion.div>
                            )}
                            {activeTab === 'itinerary' && (
                                <motion.div key="itinerary" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                                    <DayPlanner tripId={id} spaceId={space?.id} startDate={trip?.start_date} endDate={trip?.end_date} locale={locale} spots={spots} />
                                </motion.div>
                            )}
                            {activeTab === 'chat' && (
                                <motion.div key="chat" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} style={{ minHeight: '400px' }}>
                                    <TripChat tripId={id} spaceId={space?.id} locale={locale} />
                                </motion.div>
                            )}
                            {activeTab === 'expenses' && (
                                <motion.div key="expenses" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                                    <ExpenseTracker tripId={id} spaceId={space?.id} locale={locale} />
                                </motion.div>
                            )}

                            {/* ═══ PACKING LIST TAB ═══ */}
                            {activeTab === 'packing' && (
                                <motion.div key="packing" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                                    <PackingListTab city={trip?.city} startDate={trip?.start_date} endDate={trip?.end_date} locale={locale} />
                                </motion.div>
                            )}

                            {/* ═══ PHRASEBOOK TAB ═══ */}
                            {activeTab === 'phrases' && (
                                <motion.div key="phrases" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                                    <PhrasebookTab city={trip?.city} locale={locale} />
                                </motion.div>
                            )}

                            {/* ═══ EMERGENCY TAB ═══ */}
                            {activeTab === 'emergency' && (
                                <motion.div key="emergency" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                                    <EmergencyTab city={trip?.city} locale={locale} />
                                </motion.div>
                            )}

                            {/* ═══ PHOTO SPOTS TAB ═══ */}
                            {activeTab === 'photospots' && (
                                <motion.div key="photospots" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                                    <PhotoSpotsTab city={trip?.city} locale={locale} />
                                </motion.div>
                            )}

                            {/* ═══ MENU TRANSLATOR TAB ═══ */}
                            {activeTab === 'menu' && (
                                <motion.div key="menu" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                                    <MenuTranslatorTab locale={locale} />
                                </motion.div>
                            )}

                            {/* ═══ DAY TRIP TAB ═══ */}
                            {activeTab === 'daytrip' && (
                                <motion.div key="daytrip" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                                    <DayTripTab city={trip?.city} locale={locale} />
                                </motion.div>
                            )}

                            {/* ═══ FUN ACTIVITIES TAB ═══ */}
                            {activeTab === 'fun' && (
                                <motion.div key="fun" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                                    <FunActivitiesTab city={trip?.city} locale={locale} />
                                </motion.div>
                            )}

                            {/* ═══ BUDGET TIPS TAB ═══ */}
                            {activeTab === 'budget' && (
                                <motion.div key="budget" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                                    <BudgetTipsTab city={trip?.city} locale={locale} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ═══ FLOATING TABS ═══ */}
                    <div className="trip-floating-tabs" style={{ flexWrap: 'wrap', gap: 4 }}>
                        <button className={`trip-tab ${activeTab === 'plan' ? 'active' : ''}`} onClick={() => setActiveTab('plan')}><MapPin size={15} /> {t('Plan', 'Plan')}</button>
                        <button className={`trip-tab ${activeTab === 'discover' ? 'active' : ''}`} onClick={() => setActiveTab('discover')}><Compass size={15} /> {t('Keşfet', 'Discover')}</button>
                        <button className={`trip-tab ${activeTab === 'itinerary' ? 'active' : ''}`} onClick={() => setActiveTab('itinerary')}><ListChecks size={15} /> {t('Program', 'Schedule')}</button>
                        <button className={`trip-tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}><MessageCircle size={15} /> {t('Sohbet', 'Chat')}</button>
                        <button className={`trip-tab ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}><DollarSign size={15} /> {t('Masraf', 'Expenses')}</button>
                        <button className={`trip-tab ${activeTab === 'packing' ? 'active' : ''}`} onClick={() => setActiveTab('packing')}>🎒 {t('Bavul', 'Pack')}</button>
                        <button className={`trip-tab ${activeTab === 'phrases' ? 'active' : ''}`} onClick={() => setActiveTab('phrases')}>🗣️ {t('Cümleler', 'Phrases')}</button>
                        <button className={`trip-tab ${activeTab === 'emergency' ? 'active' : ''}`} onClick={() => setActiveTab('emergency')}>📖 {t('Rehber', 'Guide')}</button>
                        <button className={`trip-tab ${activeTab === 'photospots' ? 'active' : ''}`} onClick={() => setActiveTab('photospots')}>📸 {t('Spot', 'Spots')}</button>
                        <button className={`trip-tab ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>🍽️ {t('Menü', 'Menu')}</button>
                        <button className={`trip-tab ${activeTab === 'daytrip' ? 'active' : ''}`} onClick={() => setActiveTab('daytrip')}>🏕️ {t('Günübirlik', 'Day Trip')}</button>
                        <button className={`trip-tab ${activeTab === 'fun' ? 'active' : ''}`} onClick={() => setActiveTab('fun')}>🎉 {t('Eğlence', 'Fun')}</button>
                        <button className={`trip-tab ${activeTab === 'budget' ? 'active' : ''}`} onClick={() => setActiveTab('budget')}>💰 {t('Bütçe', 'Budget')}</button>
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

// ══════════════════════════════════════════════════
//  PACKING LIST TAB
// ══════════════════════════════════════════════════
function PackingListTab({ city, startDate, endDate, locale }) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [checked, setChecked] = useState({})
    const [expandedCat, setExpandedCat] = useState(null)

    const days = startDate && endDate ? Math.ceil((new Date(endDate) - new Date(startDate)) / 864e5) + 1 : 3

    const generate = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/ai/packing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ city, days, locale }) })
            const d = await res.json()
            if (d.categories) setData(d)
        } catch { }
        setLoading(false)
    }

    useEffect(() => { if (city && !data) generate() }, [city])

    const toggle = (catIdx, itemIdx) => {
        const key = `${catIdx}-${itemIdx}`
        setChecked(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const totalItems = data?.categories?.reduce((s, c) => s + c.items.length, 0) || 0
    const checkedCount = Object.values(checked).filter(Boolean).length

    if (loading) return <LoadingPlaceholder text={locale === 'tr' ? 'AI bavul listesi oluşturuyor...' : 'Generating packing list...'} />

    if (!data) return (
        <div className="trip-placeholder">
            <span style={{ fontSize: '3rem' }}>🎒</span>
            <p>{locale === 'tr' ? 'Bavul listesi henüz oluşturulmadı' : 'No packing list generated yet'}</p>
            <button className="btn btn-primary btn-sm" onClick={generate}>{locale === 'tr' ? 'Oluştur' : 'Generate'}</button>
        </div>
    )

    return (
        <div className="tool-tab">
            <div className="tool-header">
                <h3>🎒 {locale === 'tr' ? 'Bavul Listesi' : 'Packing List'}</h3>
                <span className="tool-badge">{checkedCount}/{totalItems}</span>
            </div>
            {/* Progress bar */}
            <div className="tool-progress"><div className="tool-progress-fill" style={{ width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%` }} /></div>
            {/* Weather tips */}
            {data.weatherTips?.length > 0 && (
                <div className="tool-tips">{data.weatherTips.map((tip, i) => <div key={i} className="tool-tip">🌤️ {tip}</div>)}</div>
            )}
            {/* Categories */}
            {data.categories?.map((cat, ci) => (
                <div key={ci} className="tool-category">
                    <button className="tool-cat-header" onClick={() => setExpandedCat(expandedCat === ci ? null : ci)}>
                        <span>{cat.emoji} {cat.name}</span>
                        <span className="tool-cat-count">{cat.items?.length || 0}</span>
                    </button>
                    <AnimatePresence>
                        {(expandedCat === ci || expandedCat === null) && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                {cat.items?.map((item, ii) => (
                                    <div key={ii} className={`tool-check-item ${checked[`${ci}-${ii}`] ? 'checked' : ''}`} onClick={() => toggle(ci, ii)}>
                                        <div className={`tool-checkbox ${checked[`${ci}-${ii}`] ? 'active' : ''}`}>{checked[`${ci}-${ii}`] && <Check size={12} />}</div>
                                        <span className="tool-item-emoji">{item.emoji}</span>
                                        <span className="tool-item-name">{item.name}</span>
                                        {item.quantity > 1 && <span className="tool-item-qty">×{item.quantity}</span>}
                                        <span className={`tool-priority ${item.priority}`}>{item.priority === 'must' ? '❗' : item.priority === 'nice' ? '👍' : '💭'}</span>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
            {data.localTips?.length > 0 && (
                <div className="tool-tips" style={{ marginTop: 12 }}>{data.localTips.map((tip, i) => <div key={i} className="tool-tip">💡 {tip}</div>)}</div>
            )}
        </div>
    )
}

// ══════════════════════════════════════════════════
//  PHRASEBOOK TAB
// ══════════════════════════════════════════════════
function PhrasebookTab({ city, locale }) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [expandedCat, setExpandedCat] = useState(0)
    const [copied, setCopied] = useState(null)

    const generate = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/ai/phrases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ city, locale }) })
            const d = await res.json()
            if (d.categories) setData(d)
        } catch { }
        setLoading(false)
    }

    useEffect(() => { if (city && !data) generate() }, [city])

    const copyPhrase = (text, idx) => {
        navigator.clipboard?.writeText(text)
        setCopied(idx)
        setTimeout(() => setCopied(null), 1500)
    }

    if (loading) return <LoadingPlaceholder text={locale === 'tr' ? 'Cümle defteri hazırlanıyor...' : 'Generating phrasebook...'} />
    if (!data) return (
        <div className="trip-placeholder"><span style={{ fontSize: '3rem' }}>🗣️</span><p>{locale === 'tr' ? 'Cümle defteri hazır değil' : 'Phrasebook not ready'}</p><button className="btn btn-primary btn-sm" onClick={generate}>{locale === 'tr' ? 'Oluştur' : 'Generate'}</button></div>
    )

    return (
        <div className="tool-tab">
            <div className="tool-header">
                <h3>🗣️ {locale === 'tr' ? 'Cümle Defteri' : 'Phrasebook'}</h3>
                <span className="tool-badge">{data.localLanguage} ({data.localLanguageNative})</span>
            </div>
            {/* Cultural notes */}
            {data.culturalNotes?.length > 0 && (
                <div className="tool-tips">{data.culturalNotes.map((n, i) => <div key={i} className="tool-tip">🌏 {n}</div>)}</div>
            )}
            {/* Emergency phrases at top */}
            {data.emergencyPhrases?.length > 0 && (
                <div className="phrase-emergency">
                    <h4>🆘 {locale === 'tr' ? 'Acil Cümleler' : 'Emergency Phrases'}</h4>
                    {data.emergencyPhrases.map((p, i) => (
                        <div key={i} className="phrase-card emergency" onClick={() => copyPhrase(p.translated, `e${i}`)}>
                            <div className="phrase-original">{p.original}</div>
                            <div className="phrase-translated">{p.translated}</div>
                            <div className="phrase-pronunciation">🔊 {p.pronunciation}</div>
                            {copied === `e${i}` && <span className="phrase-copied">✅</span>}
                        </div>
                    ))}
                </div>
            )}
            {/* Categories */}
            {data.categories?.map((cat, ci) => (
                <div key={ci} className="tool-category">
                    <button className="tool-cat-header" onClick={() => setExpandedCat(expandedCat === ci ? null : ci)}>
                        <span>{cat.emoji} {cat.name}</span>
                        <span className="tool-cat-count">{cat.phrases?.length || 0}</span>
                    </button>
                    <AnimatePresence>
                        {expandedCat === ci && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                {cat.phrases?.map((p, pi) => (
                                    <div key={pi} className="phrase-card" onClick={() => copyPhrase(p.translated, `${ci}-${pi}`)}>
                                        <div className="phrase-original">{p.original}</div>
                                        <div className="phrase-translated">{p.translated}</div>
                                        <div className="phrase-pronunciation">🔊 {p.pronunciation}</div>
                                        {p.context && <div className="phrase-context">💡 {p.context}</div>}
                                        {copied === `${ci}-${pi}` && <span className="phrase-copied">✅</span>}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
        </div>
    )
}

// ══════════════════════════════════════════════════
//  EMERGENCY TAB
// ══════════════════════════════════════════════════
function EmergencyTab({ city, locale }) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [activeCat, setActiveCat] = useState('safety')
    const t = (tr, en) => locale === 'tr' ? tr : en

    const generate = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/emergency', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ city, locale }) })
            const d = await res.json()
            if (!d.error) setData(d)
        } catch { }
        setLoading(false)
    }

    useEffect(() => { if (city && !data) generate() }, [city])

    if (loading) return <LoadingPlaceholder text={t('Seyahat rehberi hazırlanıyor...', 'Preparing travel guide...')} />
    if (!data) return (
        <div className="trip-placeholder"><span style={{ fontSize: '3rem' }}>📖</span><p>{t('Rehber yüklenmedi', 'Guide not loaded')}</p><button className="btn btn-primary btn-sm" onClick={generate}>{t('Yükle', 'Load')}</button></div>
    )

    const CATS = [
        { id: 'safety', emoji: '🛡️', label: t('Güvenlik', 'Safety'), photo: '/guide-photos/safety.png', color: '#EF4444' },
        { id: 'daily', emoji: '🏪', label: t('Günlük', 'Daily'), photo: '/guide-photos/daily.png', color: '#F59E0B' },
        { id: 'transport', emoji: '🚇', label: t('Ulaşım', 'Transport'), photo: '/guide-photos/transport.png', color: '#3B82F6' },
        { id: 'money', emoji: '💰', label: t('Para', 'Money'), photo: '/guide-photos/money.png', color: '#10B981' },
        { id: 'food', emoji: '🍽️', label: t('Yemek', 'Food'), photo: '/guide-photos/food.png', color: '#F97316' },
        { id: 'culture', emoji: '🕌', label: t('Kültür', 'Culture'), photo: '/guide-photos/culture.png', color: '#8B5CF6' },
        { id: 'health', emoji: '💊', label: t('Sağlık', 'Health'), photo: '/guide-photos/health.png', color: '#06B6D4' },
        { id: 'digital', emoji: '📱', label: t('Dijital', 'Digital'), photo: '/guide-photos/digital.png', color: '#EC4899' },
    ]
    const active = CATS.find(c => c.id === activeCat) || CATS[0]

    const InfoRow = ({ emoji, label, value }) => value ? <div style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.8rem' }}><span>{emoji}</span><div style={{ flex: 1 }}><span style={{ fontWeight: 600 }}>{label}</span><div style={{ color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>{value}</div></div></div> : null
    const TipsList = ({ tips }) => tips?.length > 0 ? <div style={{ marginTop: 12 }}>{tips.map((tip, i) => <div key={i} style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.06)', marginBottom: 4, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>💡 {tip}</div>)}</div> : null

    return (
        <div className="tool-tab">
            {/* Category Photo Header */}
            <div style={{ position: 'relative', height: 120, borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${active.photo})`, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'background-image 0.3s' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 100%)' }} />
                <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end', padding: '14px 16px' }}>
                    <div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>📖 {t('Seyahat Rehberi', 'Travel Guide')}</div>
                        <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>{active.emoji} {active.label}</h3>
                    </div>
                </div>
            </div>

            {/* Category Tabs */}
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 10, marginBottom: 12 }}>
                {CATS.map(cat => (
                    <button key={cat.id} onClick={() => setActiveCat(cat.id)}
                        style={{ padding: '6px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: activeCat === cat.id ? active.color : 'var(--bg-tertiary)', color: activeCat === cat.id ? '#fff' : 'var(--text-secondary)', fontWeight: 700, fontSize: '0.72rem', transition: 'all 0.2s' }}>
                        {cat.emoji} {cat.label}
                    </button>
                ))}
            </div>

            {/* ═══ SAFETY ═══ */}
            {activeCat === 'safety' && data.safety && (
                <motion.div key="safety" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Emergency Numbers - Always visible */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 }}>
                        {data.safety.emergencyNumbers?.map((num, i) => (
                            <a key={i} href={`tel:${num.number}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(239,68,68,0.06)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.15)', textDecoration: 'none', color: 'inherit' }}>
                                <span style={{ fontSize: '1.2rem' }}>{num.emoji}</span>
                                <div><div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{num.service}</div><div style={{ color: '#EF4444', fontWeight: 800, fontSize: '0.9rem' }}>{num.number}</div></div>
                            </a>
                        ))}
                    </div>
                    {/* Embassy */}
                    {data.safety.embassy && (
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid var(--border)' }}>
                            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0 0 8px' }}>🏛️ {data.safety.embassy.name}</h4>
                            <InfoRow emoji="📍" label={t('Adres', 'Address')} value={data.safety.embassy.address} />
                            <InfoRow emoji="📞" label={t('Telefon', 'Phone')} value={data.safety.embassy.phone} />
                            {data.safety.embassy.googleMapsUrl && <a href={data.safety.embassy.googleMapsUrl} target="_blank" rel="noopener" style={{ display: 'inline-block', marginTop: 6, padding: '4px 10px', borderRadius: 8, background: 'rgba(59,130,246,0.08)', color: '#3B82F6', fontSize: '0.72rem', fontWeight: 600, textDecoration: 'none' }}>🗺️ {t('Haritada Aç', 'Open Map')}</a>}
                        </div>
                    )}
                    {/* Hospitals */}
                    {data.safety.hospitals?.map((h, i) => (
                        <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: '10px 14px', marginBottom: 6, border: '1px solid var(--border)' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>🏥 {h.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>📍 {h.address}</div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                                {h.phone && <a href={`tel:${h.phone}`} style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.08)', color: '#10B981', fontSize: '0.68rem', fontWeight: 600, textDecoration: 'none' }}>📞 {h.phone}</a>}
                                {h.hasER && <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: '0.68rem', fontWeight: 600 }}>🚨 ER</span>}
                            </div>
                        </div>
                    ))}
                    {/* Safe/Caution areas */}
                    {data.safety.safeAreas?.map((a, i) => <div key={`s${i}`} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.05)', marginBottom: 3, fontSize: '0.78rem', border: '1px solid rgba(16,185,129,0.12)' }}>✅ <strong>{a.name}</strong> — {a.description}</div>)}
                    {data.safety.cautionAreas?.map((a, i) => <div key={`c${i}`} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.05)', marginBottom: 3, fontSize: '0.78rem', border: '1px solid rgba(245,158,11,0.12)' }}>⚠️ <strong>{a.name}</strong> — {a.description}</div>)}
                    {/* Scams */}
                    {data.safety.scamWarnings?.length > 0 && <div style={{ marginTop: 10 }}><h4 style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0 0 6px' }}>🚨 {t('Dolandırıcılık Uyarıları', 'Scam Warnings')}</h4>{data.safety.scamWarnings.map((s, i) => <div key={i} style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.04)', marginBottom: 4, fontSize: '0.78rem', border: '1px solid rgba(239,68,68,0.1)' }}>{s.emoji} <strong>{s.type}</strong> — {s.description}</div>)}</div>}
                    {/* Night Safety */}
                    {data.safety.nightSafety && <div style={{ marginTop: 10, background: 'var(--bg-secondary)', borderRadius: 14, padding: 14, border: '1px solid var(--border)' }}><h4 style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0 0 6px' }}>🌙 {t('Gece Güvenliği', 'Night Safety')}</h4><InfoRow emoji="🔒" label={t('Genel Seviye', 'Level')} value={data.safety.nightSafety.generalLevel} />{data.safety.nightSafety.safeNeighborhoods?.length > 0 && <InfoRow emoji="✅" label={t('Güvenli Bölgeler', 'Safe Areas')} value={data.safety.nightSafety.safeNeighborhoods.join(', ')} />}<InfoRow emoji="🚇" label={t('Gece Ulaşım', 'Late Transport')} value={data.safety.nightSafety.lateNightTransport} /><TipsList tips={data.safety.nightSafety.tips} /></div>}
                </motion.div>
            )}

            {/* ═══ DAILY ═══ */}
            {activeCat === 'daily' && data.dailyEssentials && (
                <motion.div key="daily" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <InfoRow emoji="🕐" label={t('Çalışma Saatleri', 'Working Hours')} value={data.dailyEssentials.workingHours} />
                    <InfoRow emoji="📅" label={t('Hafta Sonu', 'Weekend')} value={data.dailyEssentials.weekendHours} />
                    <InfoRow emoji="🛒" label={t('Marketler', 'Supermarkets')} value={data.dailyEssentials.supermarkets} />
                    <InfoRow emoji="💊" label={t('Eczane', 'Pharmacy')} value={data.dailyEssentials.pharmacy} />
                    <InfoRow emoji="🚻" label={t('Umumi Tuvalet', 'Public Toilets')} value={data.dailyEssentials.publicToilets} />
                    <InfoRow emoji="🔌" label={t('Elektrik', 'Electricity')} value={data.dailyEssentials.electricity} />
                    <InfoRow emoji="💧" label={t('Su Güvenliği', 'Water Safety')} value={data.dailyEssentials.waterSafety} />
                    <InfoRow emoji="👕" label={t('Çamaşır', 'Laundry')} value={data.dailyEssentials.laundry} />
                    <InfoRow emoji="📄" label={t('Pasaport Kaybı', 'Lost Passport')} value={data.dailyEssentials.lostPassport} />
                    <TipsList tips={data.dailyEssentials.tips} />
                </motion.div>
            )}

            {/* ═══ TRANSPORT ═══ */}
            {activeCat === 'transport' && data.transport && (
                <motion.div key="transport" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <InfoRow emoji="💳" label={t('Şehir Kartı', 'City Card')} value={data.transport.cityCard} />
                    <InfoRow emoji="🚇" label="Metro" value={data.transport.metro} />
                    <InfoRow emoji="🚌" label={t('Otobüs', 'Bus')} value={data.transport.bus} />
                    {data.transport.tram && <InfoRow emoji="🚊" label="Tramvay" value={data.transport.tram} />}
                    <InfoRow emoji="🚕" label="Taksi" value={data.transport.taxi} />
                    {data.transport.ferry && <InfoRow emoji="⛴️" label={t('Vapur', 'Ferry')} value={data.transport.ferry} />}
                    <InfoRow emoji="🚲" label={t('Bisiklet', 'Bike')} value={data.transport.bikeRental} />
                    <InfoRow emoji="✈️" label={t('Havalimanı', 'Airport')} value={data.transport.airportTransfer} />
                    <InfoRow emoji="🚗" label={t('Araç Kiralama', 'Car Rental')} value={data.transport.carRental} />
                    <TipsList tips={data.transport.tips} />
                </motion.div>
            )}

            {/* ═══ MONEY ═══ */}
            {activeCat === 'money' && data.moneyAndShopping && (
                <motion.div key="money" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <InfoRow emoji="💵" label={t('Para Birimi', 'Currency')} value={data.moneyAndShopping.currency} />
                    <InfoRow emoji="🏧" label="ATM" value={data.moneyAndShopping.atm} />
                    <InfoRow emoji="💳" label={t('Kart Kabul', 'Cards')} value={data.moneyAndShopping.cardAcceptance} />
                    <InfoRow emoji="🔄" label={t('Döviz', 'Exchange')} value={data.moneyAndShopping.exchange} />
                    {data.moneyAndShopping.tipping && (
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: 14, marginTop: 10, border: '1px solid var(--border)' }}>
                            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0 0 8px' }}>💰 {t('Bahşiş Kültürü', 'Tipping')}</h4>
                            <InfoRow emoji="🍽️" label={t('Restoran', 'Restaurant')} value={data.moneyAndShopping.tipping.restaurants} />
                            <InfoRow emoji="☕" label={t('Kafe', 'Cafe')} value={data.moneyAndShopping.tipping.cafes} />
                            <InfoRow emoji="🚕" label="Taksi" value={data.moneyAndShopping.tipping.taxis} />
                            <InfoRow emoji="🏨" label={t('Otel', 'Hotel')} value={data.moneyAndShopping.tipping.hotels} />
                            <InfoRow emoji="💇" label={t('Kuaför', 'Hairdresser')} value={data.moneyAndShopping.tipping.hairdresser} />
                        </div>
                    )}
                    <InfoRow emoji="🤝" label={t('Pazarlık', 'Bargaining')} value={data.moneyAndShopping.bargaining} />
                    <InfoRow emoji="🧾" label={t('Vergi İadesi', 'Tax Refund')} value={data.moneyAndShopping.taxRefund} />
                    <InfoRow emoji="🕐" label={t('Alışveriş Saatleri', 'Shopping Hours')} value={data.moneyAndShopping.shoppingHours} />
                    <TipsList tips={data.moneyAndShopping.tips} />
                </motion.div>
            )}

            {/* ═══ FOOD ═══ */}
            {activeCat === 'food' && data.foodAndDrink && (
                <motion.div key="food" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <InfoRow emoji="🕐" label={t('Yemek Saatleri', 'Meal Times')} value={data.foodAndDrink.mealTimes} />
                    <InfoRow emoji="📋" label={t('Restoran Adabı', 'Etiquette')} value={data.foodAndDrink.restaurantEtiquette} />
                    <InfoRow emoji="🌯" label={t('Sokak Yemeği', 'Street Food')} value={data.foodAndDrink.streetFoodSafety} />
                    <InfoRow emoji="💧" label={t('Su', 'Water')} value={data.foodAndDrink.waterAdvice} />
                    <InfoRow emoji="🍺" label={t('Alkol', 'Alcohol')} value={data.foodAndDrink.alcoholRules} />
                    <InfoRow emoji="🥬" label={t('Vejetaryen', 'Vegetarian')} value={data.foodAndDrink.vegetarianOptions} />
                    <InfoRow emoji="☕" label={t('Kahve Kültürü', 'Coffee Culture')} value={data.foodAndDrink.coffeeCulture} />
                    <InfoRow emoji="📞" label={t('Rezervasyon', 'Reservations')} value={data.foodAndDrink.reservations} />
                    {data.foodAndDrink.localSpecialties?.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0 0 6px' }}>🌟 {t('Mutlaka Dene', 'Must Try')}</h4>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {data.foodAndDrink.localSpecialties.map((s, i) => <span key={i} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(249,115,22,0.08)', color: '#EA580C', fontSize: '0.72rem', fontWeight: 600 }}>🍴 {s}</span>)}
                            </div>
                        </div>
                    )}
                    <TipsList tips={data.foodAndDrink.tips} />
                </motion.div>
            )}

            {/* ═══ CULTURE ═══ */}
            {activeCat === 'culture' && data.cultureAndEtiquette && (
                <motion.div key="culture" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <InfoRow emoji="🤝" label={t('Selamlaşma', 'Greetings')} value={data.cultureAndEtiquette.greetings} />
                    <InfoRow emoji="👔" label={t('Giyim', 'Dress Code')} value={data.cultureAndEtiquette.dressCode} />
                    <InfoRow emoji="🕌" label={t('Cami Adabı', 'Mosque Etiquette')} value={data.cultureAndEtiquette.mosqueEtiquette} />
                    <InfoRow emoji="📸" label={t('Fotoğraf', 'Photography')} value={data.cultureAndEtiquette.photographyRules} />
                    <InfoRow emoji="🎁" label={t('Hediye', 'Gifts')} value={data.cultureAndEtiquette.giftCulture} />
                    <InfoRow emoji="👋" label={t('Beden Dili', 'Body Language')} value={data.cultureAndEtiquette.bodyLanguage} />
                    <InfoRow emoji="🚶" label={t('Sıra Kültürü', 'Queuing')} value={data.cultureAndEtiquette.queuing} />
                    <InfoRow emoji="🔊" label={t('Gürültü', 'Noise')} value={data.cultureAndEtiquette.noiseLevels} />
                    {data.cultureAndEtiquette.localTaboos?.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0 0 6px' }}>🚫 {t('Yapma!', "Don't!")}</h4>
                            {data.cultureAndEtiquette.localTaboos.map((tab, i) => <div key={i} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.04)', marginBottom: 3, fontSize: '0.78rem', border: '1px solid rgba(239,68,68,0.1)' }}>❌ {tab}</div>)}
                        </div>
                    )}
                    <TipsList tips={data.cultureAndEtiquette.tips} />
                </motion.div>
            )}

            {/* ═══ HEALTH ═══ */}
            {activeCat === 'health' && data.health && (
                <motion.div key="health" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <InfoRow emoji="💊" label={t('Eczane Saatleri', 'Pharmacy Hours')} value={data.health.pharmacyHours} />
                    <InfoRow emoji="🌙" label={t('Nöbetçi Eczane', 'Duty Pharmacy')} value={data.health.dutyPharmacy} />
                    <InfoRow emoji="💧" label={t('Su Güvenliği', 'Water Safety')} value={data.health.waterSafety} />
                    <InfoRow emoji="💉" label={t('Yaygın İlaçlar', 'Common Meds')} value={data.health.commonMeds} />
                    <InfoRow emoji="🛡️" label={t('Sigorta', 'Insurance')} value={data.health.insurance} />
                    <InfoRow emoji="💉" label={t('Aşılar', 'Vaccines')} value={Array.isArray(data.health.vaccines) ? data.health.vaccines.join(', ') : data.health.vaccines} />
                    <InfoRow emoji="☀️" label={t('Güneş Koruması', 'Sun Protection')} value={data.health.sunProtection} />
                    {/* Seasonal Health */}
                    {data.health.seasonalHealth?.map((s, i) => <div key={i} style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(6,182,212,0.05)', marginTop: 6, fontSize: '0.78rem', border: '1px solid rgba(6,182,212,0.12)' }}>{s.emoji} <strong>{s.season}</strong> — {s.warning}</div>)}
                    {/* Emergency Phrases */}
                    {data.health.emergencyPhrases?.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0 0 6px' }}>🗣️ {t('Acil Cümleler', 'Emergency Phrases')}</h4>
                            {data.health.emergencyPhrases.map((p, i) => (
                                <div key={i} onClick={() => navigator.clipboard?.writeText(p.local)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(6,182,212,0.04)', borderRadius: 10, marginBottom: 4, border: '1px solid rgba(6,182,212,0.12)', cursor: 'pointer' }}>
                                    <div><div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.phrase}</div><div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0891B2' }}>{p.local}</div><div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>🔊 {p.pronunciation}</div></div>
                                    <Copy size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                </div>
                            ))}
                        </div>
                    )}
                    <TipsList tips={data.health.tips} />
                </motion.div>
            )}

            {/* ═══ DIGITAL ═══ */}
            {activeCat === 'digital' && data.digital && (
                <motion.div key="digital" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {data.digital.simCard && (
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: 14, marginBottom: 10, border: '1px solid var(--border)' }}>
                            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0 0 8px' }}>📡 SIM Kart</h4>
                            <InfoRow emoji="📶" label={t('Operatörler', 'Providers')} value={data.digital.simCard.providers?.join(', ')} />
                            <InfoRow emoji="📦" label={t('Turist Paketi', 'Tourist Package')} value={data.digital.simCard.touristPackage} />
                            <InfoRow emoji="📋" label={t('Kayıt', 'Registration')} value={data.digital.simCard.registration} />
                        </div>
                    )}
                    <InfoRow emoji="📶" label="WiFi" value={data.digital.wifi} />
                    <InfoRow emoji="🔒" label="VPN" value={data.digital.vpn} />
                    <InfoRow emoji="🔋" label={t('Şarj Noktaları', 'Charging')} value={data.digital.chargingSpots} />
                    <InfoRow emoji="🆘" label={t('Acil Uygulamalar', 'Emergency Apps')} value={data.digital.emergencyApps} />
                    <InfoRow emoji="💬" label={t('Sosyal Medya', 'Social Media')} value={data.digital.socialMedia} />
                    {data.digital.usefulApps?.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, margin: '0 0 6px' }}>📱 {t('Faydalı Uygulamalar', 'Useful Apps')}</h4>
                            {data.digital.usefulApps.map((app, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 10, marginBottom: 4, border: '1px solid var(--border)' }}>
                                    <span style={{ fontSize: '1.2rem' }}>{app.emoji}</span>
                                    <div><div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{app.name}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{app.description}</div></div>
                                </div>
                            ))}
                        </div>
                    )}
                    <TipsList tips={data.digital.tips} />
                </motion.div>
            )}
        </div>
    )
}



// ══════════════════════════════════════════════════
//  PHOTO SPOTS TAB
// ══════════════════════════════════════════════════
function PhotoSpotsTab({ city, locale }) {
    const [spots, setSpots] = useState([])
    const [loading, setLoading] = useState(false)

    const load = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/photospots?city=${encodeURIComponent(city)}`)
            const d = await res.json()
            if (d.spots) setSpots(d.spots)
        } catch { }
        setLoading(false)
    }

    useEffect(() => { if (city && spots.length === 0) load() }, [city])

    if (loading) return <LoadingPlaceholder text={locale === 'tr' ? 'Fotoğraf noktaları aranıyor...' : 'Searching photo spots...'} />
    if (spots.length === 0) return (
        <div className="trip-placeholder"><span style={{ fontSize: '3rem' }}>📸</span><p>{locale === 'tr' ? 'Fotoğraf noktası bulunamadı' : 'No photo spots found'}</p><button className="btn btn-primary btn-sm" onClick={load}>{locale === 'tr' ? 'Ara' : 'Search'}</button></div>
    )

    return (
        <div className="tool-tab">
            <div className="tool-header"><h3>📸 {locale === 'tr' ? 'Fotoğraf Noktaları' : 'Photo Spots'}</h3><span className="tool-badge">{spots.length}</span></div>
            <div className="photo-spots-grid">
                {spots.map((spot, i) => (
                    <motion.div key={spot.place_id} className="photo-spot-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <div className="photo-spot-img" style={{ backgroundImage: spot.photo_url ? `url(${spot.photo_url})` : 'none' }}>
                            {!spot.photo_url && <span style={{ fontSize: '2rem' }}>📸</span>}
                            {spot.rating > 0 && <span className="photo-spot-rating">⭐ {spot.rating}</span>}
                        </div>
                        <div className="photo-spot-info">
                            <h4>{spot.name}</h4>
                            {spot.review_count > 0 && <span className="photo-spot-reviews">{spot.review_count.toLocaleString()} {locale === 'tr' ? 'yorum' : 'reviews'}</span>}
                            <a href={spot.map_url} target="_blank" rel="noopener noreferrer" className="ai-sugg-maps-btn" style={{ marginTop: 4, fontSize: '0.68rem' }}>📍 Google Maps</a>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

// ══════════════════════════════════════════════════
//  MENU TRANSLATOR TAB
// ══════════════════════════════════════════════════
function MenuTranslatorTab({ locale }) {
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState(null)
    const fileRef = useRef(null)

    const handleFile = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setPreview(URL.createObjectURL(file))
        setLoading(true)
        try {
            const fd = new FormData()
            fd.append('image', file)
            fd.append('locale', locale)
            const res = await fetch('/api/ai/translate-menu', { method: 'POST', body: fd })
            const d = await res.json()
            if (d.sections) setResult(d)
        } catch { }
        setLoading(false)
    }

    return (
        <div className="tool-tab">
            <div className="tool-header"><h3>🍽️ {locale === 'tr' ? 'Menü Çevirici' : 'Menu Translator'}</h3></div>

            {/* Upload Area */}
            <div className="menu-upload" onClick={() => fileRef.current?.click()}>
                {preview ? (
                    <img src={preview} alt="Menu" className="menu-preview" />
                ) : (
                    <>
                        <Camera size={32} style={{ color: 'var(--text-tertiary)' }} />
                        <p>{locale === 'tr' ? 'Menü fotoğrafı çek veya yükle' : 'Take or upload a menu photo'}</p>
                    </>
                )}
                <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: 'none' }} />
            </div>

            {loading && <LoadingPlaceholder text={locale === 'tr' ? 'AI menüyü analiz ediyor...' : 'AI analyzing menu...'} />}

            {result && (
                <div className="menu-result">
                    <div className="menu-result-header">
                        <span>🍳 {result.restaurantType}</span>
                        <span className="tool-badge">{result.detectedLanguage}</span>
                    </div>
                    {/* Top Picks */}
                    {result.topPicks?.length > 0 && (
                        <div className="menu-top-picks">
                            <h4>⭐ {locale === 'tr' ? 'Öneriler' : 'Top Picks'}</h4>
                            <div className="menu-picks">{result.topPicks.map((p, i) => <span key={i} className="menu-pick">🌟 {p}</span>)}</div>
                        </div>
                    )}
                    {/* Sections */}
                    {result.sections?.map((sec, si) => (
                        <div key={si} className="menu-section">
                            <h4>{sec.emoji} {sec.name}</h4>
                            {sec.items?.map((item, ii) => (
                                <div key={ii} className="menu-item">
                                    <div className="menu-item-top">
                                        <strong>{item.translatedName}</strong>
                                        {item.price && <span className="menu-price">{item.price}</span>}
                                    </div>
                                    <div className="menu-item-original">{item.originalName}</div>
                                    {item.description && <p className="menu-item-desc">{item.description}</p>}
                                    <div className="menu-item-tags">
                                        {item.isVegetarian && <span className="menu-tag veg">🌿 Vejetaryen</span>}
                                        {item.isVegan && <span className="menu-tag vegan">🌱 Vegan</span>}
                                        {item.isSpicy && <span className="menu-tag spicy">🌶️ Acı</span>}
                                        {item.allergens?.map(a => <span key={a} className="menu-tag allergen">⚠️ {a}</span>)}
                                    </div>
                                    {item.recommendation && <div className="menu-recommendation">{item.recommendation}</div>}
                                </div>
                            ))}
                        </div>
                    ))}
                    {result.budgetTip && <div className="tool-tip" style={{ marginTop: 12 }}>💰 {result.budgetTip}</div>}
                    <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => { setResult(null); setPreview(null) }}>
                        📸 {locale === 'tr' ? 'Başka Menü Tara' : 'Scan Another Menu'}
                    </button>
                </div>
            )}
        </div>
    )
}

// ══════════════════════════════════════════════════
//  DAY TRIP TAB
// ══════════════════════════════════════════════════
const TRIP_PHOTOS = ['/trip-photos/hiking.png', '/trip-photos/coastal.png', '/trip-photos/ancient.png', '/trip-photos/adventure.png', '/trip-photos/streetfood.png', '/trip-photos/livemusic.png']
const VIBE_COLORS = { adventure: '#EF4444', romantic: '#EC4899', family: '#F59E0B', friends: '#8B5CF6', solo: '#06B6D4', chill: '#10B981' }
const DIFF_COLORS = { easy: '#10B981', moderate: '#F59E0B', hard: '#EF4444' }

function DayTripTab({ city, locale }) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [expanded, setExpanded] = useState(null)
    const t = (tr, en) => locale === 'tr' ? tr : en

    const load = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/ai/daytrip', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ city, locale }) })
            const d = await res.json()
            if (d.dayTrips) setData(d)
        } catch { }
        setLoading(false)
    }

    useEffect(() => { if (city && !data) load() }, [city])

    if (loading) return <LoadingPlaceholder text={t('Günübirlik rotalar hazırlanıyor...', 'Preparing day trip routes...')} />
    if (!data) return (
        <div className="trip-placeholder"><span style={{ fontSize: '3rem' }}>🏕️</span><p>{t('Henüz rota yok', 'No routes yet')}</p><button className="btn btn-primary btn-sm" onClick={load}>{t('Keşfet', 'Explore')}</button></div>
    )

    return (
        <div className="tool-tab">
            <div className="tool-header"><h3>🏕️ {t('Günübirlik Kaçamaklar', 'Day Trip Getaways')}</h3><span className="tool-badge">{data.dayTrips?.length || 0}</span></div>
            {data.seasonalNote && <div className="tool-tip" style={{ marginBottom: 12 }}>🌤️ {data.seasonalNote}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.dayTrips?.map((trip, i) => (
                    <motion.div key={trip.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        style={{ background: 'var(--bg-secondary)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
                        {/* Card Header with photo */}
                        <div style={{ position: 'relative', height: expanded === i ? 'auto' : 160, cursor: 'pointer' }} onClick={() => setExpanded(expanded === i ? null : i)}>
                            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${TRIP_PHOTOS[i % TRIP_PHOTOS.length]})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)' }} />
                            <div style={{ position: 'relative', padding: '16px 16px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', minHeight: 140 }}>
                                <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                                    <span style={{ padding: '2px 8px', borderRadius: 6, background: VIBE_COLORS[trip.vibe] || '#0D9488', color: '#fff', fontSize: '0.65rem', fontWeight: 700 }}>{trip.vibeEmoji} {trip.vibe}</span>
                                    <span style={{ padding: '2px 8px', borderRadius: 6, background: DIFF_COLORS[trip.difficulty] || '#F59E0B', color: '#fff', fontSize: '0.65rem', fontWeight: 700 }}>{trip.difficulty}</span>
                                    <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.65rem', fontWeight: 600 }}>📍 {trip.distance}</span>
                                </div>
                                <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>{trip.emoji} {trip.title}</h3>
                                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', margin: '4px 0 0' }}>{trip.destination} · {trip.duration}</p>
                            </div>
                        </div>

                        {/* Expanded content */}
                        <AnimatePresence>
                            {expanded === i && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                    <div style={{ padding: '14px 16px' }}>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>{trip.description}</p>

                                        {/* Highlights */}
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                                            {trip.highlights?.map((h, hi) => <span key={hi} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(13,148,136,0.08)', color: '#0D9488', fontSize: '0.72rem', fontWeight: 600 }}>✨ {h}</span>)}
                                        </div>

                                        {/* Transport */}
                                        {trip.transport && (
                                            <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: 12, marginBottom: 10, border: '1px solid var(--border)' }}>
                                                <div style={{ fontSize: '0.72rem', fontWeight: 700, marginBottom: 6 }}>🚗 {t('Ulaşım', 'Transport')}</div>
                                                {trip.transport.car && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 3 }}>🚗 {trip.transport.car}</div>}
                                                {trip.transport.bus && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 3 }}>🚌 {trip.transport.bus}</div>}
                                                {trip.transport.ferry && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>⛴️ {trip.transport.ferry}</div>}
                                            </div>
                                        )}

                                        {/* Budget */}
                                        {trip.estimatedBudget && (
                                            <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: 12, marginBottom: 10, border: '1px solid var(--border)' }}>
                                                <div style={{ fontSize: '0.72rem', fontWeight: 700, marginBottom: 6 }}>💰 {t('Tahmini Bütçe', 'Estimated Budget')}</div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                                                    <div style={{ textAlign: 'center', padding: '6px', borderRadius: 8, background: 'rgba(16,185,129,0.06)' }}><div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>🚗</div><div style={{ fontSize: '0.72rem', fontWeight: 700 }}>{trip.estimatedBudget.transport}</div></div>
                                                    <div style={{ textAlign: 'center', padding: '6px', borderRadius: 8, background: 'rgba(245,158,11,0.06)' }}><div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>🍽️</div><div style={{ fontSize: '0.72rem', fontWeight: 700 }}>{trip.estimatedBudget.food}</div></div>
                                                    <div style={{ textAlign: 'center', padding: '6px', borderRadius: 8, background: 'rgba(139,92,246,0.06)' }}><div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>🎯</div><div style={{ fontSize: '0.72rem', fontWeight: 700 }}>{trip.estimatedBudget.activities}</div></div>
                                                </div>
                                                <div style={{ marginTop: 8, textAlign: 'center', fontSize: '0.82rem', fontWeight: 800, color: '#10B981' }}>≈ {trip.estimatedBudget.total}</div>
                                            </div>
                                        )}

                                        {/* Schedule */}
                                        {trip.schedule?.length > 0 && (
                                            <div style={{ marginBottom: 10 }}>
                                                <div style={{ fontSize: '0.72rem', fontWeight: 700, marginBottom: 8 }}>📋 {t('Gün Planı', 'Day Plan')}</div>
                                                {trip.schedule.map((s, si) => (
                                                    <div key={si} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0', borderBottom: si < trip.schedule.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0D9488', minWidth: 42 }}>{s.time}</span>
                                                        <span style={{ fontSize: '1rem' }}>{s.emoji}</span>
                                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{s.activity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Tips */}
                                        {trip.tips?.length > 0 && (
                                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                {trip.tips.map((tip, ti) => <span key={ti} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', color: '#B45309', fontSize: '0.7rem', fontWeight: 600 }}>💡 {tip}</span>)}
                                            </div>
                                        )}

                                        {trip.photoSpot && <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>📸 {trip.photoSpot}</div>}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

// ══════════════════════════════════════════════════
//  FUN ACTIVITIES TAB
// ══════════════════════════════════════════════════
const CAT_ICONS = { outdoor: '🌿', art: '🎨', food: '🍕', music: '🎵', games: '🎮', photo: '📸', vintage: '🛍️', cafe: '☕' }

function FunActivitiesTab({ city, locale }) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [activeCat, setActiveCat] = useState(null)
    const t = (tr, en) => locale === 'tr' ? tr : en

    const load = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/ai/fun-activities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ city, locale }) })
            const d = await res.json()
            if (d.categories) { setData(d); setActiveCat(d.categories[0]?.id || null) }
        } catch { }
        setLoading(false)
    }

    useEffect(() => { if (city && !data) load() }, [city])

    if (loading) return <LoadingPlaceholder text={t('Eğlence önerileri keşfediliyor...', 'Discovering fun activities...')} />
    if (!data) return (
        <div className="trip-placeholder"><span style={{ fontSize: '3rem' }}>🎉</span><p>{t('Henüz öneri yok', 'No suggestions yet')}</p><button className="btn btn-primary btn-sm" onClick={load}>{t('Keşfet', 'Explore')}</button></div>
    )

    const activeCategory = data.categories?.find(c => c.id === activeCat) || data.categories?.[0]

    return (
        <div className="tool-tab">
            <div className="tool-header"><h3>🎉 {t('Eğlence & Deneyimler', 'Fun & Experiences')}</h3></div>

            {/* Today's Pick */}
            {data.todaysPick && (
                <div style={{ background: 'linear-gradient(135deg, #0F2847, #1A3A5C)', borderRadius: 16, padding: 16, marginBottom: 14, color: '#fff' }}>
                    <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7, marginBottom: 4 }}>⭐ {t("Bugünün Önerisi", "Today's Pick")}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800 }}>{data.todaysPick.emoji} {data.todaysPick.name}</div>
                    <p style={{ fontSize: '0.78rem', opacity: 0.8, margin: '4px 0 0' }}>{data.todaysPick.reason}</p>
                </div>
            )}

            {/* Category Tabs */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}>
                {data.categories?.map(cat => (
                    <button key={cat.id} onClick={() => setActiveCat(cat.id)}
                        style={{ padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: activeCat === cat.id ? 'linear-gradient(135deg, #0F2847, #1A3A5C)' : 'var(--bg-tertiary)', color: activeCat === cat.id ? '#fff' : 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {cat.emoji} {cat.name}
                    </button>
                ))}
            </div>

            {/* Activities */}
            {activeCategory?.activities?.map((act, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ background: 'var(--bg-secondary)', borderRadius: 14, border: '1px solid var(--border)', padding: '14px 16px', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span style={{ fontSize: '1.5rem' }}>{act.emoji}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{act.name}</div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '3px 0 6px', lineHeight: 1.4 }}>{act.description}</p>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(13,148,136,0.08)', fontSize: '0.68rem', fontWeight: 600, color: '#0D9488' }}>📍 {act.where}</span>
                                <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.08)', fontSize: '0.68rem', fontWeight: 600, color: '#B45309' }}>💰 {act.price}</span>
                                <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(139,92,246,0.08)', fontSize: '0.68rem', fontWeight: 600, color: '#7C3AED' }}>⏱️ {act.duration}</span>
                                {act.bestTime && <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(236,72,153,0.08)', fontSize: '0.68rem', fontWeight: 600, color: '#DB2777' }}>🕐 {act.bestTime}</span>}
                            </div>
                            {act.tip && <div style={{ marginTop: 6, fontSize: '0.72rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>💡 {act.tip}</div>}
                        </div>
                    </div>
                </motion.div>
            ))}

            {/* Hidden Gems */}
            {data.hiddenGems?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 8px' }}>💎 {t('Gizli Hazineler', 'Hidden Gems')}</h4>
                    {data.hiddenGems.map((gem, i) => (
                        <div key={i} style={{ background: 'rgba(212,168,83,0.06)', borderRadius: 12, padding: '10px 14px', marginBottom: 6, border: '1px solid rgba(212,168,83,0.15)' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{gem.emoji} {gem.name}</div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>{gem.description}</p>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>📍 {gem.where}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Weekend Ideas */}
            {data.weekendIdeas?.length > 0 && (
                <div style={{ marginTop: 14 }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 8px' }}>🎯 {t('Hafta Sonu Fikirleri', 'Weekend Ideas')}</h4>
                    {data.weekendIdeas.map((idea, i) => (
                        <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: '10px 14px', marginBottom: 6, border: '1px solid var(--border)' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{idea.emoji} {idea.title}</div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>{idea.plan}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ══════════════════════════════════════════════════
//  BUDGET TIPS TAB
// ══════════════════════════════════════════════════
function BudgetTipsTab({ city, locale }) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const t = (tr, en) => locale === 'tr' ? tr : en

    const load = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/ai/quick-tips', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ city, locale }) })
            const d = await res.json()
            if (d.quickTips || d.city) setData(d)
        } catch { }
        setLoading(false)
    }

    useEffect(() => { if (city && !data) load() }, [city])

    if (loading) return <LoadingPlaceholder text={t('Bütçe ipuçları hazırlanıyor...', 'Preparing budget tips...')} />
    if (!data) return (
        <div className="trip-placeholder"><span style={{ fontSize: '3rem' }}>💰</span><p>{t('Bütçe ipuçları yok', 'No budget tips')}</p><button className="btn btn-primary btn-sm" onClick={load}>{t('Yükle', 'Load')}</button></div>
    )

    const tipCatColors = { transport: '#2563EB', food: '#DC2626', activity: '#10B981', accommodation: '#F59E0B', hack: '#8B5CF6' }

    return (
        <div className="tool-tab">
            <div className="tool-header"><h3>💰 {t('Bütçe Rehberi', 'Budget Guide')}</h3></div>
            {data.slogan && <div style={{ fontSize: '0.82rem', fontStyle: 'italic', color: 'var(--text-tertiary)', marginBottom: 12, textAlign: 'center' }}>✨ {data.slogan}</div>}

            {/* Daily Budget */}
            {data.dailyBudget && (
                <div style={{ background: 'linear-gradient(135deg, #0F2847, #1A3A5C)', borderRadius: 16, padding: 16, marginBottom: 14, color: '#fff' }}>
                    <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7, marginBottom: 8 }}>📊 {t('Günlük Bütçe', 'Daily Budget')}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>🎒 {t('Ultra Bütçe', 'Ultra Budget')}</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, marginTop: 2 }}>{data.dailyBudget.ultraBudget}</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>😊 {t('Konforlu', 'Comfortable')}</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, marginTop: 2 }}>{data.dailyBudget.comfortable}</div>
                        </div>
                    </div>
                    {data.dailyBudget.breakdown && <div style={{ marginTop: 8, fontSize: '0.72rem', opacity: 0.8, textAlign: 'center' }}>📋 {data.dailyBudget.breakdown}</div>}
                </div>
            )}

            {/* Quick Tips */}
            {data.quickTips?.map((tip, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    style={{ background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)', padding: '12px 14px', marginBottom: 6, borderLeft: `3px solid ${tipCatColors[tip.category] || '#0D9488'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '1.2rem' }}>{tip.emoji}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{tip.title}</div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0', lineHeight: 1.4 }}>{tip.description}</p>
                        </div>
                        {tip.savingsEstimate && <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#10B981', whiteSpace: 'nowrap' }}>{tip.savingsEstimate}</span>}
                    </div>
                </motion.div>
            ))}

            {/* Free Activities */}
            {data.freeActivities?.length > 0 && (
                <div style={{ marginTop: 14 }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 8px' }}>🆓 {t('Ücretsiz Aktiviteler', 'Free Activities')}</h4>
                    {data.freeActivities.map((a, i) => (
                        <div key={i} style={{ background: 'rgba(16,185,129,0.05)', borderRadius: 10, padding: '8px 12px', marginBottom: 4, border: '1px solid rgba(16,185,129,0.12)' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{a.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{a.description}</div>
                            <span style={{ fontSize: '0.65rem', color: '#0D9488' }}>🕐 {a.bestTime}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Cheap Eats */}
            {data.cheapEats?.length > 0 && (
                <div style={{ marginTop: 14 }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 8px' }}>🍕 {t('Ucuz Lezzetler', 'Cheap Eats')}</h4>
                    {data.cheapEats.map((e, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 10, marginBottom: 4, border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '1.2rem' }}>🍽️</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{e.name}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{e.dish} · 📍 {e.area}</div>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#10B981' }}>{e.price}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Transport */}
            {data.budgetTransport && (
                <div style={{ marginTop: 14, background: 'var(--bg-secondary)', borderRadius: 14, padding: 14, border: '1px solid var(--border)' }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 8px' }}>🚌 {t('Ulaşım', 'Transport')}</h4>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>🚗 {data.budgetTransport.cheapestFromIstanbul}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>🎫 {data.budgetTransport.localTransport}</div>
                    {data.budgetTransport.tips?.map((tip, i) => <div key={i} style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 3 }}>💡 {tip}</div>)}
                </div>
            )}
        </div>
    )
}
