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
    MapPin, Link2, RefreshCw, ChevronRight, Star, Eye, Pencil
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

const ROLE_COLORS = {
    owner: { bg: '#FBBF24', text: '#92400E', label: { tr: 'Yönetici', en: 'Owner' } },
    admin: { bg: '#818CF8', text: '#312E81', label: { tr: 'Admin', en: 'Admin' } },
    editor: { bg: '#34D399', text: '#064E3B', label: { tr: 'Editör', en: 'Editor' } },
    viewer: { bg: '#94A3B8', text: '#1E293B', label: { tr: 'İzleyici', en: 'Viewer' } },
}

const GRADIENT_PALETTES = [
    ['#4F46E5', '#7C3AED'], ['#EC4899', '#F43F5E'], ['#0D9488', '#06B6D4'],
    ['#F59E0B', '#EF4444'], ['#8B5CF6', '#EC4899'], ['#10B981', '#3B82F6'],
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
    const [joinToken, setJoinToken] = useState('')
    const [creating, setCreating] = useState(false)
    const [joining, setJoining] = useState(false)
    const [editingName, setEditingName] = useState(false)
    const [editName, setEditName] = useState('')
    const [copied, setCopied] = useState(false)

    const { user } = useAuth()
    const { space: activeSpace, createSpace, joinSpace: ctxJoinSpace, loadSpace: ctxLoadSpace, setSpace: setActiveSpace, setUserRole: setActiveUserRole } = useSpace()
    const { locale } = useLanguage()
    const supabase = createClient()
    const router = useRouter()
    const t = (tr, en) => locale === 'tr' ? tr : en

    useEffect(() => { if (user) loadSpaces() }, [user])

    // ── Load all spaces ──
    const loadSpaces = async () => {
        setLoading(true)
        try {
            const { data: memberships } = await supabase
                .from('space_members')
                .select('space_id, role')
                .eq('user_id', user.id)

            if (memberships && memberships.length > 0) {
                const spaceIds = memberships.map(m => m.space_id)
                const { data: spacesData } = await supabase
                    .from('spaces')
                    .select('*')
                    .in('id', spaceIds)

                if (spacesData) {
                    const list = spacesData.map(s => ({
                        ...s,
                        role: memberships.find(m => m.space_id === s.id)?.role || 'viewer'
                    }))
                    setSpaces(list)

                    // Also get trip counts for each space
                    for (const s of list) {
                        const { count } = await supabase
                            .from('trips')
                            .select('id', { count: 'exact', head: true })
                            .eq('space_id', s.id)
                        s.tripCount = count || 0
                    }
                    setSpaces([...list])

                    // Also get member counts
                    for (const s of list) {
                        const { count } = await supabase
                            .from('space_members')
                            .select('id', { count: 'exact', head: true })
                            .eq('space_id', s.id)
                        s.memberCount = count || 0
                    }
                    setSpaces([...list])
                }
            } else {
                setSpaces([])
            }
        } catch (err) {
            console.error('Load spaces error:', err)
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
        try {
            await createSpace(newName.trim())
            setNewName('')
            setShowCreate(false)
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
                                                                        <button className="btn btn-ghost" style={{ color: '#EF4444', padding: '4px 8px' }}
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
                                                            value={selectedSpace.invite_token ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${selectedSpace.invite_token}` : ''}
                                                            style={{ flex: 1, fontSize: '0.78rem' }} />
                                                        <button className="btn btn-primary" onClick={() => copyInviteLink(selectedSpace.invite_token)}>
                                                            {copied ? <Check size={14} /> : <Copy size={14} />}
                                                            {copied ? t('Kopyalandı!', 'Copied!') : t('Kopyala', 'Copy')}
                                                        </button>
                                                    </div>
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
                                                        {typeof window !== 'undefined' ? window.location.origin : ''}/invite/{selectedSpace.invite_token}
                                                    </code>
                                                </div>
                                                <button className="btn btn-secondary" style={{ marginTop: 8 }}
                                                    onClick={() => copyInviteLink(selectedSpace.invite_token)}>
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
                                    <div>
                                        <h1 className="gh-title">👥 {t('Gruplar', 'Groups')}</h1>
                                        <p className="gh-subtitle">{t('Seyahat arkadaşlarınla ortak plan yap ve seyahatlerini yönet', 'Plan together and manage trips with your travel buddies')}</p>
                                    </div>
                                    <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                                        <Plus size={16} /> {t('Yeni Grup', 'New Group')}
                                    </button>
                                </div>

                                {/* Create/Join Panel */}
                                <AnimatePresence>
                                    {showCreate && (
                                        <motion.div className="gh-create-panel"
                                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                            <div className="gh-create-inner">
                                                <div className="gh-create-col">
                                                    <h3>✨ {t('Yeni Grup Oluştur', 'Create New Group')}</h3>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <input className="input" placeholder={t('Grup adı...', 'Group name...')}
                                                            value={newName} onChange={e => setNewName(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && handleCreateSpace()}
                                                            style={{ flex: 1 }} />
                                                        <button className="btn btn-primary" onClick={handleCreateSpace} disabled={creating}>
                                                            {creating ? <Loader2 size={14} className="spin" /> : <Check size={14} />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="gh-create-divider" />
                                                <div className="gh-create-col">
                                                    <h3>🔗 {t('Davet ile Katıl', 'Join with Invite')}</h3>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <input className="input" placeholder={t('Davet token...', 'Invite token...')}
                                                            value={joinToken} onChange={e => setJoinToken(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && handleJoinSpace()}
                                                            style={{ flex: 1 }} />
                                                        <button className="btn btn-secondary" onClick={handleJoinSpace} disabled={joining}>
                                                            {joining ? <Loader2 size={14} className="spin" /> : <UserPlus size={14} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Groups Grid */}
                                {loading ? (
                                    <div className="gh-loading"><Loader2 size={28} className="spin" /></div>
                                ) : spaces.length === 0 ? (
                                    <div className="gh-empty">
                                        <div style={{ fontSize: 52, marginBottom: 12, opacity: 0.3 }}>👥</div>
                                        <p style={{ fontWeight: 600, fontSize: '1rem' }}>{t('Henüz grubun yok', 'No groups yet')}</p>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', maxWidth: 280, margin: '4px auto 0' }}>
                                            {t('Yeni bir grup oluştur ve seyahat arkadaşlarını davet et', 'Create a group and invite your travel buddies')}
                                        </p>
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
