'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import {
    Search, Loader2, Calendar, MapPin, Clock, ExternalLink,
    Ticket, Star, Filter, ChevronDown, Music, ChevronLeft,
    ChevronRight, Sparkles, Heart, Share2, X, Globe, Flame,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const CITIES_TR = [
    { name: 'İstanbul', slug: 'istanbul', emoji: '🌉' },
    { name: 'Ankara', slug: 'ankara', emoji: '🏛️' },
    { name: 'İzmir', slug: 'izmir', emoji: '🌊' },
    { name: 'Antalya', slug: 'antalya', emoji: '🏖️' },
    { name: 'Bursa', slug: 'bursa', emoji: '🏔️' },
    { name: 'Trabzon', slug: 'trabzon', emoji: '⛰️' },
    { name: 'Eskişehir', slug: 'eskisehir', emoji: '🎓' },
    { name: 'Gaziantep', slug: 'gaziantep', emoji: '🍽️' },
    { name: 'Konya', slug: 'konya', emoji: '🕌' },
    { name: 'Mersin', slug: 'mersin', emoji: '🍊' },
    { name: 'Adana', slug: 'adana', emoji: '🌶️' },
    { name: 'Samsun', slug: 'samsun', emoji: '🚢' },
    { name: 'Kayseri', slug: 'kayseri', emoji: '🗻' },
    { name: 'Diyarbakır', slug: 'diyarbakir', emoji: '🏰' },
]

const CITIES_INT = [
    { name: 'Paris', slug: 'Paris', emoji: '🇫🇷' },
    { name: 'Londra', slug: 'London', emoji: '🇬🇧' },
    { name: 'Roma', slug: 'Rome', emoji: '🇮🇹' },
    { name: 'Barselona', slug: 'Barcelona', emoji: '🇪🇸' },
    { name: 'Amsterdam', slug: 'Amsterdam', emoji: '🇳🇱' },
    { name: 'Berlin', slug: 'Berlin', emoji: '🇩🇪' },
    { name: 'Viyana', slug: 'Vienna', emoji: '🇦🇹' },
    { name: 'Prag', slug: 'Prague', emoji: '🇨🇿' },
    { name: 'Budapeşte', slug: 'Budapest', emoji: '🇭🇺' },
    { name: 'Dubai', slug: 'Dubai', emoji: '🇦🇪' },
    { name: 'New York', slug: 'New York', emoji: '🇺🇸' },
    { name: 'Tokyo', slug: 'Tokyo', emoji: '🇯🇵' },
    { name: 'Bangkok', slug: 'Bangkok', emoji: '🇹🇭' },
    { name: 'Seul', slug: 'Seoul', emoji: '🇰🇷' },
]

const FORMATS = [
    { key: '', label: 'Tümü', emoji: '🎫', color: '#4A7FBF' },
    { key: 'konser', label: 'Konser', emoji: '🎵', color: '#EC4899' },
    { key: 'sahne-sanatlari', label: 'Tiyatro', emoji: '🎭', color: '#8B5CF6' },
    { key: 'stand-up', label: 'Stand Up', emoji: '😂', color: '#F59E0B' },
    { key: 'sergi', label: 'Sergi', emoji: '🖼️', color: '#10B981' },
    { key: 'festival', label: 'Festival', emoji: '🎪', color: '#EF4444' },
    { key: 'spor', label: 'Spor', emoji: '⚽', color: '#3B82F6' },
    { key: 'cocuk', label: 'Çocuk', emoji: '👶', color: '#F97316' },
    { key: 'soylesi', label: 'Söyleşi', emoji: '💬', color: '#0EA5E9' },
]

const QUICK_DATES = [
    { key: 'all', label: 'Tümü', emoji: '📅' },
    { key: 'today', label: 'Bugün', emoji: '☀️' },
    { key: 'tomorrow', label: 'Yarın', emoji: '🌅' },
    { key: 'this_week', label: 'Bu Hafta', emoji: '📆' },
    { key: 'weekend', label: 'Hafta Sonu', emoji: '🎉' },
    { key: 'this_month', label: 'Bu Ay', emoji: '🗓️' },
    { key: 'next_month', label: 'Gelecek Ay', emoji: '🔮' },
]

const GRADIENTS = [
    'linear-gradient(135deg, #EC4899, #8B5CF6)',
    'linear-gradient(135deg, #4A7FBF, #3B82F6)',
    'linear-gradient(135deg, #10B981, #0EA5E9)',
    'linear-gradient(135deg, #F59E0B, #EF4444)',
    'linear-gradient(135deg, #8B5CF6, #EC4899)',
    'linear-gradient(135deg, #0D9488, #4A7FBF)',
    'linear-gradient(135deg, #F97316, #F59E0B)',
    'linear-gradient(135deg, #3B82F6, #8B5CF6)',
]

function formatDate(dateStr) {
    if (!dateStr) return ''
    try {
        const d = new Date(dateStr)
        if (isNaN(d.getTime())) return ''
        return d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'long' })
    } catch { return '' }
}

function formatTime(dateStr) {
    if (!dateStr) return ''
    try {
        const d = new Date(dateStr)
        if (isNaN(d.getTime())) return ''
        return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
}

function formatShortDate(dateStr) {
    if (!dateStr) return ''
    try {
        const d = new Date(dateStr)
        if (isNaN(d.getTime())) return ''
        return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
    } catch { return '' }
}

function daysUntil(dateStr) {
    if (!dateStr) return null
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    const now = new Date()
    const diff = Math.floor((d - now) / 86400000)
    if (diff < 0) return null
    if (diff === 0) return 'Bugün'
    if (diff === 1) return 'Yarın'
    return `${diff} gün sonra`
}

function isInDateRange(eventStart, filterKey, customDateFrom, customDateTo) {
    if (!eventStart) return true

    // Custom date range takes priority
    if (customDateFrom || customDateTo) {
        const eventDate = new Date(eventStart)
        if (isNaN(eventDate.getTime())) return true
        const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
        if (customDateFrom) {
            const from = new Date(customDateFrom)
            if (eventDay < from) return false
        }
        if (customDateTo) {
            const to = new Date(customDateTo)
            if (eventDay > to) return false
        }
        return true
    }

    if (filterKey === 'all') return true
    try {
        const now = new Date()
        const eventDate = new Date(eventStart)
        if (isNaN(eventDate.getTime())) return true

        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const todayEnd = new Date(todayStart.getTime() + 86400000)
        const tomorrowEnd = new Date(todayStart.getTime() + 2 * 86400000)

        switch (filterKey) {
            case 'today':
                return eventDate >= todayStart && eventDate < todayEnd
            case 'tomorrow':
                return eventDate >= todayEnd && eventDate < tomorrowEnd
            case 'this_week': {
                const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
                const weekEnd = new Date(todayStart.getTime() + (8 - dayOfWeek) * 86400000)
                return eventDate >= todayStart && eventDate < weekEnd
            }
            case 'this_month': {
                const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
                return eventDate >= todayStart && eventDate < monthEnd
            }
            case 'next_month': {
                const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
                const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 1)
                return eventDate >= nextMonthStart && eventDate < nextMonthEnd
            }
            case 'weekend': {
                const day = eventDate.getDay()
                return day === 0 || day === 6
            }
            default: return true
        }
    } catch { return true }
}

export default function EventsPage() {
    const router = useRouter()
    const { user } = useAuth()
    const { t } = useLanguage()

    const [city, setCity] = useState('İstanbul')
    const [customCity, setCustomCity] = useState('')
    const [format, setFormat] = useState('')
    const [dateFilter, setDateFilter] = useState('all')
    const [customDateFrom, setCustomDateFrom] = useState('')
    const [customDateTo, setCustomDateTo] = useState('')
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)
    const [total, setTotal] = useState(0)
    const [showFilters, setShowFilters] = useState(false)
    const [favorites, setFavorites] = useState(new Set())
    const [viewMode, setViewMode] = useState('grid') // grid | list

    // Auto-search when city or format changes
    useEffect(() => {
        const activeCity = customCity || city
        if (activeCity) searchEvents(activeCity)
    }, [city, format])

    const filteredEvents = useMemo(() => {
        return events.filter(e => isInDateRange(e.start, dateFilter, customDateFrom, customDateTo))
    }, [events, dateFilter, customDateFrom, customDateTo])

    const searchEvents = async (overrideCity) => {
        setLoading(true)
        setSearched(false)
        const searchCity = overrideCity || customCity || city
        try {
            const params = new URLSearchParams({ city: searchCity })
            if (format) params.set('format', format)
            const res = await fetch(`/api/events?${params}`)
            const data = await res.json()
            setEvents(data.events || [])
            setTotal(data.total || 0)
        } catch {
            setEvents([])
        }
        setLoading(false)
        setSearched(true)
    }

    const handleCustomCitySearch = () => {
        if (customCity.trim()) searchEvents(customCity.trim())
    }

    const toggleFavorite = (id) => {
        setFavorites(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const clearDateFilter = () => {
        setDateFilter('all')
        setCustomDateFrom('')
        setCustomDateTo('')
    }

    const activeCity = customCity || city

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-main" style={{ overflowY: 'auto' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 60px' }}>

                    {/* ═══ ANIMATED HERO ═══ */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                            borderRadius: 28, overflow: 'hidden', marginBottom: 24,
                            position: 'relative', minHeight: 220,
                            background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)',
                        }}>
                        {/* Floating decoration */}
                        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                            {['🎵', '🎭', '🎪', '🎸', '🎤', '🎻', '🎹', '🥁'].map((e, i) => (
                                <motion.span key={i}
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: [0.15, 0.35, 0.15], y: [0, -20, 0] }}
                                    transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
                                    style={{
                                        position: 'absolute', fontSize: `${1.2 + (i % 3) * 0.5}rem`,
                                        left: `${8 + i * 12}%`, top: `${20 + (i % 3) * 25}%`,
                                    }}>{e}</motion.span>
                            ))}
                        </div>
                        <div style={{
                            position: 'relative', zIndex: 1,
                            display: 'flex', flexDirection: 'column', justifyContent: 'center',
                            padding: '40px 40px 36px', minHeight: 220,
                        }}>
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                style={{
                                    color: 'white', fontSize: '2.4rem', fontWeight: 900, margin: 0, lineHeight: 1.15,
                                    textShadow: '0 2px 20px rgba(0,0,0,0.3)',
                                }}>
                                🎭 Etkinlikler
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }} animate={{ opacity: 0.85 }} transition={{ delay: 0.15 }}
                                style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem', margin: '8px 0 0', maxWidth: 500, lineHeight: 1.5 }}>
                                Konser, tiyatro, festival ve daha fazlasını keşfet
                            </motion.p>
                            {searched && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap',
                                    }}>
                                    <span style={{
                                        background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                                        padding: '6px 14px', borderRadius: 12, color: 'white',
                                        fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5,
                                    }}>
                                        <MapPin size={13} /> {activeCity}
                                    </span>
                                    <span style={{
                                        background: 'rgba(236,72,153,0.2)', backdropFilter: 'blur(8px)',
                                        padding: '6px 14px', borderRadius: 12, color: '#F9A8D4',
                                        fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5,
                                    }}>
                                        <Flame size={13} /> {filteredEvents.length} etkinlik
                                    </span>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>

                    {/* ═══ SEARCH & FILTERS BAR ═══ */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        style={{
                            background: 'var(--bg-secondary)', borderRadius: 24,
                            border: '1px solid var(--border)', padding: '20px 24px',
                            marginBottom: 20,
                        }}>
                        {/* City Quick Select + Search */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                flex: 1, background: 'var(--bg-primary)', borderRadius: 14,
                                border: '1px solid var(--border)', padding: '4px 12px',
                            }}>
                                <Search size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                <input type="text" placeholder="Şehir ara... (ör: Milano, Muğla, New York)"
                                    value={customCity} onChange={e => setCustomCity(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleCustomCitySearch()}
                                    style={{
                                        flex: 1, padding: '10px 4px', border: 'none', background: 'transparent',
                                        color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none',
                                    }} />
                            </div>
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={handleCustomCitySearch}
                                style={{
                                    padding: '12px 20px', borderRadius: 14, border: 'none',
                                    background: 'linear-gradient(135deg, #4A7FBF, #8B5CF6)',
                                    color: 'white', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    boxShadow: '0 4px 12px rgba(74,127,191,0.3)',
                                }}>
                                <Search size={14} /> Ara
                            </motion.button>
                            <button onClick={() => setShowFilters(!showFilters)}
                                style={{
                                    padding: '12px', borderRadius: 14, border: '1px solid var(--border)',
                                    background: showFilters ? 'rgba(74,127,191,0.1)' : 'var(--bg-primary)',
                                    color: showFilters ? '#4A7FBF' : 'var(--text-secondary)',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                                }}>
                                <Filter size={16} />
                            </button>
                        </div>

                        {/* City Pills — Turkey */}
                        <div style={{ marginBottom: 8 }}>
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                {CITIES_TR.map(c => (
                                    <motion.button key={c.slug} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                        onClick={() => { setCity(c.name); setCustomCity('') }}
                                        style={{
                                            padding: '6px 12px', borderRadius: 10,
                                            border: city === c.name && !customCity ? '2px solid #EC4899' : '1px solid var(--border)',
                                            fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer',
                                            background: city === c.name && !customCity ? 'linear-gradient(135deg, #EC4899, #8B5CF6)' : 'var(--bg-primary)',
                                            color: city === c.name && !customCity ? 'white' : 'var(--text-secondary)',
                                            transition: 'all 150ms',
                                        }}>{c.emoji} {c.name}</motion.button>
                                ))}
                            </div>
                        </div>

                        {/* City Pills — International */}
                        <div style={{ marginBottom: 6 }}>
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                {CITIES_INT.map(c => (
                                    <motion.button key={c.slug} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                        onClick={() => { setCity(c.name); setCustomCity('') }}
                                        style={{
                                            padding: '6px 12px', borderRadius: 10,
                                            border: city === c.name && !customCity ? '2px solid #3B82F6' : '1px solid var(--border)',
                                            fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer',
                                            background: city === c.name && !customCity ? 'linear-gradient(135deg, #3B82F6, #4A7FBF)' : 'var(--bg-primary)',
                                            color: city === c.name && !customCity ? 'white' : 'var(--text-secondary)',
                                            transition: 'all 150ms',
                                        }}>{c.emoji} {c.name}</motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Extended Filters Panel */}
                        <AnimatePresence>
                            {showFilters && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                    <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)', marginTop: 10 }}>
                                        {/* Format/Category Filter */}
                                        <div style={{ marginBottom: 14 }}>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>
                                                🎭 Kategori
                                            </label>
                                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                                {FORMATS.map(f => (
                                                    <motion.button key={f.key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                        onClick={() => setFormat(f.key)}
                                                        style={{
                                                            padding: '7px 14px', borderRadius: 10, border: 'none',
                                                            fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer',
                                                            background: format === f.key ? f.color : 'var(--bg-tertiary)',
                                                            color: format === f.key ? 'white' : 'var(--text-secondary)',
                                                            transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: 5,
                                                        }}>{f.emoji} {f.label}</motion.button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Quick Date Filter */}
                                        <div style={{ marginBottom: 14 }}>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>
                                                📅 Hızlı Tarih Filtresi
                                            </label>
                                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                {QUICK_DATES.map(df => {
                                                    const count = events.filter(e => isInDateRange(e.start, df.key, '', '')).length
                                                    return (
                                                        <motion.button key={df.key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                            onClick={() => { setDateFilter(df.key); setCustomDateFrom(''); setCustomDateTo('') }}
                                                            style={{
                                                                padding: '6px 12px', borderRadius: 10, border: 'none',
                                                                fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer',
                                                                background: dateFilter === df.key && !customDateFrom ? '#D4A853' : 'var(--bg-tertiary)',
                                                                color: dateFilter === df.key && !customDateFrom ? 'white' : count > 0 ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                                                                transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: 4,
                                                                opacity: count === 0 && df.key !== 'all' ? 0.5 : 1,
                                                            }}>
                                                            {df.emoji} {df.label}
                                                            {searched && <span style={{
                                                                fontSize: '0.62rem', padding: '1px 5px', borderRadius: 6,
                                                                background: dateFilter === df.key ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)',
                                                                fontWeight: 700,
                                                            }}>{count}</span>}
                                                        </motion.button>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* Custom Date Range Picker */}
                                        <div style={{ marginBottom: 6 }}>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>
                                                🗓️ Tarih Aralığı Seç
                                            </label>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <input type="date" value={customDateFrom}
                                                        onChange={e => { setCustomDateFrom(e.target.value); setDateFilter('custom') }}
                                                        style={{
                                                            padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)',
                                                            background: 'var(--bg-primary)', color: 'var(--text-primary)',
                                                            fontSize: '0.82rem', cursor: 'pointer',
                                                        }} />
                                                    <span style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>→</span>
                                                    <input type="date" value={customDateTo}
                                                        onChange={e => { setCustomDateTo(e.target.value); setDateFilter('custom') }}
                                                        style={{
                                                            padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)',
                                                            background: 'var(--bg-primary)', color: 'var(--text-primary)',
                                                            fontSize: '0.82rem', cursor: 'pointer',
                                                        }} />
                                                </div>
                                                {(customDateFrom || customDateTo) && (
                                                    <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                        onClick={clearDateFilter}
                                                        style={{
                                                            padding: '6px 12px', borderRadius: 8, border: 'none',
                                                            background: 'rgba(239,68,68,0.1)', color: '#EF4444',
                                                            fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: 4,
                                                        }}>
                                                        <X size={12} /> Temizle
                                                    </motion.button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* ═══ LOADING ═══ */}
                    {loading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{ textAlign: 'center', padding: 60 }}>
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                <Loader2 size={32} style={{ color: '#8B5CF6' }} />
                            </motion.div>
                            <p style={{ margin: '14px 0 0', fontSize: '0.88rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                🔍 {activeCity} etkinlikleri aranıyor...
                            </p>
                        </motion.div>
                    )}

                    {/* ═══ RESULTS ═══ */}
                    <AnimatePresence>
                        {searched && !loading && (
                            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                                {filteredEvents.length > 0 ? (
                                    <>
                                        {/* Results header */}
                                        <div style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            marginBottom: 16, flexWrap: 'wrap', gap: 8,
                                        }}>
                                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                                                <Ticket size={18} style={{ color: '#EC4899', marginRight: 6 }} />
                                                {filteredEvents.length} etkinlik
                                                {filteredEvents.length !== events.length && (
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500, marginLeft: 6 }}>
                                                        / {events.length} toplam
                                                    </span>
                                                )}
                                            </h2>
                                        </div>

                                        {/* Event Cards Grid */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                            gap: 18,
                                        }}>
                                            {filteredEvents.map((event, i) => (
                                                <motion.div key={event.id || i}
                                                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(0,0,0,0.12)' }}
                                                    style={{
                                                        background: 'var(--bg-secondary)', borderRadius: 22,
                                                        overflow: 'hidden', border: '1px solid var(--border)',
                                                        transition: 'all 250ms', position: 'relative',
                                                    }}>
                                                    {/* Poster / Gradient fallback */}
                                                    {event.poster_url ? (
                                                        <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
                                                            <img src={event.poster_url} alt={event.name} loading="lazy"
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 400ms' }}
                                                                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.06)'}
                                                                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                                                onError={e => { e.currentTarget.style.display = 'none' }}
                                                            />
                                                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.65))' }} />
                                                            {/* Category badge */}
                                                            <span style={{
                                                                position: 'absolute', top: 12, left: 12,
                                                                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                                                                padding: '5px 12px', borderRadius: 10,
                                                                color: 'white', fontSize: '0.68rem', fontWeight: 700,
                                                            }}>{event.emoji} {event.format || event.category || 'Etkinlik'}</span>
                                                            {/* Days until badge */}
                                                            {daysUntil(event.start) && (
                                                                <span style={{
                                                                    position: 'absolute', top: 12, right: 12,
                                                                    background: daysUntil(event.start) === 'Bugün' ? 'rgba(239,68,68,0.85)' :
                                                                        daysUntil(event.start) === 'Yarın' ? 'rgba(245,158,11,0.85)' : 'rgba(74,127,191,0.85)',
                                                                    backdropFilter: 'blur(8px)',
                                                                    padding: '5px 12px', borderRadius: 10,
                                                                    color: 'white', fontSize: '0.68rem', fontWeight: 700,
                                                                }}>⏰ {daysUntil(event.start)}</span>
                                                            )}
                                                            {/* Favorite */}
                                                            <motion.button whileTap={{ scale: 0.8 }}
                                                                onClick={() => toggleFavorite(event.id)}
                                                                style={{
                                                                    position: 'absolute', bottom: 12, right: 12,
                                                                    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
                                                                    border: 'none', borderRadius: '50%', width: 36, height: 36,
                                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                }}>
                                                                <Heart size={16} fill={favorites.has(event.id) ? '#EF4444' : 'none'} stroke={favorites.has(event.id) ? '#EF4444' : 'white'} />
                                                            </motion.button>
                                                            {/* Price label */}
                                                            {(event.is_free || event.price_label) && (
                                                                <span style={{
                                                                    position: 'absolute', bottom: 12, left: 12,
                                                                    background: event.is_free ? 'rgba(16,185,129,0.85)' : 'rgba(74,127,191,0.85)',
                                                                    backdropFilter: 'blur(8px)',
                                                                    padding: '4px 10px', borderRadius: 8,
                                                                    color: 'white', fontSize: '0.65rem', fontWeight: 700,
                                                                }}>
                                                                    {event.is_free ? '🎉 Ücretsiz' : `💰 ${event.price_label}`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div style={{
                                                            height: 100,
                                                            background: GRADIENTS[i % GRADIENTS.length],
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            position: 'relative',
                                                        }}>
                                                            <span style={{ fontSize: '2.5rem', opacity: 0.9 }}>{event.emoji}</span>
                                                            <span style={{
                                                                position: 'absolute', top: 10, left: 10,
                                                                background: 'rgba(0,0,0,0.3)', padding: '4px 10px',
                                                                borderRadius: 8, color: 'white', fontSize: '0.65rem', fontWeight: 700,
                                                            }}>{event.format || event.category || 'Etkinlik'}</span>
                                                            {daysUntil(event.start) && (
                                                                <span style={{
                                                                    position: 'absolute', top: 10, right: 10,
                                                                    background: 'rgba(0,0,0,0.3)', padding: '4px 10px',
                                                                    borderRadius: 8, color: 'white', fontSize: '0.65rem', fontWeight: 700,
                                                                }}>⏰ {daysUntil(event.start)}</span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Body */}
                                                    <div style={{ padding: '16px 20px 18px' }}>
                                                        <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: '0 0 8px', lineHeight: 1.35 }}>
                                                            {event.name}
                                                        </h3>

                                                        {event.description && (
                                                            <p style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', margin: '0 0 12px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                                {event.description}
                                                            </p>
                                                        )}

                                                        {/* Meta info */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                                                                <Calendar size={13} style={{ color: '#EC4899', flexShrink: 0 }} />
                                                                <span style={{ fontWeight: 600 }}>{formatDate(event.start)}</span>
                                                                {event.start && (
                                                                    <span style={{ color: 'var(--text-tertiary)' }}>· {formatTime(event.start)}</span>
                                                                )}
                                                            </div>
                                                            {event.venue_name && (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.73rem', color: 'var(--text-tertiary)' }}>
                                                                    <MapPin size={12} style={{ color: '#8B5CF6', flexShrink: 0 }} />
                                                                    {event.venue_name}
                                                                    {event.district && <span style={{ opacity: 0.7 }}>· {event.district}</span>}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Tags */}
                                                        {event.tags?.length > 0 && (
                                                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
                                                                {event.tags.slice(0, 3).map((tag, ti) => (
                                                                    <span key={ti} style={{
                                                                        fontSize: '0.62rem', padding: '3px 8px', borderRadius: 6,
                                                                        background: 'rgba(139,92,246,0.08)', color: '#8B5CF6', fontWeight: 600,
                                                                    }}>{tag}</span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Action Buttons */}
                                                        <div style={{ display: 'flex', gap: 6 }}>
                                                            {event.ticket_url && (
                                                                <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                                                    href={event.ticket_url} target="_blank" rel="noopener noreferrer"
                                                                    style={{
                                                                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                                        padding: '10px', borderRadius: 12,
                                                                        background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
                                                                        color: 'white', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700,
                                                                        boxShadow: '0 4px 12px rgba(236,72,153,0.2)',
                                                                    }}>
                                                                    <Ticket size={14} /> Bilet Al <ExternalLink size={10} />
                                                                </motion.a>
                                                            )}
                                                            {event.url && (
                                                                <a href={event.url} target="_blank" rel="noopener noreferrer"
                                                                    style={{
                                                                        flex: event.ticket_url ? 0 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                                        padding: '10px 14px', borderRadius: 12,
                                                                        background: 'var(--bg-tertiary)',
                                                                        color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600,
                                                                        border: '1px solid var(--border)',
                                                                    }}>
                                                                    Detay <ExternalLink size={10} />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Attribution */}
                                        <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: 24 }}>
                                            Etkinlik verileri <strong>etkinlik.io</strong> ve <strong>Ticketmaster</strong> tarafından sağlanmaktadır.
                                        </p>
                                    </>
                                ) : (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        style={{
                                            textAlign: 'center', padding: '50px 20px',
                                            background: 'var(--bg-secondary)', borderRadius: 24,
                                            border: '1px solid var(--border)',
                                        }}>
                                        <div style={{ fontSize: 60, marginBottom: 12, opacity: 0.3 }}>🎭</div>
                                        <h3 style={{ margin: '0 0 8px', fontWeight: 700 }}>Etkinlik Bulunamadı</h3>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', margin: '0 0 16px' }}>
                                            {(customDateFrom || customDateTo || dateFilter !== 'all')
                                                ? 'Seçtiğiniz tarih aralığında etkinlik bulunamadı. Farklı bir tarih deneyin.'
                                                : 'Bu şehirde şu anda etkinlik bulunamadı. Farklı bir şehir deneyin.'}
                                        </p>
                                        {(customDateFrom || customDateTo || dateFilter !== 'all') && (
                                            <button onClick={clearDateFilter}
                                                style={{
                                                    padding: '10px 20px', borderRadius: 12, border: 'none',
                                                    background: '#D4A853', color: 'white', fontSize: '0.82rem',
                                                    fontWeight: 700, cursor: 'pointer',
                                                }}>
                                                📅 Tüm Tarihleri Göster
                                            </button>
                                        )}
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
        </div>
    )
}
