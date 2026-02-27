'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import {
    Search, Loader2, Calendar, MapPin, Clock, ExternalLink,
    Ticket, Star, Filter, ChevronDown, Music, Theater, Camera,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const CITIES = [
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

function formatDate(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'long' })
}

function formatTime(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

export default function EventsPage() {
    const router = useRouter()
    const { user } = useAuth()
    const { t } = useLanguage()

    const [city, setCity] = useState('istanbul')
    const [format, setFormat] = useState('')
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)
    const [total, setTotal] = useState(0)

    useEffect(() => {
        searchEvents()
    }, [])

    const searchEvents = async () => {
        setLoading(true)
        setSearched(false)
        try {
            const params = new URLSearchParams({ city })
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
                                Konser, tiyatro, stand-up, sergi ve daha fazlası — şehrindeki etkinlikleri keşfet
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

                        {/* City Selection */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>📍 Şehir</label>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {CITIES.map(c => (
                                    <button key={c.slug} onClick={() => setCity(c.slug)}
                                        style={{
                                            padding: '8px 14px', borderRadius: 10, border: 'none',
                                            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                                            background: city === c.slug ? 'linear-gradient(135deg, #EC4899, #8B5CF6)' : 'var(--bg-tertiary)',
                                            color: city === c.slug ? 'white' : 'var(--text-secondary)',
                                            transition: 'all 150ms',
                                        }}>{c.emoji} {c.name}</button>
                                ))}
                            </div>
                        </div>

                        {/* Format/Category Filter */}
                        <div style={{ marginBottom: 16 }}>
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
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                                        <Ticket size={16} style={{ color: '#EC4899', marginRight: 6 }} />
                                        {total} etkinlik bulundu — {CITIES.find(c => c.slug === city)?.name || city}
                                    </h2>
                                </div>

                                {events.length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
                                        {events.map((event, i) => (
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
                                        <p style={{ fontSize: '0.9rem' }}>Bu şehirde şu anda etkinlik bulunamadı.</p>
                                        <p style={{ fontSize: '0.75rem' }}>Farklı bir şehir veya kategori deneyin.</p>
                                    </div>
                                )}

                                {/* Attribution */}
                                {events.length > 0 && (
                                    <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: 16 }}>
                                        Etkinlik verileri etkinlik.io tarafından sağlanmaktadır.
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
