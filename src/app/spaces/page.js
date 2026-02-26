'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useSpace } from '@/context/SpaceContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import { Users, Plus, Settings, MapPin, Calendar, Loader2, UserPlus, Copy, Check, Trash2, Crown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

export default function SpacesPage() {
    const [spaces, setSpaces] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [newName, setNewName] = useState('')
    const [creating, setCreating] = useState(false)
    const [inviteCode, setInviteCode] = useState('')
    const [joining, setJoining] = useState(false)
    const [joinCode, setJoinCode] = useState('')
    const [copied, setCopied] = useState(null)

    const { user } = useAuth()
    const { space, setActiveSpace } = useSpace()
    const { locale } = useLanguage()
    const supabase = createClient()
    const router = useRouter()
    const t = (tr, en) => locale === 'tr' ? tr : en

    useEffect(() => { if (user) loadSpaces() }, [user])

    const loadSpaces = async () => {
        setLoading(true)
        try {
            const { data: memberships } = await supabase
                .from('space_members')
                .select('space_id, role, spaces(id, name, invite_code, created_at)')
                .eq('user_id', user.id)
            if (memberships) {
                const spaceList = memberships.map(m => ({
                    ...m.spaces,
                    role: m.role,
                })).filter(Boolean)
                setSpaces(spaceList)
            }
        } catch { }
        setLoading(false)
    }

    const createSpace = async () => {
        if (!newName.trim()) return
        setCreating(true)
        try {
            const code = Math.random().toString(36).substring(2, 10).toUpperCase()
            const { data: newSpace, error } = await supabase
                .from('spaces')
                .insert({ name: newName.trim(), invite_code: code, created_by: user.id })
                .select().single()
            if (error) throw error
            // Add creator as admin
            await supabase.from('space_members').insert({
                space_id: newSpace.id, user_id: user.id, role: 'admin'
            })
            setNewName('')
            setShowCreate(false)
            toast.success(t('Grup oluşturuldu!', 'Group created!'))
            loadSpaces()
        } catch (err) {
            toast.error(err.message)
        }
        setCreating(false)
    }

    const joinSpace = async () => {
        if (!joinCode.trim()) return
        setJoining(true)
        try {
            const { data: spaceData } = await supabase
                .from('spaces')
                .select('id')
                .eq('invite_code', joinCode.trim().toUpperCase())
                .single()
            if (!spaceData) { toast.error(t('Geçersiz kod', 'Invalid code')); setJoining(false); return }
            const { error } = await supabase.from('space_members').insert({
                space_id: spaceData.id, user_id: user.id, role: 'member'
            })
            if (error) throw error
            setJoinCode('')
            toast.success(t('Gruba katıldın!', 'Joined group!'))
            loadSpaces()
        } catch (err) {
            toast.error(err.message)
        }
        setJoining(false)
    }

    const copyCode = (code) => {
        navigator.clipboard?.writeText(code)
        setCopied(code)
        toast.success(t('Kod kopyalandı!', 'Code copied!'))
        setTimeout(() => setCopied(null), 2000)
    }

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="page" style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px 100px' }}>
                    <div style={{ marginBottom: 24 }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                            👥 {t('Gruplar & Alanlar', 'Groups & Spaces')}
                        </h1>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
                            {t('Seyahat arkadaşlarınla ortak plan yap', 'Plan together with travel buddies')}
                        </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                            <Plus size={16} /> {t('Yeni Grup', 'New Group')}
                        </button>
                    </div>

                    {/* Create / Join */}
                    <AnimatePresence>
                        {showCreate && (
                            <motion.div className="card" style={{ padding: 16, marginBottom: 16 }}
                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem' }}>✨ {t('Yeni Grup Oluştur', 'Create New Group')}</h3>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                    <input className="input" placeholder={t('Grup adı...', 'Group name...')} value={newName}
                                        onChange={e => setNewName(e.target.value)} style={{ flex: 1 }} />
                                    <button className="btn btn-primary" onClick={createSpace} disabled={creating}>
                                        {creating ? <Loader2 size={14} className="spin" /> : <Check size={14} />} {t('Oluştur', 'Create')}
                                    </button>
                                </div>
                                <hr style={{ border: 'none', borderTop: '1px solid var(--border-primary)', margin: '12px 0' }} />
                                <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem' }}>🔗 {t('Davet Koduyla Katıl', 'Join with Invite Code')}</h3>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input className="input" placeholder={t('Davet kodu...', 'Invite code...')} value={joinCode}
                                        onChange={e => setJoinCode(e.target.value)} style={{ flex: 1, textTransform: 'uppercase' }} />
                                    <button className="btn btn-secondary" onClick={joinSpace} disabled={joining}>
                                        {joining ? <Loader2 size={14} className="spin" /> : <UserPlus size={14} />} {t('Katıl', 'Join')}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Spaces List */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <Loader2 size={24} className="spin" />
                        </div>
                    ) : spaces.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-tertiary)' }}>
                            <Users size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                            <p>{t('Henüz bir grubun yok', 'No groups yet')}</p>
                            <p style={{ fontSize: '0.8rem' }}>{t('Yeni bir grup oluştur veya davet kodunu gir', 'Create a new group or enter an invite code')}</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {spaces.map((s, i) => (
                                <motion.div key={s.id} className={`card space-card ${space?.id === s.id ? 'active-space' : ''}`}
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                    style={{ padding: 16, cursor: 'pointer', border: space?.id === s.id ? '2px solid var(--primary-1)' : '1px solid var(--border-primary)', borderRadius: 12 }}
                                    onClick={() => { setActiveSpace(s); toast.success(`${s.name} ${t('seçildi', 'selected')}`) }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, var(--primary-1), var(--primary-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>
                                            {s.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <h3 style={{ margin: 0, fontSize: '0.95rem' }}>{s.name}</h3>
                                                {s.role === 'admin' && <Crown size={12} style={{ color: '#FBBF24' }} />}
                                                {space?.id === s.id && <span style={{ fontSize: '0.65rem', background: 'var(--primary-1)', color: '#fff', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>{t('Aktif', 'Active')}</span>}
                                            </div>
                                            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                                {s.role === 'admin' ? t('Yönetici', 'Admin') : t('Üye', 'Member')}
                                            </p>
                                        </div>
                                        {s.invite_code && (
                                            <button className="btn btn-ghost" style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                                                onClick={(e) => { e.stopPropagation(); copyCode(s.invite_code) }}>
                                                {copied === s.invite_code ? <Check size={12} /> : <Copy size={12} />} {s.invite_code}
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
