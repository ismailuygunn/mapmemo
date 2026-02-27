'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import {
    Search, Plane, Calendar, Clock, MapPin, Filter,
    Shield, RefreshCw, X, ChevronDown, ChevronUp,
    Loader2, ExternalLink, ArrowRight, Users, Luggage,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ═══ AIRPORT DATABASE ═══
const AIRPORTS = [
    { code: 'IST', name: 'İstanbul (IST)', city: 'İstanbul', emoji: '🌉' },
    { code: 'SAW', name: 'İstanbul Sabiha (SAW)', city: 'İstanbul', emoji: '🛬' },
    { code: 'ESB', name: 'Ankara Esenboğa', city: 'Ankara', emoji: '🏛️' },
    { code: 'ADB', name: 'İzmir Adnan Menderes', city: 'İzmir', emoji: '🌊' },
    { code: 'AYT', name: 'Antalya', city: 'Antalya', emoji: '🏖️' },
    { code: 'ADA', name: 'Adana Şakirpaşa', city: 'Adana', emoji: '🌶️' },
    { code: 'TZX', name: 'Trabzon', city: 'Trabzon', emoji: '⛰️' },
    { code: 'GZT', name: 'Gaziantep', city: 'Gaziantep', emoji: '🍽️' },
    { code: 'BJV', name: 'Milas-Bodrum', city: 'Bodrum', emoji: '⛵' },
    { code: 'DLM', name: 'Dalaman', city: 'Dalaman', emoji: '🏝️' },
    { code: 'ASR', name: 'Kayseri Erkilet', city: 'Kayseri', emoji: '🗻' },
    { code: 'DNZ', name: 'Denizli Çardak', city: 'Denizli', emoji: '♨️' },
    { code: 'KYA', name: 'Konya', city: 'Konya', emoji: '🕌' },
    { code: 'SZF', name: 'Samsun Çarşamba', city: 'Samsun', emoji: '🚢' },
    { code: 'DIY', name: 'Diyarbakır', city: 'Diyarbakır', emoji: '🏰' },
    { code: 'VAN', name: 'Van Ferit Melen', city: 'Van', emoji: '🐱' },
]

const POPULAR_ROUTES = [
    { from: 'IST', to: 'ADB', label: 'İstanbul → İzmir' },
    { from: 'IST', to: 'AYT', label: 'İstanbul → Antalya' },
    { from: 'IST', to: 'ESB', label: 'İstanbul → Ankara' },
    { from: 'IST', to: 'TZX', label: 'İstanbul → Trabzon' },
    { from: 'IST', to: 'CDG', label: 'İstanbul → Paris' },
    { from: 'IST', to: 'FCO', label: 'İstanbul → Roma' },
    { from: 'IST', to: 'BCN', label: 'İstanbul → Barselona' },
    { from: 'IST', to: 'DXB', label: 'İstanbul → Dubai' },
    { from: 'IST', to: 'LHR', label: 'İstanbul → Londra' },
    { from: 'IST', to: 'AMS', label: 'İstanbul → Amsterdam' },
    { from: 'IST', to: 'BKK', label: 'İstanbul → Bangkok' },
    { from: 'IST', to: 'TBS', label: 'İstanbul → Tiflis' },
]

// Common international destinations (IATA codes)
const DESTINATIONS = [
    { code: 'AYT', name: 'Antalya' }, { code: 'ADB', name: 'İzmir' },
    { code: 'ESB', name: 'Ankara' }, { code: 'TZX', name: 'Trabzon' },
    { code: 'DLM', name: 'Dalaman' }, { code: 'BJV', name: 'Bodrum' },
    { code: 'GZT', name: 'Gaziantep' }, { code: 'ASR', name: 'Kayseri' },
    { code: '---', name: '─── Yurt Dışı ───' },
    { code: 'CDG', name: 'Paris' }, { code: 'FCO', name: 'Roma' },
    { code: 'BCN', name: 'Barselona' }, { code: 'AMS', name: 'Amsterdam' },
    { code: 'BER', name: 'Berlin' }, { code: 'VIE', name: 'Viyana' },
    { code: 'PRG', name: 'Prag' }, { code: 'BUD', name: 'Budapeşte' },
    { code: 'ATH', name: 'Atina' }, { code: 'LIS', name: 'Lizbon' },
    { code: 'LHR', name: 'Londra' }, { code: 'MXP', name: 'Milano' },
    { code: 'WAW', name: 'Varşova' },
    { code: 'DXB', name: 'Dubai' }, { code: 'DOH', name: 'Doha' },
    { code: 'SSH', name: 'Sharm El Sheikh' },
    { code: 'TBS', name: 'Tiflis' }, { code: 'GYD', name: 'Bakü' },
    { code: 'SJJ', name: 'Saraybosna' }, { code: 'BEG', name: 'Belgrad' },
    { code: 'SOF', name: 'Sofya' }, { code: 'OTP', name: 'Bükreş' },
    { code: 'SKP', name: 'Üsküp' }, { code: 'TIA', name: 'Tiran' },
    { code: 'BKK', name: 'Bangkok' }, { code: 'NRT', name: 'Tokyo' },
    { code: 'ICN', name: 'Seul' }, { code: 'SIN', name: 'Singapur' },
]

function formatTime(isoStr) {
    if (!isoStr) return ''
    try {
        const d = new Date(isoStr)
        return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
}

function formatDate(isoStr) {
    if (!isoStr) return ''
    try {
        const d = new Date(isoStr)
        return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', weekday: 'short' })
    } catch { return '' }
}

function parseDuration(iso) {
    if (!iso) return ''
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
    if (!match) return iso
    const h = match[1] || '0'
    const m = match[2] || '0'
    return `${h}sa ${m}dk`
}

function getTodayStr() {
    const d = new Date()
    d.setDate(d.getDate() + 7) // Default: 1 week from now
    return d.toISOString().split('T')[0]
}

function getReturnStr() {
    const d = new Date()
    d.setDate(d.getDate() + 11) // Default: 4 days trip
    return d.toISOString().split('T')[0]
}

export default function FlightsPage() {
    const router = useRouter()
    const { user, profile } = useAuth()
    const { t, locale } = useLanguage()
    const resultsRef = useRef(null)

    // Search state
    const [origin, setOrigin] = useState('IST')
    const [destination, setDestination] = useState('')
    const [departDate, setDepartDate] = useState(getTodayStr())
    const [returnDate, setReturnDate] = useState(getReturnStr())
    const [passengers, setPassengers] = useState(1)
    const [tripType, setTripType] = useState('roundtrip') // roundtrip | oneway
    const [nonStop, setNonStop] = useState(false)
    const [maxPrice, setMaxPrice] = useState('')
    const [sortBy, setSortBy] = useState('price') // price | duration | stops

    // Results
    const [flights, setFlights] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchDone, setSearchDone] = useState(false)
    const [error, setError] = useState('')
    const [expandedFlight, setExpandedFlight] = useState(null)

    // Set origin from profile
    useEffect(() => {
        if (profile?.home_city) {
            const match = AIRPORTS.find(a => a.city.toLowerCase() === (profile.home_city || '').toLowerCase())
            if (match) setOrigin(match.code)
        }
    }, [profile])

    const searchFlights = async () => {
        if (!destination || destination === '---') return
        setLoading(true)
        setSearchDone(false)
        setError('')
        setExpandedFlight(null)

        try {
            const params = new URLSearchParams({
                origin,
                destination,
                departDate,
                adults: String(passengers),
            })
            if (tripType === 'roundtrip' && returnDate) params.set('returnDate', returnDate)
            if (nonStop) params.set('nonStop', 'true')
            if (maxPrice) params.set('maxPrice', maxPrice)

            const res = await fetch(`/api/flight-deals?${params}`)
            const data = await res.json()

            if (data.error) {
                setError(data.error)
                setFlights([])
            } else {
                let results = data.flights || []
                // Sort
                if (sortBy === 'duration') {
                    results.sort((a, b) => {
                        const dA = a.outbound?.duration || 'PT99H'
                        const dB = b.outbound?.duration || 'PT99H'
                        return dA.localeCompare(dB)
                    })
                } else if (sortBy === 'stops') {
                    results.sort((a, b) => a.totalStops - b.totalStops)
                }
                // price is already default sorted from API
                setFlights(results)
            }
        } catch (e) {
            setError('Uçuş arama hatası: ' + e.message)
            setFlights([])
        }
        setLoading(false)
        setSearchDone(true)
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200)
    }

    const handlePopularRoute = (route) => {
        setOrigin(route.from)
        setDestination(route.to)
        setTimeout(() => searchFlights(), 100)
    }

    const sectionStyle = {
        background: 'var(--bg-secondary)', borderRadius: 20,
        border: '1px solid var(--border)', padding: '24px 28px', marginBottom: 20,
    }
    const inputStyle = {
        width: '100%', padding: '12px 16px', borderRadius: 12,
        border: '1px solid var(--border)', background: 'var(--bg-primary)',
        color: 'var(--text-primary)', fontSize: '0.88rem', fontWeight: 600,
    }
    const labelStyle = {
        fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)',
        display: 'block', marginBottom: 5,
    }

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-main" style={{ overflowY: 'auto' }}>
                <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 60px' }}>

                    {/* ═══ HERO ═══ */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                            borderRadius: 24, overflow: 'hidden', marginBottom: 24,
                            position: 'relative', minHeight: 160,
                            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
                        }}>
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(135deg, rgba(79,70,229,0.55), rgba(236,72,153,0.25))',
                            display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px',
                        }}>
                            <h1 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>
                                ✈️ Uçuş Ara
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem', margin: '6px 0 0' }}>
                                Gerçek zamanlı uçuş fiyatları — doğrudan uygulama içinde
                            </p>
                        </div>
                    </motion.div>

                    {/* ═══ SEARCH PANEL ═══ */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        style={sectionStyle}>

                        {/* Trip Type Toggle */}
                        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                            {[
                                { key: 'roundtrip', label: '↔️ Gidiş-Dönüş' },
                                { key: 'oneway', label: '→ Tek Yön' },
                            ].map(tt => (
                                <button key={tt.key} onClick={() => setTripType(tt.key)}
                                    style={{
                                        padding: '8px 16px', borderRadius: 10, border: 'none',
                                        fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                                        background: tripType === tt.key ? 'var(--primary-1)' : 'var(--bg-tertiary)',
                                        color: tripType === tt.key ? 'white' : 'var(--text-secondary)',
                                        transition: 'all 150ms',
                                    }}>{tt.label}</button>
                            ))}
                        </div>

                        {/* Row 1: Origin + Destination */}
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                            <div style={{ flex: '1 1 200px' }}>
                                <label style={labelStyle}>🛫 Nereden</label>
                                <select value={origin} onChange={e => setOrigin(e.target.value)} style={inputStyle}>
                                    {AIRPORTS.map(a => (
                                        <option key={a.code} value={a.code}>{a.emoji} {a.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 8 }}>
                                <button onClick={() => { const tmp = origin; setOrigin(destination || 'IST'); setDestination(tmp) }}
                                    style={{
                                        background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                                        borderRadius: 10, padding: '8px', cursor: 'pointer', color: 'var(--text-primary)',
                                    }}>⇄</button>
                            </div>
                            <div style={{ flex: '1 1 200px' }}>
                                <label style={labelStyle}>🛬 Nereye</label>
                                <select value={destination} onChange={e => setDestination(e.target.value)} style={inputStyle}>
                                    <option value="">Şehir seçin...</option>
                                    {DESTINATIONS.map(d => (
                                        <option key={d.code} value={d.code} disabled={d.code === '---'}>
                                            {d.code === '---' ? d.name : `${d.name} (${d.code})`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Row 2: Dates + Passengers */}
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                            <div style={{ flex: '1 1 160px' }}>
                                <label style={labelStyle}>📅 Gidiş Tarihi</label>
                                <input type="date" value={departDate} onChange={e => setDepartDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    style={inputStyle} />
                            </div>
                            {tripType === 'roundtrip' && (
                                <div style={{ flex: '1 1 160px' }}>
                                    <label style={labelStyle}>📅 Dönüş Tarihi</label>
                                    <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)}
                                        min={departDate}
                                        style={inputStyle} />
                                </div>
                            )}
                            <div style={{ flex: '0 0 100px' }}>
                                <label style={labelStyle}>👤 Yolcu</label>
                                <select value={passengers} onChange={e => setPassengers(parseInt(e.target.value))} style={inputStyle}>
                                    {[1, 2, 3, 4, 5, 6].map(n => (
                                        <option key={n} value={n}>{n} kişi</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Row 3: Filters */}
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'flex-end' }}>
                            <div style={{ flex: '0 0 auto' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                    <input type="checkbox" checked={nonStop} onChange={e => setNonStop(e.target.checked)}
                                        style={{ width: 16, height: 16, accentColor: '#4F46E5' }} />
                                    Aktarmasız
                                </label>
                            </div>
                            <div style={{ flex: '1 1 140px' }}>
                                <label style={labelStyle}>💰 Maks. Bütçe (₺)</label>
                                <input type="number" placeholder="ör: 5000" value={maxPrice}
                                    onChange={e => setMaxPrice(e.target.value)} style={inputStyle} />
                            </div>
                            <div style={{ flex: '1 1 140px' }}>
                                <label style={labelStyle}>📊 Sıralama</label>
                                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={inputStyle}>
                                    <option value="price">En Ucuz</option>
                                    <option value="duration">En Kısa</option>
                                    <option value="stops">En Az Aktarma</option>
                                </select>
                            </div>
                        </div>

                        {/* Search Button */}
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={searchFlights} disabled={loading || !destination}
                            style={{
                                width: '100%', padding: '16px', borderRadius: 14, border: 'none',
                                background: (!destination) ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                color: (!destination) ? 'var(--text-tertiary)' : 'white',
                                fontSize: '1.05rem', fontWeight: 800, cursor: destination ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                boxShadow: destination ? '0 4px 14px rgba(79,70,229,0.3)' : 'none',
                            }}>
                            {loading ? <Loader2 size={20} className="spin" /> : <Search size={20} />}
                            {loading ? 'Uçuşlar Aranıyor...' : destination ? 'Uçuşları Ara' : 'Önce varış noktası seçin'}
                        </motion.button>
                    </motion.div>

                    {/* ═══ POPULAR ROUTES ═══ */}
                    {!searchDone && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            style={sectionStyle}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 12px' }}>
                                🔥 Popüler Rotalar
                            </h3>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {POPULAR_ROUTES.map(r => (
                                    <button key={r.label} onClick={() => handlePopularRoute(r)}
                                        style={{
                                            padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)',
                                            background: 'var(--bg-primary)', color: 'var(--text-secondary)',
                                            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                                            transition: 'all 150ms',
                                        }}
                                        onMouseOver={e => { e.currentTarget.style.background = 'var(--primary-1)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'var(--primary-1)' }}
                                        onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ═══ RESULTS ═══ */}
                    <div ref={resultsRef}>
                        <AnimatePresence>
                            {searchDone && (
                                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                                            {error ? '❌' : '✈️'} {flights.length > 0 ? `${flights.length} uçuş bulundu` : error ? 'Hata' : 'Sonuç bulunamadı'}
                                        </h2>
                                        {flights.length > 0 && (
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                                {AIRPORTS.find(a => a.code === origin)?.city || origin} → {DESTINATIONS.find(d => d.code === destination)?.name || destination}
                                            </span>
                                        )}
                                    </div>

                                    {error && (
                                        <div style={{ ...sectionStyle, background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#EF4444' }}>⚠️ {error}</p>
                                            <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                                Lütfen farklı tarih veya rota deneyin.
                                            </p>
                                        </div>
                                    )}

                                    {flights.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            {flights.map((flight, i) => (
                                                <motion.div key={flight.id}
                                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.04 }}
                                                    style={{
                                                        background: 'var(--bg-secondary)', borderRadius: 18,
                                                        border: i === 0 ? '2px solid rgba(79,70,229,0.4)' : '1px solid var(--border)',
                                                        overflow: 'hidden', transition: 'all 200ms',
                                                    }}>
                                                    {/* Main Row — clickable to expand */}
                                                    <div onClick={() => setExpandedFlight(expandedFlight === flight.id ? null : flight.id)}
                                                        style={{
                                                            padding: '18px 22px', cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: 16,
                                                            flexWrap: 'wrap',
                                                        }}
                                                        onMouseOver={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}>

                                                        {/* Price + Badge */}
                                                        <div style={{ minWidth: 100, textAlign: 'center' }}>
                                                            {i === 0 && (
                                                                <div style={{
                                                                    background: '#4F46E5', color: 'white',
                                                                    fontSize: '0.55rem', fontWeight: 800, padding: '2px 8px',
                                                                    borderRadius: 4, marginBottom: 4, display: 'inline-block',
                                                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                                                }}>EN UCUZ</div>
                                                            )}
                                                            <div style={{
                                                                fontSize: '1.4rem', fontWeight: 900,
                                                                color: i === 0 ? '#4F46E5' : 'var(--text-primary)',
                                                                lineHeight: 1,
                                                            }}>₺{flight.priceFormatted}</div>
                                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                                                                kişi başı
                                                            </div>
                                                        </div>

                                                        {/* Airline */}
                                                        <div style={{ minWidth: 80, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                            <span style={{ fontSize: '1.5rem' }}>{flight.airline.logo}</span>
                                                            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2, textAlign: 'center' }}>
                                                                {flight.airline.name}
                                                            </span>
                                                        </div>

                                                        {/* Outbound Flight */}
                                                        <div style={{ flex: 1, minWidth: 200 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                                <div style={{ textAlign: 'center' }}>
                                                                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{formatTime(flight.outbound.departTime)}</div>
                                                                    <div style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>{flight.outbound.departAirport}</div>
                                                                </div>

                                                                {/* Flight line */}
                                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                                    <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>
                                                                        {parseDuration(flight.outbound.duration)}
                                                                    </span>
                                                                    <div style={{
                                                                        width: '100%', height: 2,
                                                                        background: flight.outbound.stops === 0 ? '#22C55E' : '#F59E0B',
                                                                        borderRadius: 1, position: 'relative', margin: '3px 0',
                                                                    }}>
                                                                        {flight.outbound.stops > 0 && (
                                                                            <div style={{
                                                                                position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)',
                                                                                width: 8, height: 8, borderRadius: '50%',
                                                                                background: '#F59E0B', border: '2px solid var(--bg-secondary)',
                                                                            }} />
                                                                        )}
                                                                    </div>
                                                                    <span style={{
                                                                        fontSize: '0.58rem', fontWeight: 600,
                                                                        color: flight.outbound.stops === 0 ? '#22C55E' : '#F59E0B',
                                                                    }}>
                                                                        {flight.outbound.stops === 0 ? 'Aktarmasız' : `${flight.outbound.stops} aktarma`}
                                                                    </span>
                                                                </div>

                                                                <div style={{ textAlign: 'center' }}>
                                                                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{formatTime(flight.outbound.arriveTime)}</div>
                                                                    <div style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>{flight.outbound.arriveAirport}</div>
                                                                </div>
                                                            </div>

                                                            {/* Inbound (if round trip) */}
                                                            {flight.inbound && (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, opacity: 0.7 }}>
                                                                    <div style={{ textAlign: 'center' }}>
                                                                        <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>{formatTime(flight.inbound.departTime)}</div>
                                                                        <div style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)' }}>{flight.inbound.departAirport}</div>
                                                                    </div>
                                                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                                        <span style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)' }}>
                                                                            {parseDuration(flight.inbound.duration)}
                                                                        </span>
                                                                        <div style={{
                                                                            width: '100%', height: 2,
                                                                            background: flight.inbound.stops === 0 ? '#22C55E' : '#F59E0B',
                                                                            borderRadius: 1, margin: '2px 0',
                                                                        }} />
                                                                        <span style={{ fontSize: '0.55rem', color: flight.inbound.stops === 0 ? '#22C55E' : '#F59E0B', fontWeight: 600 }}>
                                                                            {flight.inbound.stops === 0 ? 'Aktarmasız' : `${flight.inbound.stops} aktarma`}
                                                                        </span>
                                                                    </div>
                                                                    <div style={{ textAlign: 'center' }}>
                                                                        <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>{formatTime(flight.inbound.arriveTime)}</div>
                                                                        <div style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)' }}>{flight.inbound.arriveAirport}</div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Expand icon */}
                                                        <div>
                                                            {expandedFlight === flight.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                        </div>
                                                    </div>

                                                    {/* ═══ EXPANDED DETAIL ═══ */}
                                                    <AnimatePresence>
                                                        {expandedFlight === flight.id && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                                style={{ overflow: 'hidden' }}>
                                                                <div style={{
                                                                    padding: '0 22px 20px',
                                                                    borderTop: '1px solid var(--border)',
                                                                    paddingTop: 16,
                                                                }}>
                                                                    {/* Outbound segments */}
                                                                    <h4 style={{ fontSize: '0.78rem', fontWeight: 700, margin: '0 0 8px', color: '#4F46E5' }}>
                                                                        ✈️ Gidiş — {formatDate(flight.outbound.departTime)}
                                                                    </h4>
                                                                    {flight.outbound.segments.map((seg, si) => (
                                                                        <div key={si} style={{
                                                                            display: 'flex', gap: 12, alignItems: 'center',
                                                                            padding: '8px 12px', borderRadius: 10,
                                                                            background: 'var(--bg-primary)', marginBottom: 6,
                                                                            border: '1px solid var(--border)',
                                                                            fontSize: '0.78rem',
                                                                        }}>
                                                                            <span style={{ fontSize: '1.1rem' }}>{seg.airlineLogo}</span>
                                                                            <div style={{ flex: 1 }}>
                                                                                <div style={{ fontWeight: 700 }}>
                                                                                    {formatTime(seg.departure.time)} {seg.departure.airport}
                                                                                    <ArrowRight size={12} style={{ margin: '0 6px', verticalAlign: 'middle' }} />
                                                                                    {formatTime(seg.arrival.time)} {seg.arrival.airport}
                                                                                </div>
                                                                                <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                                                                                    {seg.airlineName} · {seg.flightNumber} · {parseDuration(seg.duration)}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}

                                                                    {/* Inbound segments */}
                                                                    {flight.inbound && (
                                                                        <>
                                                                            <h4 style={{ fontSize: '0.78rem', fontWeight: 700, margin: '14px 0 8px', color: '#EC4899' }}>
                                                                                🔄 Dönüş — {formatDate(flight.inbound.departTime)}
                                                                            </h4>
                                                                            {flight.inbound.segments.map((seg, si) => (
                                                                                <div key={si} style={{
                                                                                    display: 'flex', gap: 12, alignItems: 'center',
                                                                                    padding: '8px 12px', borderRadius: 10,
                                                                                    background: 'var(--bg-primary)', marginBottom: 6,
                                                                                    border: '1px solid var(--border)',
                                                                                    fontSize: '0.78rem',
                                                                                }}>
                                                                                    <span style={{ fontSize: '1.1rem' }}>{seg.airlineLogo}</span>
                                                                                    <div style={{ flex: 1 }}>
                                                                                        <div style={{ fontWeight: 700 }}>
                                                                                            {formatTime(seg.departure.time)} {seg.departure.airport}
                                                                                            <ArrowRight size={12} style={{ margin: '0 6px', verticalAlign: 'middle' }} />
                                                                                            {formatTime(seg.arrival.time)} {seg.arrival.airport}
                                                                                        </div>
                                                                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                                                                                            {seg.airlineName} · {seg.flightNumber} · {parseDuration(seg.duration)}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </>
                                                                    )}

                                                                    {/* Booking info */}
                                                                    <div style={{
                                                                        marginTop: 12, padding: '10px 14px', borderRadius: 10,
                                                                        background: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.15)',
                                                                        fontSize: '0.72rem', color: 'var(--text-secondary)',
                                                                    }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                                                            <span>💺 {flight.bookable > 0 ? `${flight.bookable} koltuk kaldı` : 'Müsait'}</span>
                                                                            {flight.lastTicketDate && (
                                                                                <span>📅 Son bilet: {formatDate(flight.lastTicketDate + 'T00:00:00')}</span>
                                                                            )}
                                                                            <span style={{ fontWeight: 800, color: '#4F46E5', fontSize: '1rem' }}>
                                                                                Toplam: ₺{flight.priceFormatted}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}

                                    {flights.length === 0 && !error && (
                                        <div style={{ ...sectionStyle, textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)' }}>
                                            <Plane size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                                            <p style={{ fontSize: '0.9rem' }}>Bu rota için uygun uçuş bulunamadı.</p>
                                            <p style={{ fontSize: '0.75rem' }}>Farklı tarih veya rota deneyin.</p>
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
