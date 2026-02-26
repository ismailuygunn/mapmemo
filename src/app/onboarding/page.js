'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { User, MapPin, Sparkles, ArrowRight, Loader2, Plane } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function OnboardingPage() {
    const [fullName, setFullName] = useState('')
    const [homeCity, setHomeCity] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [checkingProfile, setCheckingProfile] = useState(true)

    const { user } = useAuth()
    const { locale } = useLanguage()
    const router = useRouter()
    const supabase = createClient()
    const t = (tr, en) => locale === 'tr' ? tr : en

    // Check if user already has a profile → skip onboarding
    useEffect(() => {
        if (!user) return
        checkExisting()
    }, [user])

    const checkExisting = async () => {
        setCheckingProfile(true)
        try {
            // Check if profile exists and onboarding is completed
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, onboarding_completed')
                .eq('id', user.id)
                .maybeSingle()

            if (profile?.onboarding_completed) {
                router.replace('/map')
                return
            }
            // Pre-fill name from existing profile or auth metadata
            if (profile?.full_name) {
                setFullName(profile.full_name)
            } else if (user.user_metadata?.full_name) {
                setFullName(user.user_metadata.full_name)
            } else if (user.email) {
                setFullName(user.email.split('@')[0])
            }
        } catch (err) {
            console.warn('Profile check failed:', err)
        }
        setCheckingProfile(false)
    }

    const handleComplete = async () => {
        if (!fullName.trim()) {
            setError(t('Ad Soyad zorunlu', 'Full name is required'))
            return
        }
        setLoading(true)
        setError('')

        try {
            // Step 1: Save/update profile
            console.log('[Onboarding] Saving profile...')
            const profilePayload = {
                id: user.id,
                full_name: fullName.trim(),
                display_name: fullName.trim(),
                email: user.email,
            }
            if (homeCity.trim()) profilePayload.home_city = homeCity.trim()

            const { error: profileError } = await supabase
                .from('profiles')
                .upsert(profilePayload, { onConflict: 'id' })

            if (profileError) {
                console.error('[Onboarding] Profile save error:', profileError)
                // Try raw update if upsert fails
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        full_name: fullName.trim(),
                        display_name: fullName.trim(),
                    })
                    .eq('id', user.id)

                if (updateError) {
                    console.error('[Onboarding] Update also failed:', updateError)
                    // Last resort: try insert
                    await supabase.from('profiles').insert(profilePayload)
                }
            }

            // Step 2: Check if user already has a space
            console.log('[Onboarding] Checking spaces...')
            const { data: existingMembership } = await supabase
                .from('space_members')
                .select('space_id')
                .eq('user_id', user.id)
                .limit(1)
                .maybeSingle()

            if (!existingMembership) {
                // Auto-create a default space
                console.log('[Onboarding] Creating default space...')
                const inviteToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
                    .map(b => b.toString(16).padStart(2, '0')).join('')

                const { data: newSpace, error: spaceError } = await supabase
                    .from('spaces')
                    .insert({
                        name: t(`${fullName.trim()} Seyahatleri`, `${fullName.trim()}'s Trips`),
                        created_by: user.id,
                        invite_token: inviteToken,
                    })
                    .select()
                    .single()

                if (spaceError) {
                    console.error('[Onboarding] Space creation failed:', spaceError)
                    // Not fatal — user can create space later
                } else {
                    // Add user as owner
                    const { error: memberError } = await supabase
                        .from('space_members')
                        .insert({ space_id: newSpace.id, user_id: user.id, role: 'owner' })

                    if (memberError) {
                        console.error('[Onboarding] Member insert failed:', memberError)
                    }
                }
            }

            // Step 3: Mark onboarding completed
            await supabase
                .from('profiles')
                .update({ onboarding_completed: true })
                .eq('id', user.id)

            console.log('[Onboarding] Complete! Redirecting...')
            toast.success(t('Hoş geldin! 🎉', 'Welcome! 🎉'))

            // Force page reload to refresh SpaceContext
            window.location.href = '/map'
        } catch (err) {
            console.error('[Onboarding] Error:', err)
            setError(err.message || t('Bir hata oluştu', 'Something went wrong'))
            setLoading(false)
        }
    }

    // Skip directly button
    const handleSkip = () => {
        window.location.href = '/map'
    }

    if (checkingProfile) {
        return (
            <div className="onboarding-container">
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            </div>
        )
    }

    return (
        <div className="onboarding-container">
            {/* Background */}
            <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
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
                style={{ maxWidth: 440, position: 'relative', zIndex: 1 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div style={{
                        width: 72, height: 72, margin: '0 auto 16px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary-1), #EC4899)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Plane size={32} color="white" />
                    </div>
                    <h1 style={{ color: 'white', fontSize: '1.5rem', marginBottom: 8 }}>
                        {t('MapMemo\'ya Hoş Geldin! ✈️', 'Welcome to MapMemo! ✈️')}
                    </h1>
                    <p style={{ color: '#94A3B8', fontSize: '0.88rem', lineHeight: 1.5 }}>
                        {t(
                            'Seyahatlerini planla, haritana kaydet, arkadaşlarınla paylaş',
                            'Plan trips, save to your map, share with friends'
                        )}
                    </p>
                </div>

                {/* Simple Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="input-group" style={{ textAlign: 'left' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <User size={14} /> {t('Ad Soyad', 'Full Name')}
                            <span style={{ color: '#EF4444', fontSize: '0.75rem' }}>*</span>
                        </label>
                        <input
                            type="text" className="input"
                            placeholder={t('Adınız Soyadınız', 'Your full name')}
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            maxLength={60}
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && handleComplete()}
                        />
                    </div>

                    <div className="input-group" style={{ textAlign: 'left' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <MapPin size={14} /> {t('Yaşadığın Şehir', 'Home City')}
                        </label>
                        <input
                            type="text" className="input"
                            placeholder={t('İstanbul, Türkiye', 'Istanbul, Turkey')}
                            value={homeCity}
                            onChange={(e) => setHomeCity(e.target.value)}
                            maxLength={100}
                            onKeyDown={e => e.key === 'Enter' && handleComplete()}
                        />
                    </div>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.12)', color: '#F87171',
                        padding: '10px 14px', borderRadius: 10, fontSize: '0.85rem', marginTop: 12,
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <button
                    onClick={handleComplete}
                    className="btn btn-primary btn-lg w-full"
                    disabled={loading || !fullName.trim()}
                    style={{ marginTop: 20 }}
                >
                    {loading ? (
                        <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> {t('Hazırlanıyor...', 'Setting up...')}</>
                    ) : (
                        <>{t('Başla', 'Get Started')} <ArrowRight size={18} /></>
                    )}
                </button>

                <button
                    onClick={handleSkip}
                    style={{
                        marginTop: 10, width: '100%', background: 'none', border: 'none',
                        color: '#64748B', fontSize: '0.78rem', cursor: 'pointer', padding: '8px',
                    }}
                >
                    {t('Şimdilik atla →', 'Skip for now →')}
                </button>

                <p style={{
                    color: '#475569', fontSize: '0.7rem', textAlign: 'center', marginTop: 12, lineHeight: 1.4,
                }}>
                    {t(
                        '💡 Otomatik olarak bir seyahat grubu oluşturulacak. Daha sonra gruplardan arkadaşlarını davet edebilirsin.',
                        '💡 A travel group will be auto-created. You can invite friends later from Groups.'
                    )}
                </p>
            </motion.div>
        </div>
    )
}
