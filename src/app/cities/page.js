'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSpace } from '@/context/SpaceContext'
import { useLanguage } from '@/context/LanguageContext'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/layout/Sidebar'
import { MapPin, Image as ImageIcon, Loader2, Camera, Star, ChevronRight, Globe, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { groupPinsByCity, getCitySlug } from '@/lib/utils'

const CITY_GRADIENTS = [
    'linear-gradient(135deg, #0F2847, #1A3A5C)',
    'linear-gradient(135deg, #EC4899, #F43F5E)',
    'linear-gradient(135deg, #0D9488, #06B6D4)',
    'linear-gradient(135deg, #F59E0B, #EF4444)',
    'linear-gradient(135deg, #8B5CF6, #EC4899)',
    'linear-gradient(135deg, #10B981, #3B82F6)',
    'linear-gradient(135deg, #0F2847, #1A3A5C)',
    'linear-gradient(135deg, #7F1D1D, #991B1B)',
]

export default function CitiesPage() {
    const [cities, setCities] = useState([])
    const [loading, setLoading] = useState(true)
    const { space, loading: spaceLoading } = useSpace()
    const { user } = useAuth()
    const { t } = useLanguage()
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        if (spaceLoading) return
        if (space || user) loadCities()
        else setLoading(false)
    }, [space, user, spaceLoading])

    const loadCities = async () => {
        setLoading(true)
        let query = supabase.from('pins').select('*, pin_media(*)')
        if (space) query = query.eq('space_id', space.id)
        else if (user) query = query.eq('user_id', user.id)
        else { setLoading(false); return }

        const { data: pins } = await query
        if (pins) {
            setCities(groupPinsByCity(pins))
        }
        setLoading(false)
    }

    const getPhotoCount = (city) => {
        return city.pins.reduce((sum, p) => sum + (p.pin_media?.length || 0), 0)
    }

    const getPinTypes = (city) => {
        const types = new Set(city.pins.map(p => p.type).filter(Boolean))
        return [...types].slice(0, 3)
    }

    const getTypeEmoji = (type) => {
        const map = { visited: '✅', wishlist: '⭐', favorite: '❤️', food: '🍽️', photo: '📸', hotel: '🏨', museum: '🏛️', shopping: '🛍️', park: '🌿', beach: '🏖️' }
        return map[type] || '📍'
    }

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="page">
                    {/* Premium Header */}
                    <div style={{ marginBottom: 24 }}>
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            style={{
                                borderRadius: 20, overflow: 'hidden', padding: '28px 32px',
                                background: 'linear-gradient(135deg, rgba(15,40,71,0.1), rgba(124,58,237,0.05))',
                                border: '1px solid rgba(15,40,71,0.15)',
                            }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                <div>
                                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <img src="/umae-icon.png?v=2" alt="UMAE" style={{ width: 40, height: 40, borderRadius: 12 }} />
                                        🌍 {t('cities.title')}
                                    </h1>
                                    <p style={{ margin: '4px 0 0', color: 'var(--text-tertiary)', fontSize: '0.88rem' }}>
                                        {t('cities.subtitle')}
                                    </p>
                                </div>
                                {cities.length > 0 && (
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div style={{
                                            background: 'var(--bg-secondary)', borderRadius: 14, padding: '12px 20px',
                                            border: '1px solid var(--border)', textAlign: 'center',
                                        }}>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary-1)' }}>{cities.length}</div>
                                            <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                                                {t('Şehir', 'Cities')}
                                            </div>
                                        </div>
                                        <div style={{
                                            background: 'var(--bg-secondary)', borderRadius: 14, padding: '12px 20px',
                                            border: '1px solid var(--border)', textAlign: 'center',
                                        }}>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#EC4899' }}>
                                                {cities.reduce((sum, c) => sum + c.pins.length, 0)}
                                            </div>
                                            <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                                                {t('Pin', 'Pins')}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
                            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-1)' }} />
                        </div>
                    ) : cities.length === 0 ? (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            style={{
                                textAlign: 'center', padding: '64px 32px',
                                background: 'var(--bg-secondary)', borderRadius: 24,
                                border: '1px solid var(--border)',
                            }}>
                            <Globe size={56} style={{ color: 'var(--text-tertiary)', opacity: 0.3, marginBottom: 16 }} />
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px' }}>{t('cities.noCities')}</h3>
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', maxWidth: 320, margin: '0 auto 20px' }}>
                                {t('cities.noCitiesDesc')}
                            </p>
                            <button className="btn btn-primary" onClick={() => router.push('/map')} style={{ padding: '12px 28px', borderRadius: 14 }}>
                                <MapPin size={16} /> {t('cities.goToMap')}
                            </button>
                        </motion.div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                            {cities.map((city, i) => {
                                const coverImage = city.pins.find(p => p.pin_media?.length > 0)?.pin_media[0]?.url
                                const photoCount = getPhotoCount(city)
                                const pinTypes = getPinTypes(city)
                                return (
                                    <motion.div
                                        key={city.slug}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(0,0,0,0.12)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => router.push(`/city/${city.slug}?city=${encodeURIComponent(city.city)}&country=${encodeURIComponent(city.country)}`)}
                                        style={{
                                            borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border)',
                                            transition: 'all 200ms',
                                        }}>
                                        {/* Cover */}
                                        <div style={{
                                            height: 160, position: 'relative',
                                            background: coverImage
                                                ? `url(${coverImage}) center/cover`
                                                : CITY_GRADIENTS[i % CITY_GRADIENTS.length],
                                        }}>
                                            <div style={{
                                                position: 'absolute', inset: 0,
                                                background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.7))',
                                            }} />
                                            {/* Pin count badge */}
                                            <div style={{
                                                position: 'absolute', top: 12, right: 12,
                                                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                                                padding: '4px 10px', borderRadius: 10, color: 'white',
                                                fontSize: '0.68rem', fontWeight: 700,
                                                display: 'flex', alignItems: 'center', gap: 4,
                                            }}>
                                                <MapPin size={11} /> {city.pins.length}
                                            </div>
                                            {/* Photo count badge */}
                                            {photoCount > 0 && (
                                                <div style={{
                                                    position: 'absolute', top: 12, left: 12,
                                                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                                                    padding: '4px 10px', borderRadius: 10, color: 'white',
                                                    fontSize: '0.68rem', fontWeight: 700,
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                }}>
                                                    <Camera size={11} /> {photoCount}
                                                </div>
                                            )}
                                            {/* City name overlay */}
                                            <div style={{
                                                position: 'absolute', bottom: 14, left: 16,
                                                color: 'white',
                                            }}>
                                                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                                                    {city.city}
                                                </h3>
                                                <p style={{ fontSize: '0.72rem', opacity: 0.85, margin: '2px 0 0' }}>{city.country}</p>
                                            </div>
                                        </div>

                                        {/* Body */}
                                        <div style={{ padding: '14px 16px' }}>
                                            {/* Pin type badges */}
                                            <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
                                                {pinTypes.map((type, ti) => (
                                                    <span key={ti} style={{
                                                        fontSize: '0.62rem', padding: '3px 8px', borderRadius: 6,
                                                        background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                                                        fontWeight: 600,
                                                    }}>{getTypeEmoji(type)} {type}</span>
                                                ))}
                                                {city.pins.length > 3 && (
                                                    <span style={{
                                                        fontSize: '0.62rem', padding: '3px 8px', borderRadius: 6,
                                                        background: 'rgba(15,40,71,0.08)', color: '#4A7FBF',
                                                        fontWeight: 600,
                                                    }}>+{city.pins.length - 3} daha</span>
                                                )}
                                            </div>

                                            {/* Action footer */}
                                            <div style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                paddingTop: 10, borderTop: '1px solid var(--border)',
                                            }}>
                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                                    {t('Keşfet', 'Explore')}
                                                </span>
                                                <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
            <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
    )
}
