'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useSpace } from '@/context/SpaceContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import { Users, Plus, Loader2, UserPlus, Copy, Check, Crown, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

export default function SpacesPage() {
    const [spaces, setSpaces] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [newName, setNewName] = useState('')
    const [creating, setCreating] = useState(false)
    const [joining, setJoining] = useState(false)
    const [joinToken, setJoinToken] = useState('')
    const [copied, setCopied] = useState(null)

    const { user } = useAuth()
    const { space, createSpace: ctxCreateSpace, joinSpace: ctxJoinSpace, loadSpace: ctxLoadSpace } = useSpace()
    const { locale } = useLanguage()
    const supabase = createClient()
    const router = useRouter()
    const t = (tr, en) => locale === 'tr' ? tr : en

    useEffect(() => { if (user) loadSpaces() }, [user])

    const loadSpaces = async () => {
        setLoading(true)
        try {
            // Get all space_members for the user
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
                    const spaceList = spacesData.map(s => {
                        const membership = memberships.find(m => m.space_id === s.id)
                        return { ...s, role: membership?.role || 'member' }
                    })
                    setSpaces(spaceList)
                }
            } else {
                setSpaces([])
            }
        } catch (err) {
            console.error('Load spaces error:', err)
        }
        setLoading(false)
    }

    const handleCreateSpace = async () => {
        if (!newName.trim()) return
        setCreating(true)
        try {
            await ctxCreateSpace(newName.trim())
            setNewName('')
            setShowCreate(false)
            toast.success(t('Grup oluşturuldu!', 'Group created!'))
            loadSpaces()
        } catch (err) {
            toast.error(err.message)
        }
        setCreating(false)
    }

    const handleJoinSpace = async () => {
        if (!joinToken.trim()) return
        setJoining(true)
        try {
            await ctxJoinSpace(joinToken.trim())
            setJoinToken('')
            toast.success(t('Gruba katıldın!', 'Joined group!'))
            loadSpaces()
        } catch (err) {
            toast.error(err.message)
        }
        setJoining(false)
    }

    const copyToken = (token) => {
        if (!token) return
        const link = `${window.location.origin}/invite/${token}`
        navigator.clipboard?.writeText(link)
        setCopied(token)
        toast.success(t('Davet linki kopyalandı!', 'Invite link copied!'))
        setTimeout(() => setCopied(null), 2000)
    }

    const switchSpace = async (s) => {
        // Reload the space context to use this space
        toast.success(`${s.name} ${t('seçildi', 'selected')}`)
        // Reload page to reinitialize SpaceContext
        window.location.href = '/map'
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
                        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
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
                                        onChange={e => setNewName(e.target.value)} style={{ flex: 1 }}
                                        onKeyDown={e => e.key === 'Enter' && handleCreateSpace()} />
                                    <button className="btn btn-primary" onClick={handleCreateSpace} disabled={creating}>
                                        {creating ? <Loader2 size={14} className="spin" /> : <Check size={14} />} {t('Oluştur', 'Create')}
                                    </button>
                                </div>
                                <hr style={{ border: 'none', borderTop: '1px solid var(--border-primary)', margin: '12px 0' }} />
                                <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem' }}>🔗 {t('Davet Linki ile Katıl', 'Join with Invite Link')}</h3>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '0 0 8px' }}>
                                    {t('Davet token\'ını yapıştır', 'Paste the invite token')}
                                </p>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input className="input" placeholder={t('Davet token...', 'Invite token...')} value={joinToken}
                                        onChange={e => setJoinToken(e.target.value)} style={{ flex: 1 }}
                                        onKeyDown={e => e.key === 'Enter' && handleJoinSpace()} />
                                    <button className="btn btn-secondary" onClick={handleJoinSpace} disabled={joining}>
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
                            <p style={{ fontSize: '0.8rem' }}>{t('Yeni bir grup oluştur veya davet linki ile katıl', 'Create a new group or join with invite link')}</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {spaces.map((s, i) => (
                                <motion.div key={s.id} className="card"
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                    style={{
                                        padding: 16, cursor: 'pointer',
                                        border: space?.id === s.id ? '2px solid var(--primary-1)' : '1px solid var(--border-primary)',
                                        borderRadius: 12
                                    }}
                                    onClick={() => switchSpace(s)}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 10,
                                            background: 'linear-gradient(135deg, var(--primary-1), var(--primary-2))',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#fff', fontWeight: 700, fontSize: '1.1rem'
                                        }}>
                                            {s.name?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <h3 style={{ margin: 0, fontSize: '0.95rem' }}>{s.name}</h3>
                                                {s.role === 'owner' && <Crown size={12} style={{ color: '#FBBF24' }} />}
                                                {space?.id === s.id && (
                                                    <span style={{
                                                        fontSize: '0.65rem', background: 'var(--primary-1)', color: '#fff',
                                                        padding: '1px 6px', borderRadius: 4, fontWeight: 600
                                                    }}>{t('Aktif', 'Active')}</span>
                                                )}
                                            </div>
                                            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                                {s.role === 'owner' ? t('Yönetici', 'Owner') : s.role === 'admin' ? t('Admin', 'Admin') : t('Üye', 'Member')}
                                            </p>
                                        </div>
                                        {s.invite_token && (
                                            <button className="btn btn-ghost" style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                                                onClick={(e) => { e.stopPropagation(); copyToken(s.invite_token) }}>
                                                {copied === s.invite_token ? <Check size={12} /> : <Copy size={12} />}
                                                {' '}{t('Davet Linki', 'Invite Link')}
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
