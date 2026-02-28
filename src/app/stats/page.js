'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useSpace } from '@/context/SpaceContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import { motion } from 'framer-motion'

const ACHIEVEMENTS = [
    { id: 'first_trip', emoji: '🎒', name: 'İlk Macera', nameEn: 'First Adventure', desc: 'İlk trip\'i oluştur', check: s => s.trips >= 1 },
    { id: 'explorer_5', emoji: '🗺️', name: '5 Şehir', nameEn: '5 Cities', desc: '5 farklı şehir ziyaret et', check: s => s.cities >= 5 },
    { id: 'explorer_10', emoji: '🌍', name: '10 Şehir', nameEn: '10 Cities', desc: '10 farklı şehir', check: s => s.cities >= 10 },
    { id: 'pin_master', emoji: '📌', name: 'Pin Ustası', nameEn: 'Pin Master', desc: '50+ pin ekle', check: s => s.pins >= 50 },
    { id: 'pin_legend', emoji: '🏆', name: 'Pin Efsanesi', nameEn: 'Pin Legend', desc: '100+ pin ekle', check: s => s.pins >= 100 },
    { id: 'food_explorer', emoji: '🍽️', name: 'Gurme Gezgin', nameEn: 'Food Explorer', desc: '10+ restoran pin\'i', check: s => s.foodPins >= 10 },
    { id: 'photographer', emoji: '📸', name: 'Fotoğrafçı', nameEn: 'Photographer', desc: '20+ fotoğraf yükle', check: s => s.photos >= 20 },
    { id: 'social', emoji: '👥', name: 'Sosyal Gezgin', nameEn: 'Social Traveler', desc: '3+ space üyesi', check: s => s.members >= 3 },
    { id: 'planner', emoji: '📋', name: 'Plancı', nameEn: 'Planner', desc: '5+ trip planla', check: s => s.trips >= 5 },
    { id: 'veteran', emoji: '⭐', name: 'Veteran', nameEn: 'Veteran', desc: '20+ trip planla', check: s => s.trips >= 20 },
]

export default function StatsPage() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()
    const { space } = useSpace()
    const { t, locale } = useLanguage()
    const supabase = createClient()

    useEffect(() => { if (space || user) loadStats() }, [space, user])

    const loadStats = async () => {
        setLoading(true)
        try {
            const tripsQuery = space
                ? supabase.from('trips').select('id, city, start_date, end_date, created_at').eq('space_id', space.id)
                : supabase.from('trips').select('id, city, start_date, end_date, created_at').eq('created_by', user.id)
            const pinsQuery = space
                ? supabase.from('pins').select('id, type, city, created_at').eq('space_id', space.id)
                : supabase.from('pins').select('id, type, city, created_at').eq('user_id', user.id)
            const membersQuery = space
                ? supabase.from('space_members').select('id').eq('space_id', space.id)
                : Promise.resolve({ data: [] })
            const photosQuery = space
                ? supabase.from('trip_photos').select('id').eq('space_id', space.id)
                : supabase.from('trip_photos').select('id').eq('user_id', user.id)

            const [tripsRes, pinsRes, membersRes, photosRes] = await Promise.all([
                tripsQuery, pinsQuery, membersQuery, photosQuery,
            ])

            const trips = tripsRes.data || []
            const pins = pinsRes.data || []
            const members = membersRes.data || []
            const photos = photosRes.data || []

            const uniqueCities = [...new Set(trips.map(t => t.city).filter(Boolean).flatMap(c => c.split(' → ')))]
            const foodPins = pins.filter(p => ['restaurant', 'cafe', 'bar', 'food'].includes(p.type))
            const pinCities = [...new Set(pins.map(p => p.city).filter(Boolean))]

            // Monthly trips
            const monthlyTrips = {}
            trips.forEach(t => {
                const m = t.created_at?.substring(0, 7) // YYYY-MM
                if (m) monthlyTrips[m] = (monthlyTrips[m] || 0) + 1
            })

            setStats({
                trips: trips.length,
                cities: uniqueCities.length,
                cityList: uniqueCities,
                pins: pins.length,
                pinCities: pinCities.length,
                members: members.length,
                photos: photos.length,
                foodPins: foodPins.length,
                monthlyTrips,
                recentTrips: trips.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5),
            })
        } catch (err) {
            console.error('Stats error:', err)
        }
        setLoading(false)
    }

    const earned = useMemo(() => {
        if (!stats) return []
        return ACHIEVEMENTS.filter(a => a.check(stats))
    }, [stats])

    const locked = useMemo(() => {
        if (!stats) return ACHIEVEMENTS
        return ACHIEVEMENTS.filter(a => !a.check(stats))
    }, [stats])

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-main">
                <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px 100px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <img src="/umae-icon.png" alt="UMAE" style={{ width: 36, height: 36, borderRadius: 10 }} />
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                            {locale === 'tr' ? 'Seyahat İstatistikleri' : 'Travel Statistics'}
                        </h1>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}>⏳ {locale === 'tr' ? 'Yükleniyor...' : 'Loading...'}</div>
                    ) : stats && (
                        <>
                            {/* Stats Grid */}
                            <div className="stats-grid">
                                {[
                                    { value: stats.trips, label: locale === 'tr' ? 'Trip' : 'Trips', emoji: '✈️', color: '#D4A853' },
                                    { value: stats.cities, label: locale === 'tr' ? 'Şehir' : 'Cities', emoji: '🏙️', color: '#F472B6' },
                                    { value: stats.pins, label: locale === 'tr' ? 'Pin' : 'Pins', emoji: '📌', color: '#34D399' },
                                    { value: stats.photos, label: locale === 'tr' ? 'Fotoğraf' : 'Photos', emoji: '📸', color: '#FBBF24' },
                                    { value: stats.members, label: locale === 'tr' ? 'Üye' : 'Members', emoji: '👥', color: '#60A5FA' },
                                    { value: stats.foodPins, label: locale === 'tr' ? 'Restoran' : 'Restaurants', emoji: '🍽️', color: '#F97316' },
                                ].map((s, i) => (
                                    <motion.div key={i} className="stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.08 }} style={{ borderTop: `3px solid ${s.color}` }}>
                                        <span className="stat-emoji">{s.emoji}</span>
                                        <span className="stat-value">{s.value}</span>
                                        <span className="stat-label">{s.label}</span>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Cities visited */}
                            {stats.cityList.length > 0 && (
                                <div className="stats-section">
                                    <h3>🏙️ {locale === 'tr' ? 'Ziyaret Edilen Şehirler' : 'Cities Visited'}</h3>
                                    <div className="stats-city-chips">
                                        {stats.cityList.map(c => (
                                            <span key={c} className="stats-city-chip">📍 {c}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Achievements */}
                            <div className="stats-section">
                                <h3>🏅 {locale === 'tr' ? 'Rozetler' : 'Achievements'} <span className="stats-badge-count">{earned.length}/{ACHIEVEMENTS.length}</span></h3>
                                <div className="stats-achievements">
                                    {earned.map((a, i) => (
                                        <motion.div key={a.id} className="achievement-card earned" initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                                            <span className="achievement-emoji">{a.emoji}</span>
                                            <span className="achievement-name">{locale === 'tr' ? a.name : a.nameEn}</span>
                                            <span className="achievement-check">✅</span>
                                        </motion.div>
                                    ))}
                                    {locked.map(a => (
                                        <div key={a.id} className="achievement-card locked">
                                            <span className="achievement-emoji" style={{ filter: 'grayscale(1)', opacity: 0.4 }}>{a.emoji}</span>
                                            <span className="achievement-name" style={{ opacity: 0.4 }}>{locale === 'tr' ? a.name : a.nameEn}</span>
                                            <span className="achievement-desc">{a.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Trips */}
                            {stats.recentTrips.length > 0 && (
                                <div className="stats-section">
                                    <h3>🕐 {locale === 'tr' ? 'Son Trip\'ler' : 'Recent Trips'}</h3>
                                    <div className="stats-recent">
                                        {stats.recentTrips.map(trip => (
                                            <div key={trip.id} className="stats-recent-card" onClick={() => window.location.href = `/trip/${trip.id}`}>
                                                <span className="stats-recent-city">📍 {trip.city}</span>
                                                <span className="stats-recent-date">{trip.start_date ? new Date(trip.start_date).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' }) : ''}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}
