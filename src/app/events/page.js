'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import {
    Search, Loader2, Calendar, MapPin, Clock, ExternalLink,
    Ticket, Star, Filter, ChevronDown, Music,
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
    { key: '', label: 'Tümü', emoji: '🎫' },
    { key: 'konser', label: 'Konser', emoji: '🎵' },
    { key: 'sahne-sanatlari', label: 'Tiyatro', emoji: '🎭' },
    { key: 'stand-up', label: 'Stand Up', emoji: '😂' },
    { key: 'sergi', label: 'Sergi', emoji: '🖼️' },
    { key: 'festival', label: 'Festival', emoji: '🎪' },
    { key: 'spor', label: 'Spor', emoji: '⚽' },
    { key: 'cocuk', label: 'Çocuk', emoji: '👶' },
    { key: 'soylesi', label: 'Söyleşi', emoji: '💬' },
]

const DATE_FILTERS = [
    { key: 'all', label: 'Tümü' },
    { key: 'today', label: 'Bugün' },
    { key: 'tomorrow', label: 'Yarın' },
    { key: 'this_week', label: 'Bu Hafta' },
    { key: 'this_month', label: 'Bu Ay' },
    { key: 'weekend', label: 'Hafta Sonu' },
]

function formatDate(dateStr) {
    if (!dateStr) return ''
    try {
        const d = new Date(dateStr)
        if (isNaN(d.getTime())) return ''
        return d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
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

function isInDateRange(eventStart, filterKey) {
    if (!eventStart || filterKey === 'all') return true
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

    const [city, setCity] = useState('istanbul')
    const [customCity, setCustomCity] = useState('')
    const [format, setFormat] = useState('')
    const [dateFilter, setDateFilter] = useState('all')
    const [events, setEvents] = useState([])
    const [filteredEvents, setFilteredEvents] = useState([])
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)
    const [total, setTotal] = useState(0)

    useEffect(() => { searchEvents() }, [])

    // Apply date filter whenever events or dateFilter changes
    useEffect(() => {
        const filtered = events.filter(e => isInDateRange(e.start, dateFilter))
        setFilteredEvents(filtered)
    }, [events, dateFilter])

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
                            position: 'relative', minHeight: 200,
                            background: 'linear-gradient(135deg, #0F172A, #1E293B)',
                        }}>
                        <div style={{
                            width: '100%', height: 200,
                            background: 'linear-gradient(135deg, rgba(236,72,153,0.6), rgba(79,70,229,0.6), rgba(16,185,129,0.4))',
                            display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px',
                        }}>
                            <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 900, margin: 0, textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
                                🎭 Etkinlikler
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', margin: '6px 0 0', maxWidth: 500 }}>
                                Türkiye ve dünya genelinde konser, tiyatro, festival ve daha fazlası
                            </p>
                        </div>
                    </motion.div>

                    {/* ═══ SEARCH PANEL ═══ */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        style={sectionStyle}>
                        <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800 }}>
                            <Search size={18} style={{ marginRight: 6, color: '#EC4899' }} />
                            Etkinlik Ara
                        </h2>

                        {/* City Selection — Turkey */}
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>🇹🇷 Türkiye</label>
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                {CITIES_TR.map(c => (
                                    <button key={c.slug} onClick={() => { setCity(c.slug); setCustomCity('') }}
                                        style={{
                                            padding: '7px 12px', borderRadius: 10, border: city === c.slug && !customCity ? 'none' : '1px solid var(--border)',
                                            fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer',
                                            background: city === c.slug && !customCity ? 'linear-gradient(135deg, #EC4899, #8B5CF6)' : 'var(--bg-primary)',
                                            color: city === c.slug && !customCity ? 'white' : 'var(--text-secondary)',
                                            transition: 'all 150ms',
                                        }}>{c.emoji} {c.name}</button>
                                ))}
                            </div>
                        </div>

                        {/* City Selection — International */}
                        <div style={{ marginBottom: 10 }}>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>🌍 Uluslararası</label>
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                {CITIES_INT.map(c => (
                                    <button key={c.slug} onClick={() => { setCity(c.slug); setCustomCity('') }}
                                        style={{
                                            padding: '7px 12px', borderRadius: 10, border: city === c.slug && !customCity ? 'none' : '1px solid var(--border)',
                                            fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer',
                                            background: city === c.slug && !customCity ? 'linear-gradient(135deg, #3B82F6, #6366F1)' : 'var(--bg-primary)',
                                            color: city === c.slug && !customCity ? 'white' : 'var(--text-secondary)',
                                            transition: 'all 150ms',
                                        }}>{c.emoji} {c.name}</button>
                                ))}
                            </div>
                        </div>

                        {/* Custom City Input */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>🔍 Başka Şehir</label>
                            <input type="text" placeholder="Herhangi bir şehir yazın... (ör: Milano, Singapur)"
                                value={customCity} onChange={e => setCustomCity(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && searchEvents(customCity)}
                                style={{
                                    width: '100%', padding: '10px 14px', borderRadius: 12,
                                    border: '1px solid var(--border)', background: 'var(--bg-primary)',
                                    color: 'var(--text-primary)', fontSize: '0.85rem',
                                }} />
                        </div>

                        {/* Format/Category Filter */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>🎭 Kategori</label>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {FORMATS.map(f => (
                                    <button key={f.key} onClick={() => setFormat(f.key)}
                                        style={{
                                            padding: '7px 12px', borderRadius: 10, border: 'none',
                                            fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                                            background: format === f.key ? '#10B981' : 'var(--bg-tertiary)',
                                            color: format === f.key ? 'white' : 'var(--text-secondary)',
                                            transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: 4,
                                        }}>{f.emoji} {f.label}</button>
                                ))}
                            </div>
                        </div>

                        {/* Date Filter */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>📅 Tarih</label>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {DATE_FILTERS.map(df => (
                                    <button key={df.key} onClick={() => setDateFilter(df.key)}
                                        style={{
                                            padding: '7px 12px', borderRadius: 10, border: 'none',
                                            fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                                            background: dateFilter === df.key ? '#818CF8' : 'var(--bg-tertiary)',
                                            color: dateFilter === df.key ? 'white' : 'var(--text-secondary)',
                                            transition: 'all 150ms',
                                        }}>{df.label}</button>
                                ))}
                            </div>
                        </div>

                        {/* Search Button */}
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={searchEvents} disabled={loading}
                            style={{
                                width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                                background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
                                color: 'white', fontSize: '1rem', fontWeight: 800, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                boxShadow: '0 4px 14px rgba(236,72,153,0.3)',
                            }}>
                            {loading ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
                            {loading ? 'Etkinlikler Aranıyor...' : 'Etkinlikleri Ara'}
                        </motion.button>
                    </motion.div>

                    {/* ═══ RESULTS ═══ */}
                    <AnimatePresence>
                        {searched && (
                            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                                    <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                                        <Ticket size={16} style={{ color: '#EC4899', marginRight: 6 }} />
                                        {filteredEvents.length} etkinlik
                                        {dateFilter !== 'all' && <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500 }}> ({DATE_FILTERS.find(d => d.key === dateFilter)?.label})</span>}
                                        {' — '}{[...CITIES_TR, ...CITIES_INT].find(c => c.slug === city)?.name || customCity || city}
                                    </h2>
                                    {filteredEvents.length !== events.length && (
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                            Toplam {events.length} etkinlikten {filteredEvents.length} tanesi gösteriliyor
                                        </span>
                                    )}
                                </div>

                                {filteredEvents.length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
                                        {filteredEvents.map((event, i) => (
                                            <motion.div key={event.id || i}
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(0,0,0,0.15)' }}
                                                style={{
                                                    background: 'var(--bg-secondary)', borderRadius: 20,
                                                    overflow: 'hidden', border: '1px solid var(--border)',
                                                    transition: 'all 200ms',
                                                }}>
                                                {/* Poster */}
                                                {event.poster_url ? (
                                                    <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
                                                        <img src={event.poster_url} alt={event.name} loading="lazy"
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 300ms' }}
                                                            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                                            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                                            onError={e => { e.currentTarget.style.display = 'none' }}
                                                        />
                                                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.7))' }} />
                                                        {/* Category badge */}
                                                        <span style={{
                                                            position: 'absolute', top: 10, left: 10,
                                                            background: 'rgba(236,72,153,0.85)', backdropFilter: 'blur(4px)',
                                                            padding: '4px 10px', borderRadius: 8,
                                                            color: 'white', fontSize: '0.65rem', fontWeight: 700,
                                                        }}>{event.emoji} {event.format || event.category || 'Etkinlik'}</span>
                                                        {event.is_free && (
                                                            <span style={{
                                                                position: 'absolute', top: 10, right: 10,
                                                                background: 'rgba(16,185,129,0.85)', backdropFilter: 'blur(4px)',
                                                                padding: '4px 10px', borderRadius: 8,
                                                                color: 'white', fontSize: '0.65rem', fontWeight: 700,
                                                            }}>🎉 Ücretsiz</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        height: 80,
                                                        background: `linear-gradient(135deg, ${['#EC4899', '#8B5CF6', '#6366F1', '#0D9488', '#F59E0B', '#EF4444', '#10B981', '#3B82F6'][i % 8]}80, ${['#8B5CF6', '#6366F1', '#EC4899', '#F59E0B', '#0D9488', '#F472B6', '#34D399', '#818CF8'][i % 8]}80)`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '2rem',
                                                    }}>{event.emoji}</div>
                                                )}

                                                {/* Body */}
                                                <div style={{ padding: '16px 20px 20px' }}>
                                                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 6px', lineHeight: 1.3 }}>
                                                        {event.name}
                                                    </h3>

                                                    {event.description && (
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '0 0 10px', lineHeight: 1.4 }}>
                                                            {event.description.slice(0, 120)}{event.description.length > 120 ? '...' : ''}
                                                        </p>
                                                    )}

                                                    {/* Meta */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                            <Calendar size={13} style={{ color: '#EC4899' }} />
                                                            {formatDate(event.start)}
                                                            {event.start && (
                                                                <span style={{ color: 'var(--text-tertiary)' }}>· {formatTime(event.start)}</span>
                                                            )}
                                                        </div>
                                                        {event.end && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                                                                <Clock size={11} style={{ color: '#818CF8' }} />
                                                                Bitiş: {formatTime(event.end)}
                                                            </div>
                                                        )}
                                                        {event.venue_name && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                                                <MapPin size={12} style={{ color: '#8B5CF6' }} />
                                                                {event.venue_name}
                                                                {event.district && <span style={{ opacity: 0.7 }}>· {event.district}</span>}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Tags */}
                                                    {event.tags?.length > 0 && (
                                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                                                            {event.tags.slice(0, 3).map((tag, ti) => (
                                                                <span key={ti} style={{
                                                                    fontSize: '0.62rem', padding: '2px 8px', borderRadius: 6,
                                                                    background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', fontWeight: 600,
                                                                }}>{tag}</span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Action Buttons */}
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        {event.ticket_url && (
                                                            <a href={event.ticket_url} target="_blank" rel="noopener noreferrer"
                                                                style={{
                                                                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                                    padding: '10px', borderRadius: 10,
                                                                    background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
                                                                    color: 'white', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700,
                                                                }}>
                                                                <Ticket size={14} /> Bilet Al <ExternalLink size={10} />
                                                            </a>
                                                        )}
                                                        {event.url && (
                                                            <a href={event.url} target="_blank" rel="noopener noreferrer"
                                                                style={{
                                                                    flex: event.ticket_url ? 0 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                                    padding: '10px 14px', borderRadius: 10,
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
                                ) : (
                                    <div style={{
                                        ...sectionStyle,
                                        textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)',
                                    }}>
                                        <Calendar size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                                        <p style={{ fontSize: '0.9rem' }}>
                                            {dateFilter !== 'all'
                                                ? `"${DATE_FILTERS.find(d => d.key === dateFilter)?.label}" tarihinde etkinlik bulunamadı.`
                                                : 'Bu şehirde şu anda etkinlik bulunamadı.'}
                                        </p>
                                        <p style={{ fontSize: '0.75rem' }}>
                                            {dateFilter !== 'all'
                                                ? 'Farklı bir tarih filtresi veya "Tümü" deneyin.'
                                                : 'Farklı bir şehir veya kategori deneyin.'}
                                        </p>
                                        {dateFilter !== 'all' && (
                                            <button onClick={() => setDateFilter('all')}
                                                style={{ marginTop: 8, padding: '8px 16px', borderRadius: 10, border: 'none', background: '#818CF8', color: 'white', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                                                Tüm Tarihleri Göster
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Attribution */}
                                {filteredEvents.length > 0 && (
                                    <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: 16 }}>
                                        Etkinlik verileri etkinlik.io ve Ticketmaster tarafından sağlanmaktadır.
                                    </p>
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
