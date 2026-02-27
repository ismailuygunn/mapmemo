'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import Sidebar from '@/components/layout/Sidebar'
import { motion } from 'framer-motion'
import {
    MapPin, UserPlus, UserMinus, Loader2, Calendar, Star,
    Plane, ChevronRight, ArrowLeft, Users, Heart, Coffee
} from 'lucide-react'

const ACHIEVEMENTS = [
    { id: 'first_checkin', emoji: '📍', name: 'İlk Check-in', desc: '1 check-in yap', check: s => s.checkins >= 1 },
    { id: 'explorer_5', emoji: '🗺️', name: 'Kaşif', desc: '5 check-in', check: s => s.checkins >= 5 },
    { id: 'explorer_20', emoji: '🌍', name: 'Dünya Gezgini', desc: '20 check-in', check: s => s.checkins >= 20 },
    { id: 'popular', emoji: '⭐', name: 'Popüler', desc: '10+ takipçi', check: s => s.followers >= 10 },
    { id: 'social', emoji: '🤝', name: 'Sosyal', desc: '5+ arkadaş takip et', check: s => s.following >= 5 },
    { id: 'first_trip', emoji: '✈️', name: 'İlk Macera', desc: '1 trip oluştur', check: s => s.trips >= 1 },
    { id: 'planner', emoji: '📋', name: 'Plancı', desc: '5+ trip', check: s => s.trips >= 5 },
    { id: 'veteran', emoji: '🏆', name: 'Veteran', desc: '20+ trip', check: s => s.trips >= 20 },
]

export default function PublicProfilePage() {
    const params = useParams()
    const router = useRouter()
    const username = params.username

    const [profileData, setProfileData] = useState(null)
    const [checkins, setCheckins] = useState([])
    const [trips, setTrips] = useState([])
    const [loading, setLoading] = useState(true)
    const [isFollowing, setIsFollowing] = useState(false)
    const [followLoading, setFollowLoading] = useState(false)
    const [tab, setTab] = useState('checkins')

    const { user } = useAuth()
    const { locale } = useLanguage()
    const { toast } = useToast()
    const supabase = createClient()
    const t = (tr, en) => locale === 'tr' ? tr : en

    useEffect(() => {
        if (username) loadProfile()
    }, [username])

    const loadProfile = async () => {
        setLoading(true)
        try {
            // Get profile by username
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', username)
                .single()

            if (error || !profile) {
                setProfileData(null)
                setLoading(false)
                return
            }

            setProfileData(profile)

            // Check if current user follows this profile
            if (user && user.id !== profile.id) {
                const { data: followCheck } = await supabase
                    .from('follows')
                    .select('id')
                    .eq('follower_id', user.id)
                    .eq('following_id', profile.id)
                    .maybeSingle()
                setIsFollowing(!!followCheck)
            }

            // Get check-ins
            const res = await fetch(`/api/social/checkin?userId=${profile.id}&limit=20`)
            const checkinData = await res.json()
            setCheckins(checkinData.checkins || [])

            // Get trips count
            const { count } = await supabase
                .from('trips')
                .select('id', { count: 'exact', head: true })
                .eq('space_id', profile.id) // Approximate — may need space lookup
            // Since trips are per-space not per-user, we do a broader search
            // For now show check-in count as main stat

        } catch (err) {
            console.error('Profile load error:', err)
        }
        setLoading(false)
    }

    const handleFollow = async () => {
        if (!user || !profileData) return
        setFollowLoading(true)
        try {
            const res = await fetch('/api/social/follow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ followerId: user.id, followingId: profileData.id }),
            })
            const data = await res.json()
            setIsFollowing(data.followed)
            setProfileData(prev => ({
                ...prev,
                follower_count: data.followed
                    ? (prev.follower_count || 0) + 1
                    : Math.max((prev.follower_count || 0) - 1, 0)
            }))
            toast.success(data.followed ? '✅ Takip edildi!' : 'Takipten çıkıldı')
        } catch (err) { toast.error(err.message) }
        setFollowLoading(false)
    }

    const isOwnProfile = user?.id === profileData?.id

    const stats = {
        checkins: profileData?.checkin_count || 0,
        followers: profileData?.follower_count || 0,
        following: profileData?.following_count || 0,
        trips: 0,
        cities: [...new Set(checkins.map(c => c.city).filter(Boolean))].length,
    }

    const unlockedAchievements = ACHIEVEMENTS.filter(a => a.check(stats))

    const timeAgo = (date) => {
        const diff = Math.floor((Date.now() - new Date(date)) / 1000)
        if (diff < 60) return 'az önce'
        if (diff < 3600) return `${Math.floor(diff / 60)} dk`
        if (diff < 86400) return `${Math.floor(diff / 3600)} sa`
        return new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
    }

    if (loading) {
        return (
            <>
                <Sidebar />
                <div className="main-content">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                        <Loader2 size={32} className="spin" style={{ color: 'var(--primary-1)' }} />
                    </div>
                </div>
            </>
        )
    }

    if (!profileData) {
        return (
            <>
                <Sidebar />
                <div className="main-content">
                    <div style={{ textAlign: 'center', padding: 80 }}>
                        <div style={{ fontSize: 60, marginBottom: 16, opacity: 0.3 }}>👤</div>
                        <h2>{t('Kullanıcı bulunamadı', 'User not found')}</h2>
                        <button className="btn btn-primary" onClick={() => router.push('/discover')}>
                            <ArrowLeft size={14} /> {t('Keşfete Dön', 'Back to Discover')}
                        </button>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="page" style={{ maxWidth: 640, margin: '0 auto' }}>
                    {/* Back button */}
                    <button className="btn btn-ghost" onClick={() => router.back()}
                        style={{ marginBottom: 12, padding: '6px 10px' }}>
                        <ArrowLeft size={14} /> {t('Geri', 'Back')}
                    </button>

                    {/* ═══ PROFILE HERO ═══ */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                            borderRadius: 24, overflow: 'hidden',
                            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                            marginBottom: 20,
                        }}>
                        {/* Cover */}
                        <div style={{
                            height: 140,
                            background: profileData.cover_photo_url
                                ? `url(${profileData.cover_photo_url}) center/cover`
                                : 'linear-gradient(135deg, #4F46E5, #EC4899, #F59E0B)',
                        }} />

                        {/* Avatar + info */}
                        <div style={{ padding: '0 20px 20px', marginTop: -40 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
                                <div style={{
                                    width: 80, height: 80, borderRadius: '50%',
                                    background: profileData.avatar_url
                                        ? `url(${profileData.avatar_url}) center/cover`
                                        : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontWeight: 900, fontSize: '1.8rem',
                                    border: '4px solid var(--bg-secondary)',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                                }}>
                                    {!profileData.avatar_url && (profileData.display_name?.[0] || '?')}
                                </div>
                                <div style={{ flex: 1, marginBottom: 4 }}>
                                    <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
                                        {profileData.display_name || profileData.full_name || 'User'}
                                    </h1>
                                    {profileData.username && (
                                        <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>@{profileData.username}</p>
                                    )}
                                </div>
                                {user && !isOwnProfile && (
                                    <button onClick={handleFollow} disabled={followLoading}
                                        style={{
                                            padding: '8px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                            background: isFollowing ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                            color: isFollowing ? 'var(--text-secondary)' : '#fff',
                                            fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6,
                                            marginBottom: 4,
                                        }}>
                                        {followLoading ? <Loader2 size={14} className="spin" /> :
                                            isFollowing ? <><UserMinus size={14} /> {t('Takipte', 'Following')}</> : <><UserPlus size={14} /> {t('Takip Et', 'Follow')}</>
                                        }
                                    </button>
                                )}
                            </div>

                            {/* Bio */}
                            {profileData.bio && (
                                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '12px 0 0', lineHeight: 1.5 }}>
                                    {profileData.bio}
                                </p>
                            )}
                            {profileData.home_city && (
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <MapPin size={12} /> {profileData.home_city}
                                </p>
                            )}

                            {/* Stats */}
                            <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
                                {[
                                    { value: stats.checkins, label: 'Check-in' },
                                    { value: stats.followers, label: t('Takipçi', 'Followers') },
                                    { value: stats.following, label: t('Takip', 'Following') },
                                    { value: stats.cities, label: t('Şehir', 'Cities') },
                                ].map((s, i) => (
                                    <div key={i} style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* ═══ ACHIEVEMENTS ═══ */}
                    {unlockedAchievements.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{
                                display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20,
                                background: 'var(--bg-secondary)', borderRadius: 16,
                                border: '1px solid var(--border)', padding: 14,
                            }}>
                            {unlockedAchievements.map(a => (
                                <span key={a.id} title={a.desc}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                        padding: '4px 10px', borderRadius: 8,
                                        background: 'rgba(79,70,229,0.06)', fontSize: '0.75rem', fontWeight: 600,
                                    }}>
                                    {a.emoji} {a.name}
                                </span>
                            ))}
                        </motion.div>
                    )}

                    {/* ═══ TABS ═══ */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        {[
                            { key: 'checkins', icon: <MapPin size={14} />, label: `Check-in (${checkins.length})` },
                        ].map(tb => (
                            <button key={tb.key}
                                onClick={() => setTab(tb.key)}
                                style={{
                                    padding: '8px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                    background: tab === tb.key ? 'linear-gradient(135deg, #4F46E5, #7C3AED)' : 'var(--bg-tertiary)',
                                    color: tab === tb.key ? '#fff' : 'var(--text-secondary)',
                                    fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                {tb.icon} {tb.label}
                            </button>
                        ))}
                    </div>

                    {/* ═══ CHECK-INS LIST ═══ */}
                    {tab === 'checkins' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {checkins.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
                                    {t('Henüz check-in yok', 'No check-ins yet')}
                                </div>
                            ) : checkins.map((c, i) => (
                                <motion.div key={c.id}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    style={{
                                        background: 'var(--bg-secondary)', borderRadius: 16,
                                        border: '1px solid var(--border)', padding: '14px 16px',
                                    }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontSize: '1.2rem' }}>{c.emoji}</span>
                                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{c.place_name}</span>
                                        {c.city && (
                                            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                <MapPin size={10} /> {c.city}
                                            </span>
                                        )}
                                    </div>
                                    {c.note && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>{c.note}</p>}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                                        {c.rating > 0 && (
                                            <div style={{ display: 'flex', gap: 1 }}>
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star key={s} size={12} fill={s <= c.rating ? '#F59E0B' : 'none'} stroke={s <= c.rating ? '#F59E0B' : '#d1d5db'} />
                                                ))}
                                            </div>
                                        )}
                                        <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
                                            {timeAgo(c.created_at)}
                                        </span>
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
