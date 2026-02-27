'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import {
    Search, Plane, Calendar, Clock, MapPin, Filter,
    Shield, X, ChevronDown, Loader2, ExternalLink, Zap,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const ORIGIN_CITIES = [
    { code: 'IST', name: 'İstanbul (IST)', emoji: '🌉' },
    { code: 'SAW', name: 'İstanbul (SAW)', emoji: '🛬' },
    { code: 'ESB', name: 'Ankara', emoji: '🏛️' },
    { code: 'ADB', name: 'İzmir', emoji: '🌊' },
    { code: 'AYT', name: 'Antalya', emoji: '🏖️' },
    { code: 'ADA', name: 'Adana', emoji: '🌶️' },
    { code: 'TZX', name: 'Trabzon', emoji: '⛰️' },
    { code: 'GZT', name: 'Gaziantep', emoji: '🍽️' },
    { code: 'BJV', name: 'Bodrum', emoji: '⛵' },
    { code: 'DLM', name: 'Dalaman', emoji: '🏝️' },
    { code: 'ASR', name: 'Kayseri', emoji: '🗻' },
    { code: 'KYA', name: 'Konya', emoji: '🕌' },
    { code: 'SZF', name: 'Samsun', emoji: '🚢' },
    { code: 'DIY', name: 'Diyarbakır', emoji: '🏰' },
]

const VISA_COLORS = {
    domestic: '#6366F1', visa_free: '#22C55E',
    visa_on_arrival: '#F59E0B', visa_required: '#EF4444',
}

const AIRLINES = {
    TK: '🇹🇷 Turkish Airlines', PC: '🟡 Pegasus', AJ: '🔵 AnadoluJet',
    XQ: '🌞 SunExpress', LH: '🇩🇪 Lufthansa', BA: '🇬🇧 British Airways',
    AF: '🇫🇷 Air France', KL: '🇳🇱 KLM', EK: '🇦🇪 Emirates',
    QR: '🇶🇦 Qatar Airways', W6: '🟣 Wizz Air', FR: '💛 Ryanair',
    OS: '🇦🇹 Austrian', SU: '🇷🇺 Aeroflot', MS: '🇪🇬 EgyptAir',
    RJ: '🇯🇴 Royal Jordanian', FZ: '🇦🇪 flydubai', PS: '🇺🇦 UIA',
    JU: '🇷🇸 Air Serbia', RO: '🇷🇴 TAROM', TG: '🇹🇭 Thai Airways',
}

function formatPrice(p) {
    return new Intl.NumberFormat('tr-TR').format(p)
}

export default function FlightsPage() {
    const router = useRouter()
    const { user, profile } = useAuth()
    const { t, locale } = useLanguage()
    const resultsRef = useRef(null)

    const [origin, setOrigin] = useState('IST')
    const [duration, setDuration] = useState('4')
    const [month, setMonth] = useState('any')
    const [pattern, setPattern] = useState('any')
    const [visaFilter, setVisaFilter] = useState('all')
    const [maxBudget, setMaxBudget] = useState('')
    const [deals, setDeals] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchDone, setSearchDone] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (profile?.home_city) {
            const match = ORIGIN_CITIES.find(c => c.name.toLowerCase().includes((profile.home_city || '').toLowerCase()))
            if (match) setOrigin(match.code)
        }
    }, [profile])

    const getMonthOptions = () => {
        const opts = [{ value: 'any', label: 'Tüm Aylar' }]
        const now = new Date()
        for (let i = 0; i < 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
            opts.push({
                value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                label: d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
            })
        }
        return opts
    }

    const searchDeals = async () => {
        setLoading(true)
        setSearchDone(false)
        setError('')
        try {
            const params = new URLSearchParams({ origin, duration, month, pattern, visa: visaFilter })
            if (maxBudget) params.set('budget', maxBudget)
            const res = await fetch(`/api/flight-deals?${params}`)
            const data = await res.json()
            if (data.error) setError(data.error)
            setDeals(data.deals || [])
        } catch (e) {
            setError(e.message)
            setDeals([])
        }
        setLoading(false)
        setSearchDone(true)
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200)
    }

    const sectionStyle = {
        background: 'var(--bg-secondary)', borderRadius: 20,
        border: '1px solid var(--border)', padding: '24px 28px', marginBottom: 20,
    }

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-main" style={{ overflowY: 'auto' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 60px' }}>

                    {/* ═══ HERO ═══ */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                            borderRadius: 24, overflow: 'hidden', marginBottom: 24,
                            position: 'relative', minHeight: 180,
                            background: 'linear-gradient(135deg, #0F172A, #1E293B)',
                        }}>
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(135deg, rgba(79,70,229,0.55), rgba(236,72,153,0.25))',
                            display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px',
                        }}>
                            <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 900, margin: 0 }}>
                                ✈️ Uçuş Fırsatları
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.92rem', margin: '6px 0 0', maxWidth: 500 }}>
                                Gerçek zamanlı fiyatlar · Skyscanner, Google Flights, Enuygun, Turna
                            </p>
                        </div>
                    </motion.div>

                    {/* ═══ SEARCH PANEL ═══ */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        style={sectionStyle}>
                        <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800 }}>
                            <Search size={18} style={{ marginRight: 6, color: '#818CF8' }} /> Uçuş Ara
                        </h2>

                        {/* Row 1 */}
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                            <div style={{ flex: '1 1 180px' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>🛫 Nereden</label>
                                <select value={origin} onChange={e => setOrigin(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                                    {ORIGIN_CITIES.map(c => <option key={c.code} value={c.code}>{c.emoji} {c.name}</option>)}
                                </select>
                            </div>
                            <div style={{ flex: '1 1 140px' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>💰 Maks. Bütçe (₺)</label>
                                <input type="number" placeholder="ör: 5000" value={maxBudget} onChange={e => setMaxBudget(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                            </div>
                            <div style={{ flex: '1 1 140px' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>🛂 Vize</label>
                                <select value={visaFilter} onChange={e => setVisaFilter(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                    <option value="all">Tümü</option>
                                    <option value="visa_free">Vizesiz + Yurtiçi</option>
                                    <option value="visa_on_arrival">Vizesiz + Kapıda Vize</option>
                                </select>
                            </div>
                        </div>

                        {/* Row 2: Month + Weekend / Duration */}
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                            <div style={{ flex: '1 1 180px' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>📅 Ne Zaman</label>
                                <select value={month} onChange={e => setMonth(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                    {getMonthOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Row 3: Weekend Presets */}
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>🗓️ Hafta Sonu / Kısa Kaçamak</label>
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                {[
                                    { v: 'any', l: '🔄 Tümü', days: '' },
                                    { v: 'thu_sun', l: '🌙 Perş → Pazar', days: '3 gece' },
                                    { v: 'fri_sun', l: '✈️ Cuma → Pazar', days: '2 gece' },
                                    { v: 'fri_mon', l: '🏖️ Cuma → Pazartesi', days: '3 gece' },
                                    { v: 'sat_sun', l: '⚡ Ct → Pazar', days: '1 gece' },
                                    { v: 'sat_mon', l: '🌊 Ct → Pazartesi', days: '2 gece' },
                                    { v: 'sat_tue', l: '🗺️ Ct → Salı', days: '3 gece' },
                                ].map(p => (
                                    <button key={p.v} onClick={() => { setPattern(p.v); if (p.v !== 'any') setDuration(p.days?.replace(/[^0-9]/g, '') || '3') }}
                                        style={{
                                            padding: '8px 14px', borderRadius: 11, border: pattern === p.v ? 'none' : '1px solid var(--border)',
                                            fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer',
                                            background: pattern === p.v ? 'linear-gradient(135deg, #10B981, #059669)' : 'var(--bg-primary)',
                                            color: pattern === p.v ? 'white' : 'var(--text-secondary)',
                                            transition: 'all 150ms', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                                        }}>
                                        <span>{p.l}</span>
                                        {p.days && <span style={{ fontSize: '0.58rem', opacity: 0.7 }}>{p.days}</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Row 4: Custom Duration */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>🕐 Özel Süre (gün)</label>
                            <div style={{ display: 'flex', gap: 4 }}>
                                {['2', '3', '4', '5', '7', '10', '14'].map(d => (
                                    <button key={d} onClick={() => { setDuration(d); setPattern('any') }}
                                        style={{
                                            flex: 1, padding: '10px 4px', borderRadius: 10,
                                            border: duration === d && pattern === 'any' ? 'none' : '1px solid var(--border)',
                                            fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                                            background: duration === d && pattern === 'any' ? 'var(--primary-1)' : 'var(--bg-primary)',
                                            color: duration === d && pattern === 'any' ? 'white' : 'var(--text-secondary)',
                                            transition: 'all 150ms',
                                        }}>{d}</button>
                                ))}
                            </div>
                        </div>

                        {/* Search Button */}
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={searchDeals} disabled={loading}
                            style={{
                                width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                color: 'white', fontSize: '1rem', fontWeight: 800, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
                            }}>
                            {loading ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
                            {loading ? 'Fiyatlar Taranıyor...' : 'Fiyatları Karşılaştır'}
                        </motion.button>
                    </motion.div>

                    {/* ═══ RESULTS ═══ */}
                    <div ref={resultsRef}>
                        <AnimatePresence>
                            {searchDone && (
                                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>

                                    {error && (
                                        <div style={{ ...sectionStyle, background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#EF4444' }}>⚠️ {error}</p>
                                        </div>
                                    )}

                                    {deals.length > 0 && (
                                        <>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                                                <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                                                    <Zap size={16} style={{ color: '#F59E0B', marginRight: 6 }} />
                                                    {deals.length} destinasyon
                                                </h2>
                                                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.62rem', padding: '3px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.1)', color: '#10B981', fontWeight: 600 }}>✈️ Duffel</span>
                                                    <span style={{ fontSize: '0.62rem', padding: '3px 8px', borderRadius: 6, background: 'rgba(79,70,229,0.08)', color: '#6366F1', fontWeight: 500 }}>Amadeus (yedek)</span>
                                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginLeft: 6 }}>
                                                        📅 {new Date(deals[0].departDate + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} → {new Date(deals[0].returnDate + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                                                {deals.map((deal, i) => (
                                                    <motion.div key={deal.destination}
                                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.04 }}
                                                        whileHover={{ y: -5, boxShadow: '0 14px 35px rgba(0,0,0,0.12)' }}
                                                        style={{
                                                            background: 'var(--bg-secondary)', borderRadius: 20,
                                                            border: i === 0 ? '2px solid rgba(79,70,229,0.4)' : '1px solid var(--border)',
                                                            overflow: 'hidden', transition: 'all 200ms',
                                                        }}>
                                                        {/* Header */}
                                                        <div style={{
                                                            background: `linear-gradient(135deg, ${['#4F46E5', '#7C3AED', '#EC4899', '#0D9488', '#F59E0B', '#6366F1', '#10B981', '#EF4444'][i % 8]}, ${['#7C3AED', '#EC4899', '#F59E0B', '#4F46E5', '#0D9488', '#818CF8', '#34D399', '#F472B6'][i % 8]})`,
                                                            padding: '18px 22px', color: 'white',
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <div>
                                                                    <h3 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>{deal.emoji} {deal.city}</h3>
                                                                    <p style={{ fontSize: '0.72rem', opacity: 0.8, margin: '2px 0 0' }}>{deal.country}</p>
                                                                </div>
                                                                <div style={{ textAlign: 'right' }}>
                                                                    <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: '8px 16px', backdropFilter: 'blur(8px)' }}>
                                                                        {i === 0 && <div style={{ fontSize: '0.52rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2, opacity: 0.9 }}>🏆 En Ucuz</div>}
                                                                        <div style={{ fontSize: '1.4rem', fontWeight: 900, lineHeight: 1 }}>₺{deal.priceFormatted}</div>
                                                                        <div style={{ fontSize: '0.52rem', opacity: 0.7, marginTop: 2 }}>{deal.source} · kişi başı</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* Multi-source price comparison */}
                                                            {deal.allPrices && deal.allPrices.length > 1 && (
                                                                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                                                    {deal.allPrices.map((p, pi) => (
                                                                        <span key={pi} style={{
                                                                            fontSize: '0.58rem', padding: '2px 8px', borderRadius: 6,
                                                                            background: pi === 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                                                                            fontWeight: pi === 0 ? 700 : 500,
                                                                        }}>
                                                                            {p.source}: ₺{p.formatted}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Body */}
                                                        <div style={{ padding: '14px 22px 20px' }}>
                                                            {/* Flight time display */}
                                                            {deal.departTime && (
                                                                <div style={{
                                                                    display: 'flex', alignItems: 'center', gap: 10,
                                                                    padding: '10px 14px', borderRadius: 12,
                                                                    background: 'var(--bg-primary)', border: '1px solid var(--border)',
                                                                    marginBottom: 10,
                                                                }}>
                                                                    <div style={{ textAlign: 'center', flex: 1 }}>
                                                                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)' }}>{deal.departTime}</div>
                                                                        <div style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>Kalkış</div>
                                                                    </div>
                                                                    <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                                                                        <Plane size={12} style={{ color: '#818CF8', transform: 'rotate(45deg)' }} />
                                                                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                                                                    </div>
                                                                    <div style={{ textAlign: 'center', flex: 1 }}>
                                                                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)' }}>{deal.arriveTime || '—'}</div>
                                                                        <div style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>Varış</div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Meta badges */}
                                                            <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
                                                                <span style={{
                                                                    fontSize: '0.66rem', fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                                                                    background: (VISA_COLORS[deal.visa?.type] || '#6366F1') + '18',
                                                                    color: VISA_COLORS[deal.visa?.type] || '#6366F1',
                                                                }}>{deal.visa?.label}</span>
                                                                <span style={{ fontSize: '0.66rem', fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'rgba(129,140,248,0.1)', color: '#818CF8' }}>
                                                                    ✈️ ~{deal.flightHours}sa
                                                                </span>
                                                                {deal.airline && (
                                                                    <span style={{ fontSize: '0.66rem', fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                                                                        {AIRLINES[deal.airline] || deal.airline}
                                                                    </span>
                                                                )}
                                                                {deal.stops !== undefined && (
                                                                    <span style={{ fontSize: '0.66rem', fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: deal.stops === 0 ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: deal.stops === 0 ? '#22C55E' : '#F59E0B' }}>
                                                                        {deal.stops === 0 ? '🟢 Aktarmasız' : `🔄 ${deal.stops} aktarma`}
                                                                    </span>
                                                                )}
                                                                {deal.fallback && (
                                                                    <span style={{ fontSize: '0.62rem', fontWeight: 500, padding: '2px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.08)', color: '#6366F1' }}>
                                                                        Amadeus
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Alternative time options */}
                                                            {deal.alternatives && deal.alternatives.length > 0 && (
                                                                <div style={{ marginBottom: 10 }}>
                                                                    <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 5 }}>⏰ Diğer Saatler</div>
                                                                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                                                        {deal.alternatives.map((alt, ai) => (
                                                                            <div key={ai} style={{
                                                                                padding: '5px 10px', borderRadius: 8,
                                                                                background: 'var(--bg-primary)', border: '1px solid var(--border)',
                                                                                fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 6,
                                                                            }}>
                                                                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{alt.departTime}</span>
                                                                                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.6rem' }}>→ {alt.arriveTime || '?'}</span>
                                                                                <span style={{ fontWeight: 700, color: '#EC4899' }}>₺{alt.priceFormatted}</span>
                                                                                {alt.stops > 0 && <span style={{ fontSize: '0.55rem', color: '#F59E0B' }}>{alt.stops}x</span>}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Date info */}
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                                                                <Calendar size={12} />
                                                                {new Date(deal.departDate + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} → {new Date(deal.returnDate + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                                <span style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)' }}>({deal.tripLabel})</span>
                                                                {deal.seatsLeft && <span style={{ fontSize: '0.62rem', color: '#EF4444', fontWeight: 600 }}>· {deal.seatsLeft} koltuk</span>}
                                                            </div>

                                                            {/* ═══ BOOKING PLATFORMS ═══ */}
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                                {(deal.platforms || []).map((platform, pi) => (
                                                                    <a key={pi} href={platform.url} target="_blank" rel="noopener noreferrer"
                                                                        style={{
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                                            padding: '10px 14px', borderRadius: 11, textDecoration: 'none',
                                                                            background: 'var(--bg-primary)',
                                                                            border: '1px solid var(--border)',
                                                                            transition: 'all 150ms', cursor: 'pointer',
                                                                        }}
                                                                        onMouseOver={e => { e.currentTarget.style.background = `${platform.color}15`; e.currentTarget.style.borderColor = `${platform.color}40` }}
                                                                        onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                            <span style={{ fontSize: '1rem' }}>{platform.icon}</span>
                                                                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{platform.name}</span>
                                                                        </div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                            <span style={{ fontSize: '0.72rem', color: platform.color, fontWeight: 700 }}>Fiyat Gör</span>
                                                                            <ExternalLink size={12} style={{ color: 'var(--text-tertiary)' }} />
                                                                        </div>
                                                                    </a>
                                                                ))}
                                                            </div>

                                                            <p style={{ margin: '8px 0 0', fontSize: '0.58rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                                                                ₺{deal.priceFormatted} · {deal.source} · Platformlara tıklayıp biletinizi alabilirsiniz
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {deals.length === 0 && !error && (
                                        <div style={{ ...sectionStyle, textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                            <Plane size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                                            <p style={{ fontSize: '0.9rem' }}>Uygun uçuş bulunamadı.</p>
                                            <p style={{ fontSize: '0.75rem' }}>Farklı tarih veya filtre deneyin.</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
            <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
        </div>
    )
}
