'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import {
    MapPin, Users, Clock, Star, Navigation, Lightbulb, Gift,
    MessageCircle, ChevronDown, ChevronUp, AlertTriangle,
    Target, Trophy, Share2, ExternalLink, DollarSign, Sparkles,
    Copy, Check
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const SCENARIO_META = {
    anniversary: { emoji: '💕', title: 'Yıldönümü Kurtarma', color: '#E11D48', gradient: 'linear-gradient(135deg, #E11D48, #9333EA)' },
    birthday: { emoji: '🎂', title: 'Doğum Günü Planı', color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)' },
    friends: { emoji: '🔥', title: 'Arkadaşlar Gecesi', color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6, #3B82F6)' },
    apology: { emoji: '💐', title: 'Gönül Alma Planı', color: '#10B981', gradient: 'linear-gradient(135deg, #10B981, #3B82F6)' },
    mood: { emoji: '🌈', title: 'Moral Yükseltme', color: '#06B6D4', gradient: 'linear-gradient(135deg, #06B6D4, #10B981)' },
    graduation: { emoji: '🎓', title: 'Mezuniyet Kutlaması', color: '#0F2847', gradient: 'linear-gradient(135deg, #0F2847, #D4A853)' },
    proposal: { emoji: '💍', title: 'Evlilik Teklifi', color: '#D4A853', gradient: 'linear-gradient(135deg, #D4A853, #0F2847)' },
    business: { emoji: '🏢', title: 'İş Toplantısı', color: '#1E293B', gradient: 'linear-gradient(135deg, #1E293B, #475569)' },
}

export default function SharedPlanPage() {
    const { id } = useParams()
    const supabase = createClient()
    const [plan, setPlan] = useState(null)
    const [meta, setMeta] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [expandedStep, setExpandedStep] = useState(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        const load = async () => {
            const { data, error: err } = await supabase
                .from('trips')
                .select('*')
                .eq('id', id)
                .single()
            if (err || !data) { setError('Plan bulunamadı'); setLoading(false); return }
            const itinerary = data.itinerary_data || {}
            setPlan(itinerary)
            setMeta(itinerary._sosMetadata || { scenario: data.tempo, city: data.city })
            setLoading(false)
        }
        load()
    }, [id])

    const scenario = meta ? (SCENARIO_META[meta.scenario] || SCENARIO_META.friends) : null

    const handleShare = async () => {
        const url = window.location.href
        if (navigator.share) {
            await navigator.share({ title: plan?.planTitle || 'SOS Plan', url })
        } else {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <Sparkles size={32} style={{ color: 'var(--primary-2)' }} />
            </motion.div>
        </div>
    )

    if (error) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: '3rem' }}>🚫</div>
            <h2>{error}</h2>
            <a href="/" style={{ color: 'var(--primary-2)', textDecoration: 'none', fontWeight: 600 }}>Ana Sayfaya Dön</a>
        </div>
    )

    if (!plan || !scenario) return null

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            {/* UMAE BRANDED HERO */}
            <div style={{
                background: 'linear-gradient(135deg, #0F2847 0%, #1A3A5C 50%, #D4A853 100%)',
                padding: '32px 16px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden',
            }}>
                <motion.span animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }}
                    style={{ position: 'absolute', top: 20, right: 40, fontSize: '2rem', opacity: 0.15 }}>🚨</motion.span>
                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 5 }}
                    style={{ position: 'absolute', bottom: 20, left: 40, fontSize: '1.5rem', opacity: 0.1 }}>⚡</motion.span>

                <Image src="/umae-icon.png" alt="UMAE" width={48} height={48} style={{ borderRadius: 14, marginBottom: 12 }} />
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 6 }}>UMAE SOS PLAN</div>
                <h1 style={{ color: 'white', fontSize: '1.6rem', fontWeight: 900, marginBottom: 8, letterSpacing: '-0.02em' }}>
                    {plan.planEmoji} {plan.planTitle}
                </h1>
                {plan.vibeDescription && (
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', maxWidth: 500, margin: '0 auto 16px' }}>{plan.vibeDescription}</p>
                )}

                {/* Meta badges */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <span style={badgeStyle}>📍 {meta.city}{meta.district ? ` · ${meta.district}` : ''}</span>
                    <span style={badgeStyle}>👥 {meta.peopleCount || 2} kişi</span>
                    {meta.startTime && <span style={badgeStyle}>🕐 {meta.startTime} - {meta.endTime || '23:00'}</span>}
                    <span style={badgeStyle}>{scenario.emoji} {scenario.title}</span>
                </div>

                {/* Share Button */}
                <button onClick={handleShare} style={{
                    marginTop: 16, padding: '10px 20px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.2)', color: 'white',
                    cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                    {copied ? <><Check size={14} /> Kopyalandı!</> : <><Share2 size={14} /> Paylaş</>}
                </button>
            </div>

            {/* CONTENT */}
            <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
                {/* Urgency Note */}
                {plan.urgencyNote && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            padding: '14px 16px', borderRadius: 14, marginBottom: 24,
                            background: 'var(--warning-bg)', border: '1px solid var(--warning)',
                        }}>
                        <AlertTriangle size={18} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500 }}>⚡ <strong>Hemen yap:</strong> {plan.urgencyNote}</div>
                    </motion.div>
                )}

                {/* Timeline */}
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={18} style={{ color: scenario.color }} /> Saat Saat Plan
                </h2>
                <div style={{ borderLeft: `3px solid var(--primary-2)`, paddingLeft: 20, marginLeft: 8, marginBottom: 32 }}>
                    {(plan.steps || []).map((step, i) => {
                        const isExpanded = expandedStep === i
                        return (
                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08 }}
                                style={{
                                    marginBottom: 12, borderRadius: 16,
                                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                    overflow: 'hidden', position: 'relative',
                                }}>
                                <div style={{
                                    position: 'absolute', left: -16, top: 22, width: 10, height: 10,
                                    borderRadius: '50%', background: scenario.color,
                                    border: '2px solid var(--bg-primary)', zIndex: 2,
                                }} />
                                <button onClick={() => setExpandedStep(isExpanded ? null : i)}
                                    style={{ width: '100%', padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', textAlign: 'left', color: 'inherit' }}>
                                    <div style={{
                                        minWidth: 50, padding: '6px 0', textAlign: 'center', borderRadius: 10,
                                        background: `${scenario.color}15`, color: scenario.color, fontWeight: 700, fontSize: '0.82rem',
                                    }}>{step.time}</div>
                                    <div style={{
                                        width: 38, height: 38, borderRadius: 12, background: scenario.gradient,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0,
                                    }}>{step.emoji}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{step.title || step.action}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                            {step.placeName} {step.duration ? `· ${step.duration}` : ''}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: scenario.color, fontWeight: 600 }}>{step.estimatedCost}</div>
                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                            <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                                                <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-secondary)', margin: '12px 0' }}>{step.detail}</p>
                                                {step.placeRating && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                        <Star size={14} style={{ color: '#F59E0B' }} />
                                                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{step.placeRating} ({step.placeReviews} yorum)</span>
                                                        {step.address && <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>· {step.address}</span>}
                                                    </div>
                                                )}
                                                {step.proTip && (
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 10, background: `${scenario.color}10`, marginBottom: 8 }}>
                                                        <Lightbulb size={14} style={{ color: scenario.color, flexShrink: 0, marginTop: 2 }} />
                                                        <span style={{ fontSize: '0.82rem', color: scenario.color, fontWeight: 500 }}>{step.proTip}</span>
                                                    </div>
                                                )}
                                                {step.transport && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-tertiary)' }}><Navigation size={12} /> {step.transport}</div>}
                                                {step.placeName && (
                                                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(step.placeName + ' ' + (meta.city || ''))}`}
                                                        target="_blank" rel="noopener noreferrer"
                                                        style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
                                                            padding: '6px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
                                                            background: `${scenario.color}15`, color: scenario.color,
                                                            textDecoration: 'none', border: `1px solid ${scenario.color}30`,
                                                        }}>
                                                        <ExternalLink size={12} /> Haritada Aç
                                                    </a>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Plan B */}
                {plan.planB && (
                    <div style={{ padding: 16, borderRadius: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border)', marginBottom: 20 }}>
                        <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 8 }}>🔄 {plan.planB.title || 'B Planı'}</h3>
                        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{plan.planB.description}</p>
                        {plan.planB.steps?.map((s, i) => <div key={i} style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', padding: '2px 0 2px 12px' }}>• {s}</div>)}
                    </div>
                )}

                {/* Bottom Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    {plan.whatToWear && (
                        <div style={{ padding: 16, borderRadius: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 6 }}>👔 Kıyafet</div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{plan.whatToWear}</p>
                        </div>
                    )}
                    {plan.playlistVibe && (
                        <div style={{ padding: 16, borderRadius: 16, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 6 }}>🎵 Müzik</div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{plan.playlistVibe}</p>
                        </div>
                    )}
                </div>

                {/* Budget */}
                {plan.totalBudget && (
                    <div style={{ padding: 16, borderRadius: 16, background: `${scenario.color}08`, border: `1px solid ${scenario.color}20`, marginBottom: 20, textAlign: 'center' }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: 4 }}>Tahmini Toplam Bütçe</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: scenario.color }}>{plan.totalBudget.perPerson}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>kişi başı</div>
                    </div>
                )}

                {/* Footer */}
                <div style={{ textAlign: 'center', padding: '24px 0 48px', borderTop: '1px solid var(--border)', marginTop: 24 }}>
                    <Image src="/umae-icon.png" alt="UMAE" width={32} height={32} style={{ borderRadius: 10, marginBottom: 8 }} />
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>Powered by UMAE SOS Plan</div>
                    <a href="/meetups" style={{
                        display: 'inline-block', marginTop: 12, padding: '10px 20px', borderRadius: 10,
                        background: 'linear-gradient(135deg, #0F2847, #D4A853)', color: 'white',
                        textDecoration: 'none', fontWeight: 600, fontSize: '0.84rem',
                    }}>Kendi SOS Planını Oluştur</a>
                </div>
            </div>
        </div>
    )
}

const badgeStyle = {
    padding: '5px 12px', borderRadius: 20, fontSize: '0.76rem', fontWeight: 600,
    background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(4px)',
}
