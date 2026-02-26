'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSpace } from '@/context/SpaceContext'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { User, MapPin, Heart, Copy, Check, ArrowRight, ArrowLeft, Sparkles, Users, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const STEP_COUNT = 3

export default function OnboardingPage() {
    const [step, setStep] = useState(0) // 0=profile, 1=space, 2=invite
    const [profileData, setProfileData] = useState({
        fullName: '',
        homeCity: '',
        bio: '',
    })
    const [spaceName, setSpaceName] = useState('')
    const [inviteLink, setInviteLink] = useState('')
    const [copied, setCopied] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [profileSaved, setProfileSaved] = useState(false)
    const { createSpace } = useSpace()
    const { user } = useAuth()
    const { t, locale } = useLanguage()
    const router = useRouter()
    const supabase = createClient()

    // Load existing profile data
    useEffect(() => {
        if (!user) return
        loadProfile()
    }, [user])

    const loadProfile = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('full_name, home_city, bio, onboarding_completed')
            .eq('id', user.id)
            .single()

        if (data) {
            setProfileData({
                fullName: data.full_name || '',
                homeCity: data.home_city || '',
                bio: data.bio || '',
            })
            if (data.onboarding_completed) {
                router.push('/map')
            }
        }
    }

    const handleSaveProfile = async () => {
        if (!profileData.fullName.trim()) {
            setError(locale === 'tr' ? 'Ad Soyad zorunlu' : 'Full name is required')
            return
        }
        setLoading(true)
        setError('')
        try {
            console.log('[Onboarding] Saving profile for user:', user.id)
            const { data, error: updateError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: profileData.fullName.trim(),
                    display_name: profileData.fullName.trim(),
                    home_city: profileData.homeCity.trim() || null,
                    bio: profileData.bio.trim() || null,
                }, { onConflict: 'id' })

            console.log('[Onboarding] Upsert result:', { data, error: updateError })
            if (updateError) throw new Error(updateError.message)
            setProfileSaved(true)
            setStep(1)
        } catch (err) {
            console.error('[Onboarding] Profile save error:', err)
            setError(err.message || (locale === 'tr' ? 'Profil kaydedilemedi' : 'Failed to save profile'))
        }
        setLoading(false)
    }

    const handleCreateSpace = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const space = await createSpace(spaceName)
            const link = `${window.location.origin}/invite/${space.invite_token}`
            setInviteLink(link)

            // Mark onboarding complete
            await supabase
                .from('profiles')
                .update({ onboarding_completed: true })
                .eq('id', user.id)

            setStep(2)
        } catch (err) {
            setError(err.message)
        }
        setLoading(false)
    }

    const copyLink = async () => {
        await navigator.clipboard.writeText(inviteLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const updateProfile = (key, value) => {
        setProfileData(prev => ({ ...prev, [key]: value }))
    }

    return (
        <div className="onboarding-container">
            {/* Background decoration */}
            <div style={{
                position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
            }}>
                <div style={{
                    position: 'absolute', top: '-20%', right: '-10%', width: 400, height: 400,
                    borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                }} />
                <div style={{
                    position: 'absolute', bottom: '-20%', left: '-10%', width: 500, height: 500,
                    borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                }} />
            </div>

            <motion.div
                className="auth-card onboarding-card"
                style={{ maxWidth: 480, position: 'relative', zIndex: 1 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Step Progress */}
                <div style={{
                    display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 32,
                }}>
                    {Array.from({ length: STEP_COUNT }).map((_, i) => (
                        <div key={i} style={{
                            width: i === step ? 32 : 12, height: 4,
                            borderRadius: 4,
                            background: i <= step ? 'var(--primary-1)' : 'rgba(255,255,255,0.15)',
                            transition: 'all 300ms ease',
                        }} />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* ── STEP 0: Profile Setup ── */}
                    {step === 0 && (
                        <motion.div
                            key="step0"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: 28 }}>
                                <div style={{
                                    width: 72, height: 72, margin: '0 auto 16px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--primary-1), var(--primary-2))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <User size={32} color="white" />
                                </div>
                                <h1 style={{ color: 'white', fontSize: '1.5rem', marginBottom: 8 }}>
                                    {locale === 'tr' ? 'Profilini Oluştur' : 'Create Your Profile'}
                                </h1>
                                <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
                                    {locale === 'tr'
                                        ? 'Seyahat arkadaşların seni tanısın ✨'
                                        : 'Let your travel buddies get to know you ✨'}
                                </p>
                            </div>

                            {/* Profile Form */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div className="input-group" style={{ textAlign: 'left' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <User size={14} />
                                        {locale === 'tr' ? 'Ad Soyad' : 'Full Name'}
                                        <span style={{ color: '#EF4444', fontSize: '0.75rem' }}>*</span>
                                    </label>
                                    <input
                                        type="text" className="input"
                                        placeholder={locale === 'tr' ? 'Adınız Soyadınız' : 'Your full name'}
                                        value={profileData.fullName}
                                        onChange={(e) => updateProfile('fullName', e.target.value)}
                                        maxLength={60}
                                        autoFocus
                                    />
                                </div>

                                <div className="input-group" style={{ textAlign: 'left' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <MapPin size={14} />
                                        {locale === 'tr' ? 'Yaşadığın Şehir' : 'Home City'}
                                    </label>
                                    <input
                                        type="text" className="input"
                                        placeholder={locale === 'tr' ? 'İstanbul, Türkiye' : 'Istanbul, Turkey'}
                                        value={profileData.homeCity}
                                        onChange={(e) => updateProfile('homeCity', e.target.value)}
                                        maxLength={100}
                                    />
                                </div>

                                <div className="input-group" style={{ textAlign: 'left' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Sparkles size={14} />
                                        {locale === 'tr' ? 'Hakkında' : 'About'}
                                    </label>
                                    <textarea
                                        className="input"
                                        placeholder={locale === 'tr'
                                            ? 'Seyahat tutkunu, fotoğrafçı, gurme... 🌍'
                                            : 'Travel enthusiast, photographer, foodie... 🌍'}
                                        value={profileData.bio}
                                        onChange={(e) => updateProfile('bio', e.target.value)}
                                        maxLength={200}
                                        rows={3}
                                        style={{ resize: 'none' }}
                                    />
                                    <span style={{
                                        fontSize: '0.7rem', color: 'var(--text-tertiary)',
                                        textAlign: 'right', display: 'block', marginTop: 4,
                                    }}>
                                        {profileData.bio.length}/200
                                    </span>
                                </div>
                            </div>

                            {error && (
                                <div style={{
                                    background: 'rgba(239, 68, 68, 0.12)', color: '#F87171',
                                    padding: '10px 14px', borderRadius: 10, fontSize: '0.875rem', marginTop: 12,
                                }}>
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleSaveProfile}
                                className="btn btn-primary btn-lg w-full"
                                disabled={loading || !profileData.fullName.trim()}
                                style={{ marginTop: 20 }}
                            >
                                {loading
                                    ? (locale === 'tr' ? 'Kaydediliyor...' : 'Saving...')
                                    : (locale === 'tr' ? 'Devam Et' : 'Continue')}
                                {!loading && <ArrowRight size={18} />}
                            </button>
                        </motion.div>
                    )}

                    {/* ── STEP 1: Create Space ── */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: 28 }}>
                                <div style={{
                                    width: 72, height: 72, margin: '0 auto 16px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Users size={32} color="white" />
                                </div>
                                <h1 style={{ color: 'white', fontSize: '1.5rem', marginBottom: 8 }}>
                                    {locale === 'tr' ? 'Alanını Oluştur' : 'Create Your Space'}
                                </h1>
                                <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
                                    {locale === 'tr'
                                        ? 'Çift, arkadaş grubu veya aile — herkes bir alan oluşturabilir 🗺️'
                                        : 'Couple, friend group, or family — everyone can create a space 🗺️'}
                                </p>
                            </div>

                            {/* Profile Preview Card */}
                            <div style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 16, padding: '16px 20px',
                                display: 'flex', alignItems: 'center', gap: 14,
                                marginBottom: 24,
                            }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--primary-1), var(--primary-2))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.2rem', flexShrink: 0,
                                }}>
                                    {profileData.fullName.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'white', fontSize: '0.95rem' }}>
                                        {profileData.fullName || 'İsimsiz'}
                                    </div>
                                    {profileData.homeCity && (
                                        <div style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <MapPin size={12} /> {profileData.homeCity}
                                        </div>
                                    )}
                                </div>
                                <Check size={18} style={{ color: '#10B981', marginLeft: 'auto' }} />
                            </div>

                            <form onSubmit={handleCreateSpace}>
                                <div className="input-group" style={{ marginBottom: 20, textAlign: 'left' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Globe size={14} />
                                        {locale === 'tr' ? 'Alan Adı' : 'Space Name'}
                                    </label>
                                    <input
                                        type="text" className="input"
                                        placeholder={locale === 'tr' ? 'Seyahat Grubu, Bizim Maceralar...' : 'Travel Crew, Our Adventures...'}
                                        value={spaceName}
                                        onChange={(e) => setSpaceName(e.target.value)}
                                        required
                                        maxLength={50}
                                        autoFocus
                                    />
                                    <span style={{
                                        fontSize: '0.7rem', color: 'var(--text-tertiary)',
                                        display: 'block', marginTop: 4,
                                    }}>
                                        {locale === 'tr'
                                            ? '💡 Birden fazla kişi katılabilir'
                                            : '💡 Multiple people can join'}
                                    </span>
                                </div>

                                {error && (
                                    <div style={{
                                        background: 'rgba(239, 68, 68, 0.12)', color: '#F87171',
                                        padding: '10px 14px', borderRadius: 10, fontSize: '0.875rem', marginBottom: 16,
                                    }}>
                                        {error}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        type="button" className="btn btn-ghost"
                                        onClick={() => setStep(0)}
                                        style={{ paddingLeft: 12, paddingRight: 12 }}
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-lg"
                                        style={{ flex: 1 }}
                                        disabled={loading}
                                    >
                                        {loading
                                            ? (locale === 'tr' ? 'Oluşturuluyor...' : 'Creating...')
                                            : (locale === 'tr' ? 'Alan Oluştur' : 'Create Space')}
                                        {!loading && <ArrowRight size={18} />}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {/* ── STEP 2: Invite ── */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: 28 }}>
                                <div style={{
                                    width: 72, height: 72, margin: '0 auto 16px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Heart size={32} color="white" fill="white" />
                                </div>
                                <h1 style={{ color: 'white', fontSize: '1.5rem', marginBottom: 8 }}>
                                    {locale === 'tr' ? 'Arkadaşlarını Davet Et! 🎉' : 'Invite Your Friends! 🎉'}
                                </h1>
                                <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
                                    {locale === 'tr'
                                        ? 'Linki paylaş, herkes alanına katılsın. İstediğin kadar kişi ekleyebilirsin!'
                                        : 'Share the link and invite anyone to your space!'}
                                </p>
                            </div>

                            <div style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 12, padding: '12px 16px',
                                display: 'flex', alignItems: 'center', gap: 12,
                                marginBottom: 24,
                            }}>
                                <input
                                    readOnly
                                    value={inviteLink}
                                    style={{
                                        flex: 1, background: 'none', border: 'none',
                                        color: '#CBD5E1', fontSize: '0.8125rem',
                                        outline: 'none', minWidth: 0,
                                    }}
                                />
                                <button
                                    onClick={copyLink}
                                    className="btn btn-sm"
                                    style={{
                                        background: copied ? '#10B981' : 'rgba(255,255,255,0.1)',
                                        color: 'white', border: 'none', flexShrink: 0,
                                    }}
                                >
                                    {copied ? <><Check size={16} /> {locale === 'tr' ? 'Kopyalandı' : 'Copied'}</> : <><Copy size={16} /> {locale === 'tr' ? 'Kopyala' : 'Copy'}</>}
                                </button>
                            </div>

                            <button
                                onClick={() => router.push('/map')}
                                className="btn btn-primary btn-lg w-full"
                            >
                                {locale === 'tr' ? 'Haritaya Git' : 'Go to Map'} <ArrowRight size={18} />
                            </button>

                            <p style={{ color: '#64748B', fontSize: '0.8125rem', marginTop: 16, textAlign: 'center' }}>
                                {locale === 'tr' ? 'Link süresi dolmaz, istediğin zaman paylaşabilirsin' : 'Link never expires'}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}
