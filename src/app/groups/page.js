'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import Sidebar from '@/components/layout/Sidebar'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, Plus, MapPin, Calendar, ChevronRight, Search, X, Plane,
    Trash2, Check, Loader2, CalendarDays, DollarSign, Clock, Star
} from 'lucide-react'

const EXP_CATS = [
    { key: 'food', emoji: '🍕', label: 'Yemek', color: '#F59E0B' },
    { key: 'transport', emoji: '🚕', label: 'Ulaşım', color: '#3B82F6' },
    { key: 'hotel', emoji: '🏨', label: 'Konaklama', color: '#8B5CF6' },
    { key: 'shopping', emoji: '🛍️', label: 'Alışveriş', color: '#EC4899' },
    { key: 'ticket', emoji: '🎫', label: 'Bilet', color: '#10B981' },
    { key: 'other', emoji: '📦', label: 'Diğer', color: '#64748B' },
]

const STATUS = {
    upcoming: { label: 'Yaklaşıyor', color: '#10B981', bg: '#10B98118' },
    planning: { label: 'Planlanıyor', color: '#F59E0B', bg: '#F59E0B18' },
    completed: { label: 'Tamamlandı', color: '#64748B', bg: '#64748B18' },
}

const INIT_GROUPS = [
    {
        id: 'g1', name: 'Türkiye Macera Ekibi', emoji: '🎒',
        desc: 'Sırt çantalı gezginler. Bütçe dostu rotalar, hostel önerileri.',
        members: [{ n: 'Elif Y.', a: '👩‍🦰' }, { n: 'Burak K.', a: '🧔' }, { n: 'Selin A.', a: '👩' }, { n: 'Emre Ş.', a: '👨‍🦱' }],
        color: '#4F46E5', grad: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
        trips: [
            { id: 't1', title: 'Kapadokya Hafta Sonu', dest: 'Nevşehir', date: '15-17 Mar', budget: '₺2,500/kişi', status: 'upcoming', emoji: '🎈', who: ['Elif Y.', 'Burak K.', 'Selin A.'], notes: 'Balon turu + ATV + vadiler. Sabah 06:00 balon.' },
            { id: 't2', title: 'Ege Sahil Turu', dest: 'İzmir → Bodrum', date: '5-10 Nis', budget: '₺5,000/kişi', status: 'planning', emoji: '🏖️', who: ['Elif Y.', 'Emre Ş.'], notes: 'Alaçatı → Çeşme → Bodrum. Araç kiralama dahil.' },
            { id: 't3', title: 'İstanbul Gastro', dest: 'İstanbul', date: '22 Şub', budget: '₺800/kişi', status: 'completed', emoji: '🍽️', who: ['Burak K.', 'Selin A.', 'Emre Ş.'], notes: 'Karaköy → Balat → Kadıköy yemek turu.' },
        ],
    },
    {
        id: 'g2', name: 'Dijital Göçebeler', emoji: '💻',
        desc: 'Uzaktan çalışanlar — coworking, vize, yaşam maliyetleri.',
        members: [{ n: 'Zeynep D.', a: '👩‍💻' }, { n: 'Mehmet K.', a: '👨‍💻' }, { n: 'Ali Ö.', a: '🧑' }],
        color: '#10B981', grad: 'linear-gradient(135deg,#10B981,#059669)',
        trips: [
            { id: 't4', title: 'Antalya Workation', dest: 'Antalya', date: '1-15 Mar', budget: '₺8,000/kişi', status: 'upcoming', emoji: '☀️', who: ['Zeynep D.', 'Mehmet K.'], notes: 'Coworking + plaj. Wifi hızlı mekanlar.' },
        ],
    },
    {
        id: 'g3', name: 'Fotoğraf Avcıları', emoji: '📸',
        desc: 'En güzel kareleri yakalayan gezginler. Spotlar, ekipman, teknikler.',
        members: [{ n: 'Deniz K.', a: '🧑‍🎨' }, { n: 'Anna S.', a: '👩‍🦳' }, { n: 'Can B.', a: '👨' }, { n: 'Yasemin T.', a: '👩‍🦱' }],
        color: '#F59E0B', grad: 'linear-gradient(135deg,#F59E0B,#D97706)',
        trips: [
            { id: 't5', title: 'Doğu Karadeniz Turu', dest: 'Trabzon → Artvin', date: '20-25 Nis', budget: '₺4,000/kişi', status: 'planning', emoji: '🏔️', who: ['Deniz K.', 'Can B.'], notes: 'Sümela → Uzungöl → Ayder. Drone çekimleri.' },
            { id: 't6', title: 'İstanbul Gece Çekimleri', dest: 'İstanbul', date: '8 Mar', budget: '₺500/kişi', status: 'upcoming', emoji: '🌃', who: ['Anna S.', 'Yasemin T.', 'Deniz K.'], notes: 'Galata → Süleymaniye → Ortaköy.' },
        ],
    },
    {
        id: 'g4', name: 'Doğa & Macera', emoji: '🏔️',
        desc: 'Trekking, dalış, kamp ve outdoor aktiviteleri.',
        members: [{ n: 'Ali Ö.', a: '🧑' }, { n: 'Burak K.', a: '🧔' }, { n: 'Can B.', a: '👨' }],
        color: '#06B6D4', grad: 'linear-gradient(135deg,#06B6D4,#0891B2)',
        trips: [
            { id: 't8', title: 'Likya Yolu Trekking', dest: 'Fethiye → Antalya', date: '10-16 Nis', budget: '₺3,000/kişi', status: 'upcoming', emoji: '🥾', who: ['Ali Ö.', 'Burak K.', 'Can B.'], notes: '6 gün 100km. Kamp + pansiyon.' },
        ],
    },
]

// ═══ Inline Expense Tracker ═══
function TripExpenses({ tripId, members }) {
    const [exps, setExps] = useState([])
    const [show, setShow] = useState(false)
    const [form, setForm] = useState({ desc: '', amount: '', cat: 'food', by: '' })

    useEffect(() => {
        try { const s = localStorage.getItem(`exp-${tripId}`); if (s) setExps(JSON.parse(s)) } catch { }
    }, [tripId])

    const save = (l) => { setExps(l); localStorage.setItem(`exp-${tripId}`, JSON.stringify(l)) }

    const add = () => {
        const amt = parseFloat(form.amount)
        if (!form.desc.trim() || isNaN(amt) || amt <= 0) return
        save([{ id: Date.now(), desc: form.desc.trim(), amount: amt, cat: form.cat, by: form.by || members?.[0]?.n || 'Ben', date: new Date().toISOString() }, ...exps])
        setForm({ desc: '', amount: '', cat: 'food', by: '' })
        setShow(false)
    }

    const total = exps.reduce((s, e) => s + e.amount, 0)
    const mc = Math.max(members?.length || 1, 1)
    const pp = total / mc

    return (
        <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                    💰 Harcamalar
                </span>
                <button onClick={() => setShow(!show)} style={{
                    padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: '0.7rem', background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', color: '#fff',
                }}>{show ? '✕' : <><Plus size={12} /> Ekle</>}</button>
            </div>

            <AnimatePresence>
                {show && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 14, padding: 14, border: '1px solid var(--border)', marginBottom: 12 }}>
                            <input className="input" placeholder="Açıklama (Taksi, Restoran...)" value={form.desc}
                                onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} style={{ marginBottom: 8, fontSize: '0.84rem' }}
                                onKeyDown={e => e.key === 'Enter' && add()} autoFocus />
                            <input className="input" type="number" inputMode="decimal" placeholder="₺ Tutar" value={form.amount}
                                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} style={{ marginBottom: 8, fontSize: '0.84rem' }}
                                onKeyDown={e => e.key === 'Enter' && add()} />
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                                {EXP_CATS.map(c => (
                                    <button key={c.key} onClick={() => setForm(p => ({ ...p, cat: c.key }))} style={{
                                        padding: '4px 10px', borderRadius: 16, fontSize: '0.68rem', border: 'none', cursor: 'pointer', fontWeight: 600,
                                        background: form.cat === c.key ? c.color : 'var(--bg-tertiary)',
                                        color: form.cat === c.key ? '#fff' : 'var(--text-secondary)',
                                    }}>{c.emoji} {c.label}</button>
                                ))}
                            </div>
                            {members?.length > 1 && (
                                <select className="input" value={form.by} onChange={e => setForm(p => ({ ...p, by: e.target.value }))} style={{ marginBottom: 8, fontSize: '0.82rem' }}>
                                    {members.map(m => <option key={m.n} value={m.n}>{m.n}</option>)}
                                </select>
                            )}
                            <button onClick={add} disabled={!form.desc || !form.amount} style={{
                                width: '100%', padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                fontWeight: 700, fontSize: '0.84rem', background: form.desc && form.amount ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'var(--bg-tertiary)',
                                color: form.desc && form.amount ? '#fff' : 'var(--text-tertiary)',
                            }}>💰 Harcama Ekle</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {exps.length > 0 && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                        <div style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 12, padding: '10px 14px', color: '#fff' }}>
                            <div style={{ fontSize: '0.62rem', opacity: 0.8 }}>Toplam</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>₺{total.toLocaleString('tr-TR')}</div>
                        </div>
                        <div style={{ background: 'linear-gradient(135deg,#10B981,#059669)', borderRadius: 12, padding: '10px 14px', color: '#fff' }}>
                            <div style={{ fontSize: '0.62rem', opacity: 0.8 }}>Kişi Başı</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>₺{Math.round(pp).toLocaleString()}</div>
                            <div style={{ fontSize: '0.55rem', opacity: 0.7 }}>{mc} kişi</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {exps.map(e => {
                            const cat = EXP_CATS.find(c => c.key === e.cat)
                            return (
                                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                                    <span style={{ width: 32, height: 32, borderRadius: 8, background: `${cat?.color || '#64748B'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', flexShrink: 0 }}>{cat?.emoji || '📦'}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{e.desc}</div>
                                        <div style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>{e.by} · {new Date(e.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</div>
                                    </div>
                                    <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>₺{e.amount.toLocaleString()}</span>
                                    <button onClick={() => save(exps.filter(x => x.id !== e.id))} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 2, opacity: 0.5 }}><Trash2 size={13} /></button>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}
            {exps.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)', fontSize: '0.78rem' }}>💸 Henüz harcama yok</div>}
        </div>
    )
}

// ═══ MAIN PAGE ═══
export default function GroupsPage() {
    const { user } = useAuth()
    const { locale } = useLanguage()
    const { toast } = useToast()
    const [groups, setGroups] = useState(INIT_GROUPS)
    const [search, setSearch] = useState('')
    const [joined, setJoined] = useState(new Set(['g1', 'g3']))
    const [selGroup, setSelGroup] = useState(null)
    const [selTrip, setSelTrip] = useState(null)
    const [showCG, setShowCG] = useState(false)
    const [showCT, setShowCT] = useState(false)
    const [tab, setTab] = useState('all')
    const [ng, setNg] = useState({ name: '', desc: '', emoji: '🌍' })
    const [nt, setNt] = useState({ title: '', dest: '', date: '', budget: '', notes: '', emoji: '✈️' })

    const filtered = groups.filter(g => {
        const m = !search.trim() || g.name.toLowerCase().includes(search.toLowerCase())
        return tab === 'joined' ? m && joined.has(g.id) : m
    })

    const toggleJoin = id => setJoined(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })

    const createGroup = () => {
        if (!ng.name.trim()) return
        const g = { id: `g_${Date.now()}`, name: ng.name, emoji: ng.emoji, desc: ng.desc || 'Yeni ekip.', members: [{ n: 'Sen', a: '👤' }], color: '#8B5CF6', grad: 'linear-gradient(135deg,#8B5CF6,#EC4899)', trips: [] }
        setGroups(p => [g, ...p]); setJoined(p => new Set([...p, g.id])); setShowCG(false); setNg({ name: '', desc: '', emoji: '🌍' })
        toast.success('Ekip oluşturuldu! 🎉')
    }

    const createTrip = () => {
        if (!nt.title.trim() || !selGroup) return
        const t = { id: `t_${Date.now()}`, title: nt.title, dest: nt.dest || 'TBD', date: nt.date || 'TBD', budget: nt.budget || '—', status: 'planning', emoji: nt.emoji, who: ['Sen'], notes: nt.notes }
        setGroups(p => p.map(g => g.id === selGroup.id ? { ...g, trips: [t, ...g.trips] } : g))
        setSelGroup(p => p ? { ...p, trips: [t, ...p.trips] } : p)
        setShowCT(false); setNt({ title: '', dest: '', date: '', budget: '', notes: '', emoji: '✈️' })
        toast.success('Gezi oluşturuldu! ✈️')
    }

    const deleteTrip = (gid, tid) => {
        setGroups(p => p.map(g => g.id === gid ? { ...g, trips: g.trips.filter(t => t.id !== tid) } : g))
        setSelGroup(p => p ? { ...p, trips: p.trips.filter(t => t.id !== tid) } : p)
        setSelTrip(null); toast.success('Gezi silindi')
    }

    const totTrips = groups.reduce((s, g) => s + g.trips.length, 0)
    const upTrips = groups.reduce((s, g) => s + g.trips.filter(t => t.status === 'upcoming').length, 0)

    return (
        <><Sidebar />
            <div className="main-content"><div className="page" style={{ maxWidth: 800, margin: '0 auto' }}>

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 2px', background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                🧑‍🤝‍🧑 Seyahat Ekipleri
                            </h1>
                            <p style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)', margin: 0 }}>Birlikte planla, birlikte gez, masrafları böl</p>
                        </div>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowCG(true)}
                            style={{ background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', color: '#fff', border: 'none', borderRadius: 14, padding: '10px 18px', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 15px rgba(139,92,246,0.3)' }}>
                            <Plus size={16} /> Ekip Kur
                        </motion.button>
                    </div>
                </motion.div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                    {[{ l: 'Ekip', v: groups.length, i: <Users size={16} />, c: '#8B5CF6' }, { l: 'Gezi', v: totTrips, i: <Plane size={16} />, c: '#EC4899' }, { l: 'Yaklaşan', v: upTrips, i: <CalendarDays size={16} />, c: '#10B981' }].map((s, i) => (
                        <div key={i} style={{ background: 'var(--bg-secondary)', borderRadius: 14, border: '1px solid var(--border)', padding: 12, textAlign: 'center' }}>
                            <div style={{ color: s.c, marginBottom: 4, display: 'flex', justifyContent: 'center' }}>{s.i}</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{s.v}</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>{s.l}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    {[['all', 'Tümü'], ['joined', 'Ekiplerim']].map(([k, l]) => (
                        <button key={k} onClick={() => setTab(k)} style={{
                            padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: tab === k ? 'linear-gradient(135deg,#8B5CF6,#EC4899)' : 'var(--bg-tertiary)',
                            color: tab === k ? '#fff' : 'var(--text-secondary)', fontWeight: 700, fontSize: '0.78rem',
                        }}>{l}</button>
                    ))}
                </div>

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: 16 }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input className="input" placeholder="Ekip ara..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40, fontSize: '0.86rem' }} />
                </div>

                {/* Groups List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filtered.map((g, i) => {
                        const up = g.trips.filter(t => t.status === 'upcoming').length
                        return (
                            <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                onClick={() => setSelGroup(g)}
                                style={{ background: 'var(--bg-secondary)', borderRadius: 18, border: '1px solid var(--border)', cursor: 'pointer', transition: 'border-color 200ms', overflow: 'hidden' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = g.color} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                                {/* Gradient bar */}
                                <div style={{ height: 4, background: g.grad }} />
                                <div style={{ padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ width: 46, height: 46, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', background: g.grad, flexShrink: 0 }}>{g.emoji}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 2px' }}>{g.emoji} {g.name}</h3>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                <span>👥 {g.members.length}</span><span>✈️ {g.trips.length} gezi</span>
                                                {up > 0 && <span style={{ color: '#10B981' }}>🟢 {up} yaklaşan</span>}
                                            </div>
                                        </div>
                                        <motion.button whileTap={{ scale: 0.9 }} onClick={e => { e.stopPropagation(); toggleJoin(g.id) }}
                                            style={{ padding: '7px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', background: joined.has(g.id) ? `${g.color}15` : g.grad, color: joined.has(g.id) ? g.color : '#fff' }}>
                                            {joined.has(g.id) ? '✓ Üye' : 'Katıl'}
                                        </motion.button>
                                        <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                                    </div>
                                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '8px 0 0', lineHeight: 1.4 }}>{g.desc}</p>
                                    {g.trips.filter(t => t.status !== 'completed').length > 0 && (
                                        <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
                                            {g.trips.filter(t => t.status !== 'completed').slice(0, 3).map(t => (
                                                <span key={t.id} style={{ padding: '4px 10px', borderRadius: 8, fontSize: '0.65rem', background: STATUS[t.status]?.bg, color: STATUS[t.status]?.color, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{t.emoji} {t.title}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}><div style={{ fontSize: 48, opacity: 0.3 }}>👥</div><p style={{ fontWeight: 600, marginTop: 8 }}>Ekip bulunamadı</p></div>}

                {/* ═══ GROUP DETAIL (Bottom Sheet) ═══ */}
                <AnimatePresence>
                    {selGroup && !selTrip && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
                            onClick={() => setSelGroup(null)}>
                            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                                onClick={e => e.stopPropagation()}
                                style={{ width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: 'var(--bg-primary)', borderRadius: '24px 24px 0 0', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>
                                {/* Drag indicator */}
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
                                    <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
                                </div>
                                <div style={{ padding: '12px 20px 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ width: 44, height: 44, borderRadius: 14, background: selGroup.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>{selGroup.emoji}</span>
                                            <div>
                                                <h2 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0 }}>{selGroup.name}</h2>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>👥 {selGroup.members.length} · ✈️ {selGroup.trips.length}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelGroup(null)} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: 'var(--bg-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}><X size={16} /></button>
                                    </div>
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>{selGroup.desc}</p>
                                </div>

                                <div style={{ padding: '0 20px 24px' }}>
                                    {/* Members */}
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}><Users size={13} /> Üyeler</div>
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            {selGroup.members.map((m, i) => <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: '0.74rem', fontWeight: 600 }}>{m.a} {m.n}</span>)}
                                        </div>
                                    </div>

                                    {/* Trips */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}><Plane size={13} /> Geziler</span>
                                        {joined.has(selGroup.id) && <button onClick={() => setShowCT(true)} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.7rem', background: selGroup.grad, color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={11} /> Gezi</button>}
                                    </div>
                                    {selGroup.trips.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: 28, color: 'var(--text-tertiary)', fontSize: '0.78rem' }}>✈️ Henüz gezi yok</div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {selGroup.trips.map(trip => {
                                                const st = STATUS[trip.status]
                                                return (
                                                    <div key={trip.id} onClick={() => setSelTrip(trip)} style={{ padding: '12px 14px', borderRadius: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'border-color 150ms' }}
                                                        onMouseEnter={e => e.currentTarget.style.borderColor = selGroup.color} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <span style={{ fontSize: '1.4rem' }}>{trip.emoji}</span>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{trip.title}</div>
                                                                <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                                    <span>📍 {trip.dest}</span><span>📅 {trip.date}</span><span>💰 {trip.budget}</span>
                                                                </div>
                                                            </div>
                                                            <span style={{ padding: '3px 8px', borderRadius: 6, background: st?.bg, color: st?.color, fontSize: '0.6rem', fontWeight: 700 }}>{st?.label}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                                                            {trip.who.map((p, i) => <span key={i} style={{ padding: '2px 7px', borderRadius: 6, background: 'var(--bg-tertiary)', fontSize: '0.62rem', fontWeight: 600 }}>{p}</span>)}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => toggleJoin(selGroup.id)} style={{
                                        width: '100%', padding: 13, borderRadius: 14, border: 'none', marginTop: 16, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
                                        background: joined.has(selGroup.id) ? 'var(--bg-tertiary)' : selGroup.grad,
                                        color: joined.has(selGroup.id) ? 'var(--text-secondary)' : '#fff',
                                    }}>{joined.has(selGroup.id) ? '✓ Katıldın — Ayrıl' : '🚀 Ekibe Katıl'}</motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══ TRIP DETAIL with Expenses ═══ */}
                <AnimatePresence>
                    {selTrip && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
                            onClick={() => setSelTrip(null)}>
                            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                                onClick={e => e.stopPropagation()}
                                style={{ width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: 'var(--bg-primary)', borderRadius: '24px 24px 0 0', boxShadow: '0 -10px 40px rgba(0,0,0,0.25)' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} /></div>
                                {/* Trip hero */}
                                <div style={{ padding: '16px 20px 12px', background: selGroup?.grad || 'var(--bg-secondary)', color: '#fff', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2.5rem', marginBottom: 6 }}>{selTrip.emoji}</div>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: '0 0 4px' }}>{selTrip.title}</h3>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>📍 {selTrip.dest}</div>
                                </div>
                                <div style={{ padding: '14px 20px 24px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                                        <div style={{ padding: 10, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border)', textAlign: 'center' }}>
                                            <CalendarDays size={14} style={{ color: '#8B5CF6', marginBottom: 3 }} />
                                            <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{selTrip.date}</div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>Tarih</div>
                                        </div>
                                        <div style={{ padding: 10, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border)', textAlign: 'center' }}>
                                            <DollarSign size={14} style={{ color: '#10B981', marginBottom: 3 }} />
                                            <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{selTrip.budget}</div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>Bütçe</div>
                                        </div>
                                    </div>
                                    <span style={{ padding: '4px 10px', borderRadius: 6, background: STATUS[selTrip.status]?.bg, color: STATUS[selTrip.status]?.color, fontSize: '0.7rem', fontWeight: 700 }}>{STATUS[selTrip.status]?.label}</span>
                                    <div style={{ marginTop: 12, marginBottom: 10 }}>
                                        <div style={{ fontSize: '0.76rem', fontWeight: 700, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}><Users size={12} /> Katılımcılar</div>
                                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{selTrip.who.map((p, i) => <span key={i} style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--bg-tertiary)', fontSize: '0.72rem', fontWeight: 600 }}>{p}</span>)}</div>
                                    </div>
                                    {selTrip.notes && (
                                        <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>{selTrip.notes}</div>
                                    )}

                                    {/* ═══ EXPENSE TRACKER ═══ */}
                                    <TripExpenses tripId={selTrip.id} members={selGroup?.members?.map(m => ({ n: m.n })) || []} />

                                    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                        <button onClick={() => setSelTrip(null)} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: selGroup?.grad || '#8B5CF6', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Tamam</button>
                                        <button onClick={() => deleteTrip(selGroup?.id, selTrip.id)} style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: '0.8rem' }}><Trash2 size={14} /> Sil</button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══ CREATE GROUP ═══ */}
                <AnimatePresence>
                    {showCG && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
                            onClick={() => setShowCG(false)}>
                            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }} onClick={e => e.stopPropagation()}
                                style={{ width: '100%', maxWidth: 400, background: 'var(--bg-primary)', borderRadius: 24, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: '0 0 14px' }}>✨ Yeni Ekip</h3>
                                <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                                    {['🌍', '🎒', '🍽️', '📸', '🏔️', '🚂', '✈️', '🏖️', '💻', '🎭'].map(e => (
                                        <button key={e} onClick={() => setNg(p => ({ ...p, emoji: e }))} style={{ width: 38, height: 38, borderRadius: 10, border: ng.emoji === e ? '2px solid #8B5CF6' : '2px solid var(--border)', background: ng.emoji === e ? '#8B5CF615' : 'var(--bg-secondary)', cursor: 'pointer', fontSize: '1.1rem' }}>{e}</button>
                                    ))}
                                </div>
                                <input className="input" placeholder="Ekip adı *" value={ng.name} onChange={e => setNg(p => ({ ...p, name: e.target.value }))} style={{ marginBottom: 10, fontSize: '0.86rem' }} />
                                <textarea className="input" placeholder="Açıklama..." rows={2} value={ng.desc} onChange={e => setNg(p => ({ ...p, desc: e.target.value }))} style={{ marginBottom: 14, fontSize: '0.84rem', resize: 'none' }} />
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={createGroup} disabled={!ng.name.trim()} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: ng.name.trim() ? 'linear-gradient(135deg,#8B5CF6,#EC4899)' : 'var(--bg-tertiary)', color: ng.name.trim() ? '#fff' : 'var(--text-tertiary)', fontWeight: 700, cursor: 'pointer' }}>Oluştur</button>
                                    <button onClick={() => setShowCG(false)} style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>İptal</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══ CREATE TRIP ═══ */}
                <AnimatePresence>
                    {showCT && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
                            onClick={() => setShowCT(false)}>
                            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }} onClick={e => e.stopPropagation()}
                                style={{ width: '100%', maxWidth: 420, background: 'var(--bg-primary)', borderRadius: 24, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: '0 0 14px' }}>✈️ Yeni Gezi Planla</h3>
                                <div style={{ display: 'flex', gap: 5, marginBottom: 12, flexWrap: 'wrap' }}>
                                    {['✈️', '🏖️', '🏔️', '🎈', '🗺️', '🥾', '🌃', '☀️', '🍽️', '🚂'].map(e => (
                                        <button key={e} onClick={() => setNt(p => ({ ...p, emoji: e }))} style={{ width: 36, height: 36, borderRadius: 10, border: nt.emoji === e ? '2px solid #8B5CF6' : '2px solid var(--border)', background: nt.emoji === e ? '#8B5CF615' : 'var(--bg-secondary)', cursor: 'pointer', fontSize: '1rem' }}>{e}</button>
                                    ))}
                                </div>
                                <input className="input" placeholder="Gezi adı *" value={nt.title} onChange={e => setNt(p => ({ ...p, title: e.target.value }))} style={{ marginBottom: 8, fontSize: '0.84rem' }} />
                                <input className="input" placeholder="📍 Nereye?" value={nt.dest} onChange={e => setNt(p => ({ ...p, dest: e.target.value }))} style={{ marginBottom: 8, fontSize: '0.84rem' }} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                                    <input className="input" placeholder="📅 Tarih" value={nt.date} onChange={e => setNt(p => ({ ...p, date: e.target.value }))} style={{ fontSize: '0.84rem' }} />
                                    <input className="input" placeholder="💰 Bütçe" value={nt.budget} onChange={e => setNt(p => ({ ...p, budget: e.target.value }))} style={{ fontSize: '0.84rem' }} />
                                </div>
                                <textarea className="input" placeholder="Notlar..." rows={2} value={nt.notes} onChange={e => setNt(p => ({ ...p, notes: e.target.value }))} style={{ marginBottom: 14, fontSize: '0.84rem', resize: 'none' }} />
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={createTrip} disabled={!nt.title.trim()} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: nt.title.trim() ? (selGroup?.grad || 'linear-gradient(135deg,#8B5CF6,#EC4899)') : 'var(--bg-tertiary)', color: nt.title.trim() ? '#fff' : 'var(--text-tertiary)', fontWeight: 700, cursor: 'pointer' }}>🚀 Oluştur</button>
                                    <button onClick={() => setShowCT(false)} style={{ padding: '12px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>İptal</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div></div>
        </>
    )
}
