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
    Users, UserPlus, UserMinus, MapPin, Loader2, Heart, Search,
    ChevronRight, MessageCircle, Sparkles, Star
} from 'lucide-react'

export default function FriendsPage() {
    const [tab, setTab] = useState('following')
    const [following, setFollowing] = useState([])
    const [followers, setFollowers] = useState([])
    const [suggestions, setSuggestions] = useState([])
    const [loading, setLoading] = useState(true)
    const [followLoading, setFollowLoading] = useState({})
    const [search, setSearch] = useState('')

    const { user } = useAuth()
    const { locale } = useLanguage()
    const { toast } = useToast()
    const router = useRouter()
    const supabase = createClient()
    const t = (tr, en) => locale === 'tr' ? tr : en

    useEffect(() => {
        if (user) loadAll()
    }, [user])

    const loadAll = async () => {
        setLoading(true)
        try {
            const authH = await getAuthHeaders()

            // Get following
            const fRes = await fetch(`/api/social/follow?userId=${user.id}&type=following`, { headers: authH })
            const fData = await fRes.json()
            setFollowing(fData.users || [])

            // Get followers
            const rRes = await fetch(`/api/social/follow?userId=${user.id}&type=followers`, { headers: authH })
            const rData = await rRes.json()
            setFollowers(rData.users || [])

            // Get suggestions (users you don't follow)
            const { data: allProfiles } = await supabase
                .from('profiles')
                .select('id, display_name, username, avatar_url, bio, home_city, follower_count, checkin_count')
                .neq('id', user.id)
                .order('follower_count', { ascending: false })
                .limit(60)

            const followingIds = new Set((fData.users || []).map(u => u.id))
            setSuggestions((allProfiles || []).filter(p => !followingIds.has(p.id)).slice(0, 20))
        } catch (err) {
            console.error('Friends load err:', err)
        }
        setLoading(false)
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
                toast.success('✅ Takip edildi!')
            } else {
                toast.success('Takipten çıkıldı')
            }
            await loadAll()
        } catch (err) { toast.error(err.message) }
        setFollowLoading(prev => ({ ...prev, [targetId]: false }))
    }

    const followingIds = new Set(following.map(u => u.id))

    const filterList = (list) => {
        if (!search.trim()) return list
        const q = search.toLowerCase()
        return list.filter(u =>
            (u.display_name || '').toLowerCase().includes(q) ||
            (u.username || '').toLowerCase().includes(q) ||
            (u.home_city || '').toLowerCase().includes(q)
        )
    }

    const UserCard = ({ u, showFollowBtn = true, i = 0 }) => {
        const isFollowing = followingIds.has(u.id)
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ y: -2 }}
                style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'var(--bg-secondary)', borderRadius: 16,
                    border: '1px solid var(--border)', padding: '14px 16px',
                    cursor: 'pointer', transition: 'all 200ms',
                }}
                onClick={() => u.username && router.push(`/u/${u.username}`)}
            >
                <div style={{
                    width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                    background: u.avatar_url ? `url(${u.avatar_url}) center/cover` : `linear-gradient(135deg, ${['#0F2847', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6'][i % 5]}, ${['#D4A853', '#F43F5E', '#06B6D4', '#EF4444', '#EC4899'][i % 5]})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: '1rem',
                }}>
                    {!u.avatar_url && (u.display_name?.[0] || '?')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{u.display_name || 'User'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {u.username && <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>@{u.username}</span>}
                        {u.home_city && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <MapPin size={10} /> {u.home_city}
                            </span>
                        )}
                    </div>
                    {u.bio && (
                        <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.bio}
                        </p>
                    )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    {showFollowBtn && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleFollow(u.id) }}
                            disabled={followLoading[u.id]}
                            style={{
                                padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                background: isFollowing ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #0F2847, #1A3A5C)',
                                color: isFollowing ? 'var(--text-secondary)' : '#fff',
                                fontWeight: 700, fontSize: '0.73rem', display: 'flex', alignItems: 'center', gap: 4,
                                transition: 'all 200ms', whiteSpace: 'nowrap',
                            }}
                        >
                            {followLoading[u.id] ? <Loader2 size={12} className="spin" /> :
                                isFollowing ? <><UserMinus size={12} /> {t('Takipte', 'Following')}</> : <><UserPlus size={12} /> {t('Takip Et', 'Follow')}</>
                            }
                        </button>
                    )}
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', display: 'flex', gap: 8 }}>
                        {(u.checkin_count > 0 || u.follower_count > 0) && (
                            <>
                                {u.checkin_count > 0 && <span>{u.checkin_count} check-in</span>}
                                {u.follower_count > 0 && <span>{u.follower_count} {t('takipçi', 'followers')}</span>}
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        )
    }

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="page" style={{ maxWidth: 700, margin: '0 auto' }}>
                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                        style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <img src="/umae-icon.png?v=3" alt="UMAE" style={{ width: 36, height: 36, borderRadius: 10 }} />
                        </div>
                        <h1 style={{
                            fontSize: '1.6rem', fontWeight: 900, margin: '0 0 4px',
                            background: 'linear-gradient(135deg, #EC4899, #0F2847)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            ❤️ {t('Arkadaşlar', 'Friends')}
                        </h1>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: 0 }}>
                            {t('Takip ettiğin ve seni takip eden gezginler', 'Travelers you follow and your followers')}
                        </p>
                    </motion.div>

                    {/* Search */}
                    <div style={{ position: 'relative', marginBottom: 16 }}>
                        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input className="input" placeholder={t('Arkadaş ara...', 'Search friends...')}
                            value={search} onChange={e => setSearch(e.target.value)}
                            style={{ paddingLeft: 40, fontSize: '0.88rem' }} />
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                        {[
                            { key: 'following', icon: <Heart size={14} />, label: `${t('Takip', 'Following')} (${following.length})` },
                            { key: 'followers', icon: <Users size={14} />, label: `${t('Takipçi', 'Followers')} (${followers.length})` },
                            { key: 'suggestions', icon: <Sparkles size={14} />, label: t('Öneriler', 'Suggestions') },
                        ].map(tb => (
                            <button key={tb.key}
                                onClick={() => setTab(tb.key)}
                                style={{
                                    padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                    background: tab === tb.key ? 'linear-gradient(135deg, #0F2847, #1A3A5C)' : 'var(--bg-tertiary)',
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
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {tab === 'following' && (
                                filterList(following).length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
                                        <div style={{ fontSize: 48, opacity: 0.3, marginBottom: 8 }}>👥</div>
                                        {search ? t('Sonuç bulunamadı', 'No results') : t('Henüz kimseyi takip etmiyorsun', 'You are not following anyone yet')}
                                        <br />
                                        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => router.push('/discover')}>
                                            <Sparkles size={14} /> {t('Gezgin Keşfet', 'Discover Travelers')}
                                        </button>
                                    </div>
                                ) : filterList(following).map((u, i) => <UserCard key={u.id} u={u} i={i} />)
                            )}

                            {tab === 'followers' && (
                                filterList(followers).length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
                                        <div style={{ fontSize: 48, opacity: 0.3, marginBottom: 8 }}>🤝</div>
                                        {search ? t('Sonuç bulunamadı', 'No results') : t('Henüz takipçin yok', 'No followers yet')}
                                    </div>
                                ) : filterList(followers).map((u, i) => <UserCard key={u.id} u={u} i={i} />)
                            )}

                            {tab === 'suggestions' && (
                                filterList(suggestions).length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
                                        {t('Tüm gezginleri takip ediyorsun!', 'You follow everyone!')}
                                    </div>
                                ) : filterList(suggestions).map((u, i) => <UserCard key={u.id} u={u} i={i} />)
                            )}
                        </div>
                    )}
                </div>
            </div>
            <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
        </>
    )
}
