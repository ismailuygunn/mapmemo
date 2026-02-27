'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSpace } from '@/context/SpaceContext'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import Sidebar from '@/components/layout/Sidebar'
import { CalendarDays, Plus, X, MapPin, Users, Clock, Link as LinkIcon, Loader2, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function MeetupsPage() {
    const [meetups, setMeetups] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [creating, setCreating] = useState(false)
    const [form, setForm] = useState({
        title: '', description: '', city: '', location_name: '',
        lat: null, lng: null, start_time: '', end_time: '', external_link: '',
    })
    const [locationSearch, setLocationSearch] = useState('')
    const [locationResults, setLocationResults] = useState([])
    const { space, permissions } = useSpace()
    const { user } = useAuth()
    const { t } = useLanguage()
    const { toast } = useToast()
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        if (space || user) loadMeetups()
    }, [space, user])

    const loadMeetups = async () => {
        let query = supabase.from('meetups').select('*, meetup_rsvps(status, user_id)')
        if (space) query = query.eq('space_id', space.id)
        else if (user) query = query.eq('created_by', user.id)
        else { setLoading(false); return }
        const { data } = await query.order('start_time', { ascending: true })
        if (data) setMeetups(data)
        setLoading(false)
    }

    const searchLocation = useCallback(async (query) => {
        setLocationSearch(query)
        if (query.length < 2) { setLocationResults([]); return }
        try {
            const res = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=place,locality,poi,address&limit=5`
            )
            const data = await res.json()
            setLocationResults(data.features || [])
        } catch {
            setLocationResults([])
        }
    }, [])

    const selectLocation = (result) => {
        const [lng, lat] = result.center
        const context = result.context || []
        const city = context.find(c => c.id.startsWith('place'))?.text || result.text || ''
        const country = context.find(c => c.id.startsWith('country'))?.text || ''
        setForm(f => ({
            ...f, lat, lng,
            city: city || result.text,
            location_name: result.place_name,
        }))
        setLocationSearch(result.place_name)
        setLocationResults([])
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        if (!form.title || !form.start_time) return
        setCreating(true)
        try {
            const { data, error } = await supabase
                .from('meetups')
                .insert({
                    space_id: space?.id || null,
                    created_by: user.id,
                    title: form.title,
                    description: form.description || null,
                    city: form.city || null,
                    location_name: form.location_name || null,
                    lat: form.lat,
                    lng: form.lng,
                    start_time: new Date(form.start_time).toISOString(),
                    end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
                    external_link: form.external_link || null,
                })
                .select('*, meetup_rsvps(status, user_id)')
                .single()

            if (error) throw error

            // Post creation update
            await supabase.from('meetup_updates').insert({
                meetup_id: data.id,
                user_id: user.id,
                type: 'created',
                message: `Meetup oluşturuldu: ${form.title}`,
            })

            // Auto-RSVP creator as going
            await supabase.from('meetup_rsvps').insert({
                meetup_id: data.id,
                user_id: user.id,
                status: 'going',
            })

            setMeetups(prev => [...prev, { ...data, meetup_rsvps: [{ status: 'going', user_id: user.id }] }])
            setForm({ title: '', description: '', city: '', location_name: '', lat: null, lng: null, start_time: '', end_time: '', external_link: '' })
            setLocationSearch('')
            setShowCreate(false)
            toast.success('Meetup oluşturuldu 🎉')
        } catch (err) {
            toast.error(err.message)
        }
        setCreating(false)
    }

    const getRsvpCounts = (meetup) => {
        const rsvps = meetup.meetup_rsvps || []
        return {
            going: rsvps.filter(r => r.status === 'going').length,
            maybe: rsvps.filter(r => r.status === 'maybe').length,
            late: rsvps.filter(r => r.status === 'late').length,
            not_going: rsvps.filter(r => r.status === 'not_going').length,
        }
    }

    const formatDate = (dateStr) => {
        const d = new Date(dateStr)
        return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    const formatTime = (dateStr) => {
        const d = new Date(dateStr)
        return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    }

    const isUpcoming = (meetup) => new Date(meetup.start_time) > new Date()
    const isPast = (meetup) => meetup.end_time ? new Date(meetup.end_time) < new Date() : new Date(meetup.start_time) < new Date()

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="page">
                    <div className="page-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <h1>📅 Meetups</h1>
                                <p>{t('meetup.subtitle') || 'Buluşmalarınızı planlayın ve takip edin'}</p>
                            </div>
                            {permissions.canEdit && (
                                <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                                    {showCreate ? <><X size={16} /> İptal</> : <><Plus size={16} /> Yeni Meetup</>}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Create Form */}
                    <AnimatePresence>
                        {showCreate && (
                            <motion.form className="card" onSubmit={handleCreate}
                                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                                style={{ marginBottom: 24 }}
                            >
                                <h3 style={{ marginBottom: 16 }}>📅 Yeni Meetup</h3>

                                <div className="input-group">
                                    <label>Başlık *</label>
                                    <input type="text" className="input" placeholder="Meetup başlığı"
                                        value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                                </div>

                                <div className="input-group">
                                    <label>Açıklama</label>
                                    <textarea className="input" rows={3} placeholder="Detaylar..."
                                        value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                                </div>

                                <div className="input-group" style={{ position: 'relative' }}>
                                    <label><MapPin size={14} style={{ display: 'inline', verticalAlign: -2 }} /> Konum</label>
                                    <input type="text" className="input" placeholder="Konum ara..."
                                        value={locationSearch} onChange={e => searchLocation(e.target.value)} />
                                    {locationResults.length > 0 && (
                                        <div className="location-dropdown">
                                            {locationResults.map(r => (
                                                <button key={r.id} type="button" className="location-option"
                                                    onClick={() => selectLocation(r)}>
                                                    <MapPin size={14} style={{ flexShrink: 0, color: 'var(--text-tertiary)' }} />
                                                    <span className="truncate">{r.place_name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div className="input-group">
                                        <label>Başlangıç *</label>
                                        <input type="datetime-local" className="input"
                                            value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} required />
                                    </div>
                                    <div className="input-group">
                                        <label>Bitiş</label>
                                        <input type="datetime-local" className="input"
                                            value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label><LinkIcon size={14} style={{ display: 'inline', verticalAlign: -2 }} /> Link (opsiyonel)</label>
                                    <input type="url" className="input" placeholder="https://..."
                                        value={form.external_link} onChange={e => setForm(f => ({ ...f, external_link: e.target.value }))} />
                                </div>

                                <button type="submit" className="btn btn-primary w-full" disabled={creating}>
                                    {creating ? <><Loader2 size={16} className="spin" /> Oluşturuluyor...</> : <><CalendarDays size={16} /> Meetup Oluştur</>}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {/* Meetups List */}
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
                            <Loader2 size={32} className="spin" style={{ color: 'var(--primary-1)' }} />
                        </div>
                    ) : meetups.length === 0 ? (
                        <div className="empty-state">
                            <CalendarDays size={48} className="empty-state-icon" />
                            <h3>Henüz meetup yok</h3>
                            <p>Grubunuzla bir buluşma planlayın!</p>
                            {permissions.canEdit && (
                                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                                    <Plus size={16} /> Yeni Meetup
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {meetups.map((meetup, i) => {
                                const counts = getRsvpCounts(meetup)
                                const upcoming = isUpcoming(meetup)
                                return (
                                    <motion.div
                                        key={meetup.id}
                                        className="meetup-card"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => router.push(`/meetup/${meetup.id}`)}
                                    >
                                        <div className="meetup-card-date">
                                            <span className="meetup-card-day">{new Date(meetup.start_time).getDate()}</span>
                                            <span className="meetup-card-month">{new Date(meetup.start_time).toLocaleDateString('tr-TR', { month: 'short' })}</span>
                                        </div>
                                        <div className="meetup-card-body">
                                            <h3 className="meetup-card-title">{meetup.title}</h3>
                                            <div className="meetup-card-meta">
                                                {meetup.city && <span><MapPin size={12} /> {meetup.city}</span>}
                                                <span><Clock size={12} /> {formatTime(meetup.start_time)}</span>
                                                <span><Users size={12} /> {counts.going} gidiyor</span>
                                            </div>
                                        </div>
                                        <div className="meetup-card-status">
                                            <span className={`meetup-badge ${upcoming ? 'meetup-badge-upcoming' : 'meetup-badge-past'}`}>
                                                {upcoming ? 'Yaklaşan' : 'Geçmiş'}
                                            </span>
                                            <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
            <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
        </>
    )
}
