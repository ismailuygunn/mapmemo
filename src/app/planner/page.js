'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSpace } from '@/context/SpaceContext'
import Sidebar from '@/components/layout/Sidebar'
import { TRIP_TEMPOS, BUDGET_LEVELS, INTERESTS } from '@/lib/constants'
import { Plane, Calendar, Loader2, Save, CloudRain, DollarSign, Lightbulb, ChevronDown, ChevronUp, Route } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function PlannerPage() {
    const [view, setView] = useState('form') // form | result | trips
    const [formData, setFormData] = useState({
        city: '', startDate: '', endDate: '',
        tempo: 'moderate', budget: 'moderate',
        interests: [],
    })
    const [itinerary, setItinerary] = useState(null)
    const [savedTrips, setSavedTrips] = useState([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [expandedDay, setExpandedDay] = useState(null)
    const [showRainPlan, setShowRainPlan] = useState(false)
    const { space } = useSpace()
    const supabase = createClient()

    useEffect(() => {
        if (space) loadTrips()
    }, [space])

    const loadTrips = async () => {
        const { data } = await supabase
            .from('trips')
            .select('*')
            .eq('space_id', space.id)
            .order('created_at', { ascending: false })
        if (data) setSavedTrips(data)
    }

    const update = (key, value) => setFormData(prev => ({ ...prev, [key]: value }))

    const toggleInterest = (interest) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest],
        }))
    }

    const generatePlan = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // Get existing pins for this city
            let existingPins = []
            if (space) {
                const { data } = await supabase
                    .from('pins')
                    .select('title, type, status, rating, notes, lat, lng')
                    .eq('space_id', space.id)
                    .ilike('city', `%${formData.city}%`)
                if (data) existingPins = data
            }

            const res = await fetch('/api/ai/plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, existingPins }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to generate plan')
            setItinerary(data)
            setView('result')
            setExpandedDay(0)
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }

    const saveTrip = async () => {
        if (!itinerary || !space) return
        setSaving(true)
        try {
            const { data: trip, error: tripError } = await supabase
                .from('trips')
                .insert({
                    space_id: space.id,
                    city: formData.city,
                    start_date: formData.startDate || null,
                    end_date: formData.endDate || null,
                    itinerary_data: itinerary,
                    tempo: formData.tempo,
                    budget: formData.budget,
                })
                .select()
                .single()

            if (tripError) throw tripError
            setSavedTrips(prev => [trip, ...prev])
            alert('Trip saved! ✅')
        } catch (err) {
            setError(err.message)
        }
        setSaving(false)
    }

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="page">
                    <div className="page-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <h1>✈️ AI Trip Planner</h1>
                                <p>Let AI create the perfect itinerary for you two</p>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    className={`btn ${view === 'form' || view === 'result' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => { setView('form'); setItinerary(null) }}
                                >
                                    <Plane size={16} /> New Plan
                                </button>
                                <button
                                    className={`btn ${view === 'trips' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setView('trips')}
                                >
                                    Saved ({savedTrips.length})
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Trip Form */}
                    {view === 'form' && (
                        <motion.form
                            className="planner-form"
                            onSubmit={generatePlan}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="input-group">
                                <label>🏙️ City / Destination</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. Tokyo, Paris, Istanbul..."
                                    value={formData.city}
                                    onChange={(e) => update('city', e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="input-group">
                                    <label>📅 Start Date</label>
                                    <input type="date" className="input" value={formData.startDate} onChange={(e) => update('startDate', e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label>📅 End Date</label>
                                    <input type="date" className="input" value={formData.endDate} onChange={(e) => update('endDate', e.target.value)} />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>🚶 Tempo</label>
                                {TRIP_TEMPOS.map(t => (
                                    <label key={t.value} style={{
                                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                                        borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${formData.tempo === t.value ? 'var(--primary-1)' : 'var(--border)'}`,
                                        background: formData.tempo === t.value ? 'rgba(79,70,229,0.08)' : 'transparent',
                                        marginBottom: 6, transition: 'all 150ms',
                                    }}>
                                        <input type="radio" name="tempo" value={t.value} checked={formData.tempo === t.value} onChange={() => update('tempo', t.value)} style={{ display: 'none' }} />
                                        <span style={{ fontSize: '0.9375rem' }}>{t.label}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="input-group">
                                <label>💰 Budget</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {BUDGET_LEVELS.map(b => (
                                        <button
                                            key={b.value}
                                            type="button"
                                            className={`filter-chip ${formData.budget === b.value ? 'filter-chip-active' : ''}`}
                                            onClick={() => update('budget', b.value)}
                                            style={{ flex: 1, justifyContent: 'center' }}
                                        >
                                            {b.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="input-group">
                                <label>❤️ Interests (select multiple)</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {INTERESTS.map(interest => (
                                        <button
                                            key={interest}
                                            type="button"
                                            className={`filter-chip ${formData.interests.includes(interest) ? 'filter-chip-active' : ''}`}
                                            onClick={() => toggleInterest(interest)}
                                        >
                                            {interest}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div style={{ background: 'var(--error-bg)', color: 'var(--error)', padding: '10px 14px', borderRadius: 10, fontSize: '0.875rem' }}>
                                    {error}
                                </div>
                            )}

                            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: 8 }}>
                                {loading ? (
                                    <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Generating your plan...</>
                                ) : (
                                    <><Plane size={18} /> Generate Itinerary</>
                                )}
                            </button>
                        </motion.form>
                    )}

                    {/* Result */}
                    {view === 'result' && itinerary && (
                        <motion.div className="itinerary" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {/* Overview */}
                            <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(79,70,229,0.1), rgba(124,58,237,0.05))' }}>
                                <h3 style={{ marginBottom: 8 }}>📋 Overview</h3>
                                <p style={{ color: 'var(--text-secondary)' }}>{itinerary.overview}</p>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                                <button className="btn btn-primary" onClick={saveTrip} disabled={saving}>
                                    <Save size={16} /> {saving ? 'Saving...' : 'Save Trip'}
                                </button>
                                <button className="btn btn-secondary" onClick={() => setShowRainPlan(!showRainPlan)}>
                                    <CloudRain size={16} /> Rain Plan
                                </button>
                                <button className="btn btn-ghost" onClick={() => { setView('form'); setItinerary(null) }}>
                                    New Plan
                                </button>
                            </div>

                            {/* Days */}
                            {itinerary.days?.map((day, di) => (
                                <div key={di} className="itinerary-day">
                                    <button
                                        onClick={() => setExpandedDay(expandedDay === di ? null : di)}
                                        className="itinerary-day-header"
                                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary)' }}
                                    >
                                        <div className="itinerary-day-num">{day.dayNumber}</div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: 0 }}>{day.theme || `Day ${day.dayNumber}`}</h4>
                                            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{day.date}</p>
                                        </div>
                                        {expandedDay === di ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </button>

                                    <AnimatePresence>
                                        {expandedDay === di && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                style={{ overflow: 'hidden' }}
                                            >
                                                {day.items?.map((item, ii) => (
                                                    <div key={ii} className="itinerary-item">
                                                        <div className="itinerary-time">
                                                            {item.timeStart}{item.timeEnd ? `–${item.timeEnd}` : ''}
                                                        </div>
                                                        <div className="itinerary-content" style={{ flex: 1 }}>
                                                            <h4>{item.title}</h4>
                                                            <p>{item.description}</p>
                                                            {item.estimatedCost && (
                                                                <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 500 }}>
                                                                    💰 {item.estimatedCost} {item.isEstimated && '(estimated)'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}

                            {/* Budget Estimate */}
                            {itinerary.budgetEstimate && (
                                <div className="card" style={{ marginTop: 24 }}>
                                    <h3 style={{ marginBottom: 12 }}><DollarSign size={18} style={{ display: 'inline', verticalAlign: -3 }} /> Budget Estimate</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        {Object.entries(itinerary.budgetEstimate).map(([key, value]) => (
                                            <div key={key} style={{
                                                display: 'flex', justifyContent: 'space-between',
                                                padding: '8px 12px', borderRadius: 8,
                                                background: key === 'total' ? 'rgba(79,70,229,0.1)' : 'var(--bg-tertiary)',
                                                gridColumn: key === 'total' ? '1 / -1' : undefined,
                                                fontWeight: key === 'total' ? 600 : 400,
                                            }}>
                                                <span style={{ textTransform: 'capitalize' }}>{key}</span>
                                                <span style={{ color: 'var(--primary-1)' }}>{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tips */}
                            {itinerary.tips && (
                                <div className="card" style={{ marginTop: 16 }}>
                                    <h3 style={{ marginBottom: 12 }}><Lightbulb size={18} style={{ display: 'inline', verticalAlign: -3 }} /> Tips</h3>
                                    <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {itinerary.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                                    </ul>
                                </div>
                            )}

                            {/* Rain Plan */}
                            <AnimatePresence>
                                {showRainPlan && itinerary.rainPlan && (
                                    <motion.div
                                        className="card"
                                        style={{ marginTop: 16, borderColor: 'var(--accent-sky)' }}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <h3 style={{ marginBottom: 8 }}>🌧️ Rain Plan (Plan B)</h3>
                                        <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>{itinerary.rainPlan.overview}</p>
                                        {itinerary.rainPlan.alternatives?.map((alt, i) => (
                                            <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg-tertiary)', marginBottom: 8 }}>
                                                <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Instead of: {alt.instead_of}</p>
                                                <p style={{ fontWeight: 600, marginBottom: 4 }}>→ {alt.do_this}</p>
                                                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{alt.description}</p>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* Saved Trips */}
                    {view === 'trips' && (
                        <div>
                            {savedTrips.length === 0 ? (
                                <div className="empty-state">
                                    <Plane size={48} className="empty-state-icon" />
                                    <h3>No saved trips yet</h3>
                                    <p>Generate your first AI travel plan!</p>
                                    <button className="btn btn-primary" onClick={() => setView('form')}>Create Plan</button>
                                </div>
                            ) : (
                                <div className="pin-grid">
                                    {savedTrips.map((trip, i) => (
                                        <motion.div
                                            key={trip.id}
                                            className="pin-card card-hover"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => {
                                                setItinerary(trip.itinerary_data)
                                                setFormData(prev => ({ ...prev, city: trip.city }))
                                                setView('result')
                                                setExpandedDay(0)
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="pin-card-body">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                    <Plane size={18} style={{ color: 'var(--primary-1)' }} />
                                                    <h4 className="pin-card-title" style={{ margin: 0 }}>{trip.city}</h4>
                                                </div>
                                                {trip.start_date && (
                                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                                        {new Date(trip.start_date).toLocaleDateString()} — {trip.end_date ? new Date(trip.end_date).toLocaleDateString() : ''}
                                                    </p>
                                                )}
                                                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                                    <span className="badge badge-primary">{trip.tempo}</span>
                                                    <span className="badge badge-gold">{trip.budget}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
    )
}
