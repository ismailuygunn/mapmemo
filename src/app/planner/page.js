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
import { useToast } from '@/context/ToastContext'
import { Badge, InfoTooltip } from '@/components/ui'
import { openAlbumForPrint } from '@/lib/albumGenerator'
import TripGallery from '@/components/planner/TripGallery'
import CoverGenerator from '@/components/planner/CoverGenerator'
import { WeatherSection, EventsSection, TransportSection, ExtraSections, BottomSections, DayItem } from '@/components/planner/ItineraryView'

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
    const { toast } = useToast()
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
        try {
            let query = supabase.from('trips').select('*')
            if (space) query = query.eq('space_id', space.id)
            else if (user) query = query.eq('created_by', user.id)
            else return
            const { data, error } = await query.order('created_at', { ascending: false })
            if (error) { console.warn('Trips table may not exist:', error.message); return }
            if (data) setSavedTrips(data)
        } catch (e) {
            console.warn('Could not load trips:', e.message)
        }
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
        setLoadingStep(locale === 'tr' ? '⚡ Veriler yükleniyor...' : '⚡ Loading data...')
        try {
            // ═══ PARALLEL FETCH: pins + weather + events at the same time (3x faster) ═══
            const [pinsResult, weatherResult, eventsResult] = await Promise.allSettled([
                // Pins
                (async () => {
                    if (!space) return []
                    const { data } = await supabase
                        .from('pins')
                        .select('title, type, status, rating, notes, lat, lng')
                        .eq('space_id', space.id)
                    return (data || []).filter(p =>
                        cities.some(c => p.city?.toLowerCase().includes(c.toLowerCase()))
                    )
                })(),
                // Weather
                fetch(`/api/weather?city=${encodeURIComponent(cities[0])}&lang=${locale}`)
                    .then(r => r.json()).catch(() => null),
                // Events
                (async () => {
                    const qs = new URLSearchParams({ city: cities[0] })
                    if (formData.startDate) qs.append('start', formData.startDate)
                    if (formData.endDate) qs.append('end', formData.endDate)
                    return fetch(`/api/events?${qs}`).then(r => r.json())
                })().catch(() => ({ events: [] })),
            ])

            const existingPins = pinsResult.status === 'fulfilled' ? pinsResult.value : []
            const weatherData = weatherResult.status === 'fulfilled' ? weatherResult.value : null
            const eventsJson = eventsResult.status === 'fulfilled' ? eventsResult.value : { events: [] }
            const eventsData = eventsJson?.events || []

            if (weatherData?.available) setWeatherInfo(weatherData)
            if (eventsData.length > 0) setEventsInfo(eventsData)
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
            toast.error(err.message || (locale === 'tr' ? 'Plan oluşturulamadı' : 'Failed to generate plan'))
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
            toast.success(locale === 'tr' ? '💾 Plan kaydedildi!' : '💾 Plan saved!')
        } catch (err) {
            setError(err.message)
            toast.error(err.message || (locale === 'tr' ? 'Kayıt başarısız' : 'Save failed'))
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
                    {/* Premium Hero Header */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                            borderRadius: 24, overflow: 'hidden', marginBottom: 24,
                            position: 'relative', minHeight: 180,
                            background: 'linear-gradient(135deg, #4F46E5, #7C3AED, #A855F7)',
                        }}>
                        {/* Floating decorations */}
                        <motion.span animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                            style={{ position: 'absolute', top: 20, right: 30, fontSize: '2.5rem', opacity: 0.3 }}>🌍</motion.span>
                        <motion.span animate={{ y: [0, 8, 0], x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                            style={{ position: 'absolute', bottom: 20, right: 80, fontSize: '1.8rem', opacity: 0.2 }}>✈️</motion.span>
                        <motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                            style={{ position: 'absolute', top: 30, right: 140, fontSize: '1.5rem', opacity: 0.15 }}>🗺️</motion.span>
                        <div style={{
                            position: 'relative', zIndex: 1,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '28px 36px', flexWrap: 'wrap', gap: 16,
                        }}>
                            <div>
                                <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                                    ✈️ {t('planner.title')}
                                </h1>
                                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.92rem', margin: '6px 0 0' }}>
                                    {view === 'result' ? (locale === 'tr' ? '🎉 Planınız hazır! Aşağıda düzenleyebilirsiniz.' : '🎉 Your plan is ready! Edit below.')
                                        : view === 'trips' ? (locale === 'tr' ? '📁 Kayıtlı seyahat planlarınız' : '📁 Your saved travel plans')
                                            : t('planner.subtitle')}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    type="button" onClick={() => { setView('form'); setItinerary(null); setFormStep(0) }}
                                    style={{
                                        padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                        background: view !== 'trips' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                                        color: 'white', fontSize: '0.85rem', fontWeight: 700,
                                        backdropFilter: 'blur(8px)',
                                        display: 'flex', alignItems: 'center', gap: 6,
                                    }}>
                                    <Plane size={16} /> {t('planner.newPlan')}
                                </motion.button>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    type="button" onClick={() => setView('trips')}
                                    style={{
                                        padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                        background: view === 'trips' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                                        color: 'white', fontSize: '0.85rem', fontWeight: 700,
                                        backdropFilter: 'blur(8px)',
                                        display: 'flex', alignItems: 'center', gap: 6,
                                    }}>
                                    <Save size={16} /> {savedTrips.length > 0 ? `${savedTrips.length} ${locale === 'tr' ? 'plan' : 'plans'}` : (locale === 'tr' ? 'Seyahatlerim' : 'My Trips')}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>

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

                            {/* Trip Preview — shows on last step before generate */}
                            {formStep === 3 && formData.cities.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        marginTop: 16, padding: '16px 20px', borderRadius: 16,
                                        background: 'linear-gradient(135deg, rgba(79,70,229,0.06), rgba(168,85,247,0.04))',
                                        border: '1px solid rgba(79,70,229,0.15)',
                                    }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-1)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        ✨ {locale === 'tr' ? 'Seyahat Özeti' : 'Trip Preview'}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
                                        <div>
                                            <div style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>📍 {locale === 'tr' ? 'Rota' : 'Route'}</div>
                                            <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{formData.cities.join(' → ')}</div>
                                        </div>
                                        {formData.startDate && formData.endDate && (
                                            <div>
                                                <div style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>📅 {locale === 'tr' ? 'Tarih' : 'Dates'}</div>
                                                <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                                                    {new Date(formData.startDate + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - {new Date(formData.endDate + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                    <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', fontWeight: 500 }}> ({tripDays} {locale === 'tr' ? 'gün' : 'days'})</span>
                                                </div>
                                            </div>
                                        )}
                                        <div>
                                            <div style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>👥 {locale === 'tr' ? 'Grup' : 'Group'}</div>
                                            <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                                                {formData.groupType === 'solo' ? '🧑 Solo' : formData.groupType === 'couple' ? '💑 Çift' : formData.groupType === 'friends' ? '👫 Arkadaşlar' : '👨‍👩‍👧‍👦 Aile'}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>⚡ {locale === 'tr' ? 'Tempo' : 'Tempo'}</div>
                                            <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                                                {formData.tempo === 'slow' ? '🐢 Sakin' : formData.tempo === 'moderate' ? '🚶 Dengeli' : '🏃 Yoğun'}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
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

                            {/* Trip Stats Summary */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                style={{
                                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                                    gap: 10, marginBottom: 16,
                                }}>
                                {[
                                    { icon: '📍', label: locale === 'tr' ? 'Şehirler' : 'Cities', value: formData.cities.join(' → ') || '—', color: '#4F46E5' },
                                    { icon: '📅', label: locale === 'tr' ? 'Tarih' : 'Dates', value: formData.startDate && formData.endDate ? `${new Date(formData.startDate + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${new Date(formData.endDate + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}` : '—', color: '#EC4899' },
                                    { icon: '🗓️', label: locale === 'tr' ? 'Süre' : 'Duration', value: `${itinerary.days?.length || tripDays} ${locale === 'tr' ? 'gün' : 'days'}`, color: '#10B981' },
                                    { icon: '💰', label: locale === 'tr' ? 'Bütçe' : 'Budget', value: formData.budget === 'budget' ? '💵' : formData.budget === 'moderate' ? '💵💵' : '💵💵💵', color: '#F59E0B' },
                                ].map((stat, si) => (
                                    <div key={si} style={{
                                        background: 'var(--bg-secondary)', borderRadius: 14,
                                        border: '1px solid var(--border)', padding: '12px 14px',
                                        borderLeft: `3px solid ${stat.color}`,
                                    }}>
                                        <div style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 2 }}>{stat.icon} {stat.label}</div>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</div>
                                    </div>
                                ))}
                            </motion.div>

                            {/* Overview */}
                            <div className="result-overview" style={{
                                background: 'linear-gradient(135deg, rgba(79,70,229,0.04), rgba(168,85,247,0.04))',
                                border: '1px solid rgba(79,70,229,0.15)',
                                borderRadius: 16, padding: '20px 24px', marginBottom: 20,
                            }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    📋 {t('planner.overview')}
                                    {itinerary.tripTitle && <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>— {itinerary.tripTitle}</span>}
                                </h3>
                                <p style={{ lineHeight: 1.7, fontSize: '0.88rem' }}>{itinerary.overview}</p>
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

                            <WeatherSection weatherInfo={weatherInfo} locale={locale} t={t} />

                            <EventsSection eventsInfo={eventsInfo} locale={locale} t={t} />

                            <TransportSection flightsInfo={flightsInfo} transportLoading={transportLoading} formData={formData} locale={locale} t={t} />
                            <ExtraSections itinerary={itinerary} locale={locale} formData={formData} />

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

                                                {day.items?.map((item, ii) => (
                                                    <DayItem key={ii} item={item} di={di} ii={ii}
                                                        dayLen={day.items.length}
                                                        isEditing={editingItem?.di === di && editingItem?.ii === ii}
                                                        onEdit={setEditingItem} onUpdate={updateItem}
                                                        onDelete={deleteItem} onMove={moveItem} locale={locale} />
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}

                            <BottomSections itinerary={itinerary} formData={formData} locale={locale} t={t} showRainPlan={showRainPlan} />
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
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                                        {savedTrips.map((trip, i) => (
                                            <motion.div key={trip.id}
                                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.15)' }}
                                                onClick={() => {
                                                    setItinerary(trip.itinerary_data)
                                                    setFormData(prev => ({ ...prev, cities: trip.city.split(' → ') }))
                                                    setView('result'); setExpandedDay(0)
                                                }}
                                                style={{
                                                    cursor: 'pointer', borderRadius: 20, overflow: 'hidden',
                                                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                                    transition: 'all 200ms',
                                                }}>
                                                {/* Cover image */}
                                                {trip.cover_photo_url && (
                                                    <div style={{
                                                        height: 120, backgroundImage: `url(${trip.cover_photo_url})`,
                                                        backgroundSize: 'cover', backgroundPosition: 'center',
                                                    }} />
                                                )}
                                                {!trip.cover_photo_url && (
                                                    <div style={{
                                                        height: 80,
                                                        background: `linear-gradient(135deg, ${['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'][i % 6]}, ${['#7C3AED', '#EC4899', '#F43F5E', '#EF4444', '#06B6D4', '#8B5CF6'][i % 6]})`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        <Plane size={28} style={{ color: 'rgba(255,255,255,0.5)' }} />
                                                    </div>
                                                )}
                                                <div style={{ padding: '16px 18px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                        <MapPin size={14} style={{ color: 'var(--primary-1)' }} />
                                                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>{trip.city}</h4>
                                                    </div>
                                                    {trip.start_date && (
                                                        <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: '0 0 8px' }}>
                                                            📅 {new Date(trip.start_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                            {trip.end_date ? ` → ${new Date(trip.end_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}` : ''}
                                                        </p>
                                                    )}
                                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                        {trip.tempo && <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: 8, background: 'rgba(79,70,229,0.1)', color: '#4F46E5', fontWeight: 700 }}>{trip.tempo}</span>}
                                                        {trip.budget && <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: 8, background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontWeight: 700 }}>{trip.budget}</span>}
                                                        {trip.itinerary_data?.days && <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: '#10B981', fontWeight: 700 }}>{trip.itinerary_data.days.length} gün</span>}
                                                    </div>
                                                    <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', margin: '8px 0 0', opacity: 0.7 }}>
                                                        {new Date(trip.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} tarihinde oluşturuldu
                                                    </p>
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
