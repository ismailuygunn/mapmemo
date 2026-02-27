'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import Sidebar from '@/components/layout/Sidebar'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Heart, MessageCircle, MapPin, Plus, X, Send, Camera, Star,
    Clock, ChevronRight, Loader2, Coffee, UtensilsCrossed, Landmark,
    TreePine, Wine, Hotel, Navigation, Sparkles
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
    const [activeStory, setActiveStory] = useState(null) // { groupIndex, storyIndex }
    const [liking, setLiking] = useState({})

    const { user } = useAuth()
    const { locale } = useLanguage()
    const { toast } = useToast()
    const router = useRouter()
    const t = (tr, en) => locale === 'tr' ? tr : en

    useEffect(() => {
        if (user) loadFeed()
    }, [user])

    const loadFeed = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/social/feed?userId=${user.id}`)
            const data = await res.json()
            setFeed(data.feed || [])
            setStoryGroups(data.storyGroups || [])
        } catch (err) {
            console.error('Feed load error:', err)
        }
        setLoading(false)
    }

    const handleCheckin = async () => {
        if (!checkinData.placeName.trim()) return
        setSubmitting(true)
        try {
            const res = await fetch('/api/social/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    placeName: checkinData.placeName,
                    city: checkinData.city,
                    note: checkinData.note,
                    emoji: checkinData.emoji,
                    category: checkinData.category,
                    rating: checkinData.rating || null,
                }),
            })
            if (!res.ok) throw new Error('Check-in failed')
            toast.success('📍 Check-in yapıldı!')
            setShowCheckin(false)
            setCheckinData({ placeName: '', city: '', note: '', emoji: '📍', category: 'other', rating: 0 })
            loadFeed()
        } catch (err) {
            toast.error(err.message)
        }
        setSubmitting(false)
    }

    const handleLike = async (targetId, targetType = 'check_in') => {
        setLiking(prev => ({ ...prev, [targetId]: true }))
        try {
            const res = await fetch('/api/social/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, targetType, targetId }),
            })
            const data = await res.json()
            setFeed(prev => prev.map(item =>
                item.id === targetId ? {
                    ...item,
                    isLiked: data.liked,
                    likeCount: data.liked ? (item.likeCount || 0) + 1 : Math.max((item.likeCount || 0) - 1, 0)
                } : item
            ))
        } catch (err) { console.error(err) }
        setLiking(prev => ({ ...prev, [targetId]: false }))
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
                            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: 0, background: 'linear-gradient(135deg, #4F46E5, #EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
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
                                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                color: '#fff', border: 'none', borderRadius: 14,
                                padding: '10px 18px', cursor: 'pointer', fontWeight: 700,
                                fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6,
                                boxShadow: '0 4px 15px rgba(79,70,229,0.3)',
                            }}>
                            <Plus size={16} /> Check-in
                        </motion.button>
                    </motion.div>

                    {/* ═══ STORIES CAROUSEL ═══ */}
                    {storyGroups.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{
                                display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16,
                                marginBottom: 20, scrollbarWidth: 'none',
                            }}>
                            {storyGroups.map((group, gi) => (
                                <motion.button key={gi}
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={() => setActiveStory({ groupIndex: gi, storyIndex: 0 })}
                                    style={{
                                        flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        gap: 4, background: 'none', border: 'none', cursor: 'pointer', minWidth: 68,
                                    }}>
                                    <div style={{
                                        width: 56, height: 56, borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #EC4899, #8B5CF6, #4F46E5)',
                                        padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <div style={{
                                            width: 50, height: 50, borderRadius: '50%',
                                            background: group.user?.avatar_url ? `url(${group.user.avatar_url}) center/cover` : 'var(--bg-tertiary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-secondary)',
                                            border: '2px solid var(--bg-primary)',
                                        }}>
                                            {!group.user?.avatar_url && (group.user?.display_name?.[0] || '?')}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {group.user?.display_name?.split(' ')[0] || 'User'}
                                    </span>
                                </motion.button>
                            ))}
                        </motion.div>
                    )}

                    {/* ═══ STORY VIEWER MODAL ═══ */}
                    <AnimatePresence>
                        {activeStory && storyGroups[activeStory.groupIndex] && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                style={{
                                    position: 'fixed', inset: 0, zIndex: 9999,
                                    background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                                onClick={() => setActiveStory(null)}>
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                        width: '90%', maxWidth: 400, maxHeight: '80vh',
                                        borderRadius: 24, overflow: 'hidden',
                                        background: storyGroups[activeStory.groupIndex].stories[activeStory.storyIndex]?.bgColor || '#4F46E5',
                                        color: '#fff', display: 'flex', flexDirection: 'column',
                                    }}>
                                    {/* Story header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 16 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: '50%',
                                            background: 'rgba(255,255,255,0.2)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.9rem', fontWeight: 800,
                                        }}>
                                            {storyGroups[activeStory.groupIndex].user?.display_name?.[0] || '?'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                                                {storyGroups[activeStory.groupIndex].user?.display_name}
                                            </div>
                                            <div style={{ fontSize: '0.68rem', opacity: 0.7 }}>
                                                {timeAgo(storyGroups[activeStory.groupIndex].stories[activeStory.storyIndex]?.createdAt)}
                                            </div>
                                        </div>
                                        <button onClick={() => setActiveStory(null)}
                                            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                    {/* Progress bar */}
                                    <div style={{ display: 'flex', gap: 3, padding: '0 16px 8px' }}>
                                        {storyGroups[activeStory.groupIndex].stories.map((_, si) => (
                                            <div key={si} style={{
                                                flex: 1, height: 3, borderRadius: 2,
                                                background: si <= activeStory.storyIndex ? '#fff' : 'rgba(255,255,255,0.3)',
                                            }} />
                                        ))}
                                    </div>
                                    {/* Story content */}
                                    <div style={{
                                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        padding: '40px 24px', textAlign: 'center', minHeight: 300,
                                    }}>
                                        <div style={{ fontSize: '3rem', marginBottom: 16 }}>
                                            {storyGroups[activeStory.groupIndex].stories[activeStory.storyIndex]?.emoji || '✈️'}
                                        </div>
                                        <p style={{ fontSize: '1.1rem', fontWeight: 600, lineHeight: 1.5 }}>
                                            {storyGroups[activeStory.groupIndex].stories[activeStory.storyIndex]?.content}
                                        </p>
                                        {storyGroups[activeStory.groupIndex].stories[activeStory.storyIndex]?.city && (
                                            <p style={{ fontSize: '0.78rem', opacity: 0.7, marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <MapPin size={12} /> {storyGroups[activeStory.groupIndex].stories[activeStory.storyIndex].city}
                                            </p>
                                        )}
                                    </div>
                                    {/* Nav */}
                                    <div style={{ display: 'flex', gap: 8, padding: 16, justifyContent: 'center' }}>
                                        <button
                                            disabled={activeStory.storyIndex === 0}
                                            onClick={() => setActiveStory(prev => ({ ...prev, storyIndex: prev.storyIndex - 1 }))}
                                            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: '8px 20px', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', opacity: activeStory.storyIndex === 0 ? 0.4 : 1 }}>
                                            ← {t('Önceki', 'Prev')}
                                        </button>
                                        <button
                                            disabled={activeStory.storyIndex >= storyGroups[activeStory.groupIndex].stories.length - 1}
                                            onClick={() => {
                                                const maxI = storyGroups[activeStory.groupIndex].stories.length - 1
                                                if (activeStory.storyIndex < maxI) {
                                                    setActiveStory(prev => ({ ...prev, storyIndex: prev.storyIndex + 1 }))
                                                } else {
                                                    // Go to next group
                                                    if (activeStory.groupIndex < storyGroups.length - 1) {
                                                        setActiveStory({ groupIndex: activeStory.groupIndex + 1, storyIndex: 0 })
                                                    } else setActiveStory(null)
                                                }
                                            }}
                                            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: '8px 20px', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                                            {t('Sonraki', 'Next')} →
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                                            onClick={() => item.user?.username && router.push(`/u/${item.user.username}`)}
                                            style={{
                                                width: 40, height: 40, borderRadius: '50%',
                                                background: item.user?.avatar_url ? `url(${item.user.avatar_url}) center/cover` : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
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
                                    <div style={{ padding: '4px 16px 12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                            <span style={{
                                                background: 'rgba(79,70,229,0.08)', color: '#4F46E5',
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
                                            width: '100%', height: 240,
                                            backgroundImage: `url(${item.photoUrl})`,
                                            backgroundSize: 'cover', backgroundPosition: 'center',
                                        }} />
                                    )}

                                    {/* Actions */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 16, padding: '10px 16px',
                                        borderTop: '1px solid var(--border)',
                                    }}>
                                        <button
                                            onClick={() => handleLike(item.id)}
                                            disabled={liking[item.id]}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: 4,
                                                color: item.isLiked ? '#EF4444' : 'var(--text-tertiary)',
                                                fontWeight: 600, fontSize: '0.8rem', transition: 'color 200ms',
                                            }}>
                                            <Heart size={18} fill={item.isLiked ? '#EF4444' : 'none'} />
                                            {item.likeCount > 0 && item.likeCount}
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
                                                    border: checkinData.category === cat.key ? '2px solid #4F46E5' : '1px solid var(--border)',
                                                    background: checkinData.category === cat.key ? 'rgba(79,70,229,0.08)' : 'var(--bg-tertiary)',
                                                    color: checkinData.category === cat.key ? '#4F46E5' : 'var(--text-secondary)',
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
