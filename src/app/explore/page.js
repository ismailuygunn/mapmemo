'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import {
    Compass, Plane, Home, Ticket, MapPin, TrendingUp,
    ArrowRight, Star, Sparkles, Globe, Calendar, Heart,
    Sun, Mountain, Waves, Building, TreePine,
} from 'lucide-react'
import { motion } from 'framer-motion'

const HERO_DESTINATIONS = [
    {
        city: 'İstanbul', country: 'Türkiye', emoji: '🌉', image: '/destinations/istanbul.png',
        desc: 'İki kıtanın buluştuğu büyülü şehir', tag: 'Kültür & Tarih', color: '#F59E0B'
    },
    {
        city: 'Kapadokya', country: 'Türkiye', emoji: '🎈', image: '/destinations/cappadocia.png',
        desc: 'Balon turları ve peri bacaları', tag: 'Doğa & Macera', color: '#EC4899'
    },
    {
        city: 'Antalya', country: 'Türkiye', emoji: '🏖️', image: '/destinations/antalya.png',
        desc: 'Turkuaz deniz ve antik kalıntılar', tag: 'Deniz & Güneş', color: '#06B6D4'
    },
]

const QUICK_ACTIONS = [
    { icon: Plane, label: 'Uçuş Ara', desc: '3 kaynaktan en ucuz', href: '/flights', gradient: 'linear-gradient(135deg, #4F46E5, #7C3AED)', emoji: '✈️' },
    { icon: Home, label: 'Konaklama', desc: 'Airbnb ilanları', href: '/airbnb', gradient: 'linear-gradient(135deg, #E11D48, #F43F5E)', emoji: '🏠' },
    { icon: Ticket, label: 'Etkinlikler', desc: 'Konser, festival...', href: '/events', gradient: 'linear-gradient(135deg, #EC4899, #8B5CF6)', emoji: '🎭' },
    { icon: Calendar, label: 'Trip Planla', desc: 'AI destekli planlama', href: '/planner', gradient: 'linear-gradient(135deg, #0D9488, #10B981)', emoji: '📅' },
]

const DESTINATION_CARDS = [
    {
        city: 'Paris', country: 'Fransa', emoji: '🇫🇷', tag: 'Romantik', tagColor: '#EC4899',
        gradient: 'linear-gradient(135deg, #1E1B4B, #312E81)', highlights: ['Eyfel Kulesi', 'Louvre', 'Montmartre']
    },
    {
        city: 'Roma', country: 'İtalya', emoji: '🇮🇹', tag: 'Tarih', tagColor: '#F59E0B',
        gradient: 'linear-gradient(135deg, #78350F, #92400E)', highlights: ['Kolezyum', 'Vatikan', 'Trevi Çeşmesi']
    },
    {
        city: 'Barselona', country: 'İspanya', emoji: '🇪🇸', tag: 'Sanat', tagColor: '#8B5CF6',
        gradient: 'linear-gradient(135deg, #7F1D1D, #991B1B)', highlights: ['Sagrada Familia', 'Park Güell', 'La Rambla']
    },
    {
        city: 'Dubai', country: 'BAE', emoji: '🇦🇪', tag: 'Lüks', tagColor: '#F59E0B',
        gradient: 'linear-gradient(135deg, #1C1917, #44403C)', highlights: ['Burj Khalifa', 'Dubai Mall', 'Çöl Safari']
    },
    {
        city: 'Tiflis', country: 'Gürcistan', emoji: '🇬🇪', tag: 'Vizesiz', tagColor: '#22C55E',
        gradient: 'linear-gradient(135deg, #14532D, #166534)', highlights: ['Eski Şehir', 'Hamam', 'Gürcü Mutfağı']
    },
    {
        city: 'Saraybosna', country: 'Bosna', emoji: '🇧🇦', tag: 'Vizesiz', tagColor: '#22C55E',
        gradient: 'linear-gradient(135deg, #0C4A6E, #075985)', highlights: ['Baščaršija', 'Mostar', 'Doğa Yürüyüşü']
    },
    {
        city: 'Budapeşte', country: 'Macaristan', emoji: '🇭🇺', tag: 'Termal', tagColor: '#06B6D4',
        gradient: 'linear-gradient(135deg, #1E3A5F, #2D4A6F)', highlights: ['Termal Havuzlar', 'Parlamento', 'Tuna']
    },
    {
        city: 'Prag', country: 'Çekya', emoji: '🇨🇿', tag: 'Masalsı', tagColor: '#A855F7',
        gradient: 'linear-gradient(135deg, #3B0764, #581C87)', highlights: ['Eski Şehir', 'Karl Köprüsü', 'Bira']
    },
]

const TRAVEL_MOODS = [
    { icon: Sun, label: 'Deniz & Güneş', emoji: '🏖️', color: '#F59E0B', cities: ['Antalya', 'Bodrum', 'Fethiye', 'Barselona'] },
    { icon: Mountain, label: 'Doğa & Macera', emoji: '🏔️', color: '#22C55E', cities: ['Kapadokya', 'Trabzon', 'Bolu', 'İsviçre'] },
    { icon: Building, label: 'Şehir & Kültür', emoji: '🏛️', color: '#818CF8', cities: ['İstanbul', 'Paris', 'Roma', 'Londra'] },
    { icon: Heart, label: 'Romantik Kaçamak', emoji: '💕', color: '#EC4899', cities: ['Paris', 'Venedik', 'Santorini', 'Prag'] },
    { icon: Waves, label: 'Vizesiz Ucuz', emoji: '✅', color: '#10B981', cities: ['Tiflis', 'Saraybosna', 'Belgrad', 'Üsküp'] },
    { icon: TreePine, label: 'Kış Tatili', emoji: '❄️', color: '#06B6D4', cities: ['Uludağ', 'Viyana', 'Prag', 'Budapeşte'] },
]

const TRAVEL_TIPS = [
    { emoji: '💡', title: 'Erken Rezervasyon', desc: 'Uçak biletlerini 6-8 hafta önceden almak fiyatı %30 düşürür' },
    { emoji: '🛂', title: 'Vizesiz Ülkeler', desc: 'Türk vatandaşları 100+ ülkeye vizesiz veya kapıda vize ile gidebilir' },
    { emoji: '💰', title: 'Bütçe Takibi', desc: 'Günlük harcama limiti belirleyip uygulamada takip edin' },
    { emoji: '📱', title: 'eSIM Kullanın', desc: 'Yurtdışında pahalı roaming yerine eSIM ile internete bağlanın' },
    { emoji: '🏠', title: 'Airbnb vs Otel', desc: 'Uzun konaklamalarda Airbnb, kısa gezilerde otel daha avantajlı' },
    { emoji: '✈️', title: 'Aktarmalı Uçuş', desc: 'Aktarmalı uçuşlarla %40\'a kadar tasarruf edebilirsiniz' },
]

export default function ExplorePage() {
    const router = useRouter()
    const { user, profile } = useAuth()
    const { t } = useLanguage()
    const [heroIdx, setHeroIdx] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => setHeroIdx(i => (i + 1) % HERO_DESTINATIONS.length), 5000)
        return () => clearInterval(interval)
    }, [])

    const hero = HERO_DESTINATIONS[heroIdx]

    const sectionStyle = {
        background: 'var(--bg-secondary)', borderRadius: 20,
        border: '1px solid var(--border)', padding: '24px 28px', marginBottom: 24,
    }

    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-main" style={{ overflowY: 'auto' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 60px' }}>

                    {/* ═══ HERO CAROUSEL ═══ */}
                    <motion.div
                        key={heroIdx}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
                        style={{
                            borderRadius: 24, overflow: 'hidden', marginBottom: 24,
                            position: 'relative', minHeight: 280, cursor: 'pointer',
                        }}
                        onClick={() => router.push('/flights')}>
                        <img src={hero.image} alt={hero.city}
                            style={{ width: '100%', height: 280, objectFit: 'cover' }} />
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.75))',
                            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 32px 28px',
                        }}>
                            <span style={{
                                alignSelf: 'flex-start', background: hero.color, color: 'white',
                                padding: '4px 12px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 700, marginBottom: 8,
                            }}>{hero.tag}</span>
                            <h1 style={{ color: 'white', fontSize: '2.2rem', fontWeight: 900, margin: 0, textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
                                {hero.emoji} {hero.city}
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem', margin: '4px 0 0' }}>{hero.desc}</p>
                            {/* Dots */}
                            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                                {HERO_DESTINATIONS.map((_, i) => (
                                    <button key={i} onClick={e => { e.stopPropagation(); setHeroIdx(i) }}
                                        style={{
                                            width: i === heroIdx ? 24 : 8, height: 8, borderRadius: 4, border: 'none',
                                            background: i === heroIdx ? 'white' : 'rgba(255,255,255,0.4)',
                                            transition: 'all 300ms', cursor: 'pointer',
                                        }} />
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* ═══ QUICK ACTIONS ═══ */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                        {QUICK_ACTIONS.map((action, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => router.push(action.href)}
                                style={{
                                    background: action.gradient, borderRadius: 16, padding: '20px 18px',
                                    cursor: 'pointer', color: 'white', transition: 'all 200ms',
                                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                                }}>
                                <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>{action.emoji}</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>{action.label}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: 2 }}>{action.desc}</div>
                            </motion.div>
                        ))}
                    </div>

                    {/* ═══ TRAVEL MOODS ═══ */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        style={sectionStyle}>
                        <h2 style={{ margin: '0 0 14px', fontSize: '1.1rem', fontWeight: 800 }}>
                            <Sparkles size={18} style={{ color: '#FBBF24', marginRight: 6 }} /> Nasıl Bir Tatil İstiyorsun?
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                            {TRAVEL_MOODS.map((mood, i) => (
                                <motion.div key={i} whileHover={{ scale: 1.03, y: -2 }}
                                    onClick={() => router.push(`/flights`)}
                                    style={{
                                        background: 'var(--bg-primary)', borderRadius: 14,
                                        border: '1px solid var(--border)', padding: '14px',
                                        cursor: 'pointer', transition: 'all 200ms',
                                    }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <span style={{ fontSize: '1.3rem' }}>{mood.emoji}</span>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: mood.color }}>{mood.label}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                        {mood.cities.map((c, ci) => (
                                            <span key={ci} style={{
                                                fontSize: '0.6rem', padding: '2px 6px', borderRadius: 5,
                                                background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', fontWeight: 600,
                                            }}>{c}</span>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* ═══ POPULAR DESTINATIONS ═══ */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <h2 style={{ margin: '0 0 14px', fontSize: '1.1rem', fontWeight: 800 }}>
                            <Globe size={18} style={{ color: '#818CF8', marginRight: 6 }} /> Popüler Destinasyonlar
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, marginBottom: 24 }}>
                            {DESTINATION_CARDS.map((dest, i) => (
                                <motion.div key={i}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.04 }}
                                    whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(0,0,0,0.18)' }}
                                    onClick={() => router.push('/flights')}
                                    style={{
                                        background: dest.gradient, borderRadius: 18, padding: '20px',
                                        cursor: 'pointer', transition: 'all 200ms', color: 'white',
                                        minHeight: 140,
                                    }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>{dest.emoji} {dest.city}</h3>
                                            <p style={{ fontSize: '0.72rem', opacity: 0.7, margin: '2px 0 0' }}>{dest.country}</p>
                                        </div>
                                        <span style={{
                                            fontSize: '0.6rem', padding: '3px 8px', borderRadius: 6,
                                            background: `${dest.tagColor}30`, color: dest.tagColor, fontWeight: 700,
                                        }}>{dest.tag}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 5, marginTop: 14, flexWrap: 'wrap' }}>
                                        {dest.highlights.map((h, hi) => (
                                            <span key={hi} style={{
                                                fontSize: '0.6rem', padding: '3px 8px', borderRadius: 6,
                                                background: 'rgba(255,255,255,0.12)', fontWeight: 600,
                                            }}>📍 {h}</span>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, fontSize: '0.7rem', opacity: 0.7 }}>
                                        Uçuş Ara <ArrowRight size={12} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* ═══ TRAVEL TIPS ═══ */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        style={sectionStyle}>
                        <h2 style={{ margin: '0 0 14px', fontSize: '1.1rem', fontWeight: 800 }}>
                            <TrendingUp size={18} style={{ color: '#10B981', marginRight: 6 }} /> Seyahat İpuçları
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
                            {TRAVEL_TIPS.map((tip, i) => (
                                <motion.div key={i} whileHover={{ x: 4 }}
                                    style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 12,
                                        padding: '14px', borderRadius: 14, background: 'var(--bg-primary)',
                                        border: '1px solid var(--border)',
                                    }}>
                                    <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{tip.emoji}</span>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{tip.title}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>{tip.desc}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    )
}
