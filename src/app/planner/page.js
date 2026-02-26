'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSpace } from '@/context/SpaceContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import {
    TRIP_TEMPOS, BUDGET_LEVELS, INTERESTS, TRANSPORT_MODES,
    PRIORITIES, MEAL_STYLES, DIET_OPTIONS, TOUR_GROUP_TYPES,
    WALKING_LEVELS, PHOTO_STOP_OPTIONS, SHOPPING_STOP_OPTIONS,
    ACCESSIBILITY_OPTIONS, CURRENCIES
} from '@/lib/constants'
import {
    Plane, Calendar, Loader2, Save, CloudRain, DollarSign,
    Lightbulb, ChevronDown, ChevronUp, Heart, Plus, X, MapPin,
    Shield, AlertTriangle, Shirt, RefreshCw, Utensils, Map as MapIcon, Bus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { openAlbumForPrint } from '@/lib/albumGenerator'

export default function PlannerPage() {
    const [view, setView] = useState('form')
    const [formData, setFormData] = useState({
        cities: [],
        cityInput: '',
        startDate: '', endDate: '',
        tempo: 'moderate', budget: 'moderate',
        interests: [],
        // Phase 1 Advanced
        transportMode: 'mixed',
        priorities: [],
        totalBudget: '',
        currency: 'TRY',
        mealStyle: [],
        dietOptions: [],
        tourGroupType: '',
        walkingLevel: 'light',
        photoStops: 'normal',
        shoppingStop: 'no',
        accessibility: [],
        guideLanguage: '',
        dateNightMode: false,
    })
    const [itinerary, setItinerary] = useState(null)
    const [savedTrips, setSavedTrips] = useState([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [expandedDay, setExpandedDay] = useState(null)
    const [showRainPlan, setShowRainPlan] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [advancedTab, setAdvancedTab] = useState('transport')
    // Phase 3+4 visible data
    const [weatherInfo, setWeatherInfo] = useState(null)
    const [eventsInfo, setEventsInfo] = useState([])
    const [flightsInfo, setFlightsInfo] = useState([])
    const [flightSearch, setFlightSearch] = useState({ origin: '', searching: false })
    const { space } = useSpace()
    const { t, locale } = useLanguage()
    const supabase = createClient()

    useEffect(() => { if (space) loadTrips() }, [space])

    const loadTrips = async () => {
        const { data } = await supabase
            .from('trips').select('*').eq('space_id', space.id)
            .order('created_at', { ascending: false })
        if (data) setSavedTrips(data)
    }

    const update = (key, value) => setFormData(prev => ({ ...prev, [key]: value }))
    const toggleArray = (key, value) => {
        setFormData(prev => ({
            ...prev,
            [key]: prev[key].includes(value)
                ? prev[key].filter(i => i !== value)
                : [...prev[key], value],
        }))
    }

    // Multi-city management
    const addCity = () => {
        if (formData.cityInput.trim()) {
            update('cities', [...formData.cities, formData.cityInput.trim()])
            update('cityInput', '')
        }
    }
    const removeCity = (index) => {
        update('cities', formData.cities.filter((_, i) => i !== index))
    }
    const handleCityKeyDown = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addCity() }
    }

    // Flight search (Phase 4)
    const searchFlights = async () => {
        const cities = formData.cities.length > 0 ? formData.cities : [formData.cityInput.trim()]
        if (!flightSearch.origin || cities.length === 0) return
        setFlightSearch(prev => ({ ...prev, searching: true }))
        try {
            const qs = new URLSearchParams({
                origin: flightSearch.origin.toUpperCase(),
                destination: cities[0].substring(0, 3).toUpperCase(),
                departure: formData.startDate || new Date().toISOString().split('T')[0],
                adults: '2',
                currency: formData.currency || 'TRY',
            })
            if (formData.endDate) qs.append('return', formData.endDate)
            const res = await fetch(`/api/flights?${qs}`)
            const data = await res.json()
            if (data.flights) setFlightsInfo(data.flights)
        } catch { /* silent */ }
        setFlightSearch(prev => ({ ...prev, searching: false }))
    }

    const generatePlan = async (e) => {
        e.preventDefault()
        setError('')
        if (formData.cities.length === 0 && !formData.cityInput.trim()) {
            setError(t('planner.city') + ' required'); return
        }
        // If user typed but didn't press Enter, use the input as single city
        const cities = formData.cities.length > 0
            ? formData.cities
            : [formData.cityInput.trim()]

        setLoading(true)
        try {
            let existingPins = []
            if (space) {
                const { data } = await supabase
                    .from('pins')
                    .select('title, type, status, rating, notes, lat, lng')
                    .eq('space_id', space.id)
                if (data) existingPins = data.filter(p =>
                    cities.some(c => p.city?.toLowerCase().includes(c.toLowerCase()))
                )
            }

            // Fetch weather forecast (Phase 3)
            let weatherData = null
            try {
                const weatherRes = await fetch(`/api/weather?city=${encodeURIComponent(cities[0])}`)
                weatherData = await weatherRes.json()
                if (weatherData?.available) setWeatherInfo(weatherData)
            } catch { /* silent */ }

            // Fetch events (Phase 3)
            let eventsData = []
            try {
                const qs = new URLSearchParams({ city: cities[0] })
                if (formData.startDate) qs.append('start', formData.startDate)
                if (formData.endDate) qs.append('end', formData.endDate)
                const eventsRes = await fetch(`/api/events?${qs}`)
                const eventsJson = await eventsRes.json()
                if (eventsJson.events) { eventsData = eventsJson.events; setEventsInfo(eventsJson.events) }
            } catch { /* silent */ }

            const res = await fetch('/api/ai/plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cities,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    tempo: formData.tempo,
                    budget: formData.budget,
                    interests: formData.interests,
                    existingPins,
                    transportMode: formData.transportMode,
                    priorities: formData.priorities,
                    totalBudget: formData.totalBudget ? Number(formData.totalBudget) : null,
                    currency: formData.currency,
                    mealStyle: formData.mealStyle,
                    dietOptions: formData.dietOptions,
                    tourGroupType: formData.tourGroupType,
                    walkingLevel: formData.walkingLevel,
                    photoStops: formData.photoStops,
                    shoppingStop: formData.shoppingStop,
                    accessibility: formData.accessibility,
                    guideLanguage: formData.guideLanguage,
                    dateNightMode: formData.dateNightMode,
                    weatherData,
                    eventsData,
                    locale,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed')
            setItinerary(data)
            setView('result')
            setExpandedDay(0)
        } catch (err) { setError(err.message) }
        setLoading(false)
    }

    const saveTrip = async () => {
        if (!itinerary || !space) return
        setSaving(true)
        try {
            const { data: trip, error: e } = await supabase
                .from('trips')
                .insert({
                    space_id: space.id,
                    city: formData.cities.join(' → ') || formData.cityInput,
                    start_date: formData.startDate || null,
                    end_date: formData.endDate || null,
                    itinerary_data: itinerary,
                    tempo: formData.tempo,
                    budget: formData.budget,
                })
                .select().single()
            if (e) throw e
            setSavedTrips(prev => [trip, ...prev])
        } catch (err) { setError(err.message) }
        setSaving(false)
    }

    // ── Chip component ──
    const Chip = ({ active, onClick, children, style }) => (
        <button
            type="button"
            className={`filter-chip ${active ? 'filter-chip-active' : ''}`}
            onClick={onClick}
            style={style}
        >{children}</button>
    )

    // ── Section Accordion ──
    const Section = ({ title, icon: Icon, children, defaultOpen = false }) => {
        const [open, setOpen] = useState(defaultOpen)
        return (
            <div className="planner-section">
                <button
                    type="button"
                    className="planner-section-header"
                    onClick={() => setOpen(!open)}
                >
                    {Icon && <Icon size={18} />}
                    <span>{title}</span>
                    {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div className="planner-section-body">{children}</div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )
    }

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="page">
                    {/* Header */}
                    <div className="page-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <h1>✈️ {t('planner.title')}</h1>
                                <p>{t('planner.subtitle')}</p>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className={`btn ${view !== 'trips' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => { setView('form'); setItinerary(null) }}>
                                    <Plane size={16} /> {t('planner.newPlan')}
                                </button>
                                <button className={`btn ${view === 'trips' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setView('trips')}>
                                    {t('planner.saved')} ({savedTrips.length})
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ═══════════════════ FORM ═══════════════════ */}
                    {view === 'form' && (
                        <motion.form className="planner-form" onSubmit={generatePlan} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                            {/* ── Multi-City Input ── */}
                            <div className="input-group">
                                <label>🏙️ {t('planner.city')}</label>
                                <p className="input-hint">{t('planner.multiCityHint')}</p>
                                {formData.cities.length > 0 && (
                                    <div className="city-chips">
                                        {formData.cities.map((c, i) => (
                                            <span key={i} className="city-chip">
                                                {i > 0 && <span className="city-arrow">→</span>}
                                                {c}
                                                <button type="button" onClick={() => removeCity(i)} className="city-chip-remove"><X size={12} /></button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input
                                        type="text" className="input"
                                        placeholder={t('planner.cityPlaceholder')}
                                        value={formData.cityInput}
                                        onChange={(e) => update('cityInput', e.target.value)}
                                        onKeyDown={handleCityKeyDown}
                                    />
                                    <button type="button" className="btn btn-secondary" onClick={addCity} style={{ flexShrink: 0 }}>
                                        <Plus size={16} /> {t('planner.addCity')}
                                    </button>
                                </div>
                            </div>

                            {/* ── Dates ── */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="input-group">
                                    <label>📅 {t('planner.startDate')}</label>
                                    <input type="date" className="input" value={formData.startDate} onChange={(e) => update('startDate', e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label>📅 {t('planner.endDate')}</label>
                                    <input type="date" className="input" value={formData.endDate} onChange={(e) => update('endDate', e.target.value)} />
                                </div>
                            </div>

                            {/* ── Date Night Toggle ── */}
                            <div className="date-night-toggle" onClick={() => update('dateNightMode', !formData.dateNightMode)}>
                                <div className="date-night-info">
                                    <Heart size={20} fill={formData.dateNightMode ? '#EC4899' : 'none'} color={formData.dateNightMode ? '#EC4899' : 'var(--text-tertiary)'} />
                                    <div>
                                        <span className="date-night-label">{t('planner.dateNight')}</span>
                                        <span className="date-night-hint">{t('planner.dateNightHint')}</span>
                                    </div>
                                </div>
                                <div className={`toggle-pill ${formData.dateNightMode ? 'toggle-pill-active' : ''}`}>
                                    <div className="toggle-pill-dot" />
                                </div>
                            </div>

                            {/* ── Tempo ── */}
                            <div className="input-group">
                                <label>🚶 {t('planner.tempo')}</label>
                                {TRIP_TEMPOS.map(tempo => (
                                    <label key={tempo.value} className={`radio-card ${formData.tempo === tempo.value ? 'radio-card-active' : ''}`}>
                                        <input type="radio" name="tempo" value={tempo.value} checked={formData.tempo === tempo.value}
                                            onChange={() => update('tempo', tempo.value)} style={{ display: 'none' }} />
                                        <span>{t(`tempo.${tempo.value}`)}</span>
                                    </label>
                                ))}
                            </div>

                            {/* ── Budget Level ── */}
                            <div className="input-group">
                                <label>💰 {t('planner.budget')}</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {BUDGET_LEVELS.map(b => (
                                        <Chip key={b.value} active={formData.budget === b.value}
                                            onClick={() => update('budget', b.value)} style={{ flex: 1, justifyContent: 'center' }}>
                                            {t(`budget.${b.value}`)}
                                        </Chip>
                                    ))}
                                </div>
                            </div>

                            {/* ── Budget Target ── */}
                            <div className="input-group">
                                <label>🎯 {t('planner.budgetTarget')}</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input type="number" className="input" placeholder={t('planner.budgetTargetPlaceholder')}
                                        value={formData.totalBudget} onChange={(e) => update('totalBudget', e.target.value)}
                                        style={{ flex: 1 }} />
                                    <select className="input" value={formData.currency} onChange={(e) => update('currency', e.target.value)}
                                        style={{ width: 100, flexShrink: 0 }}>
                                        {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* ── Priorities ── */}
                            <div className="input-group">
                                <label>⚡ {t('priority.label')}</label>
                                <p className="input-hint">{t('priority.hint')}</p>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {PRIORITIES.map(p => (
                                        <Chip key={p.value} active={formData.priorities.includes(p.value)}
                                            onClick={() => toggleArray('priorities', p.value)} style={{ flex: 1, justifyContent: 'center' }}>
                                            {t(`priority.${p.value}`)}
                                        </Chip>
                                    ))}
                                </div>
                            </div>

                            {/* ── Interests ── */}
                            <div className="input-group">
                                <label>❤️ {t('planner.interests')}</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {INTERESTS.map(interest => (
                                        <Chip key={interest.key} active={formData.interests.includes(interest.key)}
                                            onClick={() => toggleArray('interests', interest.key)}>
                                            {t(`interest.${interest.key}`)}
                                        </Chip>
                                    ))}
                                </div>
                            </div>

                            {/* ═══════════ ADVANCED OPTIONS ═══════════ */}
                            <div className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
                                <span>{t('planner.advancedOptions')}</span>
                                {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>

                            <AnimatePresence>
                                {showAdvanced && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>

                                        {/* Advanced Tabs */}
                                        <div className="advanced-tabs">
                                            {[
                                                { key: 'transport', icon: Bus, label: t('planner.transportSection') },
                                                { key: 'meals', icon: Utensils, label: t('planner.mealSection') },
                                                { key: 'tours', icon: MapIcon, label: t('planner.tourSection') },
                                            ].map(tab => (
                                                <button key={tab.key} type="button"
                                                    className={`advanced-tab ${advancedTab === tab.key ? 'advanced-tab-active' : ''}`}
                                                    onClick={() => setAdvancedTab(tab.key)}>
                                                    <tab.icon size={16} /> {tab.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* ── Transport Tab ── */}
                                        {advancedTab === 'transport' && (
                                            <div className="advanced-content">
                                                <label>{t('transport.label')}</label>
                                                <p className="input-hint">{t('transport.hint')}</p>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                                    {TRANSPORT_MODES.map(m => (
                                                        <Chip key={m.value} active={formData.transportMode === m.value}
                                                            onClick={() => update('transportMode', m.value)}>
                                                            {t(`transport.${m.value}`)}
                                                        </Chip>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* ── Meals Tab ── */}
                                        {advancedTab === 'meals' && (
                                            <div className="advanced-content">
                                                <label>{t('meal.style')}</label>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                                                    {MEAL_STYLES.map(m => (
                                                        <Chip key={m.value} active={formData.mealStyle.includes(m.value)}
                                                            onClick={() => toggleArray('mealStyle', m.value)}>
                                                            {t(`meal.${m.value}`)}
                                                        </Chip>
                                                    ))}
                                                </div>
                                                <label>{t('diet.label')}</label>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                    {DIET_OPTIONS.map(d => (
                                                        <Chip key={d.value} active={formData.dietOptions.includes(d.value)}
                                                            onClick={() => toggleArray('dietOptions', d.value)}>
                                                            {t(`diet.${d.value}`)}
                                                        </Chip>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* ── Tours Tab ── */}
                                        {advancedTab === 'tours' && (
                                            <div className="advanced-content">
                                                {/* Group Type */}
                                                <label>{t('tour.groupType')}</label>
                                                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                                    {TOUR_GROUP_TYPES.map(g => (
                                                        <Chip key={g.value} active={formData.tourGroupType === g.value}
                                                            onClick={() => update('tourGroupType', g.value)} style={{ flex: 1, justifyContent: 'center' }}>
                                                            {t(`tour.${g.value}`)}
                                                        </Chip>
                                                    ))}
                                                </div>

                                                {/* Walking Level */}
                                                <label>{t('tour.walkLevel')}</label>
                                                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                                    {WALKING_LEVELS.map(w => (
                                                        <Chip key={w.value} active={formData.walkingLevel === w.value}
                                                            onClick={() => update('walkingLevel', w.value)} style={{ flex: 1, justifyContent: 'center' }}>
                                                            {t(`tour.walk${w.value.charAt(0).toUpperCase() + w.value.slice(1)}`)}
                                                        </Chip>
                                                    ))}
                                                </div>

                                                {/* Photo Stops */}
                                                <label>{t('tour.photoStops')}</label>
                                                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                                    {PHOTO_STOP_OPTIONS.map(p => (
                                                        <Chip key={p.value} active={formData.photoStops === p.value}
                                                            onClick={() => update('photoStops', p.value)} style={{ flex: 1, justifyContent: 'center' }}>
                                                            {t(`tour.photo${p.value.charAt(0).toUpperCase() + p.value.slice(1)}`)}
                                                        </Chip>
                                                    ))}
                                                </div>

                                                {/* Shopping Stops */}
                                                <label>{t('tour.shoppingStop')}</label>
                                                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                                    {SHOPPING_STOP_OPTIONS.map(s => (
                                                        <Chip key={s.value} active={formData.shoppingStop === s.value}
                                                            onClick={() => update('shoppingStop', s.value)} style={{ flex: 1, justifyContent: 'center' }}>
                                                            {t(`tour.shop${s.value.charAt(0).toUpperCase() + s.value.slice(1)}`)}
                                                        </Chip>
                                                    ))}
                                                </div>

                                                {/* Accessibility */}
                                                <label>{t('tour.accessibility')}</label>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                    {ACCESSIBILITY_OPTIONS.map(a => (
                                                        <Chip key={a.value} active={formData.accessibility.includes(a.value)}
                                                            onClick={() => toggleArray('accessibility', a.value)}>
                                                            {t(`tour.${a.value}`)}
                                                        </Chip>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Error */}
                            {error && (
                                <div className="form-error">{error}</div>
                            )}

                            {/* Submit */}
                            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: 8 }}>
                                {loading ? (
                                    <><Loader2 size={18} className="spin" /> {t('planner.generating')}</>
                                ) : (
                                    <><Plane size={18} /> {t('planner.generateBtn')}</>
                                )}
                            </button>
                        </motion.form>
                    )}

                    {/* ═══════════════════ RESULT ═══════════════════ */}
                    {view === 'result' && itinerary && (
                        <motion.div className="itinerary" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                            {/* Overview */}
                            <div className="result-overview">
                                <h3>📋 {t('planner.overview')}</h3>
                                <p>{itinerary.overview}</p>
                            </div>

                            {/* ═══ WEATHER FORECAST ═══ */}
                            {weatherInfo?.forecasts?.length > 0 && (
                                <motion.div className="planner-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                    <div className="planner-section-header" style={{ cursor: 'default' }}>
                                        <CloudRain size={18} /> {t('weather.title')}
                                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                            {weatherInfo.city}, {weatherInfo.country}
                                        </span>
                                    </div>
                                    <div className="planner-section-body">
                                        <div className="weather-grid">
                                            {weatherInfo.forecasts.map((f, i) => {
                                                const weatherIcons = { Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Snow: '❄️', Thunderstorm: '⛈️', Drizzle: '🌦️', Mist: '🌫️', Fog: '🌫️' }
                                                const icon = weatherIcons[f.weather] || '🌤️'
                                                const rainPct = Math.round((f.pop || 0) * 100)
                                                return (
                                                    <div key={i} className={`weather-card ${rainPct > 50 ? 'weather-rainy' : rainPct > 20 ? 'weather-cloudy' : 'weather-sunny'}`}>
                                                        <span className="weather-icon">{icon}</span>
                                                        <span className="weather-date">{new Date(f.date).toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                                        <span className="weather-temp">{Math.round(f.tempMin)}° – {Math.round(f.tempMax)}°C</span>
                                                        <span className="weather-desc">{f.description}</span>
                                                        {rainPct > 0 && <span className="weather-rain">🌧 {rainPct}%</span>}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ═══ LOCAL EVENTS ═══ */}
                            {eventsInfo.length > 0 && (
                                <motion.div className="planner-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                    <div className="planner-section-header" style={{ cursor: 'default' }}>
                                        🎭 {t('events.title')}
                                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                            {eventsInfo.length} {t('events.found')}
                                        </span>
                                    </div>
                                    <div className="planner-section-body">
                                        <div className="events-list">
                                            {eventsInfo.slice(0, 8).map((event, i) => (
                                                <div key={i} className="event-card">
                                                    <div className="event-card-left">
                                                        <div className="event-date-badge">
                                                            <span className="event-date-day">{event.date ? new Date(event.date).getDate() : '?'}</span>
                                                            <span className="event-date-month">{event.date ? new Date(event.date).toLocaleDateString(locale, { month: 'short' }) : ''}</span>
                                                        </div>
                                                    </div>
                                                    <div className="event-card-body">
                                                        <h4>{event.title}</h4>
                                                        <div className="event-meta">
                                                            <span className="event-category">{event.category}</span>
                                                            {event.venue && <span>📍 {event.venue}</span>}
                                                            {event.time && <span>🕐 {event.time}</span>}
                                                        </div>
                                                        {event.description && <p className="event-desc">{event.description.substring(0, 120)}...</p>}
                                                    </div>
                                                    <div className="event-card-action">
                                                        {event.url ? (
                                                            <a href={event.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">
                                                                🎟️ {t('events.getTickets')}
                                                            </a>
                                                        ) : (
                                                            <a href={`https://www.google.com/search?q=${encodeURIComponent(event.title + ' ' + (event.venue || '') + ' tickets')}`}
                                                                target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary">
                                                                🔍 {t('events.search')}
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ═══ FLIGHT SEARCH ═══ */}
                            <motion.div className="planner-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                <div className="planner-section-header" style={{ cursor: 'default' }}>
                                    <Plane size={18} /> {t('flights.title')}
                                </div>
                                <div className="planner-section-body">
                                    <div className="flight-search-bar">
                                        <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                                            <label>{t('flights.origin')}</label>
                                            <input type="text" className="input" placeholder={t('flights.originPlaceholder')}
                                                value={flightSearch.origin}
                                                onChange={(e) => setFlightSearch(prev => ({ ...prev, origin: e.target.value }))}
                                                maxLength={3} style={{ textTransform: 'uppercase' }} />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                            <button className="btn btn-primary" onClick={searchFlights}
                                                disabled={flightSearch.searching || !flightSearch.origin}>
                                                {flightSearch.searching ? <Loader2 size={16} className="spin" /> : <Plane size={16} />}
                                                {t('flights.search')}
                                            </button>
                                        </div>
                                    </div>
                                    <p className="input-hint">{t('flights.hint')}</p>

                                    {/* Flight Results */}
                                    {flightsInfo.length > 0 && (
                                        <div className="flights-list">
                                            {flightsInfo.map((flight, i) => (
                                                <div key={i} className="flight-card">
                                                    <div className="flight-card-route">
                                                        {flight.segments?.map((seg, si) => (
                                                            <div key={si} className="flight-segment">
                                                                {seg.segments?.map((s, ssi) => (
                                                                    <div key={ssi} className="flight-leg">
                                                                        <span className="flight-code">{s.departure}</span>
                                                                        <span className="flight-arrow">✈️→</span>
                                                                        <span className="flight-code">{s.arrival}</span>
                                                                        <span className="flight-time">{s.departureTime?.substring(11, 16)}</span>
                                                                        <span className="flight-carrier">{s.flightNumber}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flight-card-price">
                                                        <span className="flight-price">{Number(flight.price).toLocaleString()} {flight.currency}</span>
                                                        <span className="flight-class">{flight.bookingClass}</span>
                                                        <a href={`https://www.google.com/travel/flights?q=${encodeURIComponent(`${flightSearch.origin} to ${formData.cities[0] || formData.cityInput} ${formData.startDate}`)}`}
                                                            target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary" style={{ marginTop: 8 }}>
                                                            ✈️ {t('flights.book')}
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Quick booking link (always visible) */}
                                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                                        <a href={`https://www.google.com/travel/flights?q=${encodeURIComponent(`flights to ${formData.cities[0] || formData.cityInput} ${formData.startDate || ''}`)}`}
                                            target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                                            🔍 {t('flights.googleFlights')}
                                        </a>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                                <button className="btn btn-primary" onClick={saveTrip} disabled={saving}>
                                    <Save size={16} /> {saving ? t('planner.savingTrip') : t('planner.saveTrip')}
                                </button>
                                <button className="btn btn-secondary" onClick={() => setShowRainPlan(!showRainPlan)}>
                                    <CloudRain size={16} /> {t('planner.rainPlan')}
                                </button>
                                <button className="btn btn-ghost" onClick={() => { setView('form'); setItinerary(null) }}>
                                    <RefreshCw size={16} /> {t('planner.newPlan')}
                                </button>
                                <button className="btn btn-ghost" onClick={() => openAlbumForPrint({ city: formData.cities.join(' → ') || formData.cityInput, start_date: formData.startDate, end_date: formData.endDate, itinerary_data: itinerary }, [], '')}>
                                    📸 {t('planner.printAlbum')}
                                </button>
                            </div>

                            {/* Days */}
                            {itinerary.days?.map((day, di) => (
                                <div key={di} className="itinerary-day">
                                    <button onClick={() => setExpandedDay(expandedDay === di ? null : di)}
                                        className="itinerary-day-header"
                                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary)' }}>
                                        <div className="itinerary-day-num">{day.dayNumber}</div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: 0 }}>{day.theme || `${t('general.day')} ${day.dayNumber}`}</h4>
                                            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{day.date}</p>
                                        </div>
                                        {expandedDay === di ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </button>

                                    <AnimatePresence>
                                        {expandedDay === di && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>

                                                {/* Dress Code */}
                                                {day.dressCode && (
                                                    <div className="dress-code-card">
                                                        <Shirt size={16} />
                                                        <div>
                                                            {day.dressCode.morning && <p><strong>{t('result.morning')}:</strong> {day.dressCode.morning}</p>}
                                                            {day.dressCode.evening && <p><strong>{t('result.evening')}:</strong> {day.dressCode.evening}</p>}
                                                            {day.dressCode.tip && <p className="dress-code-tip">💡 {day.dressCode.tip}</p>}
                                                        </div>
                                                    </div>
                                                )}

                                                {day.items?.map((item, ii) => (
                                                    <div key={ii} className="itinerary-item">
                                                        <div className="itinerary-time">
                                                            {item.timeStart}{item.timeEnd ? `–${item.timeEnd}` : ''}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <h4>{item.title}</h4>
                                                            <p>{item.description}</p>
                                                            {item.transportNote && (
                                                                <p className="transport-note">🚌 {item.transportNote}</p>
                                                            )}
                                                            {item.estimatedCost && (
                                                                <span className="cost-badge">
                                                                    💰 {item.estimatedCost} {item.isEstimated && t('planner.estimated')}
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
                                <div className="card result-card" style={{ marginTop: 24 }}>
                                    <h3><DollarSign size={18} className="inline-icon" /> {t('planner.budgetEstimate')}</h3>
                                    <div className="budget-grid">
                                        {Object.entries(itinerary.budgetEstimate).map(([key, value]) => (
                                            <div key={key} className={`budget-row ${key === 'total' ? 'budget-row-total' : ''}`}>
                                                <span style={{ textTransform: 'capitalize' }}>{key}</span>
                                                <span style={{ color: 'var(--primary-1)', fontWeight: key === 'total' ? 700 : 400 }}>{value}</span>
                                            </div>
                                        ))}
                                        {formData.totalBudget && (
                                            <div className="budget-row budget-row-remaining">
                                                <span>{t('planner.budgetRemaining')}</span>
                                                <span>
                                                    {formData.currency} {formData.totalBudget}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Survival Pack */}
                            {itinerary.survivalPack && (
                                <div className="card result-card survival-pack" style={{ marginTop: 16 }}>
                                    <h3>{t('result.survivalPack')}</h3>
                                    <div className="survival-grid">
                                        {itinerary.survivalPack.transportApps?.length > 0 && (
                                            <div className="survival-item">
                                                <h4>🚌 {t('result.transportApps')}</h4>
                                                <ul>{itinerary.survivalPack.transportApps.map((a, i) => <li key={i}>{a}</li>)}</ul>
                                            </div>
                                        )}
                                        {itinerary.survivalPack.safeAreas?.length > 0 && (
                                            <div className="survival-item survival-safe">
                                                <h4>🟢 {t('result.safeAreas')}</h4>
                                                <ul>{itinerary.survivalPack.safeAreas.map((a, i) => <li key={i}>{a}</li>)}</ul>
                                            </div>
                                        )}
                                        {itinerary.survivalPack.cautionAreas?.length > 0 && (
                                            <div className="survival-item survival-caution">
                                                <h4>🟡 {t('result.cautionAreas')}</h4>
                                                <ul>{itinerary.survivalPack.cautionAreas.map((a, i) => <li key={i}>{a}</li>)}</ul>
                                            </div>
                                        )}
                                        {itinerary.survivalPack.tipping && (
                                            <div className="survival-item">
                                                <h4>💰 {t('result.tipping')}</h4>
                                                <p>{itinerary.survivalPack.tipping}</p>
                                            </div>
                                        )}
                                        {itinerary.survivalPack.closingHours && (
                                            <div className="survival-item">
                                                <h4>🕐 {t('result.closingHours')}</h4>
                                                <p>{itinerary.survivalPack.closingHours}</p>
                                            </div>
                                        )}
                                        {itinerary.survivalPack.scamWarnings?.length > 0 && (
                                            <div className="survival-item survival-danger">
                                                <h4>⚠️ {t('result.scamWarnings')}</h4>
                                                <ul>{itinerary.survivalPack.scamWarnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Alternatives */}
                            {itinerary.alternatives?.length > 0 && (
                                <div className="card result-card" style={{ marginTop: 16 }}>
                                    <h3>{t('result.alternatives')}</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {itinerary.alternatives.map((alt, i) => (
                                            <div key={i} className="alternative-card">
                                                <h4>{alt.name}</h4>
                                                <p>{alt.description}</p>
                                                <div className="alternative-meta">
                                                    <span className="badge badge-primary">{alt.totalCost}</span>
                                                    {alt.savings && <span className="badge badge-success">{t('result.savings')}: {alt.savings}</span>}
                                                </div>
                                                {alt.tradeoff && <p className="alternative-tradeoff">⚖️ {alt.tradeoff}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tips */}
                            {itinerary.tips?.length > 0 && (
                                <div className="card result-card" style={{ marginTop: 16 }}>
                                    <h3><Lightbulb size={18} className="inline-icon" /> {t('planner.tips')}</h3>
                                    <ul className="tips-list">
                                        {itinerary.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                                    </ul>
                                </div>
                            )}

                            {/* Next Time Suggestions */}
                            {itinerary.nextTimeSuggestions?.length > 0 && (
                                <div className="card result-card" style={{ marginTop: 16 }}>
                                    <h3>{t('result.nextTime')}</h3>
                                    <p className="input-hint" style={{ marginBottom: 12 }}>{t('result.nextTimeHint')}</p>
                                    {itinerary.nextTimeSuggestions.map((s, i) => (
                                        <div key={i} className="next-time-item">
                                            <MapPin size={16} style={{ color: 'var(--primary-1)', flexShrink: 0, marginTop: 2 }} />
                                            <div>
                                                <strong>{s.title}</strong>
                                                <p>{s.reason}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Rain Plan */}
                            <AnimatePresence>
                                {showRainPlan && itinerary.rainPlan && (
                                    <motion.div className="card result-card" style={{ marginTop: 16, borderColor: 'var(--accent-sky)' }}
                                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}>
                                        <h3>🌧️ {t('planner.rainPlanB')}</h3>
                                        <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>{itinerary.rainPlan.overview}</p>
                                        {itinerary.rainPlan.alternatives?.map((alt, i) => (
                                            <div key={i} className="rain-alt">
                                                <p className="rain-alt-instead">{t('planner.insteadOf')} {alt.instead_of}</p>
                                                <p className="rain-alt-do">→ {alt.do_this}</p>
                                                <p className="rain-alt-desc">{alt.description}</p>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* ═══════════════════ SAVED TRIPS ═══════════════════ */}
                    {view === 'trips' && (
                        <div>
                            {savedTrips.length === 0 ? (
                                <div className="empty-state">
                                    <Plane size={48} className="empty-state-icon" />
                                    <h3>{t('planner.noTrips')}</h3>
                                    <p>{t('planner.noTripsDesc')}</p>
                                    <button className="btn btn-primary" onClick={() => setView('form')}>{t('planner.createPlan')}</button>
                                </div>
                            ) : (
                                <div className="pin-grid">
                                    {savedTrips.map((trip, i) => (
                                        <motion.div key={trip.id} className="pin-card card-hover"
                                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => {
                                                setItinerary(trip.itinerary_data)
                                                setFormData(prev => ({ ...prev, cities: trip.city.split(' → ') }))
                                                setView('result'); setExpandedDay(0)
                                            }}
                                            style={{ cursor: 'pointer' }}>
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
            <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
        </>
    )
}
