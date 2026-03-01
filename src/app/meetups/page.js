'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useSpace } from '@/context/SpaceContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import Sidebar from '@/components/layout/Sidebar'
import {
    Zap, MapPin, Users, DollarSign, Loader2, ChevronRight, Clock,
    Star, Navigation, Lightbulb, Gift, MessageCircle, CloudRain,
    Music, Shirt, Heart, Cake, Flame, Frown, Rainbow, ArrowLeft,
    Copy, Check, ChevronDown, ChevronUp, Sparkles, AlertTriangle,
    Target, Trophy, Printer, Share2, Download, Save, Trash2, CalendarDays,
    GraduationCap, Briefcase, Diamond, ExternalLink, Eye
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

// ═══ SOS SCENARIOS ═══
const SCENARIOS = [
    {
        key: 'anniversary',
        emoji: '💕',
        title: 'Yıldönümü Kurtarma',
        subtitle: 'Geç kaldın ama telafi edeceksin',
        description: 'Romantik akşam, sürpriz anlar, hediye fikirleri',
        color: '#EC4899',
        gradient: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
        icon: Heart,
        vibe: 'romantic',
        image: '/images/sos/anniversary.png',
    },
    {
        key: 'birthday',
        emoji: '🎂',
        title: 'Doğum Günü SOS',
        subtitle: 'Son dakika aklına geldi',
        description: 'Pasta, hediye koordinasyonu, sürpriz plan',
        color: '#F59E0B',
        gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
        icon: Cake,
        vibe: 'party',
        image: '/images/sos/birthday.png',
    },
    {
        key: 'friends',
        emoji: '🔥',
        title: 'Agalar / Kızlar Gecesi',
        subtitle: '"Çıkalım" dediler, plan sende',
        description: 'Gizli mekanlar, çılgın aktiviteler, hidden gems',
        color: '#8B5CF6',
        gradient: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
        icon: Flame,
        vibe: 'neon',
        image: '/images/sos/friends.png',
    },
    {
        key: 'apology',
        emoji: '💐',
        title: 'Gönül Alma Planı',
        subtitle: 'Bir şeyleri batırdın, düzeltme zamanı',
        description: 'Çiçek, anlamlı jestler, affedilme stratejisi',
        color: '#10B981',
        gradient: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
        icon: Heart,
        vibe: 'warm',
        image: '/images/sos/apology.png',
    },
    {
        key: 'mood',
        emoji: '🌈',
        title: 'Moral Yükseltme',
        subtitle: 'Moralimiz bozuk, toparlanalım',
        description: 'Comfort food, self-care, endorfin patlaması',
        color: '#06B6D4',
        gradient: 'linear-gradient(135deg, #06B6D4 0%, #10B981 100%)',
        icon: Rainbow,
        vibe: 'cozy',
        image: '/images/sos/mood.png',
    },
    {
        key: 'graduation',
        emoji: '🎓',
        title: 'Mezuniyet Kutlaması',
        subtitle: 'Diplomayı hak eden biri var!',
        description: 'Kutlama mekanları, hediye fikirleri, grup aktiviteleri',
        color: '#0F2847',
        gradient: 'linear-gradient(135deg, #0F2847 0%, #D4A853 100%)',
        icon: GraduationCap,
        vibe: 'celebration',
        image: '/images/sos/friends.png',
    },
    {
        key: 'proposal',
        emoji: '💍',
        title: 'Evlilik Teklifi',
        subtitle: 'Hayatının en önemli sorusu',
        description: 'Mükemmel mekan, zamanlama, yüzük, anı',
        color: '#D4A853',
        gradient: 'linear-gradient(135deg, #D4A853 0%, #0F2847 100%)',
        icon: Diamond,
        vibe: 'romantic',
        image: '/images/sos/anniversary.png',
    },
    {
        key: 'business',
        emoji: '🏢',
        title: 'İş Toplantısı',
        subtitle: 'Önemli bir buluşma geliyor',
        description: 'Profesyonel mekan, menü, etkileme stratejisi',
        color: '#1E293B',
        gradient: 'linear-gradient(135deg, #1E293B 0%, #475569 100%)',
        icon: Briefcase,
        vibe: 'professional',
        image: '/images/sos/mood.png',
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

const ISTANBUL_DISTRICTS = [
    // Avrupa Yakası — Merkez
    { key: 'Beşiktaş', emoji: '⚽', side: 'Avrupa' },
    { key: 'Beyoğlu', emoji: '🎸', side: 'Avrupa' },
    { key: 'Şişli', emoji: '🏙️', side: 'Avrupa' },
    { key: 'Fatih', emoji: '🕌', side: 'Avrupa' },
    { key: 'Bakırköy', emoji: '✈️', side: 'Avrupa' },
    { key: 'Sarıyer', emoji: '🌲', side: 'Avrupa' },
    { key: 'Kağıthane', emoji: '🏗️', side: 'Avrupa' },
    { key: 'Eyüpsultan', emoji: '⭐', side: 'Avrupa' },
    { key: 'Zeytinburnu', emoji: '🚇', side: 'Avrupa' },
    { key: 'Bayrampaşa', emoji: '🏬', side: 'Avrupa' },
    { key: 'Güngören', emoji: '🏘️', side: 'Avrupa' },
    { key: 'Bahçelievler', emoji: '🌳', side: 'Avrupa' },
    { key: 'Bağcılar', emoji: '🏢', side: 'Avrupa' },
    { key: 'Esenler', emoji: '🚌', side: 'Avrupa' },
    { key: 'Gaziosmanpaşa', emoji: '🏠', side: 'Avrupa' },
    { key: 'Sultangazi', emoji: '🌆', side: 'Avrupa' },
    // Avrupa Yakası — Batı
    { key: 'Avcılar', emoji: '🌊', side: 'Avrupa' },
    { key: 'Küçükçekmece', emoji: '🏖️', side: 'Avrupa' },
    { key: 'Başakşehir', emoji: '🏟️', side: 'Avrupa' },
    { key: 'Beylikdüzü', emoji: '🌇', side: 'Avrupa' },
    { key: 'Esenyurt', emoji: '🏗️', side: 'Avrupa' },
    { key: 'Büyükçekmece', emoji: '⛵', side: 'Avrupa' },
    { key: 'Çatalca', emoji: '🌾', side: 'Avrupa' },
    { key: 'Silivri', emoji: '🏝️', side: 'Avrupa' },
    { key: 'Arnavutköy', emoji: '🌿', side: 'Avrupa' },
    // Avrupa — Öne Çıkan Semtler
    { key: 'Taksim', emoji: '🎠', side: 'Avrupa' },
    { key: 'Karaköy', emoji: '⚓', side: 'Avrupa' },
    { key: 'Cihangir', emoji: '☕', side: 'Avrupa' },
    { key: 'Nişantaşı', emoji: '🛍️', side: 'Avrupa' },
    { key: 'Levent', emoji: '🏦', side: 'Avrupa' },
    { key: 'Etiler-Bebek', emoji: '🍸', side: 'Avrupa' },
    { key: 'Eminönü', emoji: '🌽', side: 'Avrupa' },
    { key: 'Balat', emoji: '🎨', side: 'Avrupa' },
    { key: 'Ortaköy', emoji: '🌉', side: 'Avrupa' },
    // Anadolu Yakası — Merkez
    { key: 'Kadıköy', emoji: '🌊', side: 'Anadolu' },
    { key: 'Üsküdar', emoji: '🚀', side: 'Anadolu' },
    { key: 'Ataşehir', emoji: '🏢', side: 'Anadolu' },
    { key: 'Beykoz', emoji: '🌳', side: 'Anadolu' },
    { key: 'Maltepe', emoji: '🏖️', side: 'Anadolu' },
    { key: 'Kartal', emoji: '🚄', side: 'Anadolu' },
    { key: 'Pendik', emoji: '🎣', side: 'Anadolu' },
    { key: 'Tuzla', emoji: '⛵', side: 'Anadolu' },
    { key: 'Ümraniye', emoji: '🏬', side: 'Anadolu' },
    { key: 'Sancaktepe', emoji: '🏘️', side: 'Anadolu' },
    { key: 'Sultanbeyli', emoji: '🌆', side: 'Anadolu' },
    { key: 'Çekmeköy', emoji: '🌲', side: 'Anadolu' },
    { key: 'Şile', emoji: '🏝️', side: 'Anadolu' },
    // Anadolu — Öne Çıkan Semtler
    { key: 'Moda', emoji: '🎨', side: 'Anadolu' },
    { key: 'Bağdat Caddesi', emoji: '🛍️', side: 'Anadolu' },
    { key: 'Acıbadem', emoji: '🌿', side: 'Anadolu' },
    { key: 'Fenerbahçe', emoji: '⚽', side: 'Anadolu' },
    { key: 'Ağva', emoji: '🏕️', side: 'Anadolu' },
    // Adalar
    { key: 'Adalar', emoji: '🏝️', side: 'Anadolu' },
]

const PEOPLE_OPTIONS = [2, 3, 4, 6, 8]

export default function SOSPlanPage() {
    const { user } = useAuth()
    const { space, createSpace } = useSpace()
    const { locale, t } = useLanguage()
    const { toast } = useToast()
    const supabase = createClient()
    const printRef = useRef(null)

    const [selectedScenario, setSelectedScenario] = useState(null)
    const [city, setCity] = useState('')
    const [customCity, setCustomCity] = useState('')
    const [district, setDistrict] = useState('')
    const [startTime, setStartTime] = useState('18:00')
    const [endTime, setEndTime] = useState('23:00')
    const [peopleCount, setPeopleCount] = useState(2)
    const [budget, setBudget] = useState('mid')
    const [extraNotes, setExtraNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [loadingText, setLoadingText] = useState('')
    const [plan, setPlan] = useState(null)
    const [expandedStep, setExpandedStep] = useState(null)
    const [copiedMsg, setCopiedMsg] = useState(null)
    const [showExtras, setShowExtras] = useState({})
    const [saving, setSaving] = useState(false)
    const [savedPlanId, setSavedPlanId] = useState(null)
    const [savedPlans, setSavedPlans] = useState([])
    const [loadingSaved, setLoadingSaved] = useState(true)
    const [userSpaces, setUserSpaces] = useState([])
    const [selectedSpaceId, setSelectedSpaceId] = useState(null)
    const [creatingGroup, setCreatingGroup] = useState(false)
    const [newGroupName, setNewGroupName] = useState('')

    // Load user's groups/spaces
    useEffect(() => {
        if (!user) return
        const loadSpaces = async () => {
            try {
                const { data: memberships } = await supabase
                    .from('space_members').select('space_id, role').eq('user_id', user.id)
                if (memberships && memberships.length > 0) {
                    const { data: spacesData } = await supabase
                        .from('spaces').select('id, name').in('id', memberships.map(m => m.space_id))
                    if (spacesData && spacesData.length > 0) {
                        setUserSpaces(spacesData)
                        setSelectedSpaceId(space?.id || spacesData[0]?.id)
                    }
                }
            } catch (e) { console.warn('SOS spaces load error:', e) }
        }
        loadSpaces()
    }, [user])

    // Load previously saved SOS plans
    useEffect(() => {
        if (!user || !space) { setLoadingSaved(false); return }
        const loadSaved = async () => {
            const { data } = await supabase
                .from('trips')
                .select('id, city, tempo, budget, itinerary_data, created_at')
                .eq('space_id', space.id)
                .not('tempo', 'is', null)
                .in('tempo', ['anniversary', 'birthday', 'friends', 'apology', 'mood'])
                .order('created_at', { ascending: false })
                .limit(10)
            setSavedPlans(data || [])
            setLoadingSaved(false)
        }
        loadSaved()
    }, [user, space])

    // Create new group inline
    const createGroupInline = async () => {
        if (!newGroupName.trim()) return
        setCreatingGroup(true)
        try {
            const newSpace = await createSpace(newGroupName.trim())
            setUserSpaces(prev => [...prev, { id: newSpace.id, name: newSpace.name }])
            setSelectedSpaceId(newSpace.id)
            setNewGroupName('')
            toast.success('✅ Grup oluşturuldu!')
        } catch (e) { toast.error(e.message) }
        setCreatingGroup(false)
    }

    // Save SOS plan to database
    const savePlan = async () => {
        if (!plan || !selectedScenario) return
        setSaving(true)
        try {
            let targetSpaceId = selectedSpaceId
            if (!targetSpaceId) {
                if (space?.id) {
                    targetSpaceId = space.id
                } else {
                    const newSpace = await createSpace('Seyahat Planlarım')
                    targetSpaceId = newSpace.id
                    setUserSpaces(prev => [...prev, { id: newSpace.id, name: newSpace.name }])
                    setSelectedSpaceId(newSpace.id)
                }
            }
            const finalCity = city || customCity
            const { data: trip, error } = await supabase
                .from('trips')
                .insert({
                    space_id: targetSpaceId,
                    city: finalCity,
                    tempo: selectedScenario.key,
                    budget: budget,
                    itinerary_data: {
                        ...plan,
                        _sosMetadata: {
                            scenario: selectedScenario.key,
                            city: finalCity,
                            district,
                            peopleCount,
                            budget,
                            extraNotes,
                            startTime,
                            endTime,
                            savedAt: new Date().toISOString(),
                        }
                    },
                })
                .select().single()
            if (error) throw error
            setSavedPlanId(trip.id)
            setSavedPlans(prev => [trip, ...prev])
            toast.success('💾 SOS Plan kaydedildi!')
        } catch (err) {
            toast.error(err.message || 'Kayıt başarısız')
        }
        setSaving(false)
    }

    // Delete a saved plan
    const deleteSavedPlan = async (id) => {
        const { error } = await supabase.from('trips').delete().eq('id', id)
        if (!error) {
            setSavedPlans(prev => prev.filter(p => p.id !== id))
            toast.success('Plan silindi')
        }
    }

    // Load a saved plan
    const loadSavedPlan = (saved) => {
        const data = saved.itinerary_data
        const meta = data?._sosMetadata
        const sc = SCENARIOS.find(s => s.key === (meta?.scenario || saved.tempo))
        if (!sc) return
        setSelectedScenario(sc)
        setCity(meta?.city || saved.city || '')
        setCustomCity('')
        setPeopleCount(meta?.peopleCount || 2)
        setBudget(meta?.budget || saved.budget || 'mid')
        setExtraNotes(meta?.extraNotes || '')
        setPlan(data)
        setSavedPlanId(saved.id)
        toast.success('Plan yüklendi!')
    }

    const loadingMessages = {
        anniversary: ['💕 Romantik mekanlar aranıyor...', '🌹 Sürpriz fikirleri hazırlanıyor...', '🕯️ Mükemmel akşam planlanıyor...'],
        birthday: ['🎂 Pasta seçenekleri araştırılıyor...', '🎁 Hediye fikirleri üretiliyor...', '🎉 Sürpriz plan hazırlanıyor...'],
        friends: ['🔥 Gizli mekanlar taranıyor...', '🎯 Çılgın aktiviteler bulunuyor...', '🍻 Efsane gece planlanıyor...'],
        apology: ['💐 Çiçekçiler kontrol ediliyor...', '💌 Mesaj taslakları yazılıyor...', '🕊️ Gönül alma stratejisi hazırlanıyor...'],
        mood: ['🌈 İyi his mekanları aranıyor...', '☕ Comfort food rotası çiziliyor...', '🧘 Moral planı oluşturuluyor...'],
        graduation: ['🎓 Kutlama mekanları aranıyor...', '🥂 Kutlama menüsü hazırlanıyor...', '📸 Anı noktaları belirleniyor...'],
        proposal: ['💍 Romantik lokasyonlar taranıyor...', '🌹 Mükemmel an planlanıyor...', '💎 Her detay düşünülüyor...'],
        business: ['🏢 Profesyonel mekanlar aranıyor...', '🍽️ Menü alternatifleri sunuluyor...', '📋 Toplantı stratejisi hazırlanıyor...'],
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

    const generatePlan = async () => {
        const finalCity = city || customCity
        if (!finalCity) { toast.error(t('sos.selectCity')); return }
        setLoading(true)
        setPlan(null)
        try {
            const locationInfo = district ? `${finalCity}, ${district}` : finalCity
            const res = await fetch('/api/ai/meetup-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenario: selectedScenario.key, city: locationInfo, district, peopleCount, budget, extraNotes, startTime, endTime }),
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            setPlan(data)
            toast.success(`🚨 ${t('sos.planReady')}`)
        } catch (err) {
            toast.error(err.message || 'Plan oluşturulamadı')
        }
        setLoading(false)
    }

    const copyMessage = (msg, idx) => {
        navigator.clipboard.writeText(msg)
        setCopiedMsg(idx)
        toast.success('Mesaj kopyalandı!')
        setTimeout(() => setCopiedMsg(null), 2000)
    }

    const toggleExtra = (key) => setShowExtras(prev => ({ ...prev, [key]: !prev[key] }))

    const resetAll = () => {
        setSelectedScenario(null); setPlan(null); setCity(''); setCustomCity('')
        setDistrict(''); setStartTime('18:00'); setEndTime('23:00')
        setPeopleCount(2); setBudget('mid'); setExtraNotes('')
        setExpandedStep(null); setShowExtras({})
    }

    // ── SHARE ──
    const sharePlan = async () => {
        if (!plan) return
        const sc = selectedScenario
        const text = `🚨 SOS Plan — ${plan.planTitle}\n\n📍 ${city || customCity}\n👥 ${peopleCount} kişi\n\n${(plan.steps || []).map(s => `${s.time} ${s.emoji} ${s.title || s.action} — ${s.placeName}`).join('\n')}\n\n— UMAE SOS Plan`
        if (navigator.share) {
            try {
                await navigator.share({ title: `SOS Plan — ${plan.planTitle}`, text })
            } catch { /* cancelled */ }
        } else {
            await navigator.clipboard.writeText(text)
            toast.success(t('sos.copied'))
        }
    }

    // ── PRINT / EXPORT ──
    const handlePrint = () => {
        if (!plan || !printRef.current) return
        const printWindow = window.open('', '_blank')
        if (!printWindow) { toast.error('Popup engelleyici kapatın'); return }
        const sc = selectedScenario
        const stepsHTML = (plan.steps || []).map((step, i) => `
            <div style="page-break-inside:avoid;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:12px;">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                    <span style="background:${sc.color}15;color:${sc.color};padding:4px 10px;border-radius:8px;font-weight:700;font-size:13px;">${step.time}</span>
                    <span style="font-size:20px;">${step.emoji}</span>
                    <span style="font-weight:700;font-size:15px;">${step.title || step.action}</span>
                </div>
                <div style="font-size:13px;color:#4a5568;margin-bottom:6px;"><strong>📍 ${step.placeName}</strong> ${step.placeRating ? `· ⭐${step.placeRating}` : ''} ${step.duration ? `· ${step.duration}` : ''}</div>
                <p style="font-size:13px;color:#2d3748;line-height:1.6;margin:8px 0;">${step.detail}</p>
                ${step.proTip ? `<div style="background:${sc.color}10;padding:8px 12px;border-radius:8px;font-size:12px;color:${sc.color};"><strong>💡 Pro Tip:</strong> ${step.proTip}</div>` : ''}
                ${step.transport ? `<div style="font-size:11px;color:#718096;margin-top:6px;">🚗 ${step.transport}</div>` : ''}
                ${step.estimatedCost ? `<div style="font-size:12px;color:${sc.color};font-weight:600;margin-top:4px;">💰 ${step.estimatedCost}</div>` : ''}
                ${step.alternative ? `<div style="margin-top:6px;padding:6px 10px;background:#f7fafc;border-radius:6px;font-size:11px;"><strong>🔄 Alternatif:</strong> ${step.alternative.name} — ${step.alternative.reason}</div>` : ''}
            </div>
        `).join('')

        const extrasHTML = []
        if (plan.messageDrafts?.length) {
            extrasHTML.push(`<div style="page-break-inside:avoid;"><h3>💬 Mesaj Taslakları</h3>${plan.messageDrafts.map(m => `<div style="border:1px solid #e2e8f0;padding:12px;border-radius:8px;margin-bottom:8px;"><div style="font-size:11px;color:#a0aec0;margin-bottom:4px;">${m.timing}</div><div style="font-size:13px;">${m.message}</div></div>`).join('')}</div>`)
        }
        if (plan.giftSuggestions?.length) {
            extrasHTML.push(`<div style="page-break-inside:avoid;"><h3>🎁 Hediye Önerileri</h3>${plan.giftSuggestions.map(g => `<div style="border:1px solid #e2e8f0;padding:10px;border-radius:8px;margin-bottom:6px;"><strong>${g.item}</strong> · ${g.where} · ${g.priceRange}<br/><span style="color:#718096;font-size:12px;">${g.why}</span></div>`).join('')}</div>`)
        }
        if (plan.surpriseIdeas?.length) {
            extrasHTML.push(`<div style="page-break-inside:avoid;"><h3>✨ Sürpriz Fikirleri</h3>${plan.surpriseIdeas.map(s => `<div style="padding:4px 0;font-size:13px;">💡 ${s}</div>`).join('')}</div>`)
        }
        if (plan.planB) {
            extrasHTML.push(`<div style="page-break-inside:avoid;"><h3>🌧️ B Planı</h3><p><strong>${plan.planB.title}</strong></p><p style="font-size:13px;color:#4a5568;">${plan.planB.description}</p>${(plan.planB.steps || []).map((s, i) => `<div style="font-size:13px;">${i + 1}. ${s}</div>`).join('')}</div>`)
        }

        printWindow.document.write(`<!DOCTYPE html><html><head><title>SOS Plan — ${plan.planTitle}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 700px; margin: 0 auto; padding: 32px 24px; color: #1a202c; }
            h1 { font-size: 24px; margin-bottom: 4px; }
            h2 { font-size: 16px; margin-bottom: 16px; color: #4a5568; }
            h3 { font-size: 16px; margin: 20px 0 10px; }
            .header { text-align: center; margin-bottom: 24px; padding: 24px; border-radius: 16px; background: linear-gradient(135deg, ${sc.color}15, ${sc.color}05); }
            .meta { display: flex; gap: 16px; justify-content: center; margin-top: 12px; font-size: 13px; color: #718096; }
            .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #a0aec0; }
            @media print { body { padding: 16px; } }
        </style></head><body>
            <div class="header">
                <div style="font-size:40px;margin-bottom:8px;">${plan.planEmoji || sc.emoji}</div>
                <h1>${plan.planTitle}</h1>
                <h2>${plan.vibeDescription || ''}</h2>
                <div class="meta">
                    <span>📍 ${city || customCity}</span>
                    <span>👥 ${peopleCount} kişi</span>
                    ${plan.totalBudget?.perPerson ? `<span>💰 ${plan.totalBudget.perPerson}</span>` : ''}
                </div>
            </div>
            ${plan.urgencyNote ? `<div style="background:#fef3c7;border:1px solid #fcd34d;padding:12px 16px;border-radius:10px;margin-bottom:16px;font-size:13px;color:#92400e;">⚡ <strong>Hemen yap:</strong> ${plan.urgencyNote}</div>` : ''}
            <h3>🕐 Saat Saat Plan</h3>
            ${stepsHTML}
            ${extrasHTML.join('')}
            <div style="display:flex;gap:20px;margin-top:20px;">
                ${plan.whatToWear ? `<div style="flex:1;padding:14px;border:1px solid #e2e8f0;border-radius:10px;"><strong>👗 Kıyafet</strong><p style="font-size:12px;color:#4a5568;margin-top:4px;">${plan.whatToWear}</p></div>` : ''}
                ${plan.playlistVibe ? `<div style="flex:1;padding:14px;border:1px solid #e2e8f0;border-radius:10px;"><strong>🎵 Müzik</strong><p style="font-size:12px;color:#4a5568;margin-top:4px;">${plan.playlistVibe}</p></div>` : ''}
            </div>
            <div class="footer">UMAE — SOS Plan · ${new Date().toLocaleDateString('tr-TR')}</div>
        </body></html>`)
        printWindow.document.close()
        setTimeout(() => printWindow.print(), 500)
    }

    const scenario = selectedScenario

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="page">
                    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }} ref={printRef}>

                        {/* ═══ UMAE BRANDED HERO ═══ */}
                        <div style={{ textAlign: 'center', marginBottom: 32 }}>
                            {plan && (
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
                                    <button onClick={resetAll} style={pillBtnStyle}>
                                        <ArrowLeft size={14} /> {t('sos.newPlan')}
                                    </button>
                                    <button onClick={handlePrint} style={{ ...pillBtnStyle, background: '#0F2847', color: '#D4A853', border: 'none' }}>
                                        <Printer size={14} /> {t('sos.print')}
                                    </button>
                                    <button onClick={sharePlan} style={{ ...pillBtnStyle, background: '#D4A853', color: '#0F2847', border: 'none' }}>
                                        <Share2 size={14} /> {t('sos.share')}
                                    </button>
                                </div>
                            )}
                            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                                style={{
                                    borderRadius: 24, overflow: 'hidden', position: 'relative', minHeight: 140,
                                    background: 'linear-gradient(135deg, #0F2847 0%, #1A3A5C 50%, #D4A853 100%)',
                                    padding: '28px 24px',
                                }}>
                                <motion.span animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                                    transition={{ repeat: Infinity, duration: 4 }}
                                    style={{ position: 'absolute', top: 16, right: 40, fontSize: '2rem', opacity: 0.2 }}>🚨</motion.span>
                                <motion.span animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
                                    style={{ position: 'absolute', bottom: 12, right: 100, fontSize: '1.4rem', opacity: 0.12 }}>⚡</motion.span>
                                <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 5 }}
                                    style={{ position: 'absolute', top: 20, right: 160, fontSize: '1.2rem', opacity: 0.1 }}>🎯</motion.span>
                                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Image src="/umae-icon.png" alt="UMAE" width={44} height={44} style={{ borderRadius: 12, marginBottom: 10 }} />
                                    <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 900, marginBottom: 6, letterSpacing: '-0.02em' }}>
                                        🚨 {t('sos.title')}
                                    </h1>
                                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', maxWidth: 400 }}>
                                        {t('sos.subtitle')}
                                    </p>
                                </div>
                            </motion.div>
                        </div>

                        {/* ═══ SCENARIO SELECTION ═══ */}
                        {!plan && (
                            <AnimatePresence mode="wait">
                                {!selectedScenario ? (
                                    <motion.div key="scenarios" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>
                                            Ne oldu? 👇
                                        </h2>
                                        <div style={{ display: 'grid', gap: 14 }}>
                                            {SCENARIOS.map((sc, i) => (
                                                <motion.button
                                                    key={sc.key}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    onClick={() => setSelectedScenario(sc)}
                                                    style={{
                                                        display: 'flex', alignItems: 'stretch', gap: 0,
                                                        borderRadius: 18, overflow: 'hidden',
                                                        background: 'var(--bg-primary)',
                                                        border: '2px solid var(--border)',
                                                        cursor: 'pointer', textAlign: 'left',
                                                        transition: 'all 0.25s ease', height: 110,
                                                    }}
                                                    whileHover={{
                                                        scale: 1.02,
                                                        borderColor: sc.color,
                                                        boxShadow: `0 8px 30px ${sc.color}25`,
                                                    }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    {/* Scenario Image */}
                                                    <div style={{
                                                        width: 110, minWidth: 110, position: 'relative',
                                                        overflow: 'hidden', flexShrink: 0,
                                                    }}>
                                                        <Image
                                                            src={sc.image}
                                                            alt={sc.title}
                                                            fill
                                                            style={{ objectFit: 'cover' }}
                                                            sizes="110px"
                                                        />
                                                        <div style={{
                                                            position: 'absolute', inset: 0,
                                                            background: `linear-gradient(90deg, transparent 50%, ${sc.color}10 100%)`,
                                                        }} />
                                                    </div>
                                                    {/* Text content */}
                                                    <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                            <span style={{ fontSize: '1.2rem' }}>{sc.emoji}</span>
                                                            <span style={{ fontWeight: 700, fontSize: '1rem' }}>{sc.title}</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                                                            {sc.subtitle}
                                                        </div>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                                            {sc.description}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', paddingRight: 14 }}>
                                                        <ChevronRight size={20} style={{ color: sc.color }} />
                                                    </div>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div key="params" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                        {/* Selected scenario banner with image */}
                                        <div style={{
                                            position: 'relative', borderRadius: 18, overflow: 'hidden',
                                            marginBottom: 24, height: 140,
                                        }}>
                                            <Image
                                                src={scenario.image}
                                                alt={scenario.title}
                                                fill
                                                style={{ objectFit: 'cover', filter: 'brightness(0.6)' }}
                                                sizes="800px"
                                            />
                                            <div style={{
                                                position: 'absolute', inset: 0, display: 'flex',
                                                alignItems: 'center', padding: '0 clamp(14px, 3vw, 24px)', gap: 14,
                                                background: `linear-gradient(90deg, ${scenario.color}CC, transparent)`,
                                            }}>
                                                <span style={{ fontSize: 'clamp(1.5rem, 5vw, 2.2rem)' }}>{scenario.emoji}</span>
                                                <div style={{ color: 'white' }}>
                                                    <div style={{ fontWeight: 800, fontSize: 'clamp(1rem, 3vw, 1.3rem)' }}>{scenario.title}</div>
                                                    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{scenario.subtitle}</div>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedScenario(null)}
                                                    style={{
                                                        marginLeft: 'auto', background: 'rgba(255,255,255,0.2)',
                                                        backdropFilter: 'blur(8px)', border: 'none', borderRadius: 10,
                                                        padding: '8px 14px', color: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                                                    }}
                                                >
                                                    Değiştir
                                                </button>
                                            </div>
                                        </div>

                                        {/* Quick params */}
                                        <div style={{ display: 'grid', gap: 20 }}>
                                            {/* City */}
                                            <div>
                                                <label style={labelStyle}><MapPin size={16} /> {t('sos.city')}</label>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                                                    {CITIES.map(c => (
                                                        <button key={c.key} onClick={() => { setCity(c.key); setCustomCity(''); if (c.key !== 'İstanbul') setDistrict('') }}
                                                            style={chipStyle(city === c.key, scenario.color)}>
                                                            {c.emoji} {c.key}
                                                        </button>
                                                    ))}
                                                </div>
                                                <input type="text" className="input" placeholder={t('sos.cityPlaceholder')}
                                                    value={customCity} onChange={e => { setCustomCity(e.target.value); setCity(''); setDistrict('') }}
                                                    style={{ fontSize: '0.88rem' }} />
                                            </div>

                                            {/* Istanbul District Picker */}
                                            {city === 'İstanbul' && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                                    <label style={labelStyle}><MapPin size={16} /> İlçe <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(opsiyonel)</span></label>
                                                    <div style={{ marginBottom: 8 }}>
                                                        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary-2)', marginBottom: 6 }}>🌉 Avrupa Yakası</div>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                                                            {ISTANBUL_DISTRICTS.filter(d => d.side === 'Avrupa').map(d => (
                                                                <button key={d.key} onClick={() => setDistrict(d.key)}
                                                                    style={{
                                                                        ...chipStyle(district === d.key, scenario.color),
                                                                        padding: '6px 10px', fontSize: '0.78rem',
                                                                    }}>
                                                                    {d.emoji} {d.key}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary-2)', marginBottom: 6 }}>🌊 Anadolu Yakası</div>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                            {ISTANBUL_DISTRICTS.filter(d => d.side === 'Anadolu').map(d => (
                                                                <button key={d.key} onClick={() => setDistrict(d.key)}
                                                                    style={{
                                                                        ...chipStyle(district === d.key, scenario.color),
                                                                        padding: '6px 10px', fontSize: '0.78rem',
                                                                    }}>
                                                                    {d.emoji} {d.key}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Start / End Time */}
                                            <div>
                                                <label style={labelStyle}><Clock size={16} /> {t('sos.date')}</label>
                                                <div style={{ display: 'flex', gap: 10 }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 4, fontWeight: 600 }}>Başlangıç</div>
                                                        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                                                            className="input" style={{ fontSize: '0.88rem', textAlign: 'center' }} />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 4, fontWeight: 600 }}>Bitiş</div>
                                                        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                                                            className="input" style={{ fontSize: '0.88rem', textAlign: 'center' }} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* People */}
                                            <div>
                                                <label style={labelStyle}><Users size={16} /> {t('sos.people')}</label>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    {PEOPLE_OPTIONS.map(n => (
                                                        <button key={n} onClick={() => setPeopleCount(n)}
                                                            style={{
                                                                width: 50, height: 50, borderRadius: 14,
                                                                border: peopleCount === n ? `2px solid ${scenario.color}` : '2px solid var(--border)',
                                                                background: peopleCount === n ? `${scenario.color}15` : 'var(--bg-primary)',
                                                                cursor: 'pointer', fontWeight: 700, fontSize: '1.05rem',
                                                                color: peopleCount === n ? scenario.color : 'var(--text-primary)',
                                                                transition: 'all 0.15s ease',
                                                            }}>
                                                            {n}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Budget */}
                                            <div>
                                                <label style={labelStyle}><DollarSign size={16} /> {t('sos.budget')}</label>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    {BUDGETS.map(b => (
                                                        <button key={b.key} onClick={() => setBudget(b.key)}
                                                            style={{
                                                                flex: 1, padding: '14px 8px', borderRadius: 14, textAlign: 'center',
                                                                border: budget === b.key ? `2px solid ${scenario.color}` : '2px solid var(--border)',
                                                                background: budget === b.key ? `${scenario.color}15` : 'var(--bg-primary)',
                                                                cursor: 'pointer', transition: 'all 0.15s ease',
                                                            }}>
                                                            <div style={{ fontSize: '1.3rem' }}>{b.emoji}</div>
                                                            <div style={{ fontWeight: 600, fontSize: '0.84rem', color: budget === b.key ? scenario.color : 'var(--text-primary)' }}>{b.label}</div>
                                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{b.desc}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Notes */}
                                            <div>
                                                <label style={labelStyle}><Sparkles size={16} /> {t('sos.extraNotes')} <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>{t('sos.optional')}</span></label>
                                                <textarea className="input" rows={2} value={extraNotes} onChange={e => setExtraNotes(e.target.value)}
                                                    placeholder={
                                                        scenario.key === 'anniversary' ? 'ör: 3. yıldönümümüz, deniz manzaralı mekan olsa süper...' :
                                                            scenario.key === 'birthday' ? 'ör: 25 yaşına giriyor, çikolata seviyor...' :
                                                                scenario.key === 'friends' ? 'ör: 4 kişiyiz, biraz çılgınlık olsun...' :
                                                                    scenario.key === 'apology' ? 'ör: kız arkadaşım kızgın, doğum gününü unuttum...' :
                                                                        'ör: iş stresi var, rahatlatıcı bir şeyler olsa...'
                                                    }
                                                    style={{ fontSize: '0.88rem', resize: 'none' }} />
                                            </div>
                                        </div>

                                        {/* Generate CTA */}
                                        <motion.button onClick={generatePlan} disabled={loading || (!city && !customCity)}
                                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                            style={{
                                                width: '100%', marginTop: 28, padding: '18px 0',
                                                borderRadius: 16, border: 'none', cursor: 'pointer',
                                                background: loading ? 'var(--bg-tertiary)' : scenario.gradient,
                                                color: 'white', fontWeight: 700, fontSize: '1.1rem',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                                opacity: (!city && !customCity) ? 0.5 : 1,
                                                boxShadow: `0 6px 25px ${scenario.color}40`,
                                                letterSpacing: '0.02em',
                                            }}>
                                            {loading ? (
                                                <><Loader2 size={20} className="spin" /> {loadingText}</>
                                            ) : (
                                                <><Zap size={20} /> 🚨 SOS Planı Oluştur</>
                                            )}
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}

                        {/* ═══ PLAN RESULT ═══ */}
                        {plan && (
                            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                                {/* Plan hero */}
                                <div style={{
                                    position: 'relative', borderRadius: 22, overflow: 'hidden',
                                    marginBottom: 24, height: 200,
                                }}>
                                    <Image
                                        src={scenario.image}
                                        alt={plan.planTitle}
                                        fill
                                        style={{ objectFit: 'cover', filter: 'brightness(0.45) saturate(1.2)' }}
                                        sizes="800px"
                                    />
                                    <div style={{
                                        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center', padding: 24, color: 'white', textAlign: 'center',
                                    }}>
                                        <div style={{ fontSize: '2.8rem', marginBottom: 8 }}>{plan.planEmoji || scenario.emoji}</div>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 6, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                                            {plan.planTitle}
                                        </h2>
                                        <p style={{ fontSize: '0.88rem', opacity: 0.9, maxWidth: 500, lineHeight: 1.4 }}>
                                            {plan.vibeDescription}
                                        </p>
                                        {plan.totalBudget && (
                                            <div style={{
                                                marginTop: 10, padding: '6px 16px', borderRadius: 20,
                                                background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                                                fontSize: '0.85rem', fontWeight: 600,
                                            }}>
                                                💰 {plan.totalBudget?.perPerson || plan.totalBudget}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Urgency */}
                                {plan.urgencyNote && (
                                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                        style={{
                                            display: 'flex', alignItems: 'flex-start', gap: 10,
                                            padding: '14px 16px', borderRadius: 14, marginBottom: 20,
                                            background: 'var(--warning-bg)', border: '1px solid var(--warning)',
                                        }}>
                                        <AlertTriangle size={18} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
                                        <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                                            ⚡ <strong>Hemen yap:</strong> {plan.urgencyNote}
                                        </div>
                                    </motion.div>
                                )}

                                {/* ── TIMELINE ── */}
                                <h3 style={sectionTitle}><Clock size={18} /> Saat Saat Plan</h3>
                                <div style={{ position: 'relative', paddingLeft: 20, marginBottom: 28 }}>
                                    {/* Timeline line */}
                                    <div style={{
                                        position: 'absolute', left: 8, top: 0, bottom: 0, width: 3,
                                        background: `linear-gradient(180deg, ${scenario.color}, ${scenario.color}30)`,
                                        borderRadius: 3,
                                    }} />
                                    <div style={{ display: 'grid', gap: 14 }}>
                                        {plan.steps?.map((step, i) => {
                                            const isExpanded = expandedStep === i
                                            return (
                                                <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.08 }}
                                                    style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
                                                    {/* Timeline dot */}
                                                    <div style={{
                                                        position: 'absolute', left: -16, top: 22, width: 10, height: 10,
                                                        borderRadius: '50%', background: scenario.color,
                                                        border: '2px solid var(--bg-primary)', zIndex: 2,
                                                    }} />
                                                    <button onClick={() => setExpandedStep(isExpanded ? null : i)}
                                                        style={{ width: '100%', padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', textAlign: 'left' }}>
                                                        <div style={{
                                                            minWidth: 50, padding: '6px 0', textAlign: 'center', borderRadius: 10,
                                                            background: `${scenario.color}15`, color: scenario.color, fontWeight: 700, fontSize: '0.82rem',
                                                        }}>{step.time}</div>
                                                        <div style={{
                                                            width: 38, height: 38, borderRadius: 12, background: scenario.gradient,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0,
                                                        }}>{step.emoji}</div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{step.title || step.action}</div>
                                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                                                {step.placeName} {step.duration ? `· ${step.duration}` : ''}
                                                            </div>
                                                        </div>
                                                        <div style={{ fontSize: '0.78rem', color: scenario.color, fontWeight: 600 }}>{step.estimatedCost}</div>
                                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                                                <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                                                                    <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-secondary)', margin: '12px 0' }}>{step.detail}</p>
                                                                    {step.placeRating && (
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                                            <Star size={14} style={{ color: '#F59E0B' }} />
                                                                            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{step.placeRating} ({step.placeReviews} yorum)</span>
                                                                            {step.address && <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>· {step.address}</span>}
                                                                        </div>
                                                                    )}
                                                                    {step.proTip && (
                                                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 10, background: `${scenario.color}10`, marginBottom: 8 }}>
                                                                            <Lightbulb size={14} style={{ color: scenario.color, flexShrink: 0, marginTop: 2 }} />
                                                                            <span style={{ fontSize: '0.82rem', color: scenario.color, fontWeight: 500 }}>{step.proTip}</span>
                                                                        </div>
                                                                    )}
                                                                    {step.transport && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-tertiary)' }}><Navigation size={12} /> {step.transport}</div>}
                                                                    {step.placeName && (
                                                                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(step.placeName + ' ' + (city || customCity))}`}
                                                                            target="_blank" rel="noopener noreferrer"
                                                                            style={{
                                                                                display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
                                                                                padding: '6px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
                                                                                background: `${scenario.color}15`, color: scenario.color,
                                                                                textDecoration: 'none', border: `1px solid ${scenario.color}30`,
                                                                            }}>
                                                                            <ExternalLink size={12} /> {t('sos.mapsOpen')}
                                                                        </a>
                                                                    )}
                                                                    {step.alternative && <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-secondary)', fontSize: '0.78rem' }}><strong>🔄 {t('sos.alternative')}</strong> {step.alternative.name} — {step.alternative.reason}</div>}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* ── EXTRAS ── */}
                                <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
                                    {plan.planB && <ExtraCard icon={<CloudRain size={18} />} title="🌧️ B Planı" color="#64748B" isOpen={showExtras.planB} toggle={() => toggleExtra('planB')}>
                                        <p style={{ fontWeight: 600, marginBottom: 6 }}>{plan.planB.title}</p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{plan.planB.description}</p>
                                        {plan.planB.steps?.map((s, i) => <div key={i} style={{ fontSize: '0.82rem', padding: '4px 0', color: 'var(--text-secondary)' }}>{i + 1}. {s}</div>)}
                                    </ExtraCard>}

                                    {plan.messageDrafts?.length > 0 && <ExtraCard icon={<MessageCircle size={18} />} title="💬 Mesaj Taslakları" color={scenario.color} isOpen={showExtras.messages} toggle={() => toggleExtra('messages')}>
                                        {plan.messageDrafts.map((m, i) => (
                                            <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-secondary)', marginBottom: 8 }}>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>📌 {m.timing}</div>
                                                <div style={{ fontSize: '0.85rem', lineHeight: 1.5, marginBottom: 6 }}>{m.message}</div>
                                                <button onClick={() => copyMessage(m.message, i)}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: copiedMsg === i ? '#10B981' : `${scenario.color}15`, color: copiedMsg === i ? 'white' : scenario.color, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s' }}>
                                                    {copiedMsg === i ? <><Check size={12} /> Kopyalandı</> : <><Copy size={12} /> Kopyala</>}
                                                </button>
                                            </div>
                                        ))}
                                    </ExtraCard>}

                                    {plan.surpriseIdeas?.length > 0 && <ExtraCard icon={<Sparkles size={18} />} title="✨ Sürpriz Fikirleri" color="#F59E0B" isOpen={showExtras.surprises} toggle={() => toggleExtra('surprises')}>
                                        {plan.surpriseIdeas.map((s, i) => <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', fontSize: '0.85rem' }}><span>💡</span><span>{s}</span></div>)}
                                    </ExtraCard>}

                                    {plan.giftSuggestions?.length > 0 && <ExtraCard icon={<Gift size={18} />} title="🎁 Hediye Önerileri" color="#EC4899" isOpen={showExtras.gifts} toggle={() => toggleExtra('gifts')}>
                                        {plan.giftSuggestions.map((g, i) => (
                                            <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-secondary)', marginBottom: 8 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{g.item}</div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>📍 {g.where} · {g.priceRange}</div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{g.why}</div>
                                            </div>
                                        ))}
                                    </ExtraCard>}

                                    {plan.apologyStrategy && <ExtraCard icon={<Target size={18} />} title="🕊️ Gönül Alma Stratejisi" color="#10B981" isOpen={showExtras.apology} toggle={() => toggleExtra('apology')}>
                                        <div style={{ fontSize: '0.88rem', marginBottom: 10 }}><strong>🎯 İlk Adım:</strong> {plan.apologyStrategy.openingMove}</div>
                                        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)', marginBottom: 10, fontStyle: 'italic', fontSize: '0.88rem', color: 'var(--text-primary)' }}>"{plan.apologyStrategy.keyPhrase}"</div>
                                        {plan.apologyStrategy.avoidList?.length > 0 && <div style={{ marginBottom: 8 }}><strong style={{ fontSize: '0.82rem', color: 'var(--error)' }}>🚫 Sakın Yapma:</strong>{plan.apologyStrategy.avoidList.map((a, i) => <div key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '2px 0 2px 16px' }}>• {a}</div>)}</div>}
                                    </ExtraCard>}

                                    {plan.groupChallenges?.length > 0 && <ExtraCard icon={<Trophy size={18} />} title="🏆 Grup Challenge" color="#8B5CF6" isOpen={showExtras.challenges} toggle={() => toggleExtra('challenges')}>
                                        {plan.groupChallenges.map((c, i) => (
                                            <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-secondary)', marginBottom: 8 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>🎯 {c.challenge}</div>
                                                <div style={{ fontSize: '0.78rem', color: '#8B5CF6', marginTop: 2 }}>🏆 {c.reward}</div>
                                            </div>
                                        ))}
                                    </ExtraCard>}

                                    {plan.selfCareChecklist?.length > 0 && <ExtraCard icon={<Heart size={18} />} title="🧘 Self-Care" color="#06B6D4" isOpen={showExtras.selfcare} toggle={() => toggleExtra('selfcare')}>
                                        {plan.selfCareChecklist.map((s, i) => <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: '0.85rem' }}><span>✅</span><span>{s}</span></div>)}
                                    </ExtraCard>}
                                </div>

                                {/* ── BOTTOM CARDS ── */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 12, marginBottom: 24 }}>
                                    {plan.whatToWear && (
                                        <div style={bottomCardStyle}>
                                            <div style={bottomCardTitle}><Shirt size={14} /> Kıyafet</div>
                                            <p style={bottomCardText}>{plan.whatToWear}</p>
                                        </div>
                                    )}
                                    {(plan.playlistVibe || plan.moodPlaylist) && (
                                        <div style={bottomCardStyle}>
                                            <div style={bottomCardTitle}><Music size={14} /> Müzik</div>
                                            <p style={bottomCardText}>{plan.playlistVibe || plan.moodPlaylist?.vibe}</p>
                                            {plan.moodPlaylist?.songs?.length > 0 && <div style={{ marginTop: 6 }}>{plan.moodPlaylist.songs.slice(0, 3).map((s, i) => <div key={i} style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>🎵 {s}</div>)}</div>}
                                        </div>
                                    )}
                                </div>

                                {/* ── GROUP SELECTOR + ACTION BUTTONS ── */}
                                <div style={{ padding: '14px', borderRadius: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border)', marginBottom: 8 }}>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Users size={14} /> Gruba Kaydet
                                    </div>
                                    {userSpaces.length > 0 ? (
                                        <select value={selectedSpaceId || ''} onChange={e => setSelectedSpaceId(e.target.value)}
                                            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 500 }}>
                                            {userSpaces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    ) : (
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                                                placeholder="Grup adı gir..."
                                                onKeyDown={e => e.key === 'Enter' && createGroupInline()}
                                                style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                                            <button onClick={createGroupInline} disabled={creatingGroup || !newGroupName.trim()}
                                                style={{ padding: '10px 16px', borderRadius: 10, background: scenario.gradient, border: 'none', color: 'white', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                                {creatingGroup ? <Loader2 size={14} className="spin" /> : '+ Oluştur'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    <button onClick={savePlan} disabled={saving || !!savedPlanId}
                                        style={{
                                            flex: '1 1 140px', padding: '14px', borderRadius: 14,
                                            background: savedPlanId ? '#10B981' : scenario.gradient,
                                            border: 'none', cursor: savedPlanId ? 'default' : 'pointer',
                                            fontWeight: 600, fontSize: '0.92rem', color: 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                            boxShadow: `0 4px 15px ${savedPlanId ? '#10B981' : scenario.color}30`,
                                            opacity: saving ? 0.6 : 1,
                                        }}>
                                        {saving ? <><Loader2 size={18} className="spin" /> Kaydediliyor...</> :
                                            savedPlanId ? <><Check size={18} /> Kaydedildi</> :
                                                <><Save size={18} /> Kaydet</>}
                                    </button>
                                    <button onClick={handlePrint}
                                        style={{ flex: '1 1 min(140px, 100%)', padding: '14px', borderRadius: 14, background: 'var(--bg-secondary)', border: '2px solid var(--border)', cursor: 'pointer', fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        <Printer size={18} /> Çıktı Al
                                    </button>
                                    <button onClick={resetAll}
                                        style={{ flex: '1 1 min(140px, 100%)', padding: '14px', borderRadius: 14, background: 'var(--bg-secondary)', border: '2px solid var(--border)', cursor: 'pointer', fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        <Zap size={18} /> Yeni Plan
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ SAVED PLANS ═══ */}
                        {savedPlans.length > 0 && (
                            <div style={{ marginTop: 40 }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <CalendarDays size={18} /> Kaydedilen SOS Planlarım
                                </h3>
                                <div style={{ display: 'grid', gap: 10 }}>
                                    {savedPlans.map(sp => {
                                        const sc = SCENARIOS.find(s => s.key === (sp.itinerary_data?._sosMetadata?.scenario || sp.tempo))
                                        if (!sc) return null
                                        return (
                                            <div key={sp.id} style={{
                                                display: 'flex', alignItems: 'center', gap: 12,
                                                padding: '14px 16px', borderRadius: 14,
                                                background: 'var(--bg-primary)', border: '1px solid var(--border)',
                                                cursor: 'pointer', transition: 'border-color 0.15s',
                                            }}
                                                onClick={() => loadSavedPlan(sp)}
                                                onMouseEnter={e => e.currentTarget.style.borderColor = sc.color}
                                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                            >
                                                <div style={{
                                                    width: 44, height: 44, borderRadius: 12,
                                                    background: sc.gradient,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '1.3rem', flexShrink: 0,
                                                }}>{sc.emoji}</div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                                                        {sp.itinerary_data?.planTitle || sc.title}
                                                    </div>
                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                                                        📍 {sp.city} · {new Date(sp.created_at).toLocaleDateString('tr-TR')}
                                                    </div>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); deleteSavedPlan(sp.id) }}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4 }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

// ═══ STYLES ═══
const pillBtnStyle = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '8px 16px', cursor: 'pointer',
    fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600,
}
const labelStyle = { display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.88rem', marginBottom: 8 }
const chipStyle = (active, color) => ({
    padding: '8px 14px', borderRadius: 10,
    border: active ? `2px solid ${color}` : '2px solid var(--border)',
    background: active ? `${color}15` : 'var(--bg-primary)',
    cursor: 'pointer', fontSize: '0.85rem',
    fontWeight: active ? 600 : 400,
    color: active ? color : 'var(--text-primary)',
    transition: 'all 0.15s ease',
})
const sectionTitle = { fontSize: '1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }
const bottomCardStyle = { padding: '14px', borderRadius: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }
const bottomCardTitle = { display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.82rem', marginBottom: 6 }
const bottomCardText = { fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }

// ═══ EXTRA CARD ═══
function ExtraCard({ icon, title, color, isOpen, toggle, children }) {
    return (
        <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
            <button onClick={toggle} style={{ width: '100%', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', textAlign: 'left' }}>
                <span style={{ color }}>{icon}</span>
                <span style={{ fontWeight: 700, fontSize: '0.92rem', flex: 1 }}>{title}</span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)', paddingTop: 12 }}>{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
