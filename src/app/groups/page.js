'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, Plus, MapPin, Calendar, Heart, MessageCircle,
    Crown, Star, ChevronRight, Search, X, Sparkles, Globe
} from 'lucide-react'

const SAMPLE_GROUPS = [
    {
        id: 'backpackers-tr',
        name: 'Türkiye Backpackers 🎒',
        desc: 'Sırt çantalı gezginler topluluğu. Bütçe dostu rotalar, hostel önerileri ve yol arkadaşı arayışı.',
        emoji: '🎒', members: 248, posts: 89, category: 'Genel',
        color: '#4F46E5', gradient: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
        tags: ['Budget', 'Hostel', 'Solo Travel'],
        recentActivity: 'Elif Y. yeni bir rota paylaştı',
        cover: '/social/istanbul_galata.png',
    },
    {
        id: 'foodie-explorers',
        name: 'Foodie Explorers 🍽️',
        desc: 'Gastronomi tutkunu gezginler. Sokak lezzetleri, yerel restoranlar ve mutfak deneyimleri.',
        emoji: '🍽️', members: 175, posts: 134, category: 'Yemek',
        color: '#EC4899', gradient: 'linear-gradient(135deg, #EC4899, #F43F5E)',
        tags: ['Street Food', 'Local Cuisine', 'Chef Tips'],
        recentActivity: 'Deniz K. Antep rehberi paylaştı',
        cover: '/social/bazaar_spices.png',
    },
    {
        id: 'digital-nomads',
        name: 'Digital Nomads Turkey 💻',
        desc: 'Uzaktan çalışan dijital göçebeler. Coworking mekanları, WiFi hızları ve yaşam maliyetleri.',
        emoji: '💻', members: 312, posts: 67, category: 'Yaşam',
        color: '#10B981', gradient: 'linear-gradient(135deg, #10B981, #059669)',
        tags: ['Remote Work', 'Coworking', 'Visa'],
        recentActivity: 'Zeynep D. Antalya coworking listesi',
        cover: '/social/bosphorus_ferry.png',
    },
    {
        id: 'photo-hunters',
        name: 'Fotoğraf Avcıları 📸',
        desc: 'En güzel kareleri yakalayan gezginler. Fotoğraf spotları, ekipman tavsiyeleri ve çekim teknikleri.',
        emoji: '📸', members: 189, posts: 156, category: 'Fotoğrafçılık',
        color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
        tags: ['Landscape', 'Street Photo', 'Drone'],
        recentActivity: 'Mehmet K. Kapadokya çekimleri',
        cover: '/social/cappadocia_balloons.png',
    },
    {
        id: 'europe-trip',
        name: 'Avrupa Interrail 🚂',
        desc: 'Trenle Avrupa turu planlayan ve deneyimlerini paylaşan gezginler grubu.',
        emoji: '🚂', members: 156, posts: 78, category: 'Rota',
        color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
        tags: ['Interrail', 'Budget', 'Europe'],
        recentActivity: 'Anna S. Berlin-Prag rotası',
        cover: '/social/paris_eiffel.png',
    },
    {
        id: 'outdoor-adventures',
        name: 'Doğa & Macera 🏔️',
        desc: 'Trekking, dağcılık, dalış ve outdoor sporları tutkunu gezginler.',
        emoji: '🏔️', members: 203, posts: 92, category: 'Macera',
        color: '#06B6D4', gradient: 'linear-gradient(135deg, #06B6D4, #0891B2)',
        tags: ['Trekking', 'Diving', 'Camping'],
        recentActivity: 'Ali Ö. Kaçkar rotası paylaştı',
        cover: '/social/istanbul_mosque.png',
    },
    {
        id: 'solo-women',
        name: 'Solo Kadın Gezginler 👩‍✈️',
        desc: 'Yalnız seyahat eden kadın gezginler. Güvenlik ipuçları, ilham veren rotalar.',
        emoji: '👩‍✈️', members: 267, posts: 145, category: 'Topluluk',
        color: '#EC4899', gradient: 'linear-gradient(135deg, #F43F5E, #EC4899)',
        tags: ['Safety', 'Empowerment', 'Community'],
        recentActivity: 'Selin A. güvenlik rehberi',
    },
    {
        id: 'budget-travel',
        name: 'Bütçe Gezgini 💰',
        desc: 'En az parayla en çok gezmek! Ucuz uçaklar, ücretsiz aktiviteler, hostel hileleri.',
        emoji: '💰', members: 341, posts: 198, category: 'Budget',
        color: '#22C55E', gradient: 'linear-gradient(135deg, #22C55E, #16A34A)',
        tags: ['Cheap Flights', 'Free Activities', 'Hacks'],
        recentActivity: 'Emre Ş. 500TL ile hafta sonu',
    },
]

const CATEGORIES = ['Tümü', 'Genel', 'Yemek', 'Yaşam', 'Fotoğrafçılık', 'Rota', 'Macera', 'Topluluk', 'Budget']

export default function GroupsPage() {
    const router = useRouter()
    const { user } = useAuth()
    const { locale } = useLanguage()
    const t = (tr, en) => locale === 'tr' ? tr : en

    const [search, setSearch] = useState('')
    const [selectedCat, setSelectedCat] = useState('Tümü')
    const [joinedGroups, setJoinedGroups] = useState(new Set(['backpackers-tr', 'foodie-explorers']))
    const [selectedGroup, setSelectedGroup] = useState(null)

    const filteredGroups = SAMPLE_GROUPS.filter(g => {
        const matchSearch = !search.trim() ||
            g.name.toLowerCase().includes(search.toLowerCase()) ||
            g.desc.toLowerCase().includes(search.toLowerCase())
        const matchCat = selectedCat === 'Tümü' || g.category === selectedCat
        return matchSearch && matchCat
    })

    const toggleJoin = (groupId) => {
        setJoinedGroups(prev => {
            const next = new Set(prev)
            if (next.has(groupId)) next.delete(groupId)
            else next.add(groupId)
            return next
        })
    }

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-main" style={{ overflowY: 'auto' }}>
                <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px 60px' }}>

                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                        style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h1 style={{
                                    fontSize: '1.6rem', fontWeight: 900, margin: '0 0 4px',
                                    background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                }}>
                                    👥 {t('Gruplar', 'Groups')}
                                </h1>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: 0 }}>
                                    {t('Gezgin topluluklarına katıl, deneyimlerini paylaş', 'Join travel communities')}
                                </p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                style={{
                                    background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                                    color: '#fff', border: 'none', borderRadius: 14,
                                    padding: '10px 18px', cursor: 'pointer', fontWeight: 700,
                                    fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6,
                                    boxShadow: '0 4px 15px rgba(139,92,246,0.3)',
                                }}>
                                <Plus size={16} /> {t('Grup Oluştur', 'Create Group')}
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Stats Bar */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        style={{
                            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20,
                        }}>
                        {[
                            { label: t('Aktif Grup', 'Active Groups'), value: SAMPLE_GROUPS.length, icon: <Users size={18} />, color: '#8B5CF6' },
                            { label: t('Toplam Üye', 'Total Members'), value: SAMPLE_GROUPS.reduce((s, g) => s + g.members, 0).toLocaleString(), icon: <Globe size={18} />, color: '#EC4899' },
                            { label: t('Katıldığın', 'Joined'), value: joinedGroups.size, icon: <Heart size={18} />, color: '#10B981' },
                        ].map((stat, i) => (
                            <div key={i} style={{
                                background: 'var(--bg-secondary)', borderRadius: 16,
                                border: '1px solid var(--border)', padding: '16px 18px',
                                textAlign: 'center',
                            }}>
                                <div style={{ color: stat.color, marginBottom: 6, display: 'flex', justifyContent: 'center' }}>{stat.icon}</div>
                                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)' }}>{stat.value}</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Search */}
                    <div style={{ position: 'relative', marginBottom: 16 }}>
                        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input className="input" placeholder={t('Grup ara...', 'Search groups...')}
                            value={search} onChange={e => setSearch(e.target.value)}
                            style={{ paddingLeft: 40, fontSize: '0.88rem' }} />
                    </div>

                    {/* Category Chips */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                        {CATEGORIES.map(cat => (
                            <button key={cat}
                                onClick={() => setSelectedCat(cat)}
                                style={{
                                    padding: '8px 14px', borderRadius: 10, border: 'none',
                                    cursor: 'pointer', whiteSpace: 'nowrap',
                                    background: selectedCat === cat ? 'linear-gradient(135deg, #8B5CF6, #EC4899)' : 'var(--bg-tertiary)',
                                    color: selectedCat === cat ? '#fff' : 'var(--text-secondary)',
                                    fontWeight: 700, fontSize: '0.78rem', transition: 'all 200ms',
                                }}>
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Groups Grid */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {filteredGroups.map((group, i) => (
                            <motion.div key={group.id}
                                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ y: -3, boxShadow: '0 12px 30px rgba(0,0,0,0.12)' }}
                                style={{
                                    background: 'var(--bg-secondary)', borderRadius: 20,
                                    border: '1px solid var(--border)', overflow: 'hidden',
                                    cursor: 'pointer', transition: 'all 200ms',
                                }}
                                onClick={() => setSelectedGroup(group)}>
                                {/* Cover Image */}
                                {group.cover && (
                                    <div style={{
                                        height: 100, overflow: 'hidden', position: 'relative',
                                        background: `url(${group.cover}) center/cover no-repeat`,
                                    }}>
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            background: `linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.4))`,
                                        }} />
                                    </div>
                                )}
                                <div style={{ padding: '16px 20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                <span style={{
                                                    width: 40, height: 40, borderRadius: 12, display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                                                    background: group.gradient, flexShrink: 0,
                                                }}>{group.emoji}</span>
                                                <div>
                                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>{group.name}</h3>
                                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', display: 'flex', gap: 8 }}>
                                                        <span>👥 {group.members} üye</span>
                                                        <span>💬 {group.posts} paylaşım</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>
                                                {group.desc}
                                            </p>
                                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                                                {group.tags.map((tag, ti) => (
                                                    <span key={ti} style={{
                                                        fontSize: '0.6rem', padding: '3px 8px', borderRadius: 6,
                                                        background: `${group.color}15`, color: group.color, fontWeight: 700,
                                                    }}>#{tag}</span>
                                                ))}
                                            </div>
                                            {group.recentActivity && (
                                                <div style={{
                                                    fontSize: '0.68rem', color: 'var(--text-tertiary)',
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                }}>
                                                    <Sparkles size={11} style={{ color: group.color }} />
                                                    {group.recentActivity}
                                                </div>
                                            )}
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                            onClick={(e) => { e.stopPropagation(); toggleJoin(group.id) }}
                                            style={{
                                                padding: '8px 16px', borderRadius: 10, border: 'none',
                                                cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem',
                                                flexShrink: 0, marginTop: 4,
                                                background: joinedGroups.has(group.id)
                                                    ? 'var(--bg-tertiary)' : group.gradient,
                                                color: joinedGroups.has(group.id) ? 'var(--text-secondary)' : 'white',
                                            }}>
                                            {joinedGroups.has(group.id) ? '✓ Katıldın' : 'Katıl'}
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {filteredGroups.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}>
                            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>👥</div>
                            <p style={{ fontWeight: 600 }}>{t('Grup bulunamadı', 'No groups found')}</p>
                        </div>
                    )}

                    {/* Group Detail Modal */}
                    <AnimatePresence>
                        {selectedGroup && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                style={{
                                    position: 'fixed', inset: 0, zIndex: 9999,
                                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: 20,
                                }}
                                onClick={() => setSelectedGroup(null)}>
                                <motion.div
                                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 40, scale: 0.95 }}
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                        width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto',
                                        background: 'var(--bg-primary)', borderRadius: 28,
                                        boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
                                        border: '1px solid var(--border)',
                                    }}>
                                    {/* Cover */}
                                    <div style={{
                                        height: 180, position: 'relative',
                                        background: selectedGroup.cover
                                            ? `url(${selectedGroup.cover}) center/cover no-repeat`
                                            : selectedGroup.gradient,
                                    }}>
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            background: 'linear-gradient(to top, var(--bg-primary) 0%, rgba(0,0,0,0.3) 50%, transparent)',
                                        }} />
                                        <button onClick={() => setSelectedGroup(null)} style={{
                                            position: 'absolute', top: 16, right: 16,
                                            width: 36, height: 36, borderRadius: 12,
                                            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
                                            border: 'none', color: 'white', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}><X size={18} /></button>
                                        <div style={{ position: 'absolute', bottom: 16, left: 20 }}>
                                            <h2 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 900, margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                                                {selectedGroup.emoji} {selectedGroup.name}
                                            </h2>
                                        </div>
                                    </div>

                                    <div style={{ padding: '20px 24px 28px' }}>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 16px' }}>
                                            {selectedGroup.desc}
                                        </p>

                                        {/* Stats */}
                                        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{selectedGroup.members}</div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Üye</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{selectedGroup.posts}</div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Paylaşım</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{selectedGroup.category}</div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Kategori</div>
                                            </div>
                                        </div>

                                        {/* Tags */}
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                                            {selectedGroup.tags.map((tag, ti) => (
                                                <span key={ti} style={{
                                                    padding: '6px 12px', borderRadius: 10,
                                                    background: `${selectedGroup.color}15`, color: selectedGroup.color,
                                                    fontWeight: 700, fontSize: '0.75rem',
                                                }}>#{tag}</span>
                                            ))}
                                        </div>

                                        {/* Sample Posts */}
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 12px' }}>💬 Son Paylaşımlar</h4>
                                        {[
                                            { user: 'Elif Y.', text: 'İstanbul\'da en iyi sokak yemeği rotası 🍽️', time: '2 sa' },
                                            { user: 'Ali Ö.', text: 'Kapadokya balon turu rehberi paylaşıyorum 🎈', time: '5 sa' },
                                            { user: 'Zeynep D.', text: 'Antalya\'da uzaktan çalışmak için en iyi cafeler ☕', time: '1 gün' },
                                        ].map((post, pi) => (
                                            <div key={pi} style={{
                                                padding: '12px 14px', borderRadius: 12,
                                                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                                marginBottom: 8,
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                    <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{post.user}</span>
                                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{post.time}</span>
                                                </div>
                                                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>{post.text}</p>
                                            </div>
                                        ))}

                                        {/* Join Button */}
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => toggleJoin(selectedGroup.id)}
                                            style={{
                                                width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                                                marginTop: 12, cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem',
                                                background: joinedGroups.has(selectedGroup.id)
                                                    ? 'var(--bg-tertiary)' : selectedGroup.gradient,
                                                color: joinedGroups.has(selectedGroup.id) ? 'var(--text-secondary)' : 'white',
                                            }}>
                                            {joinedGroups.has(selectedGroup.id) ? '✓ Katıldın — Ayrıl' : '🚀 Gruba Katıl'}
                                        </motion.button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    )
}
