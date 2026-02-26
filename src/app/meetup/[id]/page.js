'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSpace } from '@/context/SpaceContext'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import Sidebar from '@/components/layout/Sidebar'
import {
    ArrowLeft, MapPin, Clock, Users, Link as LinkIcon, ExternalLink,
    Check, HelpCircle, AlertCircle, XCircle, Plus, Trash2, Loader2,
    Edit3, CalendarDays, MessageCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const RSVP_OPTIONS = [
    { key: 'going', label: 'Gidiyorum ✅', icon: Check, color: '#10B981' },
    { key: 'maybe', label: 'Belki 🤔', icon: HelpCircle, color: '#F59E0B' },
    { key: 'late', label: 'Geç geleceğim 🕐', icon: AlertCircle, color: '#3B82F6' },
    { key: 'not_going', label: 'Gidemiyorum ❌', icon: XCircle, color: '#EF4444' },
]

export default function MeetupDetailPage() {
    const params = useParams()
    const router = useRouter()
    const meetupId = params.id
    const { space, members, permissions } = useSpace()
    const { user } = useAuth()
    const { t } = useLanguage()
    const { toast } = useToast()
    const supabase = createClient()

    const [meetup, setMeetup] = useState(null)
    const [rsvps, setRsvps] = useState([])
    const [timeline, setTimeline] = useState([])
    const [updates, setUpdates] = useState([])
    const [loading, setLoading] = useState(true)
    const [myRsvp, setMyRsvp] = useState(null)
    const [rsvpNote, setRsvpNote] = useState('')
    const [showTimelineForm, setShowTimelineForm] = useState(false)
    const [tlForm, setTlForm] = useState({ time: '', title: '', description: '' })
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({})

    useEffect(() => {
        if (meetupId) loadAll()
    }, [meetupId])

    const loadAll = async () => {
        setLoading(true)
        const [meetupRes, rsvpRes, timelineRes, updatesRes] = await Promise.all([
            supabase.from('meetups').select('*').eq('id', meetupId).single(),
            supabase.from('meetup_rsvps').select('*, profiles:user_id(display_name, email)').eq('meetup_id', meetupId),
            supabase.from('meetup_timeline').select('*').eq('meetup_id', meetupId).order('sort_order'),
            supabase.from('meetup_updates').select('*, profiles:user_id(display_name)').eq('meetup_id', meetupId).order('created_at', { ascending: false }).limit(20),
        ])

        if (meetupRes.data) setMeetup(meetupRes.data)
        if (rsvpRes.data) {
            setRsvps(rsvpRes.data)
            const mine = rsvpRes.data.find(r => r.user_id === user?.id)
            if (mine) {
                setMyRsvp(mine.status)
                setRsvpNote(mine.note || '')
            }
        }
        if (timelineRes.data) setTimeline(timelineRes.data)
        if (updatesRes.data) setUpdates(updatesRes.data)
        setLoading(false)
    }

    const handleRsvp = async (status) => {
        try {
            const { error } = await supabase
                .from('meetup_rsvps')
                .upsert({
                    meetup_id: meetupId,
                    user_id: user.id,
                    status,
                    note: rsvpNote || null,
                }, { onConflict: 'meetup_id,user_id' })

            if (error) throw error

            // Post update
            const rsvpLabel = RSVP_OPTIONS.find(o => o.key === status)?.label || status
            await supabase.from('meetup_updates').insert({
                meetup_id: meetupId,
                user_id: user.id,
                type: 'rsvp',
                message: `RSVP: ${rsvpLabel}`,
            })

            setMyRsvp(status)
            toast.success(`RSVP: ${rsvpLabel}`)
            await loadAll()
        } catch (err) {
            toast.error(err.message)
        }
    }

    const addTimelineItem = async (e) => {
        e.preventDefault()
        if (!tlForm.time || !tlForm.title) return
        try {
            const { error } = await supabase.from('meetup_timeline').insert({
                meetup_id: meetupId,
                time: tlForm.time,
                title: tlForm.title,
                description: tlForm.description || null,
                sort_order: timeline.length,
            })
            if (error) throw error

            await supabase.from('meetup_updates').insert({
                meetup_id: meetupId, user_id: user.id,
                type: 'timeline_updated', message: `Plan eklendi: ${tlForm.time} - ${tlForm.title}`,
            })

            setTlForm({ time: '', title: '', description: '' })
            setShowTimelineForm(false)
            toast.success('Plan adımı eklendi')
            await loadAll()
        } catch (err) {
            toast.error(err.message)
        }
    }

    const deleteTimelineItem = async (id) => {
        await supabase.from('meetup_timeline').delete().eq('id', id)
        toast.success('Plan adımı silindi')
        await loadAll()
    }

    const handleEditSave = async () => {
        try {
            const updates = {}
            if (editForm.title !== meetup.title) updates.title = editForm.title
            if (editForm.description !== meetup.description) updates.description = editForm.description
            if (editForm.start_time !== meetup.start_time) updates.start_time = editForm.start_time

            const { error } = await supabase
                .from('meetups')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', meetupId)
            if (error) throw error

            // Post updates for changes
            if (updates.start_time) {
                await supabase.from('meetup_updates').insert({
                    meetup_id: meetupId, user_id: user.id,
                    type: 'time_changed', message: 'Meetup saati güncellendi',
                })
            }
            if (updates.description) {
                await supabase.from('meetup_updates').insert({
                    meetup_id: meetupId, user_id: user.id,
                    type: 'description_changed', message: 'Açıklama güncellendi',
                })
            }

            setIsEditing(false)
            toast.success('Meetup güncellendi ✅')
            await loadAll()
        } catch (err) {
            toast.error(err.message)
        }
    }

    const getMemberName = (userId) => {
        const member = members.find(m => m.user_id === userId)
        return member?.profiles?.display_name || member?.profiles?.email || 'Bilinmeyen'
    }

    const formatDateTime = (dateStr) => {
        if (!dateStr) return ''
        const d = new Date(dateStr)
        return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    const formatTimeAgo = (dateStr) => {
        const diff = (Date.now() - new Date(dateStr)) / 1000
        if (diff < 60) return 'az önce'
        if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`
        if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`
        return `${Math.floor(diff / 86400)} gün önce`
    }

    if (loading) {
        return (
            <>
                <Sidebar />
                <div className="main-content">
                    <div className="page" style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
                        <Loader2 size={32} className="spin" style={{ color: 'var(--primary-1)' }} />
                    </div>
                </div>
            </>
        )
    }

    if (!meetup) {
        return (
            <>
                <Sidebar />
                <div className="main-content">
                    <div className="page">
                        <div className="empty-state">
                            <h3>Meetup bulunamadı</h3>
                            <button className="btn btn-primary" onClick={() => router.push('/meetups')}>Meetups'a Dön</button>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="page" style={{ maxWidth: 800 }}>
                    {/* Back Button */}
                    <button className="btn btn-ghost" onClick={() => router.push('/meetups')}
                        style={{ marginBottom: 16 }}>
                        <ArrowLeft size={16} /> Geri
                    </button>

                    {/* Header */}
                    <div className="card" style={{ marginBottom: 24 }}>
                        {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <input type="text" className="input" value={editForm.title}
                                    onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                                <textarea className="input" rows={3} value={editForm.description || ''}
                                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-primary btn-sm" onClick={handleEditSave}>Kaydet</button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setIsEditing(false)}>İptal</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>{meetup.title}</h1>
                                    {permissions.canEdit && (
                                        <button className="btn btn-ghost btn-sm" onClick={() => {
                                            setEditForm({ title: meetup.title, description: meetup.description, start_time: meetup.start_time })
                                            setIsEditing(true)
                                        }}>
                                            <Edit3 size={14} />
                                        </button>
                                    )}
                                </div>
                                {meetup.description && (
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>{meetup.description}</p>
                                )}
                                <div className="meetup-detail-meta">
                                    <span><CalendarDays size={14} /> {formatDateTime(meetup.start_time)}</span>
                                    {meetup.end_time && <span>→ {formatDateTime(meetup.end_time)}</span>}
                                    {meetup.location_name && <span><MapPin size={14} /> {meetup.location_name}</span>}
                                    {meetup.external_link && (
                                        <a href={meetup.external_link} target="_blank" rel="noopener noreferrer"
                                            className="meetup-link">
                                            <ExternalLink size={14} /> Link
                                        </a>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* RSVP Section */}
                    <div className="card" style={{ marginBottom: 24 }}>
                        <h3 style={{ marginBottom: 16 }}>🙋 RSVP</h3>
                        <div className="rsvp-grid">
                            {RSVP_OPTIONS.map(({ key, label, icon: Icon, color }) => (
                                <button
                                    key={key}
                                    className={`rsvp-btn ${myRsvp === key ? 'rsvp-btn-active' : ''}`}
                                    style={{ '--rsvp-color': color }}
                                    onClick={() => handleRsvp(key)}
                                >
                                    <Icon size={16} />
                                    <span>{label.split(' ')[0]}</span>
                                    <span className="rsvp-count">
                                        {rsvps.filter(r => r.status === key).length}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* RSVP note */}
                        <div style={{ marginTop: 12 }}>
                            <input type="text" className="input" placeholder="Not ekle (opsiyonel)"
                                value={rsvpNote} onChange={e => setRsvpNote(e.target.value)}
                                style={{ fontSize: '0.8125rem' }} />
                        </div>

                        {/* Who's coming */}
                        {rsvps.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <h4 style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: 8 }}>Katılımcılar</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {rsvps.map(r => {
                                        const opt = RSVP_OPTIONS.find(o => o.key === r.status)
                                        return (
                                            <div key={r.user_id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem' }}>
                                                <span style={{ color: opt?.color, width: 20, display: 'flex', justifyContent: 'center' }}>
                                                    {opt?.label?.split(' ').pop()}
                                                </span>
                                                <span style={{ fontWeight: 500 }}>
                                                    {r.profiles?.display_name || r.profiles?.email || 'Unknown'}
                                                </span>
                                                {r.note && <span style={{ color: 'var(--text-tertiary)' }}>— {r.note}</span>}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Timeline */}
                    <div className="card" style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3>🗓️ Plan</h3>
                            {permissions.canEdit && (
                                <button className="btn btn-ghost btn-sm" onClick={() => setShowTimelineForm(!showTimelineForm)}>
                                    {showTimelineForm ? <X size={14} /> : <Plus size={14} />}
                                </button>
                            )}
                        </div>

                        <AnimatePresence>
                            {showTimelineForm && (
                                <motion.form onSubmit={addTimelineItem}
                                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                    style={{ marginBottom: 16, overflow: 'hidden' }}
                                >
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                        <input type="text" className="input" placeholder="Saat (ör: 19:00)" style={{ width: 100 }}
                                            value={tlForm.time} onChange={e => setTlForm(f => ({ ...f, time: e.target.value }))} required />
                                        <input type="text" className="input" placeholder="Ne yapılacak?" style={{ flex: 1 }}
                                            value={tlForm.title} onChange={e => setTlForm(f => ({ ...f, title: e.target.value }))} required />
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input type="text" className="input" placeholder="Detay (opsiyonel)" style={{ flex: 1 }}
                                            value={tlForm.description} onChange={e => setTlForm(f => ({ ...f, description: e.target.value }))} />
                                        <button type="submit" className="btn btn-primary btn-sm">Ekle</button>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>

                        {timeline.length === 0 ? (
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Henüz plan eklenmemiş</p>
                        ) : (
                            <div className="timeline-list">
                                {timeline.map((item, i) => (
                                    <div key={item.id} className="timeline-item">
                                        <div className="timeline-dot" />
                                        <div className="timeline-time">{item.time}</div>
                                        <div className="timeline-content">
                                            <span className="timeline-title">{item.title}</span>
                                            {item.description && <span className="timeline-desc">{item.description}</span>}
                                        </div>
                                        {permissions.canEdit && (
                                            <button className="btn btn-ghost btn-sm" onClick={() => deleteTimelineItem(item.id)}
                                                style={{ color: 'var(--text-tertiary)', padding: 4 }}>
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Updates Feed */}
                    <div className="card">
                        <h3 style={{ marginBottom: 16 }}>📢 Güncellemeler</h3>
                        {updates.length === 0 ? (
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Henüz güncelleme yok</p>
                        ) : (
                            <div className="updates-feed">
                                {updates.map((upd) => (
                                    <div key={upd.id} className="update-item">
                                        <div className="update-icon">
                                            <MessageCircle size={12} />
                                        </div>
                                        <div className="update-body">
                                            <span className="update-author">{upd.profiles?.display_name || 'Sistem'}</span>
                                            <span className="update-message">{upd.message}</span>
                                        </div>
                                        <span className="update-time">{formatTimeAgo(upd.created_at)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
        </>
    )
}
