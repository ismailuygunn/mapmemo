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
import { Plus, Search, X, MapPin, Loader2, Users, Globe, Camera } from 'lucide-react'
import { getAuthHeaders } from '@/lib/authHeaders'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import ISTANBUL_SPOTS from '@/data/istanbul-spots'
import 'mapbox-gl/dist/mapbox-gl.css'

export default function MapPage() {
    const mapContainer = useRef(null)
    const mapRef = useRef(null)
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
    const [socialPins, setSocialPins] = useState([])
    const [showSocial, setShowSocial] = useState(true)
    const [selectedSocialPin, setSelectedSocialPin] = useState(null)
    const socialMarkersRef = useRef([])
    const [showCommunity, setShowCommunity] = useState(true)
    const [selectedCommunitySpot, setSelectedCommunitySpot] = useState(null)
    const communityMarkersRef = useRef([])
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()
    const { space, loading: spaceLoading, dbError, loadSpace: reloadSpace } = useSpace()
    const { theme } = useTheme()
    const { t } = useLanguage()
    const supabase = createClient()
    const router = useRouter()

    // Redirect only if not logged in
    useEffect(() => {
        if (!spaceLoading && !user) {
            router.push('/login')
        }
    }, [spaceLoading, user])

    // Initialize Mapbox
    useEffect(() => {
        if (mapRef.current || !mapContainer.current) return

        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
        if (!token) {
            console.error('Mapbox token not set')
            return
        }

        // Dynamic import mapbox-gl for SSR safety
        import('mapbox-gl').then((mapboxgl) => {
            mapboxgl.default.accessToken = token

            const map = new mapboxgl.default.Map({
                container: mapContainer.current,
                style: theme === 'dark'
                    ? 'mapbox://styles/mapbox/dark-v11'
                    : 'mapbox://styles/mapbox/light-v11',
                center: [28.9784, 41.0082], // Istanbul default [lng, lat]
                zoom: 3,
                projection: 'globe',
                attributionControl: false,
                logoPosition: 'bottom-right',
            })

            // Add zoom/compass controls
            map.addControl(new mapboxgl.default.NavigationControl({
                showCompass: true,
                showZoom: true,
            }), 'bottom-right')

            // Globe atmosphere styling
            map.on('style.load', () => {
                map.setFog({
                    color: theme === 'dark' ? 'rgb(10, 10, 30)' : 'rgb(186, 210, 235)',
                    'high-color': theme === 'dark' ? 'rgb(20, 20, 60)' : 'rgb(36, 92, 223)',
                    'horizon-blend': 0.04,
                    'space-color': theme === 'dark' ? 'rgb(5, 5, 15)' : 'rgb(11, 11, 25)',
                    'star-intensity': theme === 'dark' ? 0.6 : 0.15,
                })
            })

            // No auto-rotation — user controls the map

            map.on('load', () => {
                setMapLoaded(true)
            })

            // Click to add pin with reverse geocode
            map.on('click', async (e) => {
                if (document.querySelector('.pin-detail-card')) return

                const coords = { lat: e.lngLat.lat, lng: e.lngLat.lng }
                setNewPinCoords(coords)
                setNewPinLocation(null)

                // Reverse geocode via Mapbox
                try {
                    const res = await fetch(
                        `https://api.mapbox.com/geocoding/v5/mapbox.places/${e.lngLat.lng},${e.lngLat.lat}.json?access_token=${token}&language=tr`
                    )
                    const data = await res.json()
                    if (data.features?.length > 0) {
                        const feature = data.features[0]
                        const city = data.features.find(f => f.place_type?.includes('place'))?.text
                            || data.features.find(f => f.place_type?.includes('region'))?.text
                            || ''
                        const country = data.features.find(f => f.place_type?.includes('country'))?.text || ''
                        setNewPinLocation({
                            city,
                            country,
                            placeName: feature.place_name,
                        })
                    }
                } catch { /* silent */ }
            })

            mapRef.current = map
        })

        return () => {
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
            }
        }
    }, [])

    // Update map style on theme change
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return
        mapRef.current.setStyle(
            theme === 'dark'
                ? 'mapbox://styles/mapbox/dark-v11'
                : 'mapbox://styles/mapbox/light-v11'
        )
    }, [theme, mapLoaded])

    // Load pins
    useEffect(() => {
        if (space || user) loadPins()
        if (user) loadSocialPins()
    }, [space, user])

    const loadPins = async () => {
        setLoading(true)
        let query = supabase.from('pins').select('*, pin_media(*)')
        if (space) query = query.eq('space_id', space.id)
        else if (user) query = query.eq('user_id', user.id)
        else { setLoading(false); return }

        const { data, error } = await query.order('created_at', { ascending: false })

        if (!error && data) {
            setPins(data)
            setFilteredPins(data)
        }
        setLoading(false)
    }

    // Load social check-in pins
    const loadSocialPins = async () => {
        try {
            const authH = await getAuthHeaders()
            const res = await fetch(`/api/social/pins?userId=${user.id}&scope=all`, { headers: authH })
            const data = await res.json()
            setSocialPins(data.markers || [])
        } catch (err) { console.error('Social pins error:', err) }
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

    // Render Mapbox markers
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return

        // Clear existing markers
        markersRef.current.forEach(m => m.remove())
        markersRef.current = []

        filteredPins.forEach(pin => {
            const pinType = PIN_TYPES[pin.type] || PIN_TYPES.memory

            // Create custom marker element
            const el = document.createElement('div')
            el.className = 'mapbox-pin-marker'
            el.innerHTML = `
                <div style="
                    width: 24px; height: 24px;
                    background: ${pinType.color};
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.35);
                    border: 1.5px solid rgba(255,255,255,0.4);
                    cursor: pointer;
                    transition: transform 150ms, box-shadow 150ms;
                ">
                    <span style="transform: rotate(45deg); font-size: 11px;">${pinType.emoji}</span>
                </div>
            `
            el.addEventListener('mouseenter', () => {
                el.firstElementChild.style.transform = 'rotate(-45deg) scale(1.2)'
                el.firstElementChild.style.boxShadow = '0 5px 15px rgba(0,0,0,0.5)'
            })
            el.addEventListener('mouseleave', () => {
                el.firstElementChild.style.transform = 'rotate(-45deg) scale(1)'
                el.firstElementChild.style.boxShadow = '0 3px 10px rgba(0,0,0,0.4)'
            })

            el.addEventListener('click', (e) => {
                e.stopPropagation()
                setSelectedPin(pin)
            })

            // Dynamic import to avoid SSR issues
            import('mapbox-gl').then(mapboxgl => {
                const marker = new mapboxgl.default.Marker({ element: el, anchor: 'bottom' })
                    .setLngLat([pin.lng, pin.lat])
                    .addTo(mapRef.current)
                markersRef.current.push(marker)
            })
        })
    }, [filteredPins, mapLoaded])

    // Render social check-in markers
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return

        // Clear existing social markers
        socialMarkersRef.current.forEach(m => m.remove())
        socialMarkersRef.current = []

        if (!showSocial) return

        socialPins.forEach(pin => {
            const el = document.createElement('div')
            el.className = 'social-pin-marker'
            const initial = pin.user?.displayName?.[0] || '?'
            const avatarBg = pin.user?.avatarUrl
                ? `url(${pin.user.avatarUrl}) center/cover no-repeat`
                : `linear-gradient(135deg, #EC4899, #8B5CF6)`
            el.innerHTML = `
                <div style="
                    display: flex; align-items: center; gap: 2px;
                    cursor: pointer; position: relative;
                ">
                    <div style="
                        width: 28px; height: 28px; border-radius: 50%;
                        background: ${avatarBg};
                        border: 2px solid rgba(255,255,255,0.9);
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        display: flex; align-items: center; justify-content: center;
                        font-size: 12px; font-weight: 800; color: white;
                    ">${pin.user?.avatarUrl ? '' : initial}</div>
                    <span style="
                        font-size: 14px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
                    ">${pin.emoji}</span>
                </div>
            `
            el.addEventListener('click', (e) => {
                e.stopPropagation()
                setSelectedSocialPin(pin)
                setSelectedPin(null)
            })

            import('mapbox-gl').then(mapboxgl => {
                const marker = new mapboxgl.default.Marker({ element: el, anchor: 'center' })
                    .setLngLat([pin.lng, pin.lat])
                    .addTo(mapRef.current)
                socialMarkersRef.current.push(marker)
            })
        })
    }, [socialPins, showSocial, mapLoaded])

    // Render Istanbul community photo spots
    useEffect(() => {
        if (!mapRef.current || !mapLoaded) return
        communityMarkersRef.current.forEach(m => m.remove())
        communityMarkersRef.current = []
        if (!showCommunity) return

        ISTANBUL_SPOTS.forEach(spot => {
            const el = document.createElement('div')
            el.className = 'community-spot-marker'
            el.innerHTML = `
                <div style="
                    width: 22px; height: 22px;
                    background: linear-gradient(135deg, #06B6D4, #8B5CF6);
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 2px 8px rgba(6,182,212,0.4);
                    border: 1.5px solid rgba(255,255,255,0.7);
                    cursor: pointer;
                    transition: transform 150ms;
                ">
                    <span style="font-size: 10px;">📸</span>
                </div>
            `
            el.addEventListener('mouseenter', () => {
                el.firstElementChild.style.transform = 'scale(1.3)'
            })
            el.addEventListener('mouseleave', () => {
                el.firstElementChild.style.transform = 'scale(1)'
            })
            el.addEventListener('click', (e) => {
                e.stopPropagation()
                setSelectedCommunitySpot(spot)
                setSelectedPin(null)
                setSelectedSocialPin(null)
            })

            import('mapbox-gl').then(mapboxgl => {
                const marker = new mapboxgl.default.Marker({ element: el, anchor: 'center' })
                    .setLngLat([spot.lng, spot.lat])
                    .addTo(mapRef.current)
                communityMarkersRef.current.push(marker)
            })
        })
    }, [showCommunity, mapLoaded])

    // Search via Mapbox Geocoding API
    const handleSearch = useCallback(async (query) => {
        setSearchQuery(query)
        if (query.length < 2) {
            setSearchResults([])
            return
        }

        try {
            const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
            const res = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&types=place,locality,neighborhood&language=tr&limit=5`
            )
            const data = await res.json()
            setSearchResults((data.features || []).map(f => ({
                id: f.id,
                place_name: f.place_name,
                center: f.center, // [lng, lat]
            })))
        } catch {
            setSearchResults([])
        }
    }, [])

    const selectSearchResult = (result) => {
        if (mapRef.current && result.center) {
            mapRef.current.flyTo({
                center: result.center,
                zoom: 12,
                duration: 1500,
            })
        }
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

    // Show a compact loading banner instead of blocking the entire page
    const showSpaceLoadingBanner = spaceLoading && !space

    // If there's a db error but no space, just proceed — don't block the map
    // The space will still be null but the app should work in limited mode

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="map-container">
                    <div ref={mapContainer} className="map-canvas" />

                    {/* Map loading skeleton */}
                    {!mapLoaded && (
                        <div style={{
                            position: 'absolute', inset: 0, zIndex: 5,
                            background: theme === 'dark' ? '#1a1a2e' : '#e8e8e8',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
                                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                                <p style={{ fontSize: '0.875rem' }}>Harita yükleniyor...</p>
                            </div>
                        </div>
                    )}

                    {/* Compact space loading banner — doesn't block the map */}
                    {showSpaceLoadingBanner && mapLoaded && (
                        <div style={{
                            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
                            zIndex: 10, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                            borderRadius: 12, padding: '8px 16px',
                            display: 'flex', alignItems: 'center', gap: 8,
                            color: 'white', fontSize: '0.78rem', fontWeight: 600,
                        }}>
                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                            Pinler yükleniyor...
                        </div>
                    )}

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

                    {/* Social Toggle + FAB */}
                    <div className="map-fab" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <motion.button
                            onClick={() => setShowSocial(!showSocial)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            title={showSocial ? 'Sosyal pinleri gizle' : 'Sosyal pinleri göster'}
                            style={{
                                width: 48, height: 48, borderRadius: '50%',
                                background: showSocial ? 'linear-gradient(135deg, #EC4899, #8B5CF6)' : 'var(--bg-secondary)',
                                border: showSocial ? 'none' : '1px solid var(--border)',
                                color: showSocial ? 'white' : 'var(--text-secondary)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            }}
                        >
                            <Users size={20} />
                        </motion.button>
                        <motion.button
                            onClick={() => setShowCommunity(!showCommunity)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            title={showCommunity ? 'Fotoğraf noktalarını gizle' : 'Fotoğraf noktalarını göster'}
                            style={{
                                width: 48, height: 48, borderRadius: '50%',
                                background: showCommunity ? 'linear-gradient(135deg, #06B6D4, #8B5CF6)' : 'var(--bg-secondary)',
                                border: showCommunity ? 'none' : '1px solid var(--border)',
                                color: showCommunity ? 'white' : 'var(--text-secondary)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            }}
                        >
                            <Camera size={20} />
                        </motion.button>
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

                    {/* Social Check-in Popup */}
                    <AnimatePresence>
                        {selectedSocialPin && (
                            <motion.div
                                initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                style={{
                                    position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
                                    width: '90%', maxWidth: 380, zIndex: 25,
                                    background: 'var(--glass-bg-strong)', backdropFilter: 'blur(20px)',
                                    borderRadius: 20, border: '1px solid var(--glass-border)',
                                    boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
                                }}
                            >
                                {selectedSocialPin.photoUrl && (
                                    <div style={{ height: 140, overflow: 'hidden' }}>
                                        <img src={selectedSocialPin.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                                <div style={{ padding: '14px 18px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                            background: selectedSocialPin.user?.avatarUrl
                                                ? `url(${selectedSocialPin.user.avatarUrl}) center/cover`
                                                : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontWeight: 800, fontSize: '0.85rem',
                                            border: '2px solid var(--border)',
                                        }}>
                                            {!selectedSocialPin.user?.avatarUrl && (selectedSocialPin.user?.displayName?.[0] || '?')}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                                                {selectedSocialPin.user?.displayName || 'Kullanıcı'}
                                            </div>
                                            {selectedSocialPin.user?.username && (
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>@{selectedSocialPin.user.username}</div>
                                            )}
                                        </div>
                                        <button onClick={() => setSelectedSocialPin(null)}
                                            style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 4 }}>
                                        {selectedSocialPin.emoji} {selectedSocialPin.placeName}
                                    </div>
                                    {selectedSocialPin.note && (
                                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 8px', lineHeight: 1.5 }}>
                                            {selectedSocialPin.note}
                                        </p>
                                    )}
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        {selectedSocialPin.city && <span>📍 {selectedSocialPin.city}</span>}
                                        <span>🕐 {new Date(selectedSocialPin.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                                        {selectedSocialPin.rating > 0 && <span>⭐ {selectedSocialPin.rating}/5</span>}
                                    </div>
                                    {selectedSocialPin.user?.username && (
                                        <button
                                            onClick={() => router.push(`/u/${selectedSocialPin.user.username}`)}
                                            style={{
                                                marginTop: 10, width: '100%', padding: '8px', borderRadius: 10,
                                                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                                color: 'white', border: 'none', fontSize: '0.78rem', fontWeight: 700,
                                                cursor: 'pointer',
                                            }}
                                        >Profili Gör</button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Community Spot Info */}
                    <AnimatePresence>
                        {selectedCommunitySpot && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                                style={{
                                    position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)',
                                    width: 320, maxWidth: 'calc(100vw - 32px)', zIndex: 20,
                                    background: 'var(--bg-primary)', borderRadius: 20,
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
                                    border: '1px solid var(--border)', overflow: 'hidden',
                                }}>
                                {/* Header */}
                                <div style={{
                                    padding: '16px 16px 12px',
                                    background: 'linear-gradient(135deg, #06B6D4, #8B5CF6)',
                                    color: 'white', position: 'relative',
                                }}>
                                    <button onClick={() => setSelectedCommunitySpot(null)} style={{
                                        position: 'absolute', top: 10, right: 10, width: 28, height: 28,
                                        borderRadius: 8, background: 'rgba(255,255,255,0.2)', border: 'none',
                                        color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}><X size={14} /></button>
                                    <div style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 4 }}>
                                        📸 {selectedCommunitySpot.title}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>
                                        📍 İstanbul · {'⭐'.repeat(selectedCommunitySpot.rating || 3)}
                                    </div>
                                </div>
                                <div style={{ padding: '12px 16px 16px' }}>
                                    {selectedCommunitySpot.notes && (
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>
                                            💡 {selectedCommunitySpot.notes}
                                        </p>
                                    )}
                                    {selectedCommunitySpot.tags?.length > 0 && (
                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                            {selectedCommunitySpot.tags.map((tag, i) => (
                                                <span key={i} style={{
                                                    padding: '3px 8px', borderRadius: 6, fontSize: '0.65rem',
                                                    fontWeight: 700, background: '#06B6D415', color: '#06B6D4',
                                                }}>#{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
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
                        userId={user?.id}
                        onClose={() => { setShowPinForm(false); setNewPinCoords(null); setNewPinLocation(null) }}
                        onCreated={handlePinCreated}
                        onUpdated={handlePinUpdated}
                    />
                )}
            </AnimatePresence>
        </>
    )
}
