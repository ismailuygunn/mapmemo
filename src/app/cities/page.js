'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSpace } from '@/context/SpaceContext'
import { useLanguage } from '@/context/LanguageContext'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { MapPin, ImageIcon, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { groupPinsByCity, getCitySlug } from '@/lib/utils'

import { useAuth } from '@/context/AuthContext'

export default function CitiesPage() {
    const [cities, setCities] = useState([])
    const [loading, setLoading] = useState(true)
    const { space } = useSpace()
    const { user } = useAuth()
    const { t } = useLanguage()
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        if (space || user) loadCities()
    }, [space, user])

    const loadCities = async () => {
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

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="page">
                    <div className="page-header">
                        <h1>🌍 {t('cities.title')}</h1>
                        <p>{t('cities.subtitle')}</p>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
                            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-1)' }} />
                        </div>
                    ) : cities.length === 0 ? (
                        <div className="empty-state">
                            <MapPin size={48} className="empty-state-icon" />
                            <h3>{t('cities.noCities')}</h3>
                            <p>{t('cities.noCitiesDesc')}</p>
                            <button className="btn btn-primary" onClick={() => router.push('/map')}>
                                {t('cities.goToMap')}
                            </button>
                        </div>
                    ) : (
                        <div className="pin-grid">
                            {cities.map((city, i) => {
                                const coverImage = city.pins.find(p => p.pin_media?.length > 0)?.pin_media[0]?.url
                                return (
                                    <motion.div
                                        key={city.slug}
                                        className="pin-card"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => router.push(`/city/${city.slug}?city=${encodeURIComponent(city.city)}&country=${encodeURIComponent(city.country)}`)}
                                    >
                                        <div style={{
                                            height: 160, background: coverImage
                                                ? `url(${coverImage}) center/cover`
                                                : 'linear-gradient(135deg, var(--primary-1), var(--primary-2))',
                                            display: 'flex', alignItems: 'flex-end', padding: 16,
                                        }}>
                                            <div style={{
                                                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
                                                padding: '6px 14px', borderRadius: 20, color: 'white',
                                                fontSize: '0.8125rem', fontWeight: 600,
                                            }}>
                                                {city.pins.length} {t('pin.pins')}
                                            </div>
                                        </div>
                                        <div className="pin-card-body">
                                            <h3 className="pin-card-title">{city.city}</h3>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                {city.country}
                                            </p>
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
