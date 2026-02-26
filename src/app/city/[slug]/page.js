'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSpace } from '@/context/SpaceContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import { PIN_TYPES, PIN_STATUSES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { MapPin, Star, Calendar, Image as ImageIcon, Clock, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function CityPage() {
    const searchParams = useSearchParams()
    const cityName = searchParams.get('city') || ''
    const countryName = searchParams.get('country') || ''
    const [pins, setPins] = useState([])
    const [media, setMedia] = useState([])
    const [tab, setTab] = useState('pins')
    const [loading, setLoading] = useState(true)
    const { space } = useSpace()
    const { t } = useLanguage()
    const supabase = createClient()

    useEffect(() => {
        if (!space || !cityName) return
        loadPins()
    }, [space, cityName])

    const loadPins = async () => {
        const { data } = await supabase
            .from('pins')
            .select('*, pin_media(*)')
            .eq('space_id', space.id)
            .eq('city', cityName)
            .order('date_visited', { ascending: false, nullsFirst: false })

        if (data) {
            setPins(data)
            const allMedia = data.flatMap(p => (p.pin_media || []).map(m => ({ ...m, pinTitle: p.title, pinType: p.type })))
            setMedia(allMedia)
        }
        setLoading(false)
    }

    const visitedCount = pins.filter(p => p.status === 'visited').length
    const plannedCount = pins.filter(p => p.status === 'planned').length
    const avgRating = pins.filter(p => p.rating > 0).length > 0
        ? (pins.reduce((sum, p) => sum + (p.rating || 0), 0) / pins.filter(p => p.rating > 0).length).toFixed(1)
        : null

    // Group pins by date for timeline
    const timelineGroups = {}
    pins.forEach(pin => {
        const key = pin.date_visited || 'No date'
        if (!timelineGroups[key]) timelineGroups[key] = []
        timelineGroups[key].push(pin)
    })

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="page">
                    {/* City Header */}
                    <div className="city-header">
                        <h1>{cityName}</h1>
                        {countryName && <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>{countryName}</p>}
                        <div className="city-stats">
                            <div className="city-stat">
                                <span className="city-stat-value">{pins.length}</span>
                                <span className="city-stat-label">{t('pin.pins')}</span>
                            </div>
                            <div className="city-stat">
                                <span className="city-stat-value">{visitedCount}</span>
                                <span className="city-stat-label">{t('pinStatus.visited')}</span>
                            </div>
                            <div className="city-stat">
                                <span className="city-stat-value">{plannedCount}</span>
                                <span className="city-stat-label">{t('pinStatus.planned')}</span>
                            </div>
                            {avgRating && (
                                <div className="city-stat">
                                    <span className="city-stat-value" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        {avgRating} <Star size={18} fill="#FBBF24" color="#FBBF24" />
                                    </span>
                                    <span className="city-stat-label">{t('pin.rating')}</span>
                                </div>
                            )}
                            <div className="city-stat">
                                <span className="city-stat-value">{media.length}</span>
                                <span className="city-stat-label">{t('pin.media')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="tabs" style={{ marginBottom: 24 }}>
                        <button className={`tab ${tab === 'pins' ? 'tab-active' : ''}`} onClick={() => setTab('pins')}>
                            <MapPin size={16} style={{ display: 'inline', verticalAlign: -3, marginRight: 4 }} />
                            {t('pin.pins')}
                        </button>
                        <button className={`tab ${tab === 'album' ? 'tab-active' : ''}`} onClick={() => setTab('album')}>
                            <ImageIcon size={16} style={{ display: 'inline', verticalAlign: -3, marginRight: 4 }} />
                            Album
                        </button>
                        <button className={`tab ${tab === 'timeline' ? 'tab-active' : ''}`} onClick={() => setTab('timeline')}>
                            <Clock size={16} style={{ display: 'inline', verticalAlign: -3, marginRight: 4 }} />
                            Timeline
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
                            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-1)' }} />
                        </div>
                    ) : (
                        <>
                            {/* Pins Tab */}
                            {tab === 'pins' && (
                                <div className="pin-grid">
                                    {pins.map((pin, i) => {
                                        const pinType = PIN_TYPES[pin.type] || PIN_TYPES.memory
                                        const coverImage = pin.pin_media?.[0]?.url
                                        return (
                                            <motion.div
                                                key={pin.id}
                                                className="pin-card"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.04 }}
                                            >
                                                {coverImage && (
                                                    <img src={coverImage} alt={pin.title} className="pin-card-image" />
                                                )}
                                                <div className="pin-card-body">
                                                    <div className="pin-card-type">
                                                        <span style={{ fontSize: '1.1rem' }}>{pinType.emoji}</span>
                                                        <span className="badge badge-primary">{t(`pinType.${pin.type}`)}</span>
                                                        <span className={`badge badge-${pin.status === 'visited' ? 'success' : pin.status === 'planned' ? 'sky' : 'warning'}`} style={{ marginLeft: 'auto' }}>
                                                            {t(`pinStatus.${pin.status}`)}
                                                        </span>
                                                    </div>
                                                    <h4 className="pin-card-title">{pin.title}</h4>
                                                    {pin.notes && <p className="pin-card-notes">{pin.notes}</p>}
                                                    <div className="pin-card-footer">
                                                        {pin.rating > 0 && (
                                                            <div className="stars">
                                                                {[1, 2, 3, 4, 5].map(n => (
                                                                    <Star key={n} size={12} fill={pin.rating >= n ? '#FBBF24' : 'none'} color={pin.rating >= n ? '#FBBF24' : 'var(--text-tertiary)'} />
                                                                ))}
                                                            </div>
                                                        )}
                                                        {pin.date_visited && (
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                                                {formatDate(pin.date_visited)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Album Tab */}
                            {tab === 'album' && (
                                media.length === 0 ? (
                                    <div className="empty-state">
                                        <ImageIcon size={48} className="empty-state-icon" />
                                        <h3>No photos yet</h3>
                                        <p>Upload photos when creating or editing a pin.</p>
                                    </div>
                                ) : (
                                    <div className="album-grid">
                                        {media.map((m, i) => (
                                            <motion.div
                                                key={m.id}
                                                className="album-item"
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.03 }}
                                            >
                                                {m.type === 'video' ? (
                                                    <video src={m.url} controls />
                                                ) : (
                                                    <img src={m.url} alt={m.pinTitle} />
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                )
                            )}

                            {/* Timeline Tab */}
                            {tab === 'timeline' && (
                                <div className="timeline">
                                    {Object.entries(timelineGroups).map(([date, datePins], gi) => (
                                        <motion.div
                                            key={date}
                                            className="timeline-day"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: gi * 0.08 }}
                                        >
                                            <div className="timeline-dot" />
                                            <div className="timeline-date">
                                                {date === 'No date' ? 'Undated' : formatDate(date)}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                {datePins.map(pin => {
                                                    const pinType = PIN_TYPES[pin.type] || PIN_TYPES.memory
                                                    return (
                                                        <div key={pin.id} className="card" style={{ padding: 16 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                                <span>{pinType.emoji}</span>
                                                                <span style={{ fontWeight: 600 }}>{pin.title}</span>
                                                            </div>
                                                            {pin.notes && (
                                                                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{pin.notes}</p>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
    )
}
