'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useSpace } from '@/context/SpaceContext'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'
import { PIN_TYPES, PIN_STATUSES } from '@/lib/constants'
import Sidebar from '@/components/layout/Sidebar'
import PinForm from '@/components/map/PinForm'
import PinDetail from '@/components/map/PinDetail'
import { Plus, Search, X, MapPin, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

// Google Maps dark mode style
const DARK_MAP_STYLE = [
    { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8892b0' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2a2a4a' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1e1e3a' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6c7293' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a2e1a' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a4a' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a1a2e' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a3a5c' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2a2a4a' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1a2b' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4a5568' }] },
]

const LIGHT_MAP_STYLE = [
    { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.medical', stylers: [{ visibility: 'off' }] },
]

export default function MapPage() {
    const mapContainer = useRef(null)
    const mapRef = useRef(null)
    const markersRef = useRef([])
    const autocompleteService = useRef(null)
    const placesService = useRef(null)
    const [pins, setPins] = useState([])
    const [filteredPins, setFilteredPins] = useState([])
    const [selectedPin, setSelectedPin] = useState(null)
    const [showPinForm, setShowPinForm] = useState(false)
    const [newPinCoords, setNewPinCoords] = useState(null)
    const [newPinLocation, setNewPinLocation] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [activeFilters, setActiveFilters] = useState({ status: null, type: null })
    const [mapLoaded, setMapLoaded] = useState(false)
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()
    const { space, loading: spaceLoading, dbError, loadSpace: reloadSpace } = useSpace()
    const { theme } = useTheme()
    const { t } = useLanguage()
    const supabase = createClient()
    const router = useRouter()

    // Redirect to onboarding if no space
    useEffect(() => {
        if (!spaceLoading && !space && user && !dbError) {
            router.push('/onboarding')
        }
    }, [space, spaceLoading, user, dbError])

    // Load Google Maps script with preconnect for speed
    useEffect(() => {
        // Preconnect to Google Maps servers for faster loading
        const preconnect = document.createElement('link')
        preconnect.rel = 'preconnect'
        preconnect.href = 'https://maps.googleapis.com'
        document.head.appendChild(preconnect)
        const preconnect2 = document.createElement('link')
        preconnect2.rel = 'preconnect'
        preconnect2.href = 'https://maps.gstatic.com'
        preconnect2.crossOrigin = 'anonymous'
        document.head.appendChild(preconnect2)

        if (mapRef.current || !mapContainer.current) return

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
        if (!apiKey) {
            console.error('Google Maps API key not set')
            return
        }

        // Check if already loaded
        if (window.google?.maps) {
            initMap()
            return
        }

        // Use callback-based loading for speed
        window.initGoogleMap = initMap
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&callback=initGoogleMap`
        script.async = true
        script.defer = true
        script.onerror = () => console.error('Google Maps script failed to load')
        document.head.appendChild(script)

        return () => {
            delete window.initGoogleMap
        }
    }, [])

    function initMap() {
        if (!mapContainer.current || mapRef.current) return

        const google = window.google

        const map = new google.maps.Map(mapContainer.current, {
            center: { lat: 41.0082, lng: 28.9784 }, // Istanbul default
            zoom: 3,
            styles: theme === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
            disableDefaultUI: true,
            zoomControl: true,
            zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: 'greedy',
            clickableIcons: false,
        })

        mapRef.current = map
        autocompleteService.current = new google.maps.places.AutocompleteService()
        placesService.current = new google.maps.places.PlacesService(map)

        map.addListener('tilesloaded', () => {
            setMapLoaded(true)
        })

        // Click on map to add pin with auto reverse-geocode
        map.addListener('click', async (e) => {
            if (document.querySelector('.pin-detail-card')) return

            const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() }
            setNewPinCoords(coords)
            setNewPinLocation(null)

            // Reverse geocode using Google Geocoding API
            try {
                const geocoder = new google.maps.Geocoder()
                const { results } = await geocoder.geocode({ location: e.latLng })

                if (results?.[0]) {
                    const components = results[0].address_components
                    const city = components.find(c => c.types.includes('locality'))?.long_name
                        || components.find(c => c.types.includes('administrative_area_level_1'))?.long_name
                        || ''
                    const country = components.find(c => c.types.includes('country'))?.long_name || ''
                    setNewPinLocation({
                        city,
                        country,
                        placeName: results[0].formatted_address,
                    })
                }
            } catch { /* silent */ }
        })
    }

    // Update map style on theme change
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return
        mapRef.current.setOptions({
            styles: theme === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
        })
    }, [theme, mapLoaded])

    // Load pins
    useEffect(() => {
        if (!space) return
        loadPins()
    }, [space])

    const loadPins = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('pins')
            .select('*, pin_media(*)')
            .eq('space_id', space.id)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setPins(data)
            setFilteredPins(data)
        }
        setLoading(false)
    }

    // Apply filters
    useEffect(() => {
        let result = [...pins]
        if (activeFilters.status) {
            result = result.filter(p => p.status === activeFilters.status)
        }
        if (activeFilters.type) {
            result = result.filter(p => p.type === activeFilters.type)
        }
        setFilteredPins(result)
    }, [pins, activeFilters])

    // Render Google Maps markers
    useEffect(() => {
        if (!mapRef.current || !mapLoaded || !window.google) return

        // Clear existing markers
        markersRef.current.forEach(m => m.setMap(null))
        markersRef.current = []

        filteredPins.forEach(pin => {
            const pinType = PIN_TYPES[pin.type] || PIN_TYPES.memory

            // Create SVG icon for marker
            const svgIcon = {
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
                        <defs><filter id="s" x="-20%" y="-10%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/></filter></defs>
                        <path d="M18 0C8 0 0 8 0 18c0 13 18 26 18 26s18-13 18-26C36 8 28 0 18 0z" fill="${pinType.color}" filter="url(#s)"/>
                        <circle cx="18" cy="16" r="11" fill="rgba(255,255,255,0.2)"/>
                        <text x="18" y="21" text-anchor="middle" font-size="14">${pinType.emoji}</text>
                    </svg>
                `)}`,
                scaledSize: new window.google.maps.Size(36, 44),
                anchor: new window.google.maps.Point(18, 44),
            }

            const marker = new window.google.maps.Marker({
                map: mapRef.current,
                position: { lat: pin.lat, lng: pin.lng },
                icon: svgIcon,
                title: pin.title || '',
                animation: window.google.maps.Animation.DROP,
                optimized: true,
            })

            marker.addListener('click', () => {
                setSelectedPin(pin)
            })

            markersRef.current.push(marker)
        })
    }, [filteredPins, mapLoaded])

    // Search places using Google Places Autocomplete
    const handleSearch = useCallback(async (query) => {
        setSearchQuery(query)
        if (query.length < 2) {
            setSearchResults([])
            return
        }

        if (!autocompleteService.current) {
            setSearchResults([])
            return
        }

        try {
            const request = {
                input: query,
                types: ['(cities)'],
            }

            autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                    setSearchResults(predictions.map(p => ({
                        id: p.place_id,
                        place_name: p.description,
                        place_id: p.place_id,
                    })))
                } else {
                    setSearchResults([])
                }
            })
        } catch {
            setSearchResults([])
        }
    }, [])

    const selectSearchResult = (result) => {
        if (!placesService.current) return

        // Get place details to get coordinates
        placesService.current.getDetails(
            { placeId: result.place_id, fields: ['geometry', 'name'] },
            (place, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                    mapRef.current.panTo(place.geometry.location)
                    mapRef.current.setZoom(12)
                }
            }
        )

        setSearchQuery(result.place_name)
        setSearchResults([])
    }

    const toggleFilter = (filterType, value) => {
        setActiveFilters(prev => ({
            ...prev,
            [filterType]: prev[filterType] === value ? null : value,
        }))
    }

    const handleAddPin = () => {
        setShowPinForm(true)
        setSelectedPin(null)
    }

    const handlePinCreated = (newPin) => {
        setPins(prev => [newPin, ...prev])
        setShowPinForm(false)
        setNewPinCoords(null)
        setNewPinLocation(null)
    }

    const handlePinUpdated = (updatedPin) => {
        setPins(prev => prev.map(p => p.id === updatedPin.id ? updatedPin : p))
        setSelectedPin(updatedPin)
    }

    const handlePinDeleted = (pinId) => {
        setPins(prev => prev.filter(p => p.id !== pinId))
        setSelectedPin(null)
    }

    if (spaceLoading) {
        return (
            <div className="auth-bg">
                <div style={{ color: 'white', textAlign: 'center' }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                    <p>{t('map.loadingSpace')}</p>
                </div>
                <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    if (dbError) {
        return (
            <div className="auth-bg">
                <div style={{ color: 'white', textAlign: 'center', maxWidth: 440, padding: 32 }}>
                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
                    <h2 style={{ marginBottom: 8 }}>Veritabanı Hatası</h2>
                    <p style={{ color: '#94A3B8', marginBottom: 24, fontSize: '0.875rem', lineHeight: 1.6 }}>
                        Supabase güvenlik politikalarında sorun var. Supabase Dashboard → SQL Editor'de fix_rls_v3.sql dosyasını çalıştırın.
                    </p>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button onClick={() => reloadSpace()} className="btn btn-primary">
                            🔄 Tekrar Dene
                        </button>
                        <button onClick={() => router.push('/onboarding')} className="btn btn-secondary">
                            Yeni Alan Oluştur
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="map-container">
                    <div ref={mapContainer} className="map-canvas" />

                    {/* Search Bar */}
                    <div className="map-controls">
                        <div className="map-search" style={{ position: 'relative' }}>
                            <div style={{ position: 'relative' }}>
                                <Search
                                    size={18}
                                    style={{
                                        position: 'absolute', left: 14, top: '50%',
                                        transform: 'translateY(-50%)', color: 'var(--text-tertiary)',
                                        pointerEvents: 'none',
                                    }}
                                />
                                <input
                                    type="text"
                                    className="input"
                                    placeholder={t('map.searchPlaces')}
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    style={{ paddingLeft: 42 }}
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => { setSearchQuery(''); setSearchResults([]) }}
                                        style={{
                                            position: 'absolute', right: 10, top: '50%',
                                            transform: 'translateY(-50%)', background: 'none',
                                            border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)',
                                        }}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Search Results Dropdown */}
                            <AnimatePresence>
                                {searchResults.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0,
                                            marginTop: 8, background: 'var(--glass-bg-strong)',
                                            backdropFilter: 'blur(20px)', borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--glass-border)',
                                            boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
                                            zIndex: 20,
                                        }}
                                    >
                                        {searchResults.map((result) => (
                                            <button
                                                key={result.id}
                                                onClick={() => selectSearchResult(result)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 12,
                                                    width: '100%', padding: '12px 16px', border: 'none',
                                                    background: 'transparent', cursor: 'pointer',
                                                    color: 'var(--text-primary)', fontSize: '0.875rem',
                                                    textAlign: 'left', borderBottom: '1px solid var(--border)',
                                                    transition: 'background 150ms',
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <MapPin size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                                <span className="truncate">{result.place_name}</span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Filter Chips */}
                    <div className="map-filters">
                        {Object.entries(PIN_STATUSES).map(([key, { emoji }]) => (
                            <button
                                key={key}
                                className={`filter-chip ${activeFilters.status === key ? 'filter-chip-active' : ''}`}
                                onClick={() => toggleFilter('status', key)}
                            >
                                {emoji} {t(`pinStatus.${key}`)}
                            </button>
                        ))}
                        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />
                        {Object.entries(PIN_TYPES).map(([key, { emoji }]) => (
                            <button
                                key={key}
                                className={`filter-chip ${activeFilters.type === key ? 'filter-chip-active' : ''}`}
                                onClick={() => toggleFilter('type', key)}
                            >
                                {emoji} {t(`pinType.${key}`)}
                            </button>
                        ))}
                    </div>

                    {/* FAB — Add Pin */}
                    <div className="map-fab">
                        <motion.button
                            className="fab-button"
                            onClick={handleAddPin}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Plus size={28} />
                        </motion.button>
                    </div>

                    {/* Pin Detail Card */}
                    <AnimatePresence>
                        {selectedPin && (
                            <motion.div
                                className="pin-detail-card"
                                initial={{ opacity: 0, y: 60 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 60 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            >
                                <PinDetail
                                    pin={selectedPin}
                                    onClose={() => setSelectedPin(null)}
                                    onEdit={() => { setShowPinForm(true); setNewPinCoords({ lat: selectedPin.lat, lng: selectedPin.lng }) }}
                                    onDelete={handlePinDeleted}
                                    onUpdate={handlePinUpdated}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* New Pin Coords Indicator */}
                    <AnimatePresence>
                        {newPinCoords && !showPinForm && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    position: 'absolute', bottom: 100, left: '50%',
                                    transform: 'translateX(-50%)', zIndex: 15,
                                    maxWidth: '90%',
                                }}
                            >
                                <div className="card-glass" style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '12px 20px', borderRadius: 'var(--radius-2xl)',
                                }}>
                                    <MapPin size={18} style={{ color: 'var(--primary-1)', flexShrink: 0 }} />
                                    <div style={{ minWidth: 0 }}>
                                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                            {newPinLocation ? `${newPinLocation.city}${newPinLocation.country ? `, ${newPinLocation.country}` : ''}` : t('map.locationSelected')}
                                        </span>
                                    </div>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => setShowPinForm(true)}
                                        style={{ flexShrink: 0 }}
                                    >
                                        <Plus size={14} /> {t('map.addPin')}
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => { setNewPinCoords(null); setNewPinLocation(null) }}
                                        style={{ flexShrink: 0 }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Pin Form Slide-over */}
            <AnimatePresence>
                {showPinForm && (
                    <PinForm
                        coords={newPinCoords}
                        locationData={newPinLocation}
                        editPin={selectedPin}
                        spaceId={space?.id}
                        onClose={() => { setShowPinForm(false); setNewPinCoords(null); setNewPinLocation(null) }}
                        onCreated={handlePinCreated}
                        onUpdated={handlePinUpdated}
                    />
                )}
            </AnimatePresence>
        </>
    )
}
