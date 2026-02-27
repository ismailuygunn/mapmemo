'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import {
    Plane, Calendar, Loader2, Search, MapPin, DollarSign,
    Shield, Clock, RefreshCw, X, ChevronDown, ChevronUp,
    Heart, Star, Compass, Sun, Snowflake, Palmtree, Coffee,
    Camera, Utensils, Mountain, Waves, Globe, Zap, ExternalLink, Filter,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ═══ STATIC DESTINATION DATA ═══
const POPULAR_DESTINATIONS = [
    {
        city: 'Roma', country: 'İtalya', code: 'FCO', emoji: '🇮🇹',
        tagline: 'La Dolce Vita', visa: 'Schengen',
        img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80',
        highlights: ['Kolezyum', 'Vatikan', 'Trevi Çeşmesi', 'Pantheon'],
        bestFor: ['Tarih', 'Yemek', 'Sanat'],
        avgPrice: '₺3,500-6,000',
    },
    {
        city: 'Barselona', country: 'İspanya', code: 'BCN', emoji: '🇪🇸',
        tagline: 'Güneş, Deniz & Gaudí', visa: 'Schengen',
        img: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
        highlights: ['Sagrada Familia', 'Park Güell', 'La Rambla', 'Plajlar'],
        bestFor: ['Plaj', 'Mimari', 'Gece Hayatı'],
        avgPrice: '₺3,200-5,500',
    },
    {
        city: 'Paris', country: 'Fransa', code: 'CDG', emoji: '🇫🇷',
        tagline: 'Aşkın Şehri', visa: 'Schengen',
        img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
        highlights: ['Eyfel Kulesi', 'Louvre', 'Montmartre', 'Seine'],
        bestFor: ['Romantik', 'Sanat', 'Yemek'],
        avgPrice: '₺3,800-7,000',
    },
    {
        city: 'Dubai', country: 'BAE', code: 'DXB', emoji: '🇦🇪',
        tagline: 'Geleceğin Şehri', visa: 'Kapıda Vize',
        img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80',
        highlights: ['Burj Khalifa', 'Dubai Mall', 'Çöl Safari', 'Palm Jumeirah'],
        bestFor: ['Lüks', 'Alışveriş', 'Macera'],
        avgPrice: '₺2,800-5,000',
    },
    {
        city: 'Bangkok', country: 'Tayland', code: 'BKK', emoji: '🇹🇭',
        tagline: 'Gülümsemenin Ülkesi', visa: 'Vizesiz',
        img: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80',
        highlights: ['Büyük Saray', 'Wat Pho', 'Chatuchak Pazarı', 'Khao San'],
        bestFor: ['Gurme', 'Tapınak', 'Gece Hayatı'],
        avgPrice: '₺4,500-7,500',
    },
    {
        city: 'Bali', country: 'Endonezya', code: 'DPS', emoji: '🇮🇩',
        tagline: 'Tanrıların Adası', visa: 'Kapıda Vize',
        img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',
        highlights: ['Ubud Pirinç Teras', 'Tanah Lot', 'Kuta Plajı', 'Maymun Ormanı'],
        bestFor: ['Doğa', 'Yoğa', 'Sörf'],
        avgPrice: '₺5,000-9,000',
    },
    {
        city: 'Budapeşte', country: 'Macaristan', code: 'BUD', emoji: '🇭🇺',
        tagline: 'Tuna\'nın İncisi', visa: 'Schengen',
        img: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=600&q=80',
        highlights: ['Parlamento', 'Termal Hamam', 'Balıkçı Burcu', 'Ruin Bar'],
        bestFor: ['Kültür', 'Termal', 'Bütçeye Uygun'],
        avgPrice: '₺2,000-3,500',
    },
    {
        city: 'Tiflis', country: 'Gürcistan', code: 'TBS', emoji: '🇬🇪',
        tagline: 'Kafkasya\'nın Kalbi', visa: 'Vizesiz',
        img: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=600&q=80',
        highlights: ['Eski Şehir', 'Narikala Kalesi', 'Kükürt Hamamları', 'Şarap'],
        bestFor: ['Bütçeye Uygun', 'Yemek', 'Tarih'],
        avgPrice: '₺1,200-2,500',
    },
    {
        city: 'Prag', country: 'Çekya', code: 'PRG', emoji: '🇨🇿',
        tagline: 'Yüz Kuleli Şehir', visa: 'Schengen',
        img: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=600&q=80',
        highlights: ['Karel Köprüsü', 'Prag Kalesi', 'Eski Şehir Meydanı', 'Bira'],
        bestFor: ['Tarih', 'Romantik', 'Bira'],
        avgPrice: '₺2,200-4,000',
    },
    {
        city: 'Saraybosna', country: 'Bosna', code: 'SJJ', emoji: '🇧🇦',
        tagline: 'Avrupa\'nın Kudüs\'ü', visa: 'Vizesiz',
        img: 'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=600&q=80',
        highlights: ['Başçarşı', 'Latin Köprüsü', 'Sebilj', 'Trebević'],
        bestFor: ['Kültür', 'Bütçeye Uygun', 'Tarih'],
        avgPrice: '₺1,500-3,000',
    },
    {
        city: 'Belgrad', country: 'Sırbistan', code: 'BEG', emoji: '🇷🇸',
        tagline: 'Balkanların Partisi', visa: 'Vizesiz',
        img: 'https://images.unsplash.com/photo-1577953175942-a5ee40753ebe?w=600&q=80',
        highlights: ['Kalemegdan', 'Knez Mihailova', 'Ada Ciganlija', 'Gece Hayatı'],
        bestFor: ['Gece Hayatı', 'Bütçeye Uygun', 'Eğlence'],
        avgPrice: '₺1,200-2,800',
    },
    {
        city: 'Tokyo', country: 'Japonya', code: 'NRT', emoji: '🇯🇵',
        tagline: 'Geleceğin Gelenekle Buluşması', visa: 'Vizesiz',
        img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
        highlights: ['Shibuya', 'Senso-ji', 'Akihabara', 'Tsukiji'],
        bestFor: ['Kültür', 'Yemek', 'Teknoloji'],
        avgPrice: '₺8,000-14,000',
    },
]

const TRAVEL_TYPES = [
    { key: 'any', emoji: '🌍', label: 'Fark etmez', en: 'Any' },
    { key: 'food', emoji: '🍽️', label: 'Gurme Gezisi', en: 'Food Tour' },
    { key: 'romantic', emoji: '💑', label: 'Romantik', en: 'Romantic' },
    { key: 'city', emoji: '🏙️', label: 'Şehir Tatili', en: 'City Break' },
    { key: 'beach', emoji: '🏖️', label: 'Yaz Tatili', en: 'Beach' },
    { key: 'winter', emoji: '❄️', label: 'Kış Tatili', en: 'Winter' },
    { key: 'nature', emoji: '🏔️', label: 'Doğa Tatili', en: 'Nature' },
    { key: 'adventure', emoji: '🎒', label: 'Keşif Tatili', en: 'Adventure' },
    { key: 'budget', emoji: '💰', label: 'Bütçeye Uygun', en: 'Budget' },
]

const ORIGIN_CITIES = [
    { code: 'IST', name: 'İstanbul' }, { code: 'ESB', name: 'Ankara' },
    { code: 'ADB', name: 'İzmir' }, { code: 'AYT', name: 'Antalya' },
    { code: 'SAW', name: 'İstanbul SAW' }, { code: 'ADA', name: 'Adana' },
    { code: 'TZX', name: 'Trabzon' }, { code: 'GZT', name: 'Gaziantep' },
]

const VISA_LABELS = {
    domestic: { tr: '🏠 Yurtiçi', color: '#6366F1' },
    visa_free: { tr: '✅ Vizesiz', color: '#22C55E' },
    visa_on_arrival: { tr: '🛬 Kapıda Vize', color: '#F59E0B' },
    e_visa: { tr: '📱 E-Vize', color: '#3B82F6' },
    visa_required: { tr: '📋 Vize Gerekli', color: '#EF4444' },
}

// ═══ DEEPLINK BUILDERS ═══
function buildDeeplinks(origin, dest, departDate, returnDate) {
    const dep = departDate || ''
    const ret = returnDate || ''
    const depSlash = dep.split('-').reverse().join('/')
    const retSlash = ret.split('-').reverse().join('/')

    return {
        googleFlights: `https://www.google.com/travel/flights?q=Flights+from+${origin}+to+${dest}+on+${dep}+return+${ret}&curr=TRY`,
        skyscanner: `https://www.skyscanner.com.tr/transport/flights/${origin.toLowerCase()}/${dest.toLowerCase()}/${dep.replace(/-/g, '').slice(2)}/${ret.replace(/-/g, '').slice(2)}/?adults=1&currency=TRY`,
        turna: `https://www.turna.com/ucak-bileti/${origin}-${dest}?departureDate=${dep}&returnDate=${ret}&adult=1`,
        kiwi: `https://www.kiwi.com/deep?from=${origin}&to=${dest}&departure=${depSlash}&return=${retSlash}&currency=TRY`,
        enuygun: `https://www.enuygun.com/ucak-bileti/arama/${origin.toLowerCase()}-${dest.toLowerCase()}/?gidis=${dep}&donus=${ret}&yetiskin=1`,
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)
}

export default function FlightsPage() {
    const router = useRouter()
    const { user, profile } = useAuth()
    const { t, locale } = useLanguage()

    // Search state
    const [origin, setOrigin] = useState('')
    const [duration, setDuration] = useState('4')
    const [month, setMonth] = useState('any')
    const [pattern, setPattern] = useState('any')
    const [maxBudget, setMaxBudget] = useState('')
    const [travelType, setTravelType] = useState('any')
    const [visaFilter, setVisaFilter] = useState('all') // all, visa_free, visa_on_arrival

    // Results
    const [deals, setDeals] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchDone, setSearchDone] = useState(false)

    // City detail
    const [selectedCity, setSelectedCity] = useState(null)

    // Favorites
    const [favorites, setFavorites] = useState(() => {
        if (typeof window !== 'undefined') {
            try { return JSON.parse(localStorage.getItem('naviso-fav-dests') || '[]') } catch { return [] }
        }
        return []
    })

    useEffect(() => {
        if (!origin && profile?.home_city) {
            const match = ORIGIN_CITIES.find(c => c.name.toLowerCase() === (profile.home_city || '').toLowerCase())
            setOrigin(match?.code || 'IST')
        } else if (!origin) {
            setOrigin('IST')
        }
    }, [profile])

    const toggleFav = (city) => {
        setFavorites(prev => {
            const next = prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
            try { localStorage.setItem('naviso-fav-dests', JSON.stringify(next)) } catch { }
            return next
        })
    }

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

    // Search
    const searchDeals = async () => {
        setLoading(true)
        setSearchDone(false)
        try {
            const params = new URLSearchParams({
                origin: origin || 'IST',
                max: '12',
                duration, month, pattern,
            })
            const res = await fetch(`/api/flight-deals?${params}`)
            const data = await res.json()
            let filtered = data.deals || []

            // Apply budget filter
            if (maxBudget && !isNaN(parseInt(maxBudget))) {
                filtered = filtered.filter(d => d.price <= parseInt(maxBudget))
            }

            // Apply visa filter
            if (visaFilter === 'visa_free') {
                filtered = filtered.filter(d => ['visa_free', 'domestic'].includes(d.visa?.type))
            } else if (visaFilter === 'visa_on_arrival') {
                filtered = filtered.filter(d => ['visa_free', 'visa_on_arrival', 'domestic'].includes(d.visa?.type))
            }

            setDeals(filtered)
        } catch { setDeals([]) }
        setLoading(false)
        setSearchDone(true)
    }

    // Filtered destinations for "Beğenebileceğiniz Yerler"
    const filteredDestinations = useMemo(() => {
        let dests = [...POPULAR_DESTINATIONS]
        if (travelType !== 'any') {
            const typeMap = {
                food: ['Gurme', 'Yemek'],
                romantic: ['Romantik'],
                city: ['Şehir', 'Kültür', 'Tarih'],
                beach: ['Plaj', 'Deniz', 'Sörf'],
                winter: ['Kış', 'Kayak'],
                nature: ['Doğa', 'Dağ', 'Yoğa'],
                adventure: ['Keşif', 'Macera', 'Sörf'],
                budget: ['Bütçeye Uygun'],
            }
            const keywords = typeMap[travelType] || []
            if (keywords.length > 0) {
                dests = dests.filter(d => d.bestFor.some(bf => keywords.some(k => bf.includes(k))))
            }
        }
        if (visaFilter === 'visa_free') {
            dests = dests.filter(d => d.visa === 'Vizesiz')
        } else if (visaFilter === 'visa_on_arrival') {
            dests = dests.filter(d => ['Vizesiz', 'Kapıda Vize'].includes(d.visa))
        }
        return dests
    }, [travelType, visaFilter])

    const sectionStyle = {
        background: 'var(--bg-secondary)', borderRadius: 20,
        border: '1px solid var(--border)', padding: '24px 28px', marginBottom: 20,
    }

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-main" style={{ overflowY: 'auto' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 60px' }}>

                    {/* ═══ HERO BANNER ═══ */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                            borderRadius: 24, overflow: 'hidden', marginBottom: 24,
                            position: 'relative', minHeight: 220,
                            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
                        }}
                    >
                        <img src="/flights-hero.png" alt="" style={{
                            width: '100%', height: 220, objectFit: 'cover', opacity: 0.4,
                        }} />
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(135deg, rgba(79,70,229,0.6), rgba(236,72,153,0.3))',
                            display: 'flex', flexDirection: 'column', justifyContent: 'center',
                            padding: '0 40px',
                        }}>
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                                style={{ color: 'white', fontSize: '2rem', fontWeight: 900, margin: 0, textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
                            >
                                ✈️ {t('Uçuş Fırsatları', 'Flight Deals')}
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                                style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', margin: '6px 0 0', maxWidth: 500 }}
                            >
                                {t('En uygun fiyatlı uçuşları bul, karşılaştır ve hemen satın al. AI destekli akıllı arama.', 'Find the best deals, compare prices, and book instantly. AI-powered smart search.')}
                            </motion.p>
                        </div>
                    </motion.div>

                    {/* ═══ SEARCH PANEL ═══ */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        style={sectionStyle}
                    >
                        <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800 }}>
                            <Search size={18} style={{ marginRight: 6, color: '#818CF8' }} />
                            {t('Uçuş Ara', 'Search Flights')}
                        </h2>

                        {/* Row 1: Origin + Budget + Visa */}
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                            <div style={{ flex: '1 1 160px' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>🛫 Nereden</label>
                                <select value={origin} onChange={e => setOrigin(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                                    {ORIGIN_CITIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
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
                                    <option value="visa_free">Vizesiz Yurt Dışı</option>
                                    <option value="visa_on_arrival">Vizesiz + Kapıda Vize</option>
                                </select>
                            </div>
                        </div>

                        {/* Row 2: Month + Duration */}
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                            <div style={{ flex: '1 1 180px' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>📅 Ne Zaman</label>
                                <select value={month} onChange={e => setMonth(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                    {getMonthOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div style={{ flex: '2 1 300px' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>🕐 Kaç Gün</label>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    {['2', '3', '4', '5', '7', '10'].map(d => (
                                        <button key={d} onClick={() => setDuration(d)}
                                            style={{
                                                flex: 1, padding: '10px 6px', borderRadius: 10, border: 'none',
                                                fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                                                background: duration === d ? 'var(--primary-1)' : 'var(--bg-tertiary)',
                                                color: duration === d ? 'white' : 'var(--text-secondary)',
                                                transition: 'all 150ms',
                                            }}>
                                            {d} {t('gün', 'days')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Row 3: Weekend Pattern */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>🗓️ Hafta Sonu Planı</label>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {[
                                    { v: 'any', l: 'Tümü', desc: 'Esnek tarihler' },
                                    { v: 'fri_sun', l: 'Cuma→Pazar', desc: 'Cuma akşam → Pazar gece' },
                                    { v: 'sat_sun', l: 'Cumartesi→Pazar', desc: 'Cumartesi sabah → Pazar gece' },
                                    { v: 'sat_mon', l: 'Cumartesi→Pazartesi', desc: 'Cumartesi → Pazartesi 00:00-04:00' },
                                ].map(p => (
                                    <button key={p.v} onClick={() => setPattern(p.v)}
                                        style={{
                                            padding: '8px 14px', borderRadius: 10, border: 'none',
                                            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                                            background: pattern === p.v ? '#10B981' : 'var(--bg-tertiary)',
                                            color: pattern === p.v ? 'white' : 'var(--text-secondary)',
                                            transition: 'all 150ms',
                                        }}>
                                        {p.l}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Row 4: Travel Type */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>✨ Seyahat Türü</label>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {TRAVEL_TYPES.map(tt => (
                                    <button key={tt.key} onClick={() => setTravelType(tt.key)}
                                        style={{
                                            padding: '7px 12px', borderRadius: 10, border: 'none',
                                            fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                                            background: travelType === tt.key ? '#818CF8' : 'var(--bg-tertiary)',
                                            color: travelType === tt.key ? 'white' : 'var(--text-secondary)',
                                            transition: 'all 150ms',
                                            display: 'flex', alignItems: 'center', gap: 4,
                                        }}>
                                        {tt.emoji} {locale === 'tr' ? tt.label : tt.en}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Search Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={searchDeals}
                            disabled={loading}
                            style={{
                                width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                color: 'white', fontSize: '1rem', fontWeight: 800, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
                            }}
                        >
                            {loading ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
                            {loading ? t('Fırsatlar Taranıyor...', 'Scanning Deals...') : t('Sonuçları Listele', 'Search Deals')}
                        </motion.button>
                    </motion.div>

                    {/* ═══ SEARCH RESULTS ═══ */}
                    <AnimatePresence>
                        {searchDone && (
                            <motion.div
                                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                style={sectionStyle}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                                        <Zap size={16} style={{ color: '#F59E0B', marginRight: 6 }} />
                                        {deals.length} {t('fırsat bulundu', 'deals found')}
                                    </h2>
                                    <button onClick={searchDeals} disabled={loading}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
                                        <RefreshCw size={13} /> {t('Yenile', 'Refresh')}
                                    </button>
                                </div>

                                {deals.length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                                        {deals.map((deal, i) => {
                                            const links = buildDeeplinks(origin, deal.destination, deal.departDate, deal.returnDate)
                                            return (
                                                <motion.div key={i}
                                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.04 }}
                                                    whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.12)' }}
                                                    style={{
                                                        background: 'var(--bg-primary)', borderRadius: 18,
                                                        overflow: 'hidden', border: '1px solid var(--border)',
                                                        transition: 'all 200ms',
                                                    }}
                                                >
                                                    {/* Header */}
                                                    <div style={{
                                                        background: `linear-gradient(135deg, ${['#4F46E5', '#7C3AED', '#EC4899', '#0D9488', '#F59E0B', '#6366F1', '#10B981', '#EF4444'][i % 8]}, ${['#7C3AED', '#EC4899', '#F59E0B', '#4F46E5', '#0D9488', '#818CF8', '#34D399', '#F472B6'][i % 8]})`,
                                                        padding: '16px 20px', color: 'white',
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <div>
                                                                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>{deal.city}</h3>
                                                                <p style={{ fontSize: '0.72rem', opacity: 0.8, margin: '2px 0 0' }}>
                                                                    {deal.country} · {deal.source}
                                                                </p>
                                                            </div>
                                                            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '6px 12px', backdropFilter: 'blur(4px)' }}>
                                                                <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>₺{formatPrice(deal.price)}</span>
                                                            </div>
                                                        </div>
                                                        {deal.priceComparison?.length > 1 && (
                                                            <div style={{ marginTop: 6, display: 'flex', gap: 5, fontSize: '0.62rem', opacity: 0.7 }}>
                                                                {deal.priceComparison.map((p, pi) => (
                                                                    <span key={pi} style={{ background: pi === 0 ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                                                                        {p.source}: ₺{formatPrice(p.price)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Body */}
                                                    <div style={{ padding: '14px 20px 18px' }}>
                                                        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                                                            <span style={{
                                                                fontSize: '0.68rem', fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                                                                background: (VISA_LABELS[deal.visa?.type]?.color || '#6366F1') + '18',
                                                                color: VISA_LABELS[deal.visa?.type]?.color || '#6366F1',
                                                            }}>
                                                                {deal.visa?.label?.tr || deal.visa?.type}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                                                            <Calendar size={13} />
                                                            {new Date(deal.departDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                            {' → '}
                                                            {new Date(deal.returnDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                            <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                                                                {deal.tripLabel || deal.tripType}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 12 }}>
                                                            <Plane size={12} /> {deal.airlines?.join(', ')}
                                                            {deal.stops > 0 && <span>· {deal.stops} aktarma</span>}
                                                        </div>

                                                        {/* Booking Links — Multiple Sources */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                            <a href={links.googleFlights} target="_blank" rel="noopener noreferrer"
                                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 10, background: '#10B981', color: 'white', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700 }}>
                                                                🎫 Google Flights <ExternalLink size={11} />
                                                            </a>
                                                            <div style={{ display: 'flex', gap: 4 }}>
                                                                {[
                                                                    { name: 'Skyscanner', url: links.skyscanner, bg: '#0770e3' },
                                                                    { name: 'Turna', url: links.turna, bg: '#FF6B00' },
                                                                    { name: 'Kiwi', url: links.kiwi, bg: '#00A991' },
                                                                    { name: 'Enuygun', url: links.enuygun, bg: '#FF3366' },
                                                                ].map(s => (
                                                                    <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                                                                        style={{
                                                                            flex: 1, padding: '6px', borderRadius: 8, textDecoration: 'none',
                                                                            background: s.bg, color: 'white',
                                                                            fontSize: '0.62rem', fontWeight: 700, textAlign: 'center',
                                                                        }}>
                                                                        {s.name}
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-tertiary)' }}>
                                        <Plane size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
                                        <p style={{ fontSize: '0.9rem' }}>{t('Kriterlere uygun fırsat bulunamadı. Filtreleri değiştirip tekrar deneyin.', 'No deals found. Try adjusting your filters.')}</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ═══ POPULAR DESTINATIONS ═══ */}
                    <motion.div
                        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        style={sectionStyle}
                    >
                        <h2 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 800 }}>
                            🌍 {t('Beğenebileceğiniz Yerler', 'You Might Also Like')}
                        </h2>
                        <p style={{ margin: '0 0 18px', fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                            {t('Popüler destinasyonlar — detayları görmek için bir karta tıklayın', 'Popular destinations — click a card for details')}
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                            {filteredDestinations.map((dest, i) => (
                                <motion.div key={dest.city}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.02 * i }}
                                    whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(0,0,0,0.15)' }}
                                    onClick={() => setSelectedCity(dest)}
                                    style={{
                                        borderRadius: 18, overflow: 'hidden', cursor: 'pointer',
                                        background: 'var(--bg-primary)', border: '1px solid var(--border)',
                                        transition: 'all 200ms',
                                    }}
                                >
                                    {/* Image */}
                                    <div style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden' }}>
                                        <img src={dest.img} alt={dest.city} loading="lazy"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.7))',
                                        }} />
                                        <div style={{ position: 'absolute', bottom: 10, left: 14, right: 14 }}>
                                            <h3 style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', margin: 0, textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
                                                {dest.emoji} {dest.city}
                                            </h3>
                                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', margin: '2px 0 0' }}>
                                                {dest.country} · {dest.tagline}
                                            </p>
                                        </div>
                                        {/* Fav button */}
                                        <button onClick={e => { e.stopPropagation(); toggleFav(dest.city) }}
                                            style={{
                                                position: 'absolute', top: 8, right: 8,
                                                background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
                                                border: 'none', borderRadius: '50%', width: 32, height: 32,
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                            <Heart size={16} fill={favorites.includes(dest.city) ? '#F472B6' : 'none'} color={favorites.includes(dest.city) ? '#F472B6' : 'white'} />
                                        </button>
                                        {/* Visa badge */}
                                        <span style={{
                                            position: 'absolute', top: 8, left: 8,
                                            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                                            padding: '3px 8px', borderRadius: 6,
                                            color: 'white', fontSize: '0.62rem', fontWeight: 600,
                                        }}>
                                            {dest.visa}
                                        </span>
                                    </div>

                                    {/* Body */}
                                    <div style={{ padding: '10px 14px 14px' }}>
                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                                            {dest.bestFor.map(tag => (
                                                <span key={tag} style={{
                                                    fontSize: '0.62rem', fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                                                    background: 'rgba(129,140,248,0.1)', color: '#818CF8',
                                                }}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                            ✈️ {dest.avgPrice}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* ═══ CITY DETAIL MODAL ═══ */}
            <AnimatePresence>
                {selectedCity && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 200,
                            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: 20,
                        }}
                        onClick={() => setSelectedCity(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: 'var(--bg-secondary)', borderRadius: 28,
                                width: '100%', maxWidth: 520, overflow: 'hidden',
                                border: '1px solid var(--border)',
                                boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
                                maxHeight: '85vh', overflowY: 'auto',
                            }}
                        >
                            {/* Hero Image */}
                            <div style={{ position: 'relative', aspectRatio: '16/9' }}>
                                <img src={selectedCity.img} alt={selectedCity.city}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.8))',
                                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                                    padding: '24px 28px',
                                }}>
                                    <button onClick={() => setSelectedCity(null)} style={{
                                        position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.4)',
                                        border: 'none', borderRadius: 10, padding: '6px 10px', cursor: 'pointer', color: 'white',
                                    }}>
                                        <X size={16} />
                                    </button>
                                    <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 900, margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                                        {selectedCity.emoji} {selectedCity.city}
                                    </h2>
                                    <p style={{ color: 'rgba(255,255,255,0.7)', margin: '4px 0 0', fontSize: '0.85rem' }}>
                                        {selectedCity.country} · {selectedCity.tagline}
                                    </p>
                                </div>
                            </div>

                            {/* Content */}
                            <div style={{ padding: '20px 28px 28px' }}>
                                {/* Visa + Price */}
                                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                    <span style={{
                                        padding: '6px 12px', borderRadius: 8,
                                        background: 'rgba(34,197,94,0.1)', color: '#22C55E',
                                        fontSize: '0.78rem', fontWeight: 700,
                                    }}>
                                        🛂 {selectedCity.visa}
                                    </span>
                                    <span style={{
                                        padding: '6px 12px', borderRadius: 8,
                                        background: 'rgba(129,140,248,0.1)', color: '#818CF8',
                                        fontSize: '0.78rem', fontWeight: 700,
                                    }}>
                                        ✈️ {selectedCity.avgPrice}
                                    </span>
                                </div>

                                {/* Highlights */}
                                <h4 style={{ margin: '0 0 8px', fontSize: '0.88rem', fontWeight: 700 }}>🏛️ Görülmesi Gerekenler</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
                                    {selectedCity.highlights.map(h => (
                                        <div key={h} style={{
                                            padding: '8px 12px', borderRadius: 10,
                                            background: 'var(--bg-primary)', border: '1px solid var(--border)',
                                            fontSize: '0.78rem', fontWeight: 600,
                                        }}>
                                            📍 {h}
                                        </div>
                                    ))}
                                </div>

                                {/* Best For */}
                                <h4 style={{ margin: '0 0 8px', fontSize: '0.88rem', fontWeight: 700 }}>✨ En İyi</h4>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                                    {selectedCity.bestFor.map(tag => (
                                        <span key={tag} style={{
                                            padding: '5px 12px', borderRadius: 8,
                                            background: 'rgba(244,114,182,0.1)', color: '#F472B6',
                                            fontSize: '0.75rem', fontWeight: 600,
                                        }}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Booking Links */}
                                <h4 style={{ margin: '0 0 8px', fontSize: '0.88rem', fontWeight: 700 }}>🎫 Uçuş Ara</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {(() => {
                                        const links = buildDeeplinks(origin || 'IST', selectedCity.code, '', '')
                                        return [
                                            { name: 'Google Flights', url: links.googleFlights, bg: '#10B981', icon: '✈️' },
                                            { name: 'Skyscanner', url: links.skyscanner, bg: '#0770e3', icon: '🔍' },
                                            { name: 'Turna', url: links.turna, bg: '#FF6B00', icon: '🎫' },
                                            { name: 'Enuygun', url: links.enuygun, bg: '#FF3366', icon: '💰' },
                                            { name: 'Kiwi.com', url: links.kiwi, bg: '#00A991', icon: '🌍' },
                                        ].map(s => (
                                            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                    padding: '11px', borderRadius: 12,
                                                    background: s.bg, color: 'white',
                                                    textDecoration: 'none', fontSize: '0.82rem', fontWeight: 700,
                                                }}>
                                                {s.icon} {s.name}'da Ara <ExternalLink size={12} />
                                            </a>
                                        ))
                                    })()}
                                </div>

                                {/* Plan Button */}
                                <button
                                    onClick={() => {
                                        setSelectedCity(null)
                                        router.push(`/planner?city=${encodeURIComponent(selectedCity.city)}`)
                                    }}
                                    style={{
                                        marginTop: 12, width: '100%', padding: '13px', borderRadius: 14,
                                        background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                        border: 'none', color: 'white', fontSize: '0.88rem', fontWeight: 800,
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    }}
                                >
                                    <Compass size={16} /> {t('Bu Şehir İçin Plan Oluştur', 'Create Plan for This City')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
