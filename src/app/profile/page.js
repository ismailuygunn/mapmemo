'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useSpace } from '@/context/SpaceContext'
import { useLanguage } from '@/context/LanguageContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import Sidebar from '@/components/layout/Sidebar'
import {
    User, Mail, Calendar, MapPin, Camera, Edit3, Check, X,
    Globe, Sun, Moon, Heart, Award, Plane, Star, Sparkles,
    BarChart3, Shield, Clock, Compass, Map,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const AVATAR_COLORS = [
    ['#0F2847', '#D4A853'], ['#EC4899', '#F43F5E'], ['#0D9488', '#06B6D4'],
    ['#F59E0B', '#EF4444'], ['#8B5CF6', '#EC4899'], ['#10B981', '#3B82F6'],
    ['#4A7FBF', '#D4A853'], ['#F97316', '#FBBF24'],
]

const HOME_CITIES = [
    'İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa', 'Adana',
    'Trabzon', 'Gaziantep', 'Konya', 'Mersin', 'Diyarbakır', 'Eskişehir',
    'Samsun', 'Kayseri', 'Denizli', 'Malatya',
]

const ACHIEVEMENTS = [
    { id: 'first_trip', emoji: '🎒', name: 'İlk Macera', desc: 'İlk trip\'i oluştur', check: s => s.trips >= 1 },
    { id: 'explorer_5', emoji: '🗺️', name: '5 Şehir', desc: '5 farklı şehir ziyaret et', check: s => s.cities >= 5 },
    { id: 'explorer_10', emoji: '🌍', name: '10 Şehir', desc: '10 farklı şehir', check: s => s.cities >= 10 },
    { id: 'pin_master', emoji: '📌', name: 'Pin Ustası', desc: '50+ pin ekle', check: s => s.pins >= 50 },
    { id: 'pin_legend', emoji: '🏆', name: 'Pin Efsanesi', desc: '100+ pin ekle', check: s => s.pins >= 100 },
    { id: 'food_explorer', emoji: '🍽️', name: 'Gurme Gezgin', desc: '10+ restoran pin\'i', check: s => s.foodPins >= 10 },
    { id: 'photographer', emoji: '📸', name: 'Fotoğrafçı', desc: '20+ fotoğraf yükle', check: s => s.photos >= 20 },
    { id: 'social', emoji: '👥', name: 'Sosyal Gezgin', desc: '3+ space üyesi', check: s => s.members >= 3 },
    { id: 'planner', emoji: '📋', name: 'Plancı', desc: '5+ trip planla', check: s => s.trips >= 5 },
    { id: 'veteran', emoji: '⭐', name: 'Veteran', desc: '20+ trip planla', check: s => s.trips >= 20 },
]

export default function ProfilePage() {
    const { user, profile, updateProfile } = useAuth()
    const { space } = useSpace()
    const { t, locale, setLocale } = useLanguage()
    const { theme, toggleTheme } = useTheme()
    const { toast } = useToast()
    const router = useRouter()
    const supabase = createClient()

    // Editable fields
    const [editing, setEditing] = useState(null) // 'name' | 'city' | 'bio'
    const [editValue, setEditValue] = useState('')
    const [saving, setSaving] = useState(false)
    const [avatarColorIdx, setAvatarColorIdx] = useState(0)

    // Stats
    const [stats, setStats] = useState(null)
    const [statsLoading, setStatsLoading] = useState(true)

    // Favorites
    const [favorites, setFavorites] = useState([])

    useEffect(() => {
        if (user) loadStats()
        try {
            const fav = JSON.parse(localStorage.getItem('umae-fav-dests') || '[]')
            setFavorites(fav)
        } catch { }
        // Avatar color from profile or random
        if (profile?.avatar_color != null) setAvatarColorIdx(profile.avatar_color)
        else setAvatarColorIdx(Math.floor(Math.random() * AVATAR_COLORS.length))
    }, [user, profile])

    const loadStats = async () => {
        setStatsLoading(true)
        try {
            const queries = space
                ? {
                    trips: supabase.from('trips').select('id, city', { count: 'exact', head: false }).eq('space_id', space.id),
                    pins: supabase.from('pins').select('id, type', { count: 'exact', head: false }).eq('space_id', space.id),
                    members: supabase.from('space_members').select('id', { count: 'exact', head: true }).eq('space_id', space.id),
                    photos: supabase.from('trip_photos').select('id', { count: 'exact', head: true }).eq('space_id', space.id),
                }
                : {
                    trips: supabase.from('trips').select('id, city', { count: 'exact', head: false }).eq('created_by', user.id),
                    pins: supabase.from('pins').select('id, type', { count: 'exact', head: false }).eq('user_id', user.id),
                    members: Promise.resolve({ count: 0 }),
                    photos: supabase.from('trip_photos').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
                }

            const [tripsRes, pinsRes, membersRes, photosRes] = await Promise.all([
                queries.trips, queries.pins, queries.members, queries.photos,
            ])

            const trips = tripsRes.data || []
            const pins = pinsRes.data || []
            const cities = [...new Set(trips.map(t => t.city).filter(Boolean).flatMap(c => c.split(' → ')))]
            const foodPins = pins.filter(p => ['restaurant', 'cafe', 'bar', 'food'].includes(p.type))

            setStats({
                trips: trips.length,
                cities: cities.length,
                cityList: cities,
                pins: pins.length,
                members: membersRes.count || 0,
                photos: photosRes.count || 0,
                foodPins: foodPins.length,
            })
        } catch (err) {
            console.error('Profile stats error:', err)
            setStats({ trips: 0, cities: 0, cityList: [], pins: 0, members: 0, photos: 0, foodPins: 0 })
        }
        setStatsLoading(false)
    }

    const earned = useMemo(() => {
        if (!stats) return []
        return ACHIEVEMENTS.filter(a => a.check(stats))
    }, [stats])

    const startEdit = (field, currentValue) => {
        setEditing(field)
        setEditValue(currentValue || '')
    }

    const saveEdit = async (field) => {
        setSaving(true)
        try {
            const updates = {}
            if (field === 'name') updates.display_name = editValue
            else if (field === 'city') updates.home_city = editValue
            else if (field === 'bio') updates.bio = editValue
            await updateProfile(updates)
            toast.success('Kaydedildi ✅')
        } catch (err) {
            toast.error(err.message || 'Hata')
        }
        setSaving(false)
        setEditing(null)
    }

    const changeAvatarColor = async () => {
        const next = (avatarColorIdx + 1) % AVATAR_COLORS.length
        setAvatarColorIdx(next)
        try { await updateProfile({ avatar_color: next }) } catch { }
    }

    const initials = (profile?.display_name || user?.email || '?')
        .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    const gradient = AVATAR_COLORS[avatarColorIdx % AVATAR_COLORS.length]
    const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' }) : ''

    const sectionStyle = {
        background: 'var(--bg-secondary)', borderRadius: 20,
        border: '1px solid var(--border)', padding: '20px 24px', marginBottom: 16,
    }

    const labelStyle = { fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 4 }

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-main" style={{ overflowY: 'auto' }}>
                <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px 60px' }}>

                    {/* ═══ HERO ═══ */}
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                            borderRadius: 24, overflow: 'hidden', marginBottom: 20,
                            background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                            padding: '32px 28px 24px', position: 'relative',
                        }}>
                        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                        <img src="/umae-icon.png?v=3" alt="UMAE" style={{ width: 28, height: 28, borderRadius: 8, position: 'absolute', top: 12, right: 16, opacity: 0.85, zIndex: 1 }} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                            {/* Avatar */}
                            <motion.div
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={changeAvatarColor}
                                style={{
                                    width: 72, height: 72, borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.5rem', fontWeight: 900, color: 'white',
                                    border: '3px solid rgba(255,255,255,0.3)',
                                    cursor: 'pointer', position: 'relative',
                                }}>
                                {initials}
                                <div style={{
                                    position: 'absolute', bottom: -2, right: -2,
                                    background: 'white', borderRadius: '50%', width: 22, height: 22,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Camera size={11} color={gradient[0]} />
                                </div>
                            </motion.div>

                            <div style={{ flex: 1 }}>
                                <h1 style={{ color: 'white', fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>
                                    {profile?.display_name || user?.email?.split('@')[0]}
                                </h1>
                                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', margin: '3px 0 0' }}>
                                    <Mail size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
                                    {user?.email}
                                </p>
                                {joinDate && (
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', margin: '2px 0 0' }}>
                                        <Calendar size={10} style={{ verticalAlign: -1, marginRight: 4 }} />
                                        {joinDate}'den beri üye
                                    </p>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* ═══ PROFILE INFO ═══ */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                        style={sectionStyle}>
                        <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 800 }}>
                            <User size={16} style={{ verticalAlign: -2, marginRight: 6, color: '#D4A853' }} />
                            Profil Bilgileri
                        </h3>

                        {/* Display Name */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={labelStyle}>İsim</div>
                            {editing === 'name' ? (
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus
                                        style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
                                    <button onClick={() => saveEdit('name')} disabled={saving}
                                        style={{ padding: '8px 14px', borderRadius: 10, background: '#10B981', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                                        <Check size={13} />
                                    </button>
                                    <button onClick={() => setEditing(null)}
                                        style={{ padding: '8px 10px', borderRadius: 10, background: 'var(--bg-tertiary)', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                        <X size={13} />
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => startEdit('name', profile?.display_name)}>
                                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {profile?.display_name || 'Belirtilmedi'}
                                    </span>
                                    <Edit3 size={12} color="var(--text-tertiary)" />
                                </div>
                            )}
                        </div>

                        {/* Home City */}
                        <div style={{ marginBottom: 12 }}>
                            <div style={labelStyle}>🏠 Yaşadığım Şehir</div>
                            {editing === 'city' ? (
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <select value={editValue} onChange={e => setEditValue(e.target.value)}
                                        style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                        <option value="">Seçiniz</option>
                                        {HOME_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <button onClick={() => saveEdit('city')} disabled={saving}
                                        style={{ padding: '8px 14px', borderRadius: 10, background: '#10B981', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                                        <Check size={13} />
                                    </button>
                                    <button onClick={() => setEditing(null)}
                                        style={{ padding: '8px 10px', borderRadius: 10, background: 'var(--bg-tertiary)', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                        <X size={13} />
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => startEdit('city', profile?.home_city)}>
                                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {profile?.home_city || 'Belirtilmedi'}
                                    </span>
                                    <Edit3 size={12} color="var(--text-tertiary)" />
                                </div>
                            )}
                        </div>

                        {/* Bio */}
                        <div>
                            <div style={labelStyle}>✍️ Hakkımda</div>
                            {editing === 'bio' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <textarea value={editValue} onChange={e => setEditValue(e.target.value)}
                                        rows={3} autoFocus placeholder="Biraz kendinizden bahsedin..."
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.82rem', resize: 'vertical' }} />
                                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                        <button onClick={() => saveEdit('bio')} disabled={saving}
                                            style={{ padding: '8px 16px', borderRadius: 10, background: '#10B981', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                                            Kaydet
                                        </button>
                                        <button onClick={() => setEditing(null)}
                                            style={{ padding: '8px 14px', borderRadius: 10, background: 'var(--bg-tertiary)', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                            İptal
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }} onClick={() => startEdit('bio', profile?.bio)}>
                                    <span style={{ fontSize: '0.82rem', color: profile?.bio ? 'var(--text-secondary)' : 'var(--text-tertiary)', fontStyle: profile?.bio ? 'normal' : 'italic', lineHeight: 1.5 }}>
                                        {profile?.bio || 'Henüz bir şey yazmadınız...'}
                                    </span>
                                    <Edit3 size={12} color="var(--text-tertiary)" style={{ flexShrink: 0, marginTop: 2 }} />
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* ═══ STATS ═══ */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        style={sectionStyle}>
                        <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 800 }}>
                            <BarChart3 size={16} style={{ verticalAlign: -2, marginRight: 6, color: '#F59E0B' }} />
                            Seyahat İstatistikleri
                        </h3>

                        {statsLoading ? (
                            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>
                                ⏳ Yükleniyor...
                            </div>
                        ) : stats && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                {[
                                    { value: stats.trips, label: 'Trip', emoji: '✈️', color: '#D4A853' },
                                    { value: stats.cities, label: 'Şehir', emoji: '🏙️', color: '#F472B6' },
                                    { value: stats.pins, label: 'Pin', emoji: '📌', color: '#34D399' },
                                    { value: stats.photos, label: 'Fotoğraf', emoji: '📸', color: '#FBBF24' },
                                    { value: stats.members, label: 'Üye', emoji: '👥', color: '#60A5FA' },
                                    { value: stats.foodPins, label: 'Restoran', emoji: '🍽️', color: '#F97316' },
                                ].map((s, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.05 * i }}
                                        style={{
                                            background: 'var(--bg-primary)', borderRadius: 14, padding: '14px 12px',
                                            border: '1px solid var(--border)', textAlign: 'center',
                                            borderTop: `3px solid ${s.color}`,
                                        }}>
                                        <div style={{ fontSize: '1.1rem' }}>{s.emoji}</div>
                                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{s.label}</div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Cities Visited */}
                        {stats?.cityList?.length > 0 && (
                            <div style={{ marginTop: 14 }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 6 }}>
                                    🏙️ Ziyaret Edilen Şehirler
                                </div>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                    {stats.cityList.map(c => (
                                        <span key={c} style={{
                                            padding: '3px 10px', borderRadius: 8,
                                            background: 'rgba(212,168,83,0.1)', color: '#D4A853',
                                            fontSize: '0.7rem', fontWeight: 600,
                                        }}>📍 {c}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* ═══ ACHIEVEMENTS ═══ */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        style={sectionStyle}>
                        <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 800 }}>
                            <Award size={16} style={{ verticalAlign: -2, marginRight: 6, color: '#EC4899' }} />
                            Rozetler
                            <span style={{ marginLeft: 8, fontSize: '0.72rem', fontWeight: 600, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 6 }}>
                                {earned.length}/{ACHIEVEMENTS.length}
                            </span>
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                            {ACHIEVEMENTS.map((a, i) => {
                                const isEarned = stats ? a.check(stats) : false
                                return (
                                    <motion.div key={a.id}
                                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.03 * i }}
                                        style={{
                                            padding: '12px 10px', borderRadius: 12, textAlign: 'center',
                                            background: isEarned ? 'rgba(16,185,129,0.06)' : 'var(--bg-primary)',
                                            border: `1px solid ${isEarned ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`,
                                            opacity: isEarned ? 1 : 0.5,
                                        }}>
                                        <div style={{ fontSize: '1.3rem', filter: isEarned ? 'none' : 'grayscale(1)' }}>{a.emoji}</div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, marginTop: 4, color: 'var(--text-primary)' }}>{a.name}</div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{a.desc}</div>
                                        {isEarned && <div style={{ fontSize: '0.6rem', color: '#10B981', fontWeight: 700, marginTop: 3 }}>✅ Kazanıldı</div>}
                                    </motion.div>
                                )
                            })}
                        </div>
                    </motion.div>

                    {/* ═══ FAVORITE DESTINATIONS ═══ */}
                    {favorites.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            style={sectionStyle}>
                            <h3 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 800 }}>
                                <Heart size={16} style={{ verticalAlign: -2, marginRight: 6, color: '#F472B6' }} />
                                Favori Destinasyonlar
                            </h3>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {favorites.map(city => (
                                    <span key={city} style={{
                                        padding: '6px 14px', borderRadius: 10,
                                        background: 'rgba(244,114,182,0.1)', color: '#F472B6',
                                        fontSize: '0.78rem', fontWeight: 600,
                                        display: 'flex', alignItems: 'center', gap: 4,
                                    }}>
                                        <Heart size={11} fill="#F472B6" /> {city}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ═══ PREFERENCES ═══ */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                        style={sectionStyle}>
                        <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 800 }}>
                            <Compass size={16} style={{ verticalAlign: -2, marginRight: 6, color: '#0D9488' }} />
                            Tercihler
                        </h3>

                        {/* Theme */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '10px 14px', borderRadius: 12, background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {theme === 'dark' ? <Moon size={15} color="#D4A853" /> : <Sun size={15} color="#F59E0B" />}
                                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                    {theme === 'dark' ? 'Karanlık Mod' : 'Aydınlık Mod'}
                                </span>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: 42, height: 22, cursor: 'pointer' }}>
                                <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme}
                                    style={{ opacity: 0, width: 0, height: 0 }} />
                                <span style={{
                                    position: 'absolute', inset: 0, borderRadius: 22,
                                    background: theme === 'dark' ? '#D4A853' : '#CBD5E1',
                                    transition: 'background 200ms',
                                }}>
                                    <span style={{
                                        position: 'absolute', top: 2, left: theme === 'dark' ? 22 : 2,
                                        width: 18, height: 18, borderRadius: '50%', background: 'white',
                                        transition: 'left 200ms',
                                    }} />
                                </span>
                            </label>
                        </div>

                        {/* Language */}
                        <div style={{ display: 'flex', gap: 6 }}>
                            {[
                                { code: 'tr', flag: '🇹🇷', label: 'Türkçe' },
                                { code: 'en', flag: '🇬🇧', label: 'English' },
                            ].map(lang => (
                                <button key={lang.code} onClick={() => setLocale(lang.code)}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: 12,
                                        border: locale === lang.code ? '2px solid #D4A853' : '1px solid var(--border)',
                                        background: locale === lang.code ? 'rgba(212,168,83,0.08)' : 'var(--bg-primary)',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                        fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)',
                                    }}>
                                    {lang.flag} {lang.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    )
}
