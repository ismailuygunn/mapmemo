'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import {
    Plane, Calendar, Loader2, Search, MapPin, DollarSign,
    Shield, Clock, RefreshCw, X, ChevronDown, ChevronUp,
    Heart, Star, Compass, ExternalLink, Zap, ArrowUp,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ═══ STATIC DESTINATION DATA ═══
const POPULAR_DESTINATIONS = [
    {
        city: 'Roma', country: 'İtalya', code: 'FCO', emoji: '🇮🇹',
        tagline: 'La Dolce Vita',
        visa: 'Schengen', visaType: 'visa_required',
        img: '/dest-rome.png',
        description: 'Antik Roma İmparatorluğu\'nun başkenti, her köşesi tarih kokan bu şehir dünyada eşi benzeri olmayan bir açık hava müzesi.',
        highlights: ['🏛️ Kolezyum', '⛪ Vatikan & Sistine Şapeli', '⛲ Trevi Çeşmesi', '🏛️ Pantheon', '🍝 Trastevere Sokakları', '🎨 Borghese Galerisi'],
        foodTips: ['Cacio e Pepe • Carbonara • Supplì • Gelato • Tiramisu'],
        bestTime: 'Nisan-Haziran, Eylül-Ekim',
        bestFor: ['Tarih', 'Yemek', 'Sanat'],
        avgPrice: '₺3,500-6,000',
        flightTime: '2.5 saat',
    },
    {
        city: 'Barselona', country: 'İspanya', code: 'BCN', emoji: '🇪🇸',
        tagline: 'Güneş, Deniz & Gaudí',
        visa: 'Schengen', visaType: 'visa_required',
        img: '/dest-barcelona.png',
        description: 'Gaudí\'nin muhteşem yapıları, Akdeniz sahilleri ve olağanüstü tapas kültürü ile Avrupa\'nın en canlı şehri.',
        highlights: ['⛪ Sagrada Familia', '🌿 Park Güell', '🛣️ La Rambla', '🏖️ Barceloneta Plajı', '🎨 Picasso Müzesi', '⚽ Camp Nou'],
        foodTips: ['Patatas Bravas • Jamón Ibérico • Paella • Churros • Sangria'],
        bestTime: 'Mayıs-Ekim',
        bestFor: ['Plaj', 'Mimari', 'Gece Hayatı'],
        avgPrice: '₺3,200-5,500',
        flightTime: '3.5 saat',
    },
    {
        city: 'Paris', country: 'Fransa', code: 'CDG', emoji: '🇫🇷',
        tagline: 'Aşkın Şehri',
        visa: 'Schengen', visaType: 'visa_required',
        img: '/dest-paris.png',
        description: 'Işıklar şehri Paris, dünya mutfağının başkenti ve romantizmin doğduğu yer. Her mevsim ayrı güzel.',
        highlights: ['🗼 Eyfel Kulesi', '🖼️ Louvre Müzesi', '🎨 Montmartre', '🛍️ Champs-Élysées', '📚 Notre-Dame', '🌹 Versailles Sarayı'],
        foodTips: ['Croissant • Crème Brûlée • Escargot • Macaron • Vin Rouge'],
        bestTime: 'Nisan-Haziran, Eylül-Kasım',
        bestFor: ['Romantik', 'Sanat', 'Yemek'],
        avgPrice: '₺3,800-7,000',
        flightTime: '3.5 saat',
    },
    {
        city: 'Dubai', country: 'BAE', code: 'DXB', emoji: '🇦🇪',
        tagline: 'Geleceğin Şehri',
        visa: 'Kapıda Vize', visaType: 'visa_on_arrival',
        img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80',
        description: 'Çölün ortasındaki süper modern metropol. Dünyanın en yüksek binası, en büyük alışveriş merkezi ve lüks tatil deneyimi.',
        highlights: ['🏗️ Burj Khalifa', '🛍️ Dubai Mall', '🐫 Çöl Safari', '🌴 Palm Jumeirah', '🕌 Jumeirah Camii', '⛵ Dubai Marina'],
        foodTips: ['Shawarma • Machboos • Luqaimat • Al Farooj • Arabic Coffee'],
        bestTime: 'Kasım-Mart',
        bestFor: ['Lüks', 'Alışveriş', 'Macera'],
        avgPrice: '₺2,800-5,000',
        flightTime: '4 saat',
    },
    {
        city: 'Bangkok', country: 'Tayland', code: 'BKK', emoji: '🇹🇭',
        tagline: 'Gülümsemenin Ülkesi',
        visa: 'Vizesiz', visaType: 'visa_free',
        img: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80',
        description: 'Rengarenk tapınaklar, sokak yemekleri cennetleri ve inanılmaz gece hayatıyla Güneydoğu Asya\'nın kalbi.',
        highlights: ['🏯 Büyük Saray', '🛕 Wat Pho', '🛒 Chatuchak Pazarı', '🌃 Khao San', '🚤 Chao Phraya', '🍜 Yaowarat (Chinatown)'],
        foodTips: ['Pad Thai • Tom Yum • Som Tam • Mango Sticky Rice • Street Food'],
        bestTime: 'Kasım-Şubat',
        bestFor: ['Gurme', 'Tapınak', 'Gece Hayatı'],
        avgPrice: '₺4,500-7,500',
        flightTime: '9 saat',
    },
    {
        city: 'Bali', country: 'Endonezya', code: 'DPS', emoji: '🇮🇩',
        tagline: 'Tanrıların Adası',
        visa: 'Kapıda Vize', visaType: 'visa_on_arrival',
        img: '/dest-bali.png',
        description: 'Yeşilin bin bir tonu, mistik tapınaklar, pirinç tarlaları ve dünya\'nın en güzel gün batımları.',
        highlights: ['🌾 Tegallalang Pirinç', '🛕 Tanah Lot', '🏖️ Kuta Plajı', '🐒 Maymun Ormanı', '🌅 Uluwatu', '🧘 Ubud Yoga'],
        foodTips: ['Nasi Goreng • Babi Guling • Sate Lilit • Smoothie Bowl • Luwak Coffee'],
        bestTime: 'Nisan-Ekim',
        bestFor: ['Doğa', 'Yoğa', 'Sörf'],
        avgPrice: '₺5,000-9,000',
        flightTime: '12 saat',
    },
    {
        city: 'Budapeşte', country: 'Macaristan', code: 'BUD', emoji: '🇭🇺',
        tagline: 'Tuna\'nın İncisi',
        visa: 'Schengen', visaType: 'visa_required',
        img: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=600&q=80',
        description: 'Muhteşem termal hamamları, gotik mimarisi ve bütçeye uygun Avrupa deneyimi sunan eşsiz bir şehir.',
        highlights: ['🏛️ Parlamento', '♨️ Széchenyi Hamamı', '🏰 Balıkçı Burcu', '🍺 Ruin Bar', '🌉 Zincir Köprü', '🎵 Opera Binası'],
        foodTips: ['Goulash • Kürtős Kalács • Lángos • Chicken Paprikash • Tokaji'],
        bestTime: 'Mart-Mayıs, Eylül-Kasım',
        bestFor: ['Kültür', 'Termal', 'Bütçeye Uygun'],
        avgPrice: '₺2,000-3,500',
        flightTime: '2 saat',
    },
    {
        city: 'Tiflis', country: 'Gürcistan', code: 'TBS', emoji: '🇬🇪',
        tagline: 'Kafkasya\'nın Kalbi',
        visa: 'Vizesiz', visaType: 'visa_free',
        img: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=600&q=80',
        description: 'Sıcak misafirperverlik, eşsiz mutfak, antik kiliseler ve dünyaca ünlü şaraplarıyla keşfedilmeyi bekliyor.',
        highlights: ['🏰 Narikala Kalesi', '♨️ Kükürt Hamamları', '⛪ Eski Şehir', '🍷 Şarap Mahzenleri', '🚡 Teleferik', '🌄 Mtskheta'],
        foodTips: ['Khachapuri • Khinkali • Churchkhela • Pkhali • Saperavi Şarap'],
        bestTime: 'Mayıs-Ekim',
        bestFor: ['Bütçeye Uygun', 'Yemek', 'Tarih'],
        avgPrice: '₺1,200-2,500',
        flightTime: '2 saat',
    },
    {
        city: 'Prag', country: 'Çekya', code: 'PRG', emoji: '🇨🇿',
        tagline: 'Yüz Kuleli Şehir',
        visa: 'Schengen', visaType: 'visa_required',
        img: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=600&q=80',
        description: 'Ortaçağ masallarından fırlamış gibi duran bu şehir, Avrupa\'nın en fotojenik başkenti.',
        highlights: ['🌉 Karel Köprüsü', '🏰 Prag Kalesi', '🕰️ Astronomik Saat', '🍺 Pilsner Deneyimi', '📚 Kafka Evi', '🎶 Caz Kulüpleri'],
        foodTips: ['Trdelník • Svíčková • Vepřo Knedlo Zelo • Czech Pilsner • Kulajda'],
        bestTime: 'Nisan-Haziran, Eylül-Ekim',
        bestFor: ['Tarih', 'Romantik', 'Bira'],
        avgPrice: '₺2,200-4,000',
        flightTime: '2.5 saat',
    },
    {
        city: 'Saraybosna', country: 'Bosna', code: 'SJJ', emoji: '🇧🇦',
        tagline: 'Avrupa\'nın Kudüs\'ü',
        visa: 'Vizesiz', visaType: 'visa_free',
        img: 'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=600&q=80',
        description: 'Doğu ve Batı\'nın buluşma noktası. Osmanlı mirası, leziz Bosna mutfağı ve inanılmaz doğa.',
        highlights: ['🕌 Başçarşı', '🌉 Latin Köprüsü', '⛲ Sebilj Çeşmesi', '🏔️ Trebević', '🕌 Gazi Hüsrev Bey', '🎿 Bjelašnica'],
        foodTips: ['Ćevapi • Burek • Bosanski Lonac • Baklava • Bosna Kahvesi'],
        bestTime: 'Mayıs-Ekim',
        bestFor: ['Kültür', 'Bütçeye Uygun', 'Tarih'],
        avgPrice: '₺1,500-3,000',
        flightTime: '1.5 saat',
    },
    {
        city: 'Belgrad', country: 'Sırbistan', code: 'BEG', emoji: '🇷🇸',
        tagline: 'Balkanların Partisi',
        visa: 'Vizesiz', visaType: 'visa_free',
        img: 'https://images.unsplash.com/photo-1577953175942-a5ee40753ebe?w=600&q=80',
        description: 'Avrupa\'nın en çılgın gece hayatı, muazzam sokak sanatı ve Balkan sıcaklığıyla dolu enerji.',
        highlights: ['🏰 Kalemegdan', '🛣️ Knez Mihailova', '🏖️ Ada Ciganlija', '🎵 Splavovi', '🍽️ Skadarlija', '🏛️ Nikola Tesla Müzesi'],
        foodTips: ['Pljeskavica • Ćevapi • Kajmak • Rakija • Burek'],
        bestTime: 'Mayıs-Ekim',
        bestFor: ['Gece Hayatı', 'Bütçeye Uygun', 'Eğlence'],
        avgPrice: '₺1,200-2,800',
        flightTime: '1.5 saat',
    },
    {
        city: 'Tokyo', country: 'Japonya', code: 'NRT', emoji: '🇯🇵',
        tagline: 'Geleceğin Gelenekle Buluşması',
        visa: 'Vizesiz', visaType: 'visa_free',
        img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
        description: 'Ultra modern teknoloji ile antik geleneklerin eşsiz harmonisi. Dünyanın en temiz, en organize şehri.',
        highlights: ['🚦 Shibuya Kavşağı', '🛕 Senso-ji', '🎮 Akihabara', '🍣 Tsukiji Balık Pazarı', '🏯 Meiji Tapınağı', '🌸 Shinjuku Gyoen'],
        foodTips: ['Ramen • Sushi Omakase • Wagyu • Tempura • Matcha Everything'],
        bestTime: 'Mart-Mayıs (sakura), Ekim-Kasım',
        bestFor: ['Kültür', 'Yemek', 'Teknoloji'],
        avgPrice: '₺8,000-14,000',
        flightTime: '11 saat',
    },
]

const TRAVEL_TYPES = [
    { key: 'any', emoji: '🌍', label: 'Fark etmez' },
    { key: 'food', emoji: '🍽️', label: 'Gurme Gezisi' },
    { key: 'romantic', emoji: '💑', label: 'Romantik' },
    { key: 'city', emoji: '🏙️', label: 'Şehir Tatili' },
    { key: 'beach', emoji: '🏖️', label: 'Yaz Tatili' },
    { key: 'winter', emoji: '❄️', label: 'Kış Tatili' },
    { key: 'nature', emoji: '🏔️', label: 'Doğa Tatili' },
    { key: 'adventure', emoji: '🎒', label: 'Keşif Tatili' },
    { key: 'budget', emoji: '💰', label: 'Bütçeye Uygun' },
]

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
    { code: 'VAS', name: 'Sivas', emoji: '🏔️' },
    { code: 'DNZ', name: 'Denizli', emoji: '♨️' },
    { code: 'KYA', name: 'Konya', emoji: '🕌' },
    { code: 'SZF', name: 'Samsun', emoji: '🚢' },
    { code: 'DIY', name: 'Diyarbakır', emoji: '🏰' },
]

const VISA_COLORS = {
    visa_free: '#22C55E', visa_on_arrival: '#F59E0B', visa_required: '#EF4444',
    e_visa: '#3B82F6', domestic: '#6366F1',
}

function formatPrice(p) {
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(p)
}

export default function FlightsPage() {
    const router = useRouter()
    const { user, profile } = useAuth()
    const { t, locale } = useLanguage()
    const searchRef = useRef(null)

    // Search state
    const [origin, setOrigin] = useState('')
    const [duration, setDuration] = useState('4')
    const [month, setMonth] = useState('any')
    const [pattern, setPattern] = useState('any')
    const [maxBudget, setMaxBudget] = useState('')
    const [travelType, setTravelType] = useState('any')
    const [visaFilter, setVisaFilter] = useState('all')
    const [searchDest, setSearchDest] = useState('') // destination IATA from city card

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
        } else if (!origin) setOrigin('IST')
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

    // Search — can optionally target a specific destination
    const searchDeals = async (destCode) => {
        setLoading(true)
        setSearchDone(false)
        try {
            const params = new URLSearchParams({
                origin: origin || 'IST',
                duration, month, pattern,
                visa: visaFilter,
            })
            if (destCode) params.set('dest', destCode)
            if (maxBudget && !isNaN(parseInt(maxBudget))) params.set('budget', maxBudget)
            const res = await fetch(`/api/flight-deals?${params}`)
            const data = await res.json()
            setDeals(data.deals || [])
        } catch { setDeals([]) }
        setLoading(false)
        setSearchDone(true)
    }

    // "Uçuş Ara" from city card — scroll to search, set dest, auto-search
    const searchFromCity = (dest) => {
        setSearchDest(dest.code)
        setSelectedCity(null)
        searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // Auto search after a short delay for scroll
        setTimeout(() => searchDeals(dest.code), 300)
    }

    const filteredDestinations = useMemo(() => {
        let dests = [...POPULAR_DESTINATIONS]
        if (travelType !== 'any') {
            const typeMap = {
                food: ['Gurme', 'Yemek'], romantic: ['Romantik'], city: ['Kültür', 'Tarih', 'Sanat'],
                beach: ['Plaj', 'Sörf'], winter: ['Kış'], nature: ['Doğa', 'Yoğa'],
                adventure: ['Keşif', 'Macera'], budget: ['Bütçeye Uygun'],
            }
            const keywords = typeMap[travelType] || []
            if (keywords.length > 0)
                dests = dests.filter(d => d.bestFor.some(bf => keywords.some(k => bf.includes(k))))
        }
        if (visaFilter === 'visa_free') dests = dests.filter(d => d.visaType === 'visa_free')
        else if (visaFilter === 'visa_on_arrival') dests = dests.filter(d => ['visa_free', 'visa_on_arrival'].includes(d.visaType))
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

                    {/* ═══ HERO ═══ */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                            borderRadius: 24, overflow: 'hidden', marginBottom: 24,
                            position: 'relative', minHeight: 200,
                            background: 'linear-gradient(135deg, #0F172A, #1E293B)',
                        }}>
                        <img src="/flights-hero.png" alt="" style={{ width: '100%', height: 200, objectFit: 'cover', opacity: 0.35 }} />
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(135deg, rgba(79,70,229,0.55), rgba(236,72,153,0.25))',
                            display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px',
                        }}>
                            <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 900, margin: 0, textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
                                ✈️ Uçuş Fırsatları
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', margin: '6px 0 0', maxWidth: 500 }}>
                                Skyscanner, Google Flights, Enuygun ve Turna'dan güncel fiyatları karşılaştır
                            </p>
                        </div>
                    </motion.div>

                    {/* ═══ SEARCH PANEL ═══ */}
                    <motion.div ref={searchRef}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        style={sectionStyle}>
                        <h2 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 800 }}>
                            <Search size={18} style={{ marginRight: 6, color: '#818CF8' }} />
                            Uçuş Ara
                            {searchDest && (
                                <span style={{ marginLeft: 10, fontSize: '0.78rem', fontWeight: 600, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: 8 }}>
                                    → {POPULAR_DESTINATIONS.find(d => d.code === searchDest)?.city || searchDest}
                                    <button onClick={() => setSearchDest('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10B981', marginLeft: 4 }}><X size={12} /></button>
                                </span>
                            )}
                        </h2>

                        {/* Row 1 */}
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

                        {/* Row 2 */}
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
                                            }}>{d} gün</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Row 3 */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>🗓️ Hafta Sonu Planı</label>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {[
                                    { v: 'any', l: 'Tümü' },
                                    { v: 'fri_sun', l: 'Cuma→Pazar' },
                                    { v: 'sat_sun', l: 'Cumartesi→Pazar' },
                                    { v: 'sat_mon', l: 'Cumartesi→Pazartesi' },
                                ].map(p => (
                                    <button key={p.v} onClick={() => setPattern(p.v)}
                                        style={{
                                            padding: '8px 14px', borderRadius: 10, border: 'none',
                                            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                                            background: pattern === p.v ? '#10B981' : 'var(--bg-tertiary)',
                                            color: pattern === p.v ? 'white' : 'var(--text-secondary)',
                                            transition: 'all 150ms',
                                        }}>{p.l}</button>
                                ))}
                            </div>
                        </div>

                        {/* Row 4 — Travel Type */}
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
                                            transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: 4,
                                        }}>{tt.emoji} {tt.label}</button>
                                ))}
                            </div>
                        </div>

                        {/* Search Button */}
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => searchDeals(searchDest || '')} disabled={loading}
                            style={{
                                width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                color: 'white', fontSize: '1rem', fontWeight: 800, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
                            }}>
                            {loading ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
                            {loading ? 'Fırsatlar Taranıyor...' : 'Sonuçları Listele'}
                        </motion.button>
                    </motion.div>

                    {/* ═══ RESULTS ═══ */}
                    <AnimatePresence>
                        {searchDone && (
                            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                style={sectionStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                                        <Zap size={16} style={{ color: '#F59E0B', marginRight: 6 }} />
                                        {deals.length} destinasyon bulundu
                                    </h2>
                                </div>
                                <p style={{ margin: '0 0 16px', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                    💡 En düşük fiyat üstte gösterilir. Satıra tıklayıp ilgili siteden biletinizi alabilirsiniz.
                                </p>

                                {deals.length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
                                        {deals.map((deal, i) => {
                                            const visaColor = VISA_COLORS[deal.visa?.type] || '#6366F1'
                                            const cheapest = deal.platforms?.[0]
                                            return (
                                                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                                    whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.12)' }}
                                                    style={{ background: 'var(--bg-primary)', borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border)', transition: 'all 200ms' }}>
                                                    {/* Header with lowest price */}
                                                    <div style={{
                                                        background: `linear-gradient(135deg, ${['#4F46E5', '#7C3AED', '#EC4899', '#0D9488', '#F59E0B', '#6366F1', '#10B981', '#EF4444'][i % 8]}, ${['#7C3AED', '#EC4899', '#F59E0B', '#4F46E5', '#0D9488', '#818CF8', '#34D399', '#F472B6'][i % 8]})`,
                                                        padding: '18px 22px', color: 'white',
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div>
                                                                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>{deal.emoji} {deal.city}</h3>
                                                                <p style={{ fontSize: '0.72rem', opacity: 0.8, margin: '2px 0 0' }}>{deal.country}</p>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: '8px 16px', backdropFilter: 'blur(8px)' }}>
                                                                    <div style={{ fontSize: '1.3rem', fontWeight: 900, lineHeight: 1 }}>₺{formatPrice(cheapest?.price || deal.lowestPrice)}</div>
                                                                    <div style={{ fontSize: '0.6rem', opacity: 0.7, marginTop: 2 }}>en düşük fiyat</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Body */}
                                                    <div style={{ padding: '14px 22px 20px' }}>
                                                        {/* Meta badges */}
                                                        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                                                            <span style={{
                                                                fontSize: '0.68rem', fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                                                                background: visaColor + '18', color: visaColor,
                                                            }}>{deal.visa?.label?.tr || deal.visa?.type}</span>
                                                            <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'rgba(129,140,248,0.1)', color: '#818CF8' }}>
                                                                ✈️ ~{deal.flightHours} saat
                                                            </span>
                                                            <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'rgba(251,191,36,0.1)', color: '#F59E0B' }}>
                                                                <Calendar size={10} style={{ marginRight: 3 }} />
                                                                {new Date(deal.departDate + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} → {new Date(deal.returnDate + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} ({deal.tripLabel})
                                                            </span>
                                                        </div>

                                                        {/* ═══ PER-PLATFORM PRICE LIST ═══ */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                            {(deal.platforms || []).map((platform, pi) => (
                                                                <a key={pi} href={platform.url} target="_blank" rel="noopener noreferrer"
                                                                    style={{
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                                        padding: '11px 14px', borderRadius: 12, textDecoration: 'none',
                                                                        background: pi === 0 ? `${platform.color}12` : 'var(--bg-secondary)',
                                                                        border: pi === 0 ? `2px solid ${platform.color}40` : '1px solid var(--border)',
                                                                        transition: 'all 150ms', cursor: 'pointer',
                                                                        position: 'relative',
                                                                    }}
                                                                    onMouseOver={e => { e.currentTarget.style.background = `${platform.color}20`; e.currentTarget.style.transform = 'translateX(4px)' }}
                                                                    onMouseOut={e => { e.currentTarget.style.background = pi === 0 ? `${platform.color}12` : 'var(--bg-secondary)'; e.currentTarget.style.transform = 'translateX(0)' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                        {pi === 0 && (
                                                                            <span style={{
                                                                                background: platform.color, color: 'white',
                                                                                fontSize: '0.55rem', fontWeight: 800, padding: '2px 6px',
                                                                                borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em',
                                                                            }}>EN UCUZ</span>
                                                                        )}
                                                                        <span style={{ fontSize: '1rem' }}>{platform.icon}</span>
                                                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{platform.name}</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                        <span style={{
                                                                            fontSize: pi === 0 ? '1.05rem' : '0.9rem',
                                                                            fontWeight: 800,
                                                                            color: pi === 0 ? platform.color : 'var(--text-primary)',
                                                                        }}>₺{formatPrice(platform.price)}</span>
                                                                        <ExternalLink size={12} style={{ color: 'var(--text-tertiary)' }} />
                                                                    </div>
                                                                </a>
                                                            ))}
                                                        </div>

                                                        <p style={{ margin: '8px 0 0', fontSize: '0.6rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                                                            Gidiş-dönüş tahmini fiyatlar · Güncel fiyat için tıklayın
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-tertiary)' }}>
                                        <Plane size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
                                        <p style={{ fontSize: '0.9rem' }}>Kriterlere uygun destinasyon bulunamadı. Filtreleri değiştirip tekrar deneyin.</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ═══ POPULAR DESTINATIONS ═══ */}
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        style={sectionStyle}>
                        <h2 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: 800 }}>🌍 Beğenebileceğiniz Yerler</h2>
                        <p style={{ margin: '0 0 18px', fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                            Popüler destinasyonlar — kartlara tıklayarak detayları keşfedin
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
                            {filteredDestinations.map((dest, i) => (
                                <motion.div key={dest.city}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.02 * i }}
                                    whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(0,0,0,0.15)' }}
                                    onClick={() => setSelectedCity(dest)}
                                    style={{
                                        borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
                                        background: 'var(--bg-primary)', border: '1px solid var(--border)',
                                        transition: 'all 200ms',
                                    }}>
                                    {/* Image */}
                                    <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
                                        <img src={dest.img} alt={dest.city} loading="lazy"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 300ms' }}
                                            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
                                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.75))' }} />
                                        <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16 }}>
                                            <h3 style={{ color: 'white', fontWeight: 900, fontSize: '1.2rem', margin: 0, textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
                                                {dest.emoji} {dest.city}
                                            </h3>
                                            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.74rem', margin: '2px 0 0', fontStyle: 'italic' }}>
                                                {dest.tagline} · {dest.country}
                                            </p>
                                        </div>
                                        <button onClick={e => { e.stopPropagation(); toggleFav(dest.city) }}
                                            style={{
                                                position: 'absolute', top: 10, right: 10,
                                                background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)',
                                                border: 'none', borderRadius: '50%', width: 34, height: 34,
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                            <Heart size={16} fill={favorites.includes(dest.city) ? '#F472B6' : 'none'} color={favorites.includes(dest.city) ? '#F472B6' : 'white'} />
                                        </button>
                                        <span style={{
                                            position: 'absolute', top: 10, left: 10,
                                            background: (VISA_COLORS[dest.visaType] || '#22C55E') + '30',
                                            backdropFilter: 'blur(4px)',
                                            padding: '3px 10px', borderRadius: 8,
                                            color: 'white', fontSize: '0.65rem', fontWeight: 700,
                                            border: `1px solid ${VISA_COLORS[dest.visaType] || '#22C55E'}50`,
                                        }}>{dest.visa}</span>
                                    </div>

                                    {/* Body — Rich Info */}
                                    <div style={{ padding: '14px 18px 18px' }}>
                                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 10px' }}>
                                            {dest.description.slice(0, 120)}...
                                        </p>
                                        {/* Highlights preview */}
                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                                            {dest.highlights.slice(0, 3).map(h => (
                                                <span key={h} style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 6, background: 'rgba(129,140,248,0.1)', color: '#818CF8', fontWeight: 600 }}>
                                                    {h}
                                                </span>
                                            ))}
                                            {dest.highlights.length > 3 && (
                                                <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 6, background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                                    +{dest.highlights.length - 3}
                                                </span>
                                            )}
                                        </div>
                                        {/* Meta */}
                                        <div style={{ display: 'flex', gap: 10, fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                                            <span>✈️ {dest.avgPrice}</span>
                                            <span>🕐 {dest.flightTime}</span>
                                            <span>📅 {dest.bestTime?.split(',')[0]}</span>
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
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 200,
                            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
                        }}
                        onClick={() => setSelectedCity(null)}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: 'var(--bg-secondary)', borderRadius: 28,
                                width: '100%', maxWidth: 540, overflow: 'hidden',
                                border: '1px solid var(--border)',
                                boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
                                maxHeight: '88vh', overflowY: 'auto',
                            }}>
                            {/* Hero */}
                            <div style={{ position: 'relative', aspectRatio: '16/9' }}>
                                <img src={selectedCity.img} alt={selectedCity.city} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: 'linear-gradient(transparent 20%, rgba(0,0,0,0.8))',
                                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '24px 28px',
                                }}>
                                    <button onClick={() => setSelectedCity(null)} style={{
                                        position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.4)',
                                        border: 'none', borderRadius: 10, padding: '6px 10px', cursor: 'pointer', color: 'white',
                                    }}><X size={16} /></button>
                                    <h2 style={{ color: 'white', fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>
                                        {selectedCity.emoji} {selectedCity.city}
                                    </h2>
                                    <p style={{ color: 'rgba(255,255,255,0.7)', margin: '4px 0 0', fontSize: '0.88rem', fontStyle: 'italic' }}>
                                        {selectedCity.tagline} · {selectedCity.country}
                                    </p>
                                </div>
                            </div>

                            {/* Content */}
                            <div style={{ padding: '20px 28px 28px' }}>
                                {/* Meta badges */}
                                <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                                    <span style={{ padding: '5px 10px', borderRadius: 8, background: (VISA_COLORS[selectedCity.visaType] || '#22C55E') + '18', color: VISA_COLORS[selectedCity.visaType] || '#22C55E', fontSize: '0.75rem', fontWeight: 700 }}>
                                        🛂 {selectedCity.visa}
                                    </span>
                                    <span style={{ padding: '5px 10px', borderRadius: 8, background: 'rgba(129,140,248,0.1)', color: '#818CF8', fontSize: '0.75rem', fontWeight: 700 }}>
                                        ✈️ {selectedCity.avgPrice}
                                    </span>
                                    <span style={{ padding: '5px 10px', borderRadius: 8, background: 'rgba(244,114,182,0.1)', color: '#F472B6', fontSize: '0.75rem', fontWeight: 700 }}>
                                        🕐 {selectedCity.flightTime}
                                    </span>
                                </div>

                                {/* Description */}
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 16px' }}>
                                    {selectedCity.description}
                                </p>

                                {/* Highlights */}
                                <h4 style={{ margin: '0 0 8px', fontSize: '0.88rem', fontWeight: 700 }}>🏛️ Görülmesi Gerekenler</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
                                    {selectedCity.highlights.map(h => (
                                        <div key={h} style={{
                                            padding: '8px 12px', borderRadius: 10,
                                            background: 'var(--bg-primary)', border: '1px solid var(--border)',
                                            fontSize: '0.78rem', fontWeight: 600,
                                        }}>{h}</div>
                                    ))}
                                </div>

                                {/* Food Tips */}
                                <h4 style={{ margin: '0 0 6px', fontSize: '0.88rem', fontWeight: 700 }}>🍽️ Mutlaka Deneyin</h4>
                                <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)', marginBottom: 14, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    {selectedCity.foodTips?.join(' ')}
                                </div>

                                {/* Best Time */}
                                <div style={{ display: 'flex', gap: 10, marginBottom: 14, fontSize: '0.78rem' }}>
                                    <span style={{ color: 'var(--text-tertiary)' }}>📅 <strong>En İyi Zaman:</strong> {selectedCity.bestTime}</span>
                                </div>

                                {/* Best For */}
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                                    {selectedCity.bestFor.map(tag => (
                                        <span key={tag} style={{
                                            padding: '4px 10px', borderRadius: 8,
                                            background: 'rgba(244,114,182,0.1)', color: '#F472B6',
                                            fontSize: '0.72rem', fontWeight: 600,
                                        }}>{tag}</span>
                                    ))}
                                </div>

                                {/* SINGLE "Uçuş Ara" BUTTON */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => searchFromCity(selectedCity)}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                                        background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                        color: 'white', fontSize: '0.92rem', fontWeight: 800, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
                                    }}>
                                    <Search size={16} /> Bu Şehre Uçuş Ara
                                </motion.button>

                                {/* Plan button */}
                                <button onClick={() => { setSelectedCity(null); router.push(`/planner?city=${encodeURIComponent(selectedCity.city)}`) }}
                                    style={{
                                        marginTop: 8, width: '100%', padding: '12px', borderRadius: 14,
                                        background: '#10B981', border: 'none', color: 'white',
                                        fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    }}>
                                    <Compass size={15} /> Bu Şehir İçin Plan Oluştur
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
