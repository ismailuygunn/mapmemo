'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSpace } from '@/context/SpaceContext'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import Sidebar from '@/components/layout/Sidebar'
import {
    CalendarDays, Plus, X, MapPin, Users, Clock, Link as LinkIcon,
    Loader2, ChevronRight, Sparkles, Gift, Heart, Cake, Star,
    Wine, Music, Coffee, Utensils, PartyPopper, Zap, ChevronDown,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

// ═══ OCCASION TYPES ═══
const OCCASIONS = [
    { key: 'birthday', label: 'Doğum Günü', emoji: '🎂', icon: Cake, color: '#EC4899', suggestions: ['Pasta siparişi', 'Balon süsleme', 'Sürpriz parti'] },
    { key: 'anniversary', label: 'Yıldönümü', emoji: '💕', icon: Heart, color: '#EF4444', suggestions: ['Romantik restoran', 'Çiçek sipariş', 'Hediye hazırla'] },
    { key: 'dinner', label: 'Akşam Yemeği', emoji: '🍽️', icon: Utensils, color: '#F59E0B', suggestions: ['Restoran rezervasyonu', 'Menü seçimi', 'Ulaşım planla'] },
    { key: 'celebration', label: 'Kutlama', emoji: '🎉', icon: PartyPopper, color: '#8B5CF6', suggestions: ['Mekan ayarla', 'Müzik listesi', 'İçecek planla'] },
    { key: 'drinks', label: 'İçki / Bar', emoji: '🍷', icon: Wine, color: '#7C3AED', suggestions: ['Bar seç', 'Happy hour saatleri', 'Ulaşım paylaş'] },
    { key: 'coffee', label: 'Kahve Buluşması', emoji: '☕', icon: Coffee, color: '#78716C', suggestions: ['Kafe bul', 'Park alternatifi', 'Çalışma eşliği'] },
    { key: 'concert', label: 'Konser / Etkinlik', emoji: '🎵', icon: Music, color: '#06B6D4', suggestions: ['Bilet al', 'Buluşma noktası', 'Ulaşım planla'] },
    { key: 'surprise', label: 'Sürpriz Plan', emoji: '🎁', icon: Gift, color: '#10B981', suggestions: ['Gizli davet', 'Hediye koordinasyonu', 'Zamanlama'] },
    { key: 'quick', label: 'Hızlı Buluşma', emoji: '⚡', icon: Zap, color: '#F97316', suggestions: ['Yakın mekan', 'Basit plan', 'Hemen buluş'] },
    { key: 'other', label: 'Diğer', emoji: '📌', icon: Star, color: '#64748B', suggestions: ['Planı kaydet', 'Detayları sonra ekle'] },
]

// ═══ CURATED NICHE SPOTS ═══
const NICHE_SPOTS = {
    couples: [
        { name: 'Kız Kulesi Sunset', city: 'İstanbul', desc: 'Kız Kulesi\'nde günbatımı yemeği — eşsiz Boğaz manzarası', emoji: '🌅', category: 'Romantik', vibe: '💕' },
        { name: 'Pierre Loti Tepesi', city: 'İstanbul', desc: 'Haliç manzaralı Türk kahvesi, teleferikle ulaşım', emoji: '☕', category: 'Manzara', vibe: '🪷' },
        { name: 'Balat Sokakları', city: 'İstanbul', desc: 'Rengarenk evler arasında yürüyüş, vintage kafeler', emoji: '🎨', category: 'Keşif', vibe: '🌈' },
        { name: 'Bebek Sahili Yürüyüş', city: 'İstanbul', desc: 'Boğaz kıyısında yürüyüş, waffle ve dondurma molası', emoji: '🍦', category: 'Yürüyüş', vibe: '😍' },
        { name: 'Sarıyer Korusu', city: 'İstanbul', desc: 'Gizli orman yolu ve şelale — şehirden kaçış', emoji: '🌲', category: 'Doğa', vibe: '🧘' },
        { name: 'Büyükada Bisiklet', city: 'İstanbul', desc: 'Ada\'da bisiklet turu, deniz kenarında öğle yemeği', emoji: '🚲', category: 'Macera', vibe: '✈️' },
        { name: 'Kuruçeşme Barlar', city: 'İstanbul', desc: 'Gece Boğaz\'da ışıklı köprü manzarası + sahil barları', emoji: '🌃', category: 'Gece', vibe: '✨' },
        { name: 'Kapadokya Piknik', city: 'Kapadokya', desc: 'Peri bacaları arasında piknik ve şarap', emoji: '🍷', category: 'Romantik', vibe: '🌅' },
        { name: 'Lavanta Tarlaları', city: 'Isparta', desc: 'Mor tarlalarda fotoğraf ve piknik (Haziran-Temmuz)', emoji: '💜', category: 'Fotoğraf', vibe: '🌺' },
        { name: 'Kaş Cam Tekne', city: 'Kaş', desc: 'Batık şehir üzerinde cam teknede günbatımı', emoji: '🚤', category: 'Deniz', vibe: '🌊' },
    ],
    friends: [
        { name: 'Kadıköy Bar Sokak', city: 'İstanbul', desc: 'Canlı müzik, sokak yemeği, craft bira — haftanın her günü canlı', emoji: '🍺', category: 'Gece', vibe: '🎉' },
        { name: 'Escape Room Macera', city: 'İstanbul', desc: 'Takım halinde kapalı oda macerası — 60 dk adrenalin', emoji: '🔑', category: 'Macera', vibe: '😱' },
        { name: 'Emirgan Korusu Piknik', city: 'İstanbul', desc: 'Lale bahçeleri, Boğaz manzaralı çim, mangal alanı', emoji: '🇩🇪', category: 'Piknik', vibe: '☀️' },
        { name: 'Maçka Parkı Spor', city: 'İstanbul', desc: 'Outdoor fitness, koşu parkuru ve ardından kahve', emoji: '🏃', category: 'Spor', vibe: '💪' },
        { name: 'Çiçek Pasajı Meze', city: 'İstanbul', desc: 'Tarihi pasajda meze, rakı ve muhabbet', emoji: '🍽️', category: 'Yemek', vibe: '🌟' },
        { name: 'Ortaköy Waffle Walk', city: 'İstanbul', desc: 'Waffle + kuymak + Boğaz manzarası yürüyüşü', emoji: '🧇', category: 'Yürüyüş', vibe: '😋' },
        { name: 'Tekne Partisi', city: 'İstanbul', desc: 'Özel tekne kirala, DJ + denize atlama + Boğaz turu', emoji: '🚢', category: 'Parti', vibe: '🌊' },
        { name: 'Kapadokya ATV Safari', city: 'Kapadokya', desc: 'Peri bacaları arasında ATV turu ve gece ışık show', emoji: '🏎️', category: 'Macera', vibe: '⚡' },
        { name: 'Alaçatı Windsurf', city: 'Alaçatı', desc: 'Rüzgar sörfü + taş sokaklar + brunch', emoji: '🏄', category: 'Spor', vibe: '🌊' },
        { name: 'Pamukkale Antik Havuz', city: 'Pamukkale', desc: 'Antik havuzda yüzme + travertenler üzerinde fotoğraf', emoji: '💧', category: 'Doğa', vibe: '✨' },
    ],
}

const GUEST_PRESETS = [
    { count: 2, label: 'İkimiz', emoji: '👫' },
    { count: 4, label: 'Küçük Grup', emoji: '👥' },
    { count: 8, label: 'Orta Grup', emoji: '🎯' },
    { count: 15, label: 'Büyük Grup', emoji: '🎪' },
    { count: 30, label: 'Parti', emoji: '🎉' },
]

const BUDGET_PRESETS = [
    { key: 'free', label: 'Ücretsiz', emoji: '🆓', range: '₺0' },
    { key: 'low', label: 'Düşük', emoji: '💰', range: '₺0-500' },
    { key: 'medium', label: 'Orta', emoji: '💰💰', range: '₺500-2.000' },
    { key: 'high', label: 'Yüksek', emoji: '💎', range: '₺2.000+' },
]

const TIME_PRESETS = [
    { label: 'Şimdi', emoji: '⚡', offset: 0 },
    { label: '1 saat sonra', emoji: '🕐', offset: 1 },
    { label: '2 saat sonra', emoji: '🕑', offset: 2 },
    { label: 'Bu akşam', emoji: '🌙', offset: 'tonight' },
    { label: 'Yarın', emoji: '📅', offset: 'tomorrow' },
    { label: 'Bu hafta sonu', emoji: '🎉', offset: 'weekend' },
]

function getPresetTime(offset) {
    const now = new Date()
    if (offset === 0) return now.toISOString().slice(0, 16)
    if (typeof offset === 'number') {
        now.setHours(now.getHours() + offset)
        return now.toISOString().slice(0, 16)
    }
    if (offset === 'tonight') {
        now.setHours(20, 0, 0, 0)
        if (now < new Date()) now.setDate(now.getDate() + 1)
        return now.toISOString().slice(0, 16)
    }
    if (offset === 'tomorrow') {
        now.setDate(now.getDate() + 1)
        now.setHours(19, 0, 0, 0)
        return now.toISOString().slice(0, 16)
    }
    if (offset === 'weekend') {
        const day = now.getDay()
        const daysToSat = day === 0 ? 6 : 6 - day
        now.setDate(now.getDate() + (daysToSat === 0 ? 7 : daysToSat))
        now.setHours(19, 0, 0, 0)
        return now.toISOString().slice(0, 16)
    }
    return now.toISOString().slice(0, 16)
}

export default function MeetupsPage() {
    const [meetups, setMeetups] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [step, setStep] = useState(1) // 1: occasion, 2: details, 3: extras
    const [creating, setCreating] = useState(false)
    const [form, setForm] = useState({
        title: '', description: '', city: '', location_name: '',
        lat: null, lng: null, start_time: '', end_time: '', external_link: '',
        occasion: '', guest_count: 2, budget: 'medium', checklist: [],
    })
    const [locationSearch, setLocationSearch] = useState('')
    const [locationResults, setLocationResults] = useState([])
    const { space, permissions } = useSpace()
    const { user } = useAuth()
    const { t } = useLanguage()
    const { toast } = useToast()
    const supabase = createClient()
    const router = useRouter()
    const [spotMode, setSpotMode] = useState('couples') // 'couples' or 'friends'

    useEffect(() => {
        if (space || user) loadMeetups()
        else setLoading(false)
    }, [space, user])

    const loadMeetups = async () => {
        try {
            let query = supabase.from('meetups').select('*, meetup_rsvps(status, user_id)')
            if (space) query = query.eq('space_id', space.id)
            else if (user) query = query.eq('created_by', user.id)
            else { setLoading(false); return }
            const { data, error } = await query.order('start_time', { ascending: true })
            if (error) { console.warn('Meetups table may not exist:', error.message); setLoading(false); return }
            if (data) setMeetups(data)
        } catch (e) {
            console.warn('Could not load meetups:', e.message)
        }
        setLoading(false)
    }

    const searchLocation = useCallback(async (query) => {
        setLocationSearch(query)
        if (query.length < 2) { setLocationResults([]); return }
        try {
            const res = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=place,locality,poi,address&limit=5`
            )
            const data = await res.json()
            setLocationResults(data.features || [])
        } catch {
            setLocationResults([])
        }
    }, [])

    const selectLocation = (result) => {
        const [lng, lat] = result.center
        const context = result.context || []
        const city = context.find(c => c.id.startsWith('place'))?.text || result.text || ''
        setForm(f => ({
            ...f, lat, lng,
            city: city || result.text,
            location_name: result.place_name,
        }))
        setLocationSearch(result.place_name)
        setLocationResults([])
    }

    const selectOccasion = (occ) => {
        const sug = occ.suggestions || []
        setForm(f => ({
            ...f, occasion: occ.key,
            title: f.title || `${occ.emoji} ${occ.label}`,
            checklist: sug.map(s => ({ text: s, done: false })),
        }))
        setStep(2)
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        if (!form.title || !form.start_time) {
            toast.error('Başlık ve tarih gerekli')
            return
        }
        setCreating(true)
        try {
            const { data, error } = await supabase
                .from('meetups')
                .insert({
                    space_id: space?.id || null,
                    created_by: user.id,
                    title: form.title,
                    description: form.description || null,
                    city: form.city || null,
                    location_name: form.location_name || null,
                    lat: form.lat,
                    lng: form.lng,
                    start_time: new Date(form.start_time).toISOString(),
                    end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
                    external_link: form.external_link || null,
                })
                .select('*, meetup_rsvps(status, user_id)')
                .single()

            if (error) throw error

            await supabase.from('meetup_updates').insert({
                meetup_id: data.id, user_id: user.id, type: 'created',
                message: `${form.occasion ? OCCASIONS.find(o => o.key === form.occasion)?.emoji + ' ' : ''}Buluşma oluşturuldu: ${form.title}`,
            }).catch(() => { })

            await supabase.from('meetup_rsvps').insert({
                meetup_id: data.id, user_id: user.id, status: 'going',
            }).catch(() => { })

            setMeetups(prev => [...prev, { ...data, meetup_rsvps: [{ status: 'going', user_id: user.id }] }])
            resetForm()
            toast.success('Buluşma oluşturuldu! 🎉')
        } catch (err) {
            toast.error(err.message)
        }
        setCreating(false)
    }

    const resetForm = () => {
        setForm({
            title: '', description: '', city: '', location_name: '',
            lat: null, lng: null, start_time: '', end_time: '', external_link: '',
            occasion: '', guest_count: 2, budget: 'medium', checklist: [],
        })
        setLocationSearch('')
        setShowCreate(false)
        setStep(1)
    }

    const getRsvpCounts = (meetup) => {
        const rsvps = meetup.meetup_rsvps || []
        return { going: rsvps.filter(r => r.status === 'going').length }
    }

    const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    const isUpcoming = (meetup) => new Date(meetup.start_time) > new Date()

    const upcoming = meetups.filter(isUpcoming)
    const past = meetups.filter(m => !isUpcoming(m))

    const sectionStyle = {
        background: 'var(--bg-secondary)', borderRadius: 20,
        border: '1px solid var(--border)', padding: '24px 28px', marginBottom: 24,
    }

    const inputStyle = {
        width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)',
        background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.88rem',
        outline: 'none', transition: 'border 200ms',
    }

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-main" style={{ overflowY: 'auto' }}>
                <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 60px' }}>

                    {/* ═══ HEADER ═══ */}
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            flexWrap: 'wrap', gap: 12, marginBottom: 24,
                        }}>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900 }}>⚡ Ani Buluşma</h1>
                            <p style={{ margin: '4px 0 0', color: 'var(--text-tertiary)', fontSize: '0.88rem' }}>
                                Son dakika planları hızla organize edin
                            </p>
                        </div>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => { setShowCreate(!showCreate); setStep(1) }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px',
                                borderRadius: 14, border: 'none', cursor: 'pointer',
                                background: showCreate ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #F59E0B, #EF4444)',
                                color: showCreate ? 'var(--text-primary)' : 'white',
                                fontSize: '0.9rem', fontWeight: 700,
                            }}>
                            {showCreate ? <><X size={16} /> İptal</> : <><Zap size={16} /> Hızlı Planla</>}
                        </motion.button>
                    </motion.div>

                    {/* ═══ NICHE SPOT SUGGESTIONS ═══ */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        style={sectionStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                                <Sparkles size={16} style={{ color: '#F59E0B', marginRight: 6 }} /> İlham Al
                            </h2>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {[
                                    { key: 'couples', label: '💕 Çiftler', color: '#EF4444' },
                                    { key: 'friends', label: '🤝 Arkadaşlar', color: '#6366F1' },
                                ].map(mode => (
                                    <motion.button key={mode.key} whileTap={{ scale: 0.95 }}
                                        onClick={() => setSpotMode(mode.key)}
                                        style={{
                                            padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                            fontSize: '0.78rem', fontWeight: 700,
                                            background: spotMode === mode.key ? mode.color : 'var(--bg-tertiary)',
                                            color: spotMode === mode.key ? 'white' : 'var(--text-secondary)',
                                            transition: 'all 200ms',
                                        }}>{mode.label}</motion.button>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                            {NICHE_SPOTS[spotMode].map((spot, i) => (
                                <motion.div key={i}
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.12)' }}
                                    onClick={() => {
                                        setForm(prev => ({ ...prev, title: spot.name, description: spot.desc, city: spot.city, location_name: spot.name }))
                                        setShowCreate(true)
                                        setStep(2)
                                    }}
                                    style={{
                                        background: 'var(--bg-primary)', borderRadius: 16,
                                        border: '1px solid var(--border)', padding: 16,
                                        cursor: 'pointer', transition: 'all 200ms',
                                    }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                        <span style={{ fontSize: '1.6rem' }}>{spot.emoji}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h3 style={{ margin: '0 0 2px', fontSize: '0.92rem', fontWeight: 800 }}>{spot.name}</h3>
                                            <p style={{ margin: '0 0 6px', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>📍 {spot.city}</p>
                                            <p style={{ margin: '0 0 8px', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{spot.desc}</p>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <span style={{
                                                    fontSize: '0.62rem', padding: '2px 8px', borderRadius: 6,
                                                    background: spotMode === 'couples' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                                                    color: spotMode === 'couples' ? '#EF4444' : '#6366F1',
                                                    fontWeight: 600,
                                                }}>{spot.category}</span>
                                                <span style={{ fontSize: '0.62rem', padding: '2px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontWeight: 600 }}>
                                                    {spot.vibe}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* ═══ QUICK PLAN WIZARD ═══ */}
                    <AnimatePresence>
                        {showCreate && (
                            <motion.div initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -20, height: 0 }} style={{ overflow: 'hidden', marginBottom: 24 }}>

                                {/* Step indicator */}
                                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                                    {[1, 2, 3].map(s => (
                                        <div key={s} style={{
                                            flex: 1, height: 4, borderRadius: 2,
                                            background: s <= step ? 'linear-gradient(90deg, #F59E0B, #EF4444)' : 'var(--bg-tertiary)',
                                            transition: 'all 300ms',
                                        }} />
                                    ))}
                                </div>

                                {/* STEP 1: Occasion Selection */}
                                {step === 1 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={sectionStyle}>
                                        <h2 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 800 }}>
                                            <Sparkles size={18} style={{ color: '#F59E0B', marginRight: 6 }} /> Ne vesileyle buluşuyorsunuz?
                                        </h2>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '0 0 16px' }}>
                                            Seçiminize göre öneriler ve kontrol listesi oluşturacağız
                                        </p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                                            {OCCASIONS.map(occ => (
                                                <motion.button key={occ.key}
                                                    whileHover={{ y: -3, boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}
                                                    whileTap={{ scale: 0.96 }}
                                                    onClick={() => selectOccasion(occ)}
                                                    style={{
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                        gap: 8, padding: '18px 12px', borderRadius: 16,
                                                        border: form.occasion === occ.key ? `2px solid ${occ.color}` : '1px solid var(--border)',
                                                        background: form.occasion === occ.key ? `${occ.color}10` : 'var(--bg-primary)',
                                                        cursor: 'pointer', transition: 'all 200ms',
                                                    }}>
                                                    <span style={{ fontSize: '2rem' }}>{occ.emoji}</span>
                                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{occ.label}</span>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 2: Details */}
                                {step === 2 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={sectionStyle}>
                                        <h2 style={{ margin: '0 0 16px', fontSize: '1.15rem', fontWeight: 800 }}>
                                            📝 Detaylar
                                        </h2>

                                        <div style={{ marginBottom: 14 }}>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>Başlık *</label>
                                            <input type="text" placeholder="Buluşma başlığı..." value={form.title}
                                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} />
                                        </div>

                                        {/* Time presets */}
                                        <div style={{ marginBottom: 14 }}>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>⏰ Ne zaman?</label>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                                                {TIME_PRESETS.map(tp => (
                                                    <button key={tp.label} type="button" onClick={() => setForm(f => ({ ...f, start_time: getPresetTime(tp.offset) }))}
                                                        style={{
                                                            padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)',
                                                            background: 'var(--bg-primary)', cursor: 'pointer',
                                                            fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)',
                                                            transition: 'all 150ms',
                                                        }}>
                                                        {tp.emoji} {tp.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <input type="datetime-local" value={form.start_time}
                                                onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} style={inputStyle} />
                                        </div>

                                        {/* Guest count */}
                                        <div style={{ marginBottom: 14 }}>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>👥 Kaç kişi?</label>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {GUEST_PRESETS.map(g => (
                                                    <button key={g.count} type="button"
                                                        onClick={() => setForm(f => ({ ...f, guest_count: g.count }))}
                                                        style={{
                                                            padding: '10px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                                            background: form.guest_count === g.count ? '#F59E0B' : 'var(--bg-primary)',
                                                            color: form.guest_count === g.count ? 'white' : 'var(--text-secondary)',
                                                            fontWeight: form.guest_count === g.count ? 700 : 500, fontSize: '0.78rem',
                                                            border: form.guest_count === g.count ? 'none' : '1px solid var(--border)',
                                                            transition: 'all 200ms',
                                                        }}>
                                                        {g.emoji} {g.label} ({g.count})
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Location */}
                                        <div style={{ marginBottom: 14, position: 'relative' }}>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>📍 Nerede?</label>
                                            <input type="text" placeholder="Mekan ara..." value={locationSearch}
                                                onChange={e => searchLocation(e.target.value)} style={inputStyle} />
                                            {locationResults.length > 0 && (
                                                <div style={{
                                                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                                                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                                    borderRadius: 12, marginTop: 4, overflow: 'hidden',
                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                                }}>
                                                    {locationResults.map(r => (
                                                        <button key={r.id} type="button" onClick={() => selectLocation(r)}
                                                            style={{
                                                                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                                                                padding: '10px 14px', border: 'none', background: 'transparent',
                                                                cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.82rem',
                                                                textAlign: 'left', borderBottom: '1px solid var(--border)',
                                                            }}>
                                                            <MapPin size={14} style={{ flexShrink: 0, color: 'var(--text-tertiary)' }} />
                                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.place_name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                                            <button type="button" onClick={() => setStep(1)}
                                                style={{
                                                    flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--border)',
                                                    background: 'var(--bg-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                                                    color: 'var(--text-secondary)',
                                                }}>← Geri</button>
                                            <button type="button" onClick={() => setStep(3)}
                                                disabled={!form.title || !form.start_time}
                                                style={{
                                                    flex: 2, padding: '12px', borderRadius: 12, border: 'none',
                                                    background: form.title && form.start_time ? 'linear-gradient(135deg, #F59E0B, #EF4444)' : 'var(--bg-tertiary)',
                                                    color: form.title && form.start_time ? 'white' : 'var(--text-tertiary)',
                                                    cursor: form.title && form.start_time ? 'pointer' : 'not-allowed',
                                                    fontSize: '0.85rem', fontWeight: 700,
                                                }}>Devam →</button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 3: Extras + Create */}
                                {step === 3 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={sectionStyle}>
                                        <h2 style={{ margin: '0 0 16px', fontSize: '1.15rem', fontWeight: 800 }}>
                                            ✨ Son Dokunuşlar
                                        </h2>

                                        {/* Budget */}
                                        <div style={{ marginBottom: 14 }}>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>💰 Bütçe</label>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {BUDGET_PRESETS.map(b => (
                                                    <button key={b.key} type="button"
                                                        onClick={() => setForm(f => ({ ...f, budget: b.key }))}
                                                        style={{
                                                            padding: '10px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                                            background: form.budget === b.key ? '#10B981' : 'var(--bg-primary)',
                                                            color: form.budget === b.key ? 'white' : 'var(--text-secondary)',
                                                            fontWeight: form.budget === b.key ? 700 : 500, fontSize: '0.78rem',
                                                            border: form.budget === b.key ? 'none' : '1px solid var(--border)',
                                                            transition: 'all 200ms',
                                                        }}>
                                                        {b.emoji} {b.label} <span style={{ opacity: 0.7, fontSize: '0.68rem' }}>({b.range})</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div style={{ marginBottom: 14 }}>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>📋 Not (opsiyonel)</label>
                                            <textarea placeholder="Ekstra detaylar, dress code, hediye fikirleri..."
                                                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                                rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                                        </div>

                                        {/* Checklist */}
                                        {form.checklist.length > 0 && (
                                            <div style={{ marginBottom: 14 }}>
                                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>✅ Yapılacaklar</label>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                    {form.checklist.map((item, i) => (
                                                        <label key={i} style={{
                                                            display: 'flex', alignItems: 'center', gap: 8,
                                                            padding: '8px 12px', borderRadius: 10, background: 'var(--bg-primary)',
                                                            border: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.82rem',
                                                        }}>
                                                            <input type="checkbox" checked={item.done}
                                                                onChange={() => setForm(f => ({
                                                                    ...f, checklist: f.checklist.map((c, ci) => ci === i ? { ...c, done: !c.done } : c)
                                                                }))} />
                                                            <span style={{ textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                                                                {item.text}
                                                            </span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* External link */}
                                        <div style={{ marginBottom: 14 }}>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 4 }}>🔗 Link (opsiyonel)</label>
                                            <input type="url" placeholder="https://..." value={form.external_link}
                                                onChange={e => setForm(f => ({ ...f, external_link: e.target.value }))} style={inputStyle} />
                                        </div>

                                        {/* Summary */}
                                        <div style={{
                                            background: 'var(--bg-primary)', borderRadius: 14, padding: '14px 18px',
                                            border: '1px solid var(--border)', marginBottom: 16,
                                        }}>
                                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase' }}>📋 Özet</div>
                                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{form.title}</div>
                                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {form.start_time && <span>🕐 {new Date(form.start_time).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                                                <span>👥 {form.guest_count} kişi</span>
                                                <span>💰 {BUDGET_PRESETS.find(b => b.key === form.budget)?.range}</span>
                                                {form.city && <span>📍 {form.city}</span>}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button type="button" onClick={() => setStep(2)}
                                                style={{
                                                    flex: 1, padding: '14px', borderRadius: 14, border: '1px solid var(--border)',
                                                    background: 'var(--bg-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                                                    color: 'var(--text-secondary)',
                                                }}>← Geri</button>
                                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                                onClick={handleCreate} disabled={creating}
                                                style={{
                                                    flex: 2, padding: '14px', borderRadius: 14, border: 'none',
                                                    background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                                                    color: 'white', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                    boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
                                                }}>
                                                {creating ? <Loader2 size={18} className="spin" /> : <Zap size={18} />}
                                                {creating ? 'Oluşturuluyor...' : '⚡ Buluşma Oluştur'}
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ═══ UPCOMING MEETUPS ═══ */}
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
                            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary-1)' }} />
                        </div>
                    ) : meetups.length === 0 && !showCreate ? (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            style={{
                                textAlign: 'center', padding: '64px 32px',
                                background: 'var(--bg-secondary)', borderRadius: 24,
                                border: '1px solid var(--border)',
                            }}>
                            <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚡</div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px' }}>Henüz buluşma yok</h3>
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', maxWidth: 320, margin: '0 auto 20px' }}>
                                Son dakika planlarınızı hızla organize edin — doğum günü, yıldönümü, ya da sadece bir kahve
                            </p>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => setShowCreate(true)}
                                style={{
                                    padding: '14px 28px', borderRadius: 14, border: 'none',
                                    background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
                                    color: 'white', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                }}>
                                <Zap size={16} /> Hızlı Planla
                            </motion.button>
                        </motion.div>
                    ) : (
                        <>
                            {upcoming.length > 0 && (
                                <div style={{ marginBottom: 24 }}>
                                    <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        🔥 Yaklaşan ({upcoming.length})
                                    </h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {upcoming.map((meetup, i) => {
                                            const counts = getRsvpCounts(meetup)
                                            const occ = OCCASIONS.find(o => meetup.title?.includes(o.emoji))
                                            return (
                                                <motion.div key={meetup.id}
                                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    whileHover={{ x: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                                                    onClick={() => router.push(`/meetup/${meetup.id}`)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 16,
                                                        padding: '16px 20px', borderRadius: 16,
                                                        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                                        cursor: 'pointer', transition: 'all 200ms',
                                                    }}>
                                                    <div style={{
                                                        width: 52, height: 52, borderRadius: 14,
                                                        background: occ ? `${occ.color}15` : 'rgba(245,158,11,0.1)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '1.4rem', flexShrink: 0,
                                                    }}>
                                                        {occ?.emoji || '📅'}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>{meetup.title}</h3>
                                                        <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                                            <span><Clock size={11} /> {formatTime(meetup.start_time)}</span>
                                                            {meetup.city && <span><MapPin size={11} /> {meetup.city}</span>}
                                                            <span><Users size={11} /> {counts.going}</span>
                                                        </div>
                                                    </div>
                                                    <div style={{
                                                        padding: '4px 10px', borderRadius: 8, fontSize: '0.65rem', fontWeight: 700,
                                                        background: 'rgba(245,158,11,0.1)', color: '#F59E0B',
                                                    }}>
                                                        {new Date(meetup.start_time).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                    </div>
                                                    <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {past.length > 0 && (
                                <div>
                                    <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-tertiary)' }}>
                                        📜 Geçmiş ({past.length})
                                    </h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {past.slice(0, 5).map((meetup, i) => {
                                            const counts = getRsvpCounts(meetup)
                                            return (
                                                <motion.div key={meetup.id}
                                                    initial={{ opacity: 0 }} animate={{ opacity: 0.6 }}
                                                    onClick={() => router.push(`/meetup/${meetup.id}`)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 14,
                                                        padding: '12px 16px', borderRadius: 12,
                                                        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                                        cursor: 'pointer', transition: 'all 200ms',
                                                    }}>
                                                    <div style={{ flex: 1 }}>
                                                        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>{meetup.title}</h3>
                                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                                                            {new Date(meetup.start_time).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                            {meetup.city && ` · ${meetup.city}`}
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
            <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
        </div>
    )
}
