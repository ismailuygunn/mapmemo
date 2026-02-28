'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import {
    Shield, Users, Plane, MapPin, BarChart3, Settings, Trash2,
    Loader2, Search, ChevronRight, Crown, Lock, Globe, Database,
    Activity, AlertTriangle, Eye, Edit3, Check, X, RefreshCw,
    Download, Upload, Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/context/ToastContext'
import { useRouter } from 'next/navigation'

const ADMIN_EMAIL = 'admin@umae.app' // Change to your admin email

export default function AdminPage() {
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')

    // Data
    const [users, setUsers] = useState([])
    const [spaces, setSpaces] = useState([])
    const [trips, setTrips] = useState([])
    const [stats, setStats] = useState({})
    const [searchQuery, setSearchQuery] = useState('')
    const [userDetail, setUserDetail] = useState(null)

    const { user, profile } = useAuth()
    const { locale } = useLanguage()
    const { toast } = useToast()
    const supabase = createClient()
    const router = useRouter()
    const t = (tr, en) => locale === 'tr' ? tr : en

    useEffect(() => {
        checkAdmin()
    }, [user, profile])

    const checkAdmin = async () => {
        setLoading(true)
        if (!user) { setLoading(false); return }

        // Check admin status: profile role or email match
        const isAdm = profile?.role === 'admin' || user.email === ADMIN_EMAIL
        setIsAdmin(isAdm)

        if (isAdm) {
            await loadAllData()
        }
        setLoading(false)
    }

    const loadAllData = async () => {
        const [usersRes, spacesRes, tripsRes] = await Promise.all([
            supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100),
            supabase.from('spaces').select('*, space_members(count)').limit(50),
            supabase.from('trips').select('id, city, start_date, end_date, budget, created_at, space_id').order('created_at', { ascending: false }).limit(100),
        ])

        setUsers(usersRes.data || [])
        setSpaces(spacesRes.data || [])
        setTrips(tripsRes.data || [])
        setStats({
            totalUsers: usersRes.data?.length || 0,
            totalSpaces: spacesRes.data?.length || 0,
            totalTrips: tripsRes.data?.length || 0,
            recentUsers: (usersRes.data || []).filter(u => {
                const d = new Date(u.created_at)
                return Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000
            }).length,
        })
    }

    const updateUserRole = async (userId, newRole) => {
        try {
            const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
            if (error) throw error
            toast.success(t('Rol güncellendi', 'Role updated'))
            loadAllData()
        } catch (err) { toast.error(err.message) }
    }

    const deleteUser = async (userId) => {
        if (!confirm(t('Bu kullanıcıyı silmek istediğine emin misin?', 'Are you sure you want to delete this user?'))) return
        try {
            await supabase.from('space_members').delete().eq('user_id', userId)
            await supabase.from('profiles').delete().eq('id', userId)
            toast.success(t('Kullanıcı silindi', 'User deleted'))
            loadAllData()
        } catch (err) { toast.error(err.message) }
    }

    const deleteSpace = async (spaceId) => {
        if (!confirm(t('Bu grubu silmek istediğine emin misin?', 'Delete this group?'))) return
        try {
            await supabase.from('trips').delete().eq('space_id', spaceId)
            await supabase.from('space_members').delete().eq('space_id', spaceId)
            await supabase.from('spaces').delete().eq('id', spaceId)
            toast.success(t('Grup silindi', 'Group deleted'))
            loadAllData()
        } catch (err) { toast.error(err.message) }
    }

    const exportData = () => {
        const data = { users, spaces, trips, exportDate: new Date().toISOString() }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `umae-admin-export-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
        toast.success(t('Veriler indirildi', 'Data exported'))
    }

    const filteredUsers = users.filter(u =>
        !searchQuery || (u.display_name || u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
        day: 'numeric', month: 'short', year: 'numeric'
    }) : '-'

    if (loading) {
        return (
            <div className="page-layout">
                <Sidebar />
                <main className="page-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                    <Loader2 size={32} className="spin" style={{ color: 'var(--primary-1)' }} />
                </main>
            </div>
        )
    }

    if (!isAdmin) {
        return (
            <div className="page-layout">
                <Sidebar />
                <main className="page-main" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
                    <Lock size={48} style={{ color: 'var(--text-tertiary)' }} />
                    <h2 style={{ color: 'var(--text-secondary)' }}>{t('Erişim Engellendi', 'Access Denied')}</h2>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                        {t('Bu sayfa sadece adminler için.', 'This page is for admins only.')}
                    </p>
                    <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>
                        {t('Dashboard\'a Dön', 'Back to Dashboard')}
                    </button>
                </main>
            </div>
        )
    }

    const TABS = [
        { id: 'overview', icon: BarChart3, label: t('Genel Bakış', 'Overview') },
        { id: 'users', icon: Users, label: t('Kullanıcılar', 'Users') },
        { id: 'spaces', icon: Globe, label: t('Gruplar', 'Groups') },
        { id: 'trips', icon: Plane, label: t('Tripler', 'Trips') },
        { id: 'settings', icon: Settings, label: t('Ayarlar', 'Settings') },
    ]

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-main">
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 14,
                            background: 'linear-gradient(135deg, #EF4444, #F59E0B)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Shield size={22} color="white" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                                Admin Panel
                                <span style={{ fontSize: '0.65rem', background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                                    🔒 ADMIN
                                </span>
                            </h1>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: 0 }}>
                                {t('Uygulama yönetim paneli', 'Application management panel')}
                            </p>
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                            <button className="btn btn-ghost" onClick={loadAllData} style={{ fontSize: '0.75rem' }}>
                                <RefreshCw size={14} /> {t('Yenile', 'Refresh')}
                            </button>
                            <button className="btn btn-secondary" onClick={exportData} style={{ fontSize: '0.75rem' }}>
                                <Download size={14} /> {t('Dışa Aktar', 'Export')}
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
                        {TABS.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '8px 16px', borderRadius: 10,
                                    border: 'none', cursor: 'pointer',
                                    background: activeTab === tab.id ? 'var(--primary-1)' : 'var(--bg-secondary)',
                                    color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                                    fontSize: '0.82rem', fontWeight: 600, transition: 'all 150ms',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                <tab.icon size={15} /> {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ═══ OVERVIEW ═══ */}
                    {activeTab === 'overview' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
                                {[
                                    { label: t('Toplam Kullanıcı', 'Total Users'), value: stats.totalUsers, icon: Users, color: '#D4A853', bg: 'rgba(212,168,83,0.1)' },
                                    { label: t('Toplam Grup', 'Total Groups'), value: stats.totalSpaces, icon: Globe, color: '#34D399', bg: 'rgba(52,211,153,0.1)' },
                                    { label: t('Toplam Trip', 'Total Trips'), value: stats.totalTrips, icon: Plane, color: '#F472B6', bg: 'rgba(244,114,182,0.1)' },
                                    { label: t('Son 7 Gün (Yeni)', 'Last 7 Days (New)'), value: stats.recentUsers, icon: Activity, color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
                                ].map((stat, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                        style={{
                                            background: 'var(--bg-secondary)', borderRadius: 16, padding: '20px',
                                            border: '1px solid var(--border)',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <stat.icon size={18} />
                                            </div>
                                            <span style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>{stat.label}</span>
                                        </div>
                                        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Recent Activity */}
                            <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 20, border: '1px solid var(--border)' }}>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 14 }}>📊 {t('Son Aktivite', 'Recent Activity')}</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {users.slice(0, 5).map((u, i) => (
                                        <div key={u.id} style={{
                                            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                                            background: 'var(--bg-tertiary)', borderRadius: 10, fontSize: '0.82rem',
                                        }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #D4A853, #F472B6)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'white', fontWeight: 700, fontSize: '0.72rem',
                                            }}>
                                                {(u.display_name || u.email || '?')[0]?.toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <span style={{ fontWeight: 600 }}>{u.display_name || u.email?.split('@')[0]}</span>
                                                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem', marginLeft: 8 }}>{u.home_city || ''}</span>
                                            </div>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{fmtDate(u.created_at)}</span>
                                            {u.role === 'admin' && <Crown size={14} style={{ color: '#FBBF24' }} />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ═══ USERS ═══ */}
                    {activeTab === 'users' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                                    <input
                                        type="text" className="input" placeholder={t('Kullanıcı ara...', 'Search users...')}
                                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                        style={{ paddingLeft: 36 }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {filteredUsers.map(u => (
                                    <div key={u.id} style={{
                                        background: 'var(--bg-secondary)', borderRadius: 14, padding: '14px 18px',
                                        border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12,
                                    }}>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: '50%',
                                            background: u.avatar_url ? `url(${u.avatar_url}) center/cover` : 'linear-gradient(135deg, #D4A853, #F472B6)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
                                        }}>
                                            {!u.avatar_url && (u.display_name || u.email || '?')[0]?.toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {u.display_name || u.email?.split('@')[0]}
                                                {u.role === 'admin' && <Crown size={13} style={{ color: '#FBBF24' }} />}
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                <span>{u.email}</span>
                                                {u.home_city && <span>📍 {u.home_city}</span>}
                                                <span>📅 {fmtDate(u.created_at)}</span>
                                            </div>
                                        </div>
                                        <select
                                            value={u.role || 'user'}
                                            onChange={e => updateUserRole(u.id, e.target.value)}
                                            style={{
                                                padding: '4px 8px', borderRadius: 8,
                                                border: '1px solid var(--border)', background: 'var(--bg-tertiary)',
                                                color: 'var(--text-primary)', fontSize: '0.72rem', cursor: 'pointer',
                                            }}
                                        >
                                            <option value="user">{t('Kullanıcı', 'User')}</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        <button onClick={() => deleteUser(u.id)} style={{
                                            background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8,
                                            padding: '6px', cursor: 'pointer', color: '#EF4444',
                                        }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ═══ SPACES ═══ */}
                    {activeTab === 'spaces' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {spaces.map((s, i) => (
                                    <div key={s.id} style={{
                                        background: 'var(--bg-secondary)', borderRadius: 14, padding: '16px 20px',
                                        border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12,
                                    }}>
                                        <div style={{
                                            width: 44, height: 44, borderRadius: 12,
                                            background: `linear-gradient(135deg, ${['#0F2847', '#D4A853', '#EC4899', '#0D9488', '#F59E0B'][i % 5]}, ${['#D4A853', '#EC4899', '#F59E0B', '#0F2847', '#0D9488'][i % 5]})`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                            color: 'white', fontWeight: 800, fontSize: '1rem',
                                        }}>
                                            {(s.name || '?')[0]?.toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.name}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'flex', gap: 10 }}>
                                                <span>👥 {s.space_members?.[0]?.count || 0} {t('üye', 'members')}</span>
                                                <span>📅 {fmtDate(s.created_at)}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => deleteSpace(s.id)} style={{
                                            background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8,
                                            padding: '6px 10px', cursor: 'pointer', color: '#EF4444', fontSize: '0.72rem',
                                            display: 'flex', alignItems: 'center', gap: 4,
                                        }}>
                                            <Trash2 size={13} /> {t('Sil', 'Delete')}
                                        </button>
                                    </div>
                                ))}
                                {spaces.length === 0 && (
                                    <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 40 }}>
                                        {t('Henüz grup yok', 'No groups yet')}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ═══ TRIPS ═══ */}
                    {activeTab === 'trips' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                                {trips.map((trip, i) => (
                                    <div key={trip.id} style={{
                                        background: 'var(--bg-secondary)', borderRadius: 14, padding: '16px',
                                        border: '1px solid var(--border)',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <Plane size={16} style={{ color: 'var(--primary-1)' }} />
                                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{trip.city || t('Bilinmiyor', 'Unknown')}</span>
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <span>📅 {fmtDate(trip.start_date)} → {fmtDate(trip.end_date)}</span>
                                            <span>💰 {trip.budget || '-'}</span>
                                            <span>🕐 {fmtDate(trip.created_at)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {trips.length === 0 && (
                                <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 40 }}>
                                    {t('Henüz trip yok', 'No trips yet')}
                                </p>
                            )}
                        </motion.div>
                    )}

                    {/* ═══ SETTINGS ═══ */}
                    {activeTab === 'settings' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 24, border: '1px solid var(--border)', marginBottom: 16 }}>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Database size={18} /> {t('Veritabanı', 'Database')}
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                                    <div style={{ padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 10 }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Profiles</span>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{users.length}</div>
                                    </div>
                                    <div style={{ padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 10 }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Spaces</span>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{spaces.length}</div>
                                    </div>
                                    <div style={{ padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 10 }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Trips</span>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{trips.length}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Zap size={18} /> {t('Aksiyonlar', 'Actions')}
                                </h3>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <button className="btn btn-primary" onClick={exportData} style={{ fontSize: '0.8rem' }}>
                                        <Download size={14} /> {t('Tüm Verileri İndir', 'Export All Data')}
                                    </button>
                                    <button className="btn btn-secondary" onClick={loadAllData} style={{ fontSize: '0.8rem' }}>
                                        <RefreshCw size={14} /> {t('Verileri Yenile', 'Refresh Data')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    )
}
