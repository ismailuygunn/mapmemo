'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Clock, MapPin, GripVertical, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']
const ITEM_TYPES = [
    { key: 'attraction', emoji: '🏛️', label: { tr: 'Gezi', en: 'Visit' } },
    { key: 'restaurant', emoji: '🍽️', label: { tr: 'Yemek', en: 'Meal' } },
    { key: 'transport', emoji: '🚕', label: { tr: 'Ulaşım', en: 'Transport' } },
    { key: 'hotel', emoji: '🏨', label: { tr: 'Otel', en: 'Hotel' } },
    { key: 'activity', emoji: '🎯', label: { tr: 'Aktivite', en: 'Activity' } },
    { key: 'free', emoji: '☕', label: { tr: 'Serbest', en: 'Free Time' } },
]

export default function DayPlanner({ tripId, spaceId, startDate, endDate, locale, spots = [] }) {
    const [items, setItems] = useState([])
    const [showAdd, setShowAdd] = useState(null) // dayIndex
    const [form, setForm] = useState({ time: '10:00', title: '', category: 'attraction', notes: '' })
    const supabase = createClient()
    const t = (tr, en) => locale === 'tr' ? tr : en

    // Calculate days
    const start = new Date(startDate || new Date())
    const end = new Date(endDate || start)
    const dayCount = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1)
    const days = Array.from({ length: dayCount }, (_, i) => {
        const d = new Date(start)
        d.setDate(d.getDate() + i)
        return d
    })

    useEffect(() => { loadItems() }, [tripId])

    const loadItems = async () => {
        const { data } = await supabase.from('itinerary_items').select('*').eq('trip_id', tripId).order('day_index').order('sort_order')
        if (data) setItems(data)
    }

    const addItem = async (dayIndex) => {
        if (!form.title.trim()) return
        const sortOrder = items.filter(i => i.day_index === dayIndex).length
        await supabase.from('itinerary_items').insert({
            trip_id: tripId, space_id: spaceId,
            day_index: dayIndex, time_slot: form.time,
            title: form.title, category: form.category,
            notes: form.notes, sort_order: sortOrder,
        })
        setForm({ time: '10:00', title: '', category: 'attraction', notes: '' })
        setShowAdd(null)
        loadItems()
    }

    const removeItem = async (id) => {
        await supabase.from('itinerary_items').delete().eq('id', id)
        loadItems()
    }

    const addSpotToDay = async (spot, dayIndex) => {
        const sortOrder = items.filter(i => i.day_index === dayIndex).length
        await supabase.from('itinerary_items').insert({
            trip_id: tripId, space_id: spaceId,
            day_index: dayIndex, time_slot: '10:00',
            title: spot.name, category: 'attraction',
            spot_id: spot.id, lat: spot.lat, lng: spot.lng,
            sort_order: sortOrder,
        })
        loadItems()
    }

    return (
        <div className="itin-container">
            {days.map((day, di) => {
                const dayItems = items.filter(i => i.day_index === di).sort((a, b) => (a.time_slot || '').localeCompare(b.time_slot || ''))
                return (
                    <motion.div key={di} className="itin-day" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: di * 0.05 }}>
                        <div className="itin-day-header">
                            <div className="itin-day-num">{t('Gün', 'Day')} {di + 1}</div>
                            <div className="itin-day-date">
                                {day.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </div>
                        </div>

                        <div className="itin-timeline">
                            {dayItems.length === 0 ? (
                                <div className="itin-empty">{t('Henüz plan yok', 'No plans yet')}</div>
                            ) : dayItems.map((item) => {
                                const type = ITEM_TYPES.find(t => t.key === item.category) || ITEM_TYPES[0]
                                return (
                                    <motion.div key={item.id} className="itin-item" layout>
                                        <div className="itin-item-time"><Clock size={11} /> {item.time_slot}</div>
                                        <div className="itin-item-dot" />
                                        <div className="itin-item-content">
                                            <span className="itin-item-emoji">{type.emoji}</span>
                                            <span className="itin-item-title">{item.title}</span>
                                            {item.notes && <span className="itin-item-notes">{item.notes}</span>}
                                        </div>
                                        <button className="itin-item-delete" onClick={() => removeItem(item.id)}><Trash2 size={13} /></button>
                                    </motion.div>
                                )
                            })}
                        </div>

                        {/* Add Button */}
                        {showAdd === di ? (
                            <motion.div className="itin-add-form" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                                <select className="itin-select" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}>
                                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <input className="itin-input" placeholder={t('Ne yapacaksın?', 'What will you do?')} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoFocus />
                                <div className="itin-type-btns">
                                    {ITEM_TYPES.map(ty => (
                                        <button key={ty.key} type="button" className={`itin-type-btn ${form.category === ty.key ? 'active' : ''}`}
                                            onClick={() => setForm({ ...form, category: ty.key })}>{ty.emoji}</button>
                                    ))}
                                </div>
                                <div className="itin-form-actions">
                                    <button className="itin-cancel-btn" onClick={() => setShowAdd(null)}>{t('İptal', 'Cancel')}</button>
                                    <button className="itin-save-btn" onClick={() => addItem(di)}>{t('Ekle', 'Add')}</button>
                                </div>
                            </motion.div>
                        ) : (
                            <button className="itin-add-btn" onClick={() => setShowAdd(di)}><Plus size={14} /> {t('Ekle', 'Add')}</button>
                        )}
                    </motion.div>
                )
            })}
        </div>
    )
}
