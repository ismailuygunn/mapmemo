'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSpace } from '@/context/SpaceContext'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { MapPin, ImageIcon, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { groupPinsByCity, getCitySlug } from '@/lib/utils'

export default function CitiesPage() {
    const [cities, setCities] = useState([])
    const [loading, setLoading] = useState(true)
    const { space } = useSpace()
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        if (!space) return
        loadCities()
    }, [space])

    const loadCities = async () => {
        const { data: pins } = await supabase
            .from('pins')
            .select('*, pin_media(*)')
            .eq('space_id', space.id)

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
                        <h1>🌍 Your Cities</h1>
                        <p>All the places you've been together</p>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
                            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-1)' }} />
                        </div>
                    ) : cities.length === 0 ? (
                        <div className="empty-state">
                            <MapPin size={48} className="empty-state-icon" />
                            <h3>No cities yet</h3>
                            <p>Add your first pin on the map and your cities will appear here.</p>
                            <button className="btn btn-primary" onClick={() => router.push('/map')}>
                                Go to Map
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
                                                {city.pins.length} pins
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
