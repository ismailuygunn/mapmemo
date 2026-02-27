'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSpace } from '@/context/SpaceContext'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import Sidebar from '@/components/layout/Sidebar'
import { Gift, Lock, Unlock, Plus, X, Calendar, Image as ImageIcon, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function CapsulesPage() {
    const [capsules, setCapsules] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [form, setForm] = useState({ title: '', message: '', revealDate: '' })
    const [creating, setCreating] = useState(false)
    const [revealingId, setRevealingId] = useState(null)
    const { space } = useSpace()
    const { user } = useAuth()
    const { t } = useLanguage()
    const { toast } = useToast()
    const supabase = createClient()

    useEffect(() => {
        loadCapsules()
    }, [space, user])

    const loadCapsules = async () => {
        let query = supabase.from('memory_capsules').select('*')
        if (space) query = query.eq('space_id', space.id)
        else if (user) query = query.eq('created_by', user.id)
        else { setLoading(false); return }
        const { data } = await query.order('reveal_date', { ascending: true })
        if (data) setCapsules(data)
        setLoading(false)
    }

    const createCapsule = async (e) => {
        e.preventDefault()
        if (!form.title || !form.revealDate) return
        setCreating(true)
        const { data, error } = await supabase
            .from('memory_capsules')
            .insert({
                space_id: space?.id || null,
                created_by: user.id,
                title: form.title,
                message: form.message,
                reveal_date: form.revealDate,
            })
            .select().single()
        if (!error && data) {
            setCapsules(prev => [...prev, data].sort((a, b) => new Date(a.reveal_date) - new Date(b.reveal_date)))
            setForm({ title: '', message: '', revealDate: '' })
            setShowCreate(false)
            toast.success(t('capsule.created') || 'Kapsül oluşturuldu 💊')
        } else if (error) {
            toast.error(error.message)
        }
        setCreating(false)
    }

    const revealCapsule = async (capsule) => {
        setRevealingId(capsule.id)
        await supabase
            .from('memory_capsules')
            .update({ is_revealed: true, revealed_at: new Date().toISOString() })
            .eq('id', capsule.id)
        await loadCapsules()
        setRevealingId(null)
        toast.success(t('capsule.revealed') || 'Kapsül açıldı! 🎉')
    }

    const deleteCapsule = async (id) => {
        await supabase.from('memory_capsules').delete().eq('id', id)
        setCapsules(prev => prev.filter(c => c.id !== id))
        toast.success(t('capsule.deleted') || 'Kapsül silindi')
    }

    const today = new Date().toISOString().split('T')[0]
    const canReveal = (capsule) => capsule.reveal_date <= today && !capsule.is_revealed
    const isLocked = (capsule) => capsule.reveal_date > today && !capsule.is_revealed
    const daysUntil = (dateStr) => {
        const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24))
        return diff > 0 ? diff : 0
    }

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="page">
                    <div className="page-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <h1>💊 {t('capsule.title')}</h1>
                                <p>{t('capsule.subtitle')}</p>
                            </div>
                            <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                                {showCreate ? <><X size={16} /> {t('general.cancel')}</> : <><Plus size={16} /> {t('capsule.create')}</>}
                            </button>
                        </div>
                    </div>

                    {/* Create Form */}
                    <AnimatePresence>
                        {showCreate && (
                            <motion.form className="capsule-form card" onSubmit={createCapsule}
                                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                <h3>💊 {t('capsule.new')}</h3>
                                <div className="input-group">
                                    <label>{t('capsule.titleLabel')}</label>
                                    <input type="text" className="input" placeholder={t('capsule.titlePlaceholder')}
                                        value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} required />
                                </div>
                                <div className="input-group">
                                    <label>{t('capsule.message')}</label>
                                    <textarea className="input" rows={4} placeholder={t('capsule.messagePlaceholder')}
                                        value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} />
                                </div>
                                <div className="input-group">
                                    <label>📅 {t('capsule.revealDate')}</label>
                                    <input type="date" className="input" min={today}
                                        value={form.revealDate} onChange={(e) => setForm(f => ({ ...f, revealDate: e.target.value }))} required />
                                    <p className="input-hint">{t('capsule.revealHint')}</p>
                                </div>
                                <button type="submit" className="btn btn-primary w-full" disabled={creating}>
                                    {creating ? <><Loader2 size={16} className="spin" /> {t('general.loading')}</> : <><Gift size={16} /> {t('capsule.createBtn')}</>}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {/* Loading */}
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
                            <Loader2 size={32} className="spin" style={{ color: 'var(--primary-1)' }} />
                        </div>
                    ) : capsules.length === 0 ? (
                        <div className="empty-state">
                            <Gift size={48} className="empty-state-icon" />
                            <h3>{t('capsule.empty')}</h3>
                            <p>{t('capsule.emptyDesc')}</p>
                            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                                <Plus size={16} /> {t('capsule.create')}
                            </button>
                        </div>
                    ) : (
                        <div className="capsules-grid">
                            {capsules.map((capsule, i) => (
                                <motion.div
                                    key={capsule.id}
                                    className={`capsule-card ${capsule.is_revealed ? 'capsule-revealed' : isLocked(capsule) ? 'capsule-locked' : 'capsule-ready'}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <div className="capsule-icon">
                                        {capsule.is_revealed ? (
                                            <Unlock size={24} />
                                        ) : isLocked(capsule) ? (
                                            <Lock size={24} />
                                        ) : (
                                            <Gift size={24} />
                                        )}
                                    </div>

                                    <h3>{capsule.is_revealed ? capsule.title : '🔒 ' + capsule.title}</h3>

                                    {/* Date info */}
                                    <div className="capsule-date">
                                        <Calendar size={14} />
                                        {capsule.is_revealed ? (
                                            <span>{t('capsule.openedOn')} {new Date(capsule.revealed_at).toLocaleDateString()}</span>
                                        ) : isLocked(capsule) ? (
                                            <span>{daysUntil(capsule.reveal_date)} {t('capsule.daysLeft')}</span>
                                        ) : (
                                            <span>{t('capsule.readyToOpen')}</span>
                                        )}
                                    </div>

                                    {/* Revealed content */}
                                    {capsule.is_revealed && capsule.message && (
                                        <motion.div className="capsule-message"
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                                            <p>{capsule.message}</p>
                                        </motion.div>
                                    )}

                                    {/* Actions */}
                                    <div className="capsule-actions">
                                        {canReveal(capsule) && (
                                            <button className="btn btn-primary" onClick={() => revealCapsule(capsule)}
                                                disabled={revealingId === capsule.id}>
                                                {revealingId === capsule.id ? <Loader2 size={16} className="spin" /> : <Gift size={16} />}
                                                {t('capsule.open')}
                                            </button>
                                        )}
                                        {capsule.created_by === user?.id && (
                                            <button className="btn btn-ghost" onClick={() => deleteCapsule(capsule.id)}
                                                style={{ color: 'var(--accent-red)', fontSize: '0.8125rem' }}>
                                                {t('pin.delete')}
                                            </button>
                                        )}
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
