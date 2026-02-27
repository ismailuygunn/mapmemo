'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useSpace } from '@/context/SpaceContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import Sidebar from '@/components/layout/Sidebar'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, Plus, MapPin, Calendar, Heart, MessageCircle,
    Crown, Star, ChevronRight, Search, X, Sparkles, Globe,
    Plane, Clock, Trash2, Edit3, Check, Loader2, Image as ImageIcon,
    CalendarDays, DollarSign, Send, UserPlus, ChevronDown, ChevronUp
} from 'lucide-react'

// ═══ SAMPLE DATA ═══
const SAMPLE_GROUPS = [
    {
        id: 'g1', name: 'Türkiye Backpackers 🎒', emoji: '🎒',
        desc: 'Sırt çantalı gezginler topluluğu. Bütçe dostu rotalar, hostel önerileri.',
        members: [
            { name: 'Elif Y.', avatar: '👩‍🦰' },
            { name: 'Burak K.', avatar: '🧔' },
            { name: 'Selin A.', avatar: '👩' },
            { name: 'Emre Ş.', avatar: '👨‍🦱' },
        ],
        color: '#4F46E5', gradient: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
        trips: [
            { id: 't1', title: 'Kapadokya Hafta Sonu', dest: 'Nevşehir', date: '15-17 Mar', budget: '₺2,500/kişi', status: 'upcoming', emoji: '🎈', participants: ['Elif Y.', 'Burak K.', 'Selin A.'], notes: 'Balon turu + ATV + vadiler. Sabah 06:00 balon, öğlen Göreme, akşam Ürgüp.' },
            { id: 't2', title: 'Ege Sahil Turu', dest: 'İzmir → Bodrum', date: '5-10 Nis', budget: '₺5,000/kişi', status: 'planning', emoji: '🏖️', participants: ['Elif Y.', 'Emre Ş.'], notes: 'Alaçatı → Çeşme → Bodrum. Araç kiralama dahil.' },
            { id: 't3', title: 'İstanbul Gastronomi', dest: 'İstanbul', date: '22 Şub', budget: '₺800/kişi', status: 'completed', emoji: '🍽️', participants: ['Burak K.', 'Selin A.', 'Emre Ş.'], notes: 'Karaköy → Balat → Kadıköy yemek turu.' },
        ],
    },
    {
        id: 'g2', name: 'Dijital Göçebeler 💻', emoji: '💻',
        desc: 'Uzaktan çalışanlar için coworking, vize ve yaşam maliyeti paylaşımları.',
        members: [
            { name: 'Zeynep D.', avatar: '👩‍💻' },
            { name: 'Mehmet K.', avatar: '👨‍💻' },
            { name: 'Ali Ö.', avatar: '🧑' },
        ],
        color: '#10B981', gradient: 'linear-gradient(135deg, #10B981, #059669)',
        trips: [
            { id: 't4', title: 'Antalya Workation', dest: 'Antalya', date: '1-15 Mar', budget: '₺8,000/kişi', status: 'upcoming', emoji: '☀️', participants: ['Zeynep D.', 'Mehmet K.'], notes: 'Coworking + plaj. Wifi hızlı mekanlar listesi hazır.' },
        ],
    },
    {
        id: 'g3', name: 'Fotoğraf Avcıları 📸', emoji: '📸',
        desc: 'En güzel kareleri yakalayan gezginler. Spotlar, ekipman, teknikler.',
        members: [
            { name: 'Deniz K.', avatar: '🧑‍🎨' },
            { name: 'Anna S.', avatar: '👩‍🦳' },
            { name: 'Can B.', avatar: '👨' },
            { name: 'Yasemin T.', avatar: '👩‍🦱' },
            { name: 'Oğuz R.', avatar: '🧔‍♂️' },
        ],
        color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
        trips: [
            { id: 't5', title: 'Doğu Karadeniz Fotoğraf Turu', dest: 'Trabzon → Artvin', date: '20-25 Nis', budget: '₺4,000/kişi', status: 'planning', emoji: '🏔️', participants: ['Deniz K.', 'Can B.', 'Oğuz R.'], notes: 'Sümela → Uzungöl → Ayder → Zilkale. Drone çekimleri.' },
            { id: 't6', title: 'İstanbul Gece Çekimleri', dest: 'İstanbul', date: '8 Mar', budget: '₺500/kişi', status: 'upcoming', emoji: '🌃', participants: ['Anna S.', 'Yasemin T.', 'Deniz K.'], notes: 'Galata → Süleymaniye → Ortaköy. Tripod + geniş açı.' },
        ],
    },
    {
        id: 'g4', name: 'Avrupa Interrail 🚂', emoji: '🚂',
        desc: 'Trenle Avrupa turu. Rotalar, bilet hileleri, hostel tavsiyeleri.',
        members: [
            { name: 'Elif Y.', avatar: '👩‍🦰' },
            { name: 'Anna S.', avatar: '👩‍🦳' },
        ],
        color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
        trips: [
            { id: 't7', title: 'Balkan Rotası', dest: 'Belgrad → Sofya → Selanik', date: 'Haz 2025', budget: '€1,200/kişi', status: 'planning', emoji: '🗺️', participants: ['Elif Y.', 'Anna S.'], notes: '10 günlük interrail. Hostel + couchsurfing.' },
        ],
    },
    {
        id: 'g5', name: 'Doğa & Macera 🏔️', emoji: '🏔️',
        desc: 'Trekking, dalış, kamp ve outdoor aktiviteleri.',
        members: [
            { name: 'Ali Ö.', avatar: '🧑' },
            { name: 'Burak K.', avatar: '🧔' },
            { name: 'Can B.', avatar: '👨' },
        ],
        color: '#06B6D4', gradient: 'linear-gradient(135deg, #06B6D4, #0891B2)',
        trips: [
            { id: 't8', title: 'Likya Yolu Trekking', dest: 'Fethiye → Antalya', date: '10-16 Nis', budget: '₺3,000/kişi', status: 'upcoming', emoji: '🥾', participants: ['Ali Ö.', 'Burak K.', 'Can B.'], notes: '6 gün 100km. Kamp + pansiyon karışık.' },
        ],
    },
]

// STATUSES
const STATUS_LABELS = {
    upcoming: { label: 'Yaklaşıyor', color: '#10B981', bg: '#10B98115' },
    planning: { label: 'Planlanıyor', color: '#F59E0B', bg: '#F59E0B15' },
    completed: { label: 'Tamamlandı', color: '#64748B', bg: '#64748B15' },
}

export default function GroupsPage() {
    const router = useRouter()
    const { user } = useAuth()
    const { locale } = useLanguage()
    const { toast } = useToast()

    const [groups, setGroups] = useState(SAMPLE_GROUPS)
    const [search, setSearch] = useState('')
    const [joinedGroups, setJoinedGroups] = useState(new Set(['g1', 'g3']))
    const [selectedGroup, setSelectedGroup] = useState(null)
    const [selectedTrip, setSelectedTrip] = useState(null)
    const [showCreateGroup, setShowCreateGroup] = useState(false)
    const [showCreateTrip, setShowCreateTrip] = useState(false)
    const [newGroupName, setNewGroupName] = useState('')
    const [newGroupDesc, setNewGroupDesc] = useState('')
    const [newGroupEmoji, setNewGroupEmoji] = useState('🌍')
    const [newTrip, setNewTrip] = useState({ title: '', dest: '', date: '', budget: '', notes: '', emoji: '✈️' })
    const [activeTab, setActiveTab] = useState('all') // 'all' | 'joined'

    const filteredGroups = groups.filter(g => {
        const matchSearch = !search.trim() ||
            g.name.toLowerCase().includes(search.toLowerCase()) ||
            g.desc.toLowerCase().includes(search.toLowerCase())
        if (activeTab === 'joined') return matchSearch && joinedGroups.has(g.id)
        return matchSearch
    })

    const toggleJoin = (groupId) => {
        setJoinedGroups(prev => {
            const next = new Set(prev)
            if (next.has(groupId)) next.delete(groupId)
            else next.add(groupId)
            return next
        })
    }

    const createGroup = () => {
        if (!newGroupName.trim()) return
        const newG = {
            id: `g_${Date.now()}`,
            name: `${newGroupName} ${newGroupEmoji}`,
            emoji: newGroupEmoji,
            desc: newGroupDesc || 'Yeni gezgin grubu.',
            members: [{ name: user?.email?.split('@')[0] || 'Sen', avatar: '👤' }],
            color: '#8B5CF6',
            gradient: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
            trips: [],
        }
        setGroups(prev => [newG, ...prev])
        setJoinedGroups(prev => new Set([...prev, newG.id]))
        setShowCreateGroup(false)
        setNewGroupName('')
        setNewGroupDesc('')
        toast.success('Grup oluşturuldu!')
    }

    const createTrip = () => {
        if (!newTrip.title.trim() || !selectedGroup) return
        const trip = {
            id: `t_${Date.now()}`,
            title: newTrip.title,
            dest: newTrip.dest || 'Belirsiz',
            date: newTrip.date || 'TBD',
            budget: newTrip.budget || 'Belirtilmedi',
            status: 'planning',
            emoji: newTrip.emoji,
            participants: [user?.email?.split('@')[0] || 'Sen'],
            notes: newTrip.notes || '',
        }
        setGroups(prev => prev.map(g =>
            g.id === selectedGroup.id ? { ...g, trips: [trip, ...g.trips] } : g
        ))
        setSelectedGroup(prev => prev ? { ...prev, trips: [trip, ...prev.trips] } : prev)
        setShowCreateTrip(false)
        setNewTrip({ title: '', dest: '', date: '', budget: '', notes: '', emoji: '✈️' })
        toast.success('Gezi planı oluşturuldu! 🎉')
    }

    const deleteTrip = (groupId, tripId) => {
        setGroups(prev => prev.map(g =>
            g.id === groupId ? { ...g, trips: g.trips.filter(t => t.id !== tripId) } : g
        ))
        setSelectedGroup(prev => prev ? { ...prev, trips: prev.trips.filter(t => t.id !== tripId) } : prev)
        setSelectedTrip(null)
        toast.success('Gezi silindi')
    }

    const totalTrips = groups.reduce((s, g) => s + g.trips.length, 0)
    const upcomingTrips = groups.reduce((s, g) => s + g.trips.filter(t => t.status === 'upcoming').length, 0)

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="page" style={{ maxWidth: 800, margin: '0 auto' }}>

                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}
                        style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                            <div>
                                <h1 style={{
                                    fontSize: '1.5rem', fontWeight: 900, margin: '0 0 2px',
                                    background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                }}>
                                    👥 Arkadaş Grupları
                                </h1>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: 0 }}>
                                    Birlikte gez, birlikte planla
                                </p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={() => setShowCreateGroup(true)}
                                style={{
                                    background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                                    color: '#fff', border: 'none', borderRadius: 14,
                                    padding: '10px 18px', cursor: 'pointer', fontWeight: 700,
                                    fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6,
                                    boxShadow: '0 4px 15px rgba(139,92,246,0.3)',
                                }}>
                                <Plus size={16} /> Grup Oluştur
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                        {[
                            { label: 'Grup', value: groups.length, icon: <Users size={16} />, color: '#8B5CF6' },
                            { label: 'Gezi Planı', value: totalTrips, icon: <Plane size={16} />, color: '#EC4899' },
                            { label: 'Yaklaşan', value: upcomingTrips, icon: <CalendarDays size={16} />, color: '#10B981' },
                        ].map((s, i) => (
                            <div key={i} style={{
                                background: 'var(--bg-secondary)', borderRadius: 14,
                                border: '1px solid var(--border)', padding: '12px', textAlign: 'center',
                            }}>
                                <div style={{ color: s.color, marginBottom: 4, display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{s.value}</div>
                                <div style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Tabs + Search */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        {['all', 'joined'].map(key => (
                            <button key={key} onClick={() => setActiveTab(key)}
                                style={{
                                    padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                    background: activeTab === key ? 'linear-gradient(135deg, #8B5CF6, #EC4899)' : 'var(--bg-tertiary)',
                                    color: activeTab === key ? '#fff' : 'var(--text-secondary)',
                                    fontWeight: 700, fontSize: '0.78rem',
                                }}>
                                {key === 'all' ? 'Tümü' : 'Katıldıklarım'}
                            </button>
                        ))}
                    </div>

                    <div style={{ position: 'relative', marginBottom: 16 }}>
                        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input className="input" placeholder="Grup ara..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            style={{ paddingLeft: 40, fontSize: '0.86rem' }} />
                    </div>

                    {/* Groups List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {filteredGroups.map((group, i) => {
                            const upcoming = group.trips.filter(t => t.status === 'upcoming').length
                            return (
                                <motion.div key={group.id}
                                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    onClick={() => setSelectedGroup(group)}
                                    style={{
                                        background: 'var(--bg-secondary)', borderRadius: 18,
                                        border: '1px solid var(--border)', overflow: 'hidden',
                                        cursor: 'pointer', transition: 'border-color 200ms',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = group.color}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                >
                                    <div style={{ padding: '16px 18px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <span style={{
                                                width: 46, height: 46, borderRadius: 14, display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
                                                background: group.gradient, flexShrink: 0,
                                            }}>{group.emoji}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 2px' }}>{group.name}</h3>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                    <span>👥 {group.members.length} üye</span>
                                                    <span>✈️ {group.trips.length} gezi</span>
                                                    {upcoming > 0 && <span style={{ color: '#10B981' }}>🟢 {upcoming} yaklaşan</span>}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <motion.button
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={(e) => { e.stopPropagation(); toggleJoin(group.id) }}
                                                    style={{
                                                        padding: '7px 14px', borderRadius: 10, border: 'none',
                                                        cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem',
                                                        background: joinedGroups.has(group.id) ? `${group.color}15` : group.gradient,
                                                        color: joinedGroups.has(group.id) ? group.color : 'white',
                                                    }}>
                                                    {joinedGroups.has(group.id) ? '✓ Üye' : 'Katıl'}
                                                </motion.button>
                                                <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '8px 0 0', lineHeight: 1.4 }}>
                                            {group.desc}
                                        </p>
                                        {/* Mini trip preview */}
                                        {group.trips.filter(t => t.status !== 'completed').length > 0 && (
                                            <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
                                                {group.trips.filter(t => t.status !== 'completed').slice(0, 3).map(trip => (
                                                    <div key={trip.id} style={{
                                                        padding: '6px 10px', borderRadius: 8, fontSize: '0.68rem',
                                                        background: STATUS_LABELS[trip.status]?.bg || 'var(--bg-tertiary)',
                                                        color: STATUS_LABELS[trip.status]?.color || 'var(--text-secondary)',
                                                        fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
                                                    }}>
                                                        {trip.emoji} {trip.title}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>

                    {filteredGroups.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}>
                            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>👥</div>
                            <p style={{ fontWeight: 600 }}>Grup bulunamadı</p>
                        </div>
                    )}

                    {/* ═══ GROUP DETAIL MODAL ═══ */}
                    <AnimatePresence>
                        {selectedGroup && !selectedTrip && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                style={{
                                    position: 'fixed', inset: 0, zIndex: 9999,
                                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
                                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                                }}
                                onClick={() => setSelectedGroup(null)}>
                                <motion.div
                                    initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                                    transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                        width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
                                        background: 'var(--bg-primary)', borderRadius: '24px 24px 0 0',
                                        boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
                                    }}>
                                    {/* Header */}
                                    <div style={{
                                        padding: '20px 20px 0', position: 'sticky', top: 0,
                                        background: 'var(--bg-primary)', zIndex: 1,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{
                                                    width: 44, height: 44, borderRadius: 14,
                                                    background: selectedGroup.gradient,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '1.3rem',
                                                }}>{selectedGroup.emoji}</span>
                                                <div>
                                                    <h2 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>{selectedGroup.name}</h2>
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                                        👥 {selectedGroup.members.length} üye · ✈️ {selectedGroup.trips.length} gezi
                                                    </span>
                                                </div>
                                            </div>
                                            <button onClick={() => setSelectedGroup(null)} style={{
                                                width: 34, height: 34, borderRadius: 10, border: 'none',
                                                background: 'var(--bg-tertiary)', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'var(--text-secondary)',
                                            }}><X size={18} /></button>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
                                            {selectedGroup.desc}
                                        </p>
                                    </div>

                                    <div style={{ padding: '0 20px 28px' }}>
                                        {/* Members */}
                                        <div style={{ marginBottom: 20 }}>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Users size={14} /> Üyeler
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                {selectedGroup.members.map((m, i) => (
                                                    <div key={i} style={{
                                                        display: 'flex', alignItems: 'center', gap: 6,
                                                        padding: '6px 12px', borderRadius: 10,
                                                        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                                        fontSize: '0.78rem', fontWeight: 600,
                                                    }}>
                                                        <span>{m.avatar}</span> {m.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Trips */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                            <span style={{ fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Plane size={14} /> Gezi Planları
                                            </span>
                                            {joinedGroups.has(selectedGroup.id) && (
                                                <button onClick={() => setShowCreateTrip(true)} style={{
                                                    padding: '6px 12px', borderRadius: 8, border: 'none',
                                                    cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem',
                                                    background: selectedGroup.gradient, color: 'white',
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                }}>
                                                    <Plus size={12} /> Gezi Ekle
                                                </button>
                                            )}
                                        </div>

                                        {selectedGroup.trips.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>
                                                <Plane size={32} style={{ opacity: 0.2, marginBottom: 8 }} />
                                                <p>Henüz gezi planı yok</p>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                {selectedGroup.trips.map(trip => {
                                                    const st = STATUS_LABELS[trip.status] || STATUS_LABELS.planning
                                                    return (
                                                        <motion.div key={trip.id}
                                                            whileHover={{ scale: 1.01 }}
                                                            onClick={() => setSelectedTrip(trip)}
                                                            style={{
                                                                padding: '14px 16px', borderRadius: 14,
                                                                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                                                cursor: 'pointer', transition: 'border-color 150ms',
                                                            }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                <span style={{ fontSize: '1.5rem' }}>{trip.emoji}</span>
                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{trip.title}</div>
                                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                                        <span>📍 {trip.dest}</span>
                                                                        <span>📅 {trip.date}</span>
                                                                        <span>💰 {trip.budget}</span>
                                                                    </div>
                                                                </div>
                                                                <span style={{
                                                                    padding: '4px 10px', borderRadius: 8,
                                                                    background: st.bg, color: st.color,
                                                                    fontSize: '0.65rem', fontWeight: 700,
                                                                }}>{st.label}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                                                                {trip.participants.map((p, pi) => (
                                                                    <span key={pi} style={{
                                                                        padding: '3px 8px', borderRadius: 6,
                                                                        background: 'var(--bg-tertiary)', fontSize: '0.65rem',
                                                                        fontWeight: 600, color: 'var(--text-secondary)',
                                                                    }}>{p}</span>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )
                                                })}
                                            </div>
                                        )}

                                        {/* Join/Leave */}
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => toggleJoin(selectedGroup.id)}
                                            style={{
                                                width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                                                marginTop: 16, cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem',
                                                background: joinedGroups.has(selectedGroup.id) ? 'var(--bg-tertiary)' : selectedGroup.gradient,
                                                color: joinedGroups.has(selectedGroup.id) ? 'var(--text-secondary)' : 'white',
                                            }}>
                                            {joinedGroups.has(selectedGroup.id) ? '✓ Katıldın — Ayrıl' : '🚀 Gruba Katıl'}
                                        </motion.button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ═══ TRIP DETAIL MODAL ═══ */}
                    <AnimatePresence>
                        {selectedTrip && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                style={{
                                    position: 'fixed', inset: 0, zIndex: 10000,
                                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: 16,
                                }}
                                onClick={() => setSelectedTrip(null)}>
                                <motion.div
                                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                        width: '100%', maxWidth: 440, background: 'var(--bg-primary)',
                                        borderRadius: 24, overflow: 'hidden',
                                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                                    }}>
                                    {/* Trip header */}
                                    <div style={{
                                        padding: '24px 20px 16px',
                                        background: selectedGroup?.gradient || 'var(--bg-secondary)',
                                        color: 'white', textAlign: 'center',
                                    }}>
                                        <div style={{ fontSize: '3rem', marginBottom: 8 }}>{selectedTrip.emoji}</div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: '0 0 4px' }}>{selectedTrip.title}</h3>
                                        <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>
                                            📍 {selectedTrip.dest}
                                        </div>
                                    </div>
                                    <div style={{ padding: '16px 20px 24px' }}>
                                        {/* Info cards */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                                            <div style={{ padding: 12, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border)', textAlign: 'center' }}>
                                                <CalendarDays size={16} style={{ color: '#8B5CF6', marginBottom: 4 }} />
                                                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{selectedTrip.date}</div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Tarih</div>
                                            </div>
                                            <div style={{ padding: 12, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border)', textAlign: 'center' }}>
                                                <DollarSign size={16} style={{ color: '#10B981', marginBottom: 4 }} />
                                                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{selectedTrip.budget}</div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Bütçe</div>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div style={{ marginBottom: 14 }}>
                                            <span style={{
                                                padding: '5px 12px', borderRadius: 8,
                                                background: STATUS_LABELS[selectedTrip.status]?.bg,
                                                color: STATUS_LABELS[selectedTrip.status]?.color,
                                                fontSize: '0.75rem', fontWeight: 700,
                                            }}>{STATUS_LABELS[selectedTrip.status]?.label}</span>
                                        </div>

                                        {/* Participants */}
                                        <div style={{ marginBottom: 14 }}>
                                            <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Users size={13} /> Katılımcılar
                                            </div>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {selectedTrip.participants.map((p, i) => (
                                                    <span key={i} style={{
                                                        padding: '5px 12px', borderRadius: 8,
                                                        background: 'var(--bg-tertiary)', fontSize: '0.75rem', fontWeight: 600,
                                                    }}>{p}</span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        {selectedTrip.notes && (
                                            <div style={{ marginBottom: 16 }}>
                                                <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <MessageCircle size={13} /> Notlar
                                                </div>
                                                <div style={{
                                                    padding: '12px 14px', borderRadius: 12,
                                                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                                    fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6,
                                                }}>
                                                    {selectedTrip.notes}
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => setSelectedTrip(null)} style={{
                                                flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                                                background: selectedGroup?.gradient || 'var(--primary-1)',
                                                color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                                            }}>Tamam</button>
                                            <button onClick={() => deleteTrip(selectedGroup?.id, selectedTrip.id)} style={{
                                                padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)',
                                                background: 'var(--bg-secondary)', color: 'var(--error)',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                                fontWeight: 600, fontSize: '0.82rem',
                                            }}>
                                                <Trash2 size={14} /> Sil
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ═══ CREATE GROUP MODAL ═══ */}
                    <AnimatePresence>
                        {showCreateGroup && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                style={{
                                    position: 'fixed', inset: 0, zIndex: 10000,
                                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                                }}
                                onClick={() => setShowCreateGroup(false)}>
                                <motion.div
                                    initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                        width: '100%', maxWidth: 400, background: 'var(--bg-primary)',
                                        borderRadius: 24, padding: 24,
                                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                                    }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: '0 0 16px' }}>✨ Yeni Grup</h3>
                                    {/* Emoji picker mini */}
                                    <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                                        {['🌍', '🎒', '🍽️', '📸', '🏔️', '🚂', '✈️', '🏖️', '💻', '🎭'].map(em => (
                                            <button key={em} onClick={() => setNewGroupEmoji(em)} style={{
                                                width: 40, height: 40, borderRadius: 10, border: newGroupEmoji === em ? '2px solid #8B5CF6' : '2px solid var(--border)',
                                                background: newGroupEmoji === em ? '#8B5CF615' : 'var(--bg-secondary)',
                                                cursor: 'pointer', fontSize: '1.2rem',
                                            }}>{em}</button>
                                        ))}
                                    </div>
                                    <input className="input" placeholder="Grup adı *" value={newGroupName}
                                        onChange={e => setNewGroupName(e.target.value)}
                                        style={{ marginBottom: 10, fontSize: '0.88rem' }} />
                                    <textarea className="input" placeholder="Açıklama (opsiyonel)" rows={2}
                                        value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)}
                                        style={{ marginBottom: 14, fontSize: '0.86rem', resize: 'none' }} />
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={createGroup} disabled={!newGroupName.trim()} style={{
                                            flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                                            background: newGroupName.trim() ? 'linear-gradient(135deg, #8B5CF6, #EC4899)' : 'var(--bg-tertiary)',
                                            color: newGroupName.trim() ? 'white' : 'var(--text-tertiary)',
                                            fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                                        }}>Oluştur</button>
                                        <button onClick={() => setShowCreateGroup(false)} style={{
                                            padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border)',
                                            background: 'var(--bg-secondary)', cursor: 'pointer', fontWeight: 600,
                                            fontSize: '0.85rem', color: 'var(--text-secondary)',
                                        }}>İptal</button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ═══ CREATE TRIP MODAL ═══ */}
                    <AnimatePresence>
                        {showCreateTrip && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                style={{
                                    position: 'fixed', inset: 0, zIndex: 10001,
                                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                                }}
                                onClick={() => setShowCreateTrip(false)}>
                                <motion.div
                                    initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                        width: '100%', maxWidth: 420, background: 'var(--bg-primary)',
                                        borderRadius: 24, padding: 24,
                                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                                    }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: '0 0 16px' }}>✈️ Yeni Gezi Planla</h3>
                                    {/* Emoji picker */}
                                    <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                                        {['✈️', '🏖️', '🏔️', '🎈', '🗺️', '🥾', '🌃', '☀️', '🍽️', '🚂'].map(em => (
                                            <button key={em} onClick={() => setNewTrip(p => ({ ...p, emoji: em }))} style={{
                                                width: 38, height: 38, borderRadius: 10,
                                                border: newTrip.emoji === em ? '2px solid #8B5CF6' : '2px solid var(--border)',
                                                background: newTrip.emoji === em ? '#8B5CF615' : 'var(--bg-secondary)',
                                                cursor: 'pointer', fontSize: '1.1rem',
                                            }}>{em}</button>
                                        ))}
                                    </div>
                                    <input className="input" placeholder="Gezi adı *" value={newTrip.title}
                                        onChange={e => setNewTrip(p => ({ ...p, title: e.target.value }))}
                                        style={{ marginBottom: 10, fontSize: '0.86rem' }} />
                                    <input className="input" placeholder="📍 Nereye? (ör: İzmir → Bodrum)" value={newTrip.dest}
                                        onChange={e => setNewTrip(p => ({ ...p, dest: e.target.value }))}
                                        style={{ marginBottom: 10, fontSize: '0.86rem' }} />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                                        <input className="input" placeholder="📅 Tarih" value={newTrip.date}
                                            onChange={e => setNewTrip(p => ({ ...p, date: e.target.value }))}
                                            style={{ fontSize: '0.86rem' }} />
                                        <input className="input" placeholder="💰 Bütçe" value={newTrip.budget}
                                            onChange={e => setNewTrip(p => ({ ...p, budget: e.target.value }))}
                                            style={{ fontSize: '0.86rem' }} />
                                    </div>
                                    <textarea className="input" placeholder="Notlar, planlama detayları..." rows={3}
                                        value={newTrip.notes} onChange={e => setNewTrip(p => ({ ...p, notes: e.target.value }))}
                                        style={{ marginBottom: 14, fontSize: '0.86rem', resize: 'none' }} />
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={createTrip} disabled={!newTrip.title.trim()} style={{
                                            flex: 1, padding: '13px', borderRadius: 12, border: 'none',
                                            background: newTrip.title.trim() ? (selectedGroup?.gradient || 'linear-gradient(135deg, #8B5CF6, #EC4899)') : 'var(--bg-tertiary)',
                                            color: newTrip.title.trim() ? 'white' : 'var(--text-tertiary)',
                                            fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                                        }}>🚀 Oluştur</button>
                                        <button onClick={() => setShowCreateTrip(false)} style={{
                                            padding: '13px 18px', borderRadius: 12, border: '1px solid var(--border)',
                                            background: 'var(--bg-secondary)', cursor: 'pointer', fontWeight: 600,
                                            fontSize: '0.85rem', color: 'var(--text-secondary)',
                                        }}>İptal</button>
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
