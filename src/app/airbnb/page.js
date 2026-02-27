'use client'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import { Search, Star, Users, Bed, MapPin, Loader2, ExternalLink, Heart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const POPULAR_CITIES = [
    'İstanbul', 'Antalya', 'Bodrum', 'Fethiye', 'Kapadokya',
    'Paris', 'Roma', 'Barselona', 'Amsterdam', 'Dubai',
    'Londra', 'Prag', 'Budapeşte', 'Tiflis', 'Bali',
]

function getTodayStr(offset = 7) {
    const d = new Date(); d.setDate(d.getDate() + offset)
    return d.toISOString().split('T')[0]
}

export default function AirbnbPage() {
    const { user } = useAuth()
    const { t } = useLanguage()
    const [location, setLocation] = useState('')
    const [checkin, setCheckin] = useState(getTodayStr(7))
    const [checkout, setCheckout] = useState(getTodayStr(11))
    const [guests, setGuests] = useState(2)
    const [listings, setListings] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchDone, setSearchDone] = useState(false)
    const [error, setError] = useState('')
    const [favorites, setFavorites] = useState([])
    const [photoIdx, setPhotoIdx] = useState({})

    const searchListings = async (city) => {
        const q = city || location
        if (!q) return
        setLoading(true); setSearchDone(false); setError('')
        try {
            const params = new URLSearchParams({
                location: q, adults: String(guests), currency: 'TRY',
            })
            if (checkin) params.set('checkin', checkin)
            if (checkout) params.set('checkout', checkout)
            const res = await fetch(`/api/airbnb?${params}`)
            const data = await res.json()
            if (data.error) setError(data.error)
            setListings(data.listings || [])
        } catch (e) { setError(e.message); setListings([]) }
        setLoading(false); setSearchDone(true)
    }

    const toggleFav = (id) => setFavorites(prev =>
        prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )

    const nextPhoto = (id, max) => setPhotoIdx(prev => ({
        ...prev, [id]: ((prev[id] || 0) + 1) % max,
    }))

    const sectionStyle = {
        background: 'var(--bg-secondary)', borderRadius: 20,
        border: '1px solid var(--border)', padding: '24px 28px', marginBottom: 20,
    }
    const inputStyle = {
        width: '100%', padding: '12px 16px', borderRadius: 12,
        border: '1px solid var(--border)', background: 'var(--bg-primary)',
        color: 'var(--text-primary)', fontSize: '0.88rem', fontWeight: 600,
    }

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-main" style={{ overflowY: 'auto' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 60px' }}>

                    {/* HERO */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                            borderRadius: 24, overflow: 'hidden', marginBottom: 24,
                            position: 'relative', minHeight: 180,
                            background: 'linear-gradient(135deg, #831843, #be185d, #f43f5e)',
                        }}>
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(135deg, rgba(0,0,0,0.3), transparent)',
                            display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px',
                        }}>
                            <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 900, margin: 0 }}>🏠 Konaklama</h1>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.92rem', margin: '6px 0 0' }}>
                                Airbnb üzerinden gerçek ilanları keşfedin
                            </p>
                        </div>
                    </motion.div>

                    {/* SEARCH */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        style={sectionStyle}>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                            <div style={{ flex: '2 1 200px' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>📍 Nerede</label>
                                <input type="text" placeholder="Şehir veya bölge yazın..." value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && searchListings()}
                                    style={inputStyle} />
                            </div>
                            <div style={{ flex: '1 1 140px' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>📅 Giriş</label>
                                <input type="date" value={checkin} onChange={e => setCheckin(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]} style={inputStyle} />
                            </div>
                            <div style={{ flex: '1 1 140px' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>📅 Çıkış</label>
                                <input type="date" value={checkout} onChange={e => setCheckout(e.target.value)}
                                    min={checkin} style={inputStyle} />
                            </div>
                            <div style={{ flex: '0 0 90px' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>👤 Kişi</label>
                                <select value={guests} onChange={e => setGuests(parseInt(e.target.value))} style={inputStyle}>
                                    {[1, 2, 3, 4, 5, 6, 8, 10].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                        </div>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => searchListings()} disabled={loading || !location}
                            style={{
                                width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                                background: location ? 'linear-gradient(135deg, #E11D48, #F43F5E)' : 'var(--bg-tertiary)',
                                color: location ? 'white' : 'var(--text-tertiary)',
                                fontSize: '1rem', fontWeight: 800, cursor: location ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}>
                            {loading ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
                            {loading ? 'Aranıyor...' : 'Konaklama Ara'}
                        </motion.button>
                    </motion.div>

                    {/* POPULAR CITIES */}
                    {!searchDone && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            style={sectionStyle}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 10px' }}>🔥 Popüler Şehirler</h3>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {POPULAR_CITIES.map(city => (
                                    <button key={city} onClick={() => { setLocation(city); searchListings(city) }}
                                        style={{
                                            padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)',
                                            background: 'var(--bg-primary)', color: 'var(--text-secondary)',
                                            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 150ms',
                                        }}
                                        onMouseOver={e => { e.currentTarget.style.background = '#E11D48'; e.currentTarget.style.color = 'white' }}
                                        onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
                                        {city}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* RESULTS */}
                    <AnimatePresence>
                        {searchDone && (
                            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                                {error && (
                                    <div style={{ ...sectionStyle, background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#EF4444' }}>⚠️ {error}</p>
                                    </div>
                                )}

                                {listings.length > 0 && (
                                    <>
                                        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 14 }}>
                                            🏠 {listings.length} konaklama — {location}
                                        </h2>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
                                            {listings.map((listing, i) => {
                                                const curPhoto = photoIdx[listing.id] || 0
                                                return (
                                                    <motion.div key={listing.id}
                                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.04 }}
                                                        whileHover={{ y: -5, boxShadow: '0 14px 35px rgba(0,0,0,0.12)' }}
                                                        style={{
                                                            background: 'var(--bg-secondary)', borderRadius: 20,
                                                            border: '1px solid var(--border)', overflow: 'hidden',
                                                            transition: 'all 200ms',
                                                        }}>
                                                        {/* Photo */}
                                                        <div style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden', cursor: 'pointer' }}
                                                            onClick={() => listing.photos.length > 1 && nextPhoto(listing.id, listing.photos.length)}>
                                                            {listing.photos[curPhoto] ? (
                                                                <img src={listing.photos[curPhoto]} alt={listing.name} loading="lazy"
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 300ms' }}
                                                                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                                                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
                                                            ) : (
                                                                <div style={{ width: '100%', height: '100%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <MapPin size={32} style={{ opacity: 0.3 }} />
                                                                </div>
                                                            )}
                                                            {/* Photo counter */}
                                                            {listing.photos.length > 1 && (
                                                                <span style={{
                                                                    position: 'absolute', bottom: 8, right: 8,
                                                                    background: 'rgba(0,0,0,0.6)', color: 'white',
                                                                    padding: '2px 8px', borderRadius: 8, fontSize: '0.6rem',
                                                                }}>{curPhoto + 1}/{listing.photos.length}</span>
                                                            )}
                                                            {/* Superhost */}
                                                            {listing.isSuperhost && (
                                                                <span style={{
                                                                    position: 'absolute', top: 10, left: 10,
                                                                    background: 'white', color: '#222', padding: '3px 10px',
                                                                    borderRadius: 8, fontSize: '0.62rem', fontWeight: 700,
                                                                }}>⭐ Süper Ev Sahibi</span>
                                                            )}
                                                            {/* Fav */}
                                                            <button onClick={e => { e.stopPropagation(); toggleFav(listing.id) }}
                                                                style={{
                                                                    position: 'absolute', top: 10, right: 10,
                                                                    background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
                                                                    border: 'none', borderRadius: '50%', width: 32, height: 32,
                                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                }}>
                                                                <Heart size={15} fill={favorites.includes(listing.id) ? '#F43F5E' : 'none'}
                                                                    color={favorites.includes(listing.id) ? '#F43F5E' : 'white'} />
                                                            </button>
                                                        </div>

                                                        {/* Info */}
                                                        <div style={{ padding: '14px 18px 18px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                                                <div style={{ flex: 1 }}>
                                                                    <h3 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
                                                                        {listing.name?.slice(0, 60)}{listing.name?.length > 60 ? '...' : ''}
                                                                    </h3>
                                                                    <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                                                                        {listing.type} · {listing.neighborhood || listing.city}
                                                                    </p>
                                                                </div>
                                                                {listing.rating > 0 && (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                                                                        <Star size={13} fill="#F59E0B" color="#F59E0B" />
                                                                        <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{listing.rating.toFixed(1)}</span>
                                                                        {listing.reviewCount > 0 && (
                                                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>({listing.reviewCount})</span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Amenities */}
                                                            <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
                                                                {listing.beds > 0 && (
                                                                    <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 6, background: 'rgba(129,140,248,0.1)', color: '#818CF8', fontWeight: 600 }}>
                                                                        🛏️ {listing.beds} yatak
                                                                    </span>
                                                                )}
                                                                {listing.guests > 0 && (
                                                                    <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 6, background: 'rgba(16,185,129,0.1)', color: '#10B981', fontWeight: 600 }}>
                                                                        👤 {listing.guests} kişi
                                                                    </span>
                                                                )}
                                                                {listing.amenities?.map((a, ai) => (
                                                                    <span key={ai} style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 6, background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                                                        {a}
                                                                    </span>
                                                                ))}
                                                            </div>

                                                            {/* Price + Book */}
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                                                                <div>
                                                                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                                                                        ₺{new Intl.NumberFormat('tr-TR').format(listing.price)}
                                                                    </span>
                                                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}> /gece</span>
                                                                </div>
                                                                <a href={listing.url} target="_blank" rel="noopener noreferrer"
                                                                    style={{
                                                                        display: 'flex', alignItems: 'center', gap: 6,
                                                                        padding: '8px 16px', borderRadius: 10, textDecoration: 'none',
                                                                        background: '#E11D48', color: 'white',
                                                                        fontSize: '0.78rem', fontWeight: 700, transition: 'all 150ms',
                                                                    }}
                                                                    onMouseOver={e => e.currentTarget.style.background = '#BE123C'}
                                                                    onMouseOut={e => e.currentTarget.style.background = '#E11D48'}>
                                                                    Airbnb'de Gör <ExternalLink size={12} />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )
                                            })}
                                        </div>
                                    </>
                                )}

                                {listings.length === 0 && !error && (
                                    <div style={{ ...sectionStyle, textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                        <MapPin size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                                        <p>Bu lokasyonda ilan bulunamadı.</p>
                                    </div>
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
