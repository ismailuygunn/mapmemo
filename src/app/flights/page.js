'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import { AIRPORTS, searchAirports, resolveAirportCodes } from '@/lib/airports'
import {
    Search, Plane, Calendar, Clock, MapPin, Filter,
    Shield, X, ChevronDown, Loader2, ExternalLink, Zap,
    ArrowLeftRight, Users,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Build origin list from all Turkish airports in the database
const ORIGIN_CITIES = AIRPORTS.filter(a => a.country === 'Türkiye').map(a => ({
    code: a.code, name: `${a.city} (${a.code})`, emoji: a.emoji,
}))

const VISA_COLORS = {
    domestic: '#4A7FBF', visa_free: '#22C55E',
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
    const [activeTab, setActiveTab] = useState('deals') // 'deals' or 'search'
    const [loadingProgress, setLoadingProgress] = useState(0)
    const [loadingMessage, setLoadingMessage] = useState('')

    const SCAN_MESSAGES = [
        '🔍 Fiyat avcısı yola çıktı...',
        '✈️ Havalimanları taranıyor...',
        '💰 En ucuz fırsatlar aranıyor...',
        '🌍 Dünya çapında tarama yapılıyor...',
        '📊 Fiyatlar karşılaştırılıyor...',
        '🎯 En iyi tarihleri buluyoruz...',
        '⚡ Neredeyse bitti...',
        '🏆 Son kontroller yapılıyor...',
    ]

    // Flight search state
    const [searchFrom, setSearchFrom] = useState('IST')
    const [searchTo, setSearchTo] = useState('')
    const [searchDepart, setSearchDepart] = useState('')
    const [searchReturn, setSearchReturn] = useState('')
    const [searchAdults, setSearchAdults] = useState('1')
    const [searchResults, setSearchResults] = useState([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchDone2, setSearchDone2] = useState(false)
    const [fromQuery, setFromQuery] = useState('')
    const [toQuery, setToQuery] = useState('')
    const [fromSuggestions, setFromSuggestions] = useState([])
    const [toSuggestions, setToSuggestions] = useState([])
    const [searchError, setSearchError] = useState('')

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
        setLoadingProgress(0)
        setLoadingMessage(SCAN_MESSAGES[0])

        // Animate progress bar while loading
        let msgIdx = 0
        const progressInterval = setInterval(() => {
            setLoadingProgress(prev => Math.min(prev + 3 + Math.random() * 5, 92))
            msgIdx = (msgIdx + 1) % SCAN_MESSAGES.length
            setLoadingMessage(SCAN_MESSAGES[msgIdx])
        }, 800)

        try {
            const params = new URLSearchParams({ origin, duration, month, pattern, visa: visaFilter })
            if (maxBudget) params.set('budget', maxBudget)
            const res = await fetch(`/api/flight-deals?${params}`)
            const data = await res.json()
            if (data.error) setError(data.error)
            setDeals(data.deals || [])
            setLoadingProgress(100)
            setLoadingMessage('✅ Tarama tamamlandı!')
        } catch (e) {
            setError(e.message)
            setDeals([])
        }
        clearInterval(progressInterval)
        setLoading(false)
        setSearchDone(true)
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200)
    }

    // Airport autocomplete
    const handleAirportSearch = useCallback((query, setter) => {
        if (!query || query.length < 1) { setter([]); return }
        const results = searchAirports(query)
        setter(results)
    }, [])

    const selectFromAirport = (airport) => {
        setSearchFrom(airport.code)
        setFromQuery(`${airport.emoji} ${airport.city} (${airport.code})`)
        setFromSuggestions([])
    }
    const selectToAirport = (airport) => {
        setSearchTo(airport.code)
        setToQuery(`${airport.emoji} ${airport.city} (${airport.code})`)
        setToSuggestions([])
    }

    // Flight search
    const searchFlights = async () => {
        if (!searchFrom || !searchTo || !searchDepart) {
            setSearchError('Lütfen kalkış/varış ve tarihi seçin')
            return
        }
        setSearchLoading(true)
        setSearchDone2(false)
        setSearchError('')
        try {
            // Resolve multi-airport cities
            const fromCodes = resolveAirportCodes(searchFrom)
            const toCodes = resolveAirportCodes(searchTo)

            // Search all combinations (e.g. IST+SAW to CDG+ORY)
            const allResults = []
            for (const from of fromCodes) {
                for (const to of toCodes) {
                    try {
                        const params = new URLSearchParams({
                            origin: from, destination: to, departure: searchDepart,
                            adults: searchAdults, currency: 'TRY',
                        })
                        if (searchReturn) params.set('return', searchReturn)
                        const res = await fetch(`/api/flights?${params}`)
                        const data = await res.json()
                        if (data.flights) {
                            allResults.push(...data.flights.map(f => ({ ...f, fromCode: from, toCode: to })))
                        }
                    } catch { /* skip */ }
                }
            }
            // Sort by price
            allResults.sort((a, b) => parseFloat(a.price || 999999) - parseFloat(b.price || 999999))
            setSearchResults(allResults)
            if (allResults.length === 0) setSearchError('Bu rota için sonuç bulunamadı')
        } catch (e) {
            setSearchError(e.message)
        }
        setSearchLoading(false)
        setSearchDone2(true)
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
                            background: 'linear-gradient(135deg, rgba(15,40,71,0.75), rgba(212,168,83,0.25))',
                            display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <img src="/umae-icon.png" alt="UMAE" style={{ width: 40, height: 40, borderRadius: 10 }} />
                                <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 900, margin: 0 }}>
                                    Uçuş Fırsatları
                                </h1>
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.92rem', margin: '6px 0 0', maxWidth: 500 }}>
                                Gerçek zamanlı fiyatlar · Skyscanner, Google Flights, Enuygun, Turna
                            </p>
                        </div>
                    </motion.div>

                    {/* ═══ TAB SWITCHER ═══ */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
                        style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-secondary)', borderRadius: 16, padding: 4, border: '1px solid var(--border)' }}>
                        <button onClick={() => setActiveTab('deals')}
                            style={{
                                flex: 1, padding: '12px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                background: activeTab === 'deals' ? 'linear-gradient(135deg, #0F2847, #1A3A5C)' : 'transparent',
                                color: activeTab === 'deals' ? 'white' : 'var(--text-secondary)',
                                fontWeight: 700, fontSize: '0.88rem', transition: 'all 200ms',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}>
                            <Zap size={16} /> Uçuş Fırsatları
                        </button>
                        <button onClick={() => setActiveTab('search')}
                            style={{
                                flex: 1, padding: '12px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                background: activeTab === 'search' ? 'linear-gradient(135deg, #0EA5E9, #06B6D4)' : 'transparent',
                                color: activeTab === 'search' ? 'white' : 'var(--text-secondary)',
                                fontWeight: 700, fontSize: '0.88rem', transition: 'all 200ms',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}>
                            <Search size={16} /> Uçuş Ara
                        </button>
                    </motion.div>

                    {activeTab === 'deals' && (<>

                        {/* ═══ SEARCH PANEL ═══ */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            style={sectionStyle}>
                            <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800 }}>
                                <Search size={18} style={{ marginRight: 6, color: '#D4A853' }} /> Uçuş Ara
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
                                    background: 'linear-gradient(135deg, #0F2847, #1A3A5C)',
                                    color: 'white', fontSize: '1rem', fontWeight: 800, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    boxShadow: '0 4px 14px rgba(15,40,71,0.3)',
                                }}>
                                {loading ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
                                {loading ? 'Fiyatlar Taranıyor...' : 'Fiyatları Karşılaştır'}
                            </motion.button>

                            {/* Fun animated progress bar */}
                            {loading && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                    style={{ marginTop: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                            {loadingMessage}
                                        </span>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#D4A853' }}>
                                            {Math.round(loadingProgress)}%
                                        </span>
                                    </div>
                                    <div style={{
                                        height: 8, borderRadius: 10,
                                        background: 'var(--bg-primary)',
                                        overflow: 'hidden',
                                        border: '1px solid var(--border)',
                                    }}>
                                        <motion.div
                                            animate={{ width: `${loadingProgress}%` }}
                                            transition={{ duration: 0.4, ease: 'easeOut' }}
                                            style={{
                                                height: '100%', borderRadius: 10,
                                                background: 'linear-gradient(90deg, #0F2847, #D4A853, #E87F9E, #D4A853)',
                                                backgroundSize: '200% 100%',
                                                animation: 'gradientShift 2s ease infinite',
                                            }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10 }}>
                                        {['✈️', '🌍', '💰', '🎯'].map((emoji, i) => (
                                            <motion.span key={i}
                                                animate={{ y: [0, -6, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                                style={{ fontSize: '1.2rem' }}
                                            >{emoji}</motion.span>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
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
                                                        <span style={{ fontSize: '0.62rem', padding: '3px 8px', borderRadius: 6, background: 'rgba(79,70,229,0.08)', color: '#4A7FBF', fontWeight: 500 }}>Amadeus (yedek)</span>
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
                                                                background: `linear-gradient(135deg, ${['#0F2847', '#D4A853', '#EC4899', '#0D9488', '#F59E0B', '#4A7FBF', '#10B981', '#EF4444'][i % 8]}, ${['#D4A853', '#EC4899', '#F59E0B', '#0F2847', '#0D9488', '#D4A853', '#34D399', '#F472B6'][i % 8]})`,
                                                                padding: '18px 22px', color: 'white',
                                                            }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <div>
                                                                        <h3 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>{deal.emoji} {deal.city}</h3>
                                                                        <p style={{ fontSize: '0.72rem', opacity: 0.8, margin: '2px 0 0' }}>{deal.country}</p>
                                                                    </div>
                                                                    <div style={{ textAlign: 'right' }}>
                                                                        <a href={deal.platforms?.[0]?.url || '#'} target="_blank" rel="noopener noreferrer"
                                                                            onClick={e => e.stopPropagation()}
                                                                            style={{
                                                                                display: 'block', background: 'rgba(255,255,255,0.2)', borderRadius: 12,
                                                                                padding: '8px 16px', backdropFilter: 'blur(8px)', textDecoration: 'none', color: 'white',
                                                                                transition: 'all 200ms', cursor: 'pointer',
                                                                            }}
                                                                            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
                                                                            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
                                                                            {i === 0 && <div style={{ fontSize: '0.52rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2, opacity: 0.9 }}>🏆 En Ucuz</div>}
                                                                            <div style={{ fontSize: '1.4rem', fontWeight: 900, lineHeight: 1 }}>₺{deal.priceFormatted}</div>
                                                                            <div style={{ fontSize: '0.5rem', opacity: 0.8, marginTop: 1 }}>vergiler dahil</div>
                                                                            <div style={{ fontSize: '0.52rem', opacity: 0.7, marginTop: 2 }}>{deal.source} · tıkla → al 🎫</div>
                                                                        </a>
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
                                                                            <Plane size={12} style={{ color: '#D4A853', transform: 'rotate(45deg)' }} />
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
                                                                        background: (VISA_COLORS[deal.visa?.type] || '#4A7FBF') + '18',
                                                                        color: VISA_COLORS[deal.visa?.type] || '#4A7FBF',
                                                                    }}>{deal.visa?.label}</span>
                                                                    <span style={{ fontSize: '0.66rem', fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'rgba(212,168,83,0.1)', color: '#D4A853' }}>
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
                                                                        <span style={{ fontSize: '0.62rem', fontWeight: 500, padding: '2px 6px', borderRadius: 4, background: 'rgba(74,127,191,0.08)', color: '#4A7FBF' }}>
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

                                                                {/* ═══ BIG CTA BUTTON ═══ */}
                                                                {deal.platforms?.[0] && (
                                                                    <a href={deal.platforms[0].url} target="_blank" rel="noopener noreferrer"
                                                                        style={{
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                                            width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                                                                            background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                                                                            color: 'white', fontSize: '0.95rem', fontWeight: 800,
                                                                            textDecoration: 'none', cursor: 'pointer',
                                                                            boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
                                                                            marginBottom: 10, transition: 'all 200ms',
                                                                        }}
                                                                        onMouseOver={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(34,197,94,0.45)'}
                                                                        onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(34,197,94,0.3)'}>
                                                                        🎫 ₺{deal.priceFormatted} — Bilet Al
                                                                        <ExternalLink size={14} />
                                                                    </a>
                                                                )}

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
                                                                                <span style={{ fontSize: '0.72rem', color: platform.color, fontWeight: 700 }}>Bilet Al →</span>
                                                                                <ExternalLink size={12} style={{ color: platform.color }} />
                                                                            </div>
                                                                        </a>
                                                                    ))}
                                                                </div>

                                                                <p style={{ margin: '8px 0 0', fontSize: '0.58rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                                                                    ₺{deal.priceFormatted} · {deal.source} · Yukarıdaki butonlardan biletinizi alabilirsiniz
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
                    </>)}

                    {/* ═══ SEARCH TAB ═══ */}
                    {activeTab === 'search' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <div style={sectionStyle}>
                                <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800 }}>
                                    <Plane size={18} style={{ marginRight: 6, color: '#0EA5E9' }} /> Uçuş Ara
                                </h2>

                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                                    {/* From */}
                                    <div style={{ flex: '1 1 200px', position: 'relative' }}>
                                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>🛫 Nereden</label>
                                        <input type="text" placeholder="Şehir veya havalimanı..." value={fromQuery}
                                            onChange={e => { setFromQuery(e.target.value); handleAirportSearch(e.target.value, setFromSuggestions) }}
                                            onFocus={() => { if (fromQuery.length > 0) handleAirportSearch(fromQuery, setFromSuggestions) }}
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }} />
                                        {fromSuggestions.length > 0 && (
                                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, marginTop: 4, maxHeight: 240, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                                                {fromSuggestions.map(a => (
                                                    <button key={a.code} type="button" onClick={() => selectFromAirport(a)}
                                                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.82rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                                        <span>{a.emoji}</span>
                                                        <div>
                                                            <div style={{ fontWeight: 600 }}>{a.city} ({a.code})</div>
                                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>{a.name} · {a.country}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Swap */}
                                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                                        <button onClick={() => {
                                            const tmpCode = searchFrom; const tmpQ = fromQuery
                                            setSearchFrom(searchTo); setFromQuery(toQuery)
                                            setSearchTo(tmpCode); setToQuery(tmpQ)
                                        }}
                                            style={{ padding: 8, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                            <ArrowLeftRight size={16} />
                                        </button>
                                    </div>

                                    {/* To */}
                                    <div style={{ flex: '1 1 200px', position: 'relative' }}>
                                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>🛬 Nereye</label>
                                        <input type="text" placeholder="Şehir veya havalimanı..." value={toQuery}
                                            onChange={e => { setToQuery(e.target.value); handleAirportSearch(e.target.value, setToSuggestions) }}
                                            onFocus={() => { if (toQuery.length > 0) handleAirportSearch(toQuery, setToSuggestions) }}
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }} />
                                        {toSuggestions.length > 0 && (
                                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, marginTop: 4, maxHeight: 240, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                                                {toSuggestions.map(a => (
                                                    <button key={a.code} type="button" onClick={() => selectToAirport(a)}
                                                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.82rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                                        <span>{a.emoji}</span>
                                                        <div>
                                                            <div style={{ fontWeight: 600 }}>{a.city} ({a.code})</div>
                                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>{a.name} · {a.country}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                                    <div style={{ flex: '1 1 140px' }}>
                                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>📅 Gidiş</label>
                                        <input type="date" value={searchDepart} onChange={e => setSearchDepart(e.target.value)}
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                                    </div>
                                    <div style={{ flex: '1 1 140px' }}>
                                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>📅 Dönüş (opsiyonel)</label>
                                        <input type="date" value={searchReturn} onChange={e => setSearchReturn(e.target.value)}
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                                    </div>
                                    <div style={{ flex: '0 0 100px' }}>
                                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>👥 Yolcu</label>
                                        <select value={searchAdults} onChange={e => setSearchAdults(e.target.value)}
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                                            {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} kişi</option>)}
                                        </select>
                                    </div>
                                </div>

                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={searchFlights} disabled={searchLoading}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                                        background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                                        color: 'white', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    }}>
                                    {searchLoading ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
                                    {searchLoading ? 'Aranıyor...' : '✈️ Uçuş Ara'}
                                </motion.button>

                                {searchFrom && searchTo && (
                                    <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: 8, textAlign: 'center' }}>
                                        {searchFrom} → {searchTo} aranacak
                                        {resolveAirportCodes(searchFrom).length > 1 && ` (${resolveAirportCodes(searchFrom).join('+')})`}
                                        {resolveAirportCodes(searchTo).length > 1 && ` → (${resolveAirportCodes(searchTo).join('+')})`}
                                    </p>
                                )}
                            </div>

                            {/* Search Error */}
                            {searchError && (
                                <div style={{ ...sectionStyle, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', textAlign: 'center' }}>
                                    ⚠️ {searchError}
                                </div>
                            )}

                            {/* Search Results */}
                            {searchLoading && (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                                    <Loader2 size={32} className="spin" style={{ color: '#0EA5E9' }} />
                                </div>
                            )}

                            {searchDone2 && searchResults.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 4 }}>🎫 {searchResults.length} sonuç bulundu</h3>
                                    {searchResults.map((flight, i) => {
                                        const outbound = flight.segments?.[0]
                                        const returnSeg = flight.segments?.[1]
                                        const priceTRY = parseFloat(flight.price || 0)
                                        const fromCode = flight.fromCode || searchFrom
                                        const toCode = flight.toCode || searchTo
                                        const depDate = searchDepart

                                        // Build deeplinks for this search result
                                        const fmtSky = (d) => d?.replace(/-/g, '').slice(2)
                                        const fmtGoogle = (d) => d?.replace(/-/g, '')
                                        const platforms = [
                                            { name: 'Skyscanner', emoji: '🔵', url: `https://www.skyscanner.com.tr/transport/flights/${fromCode.toLowerCase()}/${toCode.toLowerCase()}/${fmtSky(depDate)}/` },
                                            { name: 'Google Flights', emoji: '🟢', url: `https://www.google.com/travel/flights?q=Flights%20to%20${toCode}%20from%20${fromCode}%20on%20${fmtGoogle(depDate)}` },
                                            { name: 'Enuygun', emoji: '🟡', url: `https://www.enuygun.com/ucak-bileti/arama/${fromCode.toLowerCase()}-${toCode.toLowerCase()}/?gidis=${depDate}` },
                                            { name: 'Turna', emoji: '🟣', url: `https://www.turna.com/ucak-bileti/${fromCode.toLowerCase()}-${toCode.toLowerCase()}?departure=${depDate}` },
                                        ]

                                        return (
                                            <motion.div key={flight.id || i}
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                style={{
                                                    ...sectionStyle, marginBottom: 8,
                                                }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                                                    <div style={{ flex: '1 1 300px' }}>
                                                        {/* Outbound */}
                                                        {outbound && (
                                                            <div style={{ marginBottom: returnSeg ? 8 : 0 }}>
                                                                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 2 }}>🛫 Gidiş</div>
                                                                {outbound.segments?.map((seg, si) => (
                                                                    <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', padding: '4px 0' }}>
                                                                        <span style={{ fontWeight: 700 }}>{seg.flightNumber}</span>
                                                                        <span>{seg.departure} {seg.departureTime?.slice(11, 16)}</span>
                                                                        <span style={{ color: 'var(--text-tertiary)' }}>→</span>
                                                                        <span>{seg.arrival} {seg.arrivalTime?.slice(11, 16)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {/* Return */}
                                                        {returnSeg && (
                                                            <div>
                                                                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 2 }}>🛬 Dönüş</div>
                                                                {returnSeg.segments?.map((seg, si) => (
                                                                    <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', padding: '4px 0' }}>
                                                                        <span style={{ fontWeight: 700 }}>{seg.flightNumber}</span>
                                                                        <span>{seg.departure} {seg.departureTime?.slice(11, 16)}</span>
                                                                        <span style={{ color: 'var(--text-tertiary)' }}>→</span>
                                                                        <span>{seg.arrival} {seg.arrivalTime?.slice(11, 16)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 2 }}>{flight.bookingClass}</div>
                                                        <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#22C55E' }}>₺{formatPrice(Math.round(priceTRY))}</div>
                                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>vergiler dahil</div>
                                                    </div>
                                                </div>

                                                {/* Booking deeplinks */}
                                                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                                                    {platforms.map(p => (
                                                        <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: 5,
                                                                padding: '6px 12px', borderRadius: 10,
                                                                background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                                                                color: 'var(--text-primary)', fontSize: '0.72rem', fontWeight: 600,
                                                                textDecoration: 'none', transition: 'all 150ms',
                                                            }}
                                                            onMouseOver={e => { e.currentTarget.style.background = 'rgba(79,70,229,0.1)'; e.currentTarget.style.borderColor = '#0F2847' }}
                                                            onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                                                            {p.emoji} {p.name} <ExternalLink size={10} />
                                                        </a>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            )}

                            {searchDone2 && searchResults.length === 0 && !searchError && (
                                <div style={{ ...sectionStyle, textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
                                    <Plane size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                                    <p style={{ fontSize: '0.9rem' }}>Sonuç bulunamadı</p>
                                    <p style={{ fontSize: '0.75rem' }}>Farklı tarih veya rota deneyin.</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                </div>
            </main>
            <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; } @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }`}</style>
        </div>
    )
}
