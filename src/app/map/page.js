'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useSpace } from '@/context/SpaceContext'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'
import { PIN_TYPES, PIN_STATUSES, MAP_STYLES } from '@/lib/constants'
import Sidebar from '@/components/layout/Sidebar'
import PinForm from '@/components/map/PinForm'
import PinDetail from '@/components/map/PinDetail'
import { Plus, Search, X, MapPin, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function MapPage() {
    const mapContainer = useRef(null)
    const map = useRef(null)
    const markersRef = useRef([])
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

    // Initialize Mapbox
    useEffect(() => {
        if (map.current || !mapContainer.current) return

        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: theme === 'dark' ? MAP_STYLES.dark : MAP_STYLES.light,
            center: [28.9784, 41.0082], // Istanbul default
            zoom: 3,
            attributionControl: false,
        })

        map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right')
        map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left')

        map.current.on('load', () => {
            setMapLoaded(true)
        })

        // Click on map to add pin with auto reverse-geocode
        map.current.on('click', async (e) => {
            if (!document.querySelector('.pin-detail-card')) {
                const coords = { lat: e.lngLat.lat, lng: e.lngLat.lng }
                setNewPinCoords(coords)
                setNewPinLocation(null)
                // Reverse geocode to get city/country
                try {
                    const res = await fetch(
                        `https://api.mapbox.com/geocoding/v5/mapbox.places/${e.lngLat.lng},${e.lngLat.lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=place,locality,region,country&limit=1`
                    )
                    const data = await res.json()
                    if (data.features?.length > 0) {
                        const feature = data.features[0]
                        const context = feature.context || []
                        const city = feature.text || ''
                        const country = context.find(c => c.id.startsWith('country'))?.text || ''
                        setNewPinLocation({ city, country, placeName: feature.place_name })
                    }
                } catch { /* silent */ }
            }
        })

        return () => {
            if (map.current) {
                map.current.remove()
                map.current = null
            }
        }
    }, [])

    // Update map style on theme change
    useEffect(() => {
        if (!map.current || !mapLoaded) return
        map.current.setStyle(theme === 'dark' ? MAP_STYLES.dark : MAP_STYLES.light)
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

    // Render markers
    useEffect(() => {
        if (!map.current || !mapLoaded) return

        // Clear existing markers
        markersRef.current.forEach(m => m.remove())
        markersRef.current = []

        filteredPins.forEach(pin => {
            const pinType = PIN_TYPES[pin.type] || PIN_TYPES.memory
            const el = document.createElement('div')
            el.className = 'pin-marker'
            el.style.background = pinType.color
            el.innerHTML = `<span class="pin-marker-inner">${pinType.emoji}</span>`

            el.addEventListener('click', (e) => {
                e.stopPropagation()
                setSelectedPin(pin)
            })

            const marker = new mapboxgl.Marker({ element: el })
                .setLngLat([pin.lng, pin.lat])
                .addTo(map.current)

            markersRef.current.push(marker)
        })
    }, [filteredPins, mapLoaded])

    // Search places
    const handleSearch = useCallback(async (query) => {
        setSearchQuery(query)
        if (query.length < 2) {
            setSearchResults([])
            return
        }

        try {
            const res = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=place,locality,address&limit=5`
            )
            const data = await res.json()
            setSearchResults(data.features || [])
        } catch {
            setSearchResults([])
        }
    }, [])

    const selectSearchResult = (result) => {
        const [lng, lat] = result.center
        map.current.flyTo({ center: [lng, lat], zoom: 12, essential: true })
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
                        Supabase güvenlik politikalarında sorun var. Supabase Dashboard → SQL Editor'de fix_rls_v2.sql dosyasını çalıştırın.
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
