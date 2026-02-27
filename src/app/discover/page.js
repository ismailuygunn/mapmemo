'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { getAuthHeaders } from '@/lib/authHeaders'
import Sidebar from '@/components/layout/Sidebar'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search, MapPin, Users, Loader2, UserPlus, UserMinus,
    Sparkles, TrendingUp, Coffee, Star, Heart, ChevronRight
} from 'lucide-react'

export default function DiscoverPage() {
    const [users, setUsers] = useState([])
    const [recentCheckins, setRecentCheckins] = useState([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [followingIds, setFollowingIds] = useState(new Set())
    const [followLoading, setFollowLoading] = useState({})
    const [tab, setTab] = useState('users') // users | checkins

    const { user } = useAuth()
    const { locale } = useLanguage()
    const { toast } = useToast()
    const router = useRouter()
    const supabase = createClient()
    const t = (tr, en) => locale === 'tr' ? tr : en

    useEffect(() => {
        if (user) {
            loadData()
            loadFollowing()
        }
    }, [user])

    const loadData = async () => {
        setLoading(true)
        try {
            const authH = await getAuthHeaders()
            // Get all public profiles (excluding self)
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, display_name, username, avatar_url, bio, home_city, follower_count, following_count, checkin_count')
                .neq('id', user.id)
                .order('follower_count', { ascending: false })
                .limit(50)

            setUsers(profiles || [])

            // Get recent check-ins from all users
            const res = await fetch(`/api/social/checkin?limit=20`, { headers: authH })
            const data = await res.json()
            setRecentCheckins(data.checkins || [])
        } catch (err) {
            console.error('Discover load err:', err)
        }
        setLoading(false)
    }

    const loadFollowing = async () => {
        try {
            const authH = await getAuthHeaders()
            const res = await fetch(`/api/social/follow?userId=${user.id}&type=following`, { headers: authH })
            const data = await res.json()
            setFollowingIds(new Set((data.users || []).map(u => u.id)))
        } catch (err) { console.error(err) }
    }

    const handleFollow = async (targetId) => {
        setFollowLoading(prev => ({ ...prev, [targetId]: true }))
        try {
            const authH = await getAuthHeaders()
            const res = await fetch('/api/social/follow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authH },
                body: JSON.stringify({ followerId: user.id, followingId: targetId }),
            })
            const data = await res.json()
            if (data.followed) {
                setFollowingIds(prev => new Set([...prev, targetId]))
                toast.success('✅ Takip edildi!')
            } else {
                setFollowingIds(prev => { const s = new Set(prev); s.delete(targetId); return s })
                toast.success('Takipten çıkıldı')
            }
            // Update follower count in local state
            setUsers(prev => prev.map(u =>
                u.id === targetId ? { ...u, follower_count: data.followed ? (u.follower_count || 0) + 1 : Math.max((u.follower_count || 0) - 1, 0) } : u
            ))
        } catch (err) { toast.error(err.message) }
        setFollowLoading(prev => ({ ...prev, [targetId]: false }))
    }

    const filteredUsers = search.trim()
        ? users.filter(u =>
            (u.display_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
            (u.home_city || '').toLowerCase().includes(search.toLowerCase())
        )
        : users

    const timeAgo = (date) => {
        const diff = Math.floor((Date.now() - new Date(date)) / 1000)
        if (diff < 60) return 'az önce'
        if (diff < 3600) return `${Math.floor(diff / 60)} dk`
        if (diff < 86400) return `${Math.floor(diff / 3600)} sa`
        return `${Math.floor(diff / 86400)} gün`
    }

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="page" style={{ maxWidth: 700, margin: '0 auto' }}>

                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                        style={{ marginBottom: 20 }}>
                        <h1 style={{
                            fontSize: '1.6rem', fontWeight: 900, margin: '0 0 4px',
                            background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            🧭 {t('Keşfet', 'Discover')}
                        </h1>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: 0 }}>
                            {t('Gezginleri bul, takip et, ilham al', 'Find travelers, follow, get inspired')}
                        </p>
                    </motion.div>

                    {/* Search */}
                    <div style={{ position: 'relative', marginBottom: 16 }}>
                        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input className="input" placeholder={t('Gezgin ara...', 'Search travelers...')}
                            value={search} onChange={e => setSearch(e.target.value)}
                            style={{ paddingLeft: 40, fontSize: '0.88rem' }} />
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                        {[
                            { key: 'users', icon: <Users size={14} />, label: t('Gezginler', 'Travelers') },
                            { key: 'checkins', icon: <MapPin size={14} />, label: t('Son Check-in\'ler', 'Recent Check-ins') },
                        ].map(tb => (
                            <button key={tb.key}
                                onClick={() => setTab(tb.key)}
                                style={{
                                    padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                    background: tab === tb.key ? 'linear-gradient(135deg, #4F46E5, #7C3AED)' : 'var(--bg-tertiary)',
                                    color: tab === tb.key ? '#fff' : 'var(--text-secondary)',
                                    fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6,
                                    transition: 'all 200ms',
                                }}>
                                {tb.icon} {tb.label}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 60 }}>
                            <Loader2 size={28} className="spin" style={{ color: 'var(--primary-1)' }} />
                        </div>
                    ) : tab === 'users' ? (
                        /* ═══ USERS GRID ═══ */
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                                <Sparkles size={16} style={{ color: '#F59E0B' }} />
                                <span style={{ fontSize: '0.88rem', fontWeight: 800 }}>
                                    {t('Önerilen Gezginler', 'Suggested Travelers')}
                                </span>
                                <span style={{
                                    fontSize: '0.65rem', padding: '2px 8px', borderRadius: 20,
                                    background: 'rgba(79,70,229,0.1)', color: '#4F46E5', fontWeight: 700,
                                }}>{filteredUsers.length} kişi</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                                {filteredUsers.length === 0 && (
                                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
                                        {search ? t('Sonuç bulunamadı', 'No results found') : t('Henüz başka kullanıcı yok', 'No other users yet')}
                                    </div>
                                )}
                                {filteredUsers.map((u, i) => {
                                    const isFollowing = followingIds.has(u.id)
                                    const cardGradient = [
                                        'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                        'linear-gradient(135deg, #EC4899, #F43F5E)',
                                        'linear-gradient(135deg, #10B981, #059669)',
                                        'linear-gradient(135deg, #F59E0B, #D97706)',
                                        'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                                    ][i % 5]
                                    return (
                                        <motion.div key={u.id}
                                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            whileHover={{ y: -4 }}
                                            style={{
                                                background: 'var(--bg-secondary)', borderRadius: 20,
                                                border: '1px solid var(--border)', overflow: 'hidden',
                                                cursor: 'pointer', transition: 'all 200ms',
                                            }}
                                            onClick={() => u.username && router.push(`/u/${u.username}`)}>
                                            <div style={{ height: 4, background: cardGradient }} />
                                            <div style={{ padding: 16 }}>
                                                {/* Avatar + info */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                                    <div style={{
                                                        width: 48, height: 48, borderRadius: '50%',
                                                        background: u.avatar_url ? `url(${u.avatar_url}) center/cover` : cardGradient,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#fff', fontWeight: 800, fontSize: '1rem',
                                                    }}>
                                                        {!u.avatar_url && (u.display_name?.[0] || '?')}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{u.display_name || 'User'}</div>
                                                        {u.username && <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>@{u.username}</div>}
                                                        {u.home_city && (
                                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                                                                <MapPin size={10} /> {u.home_city}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); handleFollow(u.id) }}
                                                        disabled={followLoading[u.id]}
                                                        style={{
                                                            padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                                            background: isFollowing ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                                            color: isFollowing ? 'var(--text-secondary)' : '#fff',
                                                            fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4,
                                                            transition: 'all 200ms',
                                                        }}>
                                                        {followLoading[u.id] ? <Loader2 size={12} className="spin" /> :
                                                            isFollowing ? <><UserMinus size={12} /> {t('Takipte', 'Following')}</> : <><UserPlus size={12} /> {t('Takip Et', 'Follow')}</>
                                                        }
                                                    </button>
                                                </div>
                                                {/* Bio */}
                                                {u.bio && <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.4 }}>{u.bio.slice(0, 80)}{u.bio.length > 80 ? '...' : ''}</p>}
                                                {/* Stats */}
                                                <div style={{ display: 'flex', gap: 12, fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                                    <span><strong style={{ color: 'var(--text-primary)' }}>{u.follower_count || 0}</strong> {t('takipçi', 'followers')}</span>
                                                    <span><strong style={{ color: 'var(--text-primary)' }}>{u.following_count || 0}</strong> {t('takip', 'following')}</span>
                                                    <span><strong style={{ color: 'var(--text-primary)' }}>{u.checkin_count || 0}</strong> check-in</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </>
                    ) : (
                        /* ═══ RECENT CHECK-INS ═══ */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {recentCheckins.length === 0 && (
                                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
                                    {t('Henüz check-in yok', 'No check-ins yet')}
                                </div>
                            )}
                            {recentCheckins.map((c, i) => (
                                <motion.div key={c.id}
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        background: 'var(--bg-secondary)', borderRadius: 16,
                                        border: '1px solid var(--border)', padding: '12px 16px',
                                    }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '50%',
                                        background: c.profiles?.avatar_url ? `url(${c.profiles.avatar_url}) center/cover` : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#fff', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0,
                                    }} onClick={() => c.profiles?.username && router.push(`/u/${c.profiles.username}`)}>
                                        {!c.profiles?.avatar_url && (c.profiles?.display_name?.[0] || '?')}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                            <span style={{ cursor: 'pointer' }} onClick={() => c.profiles?.username && router.push(`/u/${c.profiles.username}`)}>
                                                {c.profiles?.display_name || 'User'}
                                            </span>
                                            <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}> — </span>
                                            <span style={{ color: '#4F46E5' }}>{c.emoji} {c.place_name}</span>
                                        </div>
                                        {c.note && <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.note}</p>}
                                    </div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                                        {c.city && <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><MapPin size={10} />{c.city}</span>}
                                        <span>{timeAgo(c.created_at)}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
        </>
    )
}
