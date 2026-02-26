'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import { MapPin, Loader2, Navigation, RefreshCw, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const CATEGORIES = [
    { key: 'restaurant', emoji: '🍽️', label: 'Restoran' },
    { key: 'cafe', emoji: '☕', label: 'Kafe' },
    { key: 'atm', emoji: '🏧', label: 'ATM' },
    { key: 'pharmacy', emoji: '💊', label: 'Eczane' },
    { key: 'hospital', emoji: '🏥', label: 'Hastane' },
    { key: 'supermarket', emoji: '🛒', label: 'Market' },
    { key: 'museum', emoji: '🏛️', label: 'Müze' },
    { key: 'gas_station', emoji: '⛽', label: 'Benzinlik' },
    { key: 'parking', emoji: '🅿️', label: 'Otopark' },
    { key: 'bus_station', emoji: '🚌', label: 'Otobüs' },
    { key: 'subway_station', emoji: '🚇', label: 'Metro' },
    { key: 'shopping_mall', emoji: '🛍️', label: 'AVM' },
]

export default function NearbyPage() {
    const [location, setLocation] = useState(null)
    const [locErr, setLocErr] = useState('')
    const [category, setCategory] = useState('restaurant')
    const [places, setPlaces] = useState([])
    const [loading, setLoading] = useState(false)
    const [radius, setRadius] = useState('1500')
    const { t, locale } = useLanguage()

    useEffect(() => { getLocation() }, [])
    useEffect(() => { if (location) fetchNearby() }, [location, category, radius])

    const getLocation = () => {
        setLocErr('')
        if (!navigator.geolocation) { setLocErr(locale === 'tr' ? 'Konum desteklenmiyor' : 'Geolocation not supported'); return }
        navigator.geolocation.getCurrentPosition(
            (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => setLocErr(locale === 'tr' ? 'Konum izni verilmedi' : 'Location permission denied'),
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    const fetchNearby = async () => {
        if (!location) return
        setLoading(true)
        try {
            const res = await fetch(`/api/nearby?lat=${location.lat}&lng=${location.lng}&type=${category}&radius=${radius}`)
            const data = await res.json()
            if (data.places) setPlaces(data.places)
        } catch { }
        setLoading(false)
    }

    const catInfo = CATEGORIES.find(c => c.key === category)

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="page" style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px 100px' }}>
                    {/* Header */}
                    <div style={{ marginBottom: 24 }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                            📍 {locale === 'tr' ? 'Yakınımdakiler' : 'Nearby'}
                        </h1>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
                            {locale === 'tr' ? 'Etrafındaki yerleri keşfet' : 'Discover places around you'}
                        </p>
                    </div>

                    {/* Location Status */}
                    {!location && !locErr && (
                        <div className="nearby-status">
                            <Loader2 size={20} className="spin" />
                            <span>{locale === 'tr' ? 'Konum alınıyor...' : 'Getting location...'}</span>
                        </div>
                    )}
                    {locErr && (
                        <div className="nearby-status nearby-error">
                            <span>{locErr}</span>
                            <button className="btn btn-sm btn-primary" onClick={getLocation}><RefreshCw size={14} /> {locale === 'tr' ? 'Tekrar Dene' : 'Retry'}</button>
                        </div>
                    )}

                    {location && (
                        <>
                            {/* Category Filters */}
                            <div className="nearby-cats">
                                {CATEGORIES.map(c => (
                                    <button key={c.key} className={`nearby-cat ${category === c.key ? 'active' : ''}`}
                                        onClick={() => setCategory(c.key)}>
                                        <span>{c.emoji}</span>
                                        <span>{c.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Radius */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <Navigation size={14} />
                                <select className="input" value={radius} onChange={e => setRadius(e.target.value)}
                                    style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}>
                                    <option value="500">500m</option>
                                    <option value="1000">1 km</option>
                                    <option value="1500">1.5 km</option>
                                    <option value="3000">3 km</option>
                                    <option value="5000">5 km</option>
                                </select>
                                <span>{locale === 'tr' ? 'yarıçap' : 'radius'}</span>
                                {loading && <Loader2 size={14} className="spin" style={{ marginLeft: 'auto' }} />}
                            </div>

                            {/* Results */}
                            {places.length === 0 && !loading && (
                                <div className="nearby-empty">
                                    <span style={{ fontSize: '2rem' }}>{catInfo?.emoji}</span>
                                    <span>{locale === 'tr' ? 'Yakınızda bulunamadı' : 'Nothing found nearby'}</span>
                                </div>
                            )}

                            <div className="nearby-list">
                                {places.map((p, i) => (
                                    <motion.div key={p.place_id} className="nearby-card" initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                                        <div className="nearby-card-left">
                                            {p.photo_url ? (
                                                <div className="nearby-photo" style={{ backgroundImage: `url(${p.photo_url})` }} />
                                            ) : (
                                                <div className="nearby-photo nearby-photo-empty">{catInfo?.emoji}</div>
                                            )}
                                        </div>
                                        <div className="nearby-card-body">
                                            <h4 className="nearby-name">{p.name}</h4>
                                            <div className="nearby-meta">
                                                {p.rating > 0 && <span className="nearby-rating">⭐ {p.rating}</span>}
                                                <span className="nearby-distance">{p.distanceText}</span>
                                                {p.isOpen !== null && (
                                                    <span className={`nearby-open ${p.isOpen ? 'open' : 'closed'}`}>
                                                        {p.isOpen ? (locale === 'tr' ? 'Açık' : 'Open') : (locale === 'tr' ? 'Kapalı' : 'Closed')}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="nearby-address">{p.address}</p>
                                        </div>
                                        <div className="nearby-card-actions">
                                            <a href={p.directions_url} target="_blank" rel="noopener noreferrer" className="nearby-dir-btn">
                                                <Navigation size={14} />
                                            </a>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}
