'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useSpace } from '@/context/SpaceContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import {
    MapPin, Plane, Calendar, Users, Sun, Cloud, CloudRain, Snowflake,
    TrendingUp, ArrowRight, Plus, DollarSign, Thermometer, Wind, Droplets
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
    const [trips, setTrips] = useState([])
    const [pins, setPins] = useState([])
    const [members, setMembers] = useState([])
    const [weather, setWeather] = useState(null)
    const [currency, setCurrency] = useState(null)
    const [loading, setLoading] = useState(true)
    const { user, profile } = useAuth()
    const { space } = useSpace()
    const { locale } = useLanguage()
    const router = useRouter()
    const supabase = createClient()
    const t = (tr, en) => locale === 'tr' ? tr : en

    useEffect(() => {
        if (space) loadDashboard()
    }, [space])

    const loadDashboard = async () => {
        setLoading(true)
        const [tripsRes, pinsRes, membersRes] = await Promise.all([
            supabase.from('trips').select('*').eq('space_id', space.id).order('start_date', { ascending: true }),
            supabase.from('pins').select('id, city, type').eq('space_id', space.id),
            supabase.from('space_members').select('*, profiles(display_name, avatar_url)').eq('space_id', space.id),
        ])
        setTrips(tripsRes.data || [])
        setPins(pinsRes.data || [])
        setMembers(membersRes.data || [])

        // Weather for next trip
        const upcoming = (tripsRes.data || []).find(t => t.start_date && new Date(t.start_date) >= new Date())
        if (upcoming?.city) {
            try {
                const wRes = await fetch(`/api/weather?city=${encodeURIComponent(upcoming.city)}`)
                const wData = await wRes.json()
                if (wData.available) setWeather({ ...wData, tripCity: upcoming.city })
            } catch { }
        }

        // Currency
        try {
            const cRes = await fetch('/api/currency?from=TRY&to=EUR')
            const cData = await cRes.json()
            setCurrency(cData)
        } catch { }

        setLoading(false)
    }

    const now = new Date()
    const upcomingTrips = trips.filter(t => t.start_date && new Date(t.start_date) >= now)
    const pastTrips = trips.filter(t => t.end_date && new Date(t.end_date) < now)
    const uniqueCities = [...new Set(trips.map(t => t.city).filter(Boolean))]
    const greeting = now.getHours() < 12 ? t('Günaydın', 'Good morning') : now.getHours() < 18 ? t('İyi günler', 'Good afternoon') : t('İyi akşamlar', 'Good evening')

    const weatherIcon = (main) => {
        if (main?.includes('Rain')) return <CloudRain size={20} />
        if (main?.includes('Snow')) return <Snowflake size={20} />
        if (main?.includes('Cloud')) return <Cloud size={20} />
        return <Sun size={20} />
    }

    const daysUntil = (date) => {
        const diff = Math.ceil((new Date(date) - now) / (1000 * 60 * 60 * 24))
        return diff <= 0 ? t('Bugün!', 'Today!') : `${diff} ${t('gün', 'days')}`
    }

    const containerAnim = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
    const itemAnim = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-main">
                <div className="dash-container">
                    {/* Header */}
                    <motion.div className="dash-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                        <div>
                            <h1 className="dash-greeting">{greeting}, <span className="dash-name">{profile?.display_name || user?.email?.split('@')[0]}</span> 👋</h1>
                            <p className="dash-subtitle">{t('Seyahat maceranı planla', 'Plan your next adventure')}</p>
                        </div>
                        <button className="dash-new-trip-btn" onClick={() => router.push('/planner')}>
                            <Plus size={16} /> {t('Yeni Trip', 'New Trip')}
                        </button>
                    </motion.div>

                    {/* Stats Row */}
                    <motion.div className="dash-stats" variants={containerAnim} initial="hidden" animate="show">
                        {[
                            { icon: <Plane size={20} />, value: trips.length, label: t('Trip', 'Trips'), color: '#818CF8', bg: 'rgba(129,140,248,0.12)' },
                            { icon: <MapPin size={20} />, value: pins.length, label: t('Pin', 'Pins'), color: '#F472B6', bg: 'rgba(244,114,182,0.12)' },
                            { icon: <MapPin size={20} />, value: uniqueCities.length, label: t('Şehir', 'Cities'), color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
                            { icon: <Users size={20} />, value: members.length, label: t('Üye', 'Members'), color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
                        ].map((stat, i) => (
                            <motion.div key={i} className="dash-stat-card" variants={itemAnim}>
                                <div className="dash-stat-icon" style={{ background: stat.bg, color: stat.color }}>{stat.icon}</div>
                                <div className="dash-stat-value">{stat.value}</div>
                                <div className="dash-stat-label">{stat.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Upcoming Trips */}
                    <motion.section className="dash-section" variants={containerAnim} initial="hidden" animate="show">
                        <h2 className="dash-section-title">{t('Yaklaşan Seyahatler', 'Upcoming Trips')} ✈️</h2>
                        {upcomingTrips.length === 0 ? (
                            <div className="dash-empty">
                                <Plane size={40} style={{ color: 'var(--text-tertiary)' }} />
                                <p>{t('Henüz planlanmış trip yok', 'No upcoming trips yet')}</p>
                                <button className="dash-cta-btn" onClick={() => router.push('/planner')}>{t('Trip Planla', 'Plan a Trip')} <ArrowRight size={14} /></button>
                            </div>
                        ) : (
                            <div className="dash-trip-list">
                                {upcomingTrips.slice(0, 4).map((trip, i) => (
                                    <motion.div key={trip.id} className="dash-trip-card" variants={itemAnim} onClick={() => router.push(`/trip/${trip.id}`)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <div className="dash-trip-hero" style={{ backgroundImage: trip.hero_image_url || trip.cover_photo_url ? `url(${trip.hero_image_url || trip.cover_photo_url})` : `linear-gradient(135deg, ${['#4F46E5', '#7C3AED', '#EC4899', '#0D9488', '#F59E0B'][i % 5]}, ${['#7C3AED', '#EC4899', '#F59E0B', '#4F46E5', '#0D9488'][i % 5]})` }}>
                                            <div className="dash-trip-countdown">{daysUntil(trip.start_date)}</div>
                                        </div>
                                        <div className="dash-trip-body">
                                            <h3 className="dash-trip-city">{trip.city}</h3>
                                            {trip.slogan && <p className="dash-trip-slogan">{trip.slogan}</p>}
                                            <div className="dash-trip-dates">
                                                <Calendar size={12} />
                                                {trip.start_date && new Date(trip.start_date).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })}
                                                {trip.end_date && ` — ${new Date(trip.end_date).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })}`}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.section>

                    {/* Widgets Row */}
                    <div className="dash-widgets">
                        {/* Weather Widget */}
                        {weather && weather.forecasts && (
                            <motion.div className="dash-widget dash-weather" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                <h3 className="dash-widget-title">{t('Hava Durumu', 'Weather')} — {weather.tripCity}</h3>
                                <div className="dash-weather-grid">
                                    {weather.forecasts.slice(0, 5).map((f, i) => (
                                        <div key={i} className="dash-weather-day">
                                            <span className="dash-weather-date">{new Date(f.date).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'short' })}</span>
                                            <span className="dash-weather-icon">{weatherIcon(f.weather)}</span>
                                            <span className="dash-weather-temp">{Math.round(f.tempMax)}° / {Math.round(f.tempMin)}°</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Currency Widget */}
                        {currency && currency.popular && (
                            <motion.div className="dash-widget dash-currency" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                                <h3 className="dash-widget-title"><DollarSign size={16} /> {t('Döviz Kurları', 'Exchange Rates')}</h3>
                                <div className="dash-currency-list">
                                    {Object.values(currency.popular).filter(c => c.code !== 'TRY').slice(0, 5).map(c => (
                                        <div key={c.code} className="dash-currency-row">
                                            <span className="dash-currency-code">{c.symbol} {c.code}</span>
                                            <span className="dash-currency-name">{c.name}</span>
                                            <span className="dash-currency-rate">₺{(1 / c.rate).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <motion.div className="dash-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        {[
                            { label: t('Haritayı Aç', 'Open Map'), emoji: '🗺️', href: '/map' },
                            { label: t('Trip Planla', 'Plan Trip'), emoji: '✈️', href: '/planner' },
                            { label: t('Şehirleri Keşfet', 'Explore Cities'), emoji: '🌍', href: '/cities' },
                            { label: t('Meetup Oluştur', 'Create Meetup'), emoji: '📅', href: '/meetups' },
                        ].map(action => (
                            <button key={action.href} className="dash-action-btn" onClick={() => router.push(action.href)}>
                                <span className="dash-action-emoji">{action.emoji}</span>
                                <span>{action.label}</span>
                            </button>
                        ))}
                    </motion.div>
                </div>
            </main>
        </div>
    )
}
