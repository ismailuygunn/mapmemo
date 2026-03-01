'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSpace } from '@/context/SpaceContext'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import Sidebar from '@/components/layout/Sidebar'
import {
    Gift, Lock, Unlock, Plus, X, Calendar, Image as ImageIcon, Loader2,
    Clock, Users, Vote, Upload, FileText, Film, Trash2, ChevronRight,
    ChevronLeft, Search, Check, AlertTriangle, Sparkles, Eye, Heart
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const CAPSULE_TYPES = [
    { key: 'memory', emoji: '📸', color: '#3B82F6' },
    { key: 'goal', emoji: '🎯', color: '#10B981' },
    { key: 'letter', emoji: '💌', color: '#F43F5E' },
    { key: 'surprise', emoji: '🎁', color: '#F59E0B' },
]

const COLOR_THEMES = [
    { key: 'navy', bg: 'linear-gradient(135deg, #0F2847, #1A3A5C)', accent: '#D4A853' },
    { key: 'gold', bg: 'linear-gradient(135deg, #92702B, #D4A853)', accent: '#0F2847' },
    { key: 'rose', bg: 'linear-gradient(135deg, #881337, #F43F5E)', accent: '#FFF' },
    { key: 'emerald', bg: 'linear-gradient(135deg, #064E3B, #10B981)', accent: '#FFF' },
    { key: 'purple', bg: 'linear-gradient(135deg, #581C87, #A855F7)', accent: '#FFF' },
    { key: 'sunset', bg: 'linear-gradient(135deg, #9A3412, #F97316, #FBBF24)', accent: '#FFF' },
]

export default function CapsulesPage() {
    const [capsules, setCapsules] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [wizardStep, setWizardStep] = useState(0)
    const [form, setForm] = useState({
        title: '', message: '', revealDate: '', revealTime: '12:00',
        capsuleType: 'memory', colorTheme: 'navy',
        allowEarlyVote: false, collaboratorIds: [], mediaFiles: [],
    })
    const [creating, setCreating] = useState(false)
    const [revealingId, setRevealingId] = useState(null)
    const [openedCapsule, setOpenedCapsule] = useState(null)
    const [selectedCapsule, setSelectedCapsule] = useState(null)
    const [userSearch, setUserSearch] = useState('')
    const [userResults, setUserResults] = useState([])
    const [selectedCollabs, setSelectedCollabs] = useState([])
    const [uploadingMedia, setUploadingMedia] = useState(false)
    const [mediaPreview, setMediaPreview] = useState([])
    const [confetti, setConfetti] = useState(false)
    const [countdown, setCountdown] = useState({})
    const fileInputRef = useRef(null)
    const { space, loading: spaceLoading } = useSpace()
    const { user } = useAuth()
    const { t } = useLanguage()
    const { toast } = useToast()
    const supabase = createClient()

    // ── Load capsules ──
    useEffect(() => {
        if (spaceLoading) return
        if (space || user) loadCapsules()
        else setLoading(false)
    }, [space, user, spaceLoading])

    // ── Live countdown timer ──
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date()
            const newCountdown = {}
            capsules.forEach(c => {
                if (c.is_revealed) return
                const revealDateTime = new Date(`${c.reveal_date}T${c.reveal_time || '00:00'}`)
                const diff = revealDateTime - now
                if (diff <= 0) {
                    newCountdown[c.id] = { days: 0, hours: 0, minutes: 0, seconds: 0, ready: true }
                } else {
                    newCountdown[c.id] = {
                        days: Math.floor(diff / 86400000),
                        hours: Math.floor((diff % 86400000) / 3600000),
                        minutes: Math.floor((diff % 3600000) / 60000),
                        seconds: Math.floor((diff % 60000) / 1000),
                        ready: false,
                    }
                }
            })
            setCountdown(newCountdown)
        }, 1000)
        return () => clearInterval(timer)
    }, [capsules])

    const loadCapsules = async () => {
        setLoading(true)
        try {
            let query = supabase.from('memory_capsules').select('*')
            if (space) {
                query = query.eq('space_id', space.id)
            } else if (user) {
                // Simple query first — collaborators column may not exist yet
                query = query.eq('created_by', user.id)
            } else { setLoading(false); return }
            const { data, error } = await query.order('reveal_date', { ascending: true })
            if (error) {
                console.warn('Capsules load error:', error.message)
                // If error mentions collaborators column, retry without it
                if (error.message?.includes('collaborators')) {
                    const { data: fallbackData } = await supabase
                        .from('memory_capsules').select('*')
                        .eq('created_by', user.id)
                        .order('reveal_date', { ascending: true })
                    if (fallbackData) setCapsules(fallbackData)
                }
            }
            if (data) setCapsules(data)
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    // ── Search users for collaborators ──
    const searchUsers = useCallback(async (q) => {
        if (q.length < 2) { setUserResults([]); return }
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, display_name, avatar_url')
            .or(`full_name.ilike.%${q}%,display_name.ilike.%${q}%`)
            .neq('id', user?.id)
            .limit(5)
        setUserResults(data || [])
    }, [user?.id])

    const addCollab = (profile) => {
        if (selectedCollabs.find(c => c.id === profile.id)) return
        setSelectedCollabs(prev => [...prev, profile])
        setForm(f => ({ ...f, collaboratorIds: [...f.collaboratorIds, profile.id] }))
        setUserSearch('')
        setUserResults([])
    }

    const removeCollab = (id) => {
        setSelectedCollabs(prev => prev.filter(c => c.id !== id))
        setForm(f => ({ ...f, collaboratorIds: f.collaboratorIds.filter(cid => cid !== id) }))
    }

    // ── Media upload handling ──
    const handleMediaSelect = (e) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return
        const newPreviews = files.map(f => ({
            file: f, name: f.name, type: f.type, size: f.size,
            preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
            isVideo: f.type.startsWith('video/'),
            isDoc: !f.type.startsWith('image/') && !f.type.startsWith('video/'),
        }))
        setMediaPreview(prev => [...prev, ...newPreviews])
    }

    const removeMedia = (index) => {
        setMediaPreview(prev => {
            const copy = [...prev]
            if (copy[index].preview) URL.revokeObjectURL(copy[index].preview)
            copy.splice(index, 1)
            return copy
        })
    }

    const handleDrop = (e) => {
        e.preventDefault()
        const files = Array.from(e.dataTransfer.files)
        if (files.length > 0) {
            const input = fileInputRef.current
            const dt = new DataTransfer()
            files.forEach(f => dt.items.add(f))
            input.files = dt.files
            handleMediaSelect({ target: input })
        }
    }

    // ── Upload media to Supabase Storage (uses existing 'pin-media' bucket) ──
    const uploadMediaFiles = async () => {
        if (mediaPreview.length === 0) return []
        setUploadingMedia(true)
        const urls = []
        let failCount = 0
        for (const item of mediaPreview) {
            try {
                const ext = item.name.split('.').pop()
                const path = `capsules/${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
                const { error } = await supabase.storage.from('pin-media').upload(path, item.file, {
                    cacheControl: '3600',
                    upsert: false,
                })
                if (error) {
                    console.error('Upload error:', error.message)
                    toast.error(`Yüklenemedi: ${item.name} — ${error.message}`)
                    failCount++
                } else {
                    const { data: { publicUrl } } = supabase.storage.from('pin-media').getPublicUrl(path)
                    urls.push(publicUrl)
                }
            } catch (err) {
                console.error('Upload exception:', err)
                toast.error(`Yüklenemedi: ${item.name}`)
                failCount++
            }
        }
        if (urls.length > 0 && failCount === 0) {
            toast.success(`${urls.length} dosya yüklendi ✅`)
        }
        setUploadingMedia(false)
        return urls
    }

    // ── Create capsule (graceful fallback if new columns don't exist yet) ──
    const createCapsule = async () => {
        if (!form.title || !form.revealDate) return
        setCreating(true)
        try {
            const mediaUrls = await uploadMediaFiles()
            const fullPayload = {
                space_id: space?.id || null,
                created_by: user.id,
                title: form.title,
                message: form.message,
                reveal_date: form.revealDate,
                reveal_time: form.revealTime || '12:00',
                capsule_type: form.capsuleType,
                color_theme: form.colorTheme,
                allow_early_vote: form.allowEarlyVote,
                collaborators: form.collaboratorIds,
                media_urls: mediaUrls,
            }
            let { data, error } = await supabase
                .from('memory_capsules').insert(fullPayload).select().single()

            // Fallback: if new columns don't exist yet, use basic columns only
            if (error && error.message?.includes('schema cache')) {
                const basicPayload = {
                    space_id: space?.id || null,
                    created_by: user.id,
                    title: form.title,
                    message: form.message,
                    reveal_date: form.revealDate,
                    media_urls: mediaUrls,
                }
                const result = await supabase
                    .from('memory_capsules').insert(basicPayload).select().single()
                data = result.data
                error = result.error
                if (!error) toast.info('💡 Migration çalıştırın — gelişmiş özellikler için')
            }

            if (!error && data) {
                setCapsules(prev => [...prev, data].sort((a, b) => new Date(a.reveal_date) - new Date(b.reveal_date)))
                resetForm()
                toast.success(t('capsule.sealed') + ' 🔒')
            } else if (error) toast.error(error.message)
        } catch (err) { toast.error(err.message) }
        setCreating(false)
    }

    const resetForm = () => {
        setForm({ title: '', message: '', revealDate: '', revealTime: '12:00', capsuleType: 'memory', colorTheme: 'navy', allowEarlyVote: false, collaboratorIds: [], mediaFiles: [] })
        setMediaPreview([])
        setSelectedCollabs([])
        setWizardStep(0)
        setShowCreate(false)
    }

    // ── Vote for early opening ──
    const voteEarlyOpen = async (capsule, vote) => {
        const currentVotes = capsule.early_votes || {}
        currentVotes[user.id] = vote
        const allCollabs = [capsule.created_by, ...(capsule.collaborators || [])]
        const allVotedYes = allCollabs.every(id => currentVotes[id] === true)

        if (allVotedYes) {
            await supabase.from('memory_capsules')
                .update({ early_votes: currentVotes, is_revealed: true, revealed_at: new Date().toISOString() })
                .eq('id', capsule.id)
            setConfetti(true)
            setTimeout(() => setConfetti(false), 3000)
            toast.success(t('capsule.allVoted') + ' 🎉')
        } else {
            await supabase.from('memory_capsules')
                .update({ early_votes: currentVotes })
                .eq('id', capsule.id)
            toast.success(t('capsule.youVoted') + (vote ? ' ✅' : ' ⏳'))
        }
        await loadCapsules()
    }

    // ── Reveal capsule ──
    const revealCapsule = async (capsule) => {
        setRevealingId(capsule.id)
        await supabase.from('memory_capsules')
            .update({ is_revealed: true, revealed_at: new Date().toISOString() })
            .eq('id', capsule.id)
        setConfetti(true)
        setTimeout(() => setConfetti(false), 3000)
        await loadCapsules()
        setRevealingId(null)
        // Open detail modal with fresh data from DB
        const freshCapsule = capsules.find(c => c.id === capsule.id) || capsule
        setSelectedCapsule({ ...freshCapsule, is_revealed: true, revealed_at: new Date().toISOString() })
        toast.success(t('capsule.readyToOpen'))
    }

    const deleteCapsule = async (id) => {
        if (!confirm(t('capsule.deleteConfirm'))) return
        await supabase.from('memory_capsules').delete().eq('id', id)
        setCapsules(prev => prev.filter(c => c.id !== id))
        toast.success('🗑️')
    }

    const today = new Date().toISOString().split('T')[0]
    const canReveal = (c) => {
        const revealDT = new Date(`${c.reveal_date}T${c.reveal_time || '00:00'}`)
        return revealDT <= new Date() && !c.is_revealed
    }
    const isLocked = (c) => {
        const revealDT = new Date(`${c.reveal_date}T${c.reveal_time || '00:00'}`)
        return revealDT > new Date() && !c.is_revealed
    }

    const getTheme = (key) => COLOR_THEMES.find(t => t.key === key) || COLOR_THEMES[0]
    const getType = (key) => CAPSULE_TYPES.find(t => t.key === key) || CAPSULE_TYPES[0]

    const getVoteProgress = (capsule) => {
        const votes = capsule.early_votes || {}
        const allCollabs = [capsule.created_by, ...(capsule.collaborators || [])]
        const yesCount = allCollabs.filter(id => votes[id] === true).length
        return { yesCount, total: allCollabs.length, percent: (yesCount / allCollabs.length) * 100 }
    }

    // ═══════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════
    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="page">
                    {/* ═══ PREMIUM HERO ═══ */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                            borderRadius: 24, overflow: 'hidden', marginBottom: 24,
                            position: 'relative', minHeight: 160,
                            background: 'linear-gradient(135deg, #0F2847 0%, #1A3A5C 50%, #D4A853 100%)',
                        }}>
                        <motion.span animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 4 }}
                            style={{ position: 'absolute', top: 20, right: 40, fontSize: '2.5rem', opacity: 0.25 }}>🔮</motion.span>
                        <motion.span animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
                            style={{ position: 'absolute', bottom: 15, right: 120, fontSize: '1.6rem', opacity: 0.15 }}>✨</motion.span>
                        <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 5 }}
                            style={{ position: 'absolute', top: 30, right: 180, fontSize: '1.4rem', opacity: 0.12 }}>💊</motion.span>
                        <div style={{
                            position: 'relative', zIndex: 1,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '24px 32px', flexWrap: 'wrap', gap: 12,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <Image src="/umae-icon.png" alt="UMAE" width={40} height={40} style={{ borderRadius: 10 }} />
                                <div>
                                    <h1 style={{ color: 'white', fontSize: '1.6rem', fontWeight: 900, margin: 0 }}>
                                        🔮 {t('capsule.title')}
                                    </h1>
                                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                                        {t('capsule.subtitle')}
                                    </p>
                                </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => { setShowCreate(!showCreate); setWizardStep(0) }}
                                style={{
                                    padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                    background: showCreate ? 'rgba(255,255,255,0.1)' : 'rgba(212,168,83,0.9)',
                                    color: 'white', fontSize: '0.85rem', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                {showCreate ? <><X size={16} /> {t('general.cancel')}</> : <><Plus size={16} /> {t('capsule.create')}</>}
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* ═══ CONFETTI OVERLAY ═══ */}
                    <AnimatePresence>
                        {confetti && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {Array.from({ length: 50 }).map((_, i) => (
                                    <motion.span key={i}
                                        initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                                        animate={{
                                            x: (Math.random() - 0.5) * 600,
                                            y: (Math.random() - 0.5) * 600,
                                            opacity: 0, scale: Math.random() * 2,
                                            rotate: Math.random() * 720,
                                        }}
                                        transition={{ duration: 2 + Math.random(), ease: 'easeOut' }}
                                        style={{ position: 'absolute', fontSize: `${0.8 + Math.random()}rem` }}>
                                        {['🎉', '✨', '🎊', '💫', '⭐', '🌟', '🔮'][i % 7]}
                                    </motion.span>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ═══ CREATE WIZARD ═══ */}
                    <AnimatePresence>
                        {showCreate && (
                            <motion.div initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -20, height: 0 }} transition={{ duration: 0.3 }}
                                style={{
                                    background: 'var(--bg-secondary)', borderRadius: 20,
                                    border: '1px solid var(--border-primary)', marginBottom: 24,
                                    overflow: 'hidden',
                                }}>
                                {/* Wizard Steps Header */}
                                <div style={{
                                    display: 'flex', borderBottom: '1px solid var(--border-primary)',
                                    background: 'var(--bg-tertiary)',
                                }}>
                                    {[t('capsule.step1'), t('capsule.step2'), t('capsule.step3')].map((label, i) => (
                                        <button key={i} onClick={() => setWizardStep(i)}
                                            style={{
                                                flex: 1, padding: '14px 12px', border: 'none', cursor: 'pointer',
                                                background: wizardStep === i ? 'var(--bg-secondary)' : 'transparent',
                                                color: wizardStep === i ? 'var(--primary-1)' : 'var(--text-tertiary)',
                                                fontWeight: wizardStep === i ? 700 : 400,
                                                fontSize: '0.8rem', transition: 'all 0.2s',
                                                borderBottom: wizardStep === i ? '2px solid var(--primary-1)' : '2px solid transparent',
                                            }}>
                                            <span style={{ marginRight: 6 }}>{i < wizardStep ? '✓' : `${i + 1}`}</span>
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ padding: '20px 24px' }}>
                                    <AnimatePresence mode="wait">
                                        {/* STEP 0: Type + Content */}
                                        {wizardStep === 0 && (
                                            <motion.div key="s0" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
                                                    {t('capsule.type')}
                                                </label>
                                                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                                                    {CAPSULE_TYPES.map(ct => (
                                                        <motion.button key={ct.key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                            onClick={() => setForm(f => ({ ...f, capsuleType: ct.key }))}
                                                            style={{
                                                                padding: '10px 16px', borderRadius: 12, border: '2px solid',
                                                                borderColor: form.capsuleType === ct.key ? ct.color : 'var(--border-primary)',
                                                                background: form.capsuleType === ct.key ? `${ct.color}15` : 'var(--bg-tertiary)',
                                                                cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                                                                color: form.capsuleType === ct.key ? ct.color : 'var(--text-secondary)',
                                                                display: 'flex', alignItems: 'center', gap: 6,
                                                            }}>
                                                            <span style={{ fontSize: '1.1rem' }}>{ct.emoji}</span>
                                                            {t(`capsule.type${ct.key.charAt(0).toUpperCase() + ct.key.slice(1)}`)}
                                                        </motion.button>
                                                    ))}
                                                </div>
                                                <div style={{ marginBottom: 14 }}>
                                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                                                        {t('capsule.titleLabel')} *
                                                    </label>
                                                    <input type="text" className="input" placeholder={t('capsule.titlePlaceholder')}
                                                        value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                                                        {t('capsule.message')}
                                                    </label>
                                                    <textarea className="input" rows={4} placeholder={t('capsule.messagePlaceholder')}
                                                        value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                                        style={{ resize: 'vertical' }} />
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* STEP 1: Media */}
                                        {wizardStep === 1 && (
                                            <motion.div key="s1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
                                                    {t('capsule.media')}
                                                </label>
                                                <div
                                                    onDragOver={e => e.preventDefault()}
                                                    onDrop={handleDrop}
                                                    onClick={() => fileInputRef.current?.click()}
                                                    style={{
                                                        border: '2px dashed var(--border-primary)', borderRadius: 16,
                                                        padding: '32px 24px', textAlign: 'center', cursor: 'pointer',
                                                        background: 'var(--bg-tertiary)', transition: 'all 0.2s',
                                                        marginBottom: 16,
                                                    }}>
                                                    <Upload size={32} style={{ color: 'var(--primary-1)', marginBottom: 8 }} />
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, margin: '4px 0' }}>
                                                        {t('capsule.mediaHint')}
                                                    </p>
                                                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>
                                                        {t('capsule.mediaTypes')}
                                                    </p>
                                                </div>
                                                <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx"
                                                    onChange={handleMediaSelect} style={{ display: 'none' }} />

                                                {mediaPreview.length > 0 && (
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                                                        {mediaPreview.map((item, i) => (
                                                            <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                                style={{
                                                                    position: 'relative', borderRadius: 12, overflow: 'hidden',
                                                                    aspectRatio: '1', background: 'var(--bg-tertiary)',
                                                                    border: '1px solid var(--border-primary)',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                }}>
                                                                {item.preview ? (
                                                                    <img src={item.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                ) : item.isVideo ? (
                                                                    <Film size={28} style={{ color: 'var(--primary-1)' }} />
                                                                ) : (
                                                                    <FileText size={28} style={{ color: 'var(--text-tertiary)' }} />
                                                                )}
                                                                <button onClick={(e) => { e.stopPropagation(); removeMedia(i) }}
                                                                    style={{
                                                                        position: 'absolute', top: 4, right: 4, width: 22, height: 22,
                                                                        borderRadius: '50%', border: 'none', cursor: 'pointer',
                                                                        background: 'rgba(0,0,0,0.6)', color: 'white',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    }}>
                                                                    <X size={12} />
                                                                </button>
                                                                <span style={{
                                                                    position: 'absolute', bottom: 2, left: 0, right: 0,
                                                                    fontSize: '0.55rem', color: 'white', textAlign: 'center',
                                                                    background: 'rgba(0,0,0,0.5)', padding: '2px 4px',
                                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                                }}>{item.name}</span>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}

                                        {/* STEP 2: Settings */}
                                        {wizardStep === 2 && (
                                            <motion.div key="s2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                                                {/* Date + Time */}
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(130px, 100%), 1fr))', gap: 12, marginBottom: 16 }}>
                                                    <div>
                                                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                                                            📅 {t('capsule.revealDate')} *
                                                        </label>
                                                        <input type="date" className="input" min={today}
                                                            value={form.revealDate} onChange={e => setForm(f => ({ ...f, revealDate: e.target.value }))} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                                                            🕐 {t('capsule.revealTime')}
                                                        </label>
                                                        <input type="time" className="input"
                                                            value={form.revealTime} onChange={e => setForm(f => ({ ...f, revealTime: e.target.value }))} />
                                                    </div>
                                                </div>

                                                {/* Color Theme */}
                                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
                                                    🎨 {t('capsule.colorTheme')}
                                                </label>
                                                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                                                    {COLOR_THEMES.map(ct => (
                                                        <button key={ct.key} onClick={() => setForm(f => ({ ...f, colorTheme: ct.key }))}
                                                            style={{
                                                                width: 36, height: 36, borderRadius: 10, border: '3px solid',
                                                                borderColor: form.colorTheme === ct.key ? 'white' : 'transparent',
                                                                background: ct.bg, cursor: 'pointer',
                                                                boxShadow: form.colorTheme === ct.key ? '0 0 0 2px var(--primary-1)' : 'none',
                                                            }} />
                                                    ))}
                                                </div>

                                                {/* Collaborators */}
                                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                                                    👥 {t('capsule.collaborators')}
                                                </label>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                                                    {t('capsule.collaboratorsHint')}
                                                </p>
                                                {selectedCollabs.length > 0 && (
                                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                                                        {selectedCollabs.map(c => (
                                                            <span key={c.id} style={{
                                                                display: 'flex', alignItems: 'center', gap: 6,
                                                                padding: '4px 10px', borderRadius: 20,
                                                                background: 'var(--primary-1)', color: 'white', fontSize: '0.75rem', fontWeight: 600,
                                                            }}>
                                                                {c.display_name || c.full_name}
                                                                <button onClick={() => removeCollab(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', padding: 0 }}>
                                                                    <X size={12} />
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                <div style={{ position: 'relative', marginBottom: 16 }}>
                                                    <input type="text" className="input" placeholder={t('capsule.searchUsers')}
                                                        value={userSearch} onChange={e => { setUserSearch(e.target.value); searchUsers(e.target.value) }} />
                                                    {userResults.length > 0 && (
                                                        <div style={{
                                                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                                                            background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
                                                            borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', marginTop: 4,
                                                        }}>
                                                            {userResults.map(u => (
                                                                <button key={u.id} onClick={() => addCollab(u)}
                                                                    style={{
                                                                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                                                                        padding: '10px 12px', border: 'none', background: 'transparent',
                                                                        cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.82rem',
                                                                    }}>
                                                                    <div style={{
                                                                        width: 28, height: 28, borderRadius: '50%',
                                                                        background: 'linear-gradient(135deg, #0F2847, #1A3A5C)',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        color: 'white', fontWeight: 800, fontSize: '0.6rem',
                                                                    }}>{(u.display_name || u.full_name || '?')[0]}</div>
                                                                    {u.display_name || u.full_name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Early Vote Toggle */}
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    padding: '12px 16px', borderRadius: 12,
                                                    background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)',
                                                }}>
                                                    <div>
                                                        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                                            🗳️ {t('capsule.allowEarlyVote')}
                                                        </p>
                                                        <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                                                            {t('capsule.allowEarlyVoteHint')}
                                                        </p>
                                                    </div>
                                                    <button onClick={() => setForm(f => ({ ...f, allowEarlyVote: !f.allowEarlyVote }))}
                                                        style={{
                                                            width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                                                            background: form.allowEarlyVote ? '#10B981' : 'var(--border-primary)',
                                                            position: 'relative', transition: 'background 0.2s',
                                                        }}>
                                                        <div style={{
                                                            width: 20, height: 20, borderRadius: '50%', background: 'white',
                                                            position: 'absolute', top: 2,
                                                            left: form.allowEarlyVote ? 22 : 2, transition: 'left 0.2s',
                                                        }} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Wizard Navigation */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, gap: 12 }}>
                                        {wizardStep > 0 ? (
                                            <button className="btn btn-ghost" onClick={() => setWizardStep(s => s - 1)}>
                                                <ChevronLeft size={16} /> {t('capsule.back')}
                                            </button>
                                        ) : <div />}
                                        {wizardStep < 2 ? (
                                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                                className="btn btn-primary" onClick={() => setWizardStep(s => s + 1)}
                                                disabled={wizardStep === 0 && !form.title}>
                                                {t('capsule.next')} <ChevronRight size={16} />
                                            </motion.button>
                                        ) : (
                                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                                className="btn btn-primary" onClick={createCapsule}
                                                disabled={creating || !form.revealDate}
                                                style={{ background: 'linear-gradient(135deg, #0F2847, #D4A853)' }}>
                                                {creating ? <><Loader2 size={16} className="spin" /> {t('capsule.revealing')}</>
                                                    : <><Gift size={16} /> {t('capsule.createBtn')}</>}
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ═══ CAPSULES LIST ═══ */}
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
                            <Loader2 size={32} className="spin" style={{ color: 'var(--primary-1)' }} />
                        </div>
                    ) : capsules.length === 0 ? (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            style={{
                                textAlign: 'center', padding: '64px 24px',
                                background: 'var(--bg-secondary)', borderRadius: 24,
                                border: '1px solid var(--border-primary)',
                            }}>
                            <motion.div animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 3 }}
                                style={{ fontSize: '3.5rem', marginBottom: 16 }}>🔮</motion.div>
                            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px' }}>
                                {t('capsule.empty')}
                            </h3>
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: 20 }}>
                                {t('capsule.emptyDesc')}
                            </p>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                className="btn btn-primary" onClick={() => setShowCreate(true)}
                                style={{ background: 'linear-gradient(135deg, #0F2847, #D4A853)' }}>
                                <Plus size={16} /> {t('capsule.create')}
                            </motion.button>
                        </motion.div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: 16 }}>
                            {capsules.map((capsule, i) => {
                                const theme = getTheme(capsule.color_theme)
                                const type = getType(capsule.capsule_type)
                                const cd = countdown[capsule.id] || {}
                                const voteInfo = getVoteProgress(capsule)
                                const hasCollabs = (capsule.collaborators || []).length > 0
                                const userVote = capsule.early_votes?.[user?.id]
                                const isRevealed = capsule.is_revealed
                                const ready = canReveal(capsule)
                                const locked = isLocked(capsule)

                                return (
                                    <motion.div key={capsule.id}
                                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.3)' }}
                                        onClick={() => isRevealed && setSelectedCapsule(capsule)}
                                        style={{
                                            borderRadius: 20, overflow: 'hidden',
                                            border: '1px solid var(--border-primary)',
                                            background: 'var(--bg-secondary)',
                                            transition: 'all 0.3s ease',
                                            cursor: isRevealed ? 'pointer' : 'default',
                                        }}>
                                        {/* Card Header — Gradient */}
                                        <div style={{
                                            background: theme.bg, padding: '20px 20px 16px',
                                            position: 'relative', overflow: 'hidden',
                                        }}>
                                            {locked && (
                                                <motion.div animate={{ rotate: [0, 3, -3, 0] }}
                                                    transition={{ repeat: Infinity, duration: 4 }}
                                                    style={{ position: 'absolute', top: 12, right: 14 }}>
                                                    <Lock size={20} style={{ color: 'rgba(255,255,255,0.3)' }} />
                                                </motion.div>
                                            )}
                                            {ready && (
                                                <motion.div animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                                    style={{ position: 'absolute', top: 12, right: 14 }}>
                                                    <Sparkles size={20} style={{ color: '#FBBF24' }} />
                                                </motion.div>
                                            )}
                                            {isRevealed && (
                                                <div style={{ position: 'absolute', top: 12, right: 14 }}>
                                                    <Unlock size={20} style={{ color: 'rgba(255,255,255,0.4)' }} />
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                <span style={{ fontSize: '1.4rem' }}>{type.emoji}</span>
                                                <span style={{
                                                    fontSize: '0.65rem', fontWeight: 700, color: theme.accent,
                                                    textTransform: 'uppercase', letterSpacing: 1,
                                                }}>{t(`capsule.type${type.key.charAt(0).toUpperCase() + type.key.slice(1)}`)}</span>
                                            </div>
                                            <h3 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
                                                {isRevealed ? capsule.title : `🔒 ${capsule.title}`}
                                            </h3>

                                            {/* Collaborator avatars */}
                                            {hasCollabs && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                                                    <Users size={12} style={{ color: 'rgba(255,255,255,0.5)' }} />
                                                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>
                                                        +{capsule.collaborators.length} {t('capsule.others')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Body */}
                                        <div style={{ padding: '16px 20px' }}>
                                            {/* Countdown */}
                                            {locked && (
                                                <div style={{
                                                    display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 14,
                                                }}>
                                                    {[
                                                        { val: cd.days, label: t('capsule.daysLeft').split(' ')[0] || 'G' },
                                                        { val: cd.hours, label: t('capsule.hoursLeft').split(' ')[0] || 'S' },
                                                        { val: cd.minutes, label: t('capsule.minutesLeft').split(' ')[0] || 'D' },
                                                        { val: cd.seconds, label: 'sn' },
                                                    ].map((u, j) => (
                                                        <div key={j} style={{
                                                            textAlign: 'center', minWidth: 48,
                                                            padding: '8px 4px', borderRadius: 10,
                                                            background: 'var(--bg-tertiary)',
                                                        }}>
                                                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary-1)' }}>
                                                                {String(u.val || 0).padStart(2, '0')}
                                                            </div>
                                                            <div style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                                                                {u.label}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Revealed content */}
                                            {isRevealed && capsule.message && (
                                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                                                    style={{
                                                        fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6,
                                                        marginBottom: 12, padding: '12px', borderRadius: 12,
                                                        background: 'var(--bg-tertiary)', fontStyle: 'italic',
                                                    }}>
                                                    "{capsule.message}"
                                                </motion.p>
                                            )}

                                            {/* Revealed media */}
                                            {isRevealed && capsule.media_urls?.length > 0 && (
                                                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(capsule.media_urls.length, 3)}, 1fr)`, gap: 6, marginBottom: 12 }}>
                                                    {capsule.media_urls.map((url, mi) => (
                                                        <a key={mi} href={url} target="_blank" rel="noreferrer"
                                                            style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '1' }}>
                                                            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        </a>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Date info */}
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 12,
                                            }}>
                                                <Calendar size={13} />
                                                {isRevealed ? (
                                                    <span>{t('capsule.openedOn')} {new Date(capsule.revealed_at).toLocaleDateString()}</span>
                                                ) : ready ? (
                                                    <span style={{ color: '#10B981', fontWeight: 700 }}>{t('capsule.readyToOpen')}</span>
                                                ) : (
                                                    <span>{new Date(capsule.reveal_date).toLocaleDateString()} · {capsule.reveal_time || '00:00'}</span>
                                                )}
                                            </div>

                                            {/* Early Vote Section — show when capsule is locked and early vote is allowed */}
                                            {locked && capsule.allow_early_vote === true && (
                                                <div style={{
                                                    padding: '12px', borderRadius: 12,
                                                    background: 'var(--bg-tertiary)', marginBottom: 12,
                                                    border: '1px solid var(--border-primary)',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                                        <Vote size={14} style={{ color: 'var(--primary-1)' }} />
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                            {t('capsule.voteToOpen')}
                                                        </span>
                                                    </div>
                                                    {/* Vote progress bar */}
                                                    <div style={{
                                                        height: 6, borderRadius: 3, background: 'var(--border-primary)',
                                                        marginBottom: 8, overflow: 'hidden',
                                                    }}>
                                                        <motion.div animate={{ width: `${voteInfo.percent}%` }}
                                                            style={{
                                                                height: '100%', borderRadius: 3,
                                                                background: 'linear-gradient(90deg, #10B981, #D4A853)',
                                                            }} />
                                                    </div>
                                                    <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', margin: '0 0 8px' }}>
                                                        {voteInfo.yesCount}/{voteInfo.total} {t('capsule.votesNeeded')}
                                                    </p>
                                                    {userVote === undefined && (
                                                        <div style={{ display: 'flex', gap: 6 }}>
                                                            <button onClick={(e) => { e.stopPropagation(); voteEarlyOpen(capsule, true) }}
                                                                style={{
                                                                    flex: 1, padding: '6px', borderRadius: 8, border: 'none',
                                                                    background: '#10B981', color: 'white', fontSize: '0.72rem',
                                                                    fontWeight: 700, cursor: 'pointer',
                                                                }}>
                                                                ✅ {t('capsule.voteYes')}
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); voteEarlyOpen(capsule, false) }}
                                                                style={{
                                                                    flex: 1, padding: '6px', borderRadius: 8, border: '1px solid var(--border-primary)',
                                                                    background: 'transparent', color: 'var(--text-tertiary)', fontSize: '0.72rem',
                                                                    fontWeight: 600, cursor: 'pointer',
                                                                }}>
                                                                ⏳ {t('capsule.voteNo')}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {userVote !== undefined && (
                                                        <p style={{ fontSize: '0.7rem', color: userVote ? '#10B981' : 'var(--text-tertiary)', fontWeight: 600 }}>
                                                            {t('capsule.youVoted')}: {userVote ? '✅' : '⏳'}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* No early vote notice — only when explicitly disabled and has collaborators */}
                                            {locked && capsule.allow_early_vote === false && hasCollabs && (
                                                <p style={{
                                                    fontSize: '0.68rem', color: 'var(--text-tertiary)',
                                                    display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12,
                                                }}>
                                                    <AlertTriangle size={12} /> {t('capsule.noEarlyVote')}
                                                </p>
                                            )}

                                            {/* Actions */}
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                {ready && (
                                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                        onClick={(e) => { e.stopPropagation(); revealCapsule(capsule) }}
                                                        disabled={revealingId === capsule.id}
                                                        style={{
                                                            flex: 1, padding: '10px', borderRadius: 12, border: 'none',
                                                            background: 'linear-gradient(135deg, #0F2847, #D4A853)',
                                                            color: 'white', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                        }}>
                                                        {revealingId === capsule.id ? <Loader2 size={16} className="spin" /> : <Gift size={16} />}
                                                        {t('capsule.open')}
                                                    </motion.button>
                                                )}
                                                {isRevealed && (
                                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                        onClick={(e) => { e.stopPropagation(); setSelectedCapsule(capsule) }}
                                                        style={{
                                                            flex: 1, padding: '10px', borderRadius: 12, border: 'none',
                                                            background: 'linear-gradient(135deg, #0F2847, #1A3A5C)',
                                                            color: 'white', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                                        }}>
                                                        <Eye size={16} /> {t('capsule.open')}
                                                    </motion.button>
                                                )}
                                                {capsule.created_by === user?.id && (
                                                    <button onClick={(e) => { e.stopPropagation(); deleteCapsule(capsule.id) }}
                                                        style={{
                                                            padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border-primary)',
                                                            background: 'transparent', cursor: 'pointer',
                                                            color: 'var(--accent-red)', fontSize: '0.78rem',
                                                        }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}

                    {/* ═══ DETAIL MODAL ═══ */}
                    <AnimatePresence>
                        {selectedCapsule && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setSelectedCapsule(null)}
                                style={{
                                    position: 'fixed', inset: 0, zIndex: 9000,
                                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: 20,
                                }}>
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0, y: 40 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.8, opacity: 0, y: 40 }}
                                    transition={{ type: 'spring', damping: 20 }}
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                        width: '100%', maxWidth: 'min(540px, 95vw)', maxHeight: '85vh', overflow: 'auto',
                                        borderRadius: 24, background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-primary)',
                                        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                                    }}>
                                    {/* Modal Header with gradient */}
                                    <div style={{
                                        background: (getTheme(selectedCapsule.color_theme)).bg,
                                        padding: '28px 24px 20px', position: 'relative',
                                    }}>
                                        <button onClick={() => setSelectedCapsule(null)}
                                            style={{
                                                position: 'absolute', top: 12, right: 12,
                                                width: 32, height: 32, borderRadius: '50%',
                                                background: 'rgba(255,255,255,0.15)', border: 'none',
                                                color: 'white', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}><X size={16} /></button>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                            <span style={{ fontSize: '2rem' }}>
                                                {(getType(selectedCapsule.capsule_type)).emoji}
                                            </span>
                                            <div>
                                                <span style={{
                                                    fontSize: '0.6rem', fontWeight: 700,
                                                    color: (getTheme(selectedCapsule.color_theme)).accent,
                                                    textTransform: 'uppercase', letterSpacing: 1,
                                                }}>
                                                    {t(`capsule.type${(getType(selectedCapsule.capsule_type)).key.charAt(0).toUpperCase() + (getType(selectedCapsule.capsule_type)).key.slice(1)}`)}
                                                </span>
                                                <h2 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 900, margin: '2px 0 0' }}>
                                                    {selectedCapsule.title}
                                                </h2>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
                                            <Calendar size={12} />
                                            <span>{t('capsule.openedOn')} {selectedCapsule.revealed_at ? new Date(selectedCapsule.revealed_at).toLocaleDateString() : '-'}</span>
                                        </div>
                                    </div>

                                    {/* Modal Body */}
                                    <div style={{ padding: '20px 24px' }}>
                                        {/* Message */}
                                        {selectedCapsule.message && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                                                style={{
                                                    padding: '16px 20px', borderRadius: 16, marginBottom: 16,
                                                    background: 'var(--bg-tertiary)',
                                                    border: '1px solid var(--border-primary)',
                                                }}>
                                                <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6 }}>
                                                    💬 {t('capsule.message')}
                                                </p>
                                                <p style={{
                                                    fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.7,
                                                    whiteSpace: 'pre-wrap', margin: 0,
                                                }}>
                                                    {selectedCapsule.message}
                                                </p>
                                            </motion.div>
                                        )}

                                        {/* Media Gallery */}
                                        {selectedCapsule.media_urls?.length > 0 && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                                                <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 8 }}>
                                                    📎 {t('capsule.media')} ({selectedCapsule.media_urls.length})
                                                </p>
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: selectedCapsule.media_urls.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                                                    gap: 8, marginBottom: 16,
                                                }}>
                                                    {selectedCapsule.media_urls.map((url, mi) => (
                                                        <motion.a key={mi} href={url} target="_blank" rel="noreferrer"
                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            transition={{ delay: 0.5 + mi * 0.1 }}
                                                            style={{
                                                                borderRadius: 14, overflow: 'hidden',
                                                                aspectRatio: selectedCapsule.media_urls.length === 1 ? '16/9' : '1',
                                                                display: 'block',
                                                            }}>
                                                            {url.match(/\.(mp4|webm|mov)$/i) ? (
                                                                <video src={url} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            )}
                                                        </motion.a>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* No content message */}
                                        {!selectedCapsule.message && (!selectedCapsule.media_urls || selectedCapsule.media_urls.length === 0) && (
                                            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                                                <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}
                                                    style={{ fontSize: '3rem', marginBottom: 12 }}>🔮</motion.div>
                                                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                                                    {t('capsule.emptyDesc')}
                                                </p>
                                            </div>
                                        )}

                                        {/* Close button */}
                                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                            onClick={() => setSelectedCapsule(null)}
                                            style={{
                                                width: '100%', padding: '12px', borderRadius: 12,
                                                border: '1px solid var(--border-primary)',
                                                background: 'transparent', cursor: 'pointer',
                                                color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600,
                                            }}>
                                            {t('general.close')}
                                        </motion.button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    )
}
