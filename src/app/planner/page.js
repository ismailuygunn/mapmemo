'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSpace } from '@/context/SpaceContext'
import { useAuth } from '@/context/AuthContext'
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
import { toast } from 'sonner'
import { Badge, InfoTooltip } from '@/components/ui'
import { openAlbumForPrint } from '@/lib/albumGenerator'
import TripGallery from '@/components/planner/TripGallery'
import CoverGenerator from '@/components/planner/CoverGenerator'

export default function PlannerPage() {
    const [view, setView] = useState('form')
    const [formStep, setFormStep] = useState(0) // 0=destination, 1=dates, 2=style, 3=preferences
    const [formData, setFormData] = useState({
        cities: [],
        cityInput: '',
        startDate: '', endDate: '',
        tempo: 'moderate', budget: 'moderate',
        interests: [],
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
        groupType: 'friends', // solo, couple, friends, family
        flexDates: false,
        preferredTime: 'any',
        departureCity: '',
    })
    const [itinerary, setItinerary] = useState(null)
    const [savedTrips, setSavedTrips] = useState([])
    const [loading, setLoading] = useState(false)
    const [loadingProgress, setLoadingProgress] = useState(0)
    const [loadingStep, setLoadingStep] = useState('')
    const [saving, setSaving] = useState(false)
    const [savedTripId, setSavedTripId] = useState(null)
    const [error, setError] = useState('')
    const [expandedDay, setExpandedDay] = useState(null)
    const [showRainPlan, setShowRainPlan] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [advancedTab, setAdvancedTab] = useState('transport')
    const [citySuggestions, setCitySuggestions] = useState([])
    const [depSuggestions, setDepSuggestions] = useState([])
    const [departureSuggestions, setDepartureSuggestions] = useState([])
    // Phase 3+4+6 visible data
    const [weatherInfo, setWeatherInfo] = useState(null)
    const [eventsInfo, setEventsInfo] = useState([])
    const [flightsInfo, setFlightsInfo] = useState([])
    const [transportLoading, setTransportLoading] = useState(false)
    const [suggFilter, setSuggFilter] = useState('all')
    const [expandedSugg, setExpandedSugg] = useState(null)
    const [addedSuggs, setAddedSuggs] = useState({})
    const [editingItem, setEditingItem] = useState(null) // {di, ii} — day index, item index
    const [planVote, setPlanVote] = useState(null) // 'up' | 'down'
    const [shareLink, setShareLink] = useState('')
    const [userSpaces, setUserSpaces] = useState([])
    const [selectedSpaceId, setSelectedSpaceId] = useState(null)
    const { space, createSpace } = useSpace()
    const { user } = useAuth()
    const { t, locale } = useLanguage()
    const supabase = createClient()
    const FORM_STEPS = [
        { key: 'destination', icon: '📍', label: locale === 'tr' ? 'Nereye' : 'Where' },
        { key: 'dates', icon: '📅', label: locale === 'tr' ? 'Ne Zaman' : 'When' },
        { key: 'style', icon: '✨', label: locale === 'tr' ? 'Nasıl' : 'Style' },
        { key: 'preferences', icon: '🎯', label: locale === 'tr' ? 'Detaylar' : 'Details' },
    ]

    // Calculate trip duration
    const tripDays = useMemo(() => {
        if (!formData.startDate || !formData.endDate) return 0
        return Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1
    }, [formData.startDate, formData.endDate])

    useEffect(() => { if (space) loadTrips() }, [space])

    // ── Read URL params from Quick Plan modal ──
    useEffect(() => {
        if (typeof window === 'undefined') return
        const params = new URLSearchParams(window.location.search)
        const city = params.get('city')
        const depart = params.get('depart')
        const ret = params.get('return')
        const tempo = params.get('tempo')
        const budget = params.get('budget')
        const departure = params.get('departure')

        if (city) {
            setFormData(prev => ({
                ...prev,
                cities: [city],
                cityInput: '',
                startDate: depart || prev.startDate,
                endDate: ret || prev.endDate,
                tempo: tempo || prev.tempo,
                budget: budget || prev.budget,
                departureCity: departure || prev.departureCity,
            }))
            if (depart && ret) setFormStep(2)
            else setFormStep(1)
        }
    }, [])

    // Load all user spaces for save selector
    useEffect(() => {
        const loadUserSpaces = async () => {
            try {
                const { data: memberships } = await supabase
                    .from('space_members')
                    .select('space_id, role')
                    .eq('user_id', user?.id)
                if (memberships && memberships.length > 0) {
                    const spaceIds = memberships.map(m => m.space_id)
                    const { data: spacesData } = await supabase
                        .from('spaces')
                        .select('id, name')
                        .in('id', spaceIds)
                    if (spacesData) {
                        setUserSpaces(spacesData)
                        // Default to current active space, or first space
                        setSelectedSpaceId(space?.id || spacesData[0]?.id || null)
                    }
                }
            } catch (err) {
                console.error('Failed to load spaces:', err)
            }
        }
        if (user?.id) loadUserSpaces()
    }, [user?.id, space?.id])

    // Auto search transport when dates and cities change
    useEffect(() => {
        if (formData.startDate && formData.departureCity && (formData.cities.length > 0 || formData.cityInput.length > 2)) {
            const timer = setTimeout(() => {
                autoSearchTransport(formData.cities.length > 0 ? formData.cities : [formData.cityInput.trim()])
            }, 1500)
            return () => clearTimeout(timer)
        }
    }, [formData.startDate, formData.endDate, formData.departureCity, formData.cities.length])

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

    // Multi-city management with Google Places
    const fetchCitySuggestions = async (query, setter) => {
        if (query.length < 2) { setter([]); return }
        try {
            const res = await fetch(`/api/places?action=autocomplete&query=${encodeURIComponent(query)}&lang=${locale || 'tr'}`)
            if (res.ok) {
                const data = await res.json()
                setter(data.suggestions || [])
            } else {
                setter([])
            }
        } catch { setter([]) }
    }

    const addCity = () => {
        if (formData.cityInput.trim() && formData.selectedFromList) {
            update('cities', [...formData.cities, formData.cityInput.trim()])
            update('cityInput', '')
            update('selectedFromList', false)
            setCitySuggestions([])
        }
    }
    const selectCitySuggestion = (name) => {
        update('cities', [...formData.cities, name])
        update('cityInput', '')
        update('selectedFromList', false)
        setCitySuggestions([])
    }
    const selectDepartureSuggestion = (name) => {
        update('departureCity', name)
        setDepartureSuggestions([])
    }
    const removeCity = (index) => {
        update('cities', formData.cities.filter((_, i) => i !== index))
    }
    const handleCityKeyDown = (e) => {
        if (e.key === 'Enter') { e.preventDefault() }
    }

    // IATA code mapping for common cities
    const CITY_IATA = {
        'istanbul': 'IST', 'ankara': 'ESB', 'izmir': 'ADB', 'antalya': 'AYT', 'bodrum': 'BJV',
        'dalaman': 'DLM', 'trabzon': 'TZX', 'adana': 'ADA', 'gaziantep': 'GZT', 'kayseri': 'ASR',
        'london': 'LHR', 'paris': 'CDG', 'rome': 'FCO', 'barcelona': 'BCN', 'madrid': 'MAD',
        'berlin': 'BER', 'amsterdam': 'AMS', 'vienna': 'VIE', 'prague': 'PRG', 'budapest': 'BUD',
        'athens': 'ATH', 'dubai': 'DXB', 'new york': 'JFK', 'los angeles': 'LAX', 'tokyo': 'NRT',
        'bangkok': 'BKK', 'singapore': 'SIN', 'bali': 'DPS', 'milan': 'MXP', 'lisbon': 'LIS',
        'porto': 'OPO', 'zurich': 'ZRH', 'munich': 'MUC', 'stockholm': 'ARN', 'oslo': 'OSL',
        'copenhagen': 'CPH', 'dublin': 'DUB', 'edinburgh': 'EDI', 'nice': 'NCE', 'florence': 'FLR',
        'venice': 'VCE', 'tbilisi': 'TBS', 'baku': 'GYD', 'cairo': 'CAI', 'marrakech': 'RAK',
    }
    const getIATA = (city) => CITY_IATA[city?.toLowerCase()] || city?.substring(0, 3).toUpperCase()

    // Auto transport search (Phase 6) — runs after plan generated
    const autoSearchTransport = async (cities) => {
        if (!formData.departureCity) return
        setTransportLoading(true)
        try {
            const originIATA = getIATA(formData.departureCity)
            const destIATA = getIATA(cities[0])
            const qs = new URLSearchParams({
                origin: originIATA,
                destination: destIATA,
                departure: formData.startDate || new Date().toISOString().split('T')[0],
                adults: '2',
                currency: formData.currency || 'TRY',
            })
            if (formData.endDate) qs.append('return', formData.endDate)
            const res = await fetch(`/api/flights?${qs}`)
            const data = await res.json()
            if (data.flights) setFlightsInfo(data.flights)
        } catch { /* silent */ }
        setTransportLoading(false)
    }

    const generatePlan = async (e) => {
        e.preventDefault()
        setError('')
        if (formData.cities.length === 0) {
            setError(locale === 'tr' ? 'Lütfen listeden bir şehir seçin' : 'Please select a city from the list'); return
        }
        const cities = formData.cities

        setLoading(true)
        setLoadingProgress(0)
        setLoadingStep(locale === 'tr' ? '📍 Pinler kontrol ediliyor...' : '📍 Checking pins...')
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
            setLoadingProgress(15)

            // Fetch weather forecast
            setLoadingStep(locale === 'tr' ? '🌤️ Hava durumu kontrol ediliyor...' : '🌤️ Checking weather...')
            let weatherData = null
            try {
                const weatherRes = await fetch(`/api/weather?city=${encodeURIComponent(cities[0])}&lang=${locale}`)
                weatherData = await weatherRes.json()
                if (weatherData?.available) setWeatherInfo(weatherData)
            } catch { /* silent */ }
            setLoadingProgress(30)

            // Fetch events
            setLoadingStep(locale === 'tr' ? '🎭 Etkinlikler ve festivallar taranıyor...' : '🎭 Scanning events & festivals...')
            let eventsData = []
            try {
                const qs = new URLSearchParams({ city: cities[0] })
                if (formData.startDate) qs.append('start', formData.startDate)
                if (formData.endDate) qs.append('end', formData.endDate)
                const eventsRes = await fetch(`/api/events?${qs}`)
                const eventsJson = await eventsRes.json()
                if (eventsJson.events) { eventsData = eventsJson.events; setEventsInfo(eventsJson.events) }
            } catch { /* silent */ }
            setLoadingProgress(45)

            // Generate plan
            setLoadingStep(locale === 'tr' ? '✨ AI büyüsü devrede — plan hazırlanıyor...' : '✨ AI magic in action — crafting your plan...')
            const progressInterval = setInterval(() => {
                setLoadingProgress(prev => Math.min(prev + 2, 90))
            }, 500)

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
                    wishlist: formData.wishlist || [],
                    guideLanguage: formData.guideLanguage,
                    dateNightMode: formData.dateNightMode,
                    flexDates: formData.flexDates,
                    preferredTime: formData.preferredTime,
                    weatherData,
                    eventsData,
                    locale,
                }),
            })
            clearInterval(progressInterval)
            setLoadingProgress(95)
            setLoadingStep(locale === 'tr' ? '🎉 Plan neredeyse hazır — son dokunuşlar...' : '🎉 Almost ready — final touches...')

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed')
            setLoadingProgress(100)
            setItinerary(data)
            setView('result')
            setExpandedDay(0)
            autoSearchTransport(cities)
            toast.success(locale === 'tr' ? '✈️ Planınız hazır!' : '✈️ Your plan is ready!')
        } catch (err) {
            setError(err.message)
            toast.error(locale === 'tr' ? 'Plan oluşturulamadı' : 'Failed to generate plan', { description: err.message })
        }
        setLoading(false)
        setLoadingProgress(0)
    }

    // Add a suggestion to a specific day
    const addSuggestionToDay = (sugg, dayIndex) => {
        if (!itinerary?.days?.[dayIndex]) return
        const newItinerary = { ...itinerary, days: [...itinerary.days] }
        const day = { ...newItinerary.days[dayIndex] }
        const items = [...(day.items || [])]

        // Convert suggestion to itinerary item
        const newItem = {
            timeStart: sugg.bestTimeToVisit === 'morning' ? '10:00' : sugg.bestTimeToVisit === 'afternoon' ? '14:00' : sugg.bestTimeToVisit === 'evening' ? '19:00' : '12:00',
            timeEnd: '',
            title: sugg.name,
            description: sugg.aiSummary || '',
            type: sugg.type || 'sightseeing',
            cost: sugg.estimatedCost || '',
            rating: sugg.rating,
            googleMapsUrl: sugg.googleMapsUrl || '',
            isHiddenGem: sugg.isHiddenGem || false,
            fromSuggestion: true,
        }

        items.push(newItem)
        // Sort by time
        items.sort((a, b) => (a.timeStart || '').localeCompare(b.timeStart || ''))
        day.items = items
        newItinerary.days[dayIndex] = day
        setItinerary(newItinerary)
        setAddedSuggs(prev => ({ ...prev, [sugg.id || sugg.name]: dayIndex + 1 }))
        toast.success(locale === 'tr' ? `✅ ${sugg.name} — Gün ${dayIndex + 1}'e eklendi` : `✅ ${sugg.name} added to Day ${dayIndex + 1}`)
    }

    // Edit an item in the itinerary
    const updateItem = (di, ii, field, value) => {
        const newIt = { ...itinerary, days: [...itinerary.days] }
        const day = { ...newIt.days[di], items: [...newIt.days[di].items] }
        day.items[ii] = { ...day.items[ii], [field]: value }
        newIt.days[di] = day
        setItinerary(newIt)
    }

    // Delete an item
    const deleteItem = (di, ii) => {
        const newIt = { ...itinerary, days: [...itinerary.days] }
        const day = { ...newIt.days[di], items: [...newIt.days[di].items] }
        day.items.splice(ii, 1)
        newIt.days[di] = day
        setItinerary(newIt)
        setEditingItem(null)
        toast.success(locale === 'tr' ? 'Silindi' : 'Deleted')
    }

    // Move item up/down
    const moveItem = (di, ii, direction) => {
        const newIt = { ...itinerary, days: [...itinerary.days] }
        const day = { ...newIt.days[di], items: [...newIt.days[di].items] }
        const newIndex = ii + direction
        if (newIndex < 0 || newIndex >= day.items.length) return
            ;[day.items[ii], day.items[newIndex]] = [day.items[newIndex], day.items[ii]]
        newIt.days[di] = day
        setItinerary(newIt)
    }

    const saveTrip = async () => {
        if (!itinerary) return
        setSaving(true)
        try {
            let targetSpaceId = selectedSpaceId
            // If no spaces exist, auto-create one
            if (!targetSpaceId) {
                const newSpace = await createSpace(locale === 'tr' ? 'Seyahat Planlarım' : 'My Travel Plans')
                targetSpaceId = newSpace.id
                setUserSpaces(prev => [...prev, { id: newSpace.id, name: newSpace.name }])
                setSelectedSpaceId(newSpace.id)
            }
            const { data: trip, error: e } = await supabase
                .from('trips')
                .insert({
                    space_id: targetSpaceId,
                    city: formData.cities.join(' → ') || formData.cityInput,
                    start_date: formData.startDate || null,
                    end_date: formData.endDate || null,
                    itinerary_data: itinerary,
                    tempo: formData.tempo,
                    budget: formData.budget,
                    cover_photo_url: itinerary?.coverPhoto || null,
                    hero_image_url: itinerary?.coverPhoto || null,
                })
                .select().single()
            if (e) throw e
            setSavedTrips(prev => [trip, ...prev])
            setSavedTripId(trip.id)
            const spaceName = userSpaces.find(s => s.id === targetSpaceId)?.name || ''
            toast.success(locale === 'tr' ? '💾 Plan kaydedildi!' : '💾 Plan saved!', {
                description: spaceName ? `${spaceName} ${locale === 'tr' ? 'grubuna eklendi' : 'group'}` : ''
            })
        } catch (err) {
            setError(err.message)
            toast.error(locale === 'tr' ? 'Kayıt başarısız' : 'Save failed', { description: err.message })
        }
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

    // Step validation — cities MUST be from list (not free text)
    const canProceedStep = (step) => {
        if (step === 0) return formData.cities.length > 0
        if (step === 1) return formData.startDate && formData.endDate
        if (step === 2) return true
        return true
    }

    return (
        <>
            <Sidebar />
            <div className="main-content">
                <div className="page">
                    {/* Header */}
                    <div className="page-header" style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.08), rgba(124,58,237,0.04))', padding: '20px 24px', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>✈️ {t('planner.title')}</h1>
                                <p style={{ fontSize: '0.875rem' }}>{t('planner.subtitle')}</p>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button type="button" className={`btn ${view !== 'trips' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => { setView('form'); setItinerary(null); setFormStep(0) }}>
                                    <Plane size={16} /> {t('planner.newPlan')}
                                </button>
                                <button type="button" className={`btn ${view === 'trips' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setView('trips')}>
                                    <Save size={16} /> ({savedTrips.length})
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ═══ FUN LOADING OVERLAY ═══ */}
                    <AnimatePresence>
                        {loading && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                style={{
                                    position: 'fixed', inset: 0, zIndex: 100,
                                    background: 'linear-gradient(135deg, rgba(15,10,40,0.95), rgba(30,15,60,0.95))',
                                    backdropFilter: 'blur(12px)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    gap: 24, padding: 32,
                                }}>
                                {/* Animated Globe */}
                                <motion.div
                                    animate={{ y: [0, -12, 0] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                                    style={{ position: 'relative' }}
                                >
                                    <motion.span
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
                                        style={{ fontSize: '4rem', display: 'block' }}
                                    >🌍</motion.span>
                                    <motion.div
                                        animate={{ x: [-30, 30, -30], y: [-5, 5, -5] }}
                                        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                                        style={{ position: 'absolute', top: -10, right: -20 }}
                                    >
                                        <Plane size={24} color="#FBBF24" style={{ transform: 'rotate(-30deg)' }} />
                                    </motion.div>
                                </motion.div>

                                {/* Fun loading messages */}
                                <motion.div
                                    key={loadingStep}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{ color: 'white', fontSize: '1.2rem', fontWeight: 700, textAlign: 'center', maxWidth: 400 }}
                                >
                                    {loadingStep}
                                </motion.div>

                                {/* Decorative emojis floating */}
                                <div style={{ display: 'flex', gap: 16, opacity: 0.6 }}>
                                    {['🏛️', '🍕', '🎭', '🌅', '🎒', '✈️', '🗺️'].map((e, i) => (
                                        <motion.span
                                            key={i}
                                            animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
                                            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                                            style={{ fontSize: '1.2rem' }}
                                        >{e}</motion.span>
                                    ))}
                                </div>

                                {/* Progress bar */}
                                <div style={{ width: '100%', maxWidth: 360, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                                    <motion.div
                                        style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg, #818CF8, #F472B6, #FBBF24)' }}
                                        animate={{ width: `${loadingProgress}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', letterSpacing: 1 }}>
                                    {loadingProgress}% — {locale === 'tr' ? 'Biraz sabır, harika bir plan geliyor...' : 'Patience, an amazing plan is coming...'}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ═══════════════════ FORM ═══════════════════ */}
                    {view === 'form' && (
                        <motion.form className="planner-form" onSubmit={generatePlan} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                            {/* Step Progress Bar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
                                {FORM_STEPS.map((step, i) => (
                                    <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                        <button type="button" onClick={() => setFormStep(i)} style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                            background: 'none', border: 'none', cursor: 'pointer', padding: '8px 4px', width: '100%',
                                            opacity: formStep === i ? 1 : 0.5,
                                            transition: 'all 0.2s ease',
                                        }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: '50%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1.125rem',
                                                background: formStep === i ? 'linear-gradient(135deg, var(--primary-1), var(--primary-2))' : formStep > i ? 'var(--success)' : 'var(--bg-tertiary)',
                                                color: formStep >= i ? 'white' : 'var(--text-tertiary)',
                                                transition: 'all 0.3s ease',
                                                boxShadow: formStep === i ? '0 4px 12px rgba(79,70,229,0.3)' : 'none',
                                            }}>
                                                {formStep > i ? '✓' : step.icon}
                                            </div>
                                            <span style={{ fontSize: '0.6875rem', fontWeight: formStep === i ? 600 : 400, color: formStep === i ? 'var(--primary-1)' : 'var(--text-tertiary)' }}>
                                                {step.label}
                                            </span>
                                        </button>
                                        {i < FORM_STEPS.length - 1 && (
                                            <div style={{
                                                flex: 1, height: 2, background: formStep > i ? 'var(--success)' : 'var(--bg-tertiary)',
                                                transition: 'background 0.3s ease', marginBottom: 18,
                                            }} />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* ── STEP 0: Destination ── */}
                            <AnimatePresence mode="wait">
                                {formStep === 0 && (
                                    <motion.div key="step0" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.2 }}>
                                        {/* Multi-City Input */}
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
                                                <div style={{ flex: 1, position: 'relative' }}>
                                                    <input
                                                        type="text" className="input"
                                                        placeholder={t('planner.cityPlaceholder')}
                                                        value={formData.cityInput}
                                                        onChange={(e) => { update('cityInput', e.target.value); fetchCitySuggestions(e.target.value, setCitySuggestions) }}
                                                        onKeyDown={(e) => {
                                                            // Only allow selection from list — block Enter for free text
                                                            if (e.key === 'Enter') { e.preventDefault(); return }
                                                            handleCityKeyDown(e)
                                                        }}
                                                        autoComplete="off"
                                                    />
                                                    {formData.cityInput.length > 0 && citySuggestions.length === 0 && (
                                                        <p style={{ fontSize: '0.68rem', color: '#F59E0B', marginTop: 4 }}>
                                                            {locale === 'tr' ? '⚠️ Listeden bir şehir seçmelisiniz' : '⚠️ Please select a city from the list'}
                                                        </p>
                                                    )}
                                                    {/* Google Places Suggestions — MUST select from here */}
                                                    {citySuggestions.length > 0 && (
                                                        <div style={{
                                                            position: 'absolute', top: '100%', left: 0, right: 0,
                                                            marginTop: 4, background: 'var(--bg-secondary)',
                                                            border: '1px solid var(--border-primary)',
                                                            borderRadius: 'var(--radius-md)',
                                                            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                                            zIndex: 50, maxHeight: 240, overflow: 'auto',
                                                        }}>
                                                            {citySuggestions.map((s, i) => (
                                                                <button key={i} type="button" onClick={() => selectCitySuggestion(s.name || s.description || s)}
                                                                    style={{
                                                                        display: 'flex', alignItems: 'center', gap: 8,
                                                                        width: '100%', padding: '10px 12px', border: 'none',
                                                                        background: 'transparent', cursor: 'pointer',
                                                                        color: 'var(--text-primary)', fontSize: '0.875rem',
                                                                        textAlign: 'left', transition: 'background 150ms',
                                                                    }}
                                                                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                                                >
                                                                    <MapPin size={14} style={{ color: 'var(--primary-1)', flexShrink: 0 }} />
                                                                    <span>{s.name || s.description || s}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <button type="button" className="btn btn-secondary" onClick={() => {
                                                    // Only add if there's a valid selection
                                                    if (formData.cityInput.trim()) addCity()
                                                }} style={{ flexShrink: 0 }}>
                                                    <Plus size={16} /> {t('planner.addCity')}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Wishlist / Trip Style */}
                                        <div className="input-group" style={{ marginTop: 16 }}>
                                            <label>✨ {locale === 'tr' ? 'Seyahat Tarzı' : 'Trip Style'}</label>
                                            <p className="input-hint">{locale === 'tr' ? 'İstek listeni seç, AI buna göre plan yapsın' : 'Select your wishlist, AI will plan accordingly'}</p>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {[
                                                    { key: 'romantic', emoji: '💕', tr: 'Romantik', en: 'Romantic' },
                                                    { key: 'adventure', emoji: '🧗', tr: 'Macera', en: 'Adventure' },
                                                    { key: 'culture', emoji: '🏛️', tr: 'Kültür', en: 'Culture' },
                                                    { key: 'gastro', emoji: '🍽️', tr: 'Gastronomi', en: 'Gastronomy' },
                                                    { key: 'nature', emoji: '🌿', tr: 'Doğa', en: 'Nature' },
                                                    { key: 'party', emoji: '🎉', tr: 'Parti', en: 'Party' },
                                                    { key: 'family', emoji: '👨‍👩‍👧', tr: 'Aile', en: 'Family' },
                                                    { key: 'business', emoji: '💼', tr: 'İş', en: 'Business' },
                                                    { key: 'relax', emoji: '🧘', tr: 'Huzur', en: 'Relaxation' },
                                                    { key: 'shopping', emoji: '🛍️', tr: 'Alışveriş', en: 'Shopping' },
                                                ].map(w => (
                                                    <Chip key={w.key}
                                                        active={(formData.wishlist || []).includes(w.key)}
                                                        onClick={() => {
                                                            const cur = formData.wishlist || []
                                                            update('wishlist', cur.includes(w.key) ? cur.filter(x => x !== w.key) : [...cur, w.key])
                                                        }}>
                                                        {w.emoji} {locale === 'tr' ? w.tr : w.en}
                                                    </Chip>
                                                ))}
                                            </div>
                                        </div>

                                    </motion.div>)}

                                {/* ── STEP 1: Dates ── */}
                                {formStep === 1 && (
                                    <motion.div key="step1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.2 }}>

                                        {/* Dates with integrated flex */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <div className="input-group">
                                                <label>📅 {t('planner.startDate')} <span style={{ color: 'var(--error)', fontSize: '0.75rem' }}>*</span></label>
                                                <input type="date" className="input" value={formData.startDate} onChange={(e) => update('startDate', e.target.value)} required />
                                                {/* Flex options for start date */}
                                                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                                                    {[0, 1, 2, 3].map(flex => (
                                                        <button key={flex} type="button"
                                                            onClick={() => update('flexStart', flex)}
                                                            style={{
                                                                padding: '3px 10px', borderRadius: 8,
                                                                fontSize: '0.66rem', fontWeight: 600,
                                                                border: (formData.flexStart || 0) === flex ? '1.5px solid var(--primary-1)' : '1px solid var(--border)',
                                                                background: (formData.flexStart || 0) === flex ? 'rgba(79,70,229,0.12)' : 'var(--bg-tertiary)',
                                                                color: (formData.flexStart || 0) === flex ? 'var(--primary-1)' : 'var(--text-tertiary)',
                                                                cursor: 'pointer', transition: 'all 150ms',
                                                            }}
                                                        >
                                                            {flex === 0 ? (locale === 'tr' ? 'Kesin' : 'Exact') : `±${flex} ${locale === 'tr' ? 'gün' : 'days'}`}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="input-group">
                                                <label>📅 {t('planner.endDate')} <span style={{ color: 'var(--error)', fontSize: '0.75rem' }}>*</span></label>
                                                <input type="date" className="input" value={formData.endDate} onChange={(e) => update('endDate', e.target.value)} required />
                                                {/* Flex options for end date */}
                                                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                                                    {[0, 1, 2, 3].map(flex => (
                                                        <button key={flex} type="button"
                                                            onClick={() => update('flexEnd', flex)}
                                                            style={{
                                                                padding: '3px 10px', borderRadius: 8,
                                                                fontSize: '0.66rem', fontWeight: 600,
                                                                border: (formData.flexEnd || 0) === flex ? '1.5px solid var(--primary-1)' : '1px solid var(--border)',
                                                                background: (formData.flexEnd || 0) === flex ? 'rgba(79,70,229,0.12)' : 'var(--bg-tertiary)',
                                                                color: (formData.flexEnd || 0) === flex ? 'var(--primary-1)' : 'var(--text-tertiary)',
                                                                cursor: 'pointer', transition: 'all 150ms',
                                                            }}
                                                        >
                                                            {flex === 0 ? (locale === 'tr' ? 'Kesin' : 'Exact') : `±${flex} ${locale === 'tr' ? 'gün' : 'days'}`}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Group Type Selector */}
                                        <div className="input-group" style={{ marginTop: 16 }}>
                                            <label>👥 {locale === 'tr' ? 'Grup Tipi' : 'Group Type'}</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                                                {[
                                                    { id: 'solo', emoji: '🧑', label: locale === 'tr' ? 'Solo' : 'Solo' },
                                                    { id: 'couple', emoji: '💑', label: locale === 'tr' ? 'Çift' : 'Couple' },
                                                    { id: 'friends', emoji: '👫', label: locale === 'tr' ? 'Arkadaşlar' : 'Friends' },
                                                    { id: 'family', emoji: '👨‍👩‍👧‍👦', label: locale === 'tr' ? 'Aile' : 'Family' },
                                                ].map(g => (
                                                    <button key={g.id} type="button"
                                                        onClick={() => update('groupType', g.id)}
                                                        style={{
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                                            padding: '12px 8px', borderRadius: 'var(--radius-md)',
                                                            border: formData.groupType === g.id
                                                                ? '2px solid var(--primary-1)'
                                                                : '1px solid var(--border-primary)',
                                                            background: formData.groupType === g.id
                                                                ? 'rgba(79, 70, 229, 0.1)'
                                                                : 'var(--bg-tertiary)',
                                                            cursor: 'pointer', transition: 'all 150ms',
                                                            color: 'var(--text-primary)', fontSize: '0.8rem',
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '1.5rem' }}>{g.emoji}</span>
                                                        <span style={{ fontWeight: formData.groupType === g.id ? 600 : 400 }}>{g.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Trip duration indicator */}
                                        {tripDays > 0 && (
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                                                background: 'rgba(79, 70, 229, 0.08)', borderRadius: 'var(--radius-md)',
                                                fontSize: '0.875rem', color: 'var(--primary-1)', fontWeight: 500,
                                            }}>
                                                <Calendar size={16} />
                                                <span>{tripDays} {locale === 'tr' ? 'gün' : (tripDays === 1 ? 'day' : 'days')}</span>
                                                {tripDays > 7 && <span style={{ color: 'var(--warning)', fontSize: '0.75rem' }}>⚠️ {locale === 'tr' ? 'Uzun plan' : 'Long plan'}</span>}
                                                {transportLoading && <Loader2 size={14} className="spin" style={{ marginLeft: 'auto' }} />}
                                                {!transportLoading && flightsInfo.length > 0 && (
                                                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        ✈️ {flightsInfo.length} {locale === 'tr' ? 'uçuş bulundu' : 'flights found'}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* ── Departure City (list-only) ── */}
                                        <div className="input-group" style={{ position: 'relative' }}>
                                            <label>🛫 {t('planner.departureCity')}</label>
                                            <input type="text" className="input" placeholder={t('planner.departureCityHint')}
                                                value={formData.departureCity}
                                                onChange={(e) => { update('departureCity', e.target.value); fetchCitySuggestions(e.target.value, setDepSuggestions) }}
                                                autoComplete="off" />
                                            {depSuggestions && depSuggestions.length > 0 && (
                                                <div style={{
                                                    position: 'absolute', top: '100%', left: 0, right: 0,
                                                    marginTop: 4, background: 'var(--bg-secondary)',
                                                    border: '1px solid var(--border-primary)',
                                                    borderRadius: 'var(--radius-md)',
                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                                    zIndex: 50, maxHeight: 200, overflow: 'auto',
                                                }}>
                                                    {depSuggestions.map((s, i) => (
                                                        <button key={i} type="button" onClick={() => {
                                                            update('departureCity', s.name || s.description || s)
                                                            setDepSuggestions([])
                                                        }}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: 8,
                                                                width: '100%', padding: '10px 12px', border: 'none',
                                                                background: 'transparent', cursor: 'pointer',
                                                                color: 'var(--text-primary)', fontSize: '0.875rem',
                                                                textAlign: 'left', transition: 'background 150ms',
                                                            }}
                                                            onMouseOver={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            <Plane size={14} style={{ color: 'var(--primary-1)', flexShrink: 0 }} />
                                                            <span>{s.name || s.description || s}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                                            {/* Time Preference */}
                                            <div className="input-group" style={{ marginBottom: 0 }}>
                                                <label>🕐 {t('planner.preferredTime')}</label>
                                                <select className="input" value={formData.preferredTime} onChange={(e) => update('preferredTime', e.target.value)}>
                                                    <option value="any">{t('time.any')}</option>
                                                    <option value="morning">{t('time.morning')}</option>
                                                    <option value="afternoon">{t('time.afternoon')}</option>
                                                    <option value="evening">{t('time.evening')}</option>
                                                </select>
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

                                    </motion.div>)}

                                {/* ── STEP 2: Style ── */}
                                {formStep === 2 && (
                                    <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.2 }}>

                                        {/* Tempo */}
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

                                    </motion.div>)}

                                {/* ── STEP 3: Preferences ── */}
                                {formStep === 3 && (
                                    <motion.div key="step3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.2 }}>

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
                                    </motion.div>)}
                            </AnimatePresence>

                            {/* Error */}
                            {error && (
                                <div className="form-error">{error}</div>
                            )}

                            {/* Step Navigation */}
                            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                {formStep > 0 && (
                                    <button type="button" className="btn btn-secondary" onClick={() => setFormStep(formStep - 1)} style={{ flex: 1 }}>
                                        ← {locale === 'tr' ? 'Geri' : 'Back'}
                                    </button>
                                )}
                                {formStep < 3 ? (
                                    <button type="button" className="btn btn-primary" onClick={() => setFormStep(formStep + 1)}
                                        disabled={!canProceedStep(formStep)} style={{ flex: 1 }}>
                                        {locale === 'tr' ? 'İleri' : 'Next'} →
                                    </button>
                                ) : (
                                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ flex: 2 }}>
                                        {loading ? (
                                            <><Loader2 size={18} className="spin" /> {t('planner.generating')}</>
                                        ) : (
                                            <><Plane size={18} /> {t('planner.generateBtn')}</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </motion.form>
                    )}

                    {/* ═══════════════════ RESULT ═══════════════════ */}
                    {view === 'result' && itinerary && (
                        <motion.div className="itinerary" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                            {/* ═══ COVER PHOTO HERO ═══ */}
                            {itinerary.coverPhoto ? (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        position: 'relative', borderRadius: 20, overflow: 'hidden',
                                        marginBottom: 20, aspectRatio: '16/7',
                                    }}
                                >
                                    <img src={itinerary.coverPhoto} alt="Trip Cover"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{
                                        position: 'absolute', inset: 0,
                                        background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.7))',
                                        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                                        padding: '24px 28px',
                                    }}>
                                        <h2 style={{ color: 'white', fontSize: '1.6rem', fontWeight: 800, margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                                            {formData.cities.join(' → ')}
                                        </h2>
                                        {formData.startDate && formData.endDate && (
                                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', margin: '4px 0 0', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                                                📅 {formData.startDate} → {formData.endDate}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(129,140,248,0.08), rgba(244,114,182,0.08))',
                                        border: '2px dashed rgba(129,140,248,0.3)',
                                        borderRadius: 16, padding: '20px 24px', marginBottom: 16,
                                        display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
                                    }}
                                    onClick={() => {
                                        // Scroll to CoverGenerator
                                        const el = document.querySelector('.planner-section')
                                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                    }}
                                >
                                    <span style={{ fontSize: '2rem' }}>🎨</span>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                                            {locale === 'tr' ? 'Kapak Fotoğrafı Ekle' : 'Add Cover Photo'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                            {locale === 'tr' ? 'AI ile şehrinize özel kapak oluşturun — referans fotoğrafınızı da ekleyebilirsiniz!' : 'Generate a city-specific cover with AI — you can add your own reference photo too!'}
                                        </div>
                                    </div>
                                    <span style={{ marginLeft: 'auto', fontSize: '1.2rem' }}>→</span>
                                </motion.div>
                            )}

                            {/* Overview */}
                            <div className="result-overview">
                                <h3>📋 {t('planner.overview')}</h3>
                                <p>{itinerary.overview}</p>
                            </div>

                            {/* ═══ AI SUGGESTIONS ═══ */}
                            {itinerary.suggestions?.length > 0 && (
                                <motion.div className="ai-sugg-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                    <div className="ai-sugg-header">
                                        <h3>🤖 {locale === 'tr' ? 'AI Önerileri' : 'AI Suggestions'} <span className="ai-sugg-count">{itinerary.suggestions.length} {locale === 'tr' ? 'yer' : 'places'}</span></h3>
                                        <p className="ai-sugg-desc">{locale === 'tr' ? 'Programınıza eklemek için kartlara tıklayın' : 'Click cards to add to your schedule'}</p>
                                    </div>
                                    <div className="ai-sugg-filters">
                                        {[
                                            { key: 'all', emoji: '✨', label: locale === 'tr' ? 'Hepsi' : 'All' },
                                            { key: 'sightseeing', emoji: '🏛️', label: locale === 'tr' ? 'Gezi' : 'Visit' },
                                            { key: 'food', emoji: '🍽️', label: locale === 'tr' ? 'Yemek' : 'Food' },
                                            { key: 'activity', emoji: '🎯', label: locale === 'tr' ? 'Aktivite' : 'Activity' },
                                            { key: 'shopping', emoji: '🛍️', label: locale === 'tr' ? 'Alışveriş' : 'Shopping' },
                                            { key: 'nightlife', emoji: '🌙', label: locale === 'tr' ? 'Gece' : 'Nightlife' },
                                        ].map(f => (
                                            <button key={f.key} className={`ai-sugg-filter ${suggFilter === f.key ? 'active' : ''}`}
                                                onClick={() => setSuggFilter(f.key)}>{f.emoji} {f.label}</button>
                                        ))}
                                    </div>
                                    <div className="ai-sugg-grid">
                                        {(suggFilter === 'all' ? itinerary.suggestions : itinerary.suggestions.filter(s => s.type === suggFilter)).map((sugg, i) => (
                                            <motion.div key={sugg.id || i} className={`ai-sugg-card ${expandedSugg === i ? 'expanded' : ''}`}
                                                layout onClick={() => setExpandedSugg(expandedSugg === i ? null : i)}
                                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                                                <div className="ai-sugg-card-top">
                                                    <div className="ai-sugg-type-badge">{sugg.type === 'food' ? '🍽️' : sugg.type === 'sightseeing' ? '🏛️' : sugg.type === 'activity' ? '🎯' : sugg.type === 'nightlife' ? '🌙' : sugg.type === 'shopping' ? '🛍️' : '📌'}</div>
                                                    <div className="ai-sugg-card-main">
                                                        <h4 className="ai-sugg-name">{sugg.name}</h4>
                                                        <div className="ai-sugg-meta">
                                                            {sugg.rating && <span className="ai-sugg-rating">⭐ {sugg.rating}</span>}
                                                            {sugg.category && <span className="ai-sugg-category">{sugg.category}</span>}
                                                            {sugg.isHiddenGem && <Badge variant="gem" icon="💎">{locale === 'tr' ? 'Gizli Cevher' : 'Hidden Gem'}</Badge>}
                                                        </div>
                                                    </div>
                                                    {sugg.suggestedDay && <span className="ai-sugg-day">{locale === 'tr' ? 'Gün' : 'Day'} {sugg.suggestedDay}</span>}
                                                </div>
                                                <p className="ai-sugg-summary">{sugg.aiSummary}</p>
                                                <AnimatePresence>
                                                    {expandedSugg === i && (
                                                        <motion.div className="ai-sugg-details" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                                            {sugg.address && <p className="ai-sugg-address"><MapPin size={12} /> {sugg.address}</p>}
                                                            <div className="ai-sugg-info-row">
                                                                {sugg.estimatedDuration && <span>⏱️ {sugg.estimatedDuration}</span>}
                                                                {sugg.estimatedCost && <span>💰 {sugg.estimatedCost}</span>}
                                                                {sugg.bestTimeToVisit && sugg.bestTimeToVisit !== 'any' && <span>🕐 {sugg.bestTimeToVisit === 'morning' ? '☀️ Sabah' : sugg.bestTimeToVisit === 'afternoon' ? '⛅ Öğleden sonra' : '🌙 Akşam'}</span>}
                                                            </div>
                                                            {sugg.tags?.length > 0 && (
                                                                <div className="ai-sugg-tags">
                                                                    {sugg.tags.map(tag => <span key={tag} className="ai-sugg-tag">#{tag}</span>)}
                                                                </div>
                                                            )}
                                                            <div className="ai-sugg-actions">
                                                                {sugg.googleMapsUrl && (
                                                                    <a href={sugg.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="ai-sugg-maps-btn" onClick={e => e.stopPropagation()}>
                                                                        📍 Google Maps
                                                                    </a>
                                                                )}
                                                                {addedSuggs[sugg.id || sugg.name] ? (
                                                                    <span className="ai-sugg-added" onClick={e => e.stopPropagation()}>✅ {locale === 'tr' ? `Gün ${addedSuggs[sugg.id || sugg.name]}` : `Day ${addedSuggs[sugg.id || sugg.name]}`}</span>
                                                                ) : (
                                                                    <div className="ai-sugg-day-picker" onClick={e => e.stopPropagation()}>
                                                                        {itinerary.days?.map((day, di) => (
                                                                            <button key={di}
                                                                                className="ai-sugg-add-btn"
                                                                                onClick={() => addSuggestionToDay(sugg, di)}>
                                                                                ➕ {locale === 'tr' ? `Gün ${di + 1}` : `Day ${di + 1}`}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

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
                                            {eventsInfo.slice(0, 12).map((event, i) => {
                                                const startDate = event.start ? new Date(event.start) : null
                                                const startTime = startDate ? startDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : null
                                                const startDay = startDate ? startDate.getDate() : '?'
                                                const startMonth = startDate ? startDate.toLocaleDateString(locale, { month: 'short' }) : ''
                                                return (
                                                    <div key={event.id || i} className="event-card">
                                                        {/* Poster */}
                                                        {event.poster_url && (
                                                            <div className="event-poster" style={{ backgroundImage: `url(${event.poster_url})` }} />
                                                        )}
                                                        <div className="event-card-left">
                                                            <div className="event-date-badge">
                                                                <span className="event-date-day">{startDay}</span>
                                                                <span className="event-date-month">{startMonth}</span>
                                                            </div>
                                                        </div>
                                                        <div className="event-card-body">
                                                            <h4>{event.emoji || '🎫'} {event.name}</h4>
                                                            <div className="event-meta">
                                                                {event.format && <span className="event-category">{event.format}</span>}
                                                                {event.venue_name && <span>📍 {event.venue_name}</span>}
                                                                {event.district && <span>🏘️ {event.district}</span>}
                                                                {startTime && <span>🕐 {startTime}</span>}
                                                                {event.is_free && <span className="event-free">🆓 {locale === 'tr' ? 'Ücretsiz' : 'Free'}</span>}
                                                            </div>
                                                            {event.description && <p className="event-desc">{event.description.substring(0, 150)}...</p>}
                                                            {event.tags?.length > 0 && (
                                                                <div className="event-tags">{event.tags.slice(0, 4).map((t, ti) => <span key={ti} className="event-tag-chip">#{t}</span>)}</div>
                                                            )}
                                                        </div>
                                                        <div className="event-card-action">
                                                            {event.url ? (
                                                                <a href={event.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">
                                                                    🎟️ {t('events.getTickets')}
                                                                </a>
                                                            ) : (
                                                                <a href={`https://www.google.com/search?q=${encodeURIComponent((event.name || '') + ' ' + (event.venue_name || '') + ' tickets')}`}
                                                                    target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary">
                                                                    🔍 {t('events.search')}
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ═══ TRANSPORT OPTIONS ═══ */}
                            <motion.div className="planner-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                <div className="planner-section-header" style={{ cursor: 'default' }}>
                                    🚀 {t('transport.title')}
                                    {transportLoading && <Loader2 size={14} className="spin" style={{ marginLeft: 8 }} />}
                                </div>
                                <div className="planner-section-body">

                                    {/* Flight Results */}
                                    {flightsInfo.length > 0 && (
                                        <>
                                            <h4 style={{ margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Plane size={16} /> {t('transport.flights')}
                                            </h4>
                                            <div className="flights-list">
                                                {flightsInfo.slice(0, 5).map((flight, i) => (
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
                                                            <a href={`https://www.google.com/travel/flights?q=${encodeURIComponent(`${formData.departureCity} to ${formData.cities[0] || formData.cityInput} ${formData.startDate}`)}`}
                                                                target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary" style={{ marginTop: 8 }}>
                                                                ✈️ {t('flights.book')}
                                                            </a>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {/* Transport Links Grid */}
                                    <div className="transport-links-grid" style={{ marginTop: flightsInfo.length > 0 ? 20 : 0 }}>
                                        {/* Flights link */}
                                        <a href={`https://www.google.com/travel/flights?q=${encodeURIComponent(`${formData.departureCity || ''} to ${formData.cities[0] || formData.cityInput} ${formData.startDate || ''}`)}`}
                                            target="_blank" rel="noopener noreferrer" className="transport-link-card">
                                            <span className="transport-icon">✈️</span>
                                            <span className="transport-name">{t('transport.flights')}</span>
                                            <span className="transport-provider">Google Flights</span>
                                        </a>

                                        {/* Trains */}
                                        <a href={`https://www.trainline.com/search/${encodeURIComponent(formData.departureCity || 'Istanbul')}/${encodeURIComponent(formData.cities[0] || formData.cityInput)}`}
                                            target="_blank" rel="noopener noreferrer" className="transport-link-card">
                                            <span className="transport-icon">🚆</span>
                                            <span className="transport-name">{t('transport.trains')}</span>
                                            <span className="transport-provider">Trainline</span>
                                        </a>

                                        {/* Buses */}
                                        <a href={`https://www.flixbus.com/bus-routes?route=${encodeURIComponent(`${formData.departureCity || 'Istanbul'}-${formData.cities[0] || formData.cityInput}`)}`}
                                            target="_blank" rel="noopener noreferrer" className="transport-link-card">
                                            <span className="transport-icon">🚌</span>
                                            <span className="transport-name">{t('transport.buses')}</span>
                                            <span className="transport-provider">FlixBus / Obilet</span>
                                        </a>

                                        {/* Car Rental */}
                                        <a href={`https://www.kayak.com/cars/${encodeURIComponent(formData.cities[0] || formData.cityInput)}/${formData.startDate || ''}/${formData.endDate || ''}`}
                                            target="_blank" rel="noopener noreferrer" className="transport-link-card">
                                            <span className="transport-icon">🚗</span>
                                            <span className="transport-name">{t('transport.carRental')}</span>
                                            <span className="transport-provider">Kayak</span>
                                        </a>

                                        {/* TCDD (Turkish trains) */}
                                        <a href="https://ebilet.tcddtasimacilik.gov.tr/" target="_blank" rel="noopener noreferrer" className="transport-link-card">
                                            <span className="transport-icon">🚄</span>
                                            <span className="transport-name">TCDD</span>
                                            <span className="transport-provider">{t('transport.turkishTrains')}</span>
                                        </a>

                                        {/* Obilet (Turkish buses) */}
                                        <a href={`https://www.obilet.com/otobus-bileti/${encodeURIComponent(formData.departureCity || 'istanbul')}-${encodeURIComponent(formData.cities[0] || formData.cityInput)}`}
                                            target="_blank" rel="noopener noreferrer" className="transport-link-card">
                                            <span className="transport-icon">🎫</span>
                                            <span className="transport-name">Obilet</span>
                                            <span className="transport-provider">{t('transport.turkishBuses')}</span>
                                        </a>
                                    </div>
                                </div>
                            </motion.div>

                            {/* ═══ ALTERNATIVE DATES ═══ */}
                            {itinerary.alternativeDates?.length > 0 && (
                                <motion.div className="planner-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                                    <div className="planner-section-header" style={{ cursor: 'default' }}>
                                        📆 {t('altDates.title')}
                                    </div>
                                    <div className="planner-section-body">
                                        <div className="alt-dates-grid">
                                            {itinerary.alternativeDates.map((alt, i) => (
                                                <div key={i} className="alt-date-card">
                                                    <span className="alt-date-range">{alt.dates}</span>
                                                    <span className="alt-date-reason">{alt.reason}</span>
                                                    {alt.estimatedSaving && <span className="alt-date-saving">💰 {alt.estimatedSaving}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ═══ TRANSPORT GUIDE ═══ */}
                            {itinerary.transportGuide && (
                                <motion.div className="planner-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
                                    <div className="planner-section-header" style={{ cursor: 'default' }}>
                                        🚇 {locale === 'tr' ? 'Ulaşım Rehberi' : 'Transport Guide'}
                                    </div>
                                    <div className="planner-section-body">
                                        {itinerary.transportGuide.overview && <p style={{ marginBottom: 10, fontSize: '0.82rem' }}>{itinerary.transportGuide.overview}</p>}
                                        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                                            {itinerary.transportGuide.transportCard && (
                                                <div style={{ padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: 10, border: '1px solid var(--border-primary)' }}>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 2 }}>💳 {locale === 'tr' ? 'Ulaşım Kartı' : 'Transport Card'}</div>
                                                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{itinerary.transportGuide.transportCard}</div>
                                                </div>
                                            )}
                                            {itinerary.transportGuide.fromAirport && (
                                                <div style={{ padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: 10, border: '1px solid var(--border-primary)' }}>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 2 }}>✈️ {locale === 'tr' ? 'Havalimanından' : 'From Airport'}</div>
                                                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{itinerary.transportGuide.fromAirport}</div>
                                                </div>
                                            )}
                                            {itinerary.transportGuide.taxiTips && (
                                                <div style={{ padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: 10, border: '1px solid var(--border-primary)' }}>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 2 }}>🚕 {locale === 'tr' ? 'Taksi İpuçları' : 'Taxi Tips'}</div>
                                                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{itinerary.transportGuide.taxiTips}</div>
                                                </div>
                                            )}
                                        </div>
                                        {itinerary.transportGuide.apps?.length > 0 && (
                                            <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {itinerary.transportGuide.apps.map((app, i) => (
                                                    <span key={i} style={{ fontSize: '0.72rem', padding: '3px 10px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary-1)', borderRadius: 20, fontWeight: 600 }}>📱 {app}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* ═══ CHEAP EATS ═══ */}
                            {itinerary.cheapEats?.length > 0 && (
                                <motion.div className="planner-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                                    <div className="planner-section-header" style={{ cursor: 'default' }}>
                                        🍜 {locale === 'tr' ? 'Ucuz & Lezzetli Yerler' : 'Cheap Eats'}
                                    </div>
                                    <div className="planner-section-body">
                                        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                                            {itinerary.cheapEats.map((eat, i) => (
                                                <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: 10, border: '1px solid var(--border-primary)' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 3 }}>{eat.name}</div>
                                                    {eat.dish && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>🍽️ {eat.dish}</div>}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                                        {eat.cost && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10B981' }}>💰 {eat.cost}</span>}
                                                        {eat.area && <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>📍 {eat.area}</span>}
                                                    </div>
                                                    {eat.tip && <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 3, fontStyle: 'italic' }}>💡 {eat.tip}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ═══ TRAVEL HACKS ═══ */}
                            {itinerary.travelHacks?.length > 0 && (
                                <motion.div className="planner-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}>
                                    <div className="planner-section-header" style={{ cursor: 'default' }}>
                                        🧠 {locale === 'tr' ? 'Seyahat Hileleri' : 'Travel Hacks'}
                                    </div>
                                    <div className="planner-section-body">
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {itinerary.travelHacks.map((hack, i) => (
                                                <div key={i} style={{ padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border-primary)', fontSize: '0.8rem', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                                    <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>💡</span>
                                                    <span>{hack}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ═══ AIRBNB LINK ═══ */}
                            <motion.div className="planner-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}>
                                <div className="planner-section-header" style={{ cursor: 'default' }}>
                                    🏠 Airbnb
                                </div>
                                <div className="planner-section-body">
                                    <a href={`https://www.airbnb.com/s/${encodeURIComponent(formData.cities[0] || formData.cityInput)}/homes?checkin=${formData.startDate || ''}&checkout=${formData.endDate || ''}`}
                                        target="_blank" rel="noopener noreferrer" className="transport-link-card" style={{ display: 'flex', gap: 12, alignItems: 'center', textDecoration: 'none' }}>
                                        <span className="transport-icon">🏠</span>
                                        <div>
                                            <span className="transport-name" style={{ display: 'block' }}>{locale === 'tr' ? `${formData.cities[0] || formData.cityInput} Airbnb İlanları` : `Airbnb in ${formData.cities[0] || formData.cityInput}`}</span>
                                            <span className="transport-provider">{locale === 'tr' ? 'Konaklama seçenekleri için tıkla' : 'Click to browse stays'}</span>
                                        </div>
                                    </a>
                                </div>
                            </motion.div>

                            {/* Actions — Space selector + Save */}
                            <div className="plan-save-section">
                                <div className="plan-save-row">
                                    <div className="plan-save-space-picker">
                                        <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 2, display: 'block' }}>
                                            👥 {locale === 'tr' ? 'Kaydet:' : 'Save to:'}
                                        </label>
                                        {userSpaces.length > 0 ? (
                                            <select
                                                className="input"
                                                style={{ fontSize: '0.82rem', padding: '6px 10px', minWidth: 140 }}
                                                value={selectedSpaceId || ''}
                                                onChange={e => setSelectedSpaceId(e.target.value)}
                                            >
                                                {userSpaces.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                                                {locale === 'tr' ? 'Otomatik grup oluşturulacak' : 'Auto-create group'}
                                            </span>
                                        )}
                                    </div>
                                    <button className="btn btn-primary" onClick={saveTrip} disabled={saving}>
                                        <Save size={16} /> {saving ? t('planner.savingTrip') : t('planner.saveTrip')}
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
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

                            {/* ═══ PLAN VOTE & SHARE ═══ */}
                            <div className="plan-vote-section">
                                <div className="plan-vote-row">
                                    <span className="plan-vote-label">{locale === 'tr' ? 'Bu planı nasıl buldun?' : 'How do you like this plan?'}</span>
                                    <div className="plan-vote-btns">
                                        <button className={`plan-vote-btn ${planVote === 'up' ? 'voted-up' : ''}`}
                                            onClick={() => setPlanVote(planVote === 'up' ? null : 'up')}>👍</button>
                                        <button className={`plan-vote-btn ${planVote === 'down' ? 'voted-down' : ''}`}
                                            onClick={() => setPlanVote(planVote === 'down' ? null : 'down')}>👎</button>
                                    </div>
                                    <button className="plan-share-btn" onClick={() => {
                                        const url = window.location.href
                                        navigator.clipboard?.writeText(url)
                                        setShareLink(url)
                                        toast.success(locale === 'tr' ? '📋 Link kopyalandı!' : '📋 Link copied!')
                                    }}>
                                        📤 {locale === 'tr' ? 'Paylaş' : 'Share'}
                                    </button>
                                </div>
                                {planVote === 'down' && (
                                    <p className="plan-vote-hint">
                                        💡 {locale === 'tr' ? '"Yeni Plan" ile farklı tercihlerle tekrar dene!' : 'Try "New Plan" with different preferences!'}
                                    </p>
                                )}
                            </div>

                            {/* Gallery (after saving) */}
                            {savedTripId && (
                                <TripGallery tripId={savedTripId} onCoverChange={(url) => {
                                    setItinerary(prev => ({ ...prev, coverPhoto: url }))
                                }} />
                            )}

                            {/* Cover Image Generator */}
                            <CoverGenerator
                                city={formData.cities.join(', ') || formData.cityInput}
                                startDate={formData.startDate}
                                endDate={formData.endDate}
                                onCoverSelect={(url) => setItinerary(prev => ({ ...prev, coverPhoto: url }))}
                            />

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

                                                {day.items?.map((item, ii) => {
                                                    const isEditing = editingItem?.di === di && editingItem?.ii === ii
                                                    return (
                                                        <div key={ii} className={`itinerary-item ${isEditing ? 'editing' : ''}`}>
                                                            {/* Time — editable */}
                                                            <div className="itinerary-time">
                                                                {isEditing ? (
                                                                    <input type="time" className="edit-time-input" value={item.timeStart || ''}
                                                                        onChange={e => updateItem(di, ii, 'timeStart', e.target.value)} />
                                                                ) : (
                                                                    <span onClick={() => setEditingItem({ di, ii })} style={{ cursor: 'pointer' }}>
                                                                        {item.timeStart}{item.timeEnd ? `–${item.timeEnd}` : ''}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                                    {isEditing ? (
                                                                        <input className="edit-title-input" value={item.title || ''}
                                                                            onChange={e => updateItem(di, ii, 'title', e.target.value)} />
                                                                    ) : (
                                                                        <h4 style={{ margin: 0, cursor: 'pointer' }} onClick={() => setEditingItem({ di, ii })}>{item.title}</h4>
                                                                    )}
                                                                    {item.isHiddenGem && (
                                                                        <Badge variant="gem" icon="💎">
                                                                            {locale === 'tr' ? 'Niş Öneri' : 'Hidden Gem'}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                {item.rating && (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                                                                        <span style={{ color: '#FBBF24' }}>⭐ {item.rating}</span>
                                                                        {item.reviewCount && <span>({item.reviewCount.toLocaleString()} {locale === 'tr' ? 'yorum' : 'reviews'})</span>}
                                                                        {item.googleMapsUrl && (
                                                                            <a href={item.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                                                                                style={{ color: 'var(--primary-1)', textDecoration: 'none', marginLeft: 4 }}>
                                                                                📍 Google Maps
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {isEditing ? (
                                                                    <textarea className="edit-desc-input" value={item.description || ''}
                                                                        onChange={e => updateItem(di, ii, 'description', e.target.value)} rows={2} />
                                                                ) : (
                                                                    <p>{item.description}</p>
                                                                )}
                                                                {item.transportNote && (
                                                                    <p className="transport-note">🚌 {item.transportNote}</p>
                                                                )}
                                                                {item.estimatedCost && (
                                                                    <span className="cost-badge">
                                                                        💰 {item.estimatedCost} {item.isEstimated && t('planner.estimated')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {/* Edit toolbar */}
                                                            <div className="item-edit-actions">
                                                                {isEditing ? (
                                                                    <button className="item-edit-btn done" onClick={() => setEditingItem(null)}>✅</button>
                                                                ) : (
                                                                    <button className="item-edit-btn" onClick={() => setEditingItem({ di, ii })}>✏️</button>
                                                                )}
                                                                <button className="item-edit-btn" onClick={() => moveItem(di, ii, -1)} disabled={ii === 0}>⬆️</button>
                                                                <button className="item-edit-btn" onClick={() => moveItem(di, ii, 1)} disabled={ii === day.items.length - 1}>⬇️</button>
                                                                <button className="item-edit-btn del" onClick={() => deleteItem(di, ii)}>🗑️</button>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
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
                        </motion.div >
                    )
                    }

                    {/* ═══════════════════ SAVED TRIPS ═══════════════════ */}
                    {
                        view === 'trips' && (
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
                        )
                    }
                </div >
            </div >
            <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
        </>
    )
}
