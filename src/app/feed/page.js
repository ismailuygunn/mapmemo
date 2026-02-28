'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { getAuthHeaders } from '@/lib/authHeaders'
import Sidebar from '@/components/layout/Sidebar'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Heart, MessageCircle, MapPin, Plus, X, Send, Camera, Star,
    Clock, ChevronRight, Loader2, Coffee, UtensilsCrossed, Landmark,
    TreePine, Wine, Hotel, Navigation, Sparkles, Share2, Bookmark,
    ThumbsUp, Flame, Laugh, Frown
} from 'lucide-react'

const CATEGORIES = [
    { key: 'cafe', emoji: '☕', label: 'Kafe', icon: Coffee },
    { key: 'restaurant', emoji: '🍽️', label: 'Restoran', icon: UtensilsCrossed },
    { key: 'museum', emoji: '🏛️', label: 'Müze', icon: Landmark },
    { key: 'park', emoji: '🌳', label: 'Park', icon: TreePine },
    { key: 'bar', emoji: '🍷', label: 'Bar', icon: Wine },
    { key: 'hotel', emoji: '🏨', label: 'Otel', icon: Hotel },
    { key: 'landmark', emoji: '📸', label: 'Gezi Noktası', icon: Navigation },
    { key: 'other', emoji: '📍', label: 'Diğer', icon: MapPin },
]

const STORY_REACTIONS = ['❤️', '🔥', '😍', '👏', '🥰', '😮']
const STORY_DURATION = 5000 // 5 seconds per story

const timeAgo = (date) => {
    const now = new Date()
    const d = new Date(date)
    const diff = Math.floor((now - d) / 1000)
    if (diff < 60) return 'az önce'
    if (diff < 3600) return `${Math.floor(diff / 60)} dk`
    if (diff < 86400) return `${Math.floor(diff / 3600)} sa`
    if (diff < 604800) return `${Math.floor(diff / 86400)} gün`
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

export default function FeedPage() {
    const [feed, setFeed] = useState([])
    const [storyGroups, setStoryGroups] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCheckin, setShowCheckin] = useState(false)
    const [checkinData, setCheckinData] = useState({ placeName: '', city: '', note: '', emoji: '📍', category: 'other', rating: 0 })
    const [submitting, setSubmitting] = useState(false)
    const [activeStory, setActiveStory] = useState(null)
    const [liking, setLiking] = useState({})
    const [storyProgress, setStoryProgress] = useState(0)
    const [showReactions, setShowReactions] = useState(null) // checkin id
    const [sentReaction, setSentReaction] = useState(null)
    const storyTimerRef = useRef(null)
    const storyProgressRef = useRef(null)

    const { user } = useAuth()
    const { locale } = useLanguage()
    const { toast } = useToast()
    const router = useRouter()
    const t = (tr, en) => locale === 'tr' ? tr : en

    useEffect(() => {
        if (user) loadFeed()
    }, [user])

    // Story auto-advance
    useEffect(() => {
        if (!activeStory) {
            clearInterval(storyTimerRef.current)
            clearInterval(storyProgressRef.current)
            return
        }

        setStoryProgress(0)
        const startTime = Date.now()

        storyProgressRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime
            setStoryProgress(Math.min(elapsed / STORY_DURATION, 1))
        }, 50)

        storyTimerRef.current = setTimeout(() => {
            advanceStory()
        }, STORY_DURATION)

        return () => {
            clearTimeout(storyTimerRef.current)
            clearInterval(storyProgressRef.current)
        }
    }, [activeStory?.groupIndex, activeStory?.storyIndex])

    const advanceStory = () => {
        if (!activeStory) return
        const group = storyGroups[activeStory.groupIndex]
        if (!group) return

        if (activeStory.storyIndex < group.stories.length - 1) {
            setActiveStory(prev => ({ ...prev, storyIndex: prev.storyIndex + 1 }))
        } else if (activeStory.groupIndex < storyGroups.length - 1) {
            setActiveStory({ groupIndex: activeStory.groupIndex + 1, storyIndex: 0 })
        } else {
            setActiveStory(null)
        }
    }

    const prevStory = () => {
        if (!activeStory) return
        if (activeStory.storyIndex > 0) {
            setActiveStory(prev => ({ ...prev, storyIndex: prev.storyIndex - 1 }))
        } else if (activeStory.groupIndex > 0) {
            const prevGroup = storyGroups[activeStory.groupIndex - 1]
            setActiveStory({ groupIndex: activeStory.groupIndex - 1, storyIndex: prevGroup.stories.length - 1 })
        }
    }

    const loadFeed = async () => {
        setLoading(true)
        try {
            const authH = await getAuthHeaders()
            const res = await fetch(`/api/social/feed?userId=${user.id}`, { headers: authH })
            const data = await res.json()
            setFeed(data.feed || [])
            setStoryGroups(data.storyGroups || [])
        } catch (err) {
            console.error('Feed error:', err)
        }
        setLoading(false)
    }

    const handleCheckin = async () => {
        if (!checkinData.placeName.trim()) return
        setSubmitting(true)
        try {
            const authH = await getAuthHeaders()
            const res = await fetch('/api/social/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authH },
                body: JSON.stringify({
                    userId: user.id,
                    placeName: checkinData.placeName,
                    city: checkinData.city,
                    note: checkinData.note,
                    emoji: checkinData.emoji,
                    category: checkinData.category,
                    rating: checkinData.rating,
                }),
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            toast.success('📍 Check-in başarılı!')
            setShowCheckin(false)
            setCheckinData({ placeName: '', city: '', note: '', emoji: '📍', category: 'other', rating: 0 })
            loadFeed()
        } catch (err) {
            toast.error(err.message || 'Hata oluştu')
        }
        setSubmitting(false)
    }

    const handleLike = async (targetId, targetType = 'check_in') => {
        setLiking(prev => ({ ...prev, [targetId]: true }))
        try {
            const authH = await getAuthHeaders()
            const res = await fetch('/api/social/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authH },
                body: JSON.stringify({ userId: user.id, targetId, targetType }),
            })
            const data = await res.json()
            setFeed(prev => prev.map(item =>
                item.id === targetId ? { ...item, isLiked: data.liked, likeCount: data.liked ? (item.likeCount || 0) + 1 : Math.max((item.likeCount || 0) - 1, 0) } : item
            ))
        } catch (err) { console.error(err) }
        setLiking(prev => ({ ...prev, [targetId]: false }))
    }

    const handleReaction = (checkinId, emoji) => {
        setSentReaction({ id: checkinId, emoji })
        setTimeout(() => setSentReaction(null), 1500)
        setShowReactions(null)
        handleLike(checkinId)
    }

    const getCatEmoji = (cat) => CATEGORIES.find(c => c.key === cat)?.emoji || '📍'

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="page" style={{ maxWidth: 640, margin: '0 auto' }}>

                    {/* ═══ HEADER ═══ */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: 20, padding: '16px 0',
                        }}>
                        <div>
                            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, background: 'linear-gradient(135deg, #0F2847, #EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Feed
                            </h1>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                                {t('Seyahat arkadaşlarını takip et', 'Follow your travel buddies')}
                            </p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => setShowCheckin(true)}
                            style={{
                                background: 'linear-gradient(135deg, #0F2847, #1A3A5C)',
                                color: '#fff', border: 'none', borderRadius: 14,
                                padding: '10px 18px', cursor: 'pointer', fontWeight: 700,
                                fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6,
                                boxShadow: '0 4px 15px rgba(15,40,71,0.3)',
                            }}>
                            <Plus size={16} /> Check-in
                        </motion.button>
                    </motion.div>

                    {/* ═══ STORIES CAROUSEL ═══ */}
                    {storyGroups.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{
                                display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 16,
                                marginBottom: 20, scrollbarWidth: 'none',
                            }}>
                            {storyGroups.map((group, gi) => (
                                <motion.button key={gi}
                                    whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                                    onClick={() => setActiveStory({ groupIndex: gi, storyIndex: 0 })}
                                    style={{
                                        flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        gap: 6, background: 'none', border: 'none', cursor: 'pointer', minWidth: 72,
                                    }}>
                                    <div style={{
                                        width: 64, height: 64, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #EC4899, #8B5CF6, #0F2847)',
                                        padding: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <div style={{
                                            width: 56, height: 56, borderRadius: '50%',
                                            background: group.user?.avatar_url ? `url(${group.user.avatar_url}) center/cover` : 'var(--bg-tertiary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-secondary)',
                                            border: '3px solid var(--bg-primary)',
                                        }}>
                                            {!group.user?.avatar_url && (group.user?.display_name?.[0] || '?')}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', maxWidth: 68, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                                        {group.user?.display_name?.split(' ')[0] || 'User'}
                                    </span>
                                </motion.button>
                            ))}
                        </motion.div>
                    )}

                    {/* ═══ STORY VIEWER MODAL — FULL UPGRADE ═══ */}
                    <AnimatePresence>
                        {activeStory && storyGroups[activeStory.groupIndex] && (() => {
                            const group = storyGroups[activeStory.groupIndex]
                            const story = group.stories[activeStory.storyIndex]
                            if (!story) return null
                            return (
                                <motion.div
                                    key="story-modal"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    style={{
                                        position: 'fixed', inset: 0, zIndex: 9999,
                                        background: 'rgba(0,0,0,0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                    <motion.div
                                        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                        style={{
                                            width: '90%', maxWidth: 420, height: '80vh', maxHeight: 680,
                                            borderRadius: 24, overflow: 'hidden', position: 'relative',
                                            background: story.mediaUrl
                                                ? `url(${story.mediaUrl}) center/cover no-repeat`
                                                : (story.bgColor || '#0F2847'),
                                            color: '#fff', display: 'flex', flexDirection: 'column',
                                        }}>
                                        {/* Dark overlay for readability when image is background */}
                                        {story.mediaUrl && (
                                            <div style={{
                                                position: 'absolute', inset: 0,
                                                background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.6) 100%)',
                                                zIndex: 0,
                                            }} />
                                        )}
                                        {/* Progress bars */}
                                        <div style={{ display: 'flex', gap: 3, padding: '12px 16px 6px', position: 'relative', zIndex: 1 }}>
                                            {group.stories.map((_, si) => (
                                                <div key={si} style={{
                                                    flex: 1, height: 3, borderRadius: 2,
                                                    background: 'rgba(255,255,255,0.25)', overflow: 'hidden',
                                                }}>
                                                    <div style={{
                                                        height: '100%', borderRadius: 2,
                                                        background: '#fff',
                                                        width: si < activeStory.storyIndex ? '100%' :
                                                            si === activeStory.storyIndex ? `${storyProgress * 100}%` : '0%',
                                                        transition: si === activeStory.storyIndex ? 'none' : 'width 0.3s',
                                                    }} />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Story header with avatar */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px 6px', position: 'relative', zIndex: 1 }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                                                background: group.user?.avatar_url ? `url(${group.user.avatar_url}) center/cover` : 'rgba(255,255,255,0.2)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '0.9rem', fontWeight: 800,
                                                border: '2px solid rgba(255,255,255,0.5)',
                                            }}>
                                                {!group.user?.avatar_url && (group.user?.display_name?.[0] || '?')}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                                                    {group.user?.display_name}
                                                </div>
                                                <div style={{ fontSize: '0.68rem', opacity: 0.7 }}>
                                                    {timeAgo(story.createdAt)}
                                                </div>
                                            </div>
                                            <button onClick={() => setActiveStory(null)}
                                                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <X size={18} />
                                            </button>
                                        </div>

                                        {/* Tap zones (left/right) */}
                                        <div style={{ flex: 1, display: 'flex', position: 'relative', zIndex: 1 }}>
                                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', cursor: 'pointer', zIndex: 2 }}
                                                onClick={prevStory} />
                                            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '70%', cursor: 'pointer', zIndex: 2 }}
                                                onClick={advanceStory} />

                                            {/* Story content */}
                                            <div style={{
                                                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                justifyContent: 'center', padding: '30px 28px', textAlign: 'center',
                                            }}>
                                                <motion.div
                                                    key={`${activeStory.groupIndex}-${activeStory.storyIndex}`}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ duration: 0.3 }}
                                                    style={{ fontSize: '4rem', marginBottom: 20 }}>
                                                    {story.emoji || '✈️'}
                                                </motion.div>
                                                <motion.p
                                                    key={`text-${activeStory.groupIndex}-${activeStory.storyIndex}`}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3, delay: 0.1 }}
                                                    style={{ fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.6, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                                                    {story.content}
                                                </motion.p>
                                                {story.city && (
                                                    <motion.p
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 0.7 }}
                                                        style={{ fontSize: '0.82rem', marginTop: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <MapPin size={14} /> {story.city}
                                                    </motion.p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Emoji reactions */}
                                        <div style={{ padding: '12px 20px 20px', display: 'flex', justifyContent: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
                                            {STORY_REACTIONS.map(emoji => (
                                                <motion.button key={emoji}
                                                    whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.8 }}
                                                    onClick={() => {
                                                        setSentReaction({ id: 'story', emoji })
                                                        setTimeout(() => setSentReaction(null), 1200)
                                                    }}
                                                    style={{
                                                        background: 'rgba(255,255,255,0.12)', border: 'none',
                                                        borderRadius: '50%', width: 44, height: 44, cursor: 'pointer',
                                                        fontSize: '1.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: 'all 200ms',
                                                    }}>
                                                    {emoji}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </motion.div>

                                    {/* Floating sent reaction animation */}
                                    <AnimatePresence>
                                        {sentReaction?.id === 'story' && (
                                            <motion.div
                                                initial={{ opacity: 1, scale: 1, y: 0 }}
                                                animate={{ opacity: 0, scale: 2.5, y: -100 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 1 }}
                                                style={{
                                                    position: 'fixed', bottom: '20%', left: '50%', transform: 'translateX(-50%)',
                                                    fontSize: '3rem', zIndex: 10001, pointerEvents: 'none',
                                                }}>
                                                {sentReaction.emoji}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )
                        })()}
                    </AnimatePresence>

                    {/* ═══ FEED ITEMS ═══ */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 60 }}>
                            <Loader2 size={28} className="spin" style={{ color: 'var(--primary-1)' }} />
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginTop: 12 }}>Feed yükleniyor...</p>
                        </div>
                    ) : feed.length === 0 ? (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            style={{
                                textAlign: 'center', padding: 60,
                                background: 'var(--bg-secondary)', borderRadius: 24,
                                border: '1px solid var(--border)',
                            }}>
                            <div style={{ fontSize: 60, marginBottom: 12, opacity: 0.3 }}>🗺️</div>
                            <h3 style={{ margin: '0 0 6px', fontWeight: 700 }}>
                                {t('Feed boş', 'Feed is empty')}
                            </h3>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', margin: '0 0 16px', maxWidth: 300, marginInline: 'auto' }}>
                                {t('İlk check-in\'ini yap veya gezginleri keşfet sayfasından takip et!', 'Make your first check-in or follow travelers from the discover page!')}
                            </p>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button className="btn btn-primary" onClick={() => setShowCheckin(true)}>
                                    <Plus size={14} /> Check-in Yap
                                </button>
                                <button className="btn btn-secondary" onClick={() => router.push('/discover')}>
                                    <Sparkles size={14} /> {t('Gezginleri Keşfet', 'Discover Travelers')}
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            {feed.map((item, i) => (
                                <motion.div key={item.id}
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    style={{
                                        background: 'var(--bg-secondary)', borderRadius: 20,
                                        border: '1px solid var(--border)', overflow: 'hidden',
                                    }}>
                                    {/* Card header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 8px' }}>
                                        <div
                                            onClick={() => {
                                                if (item.user?.username) router.push(`/u/${item.user.username}`)
                                            }}
                                            style={{
                                                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                                                background: item.user?.avatar_url ? `url(${item.user.avatar_url}) center/cover` : 'linear-gradient(135deg, #0F2847, #1A3A5C)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                                                border: '2px solid var(--border)',
                                            }}>
                                            {!item.user?.avatar_url && (item.user?.display_name?.[0] || '?')}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                                            }} onClick={() => item.user?.username && router.push(`/u/${item.user.username}`)}>
                                                {item.user?.display_name || 'User'}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Clock size={10} /> {timeAgo(item.createdAt)}
                                                {item.city && <><span>·</span><MapPin size={10} /> {item.city}</>}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '1.3rem' }}>{item.emoji || getCatEmoji(item.category)}</span>
                                    </div>

                                    {/* Check-in content */}
                                    <div style={{ padding: '4px 16px 10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                                            <span style={{
                                                background: 'rgba(15,40,71,0.08)', color: 'var(--text-primary)',
                                                padding: '3px 10px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
                                            }}>
                                                📍 {item.placeName}
                                            </span>
                                            {item.category && item.category !== 'other' && (
                                                <span style={{
                                                    background: 'rgba(236,72,153,0.08)', color: '#EC4899',
                                                    padding: '3px 8px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 600,
                                                }}>
                                                    {getCatEmoji(item.category)} {CATEGORIES.find(c => c.key === item.category)?.label}
                                                </span>
                                            )}
                                        </div>
                                        {item.note && (
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: '6px 0', lineHeight: 1.5 }}>
                                                {item.note}
                                            </p>
                                        )}
                                        {item.rating > 0 && (
                                            <div style={{ display: 'flex', gap: 2, margin: '6px 0' }}>
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star key={s} size={14} fill={s <= item.rating ? '#F59E0B' : 'none'} stroke={s <= item.rating ? '#F59E0B' : 'var(--text-tertiary)'} />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Photo */}
                                    {item.photoUrl && (
                                        <div style={{
                                            width: '100%', height: 280, position: 'relative',
                                            backgroundImage: `url(${item.photoUrl})`,
                                            backgroundSize: 'cover', backgroundPosition: 'center',
                                            borderTop: '1px solid var(--border)',
                                        }}>
                                            {/* Gradient overlay at bottom */}
                                            <div style={{
                                                position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
                                                background: 'linear-gradient(transparent, rgba(0,0,0,0.3))',
                                            }} />
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
                                        borderTop: '1px solid var(--border)',
                                    }}>
                                        <button
                                            onClick={() => handleLike(item.id)}
                                            disabled={liking[item.id]}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: 4,
                                                color: item.isLiked ? '#EF4444' : 'var(--text-tertiary)',
                                                fontWeight: 600, fontSize: '0.8rem', transition: 'all 200ms',
                                                padding: '4px 8px', borderRadius: 8,
                                            }}>
                                            <Heart size={18} fill={item.isLiked ? '#EF4444' : 'none'} />
                                            {item.likeCount > 0 && item.likeCount}
                                        </button>

                                        {/* Quick reactions */}
                                        <div style={{ position: 'relative' }}>
                                            <button
                                                onClick={() => setShowReactions(showReactions === item.id ? null : item.id)}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                    color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 600,
                                                    padding: '4px 8px', borderRadius: 8,
                                                }}>
                                                😀
                                            </button>
                                            <AnimatePresence>
                                                {showReactions === item.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.8, y: 5 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        style={{
                                                            position: 'absolute', bottom: '100%', left: -20,
                                                            background: 'var(--bg-primary)', borderRadius: 20,
                                                            border: '1px solid var(--border)', padding: '6px 10px',
                                                            display: 'flex', gap: 4, zIndex: 100,
                                                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                                        }}>
                                                        {STORY_REACTIONS.map(emoji => (
                                                            <motion.button key={emoji}
                                                                whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.8 }}
                                                                onClick={() => handleReaction(item.id, emoji)}
                                                                style={{
                                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                                    fontSize: '1.2rem', padding: 4,
                                                                }}>
                                                                {emoji}
                                                            </motion.button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <div style={{ flex: 1 }} />

                                        <button
                                            onClick={() => {
                                                toast.success('📌 Kaydedildi!')
                                            }}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: 'var(--text-tertiary)', padding: '4px 8px', borderRadius: 8,
                                            }}>
                                            <Bookmark size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                const shareText = `${item.userName} 📍 ${item.placeName}, ${item.city}`
                                                if (navigator.share) {
                                                    navigator.share({ title: 'UMAE', text: shareText, url: window.location.href }).catch(() => { })
                                                } else {
                                                    navigator.clipboard?.writeText(shareText)
                                                    toast.success('📋 Kopyalandı!')
                                                }
                                            }}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: 'var(--text-tertiary)', padding: '4px 8px', borderRadius: 8,
                                            }}>
                                            <Share2 size={16} />
                                        </button>
                                    </div>

                                    {/* Floating reaction animation */}
                                    <AnimatePresence>
                                        {sentReaction?.id === item.id && (
                                            <motion.div
                                                initial={{ opacity: 1, scale: 1, y: 0 }}
                                                animate={{ opacity: 0, scale: 2, y: -60 }}
                                                exit={{ opacity: 0 }}
                                                style={{
                                                    position: 'absolute', bottom: 40, left: '50%',
                                                    fontSize: '2.5rem', pointerEvents: 'none',
                                                }}>
                                                {sentReaction.emoji}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Comment input */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '8px 16px 12px',
                                        borderTop: '1px solid var(--border)',
                                    }}>
                                        <div style={{
                                            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                                            background: 'linear-gradient(135deg, #0F2847, #1A3A5C)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontWeight: 800, fontSize: '0.6rem',
                                        }}>
                                            {user?.user_metadata?.display_name?.[0] || '?'}
                                        </div>
                                        <input
                                            placeholder="Yorum yaz..."
                                            style={{
                                                flex: 1, background: 'var(--bg-tertiary)',
                                                border: 'none', borderRadius: 20, padding: '7px 14px',
                                                fontSize: '0.76rem', color: 'var(--text-primary)',
                                                outline: 'none',
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && e.target.value.trim()) {
                                                    toast.info('💬 Yorum özelliği yakında!')
                                                    e.target.value = ''
                                                }
                                            }}
                                        />
                                        <button style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: 'var(--primary-1)', padding: 4,
                                        }}>
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* ═══ CHECK-IN MODAL ═══ */}
                    <AnimatePresence>
                        {showCheckin && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                style={{
                                    position: 'fixed', inset: 0, zIndex: 9999,
                                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                                }}
                                onClick={() => setShowCheckin(false)}>
                                <motion.div
                                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                        width: '100%', maxWidth: 480,
                                        background: 'var(--bg-primary)', borderRadius: '24px 24px 0 0',
                                        padding: 24, maxHeight: '85vh', overflowY: 'auto',
                                    }}>
                                    {/* Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>📍 Check-in</h2>
                                        <button onClick={() => setShowCheckin(false)}
                                            style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <X size={16} />
                                        </button>
                                    </div>

                                    {/* Place Name */}
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                        Mekan Adı *
                                    </label>
                                    <input className="input" placeholder="örn: Bebek Sahili, Burger King Etiler..."
                                        value={checkinData.placeName}
                                        onChange={e => setCheckinData(p => ({ ...p, placeName: e.target.value }))}
                                        style={{ marginBottom: 14, fontSize: '0.9rem' }} autoFocus />

                                    {/* City */}
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                        Şehir
                                    </label>
                                    <input className="input" placeholder="örn: İstanbul"
                                        value={checkinData.city}
                                        onChange={e => setCheckinData(p => ({ ...p, city: e.target.value }))}
                                        style={{ marginBottom: 14 }} />

                                    {/* Category */}
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                                        Kategori
                                    </label>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                                        {CATEGORIES.map(cat => (
                                            <button key={cat.key}
                                                onClick={() => setCheckinData(p => ({ ...p, category: cat.key, emoji: cat.emoji }))}
                                                style={{
                                                    padding: '6px 12px', borderRadius: 10, fontSize: '0.78rem',
                                                    border: checkinData.category === cat.key ? '2px solid var(--primary-1)' : '1px solid var(--border)',
                                                    background: checkinData.category === cat.key ? 'rgba(15,40,71,0.08)' : 'var(--bg-tertiary)',
                                                    color: checkinData.category === cat.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                    cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                                                }}>
                                                {cat.emoji} {cat.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Rating */}
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                        Puan
                                    </label>
                                    <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <button key={s} onClick={() => setCheckinData(p => ({ ...p, rating: p.rating === s ? 0 : s }))}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                                                <Star size={24} fill={s <= checkinData.rating ? '#F59E0B' : 'none'} stroke={s <= checkinData.rating ? '#F59E0B' : 'var(--text-tertiary)'} />
                                            </button>
                                        ))}
                                    </div>

                                    {/* Note */}
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                        Not
                                    </label>
                                    <textarea className="input" placeholder="Nasıldı? Önerir misin?"
                                        value={checkinData.note}
                                        onChange={e => setCheckinData(p => ({ ...p, note: e.target.value }))}
                                        rows={3} style={{ marginBottom: 18, resize: 'none' }} />

                                    {/* Submit */}
                                    <button className="btn btn-primary" onClick={handleCheckin} disabled={submitting || !checkinData.placeName.trim()}
                                        style={{ width: '100%', padding: '12px', fontSize: '0.9rem', fontWeight: 700 }}>
                                        {submitting ? <><Loader2 size={16} className="spin" /> Kaydediliyor...</> : <><Send size={16} /> Check-in Yap</>}
                                    </button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
        </>
    )
}
