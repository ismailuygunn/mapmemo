'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useSpace } from '@/context/SpaceContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import {
    Users, Plus, Loader2, UserPlus, Copy, Check, Crown, Shield,
    ArrowLeft, Plane, Calendar, Settings, Trash2, LogOut, Edit3,
    MapPin, Link2, RefreshCw, ChevronRight, Star, Eye, Pencil, X,
    Heart, Share2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/context/ToastContext'

const ROLE_COLORS = {
    owner: { bg: '#FBBF24', text: '#78350F', label: { tr: 'Yönetici', en: 'Owner' } },
    admin: { bg: '#D4A853', text: '#1A3A5C', label: { tr: 'Admin', en: 'Admin' } },
    editor: { bg: '#34D399', text: '#064E3B', label: { tr: 'Editör', en: 'Editor' } },
    viewer: { bg: '#94A3B8', text: '#1E293B', label: { tr: 'İzleyici', en: 'Viewer' } },
}

const GRADIENT_PALETTES = [
    ['#0F2847', '#D4A853'], ['#EC4899', '#F43F5E'], ['#0D9488', '#06B6D4'],
    ['#F59E0B', '#EF4444'], ['#8B5CF6', '#EC4899'], ['#10B981', '#3B82F6'],
]

const GROUP_TYPES = [
    { key: 'couple', emoji: '💑', label: { tr: 'Sevgili', en: 'Couple' }, desc: { tr: 'Birlikte keşfedin', en: 'Explore together' }, gradient: ['#EC4899', '#F43F5E'] },
    { key: 'friends', emoji: '👫', label: { tr: 'Arkadaşlar', en: 'Friends' }, desc: { tr: 'Arkadaşlarla macera', en: 'Adventure with friends' }, gradient: ['#0F2847', '#D4A853'] },
    { key: 'family', emoji: '👨‍👩‍👧‍👦', label: { tr: 'Aile', en: 'Family' }, desc: { tr: 'Aile gezileri', en: 'Family trips' }, gradient: ['#10B981', '#06B6D4'] },
    { key: 'solo', emoji: '🧳', label: { tr: 'Solo', en: 'Solo' }, desc: { tr: 'Kişisel haritam', en: 'My personal map' }, gradient: ['#F59E0B', '#EF4444'] },
]

export default function SpacesPage() {
    // ── State ──
    const [spaces, setSpaces] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedSpace, setSelectedSpace] = useState(null) // full space detail
    const [detailTab, setDetailTab] = useState('trips')
    const [spaceTrips, setSpaceTrips] = useState([])
    const [spaceMembers, setSpaceMembers] = useState([])
    const [tripsLoading, setTripsLoading] = useState(false)
    const [membersLoading, setMembersLoading] = useState(false)
    const [showCreate, setShowCreate] = useState(false)
    const [newName, setNewName] = useState('')
    const [newGroupType, setNewGroupType] = useState(null)
    const [joinToken, setJoinToken] = useState('')
    const [createMode, setCreateMode] = useState('type') // 'type' | 'name' | 'join'
    const [creating, setCreating] = useState(false)
    const [joining, setJoining] = useState(false)
    const [editingName, setEditingName] = useState(false)
    const [editName, setEditName] = useState('')
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState(null)

    const { user } = useAuth()
    const { space: activeSpace, createSpace, joinSpace: ctxJoinSpace, loadSpace: ctxLoadSpace, setSpace: setActiveSpace, setUserRole: setActiveUserRole } = useSpace()
    const { locale } = useLanguage()
    const { toast } = useToast()
    const supabase = createClient()
    const router = useRouter()
    const t = (tr, en) => locale === 'tr' ? tr : en

    useEffect(() => { if (user) loadSpaces() }, [user])

    // ── Load all spaces ──
    const loadSpaces = async () => {
        setLoading(true)
        setError(null)
        try {
            const { data: memberships, error: memErr } = await supabase
                .from('space_members')
                .select('space_id, role')
                .eq('user_id', user.id)

            if (memErr) {
                console.error('space_members query error:', memErr)
                // Don't block - show empty state with option to create
                if (memErr.message?.includes('infinite recursion') || memErr.code === '42P17') {
                    setError('RLS')
                } else {
                    setError(memErr.message)
                }
                // Fallback: use SpaceContext space if available
                if (activeSpace) {
                    setSpaces([{
                        ...activeSpace,
                        role: 'owner',
                        tripCount: 0,
                        memberCount: 1,
                    }])
                } else {
                    setSpaces([])
                }
                setLoading(false)
                return
            }

            if (memberships && memberships.length > 0) {
                const spaceIds = memberships.map(m => m.space_id)
                const { data: spacesData, error: spErr } = await supabase
                    .from('spaces')
                    .select('*')
                    .in('id', spaceIds)

                if (spErr) {
                    console.error('spaces query error:', spErr)
                    setError(spErr.message)
                    setSpaces([])
                    setLoading(false)
                    return
                }

                if (spacesData) {
                    const list = spacesData.map(s => ({
                        ...s,
                        role: memberships.find(m => m.space_id === s.id)?.role || 'viewer'
                    }))
                    setSpaces(list)

                    // Get counts in parallel
                    const countPromises = list.map(async (s) => {
                        const [tripCount, memberCount] = await Promise.all([
                            supabase.from('trips').select('id', { count: 'exact', head: true }).eq('space_id', s.id).then(r => r.count || 0),
                            supabase.from('space_members').select('id', { count: 'exact', head: true }).eq('space_id', s.id).then(r => r.count || 0),
                        ])
                        s.tripCount = tripCount
                        s.memberCount = memberCount
                    })
                    await Promise.allSettled(countPromises)
                    setSpaces([...list])
                }
            } else {
                setSpaces([])
            }
        } catch (err) {
            console.error('Load spaces error:', err)
            setError(err.message)
        }
        setLoading(false)
    }

    // ── Open group detail ──
    const openGroupDetail = async (s) => {
        setSelectedSpace(s)
        setDetailTab('trips')
        loadGroupTrips(s.id)
        loadGroupMembers(s.id)
    }

    const loadGroupTrips = async (spaceId) => {
        setTripsLoading(true)
        const { data } = await supabase
            .from('trips')
            .select('*')
            .eq('space_id', spaceId)
            .order('created_at', { ascending: false })
        setSpaceTrips(data || [])
        setTripsLoading(false)
    }

    const loadGroupMembers = async (spaceId) => {
        setMembersLoading(true)
        const { data } = await supabase
            .from('space_members')
            .select('user_id, role, joined_at, profiles(display_name, avatar_url, email, full_name)')
            .eq('space_id', spaceId)
            .order('joined_at', { ascending: true })
        setSpaceMembers(data || [])
        setMembersLoading(false)
    }

    // ── Actions ──
    const handleCreateSpace = async () => {
        if (!newName.trim()) return
        setCreating(true)
        const typeInfo = newGroupType ? GROUP_TYPES.find(g => g.key === newGroupType) : null
        const finalName = typeInfo ? `${typeInfo.emoji} ${newName.trim()}` : newName.trim()
        try {
            await createSpace(finalName)
            setNewName('')
            setNewGroupType(null)
            setShowCreate(false)
            setCreateMode('type')
            toast.success(t('Grup oluşturuldu!', 'Group created!'))
            loadSpaces()
        } catch (err) { toast.error(err.message) }
        setCreating(false)
    }

    const handleJoinSpace = async () => {
        if (!joinToken.trim()) return
        setJoining(true)
        try {
            await ctxJoinSpace(joinToken.trim())
            setJoinToken('')
            setShowCreate(false)
            toast.success(t('Gruba katıldın!', 'Joined group!'))
            loadSpaces()
        } catch (err) { toast.error(err.message) }
        setJoining(false)
    }

    const switchToSpace = (s) => {
        if (setActiveSpace) setActiveSpace(s)
        if (setActiveUserRole) setActiveUserRole(s.role)
        toast.success(`✅ ${s.name} ${t('aktif edildi', 'activated')}`)
    }

    const copyInviteLink = (token) => {
        if (!token) return
        const link = `${window.location.origin}/invite/${token}`
        navigator.clipboard?.writeText(link)
        setCopied(true)
        toast.success(t('Davet linki kopyalandı!', 'Invite link copied!'))
        setTimeout(() => setCopied(false), 2000)
    }

    const changeRole = async (memberId, newRole) => {
        try {
            const { error } = await supabase
                .from('space_members')
                .update({ role: newRole })
                .eq('user_id', memberId)
                .eq('space_id', selectedSpace.id)
            if (error) throw error
            toast.success(t('Rol güncellendi', 'Role updated'))
            loadGroupMembers(selectedSpace.id)
        } catch (err) { toast.error(err.message) }
    }

    const removeMember = async (memberId) => {
        if (!confirm(t('Bu üyeyi çıkarmak istediğine emin misin?', 'Are you sure you want to remove this member?'))) return
        try {
            const { error } = await supabase
                .from('space_members')
                .delete()
                .eq('user_id', memberId)
                .eq('space_id', selectedSpace.id)
            if (error) throw error
            toast.success(t('Üye çıkarıldı', 'Member removed'))
            loadGroupMembers(selectedSpace.id)
        } catch (err) { toast.error(err.message) }
    }

    const updateGroupName = async () => {
        if (!editName.trim()) return
        try {
            const { error } = await supabase
                .from('spaces')
                .update({ name: editName.trim() })
                .eq('id', selectedSpace.id)
            if (error) throw error
            setSelectedSpace(prev => ({ ...prev, name: editName.trim() }))
            setEditingName(false)
            toast.success(t('Grup adı güncellendi', 'Group name updated'))
            loadSpaces()
        } catch (err) { toast.error(err.message) }
    }

    const leaveGroup = async () => {
        if (!confirm(t('Bu gruptan ayrılmak istediğine emin misin?', 'Are you sure you want to leave this group?'))) return
        try {
            const { error } = await supabase
                .from('space_members')
                .delete()
                .eq('user_id', user.id)
                .eq('space_id', selectedSpace.id)
            if (error) throw error
            toast.success(t('Gruptan ayrıldın', 'Left group'))
            setSelectedSpace(null)
            loadSpaces()
        } catch (err) { toast.error(err.message) }
    }

    const deleteGroup = async () => {
        if (!confirm(t('Bu grubu silmek istediğine emin misin? Tüm veriler silinecek!', 'Delete this group? All data will be lost!'))) return
        try {
            const { error } = await supabase
                .from('spaces')
                .delete()
                .eq('id', selectedSpace.id)
            if (error) throw error
            toast.success(t('Grup silindi', 'Group deleted'))
            setSelectedSpace(null)
            loadSpaces()
        } catch (err) { toast.error(err.message) }
    }

    // Helper
    const getGradient = (i) => {
        const p = GRADIENT_PALETTES[i % GRADIENT_PALETTES.length]
        return `linear-gradient(135deg, ${p[0]}, ${p[1]})`
    }

    const getInitials = (name) => {
        if (!name) return '?'
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    }

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' }) : ''
    const fmtDateFull = (d) => d ? new Date(d).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

    // ═══════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════
    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="groups-hub">
                    {/* Error Banner */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            style={{
                                padding: '12px 16px', marginBottom: 16,
                                background: error === 'RLS' ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.1)',
                                border: `1px solid ${error === 'RLS' ? 'rgba(251,191,36,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10,
                                fontSize: '0.82rem', color: error === 'RLS' ? 'var(--warning)' : 'var(--error)',
                            }}
                        >
                            <span>⚠️</span>
                            <span style={{ flex: 1 }}>
                                {error === 'RLS'
                                    ? t('Veritabanı izin hatası oluştu. Grup oluşturabilir veya katılabilirsiniz.', 'Database permission error. You can still create or join groups.')
                                    : `${t('Hata', 'Error')}: ${error}`}
                            </span>
                            <button onClick={loadSpaces} style={{
                                background: 'none', border: '1px solid currentColor',
                                borderRadius: 8, padding: '4px 12px', color: 'inherit',
                                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                            }}>
                                <RefreshCw size={12} /> {t('Tekrar Dene', 'Retry')}
                            </button>
                        </motion.div>
                    )}
                    <AnimatePresence mode="wait">
                        {selectedSpace ? (
                            // ═══ GROUP DETAIL VIEW ═══
                            <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                                {/* Back + Header */}
                                <div className="gh-detail-header">
                                    <button className="btn btn-ghost" onClick={() => setSelectedSpace(null)} style={{ padding: '6px 10px' }}>
                                        <ArrowLeft size={16} /> {t('Gruplar', 'Groups')}
                                    </button>
                                    <div className="gh-detail-title-row">
                                        <div className="gh-detail-avatar" style={{ background: getGradient(spaces.indexOf(selectedSpace)) }}>
                                            {getInitials(selectedSpace.name)}
                                        </div>
                                        <div>
                                            <h1 className="gh-detail-name">{selectedSpace.name}</h1>
                                            <div className="gh-detail-meta">
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                                    <Users size={12} /> {spaceMembers.length} {t('üye', 'members')}
                                                </span>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                                    <Plane size={12} /> {spaceTrips.length} {t('seyahat', 'trips')}
                                                </span>
                                                <span className={`gh-role-badge gh-role-${selectedSpace.role}`}>
                                                    {ROLE_COLORS[selectedSpace.role]?.label[locale] || selectedSpace.role}
                                                </span>
                                            </div>
                                        </div>
                                        {activeSpace?.id !== selectedSpace.id && (
                                            <button className="btn btn-primary" style={{ marginLeft: 'auto', fontSize: '0.78rem', padding: '6px 14px' }}
                                                onClick={() => switchToSpace(selectedSpace)}>
                                                {t('Bu Grubu Kullan', 'Use This Group')}
                                            </button>
                                        )}
                                        {activeSpace?.id === selectedSpace.id && (
                                            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--primary-1)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Check size={14} /> {t('Aktif Grup', 'Active Group')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="gh-tabs">
                                    {[
                                        { key: 'trips', icon: <Plane size={15} />, label: t('Seyahatler', 'Trips') },
                                        { key: 'members', icon: <Users size={15} />, label: t('Üyeler', 'Members') },
                                        { key: 'settings', icon: <Settings size={15} />, label: t('Ayarlar', 'Settings') },
                                    ].map(tab => (
                                        <button key={tab.key}
                                            className={`gh-tab ${detailTab === tab.key ? 'gh-tab-active' : ''}`}
                                            onClick={() => setDetailTab(tab.key)}>
                                            {tab.icon} {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* ── TRIPS TAB ── */}
                                {detailTab === 'trips' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        {tripsLoading ? (
                                            <div className="gh-loading"><Loader2 size={24} className="spin" /></div>
                                        ) : spaceTrips.length === 0 ? (
                                            <div className="gh-empty">
                                                <Plane size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
                                                <p style={{ fontWeight: 600 }}>{t('Henüz seyahat planı yok', 'No trips yet')}</p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                                    {t('Planlayıcıdan bir seyahat oluştur ve bu gruba kaydet', 'Create a trip from the Planner and save to this group')}
                                                </p>
                                                <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => router.push('/planner')}>
                                                    <Plus size={14} /> {t('Seyahat Planla', 'Plan a Trip')}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="gh-trips-grid">
                                                {spaceTrips.map((trip, i) => (
                                                    <motion.div key={trip.id} className="gh-trip-card"
                                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        onClick={() => router.push(`/trip/${trip.id}`)}
                                                        whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
                                                        <div className="gh-trip-cover" style={{
                                                            background: trip.cover_url || trip.hero_image_url || trip.cover_photo_url
                                                                ? `url(${trip.cover_url || trip.hero_image_url || trip.cover_photo_url}) center/cover`
                                                                : getGradient(i)
                                                        }}>
                                                            <div className="gh-trip-city-overlay">{trip.city || t('Bilinmeyen', 'Unknown')}</div>
                                                        </div>
                                                        <div className="gh-trip-body">
                                                            <h3 className="gh-trip-title">{trip.city || t('Seyahat', 'Trip')}</h3>
                                                            {(trip.start_date || trip.end_date) && (
                                                                <div className="gh-trip-dates">
                                                                    <Calendar size={12} />
                                                                    {fmtDate(trip.start_date)}
                                                                    {trip.end_date && ` — ${fmtDate(trip.end_date)}`}
                                                                </div>
                                                            )}
                                                            <div className="gh-trip-tags">
                                                                {trip.tempo && <span className="gh-trip-tag">{trip.tempo}</span>}
                                                                {trip.budget && <span className="gh-trip-tag">{trip.budget}</span>}
                                                            </div>
                                                            {trip.itinerary_data?.overview && (
                                                                <p className="gh-trip-overview">{trip.itinerary_data.overview.slice(0, 100)}...</p>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* ── MEMBERS TAB ── */}
                                {detailTab === 'members' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        {membersLoading ? (
                                            <div className="gh-loading"><Loader2 size={24} className="spin" /></div>
                                        ) : (
                                            <div className="gh-members-list">
                                                {spaceMembers.map((m, i) => {
                                                    const profile = m.profiles || {}
                                                    const name = profile.full_name || profile.display_name || profile.email || 'User'
                                                    const isOwner = selectedSpace.role === 'owner'
                                                    const isMe = m.user_id === user.id
                                                    return (
                                                        <motion.div key={m.user_id} className="gh-member-row"
                                                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: i * 0.04 }}>
                                                            <div className="gh-member-avatar" style={{ background: getGradient(i) }}>
                                                                {profile.avatar_url
                                                                    ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                                                    : getInitials(name)
                                                                }
                                                            </div>
                                                            <div className="gh-member-info">
                                                                <div className="gh-member-name">
                                                                    {name}
                                                                    {isMe && <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginLeft: 4 }}>({t('Sen', 'You')})</span>}
                                                                </div>
                                                                <div className="gh-member-meta">
                                                                    {profile.email && <span>{profile.email}</span>}
                                                                    <span>{t('Katılım', 'Joined')}: {fmtDateFull(m.joined_at)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="gh-member-actions">
                                                                {isOwner && !isMe ? (
                                                                    <>
                                                                        <select className="gh-role-select" value={m.role}
                                                                            onChange={e => changeRole(m.user_id, e.target.value)}>
                                                                            <option value="admin">Admin</option>
                                                                            <option value="editor">{t('Editör', 'Editor')}</option>
                                                                            <option value="viewer">{t('İzleyici', 'Viewer')}</option>
                                                                        </select>
                                                                        <button className="btn btn-ghost" style={{ color: 'var(--error)', padding: '4px 8px' }}
                                                                            onClick={() => removeMember(m.user_id)} title={t('Çıkar', 'Remove')}>
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <span className={`gh-role-badge gh-role-${m.role}`}>
                                                                        {m.role === 'owner' && <Crown size={11} />}
                                                                        {ROLE_COLORS[m.role]?.label[locale] || m.role}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )
                                                })}

                                                {/* Invite Section */}
                                                <div className="gh-invite-section">
                                                    <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem' }}>🔗 {t('Birini Davet Et', 'Invite Someone')}</h4>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '0 0 10px' }}>
                                                        {t('Bu linki paylaşarak gruba davet et', 'Share this link to invite to the group')}
                                                    </p>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <input className="input" readOnly
                                                            value={selectedSpace.invite_code ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${selectedSpace.invite_code}` : ''}
                                                            style={{ flex: 1, fontSize: '0.78rem' }} />
                                                        <button className="btn btn-primary" onClick={() => copyInviteLink(selectedSpace.invite_code)}>
                                                            {copied ? <Check size={14} /> : <Copy size={14} />}
                                                            {copied ? t('Kopyalandı!', 'Copied!') : t('Kopyala', 'Copy')}
                                                        </button>
                                                    </div>
                                                    {/* Share via native share API */}
                                                    {typeof navigator !== 'undefined' && navigator.share && (
                                                        <button className="btn btn-secondary" style={{ marginTop: 10, width: '100%' }}
                                                            onClick={() => {
                                                                const link = `${window.location.origin}/invite/${selectedSpace.invite_code}`
                                                                navigator.share({
                                                                    title: `${selectedSpace.name} - UMAE`,
                                                                    text: t('Bu gruba katıl!', 'Join this group!'),
                                                                    url: link,
                                                                }).catch(() => { })
                                                            }}>
                                                            <Share2 size={14} /> {t('Paylaş', 'Share')}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* ── SETTINGS TAB ── */}
                                {detailTab === 'settings' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <div className="gh-settings">
                                            {/* Group Name */}
                                            <div className="gh-settings-section">
                                                <h3>{t('Grup Adı', 'Group Name')}</h3>
                                                {editingName ? (
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <input className="input" value={editName} onChange={e => setEditName(e.target.value)}
                                                            style={{ flex: 1 }} onKeyDown={e => e.key === 'Enter' && updateGroupName()} />
                                                        <button className="btn btn-primary" onClick={updateGroupName}><Check size={14} /></button>
                                                        <button className="btn btn-ghost" onClick={() => setEditingName(false)}>✕</button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{selectedSpace.name}</span>
                                                        {selectedSpace.role === 'owner' && (
                                                            <button className="btn btn-ghost" style={{ padding: '4px 8px' }}
                                                                onClick={() => { setEditName(selectedSpace.name); setEditingName(true) }}>
                                                                <Pencil size={13} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Invite Link */}
                                            <div className="gh-settings-section">
                                                <h3>🔗 {t('Davet Linki', 'Invite Link')}</h3>
                                                <div className="gh-invite-link-box">
                                                    <code style={{ fontSize: '0.72rem', wordBreak: 'break-all' }}>
                                                        {typeof window !== 'undefined' ? window.location.origin : ''}/invite/{selectedSpace.invite_code}
                                                    </code>
                                                </div>
                                                <button className="btn btn-secondary" style={{ marginTop: 8 }}
                                                    onClick={() => copyInviteLink(selectedSpace.invite_code)}>
                                                    <Copy size={14} /> {t('Linki Kopyala', 'Copy Link')}
                                                </button>
                                            </div>

                                            {/* Group Info */}
                                            <div className="gh-settings-section">
                                                <h3>📊 {t('Grup Bilgileri', 'Group Info')}</h3>
                                                <div className="gh-info-grid">
                                                    <div className="gh-info-item">
                                                        <span className="gh-info-label">{t('Oluşturulma', 'Created')}</span>
                                                        <span className="gh-info-value">{fmtDateFull(selectedSpace.created_at)}</span>
                                                    </div>
                                                    <div className="gh-info-item">
                                                        <span className="gh-info-label">{t('Üye Sayısı', 'Members')}</span>
                                                        <span className="gh-info-value">{spaceMembers.length}</span>
                                                    </div>
                                                    <div className="gh-info-item">
                                                        <span className="gh-info-label">{t('Seyahat Sayısı', 'Trips')}</span>
                                                        <span className="gh-info-value">{spaceTrips.length}</span>
                                                    </div>
                                                    <div className="gh-info-item">
                                                        <span className="gh-info-label">{t('Ziyaret Edilen Şehirler', 'Cities Visited')}</span>
                                                        <span className="gh-info-value">{[...new Set(spaceTrips.map(t => t.city).filter(Boolean))].length}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Danger Zone */}
                                            <div className="gh-settings-section gh-danger-zone">
                                                <h3>⚠️ {t('Tehlikeli Bölge', 'Danger Zone')}</h3>
                                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                    <button className="btn gh-btn-danger" onClick={leaveGroup}>
                                                        <LogOut size={14} /> {t('Gruptan Ayrıl', 'Leave Group')}
                                                    </button>
                                                    {selectedSpace.role === 'owner' && (
                                                        <button className="btn gh-btn-danger-fill" onClick={deleteGroup}>
                                                            <Trash2 size={14} /> {t('Grubu Sil', 'Delete Group')}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        ) : (
                            // ═══ GROUPS LIST VIEW ═══
                            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}>
                                <div className="gh-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <img src="/umae-icon.png" alt="UMAE" style={{ width: 32, height: 32, borderRadius: 8 }} />
                                        <div>
                                            <h1 className="gh-title">{t('Seyahat Ekipleri', 'Travel Teams')}</h1>
                                            <p className="gh-subtitle">{t('Sevgilin, arkadaşların veya ailen ile seyahat planla', 'Plan trips with your partner, friends or family')}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn btn-secondary" onClick={() => { setShowCreate(true); setCreateMode('join') }}>
                                            <Link2 size={14} /> {t('Katıl', 'Join')}
                                        </button>
                                        <button className="btn btn-primary" onClick={() => { setShowCreate(true); setCreateMode('type') }}>
                                            <Plus size={16} /> {t('Yeni Grup', 'New Group')}
                                        </button>
                                    </div>
                                </div>

                                {/* Create/Join Panel */}
                                <AnimatePresence>
                                    {showCreate && (
                                        <motion.div className="gh-create-panel"
                                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                            <div className="gh-create-inner">
                                                {createMode === 'type' && (
                                                    <div style={{ width: '100%' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                                            <h3 style={{ margin: 0 }}>✨ {t('Ne tür bir grup?', 'What type of group?')}</h3>
                                                            <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowCreate(false)}>
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                                                            {GROUP_TYPES.map(gt => (
                                                                <motion.button key={gt.key}
                                                                    className={`gh-type-card ${newGroupType === gt.key ? 'gh-type-card-active' : ''}`}
                                                                    onClick={() => { setNewGroupType(gt.key); setCreateMode('name') }}
                                                                    whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                                                                    style={{ background: newGroupType === gt.key ? `linear-gradient(135deg, ${gt.gradient[0]}20, ${gt.gradient[1]}20)` : 'var(--bg-tertiary)' }}
                                                                >
                                                                    <span style={{ fontSize: '1.8rem' }}>{gt.emoji}</span>
                                                                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{gt.label[locale]}</span>
                                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{gt.desc[locale]}</span>
                                                                </motion.button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {createMode === 'name' && (
                                                    <div style={{ width: '100%' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                                            <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setCreateMode('type')}>
                                                                <ArrowLeft size={14} /> {t('Geri', 'Back')}
                                                            </button>
                                                            <span style={{ fontSize: '1.2rem' }}>{GROUP_TYPES.find(g => g.key === newGroupType)?.emoji}</span>
                                                        </div>
                                                        <h3 style={{ margin: '0 0 12px' }}>
                                                            {t('Grubuna bir isim ver', 'Name your group')}
                                                        </h3>
                                                        <div style={{ display: 'flex', gap: 8 }}>
                                                            <input className="input" placeholder={t(
                                                                newGroupType === 'couple' ? 'örn: Roma Tatilimiz' :
                                                                    newGroupType === 'friends' ? 'örn: Yolculuk Ekibi' :
                                                                        newGroupType === 'family' ? 'örn: Aile Gezisi' : 'örn: Benim Haritam',
                                                                newGroupType === 'couple' ? 'e.g. Our Rome Trip' :
                                                                    newGroupType === 'friends' ? 'e.g. Road Trip Crew' :
                                                                        newGroupType === 'family' ? 'e.g. Family Vacation' : 'e.g. My Map'
                                                            )}
                                                                value={newName} onChange={e => setNewName(e.target.value)}
                                                                onKeyDown={e => e.key === 'Enter' && handleCreateSpace()}
                                                                style={{ flex: 1 }} autoFocus />
                                                            <button className="btn btn-primary" onClick={handleCreateSpace} disabled={creating || !newName.trim()}>
                                                                {creating ? <Loader2 size={14} className="spin" /> : <Check size={14} />}
                                                                {t('Oluştur', 'Create')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {createMode === 'join' && (
                                                    <div style={{ width: '100%' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                                            <h3 style={{ margin: 0 }}>🔗 {t('Davet ile Katıl', 'Join with Invite')}</h3>
                                                            <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowCreate(false)}>
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', margin: '0 0 12px' }}>
                                                            {t('Arkadaşından aldığın davet linkini veya tokenını yapıştır', 'Paste the invite link or token from your friend')}
                                                        </p>
                                                        <div style={{ display: 'flex', gap: 8 }}>
                                                            <input className="input" placeholder={t('Davet linki veya token...', 'Invite link or token...')}
                                                                value={joinToken} onChange={e => setJoinToken(e.target.value)}
                                                                onKeyDown={e => e.key === 'Enter' && handleJoinSpace()}
                                                                style={{ flex: 1 }} autoFocus />
                                                            <button className="btn btn-primary" onClick={handleJoinSpace} disabled={joining || !joinToken.trim()}>
                                                                {joining ? <Loader2 size={14} className="spin" /> : <UserPlus size={14} />}
                                                                {t('Katıl', 'Join')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Groups Grid */}
                                {loading ? (
                                    <div className="gh-loading"><Loader2 size={28} className="spin" /></div>
                                ) : spaces.length === 0 ? (
                                    <div className="gh-empty">
                                        <img src="/umae-icon.png" alt="UMAE" style={{ width: 52, height: 52, borderRadius: 14, opacity: 0.4, marginBottom: 12 }} />
                                        <p style={{ fontWeight: 600, fontSize: '1rem' }}>{t('Henüz ekibin yok', 'No teams yet')}</p>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', maxWidth: 320, margin: '4px auto 16px' }}>
                                            {t('Sevgilinle, arkadaşlarınla veya ailenle seyahat planla', 'Plan trips with your partner, friends or family')}
                                        </p>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                                            <button className="btn btn-primary" onClick={() => { setShowCreate(true); setCreateMode('type') }}>
                                                <Plus size={14} /> {t('Ekip Oluştur', 'Create Team')}
                                            </button>
                                            <button className="btn btn-secondary" onClick={() => { setShowCreate(true); setCreateMode('join') }}>
                                                <Link2 size={14} /> {t('Ekibe Katıl', 'Join Team')}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="gh-grid">
                                        {spaces.map((s, i) => (
                                            <motion.div key={s.id} className={`gh-card ${activeSpace?.id === s.id ? 'gh-card-active' : ''}`}
                                                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.06 }}
                                                onClick={() => openGroupDetail(s)}
                                                whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
                                                <div className="gh-card-top" style={{ background: getGradient(i) }}>
                                                    <span className="gh-card-initial">{getInitials(s.name)}</span>
                                                    {activeSpace?.id === s.id && (
                                                        <span className="gh-card-active-badge">{t('Aktif', 'Active')}</span>
                                                    )}
                                                </div>
                                                <div className="gh-card-body">
                                                    <div className="gh-card-name-row">
                                                        <h3 className="gh-card-name">{s.name}</h3>
                                                        {s.role === 'owner' && <Crown size={13} style={{ color: '#FBBF24' }} />}
                                                    </div>
                                                    <div className="gh-card-stats">
                                                        <span><Plane size={12} /> {s.tripCount ?? 0} {t('seyahat', 'trips')}</span>
                                                        <span><Users size={12} /> {s.memberCount ?? 0} {t('üye', 'members')}</span>
                                                    </div>
                                                    <div className="gh-card-footer">
                                                        <span className={`gh-role-badge gh-role-${s.role}`}>
                                                            {ROLE_COLORS[s.role]?.label[locale] || s.role}
                                                        </span>
                                                        <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    )
}
