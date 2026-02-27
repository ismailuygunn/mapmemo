'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import Sidebar from '@/components/layout/Sidebar'
import {
    Zap, MapPin, Users, DollarSign, Loader2, ChevronRight, Clock,
    Star, Navigation, Lightbulb, Gift, MessageCircle, CloudRain,
    Music, Shirt, Heart, Cake, Flame, Frown, Rainbow, ArrowLeft,
    Copy, Check, ChevronDown, ChevronUp, Sparkles, AlertTriangle,
    Target, Trophy
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ═══ SOS SCENARIOS ═══
const SCENARIOS = [
    {
        key: 'anniversary',
        emoji: '💕',
        title: 'Yıldönümü Kurtarma',
        subtitle: 'Geç kaldın ama telafi edeceksin',
        description: 'Romantik akşam yemeği, sürpriz anlar, hediye fikirleri ve göz göze bakış noktaları',
        color: '#EC4899',
        gradient: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
        icon: Heart,
        vibe: 'romantic'
    },
    {
        key: 'birthday',
        emoji: '🎂',
        title: 'Doğum Günü SOS',
        subtitle: 'Son dakika aklına geldi, yetişeceksin',
        description: 'Pasta, hediye koordinasyonu, sürpriz parti planı ve o anı yakalama stratejisi',
        color: '#F59E0B',
        gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
        icon: Cake,
        vibe: 'party'
    },
    {
        key: 'friends',
        emoji: '🔥',
        title: 'Agalar / Kızlar Gecesi',
        subtitle: '"Akşam çıkalım" dediler, plan sende',
        description: 'Gizli cevher barlar, escape room, çılgın aktiviteler ve kimsenin bilmediği mekanlar',
        color: '#8B5CF6',
        gradient: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
        icon: Flame,
        vibe: 'neon'
    },
    {
        key: 'apology',
        emoji: '💐',
        title: 'Gönül Alma Planı',
        subtitle: 'Bir şeyleri batırdın, düzeltme zamanı',
        description: 'Çiçek, anlamlı jestler, doğru zamanda doğru hamle ve affedilme stratejisi',
        color: '#10B981',
        gradient: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
        icon: Heart,
        vibe: 'warm'
    },
    {
        key: 'mood',
        emoji: '🌈',
        title: 'Moral Yükseltme',
        subtitle: 'Moralimiz bozuk, toparlanalım',
        description: 'Comfort food, doğa, self-care, küçük mutluluklar ve endorfin patlaması',
        color: '#06B6D4',
        gradient: 'linear-gradient(135deg, #06B6D4 0%, #10B981 100%)',
        icon: Rainbow,
        vibe: 'cozy'
    },
]

const CITIES = [
    { key: 'İstanbul', emoji: '🌉' },
    { key: 'Ankara', emoji: '🏛️' },
    { key: 'İzmir', emoji: '🌊' },
    { key: 'Antalya', emoji: '🏖️' },
    { key: 'Bursa', emoji: '🏔️' },
    { key: 'Bodrum', emoji: '⛵' },
]

const BUDGETS = [
    { key: 'economic', label: 'Ekonomik', emoji: '💰', desc: '₺100-300/kişi', color: '#10B981' },
    { key: 'mid', label: 'Orta', emoji: '💎', desc: '₺300-600/kişi', color: '#3B82F6' },
    { key: 'luxury', label: 'Lüks', emoji: '👑', desc: '₺600+/kişi', color: '#8B5CF6' },
]

const PEOPLE_OPTIONS = [2, 3, 4, 6, 8]

// ═══ VIBE COLORS ═══
const VIBE_THEMES = {
    romantic: { bg: '#FDF2F8', accent: '#EC4899', card: '#FFF1F7', text: '#831843' },
    party: { bg: '#FFFBEB', accent: '#F59E0B', card: '#FFF8E1', text: '#78350F' },
    neon: { bg: '#F5F3FF', accent: '#8B5CF6', card: '#EDE9FE', text: '#4C1D95' },
    warm: { bg: '#ECFDF5', accent: '#10B981', card: '#D1FAE5', text: '#064E3B' },
    cozy: { bg: '#ECFEFF', accent: '#06B6D4', card: '#CFFAFE', text: '#164E63' },
}

export default function SOSPlanPage() {
    const { user } = useAuth()
    const { locale } = useLanguage()
    const { toast } = useToast()

    // ── State ──
    const [selectedScenario, setSelectedScenario] = useState(null)
    const [city, setCity] = useState('')
    const [customCity, setCustomCity] = useState('')
    const [peopleCount, setPeopleCount] = useState(2)
    const [budget, setBudget] = useState('mid')
    const [extraNotes, setExtraNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [loadingText, setLoadingText] = useState('')
    const [plan, setPlan] = useState(null)
    const [expandedStep, setExpandedStep] = useState(null)
    const [copiedMsg, setCopiedMsg] = useState(null)
    const [showExtras, setShowExtras] = useState({})

    // ── Loading messages ──
    const loadingMessages = {
        anniversary: ['💕 Romantik mekanlar aranıyor...', '🌹 Sürpriz fikirleri hazırlanıyor...', '🕯️ Mükemmel akşam planlanıyor...'],
        birthday: ['🎂 Pasta seçenekleri araştırılıyor...', '🎁 Hediye fikirleri üretiliyor...', '🎉 Sürpriz plan hazırlanıyor...'],
        friends: ['🔥 Gizli mekanlar taranıyor...', '🎯 Çılgın aktiviteler bulunuyor...', '🍻 Efsane gece planlanıyor...'],
        apology: ['💐 Çiçekçiler kontrol ediliyor...', '💌 Mesaj taslakları yazılıyor...', '🕊️ Gönül alma stratejisi hazırlanıyor...'],
        mood: ['🌈 İyi his mekanları aranıyor...', '☕ Comfort food rotası çiziliyor...', '🧘 Moral planı oluşturuluyor...'],
    }

    useEffect(() => {
        if (!loading || !selectedScenario) return
        const msgs = loadingMessages[selectedScenario.key] || ['⏳ Plan hazırlanıyor...']
        let i = 0
        setLoadingText(msgs[0])
        const interval = setInterval(() => {
            i = (i + 1) % msgs.length
            setLoadingText(msgs[i])
        }, 2500)
        return () => clearInterval(interval)
    }, [loading, selectedScenario])

    // ── Generate Plan ──
    const generatePlan = async () => {
        const finalCity = city || customCity
        if (!finalCity) {
            toast.error('Şehir seçmelisin!')
            return
        }
        setLoading(true)
        setPlan(null)
        try {
            const res = await fetch('/api/ai/meetup-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scenario: selectedScenario.key,
                    city: finalCity,
                    peopleCount,
                    budget,
                    extraNotes,
                }),
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            setPlan(data)
            toast.success('🚨 SOS Planın hazır!')
        } catch (err) {
            toast.error(err.message || 'Plan oluşturulamadı')
        }
        setLoading(false)
    }

    // ── Copy message ──
    const copyMessage = (msg, idx) => {
        navigator.clipboard.writeText(msg)
        setCopiedMsg(idx)
        toast.success('Mesaj kopyalandı!')
        setTimeout(() => setCopiedMsg(null), 2000)
    }

    // ── Toggle extras ──
    const toggleExtra = (key) => setShowExtras(prev => ({ ...prev, [key]: !prev[key] }))

    // ── Reset ──
    const resetAll = () => {
        setSelectedScenario(null)
        setPlan(null)
        setCity('')
        setCustomCity('')
        setPeopleCount(2)
        setBudget('mid')
        setExtraNotes('')
        setExpandedStep(null)
        setShowExtras({})
    }

    const scenario = selectedScenario
    const theme = scenario ? VIBE_THEMES[scenario.vibe] : null

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="page">
                    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
                        {/* ═══ HEADER ═══ */}
                        <div style={{ textAlign: 'center', marginBottom: 32 }}>
                            {plan && (
                                <button
                                    onClick={resetAll}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                        borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                                        fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16,
                                    }}
                                >
                                    <ArrowLeft size={14} /> Yeni Plan
                                </button>
                            )}
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
                                🚨 SOS Plan
                            </h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                Son dakika mı? Panik yapma. AI 1 dakikada sana A'dan Z'ye plan çıkarsın.
                            </p>
                        </div>

                        {/* ═══ STEP 1: SCENARIO SELECTION ═══ */}
                        {!plan && (
                            <AnimatePresence mode="wait">
                                {!selectedScenario ? (
                                    <motion.div
                                        key="scenarios"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                    >
                                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>
                                            Ne oldu? 👇
                                        </h2>
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            {SCENARIOS.map((sc, i) => {
                                                const Icon = sc.icon
                                                return (
                                                    <motion.button
                                                        key={sc.key}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.08 }}
                                                        onClick={() => setSelectedScenario(sc)}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: 16,
                                                            padding: '18px 20px', borderRadius: 16,
                                                            background: 'var(--bg-primary)',
                                                            border: '2px solid var(--border)',
                                                            cursor: 'pointer', textAlign: 'left',
                                                            transition: 'all 0.2s ease',
                                                        }}
                                                        whileHover={{
                                                            scale: 1.02,
                                                            borderColor: sc.color,
                                                            boxShadow: `0 4px 20px ${sc.color}30`,
                                                        }}
                                                        whileTap={{ scale: 0.98 }}
                                                    >
                                                        <div style={{
                                                            width: 52, height: 52, borderRadius: 14,
                                                            background: sc.gradient,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '1.5rem', flexShrink: 0,
                                                        }}>
                                                            {sc.emoji}
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 2 }}>
                                                                {sc.title}
                                                            </div>
                                                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                                                                {sc.subtitle}
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                                                {sc.description}
                                                            </div>
                                                        </div>
                                                        <ChevronRight size={20} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                                    </motion.button>
                                                )
                                            })}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="params"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                    >
                                        {/* Selected scenario header */}
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
                                            padding: '14px 18px', borderRadius: 14,
                                            background: scenario.gradient, color: 'white',
                                        }}>
                                            <span style={{ fontSize: '1.8rem' }}>{scenario.emoji}</span>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{scenario.title}</div>
                                                <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>{scenario.subtitle}</div>
                                            </div>
                                            <button
                                                onClick={() => setSelectedScenario(null)}
                                                style={{
                                                    marginLeft: 'auto', background: 'rgba(255,255,255,0.2)',
                                                    border: 'none', borderRadius: 8, padding: '6px 12px',
                                                    color: 'white', cursor: 'pointer', fontSize: '0.78rem',
                                                }}
                                            >
                                                Değiştir
                                            </button>
                                        </div>

                                        {/* Quick params */}
                                        <div style={{ display: 'grid', gap: 20 }}>
                                            {/* City */}
                                            <div>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.88rem', marginBottom: 8 }}>
                                                    <MapPin size={16} /> Şehir
                                                </label>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                                                    {CITIES.map(c => (
                                                        <button
                                                            key={c.key}
                                                            onClick={() => { setCity(c.key); setCustomCity('') }}
                                                            style={{
                                                                padding: '8px 14px', borderRadius: 10,
                                                                border: city === c.key ? `2px solid ${scenario.color}` : '2px solid var(--border)',
                                                                background: city === c.key ? `${scenario.color}15` : 'var(--bg-primary)',
                                                                cursor: 'pointer', fontSize: '0.85rem',
                                                                fontWeight: city === c.key ? 600 : 400,
                                                                color: city === c.key ? scenario.color : 'var(--text-primary)',
                                                                transition: 'all 0.15s ease',
                                                            }}
                                                        >
                                                            {c.emoji} {c.key}
                                                        </button>
                                                    ))}
                                                </div>
                                                <input
                                                    type="text"
                                                    className="input"
                                                    placeholder="veya başka bir şehir yaz..."
                                                    value={customCity}
                                                    onChange={e => { setCustomCity(e.target.value); setCity('') }}
                                                    style={{ fontSize: '0.88rem' }}
                                                />
                                            </div>

                                            {/* People count */}
                                            <div>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.88rem', marginBottom: 8 }}>
                                                    <Users size={16} /> Kaç kişi?
                                                </label>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    {PEOPLE_OPTIONS.map(n => (
                                                        <button
                                                            key={n}
                                                            onClick={() => setPeopleCount(n)}
                                                            style={{
                                                                width: 48, height: 48, borderRadius: 12,
                                                                border: peopleCount === n ? `2px solid ${scenario.color}` : '2px solid var(--border)',
                                                                background: peopleCount === n ? `${scenario.color}15` : 'var(--bg-primary)',
                                                                cursor: 'pointer', fontWeight: 700, fontSize: '1rem',
                                                                color: peopleCount === n ? scenario.color : 'var(--text-primary)',
                                                                transition: 'all 0.15s ease',
                                                            }}
                                                        >
                                                            {n}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Budget */}
                                            <div>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.88rem', marginBottom: 8 }}>
                                                    <DollarSign size={16} /> Bütçe
                                                </label>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    {BUDGETS.map(b => (
                                                        <button
                                                            key={b.key}
                                                            onClick={() => setBudget(b.key)}
                                                            style={{
                                                                flex: 1, padding: '12px 8px', borderRadius: 12, textAlign: 'center',
                                                                border: budget === b.key ? `2px solid ${scenario.color}` : '2px solid var(--border)',
                                                                background: budget === b.key ? `${scenario.color}15` : 'var(--bg-primary)',
                                                                cursor: 'pointer', transition: 'all 0.15s ease',
                                                            }}
                                                        >
                                                            <div style={{ fontSize: '1.2rem' }}>{b.emoji}</div>
                                                            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: budget === b.key ? scenario.color : 'var(--text-primary)' }}>
                                                                {b.label}
                                                            </div>
                                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{b.desc}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Extra notes */}
                                            <div>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.88rem', marginBottom: 8 }}>
                                                    <Sparkles size={16} /> Ekstra bilgi (opsiyonel)
                                                </label>
                                                <textarea
                                                    className="input"
                                                    rows={2}
                                                    placeholder={
                                                        scenario.key === 'anniversary' ? 'ör: 3. yıldönümümüz, deniz manzaralı mekan olsa süper...' :
                                                            scenario.key === 'birthday' ? 'ör: 25 yaşına giriyor, çikolata seviyor, sürpriz olsun...' :
                                                                scenario.key === 'friends' ? 'ör: 4 kişiyiz, hepimiz erkek, biraz çılgınlık olsun...' :
                                                                    scenario.key === 'apology' ? 'ör: kız arkadaşım kızgın, doğum gününü unuttum...' :
                                                                        'ör: iş stresi var, rahatlatıcı bir şeyler olsa iyi olur...'
                                                    }
                                                    value={extraNotes}
                                                    onChange={e => setExtraNotes(e.target.value)}
                                                    style={{ fontSize: '0.88rem', resize: 'none' }}
                                                />
                                            </div>
                                        </div>

                                        {/* Generate button */}
                                        <motion.button
                                            onClick={generatePlan}
                                            disabled={loading || (!city && !customCity)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            style={{
                                                width: '100%', marginTop: 24, padding: '16px 0',
                                                borderRadius: 14, border: 'none', cursor: 'pointer',
                                                background: loading ? 'var(--bg-tertiary)' : scenario.gradient,
                                                color: 'white', fontWeight: 700, fontSize: '1.05rem',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                                opacity: (!city && !customCity) ? 0.5 : 1,
                                                boxShadow: `0 4px 20px ${scenario.color}40`,
                                            }}
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 size={20} className="spin" />
                                                    {loadingText}
                                                </>
                                            ) : (
                                                <>
                                                    <Zap size={20} />
                                                    🚨 SOS Planı Oluştur
                                                </>
                                            )}
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}

                        {/* ═══ PLAN RESULT ═══ */}
                        {plan && (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                {/* Plan header */}
                                <div style={{
                                    textAlign: 'center', padding: '28px 20px', borderRadius: 20,
                                    background: scenario.gradient, color: 'white', marginBottom: 24,
                                    position: 'relative', overflow: 'hidden',
                                }}>
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.1)' }} />
                                    <div style={{ position: 'relative', zIndex: 1 }}>
                                        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>
                                            {plan.planEmoji || scenario.emoji}
                                        </div>
                                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>
                                            {plan.planTitle}
                                        </h2>
                                        <p style={{ fontSize: '0.9rem', opacity: 0.9, lineHeight: 1.5, maxWidth: 500, margin: '0 auto' }}>
                                            {plan.vibeDescription}
                                        </p>
                                        {plan.totalBudget && (
                                            <div style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                                marginTop: 12, padding: '6px 14px', borderRadius: 20,
                                                background: 'rgba(255,255,255,0.2)', fontSize: '0.85rem',
                                            }}>
                                                💰 {plan.totalBudget?.perPerson || plan.totalBudget}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Urgency note */}
                                {plan.urgencyNote && (
                                    <div style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 10,
                                        padding: '14px 16px', borderRadius: 12, marginBottom: 20,
                                        background: '#FEF3C7', border: '1px solid #FCD34D',
                                    }}>
                                        <AlertTriangle size={18} style={{ color: '#D97706', flexShrink: 0, marginTop: 2 }} />
                                        <div style={{ fontSize: '0.88rem', color: '#92400E', fontWeight: 500 }}>
                                            ⚡ <strong>Hemen yap:</strong> {plan.urgencyNote}
                                        </div>
                                    </div>
                                )}

                                {/* ── TIMELINE STEPS ── */}
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Clock size={18} /> Saat Saat Plan
                                </h3>
                                <div style={{ display: 'grid', gap: 12, marginBottom: 28 }}>
                                    {plan.steps?.map((step, i) => {
                                        const isExpanded = expandedStep === i
                                        return (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                style={{
                                                    borderRadius: 16, overflow: 'hidden',
                                                    border: `1px solid var(--border)`,
                                                    background: 'var(--bg-primary)',
                                                }}
                                            >
                                                <button
                                                    onClick={() => setExpandedStep(isExpanded ? null : i)}
                                                    style={{
                                                        width: '100%', padding: '16px', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: 14,
                                                        background: 'none', border: 'none', textAlign: 'left',
                                                    }}
                                                >
                                                    {/* Time badge */}
                                                    <div style={{
                                                        minWidth: 52, padding: '6px 0', textAlign: 'center',
                                                        borderRadius: 10, background: `${scenario.color}15`,
                                                        color: scenario.color, fontWeight: 700, fontSize: '0.82rem',
                                                    }}>
                                                        {step.time}
                                                    </div>
                                                    <div style={{
                                                        width: 36, height: 36, borderRadius: 10,
                                                        background: scenario.gradient,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '1.1rem', flexShrink: 0,
                                                    }}>
                                                        {step.emoji}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                                                            {step.title || step.action}
                                                        </div>
                                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                                            {step.placeName} {step.duration ? `· ${step.duration}` : ''}
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: '0.78rem', color: scenario.color, fontWeight: 600 }}>
                                                        {step.estimatedCost}
                                                    </div>
                                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </button>

                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            style={{ overflow: 'hidden' }}
                                                        >
                                                            <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                                                                {/* Detail */}
                                                                <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-secondary)', margin: '12px 0' }}>
                                                                    {step.detail}
                                                                </p>

                                                                {/* Rating */}
                                                                {step.placeRating && (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                                        <Star size={14} style={{ color: '#F59E0B' }} />
                                                                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                                            {step.placeRating} ({step.placeReviews} yorum)
                                                                        </span>
                                                                        {step.address && (
                                                                            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                                                                                · {step.address}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Pro tip */}
                                                                {step.proTip && (
                                                                    <div style={{
                                                                        display: 'flex', alignItems: 'flex-start', gap: 8,
                                                                        padding: '10px 12px', borderRadius: 10,
                                                                        background: `${scenario.color}10`, marginBottom: 8,
                                                                    }}>
                                                                        <Lightbulb size={14} style={{ color: scenario.color, flexShrink: 0, marginTop: 2 }} />
                                                                        <span style={{ fontSize: '0.82rem', color: scenario.color, fontWeight: 500 }}>
                                                                            {step.proTip}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {/* Transport */}
                                                                {step.transport && (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                                                                        <Navigation size={12} /> {step.transport}
                                                                    </div>
                                                                )}

                                                                {/* Alternative */}
                                                                {step.alternative && (
                                                                    <div style={{
                                                                        marginTop: 8, padding: '8px 12px', borderRadius: 8,
                                                                        background: 'var(--bg-secondary)', fontSize: '0.78rem',
                                                                    }}>
                                                                        <strong>🔄 Alternatif:</strong> {step.alternative.name} — {step.alternative.reason}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        )
                                    })}
                                </div>

                                {/* ── EXTRAS GRID ── */}
                                <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
                                    {/* Plan B */}
                                    {plan.planB && (
                                        <ExtraCard
                                            icon={<CloudRain size={18} />}
                                            title="🌧️ B Planı"
                                            color="#64748B"
                                            isOpen={showExtras.planB}
                                            toggle={() => toggleExtra('planB')}
                                        >
                                            <p style={{ fontWeight: 600, marginBottom: 6 }}>{plan.planB.title}</p>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                                                {plan.planB.description}
                                            </p>
                                            {plan.planB.steps?.map((s, i) => (
                                                <div key={i} style={{ fontSize: '0.82rem', padding: '4px 0', color: 'var(--text-secondary)' }}>
                                                    {i + 1}. {s}
                                                </div>
                                            ))}
                                        </ExtraCard>
                                    )}

                                    {/* Message Drafts */}
                                    {plan.messageDrafts?.length > 0 && (
                                        <ExtraCard
                                            icon={<MessageCircle size={18} />}
                                            title="💬 Mesaj Taslakları"
                                            color={scenario.color}
                                            isOpen={showExtras.messages}
                                            toggle={() => toggleExtra('messages')}
                                        >
                                            {plan.messageDrafts.map((m, i) => (
                                                <div key={i} style={{
                                                    padding: '10px 12px', borderRadius: 10,
                                                    background: 'var(--bg-secondary)', marginBottom: 8,
                                                }}>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>
                                                        📌 {m.timing}
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', lineHeight: 1.5, marginBottom: 6 }}>
                                                        {m.message}
                                                    </div>
                                                    <button
                                                        onClick={() => copyMessage(m.message, i)}
                                                        style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                                            padding: '4px 10px', borderRadius: 6,
                                                            background: copiedMsg === i ? '#10B981' : `${scenario.color}15`,
                                                            color: copiedMsg === i ? 'white' : scenario.color,
                                                            border: 'none', cursor: 'pointer', fontSize: '0.75rem',
                                                            fontWeight: 600, transition: 'all 0.2s',
                                                        }}
                                                    >
                                                        {copiedMsg === i ? <><Check size={12} /> Kopyalandı</> : <><Copy size={12} /> Kopyala</>}
                                                    </button>
                                                </div>
                                            ))}
                                        </ExtraCard>
                                    )}

                                    {/* Surprise Ideas */}
                                    {plan.surpriseIdeas?.length > 0 && (
                                        <ExtraCard
                                            icon={<Sparkles size={18} />}
                                            title="✨ Sürpriz Fikirleri"
                                            color="#F59E0B"
                                            isOpen={showExtras.surprises}
                                            toggle={() => toggleExtra('surprises')}
                                        >
                                            {plan.surpriseIdeas.map((s, i) => (
                                                <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', fontSize: '0.85rem' }}>
                                                    <span>💡</span>
                                                    <span>{s}</span>
                                                </div>
                                            ))}
                                        </ExtraCard>
                                    )}

                                    {/* Gift Suggestions */}
                                    {plan.giftSuggestions?.length > 0 && (
                                        <ExtraCard
                                            icon={<Gift size={18} />}
                                            title="🎁 Hediye Önerileri"
                                            color="#EC4899"
                                            isOpen={showExtras.gifts}
                                            toggle={() => toggleExtra('gifts')}
                                        >
                                            {plan.giftSuggestions.map((g, i) => (
                                                <div key={i} style={{
                                                    padding: '10px 12px', borderRadius: 10,
                                                    background: 'var(--bg-secondary)', marginBottom: 8,
                                                }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{g.item}</div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                                        📍 {g.where} · {g.priceRange}
                                                    </div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                                                        {g.why}
                                                    </div>
                                                </div>
                                            ))}
                                        </ExtraCard>
                                    )}

                                    {/* Apology Strategy */}
                                    {plan.apologyStrategy && (
                                        <ExtraCard
                                            icon={<Target size={18} />}
                                            title="🕊️ Gönül Alma Stratejisi"
                                            color="#10B981"
                                            isOpen={showExtras.apology}
                                            toggle={() => toggleExtra('apology')}
                                        >
                                            <div style={{ fontSize: '0.88rem', marginBottom: 10 }}>
                                                <strong>🎯 İlk Adım:</strong> {plan.apologyStrategy.openingMove}
                                            </div>
                                            <div style={{
                                                padding: '10px 14px', borderRadius: 10,
                                                background: '#ECFDF5', marginBottom: 10,
                                                fontStyle: 'italic', fontSize: '0.88rem',
                                            }}>
                                                "{plan.apologyStrategy.keyPhrase}"
                                            </div>
                                            {plan.apologyStrategy.avoidList?.length > 0 && (
                                                <div style={{ marginBottom: 8 }}>
                                                    <strong style={{ fontSize: '0.82rem', color: '#EF4444' }}>🚫 Sakın Yapma:</strong>
                                                    {plan.apologyStrategy.avoidList.map((a, i) => (
                                                        <div key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '2px 0 2px 16px' }}>• {a}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </ExtraCard>
                                    )}

                                    {/* Group Challenges */}
                                    {plan.groupChallenges?.length > 0 && (
                                        <ExtraCard
                                            icon={<Trophy size={18} />}
                                            title="🏆 Grup Challenge'ları"
                                            color="#8B5CF6"
                                            isOpen={showExtras.challenges}
                                            toggle={() => toggleExtra('challenges')}
                                        >
                                            {plan.groupChallenges.map((c, i) => (
                                                <div key={i} style={{
                                                    padding: '10px 12px', borderRadius: 10,
                                                    background: 'var(--bg-secondary)', marginBottom: 8,
                                                }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>🎯 {c.challenge}</div>
                                                    <div style={{ fontSize: '0.78rem', color: '#8B5CF6', marginTop: 2 }}>🏆 {c.reward}</div>
                                                </div>
                                            ))}
                                        </ExtraCard>
                                    )}

                                    {/* Self Care */}
                                    {plan.selfCareChecklist?.length > 0 && (
                                        <ExtraCard
                                            icon={<Heart size={18} />}
                                            title="🧘 Self-Care Checklist"
                                            color="#06B6D4"
                                            isOpen={showExtras.selfcare}
                                            toggle={() => toggleExtra('selfcare')}
                                        >
                                            {plan.selfCareChecklist.map((s, i) => (
                                                <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: '0.85rem' }}>
                                                    <span>✅</span>
                                                    <span>{s}</span>
                                                </div>
                                            ))}
                                        </ExtraCard>
                                    )}
                                </div>

                                {/* ── BOTTOM EXTRAS ── */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                                    {plan.whatToWear && (
                                        <div style={{
                                            padding: '14px', borderRadius: 14,
                                            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.82rem', marginBottom: 6 }}>
                                                <Shirt size={14} /> Kıyafet
                                            </div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                                {plan.whatToWear}
                                            </p>
                                        </div>
                                    )}

                                    {(plan.playlistVibe || plan.moodPlaylist) && (
                                        <div style={{
                                            padding: '14px', borderRadius: 14,
                                            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.82rem', marginBottom: 6 }}>
                                                <Music size={14} /> Müzik
                                            </div>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                                {plan.playlistVibe || plan.moodPlaylist?.vibe}
                                            </p>
                                            {plan.moodPlaylist?.songs?.length > 0 && (
                                                <div style={{ marginTop: 6 }}>
                                                    {plan.moodPlaylist.songs.slice(0, 3).map((s, i) => (
                                                        <div key={i} style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>🎵 {s}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* New plan button */}
                                <button
                                    onClick={resetAll}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: 14,
                                        background: 'var(--bg-secondary)',
                                        border: '2px solid var(--border)',
                                        cursor: 'pointer', fontWeight: 600, fontSize: '0.92rem',
                                        color: 'var(--text-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    }}
                                >
                                    <Zap size={18} /> Yeni SOS Plan Oluştur
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

// ═══ EXTRA CARD COMPONENT ═══
function ExtraCard({ icon, title, color, isOpen, toggle, children }) {
    return (
        <div style={{
            borderRadius: 14, overflow: 'hidden',
            border: '1px solid var(--border)',
            background: 'var(--bg-primary)',
        }}>
            <button
                onClick={toggle}
                style={{
                    width: '100%', padding: '14px 16px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'none', border: 'none', textAlign: 'left',
                }}
            >
                <span style={{ color }}>{icon}</span>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', flex: 1 }}>{title}</span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
