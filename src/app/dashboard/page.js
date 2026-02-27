'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useSpace } from '@/context/SpaceContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import {
    MapPin, Plane, Calendar, Users, Sun, Cloud, CloudRain, Snowflake,
    TrendingUp, ArrowRight, Plus, DollarSign, Thermometer, Wind, Droplets,
    Sparkles, Bus, Car, Train, Utensils, Ticket, Bed, Lightbulb, ChevronRight,
    Send, X, Edit3, Check, Star, Loader2, RefreshCw, Wallet, Clock, Shield,
    Globe, Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const CATEGORY_ICONS = {
    transport: Bus, food: Utensils, activity: Ticket, accommodation: Bed, hack: Lightbulb,
}
const CATEGORY_COLORS = {
    transport: { bg: 'rgba(99,102,241,0.12)', color: '#818CF8' },
    food: { bg: 'rgba(251,146,60,0.12)', color: '#FB923C' },
    activity: { bg: 'rgba(52,211,153,0.12)', color: '#34D399' },
    accommodation: { bg: 'rgba(244,114,182,0.12)', color: '#F472B6' },
    hack: { bg: 'rgba(250,204,21,0.12)', color: '#FACC15' },
}

export default function DashboardPage() {
    const [trips, setTrips] = useState([])
    const [pins, setPins] = useState([])
    const [members, setMembers] = useState([])
    const [weather, setWeather] = useState(null)
    const [currency, setCurrency] = useState(null)
    const [loading, setLoading] = useState(true)

    // Quick tips
    const [quickTipsCity, setQuickTipsCity] = useState('')
    const [quickTips, setQuickTips] = useState(null)
    const [tipsLoading, setTipsLoading] = useState(false)
    const [tipsError, setTipsError] = useState('')
    const [dismissedTips, setDismissedTips] = useState([])
    const [savedTips, setSavedTips] = useState([])
    const [userSpaces, setUserSpaces] = useState([])
    const [showAssignModal, setShowAssignModal] = useState(false)

    const [quickPlanDeal, setQuickPlanDeal] = useState(null)
    const [quickPlanTempo, setQuickPlanTempo] = useState('balanced')
    const [quickPlanBudget, setQuickPlanBudget] = useState('mid')

    const { user, profile } = useAuth()
    const { space } = useSpace()
    const { locale } = useLanguage()
    const router = useRouter()
    const supabase = createClient()
    const t = (tr, en) => locale === 'tr' ? tr : en

    useEffect(() => {
        if (space || user) loadDashboard()
        if (user?.id) {
            loadUserSpaces()
        }
    }, [space, user?.id])

    useEffect(() => {
        const saved = localStorage.getItem('naviso-saved-tips')
        if (saved) setSavedTips(JSON.parse(saved))
    }, [])

    const loadDashboard = async () => {
        setLoading(true)
        const filter = space ? { key: 'space_id', val: space.id } : { key: 'created_by', val: user?.id }
        if (!filter.val) { setLoading(false); return }
        const [tripsRes, pinsRes, membersRes] = await Promise.all([
            supabase.from('trips').select('*').eq(filter.key, filter.val).order('start_date', { ascending: true }),
            supabase.from('pins').select('id, city, type').eq(filter.key === 'created_by' ? 'user_id' : 'space_id', filter.val),
            space ? supabase.from('space_members').select('*, profiles(display_name, avatar_url)').eq('space_id', space.id) : Promise.resolve({ data: [] }),
        ])
        setTrips(tripsRes.data || [])
        setPins(pinsRes.data || [])
        setMembers(membersRes.data || [])

        const upcoming = (tripsRes.data || []).find(t => t.start_date && new Date(t.start_date) >= new Date())
        if (upcoming?.city) {
            try {
                const params = new URLSearchParams({ city: upcoming.city })
                if (upcoming.start_date) params.append('startDate', upcoming.start_date)
                if (upcoming.end_date) params.append('endDate', upcoming.end_date)
                const wRes = await fetch(`/api/weather?${params}`)
                const wData = await wRes.json()
                if (wData.available) setWeather({ ...wData, tripCity: upcoming.city })
            } catch { }
        }

        try {
            const cRes = await fetch('/api/currency?from=TRY&to=EUR')
            const cData = await cRes.json()
            setCurrency(cData)
        } catch { }
        setLoading(false)
    }

    const loadUserSpaces = async () => {
        try {
            const { data: memberships } = await supabase.from('space_members').select('space_id').eq('user_id', user.id)
            if (memberships?.length > 0) {
                const { data: spaces } = await supabase.from('spaces').select('id, name').in('id', memberships.map(m => m.space_id))
                setUserSpaces(spaces || [])
            }
        } catch { }
    }

    // ─── Flight Deals (cached + multi-source) ───


    // ─── Quick Tips (weather-aware) ───
    const loadQuickTips = async (city) => {
        if (!city.trim()) return
        setTipsLoading(true)
        setTipsError('')
        setDismissedTips([])
        try {
            // Get weather for the city first
            let weatherContext = ''
            try {
                const wRes = await fetch(`/api/weather?city=${encodeURIComponent(city)}`)
                const wData = await wRes.json()
                if (wData.available && wData.forecasts?.length > 0) {
                    const avg = wData.forecasts.reduce((s, f) => s + ((f.tempMax + f.tempMin) / 2), 0) / wData.forecasts.length
                    const hasRain = wData.forecasts.some(f => f.weather?.includes('Rain'))
                    const hasSnow = wData.forecasts.some(f => f.weather?.includes('Snow'))
                    weatherContext = `Current weather: avg ${Math.round(avg)}°C. ${hasRain ? 'Rain expected.' : ''} ${hasSnow ? 'Snow expected.' : ''} ${avg < 10 ? 'COLD — suggest warm clothing.' : avg > 30 ? 'HOT — suggest light clothing.' : 'Mild weather.'}`
                }
            } catch { }

            const res = await fetch('/api/ai/quick-tips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city: city.trim(), locale, weatherContext }),
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            setQuickTips(data)
            toast.success(`${city} ${t('önerileri hazır!', 'tips ready!')} ✨`)
        } catch (err) {
            setTipsError(err.message)
            toast.error(t('Öneri yüklenemedi', 'Could not load tips'))
        }
        setTipsLoading(false)
    }

    const dismissTip = (idx) => setDismissedTips(prev => [...prev, idx])
    const saveTip = (tip) => {
        const updated = [...savedTips, { ...tip, city: quickTips?.city, savedAt: new Date().toISOString() }]
        setSavedTips(updated)
        localStorage.setItem('naviso-saved-tips', JSON.stringify(updated))
        toast.success(t('İpucu kaydedildi!', 'Tip saved!'))
    }
    const planFromTips = () => quickTips?.city && router.push(`/planner?city=${encodeURIComponent(quickTips.city)}`)
    const assignToGroup = async (spaceId) => {
        if (!quickTips) return
        try {
            await supabase.from('pins').insert({ space_id: spaceId, city: quickTips.city, type: 'tip', notes: JSON.stringify(quickTips), user_id: user.id })
            toast.success(t('Gruba atandı!', 'Assigned to group!'))
        } catch { toast.success(t('Kaydedildi!', 'Saved!')) }
        setShowAssignModal(false)
    }

    const now = new Date()
    const upcomingTrips = trips.filter(t => t.start_date && new Date(t.start_date) >= now)
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

    const formatPrice = (price) => {
        return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)
    }

    const containerAnim = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
    const itemAnim = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-main">
                <div className="dash-container">
                    {/* ── Header ── */}
                    <motion.div className="dash-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                        <div>
                            <h1 className="dash-greeting">{greeting}, <span className="dash-name">{profile?.display_name || user?.email?.split('@')[0]}</span> 👋</h1>
                            <p className="dash-subtitle">{t('Seyahat maceranı planla', 'Plan your next adventure')}</p>
                        </div>
                        <button className="dash-new-trip-btn" onClick={() => router.push('/planner')}>
                            <Plus size={16} /> {t('Yeni Trip', 'New Trip')}
                        </button>
                    </motion.div>

                    {/* ── Stats ── */}
                    <motion.div className="dash-stats" variants={containerAnim} initial="hidden" animate="show">
                        {[
                            { icon: <Plane size={20} />, value: trips.length, label: t('Trip', 'Trips'), color: '#818CF8', bg: 'rgba(129,140,248,0.12)' },
                            { icon: <MapPin size={20} />, value: pins.length, label: t('Pin', 'Pins'), color: '#F472B6', bg: 'rgba(244,114,182,0.12)' },
                            { icon: <Globe size={20} />, value: uniqueCities.length, label: t('Şehir', 'Cities'), color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
                            { icon: <Users size={20} />, value: members.length, label: t('Üye', 'Members'), color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
                        ].map((stat, i) => (
                            <motion.div key={i} className="dash-stat-card" variants={itemAnim}>
                                <div className="dash-stat-icon" style={{ background: stat.bg, color: stat.color }}>{stat.icon}</div>
                                <div className="dash-stat-value">{stat.value}</div>
                                <div className="dash-stat-label">{stat.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>




                    {/* ══ AI QUICK TIPS ══ */}
                    {/* ═══════════════════════════════════════ */}
                    <motion.section className="dash-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <h2 className="dash-section-title" style={{ margin: 0 }}>
                                <Sparkles size={18} style={{ color: '#FBBF24' }} /> {t('Hızlı Gezi Önerileri', 'Quick Travel Tips')}
                            </h2>
                            {quickTips && (
                                <button className="btn btn-ghost" onClick={() => loadQuickTips(quickTipsCity)} disabled={tipsLoading} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                                    <RefreshCw size={12} /> {t('Yenile', 'Refresh')}
                                </button>
                            )}
                        </div>

                        {/* City Search */}
                        <div style={{
                            display: 'flex', gap: 8, marginBottom: 16,
                            background: 'var(--bg-secondary)', borderRadius: 14,
                            padding: '6px 6px 6px 16px', border: '1px solid var(--border)',
                        }}>
                            <MapPin size={18} style={{ color: 'var(--text-tertiary)', marginTop: 8, flexShrink: 0 }} />
                            <input
                                type="text"
                                placeholder={t('Şehir yaz... (ör: Kapadokya, Tokyo)', 'Type a city...')}
                                value={quickTipsCity}
                                onChange={e => setQuickTipsCity(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && loadQuickTips(quickTipsCity)}
                                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.88rem', padding: '8px 0' }}
                            />
                            <button className="btn btn-primary" onClick={() => loadQuickTips(quickTipsCity)} disabled={tipsLoading || !quickTipsCity.trim()} style={{ borderRadius: 10, padding: '8px 16px', fontSize: '0.8rem' }}>
                                {tipsLoading ? <Loader2 size={14} className="spin" /> : <><Sparkles size={14} /> {t('Öner', 'Suggest')}</>}
                            </button>
                        </div>

                        {tipsError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#EF4444', fontSize: '0.78rem', marginBottom: 12 }}>⚠️ {tipsError}</motion.p>}

                        <AnimatePresence>
                            {quickTips && (
                                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                    {/* City Header */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                        borderRadius: 16, padding: '20px 24px', marginBottom: 16,
                                        color: 'white', position: 'relative', overflow: 'hidden',
                                    }}>
                                        <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                                        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>📍 {quickTips.city}</h3>
                                        {quickTips.slogan && <p style={{ fontSize: '0.82rem', opacity: 0.8, fontStyle: 'italic', marginBottom: 8 }}>"{quickTips.slogan}"</p>}
                                        {quickTips.dailyBudget && (
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                                                <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '4px 12px', fontSize: '0.72rem', backdropFilter: 'blur(4px)' }}>
                                                    💰 {t('Ultra Bütçe', 'Ultra Budget')}: {quickTips.dailyBudget.ultraBudget}
                                                </span>
                                                <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '4px 12px', fontSize: '0.72rem', backdropFilter: 'blur(4px)' }}>
                                                    ✨ {t('Rahat', 'Comfortable')}: {quickTips.dailyBudget.comfortable}
                                                </span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                                            <button onClick={planFromTips} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, padding: '8px 16px', color: 'white', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Plane size={14} /> {t('Buradan Planla', 'Plan from Here')}
                                            </button>
                                            <button onClick={() => setShowAssignModal(true)} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 16px', color: 'white', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Users size={14} /> {t('Gruba Ata', 'Assign to Group')}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tips Cards */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 16 }}>
                                        {(quickTips.quickTips || []).map((tip, idx) => {
                                            if (dismissedTips.includes(idx)) return null
                                            const cat = CATEGORY_COLORS[tip.category] || CATEGORY_COLORS.hack
                                            const CatIcon = CATEGORY_ICONS[tip.category] || Lightbulb
                                            return (
                                                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                                    style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: '16px 18px', border: '1px solid var(--border)', position: 'relative' }}>
                                                    <button onClick={() => dismissTip(idx)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 2 }}><X size={13} /></button>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                        <div style={{ width: 32, height: 32, borderRadius: 10, background: cat.bg, color: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CatIcon size={16} /></div>
                                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{tip.emoji} {tip.title}</span>
                                                    </div>
                                                    <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 10px' }}>{tip.description}</p>
                                                    {tip.savingsEstimate && (
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(52,211,153,0.12)', color: '#34D399', borderRadius: 8, padding: '3px 10px', fontSize: '0.68rem', fontWeight: 600 }}>
                                                            <Wallet size={11} /> {tip.savingsEstimate}
                                                        </div>
                                                    )}
                                                    <button onClick={() => saveTip(tip)} style={{ position: 'absolute', bottom: 10, right: 12, background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                        <Star size={12} /> {t('Kaydet', 'Save')}
                                                    </button>
                                                </motion.div>
                                            )
                                        })}
                                    </div>

                                    {/* Detail sections */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12, marginBottom: 16 }}>
                                        {quickTips.budgetTransport && (
                                            <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: '16px 18px', border: '1px solid var(--border)' }}>
                                                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>🚌 {t('Ulaşım', 'Transport')}</h4>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 6 }}>{quickTips.budgetTransport.cheapestFromIstanbul}</p>
                                                <p style={{ fontSize: '0.73rem', color: 'var(--text-tertiary)', marginBottom: 6 }}>🏙️ {quickTips.budgetTransport.localTransport}</p>
                                                {(quickTips.budgetTransport.tips || []).map((tip, i) => <p key={i} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 2 }}>💡 {tip}</p>)}
                                            </div>
                                        )}
                                        {quickTips.cheapEats?.length > 0 && (
                                            <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: '16px 18px', border: '1px solid var(--border)' }}>
                                                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>🍽️ {t('Ucuz Yemek', 'Cheap Eats')}</h4>
                                                {quickTips.cheapEats.slice(0, 4).map((eat, i) => (
                                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                                                        <div><span style={{ fontSize: '0.76rem', fontWeight: 600 }}>{eat.name}</span><span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginLeft: 6 }}>{eat.dish}</span></div>
                                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34D399', background: 'rgba(52,211,153,0.1)', padding: '2px 8px', borderRadius: 6 }}>{eat.price}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {quickTips.freeActivities?.length > 0 && (
                                            <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: '16px 18px', border: '1px solid var(--border)' }}>
                                                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8 }}>🎯 {t('Ücretsiz Aktiviteler', 'Free Activities')}</h4>
                                                {quickTips.freeActivities.slice(0, 4).map((act, i) => (
                                                    <div key={i} style={{ marginBottom: 8 }}>
                                                        <span style={{ fontSize: '0.76rem', fontWeight: 600 }}>{act.name}</span>
                                                        <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', margin: '2px 0 0', lineHeight: 1.4 }}>{act.description} · <span style={{ color: 'var(--primary-1)' }}>{act.bestTime}</span></p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Assign Modal */}
                        <AnimatePresence>
                            {showAssignModal && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
                                    onClick={() => setShowAssignModal(false)}>
                                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                                        onClick={e => e.stopPropagation()}
                                        style={{ background: 'var(--bg-primary)', borderRadius: 20, padding: 24, minWidth: 320, maxWidth: 400, border: '1px solid var(--border)' }}>
                                        <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>👥 {t('Gruba Ata', 'Assign to Group')}</h3>
                                        {userSpaces.length === 0 ? (
                                            <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>{t('Henüz grubun yok.', 'No groups yet.')}</p>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {userSpaces.map(s => (
                                                    <button key={s.id} onClick={() => assignToGroup(s.id)}
                                                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                                                        <Users size={16} style={{ color: 'var(--primary-1)' }} />
                                                        {s.name}
                                                        <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }} />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        <button onClick={() => setShowAssignModal(false)} style={{ marginTop: 16, width: '100%', padding: 10, background: 'var(--bg-tertiary)', border: 'none', borderRadius: 10, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                            {t('İptal', 'Cancel')}
                                        </button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.section>

                    {/* ── Upcoming Trips ── */}
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

                    {/* ── Widgets ── */}
                    <div className="dash-widgets">
                        {weather && weather.forecasts && (
                            <motion.div className="dash-widget dash-weather" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                <h3 className="dash-widget-title">
                                    {t('Hava Durumu', 'Weather')} — {weather.tripCity}
                                    {weather.isHistorical && (
                                        <span style={{ fontSize: '0.62rem', color: '#F59E0B', marginLeft: 8, fontWeight: 400 }}>
                                            📊 {t('Geçen yılın verileri', 'Last year\'s data')}
                                        </span>
                                    )}
                                </h3>
                                <div className="dash-weather-grid">
                                    {weather.forecasts.slice(0, 7).map((f, i) => (
                                        <div key={i} className="dash-weather-day">
                                            <span className="dash-weather-date">{new Date(f.date).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'short' })}</span>
                                            <span className="dash-weather-icon">{weatherIcon(f.weather)}</span>
                                            <span className="dash-weather-temp">{Math.round(f.tempMax)}° / {Math.round(f.tempMin)}°</span>
                                        </div>
                                    ))}
                                </div>
                                {weather.isHistorical && (
                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: 8, fontStyle: 'italic' }}>
                                        ℹ️ {t('Tahmin verileri geçen yılın aynı tarihlerine dayanmaktadır.', 'Forecast based on same dates from last year.')}
                                    </p>
                                )}
                            </motion.div>
                        )}

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

                    {/* ── Quick Actions ── */}
                    <motion.div className="dash-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        {[
                            { label: t('Haritayı Aç', 'Open Map'), emoji: '🗺️', href: '/map' },
                            { label: t('Trip Planla', 'Plan Trip'), emoji: '✈️', href: '/planner' },
                            { label: t('Şehirleri Keşfet', 'Explore Cities'), emoji: '🌍', href: '/cities' },
                            { label: t('Gruplar', 'Groups'), emoji: '👥', href: '/spaces' },
                        ].map(action => (
                            <button key={action.href} className="dash-action-btn" onClick={() => router.push(action.href)}>
                                <span className="dash-action-emoji">{action.emoji}</span>
                                <span>{action.label}</span>
                            </button>
                        ))}
                    </motion.div>
                </div>
            </main >


            {/* ═══ QUICK PLAN MODAL ═══ */}
            < AnimatePresence >
                {quickPlanDeal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 200,
                            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: 20,
                        }}
                        onClick={() => setQuickPlanDeal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: 'var(--bg-secondary)', borderRadius: 24,
                                width: '100%', maxWidth: 480, overflow: 'hidden',
                                border: '1px solid var(--border)',
                                boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
                            }}
                        >
                            {/* Modal Header — gradient */}
                            <div style={{
                                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                padding: '24px 28px', color: 'white', position: 'relative',
                            }}>
                                <button onClick={() => setQuickPlanDeal(null)} style={{
                                    position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.15)',
                                    border: 'none', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', color: 'white',
                                }}>
                                    <X size={16} />
                                </button>
                                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
                                    ✈️ {quickPlanDeal.city}
                                </h2>
                                <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '0.82rem' }}>
                                    {quickPlanDeal.country} · ₺{formatPrice(quickPlanDeal.price)}
                                </p>
                                <div style={{ display: 'flex', gap: 8, marginTop: 10, fontSize: '0.75rem', opacity: 0.7 }}>
                                    <span>📅 {new Date(quickPlanDeal.departDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} → {new Date(quickPlanDeal.returnDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                                    <span>🛫 {quickPlanDeal.airlines?.join(', ')}</span>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div style={{ padding: '20px 28px 28px' }}>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                                    {t('Bu uçuş için hızlıca plan oluşturun. Tarih ve şehir otomatik dolduruldu!', 'Quickly create a plan for this flight. Date and city are auto-filled!')}
                                </p>

                                {/* Tempo */}
                                <div style={{ marginBottom: 14 }}>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--text-primary)' }}>
                                        🏃 {t('Tempo', 'Tempo')}
                                    </label>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {[{ v: 'relaxed', l: t('🧘 Rahat', '🧘 Relaxed') }, { v: 'balanced', l: t('⚖️ Dengeli', '⚖️ Balanced') }, { v: 'packed', l: t('⚡ Yoğun', '⚡ Packed') }].map(o => (
                                            <button key={o.v} onClick={() => setQuickPlanTempo(o.v)}
                                                style={{
                                                    flex: 1, padding: '8px 6px', borderRadius: 10, border: 'none',
                                                    cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                                                    background: quickPlanTempo === o.v ? 'var(--primary-1)' : 'var(--bg-tertiary)',
                                                    color: quickPlanTempo === o.v ? 'white' : 'var(--text-secondary)',
                                                    transition: 'all 150ms',
                                                }}>
                                                {o.l}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Budget */}
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--text-primary)' }}>
                                        💰 {t('Bütçe', 'Budget')}
                                    </label>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {[{ v: 'budget', l: t('💵 Ekonomik', '💵 Budget') }, { v: 'mid', l: t('💰 Orta', '💰 Mid') }, { v: 'luxury', l: t('💎 Lüks', '💎 Luxury') }].map(o => (
                                            <button key={o.v} onClick={() => setQuickPlanBudget(o.v)}
                                                style={{
                                                    flex: 1, padding: '8px 6px', borderRadius: 10, border: 'none',
                                                    cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                                                    background: quickPlanBudget === o.v ? '#10B981' : 'var(--bg-tertiary)',
                                                    color: quickPlanBudget === o.v ? 'white' : 'var(--text-secondary)',
                                                    transition: 'all 150ms',
                                                }}>
                                                {o.l}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <a
                                        href={`https://www.google.com/travel/flights?q=Flights+from+${getOriginCity()}+to+${quickPlanDeal.destination}+on+${quickPlanDeal.departDate}+return+${quickPlanDeal.returnDate}&curr=TRY`}
                                        target="_blank" rel="noopener noreferrer"
                                        style={{
                                            flex: 1, padding: '12px', borderRadius: 12,
                                            background: '#10B981', color: 'white',
                                            textDecoration: 'none', fontSize: '0.82rem', fontWeight: 700,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                        }}
                                    >
                                        🎫 {t('Bilet Al', 'Buy Ticket')}
                                    </a>
                                    <button
                                        onClick={() => {
                                            const params = new URLSearchParams({
                                                city: quickPlanDeal.city,
                                                depart: quickPlanDeal.departDate,
                                                return: quickPlanDeal.returnDate,
                                                tempo: quickPlanTempo,
                                                budget: quickPlanBudget,
                                                departure: profile?.home_city || 'Istanbul',
                                            })
                                            setQuickPlanDeal(null)
                                            router.push(`/planner?${params}`)
                                        }}
                                        style={{
                                            flex: 1, padding: '12px', borderRadius: 12,
                                            background: 'var(--primary-1)', color: 'white',
                                            border: 'none', fontSize: '0.82rem', fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                        }}
                                    >
                                        <Plane size={16} /> {t('Plan Oluştur', 'Create Plan')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )
                }
            </AnimatePresence >
        </div >
    )
}
