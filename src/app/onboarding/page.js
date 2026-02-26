'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSpace } from '@/context/SpaceContext'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { Heart, Copy, Check, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

export default function OnboardingPage() {
    const [step, setStep] = useState(1)
    const [spaceName, setSpaceName] = useState('')
    const [inviteLink, setInviteLink] = useState('')
    const [copied, setCopied] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { createSpace } = useSpace()
    const { user } = useAuth()
    const { t } = useLanguage()
    const router = useRouter()

    const handleCreateSpace = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const space = await createSpace(spaceName)
            const link = `${window.location.origin}/invite/${space.invite_token}`
            setInviteLink(link)
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

    return (
        <div className="onboarding-container">
            <motion.div
                className="auth-card onboarding-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {step === 1 && (
                    <>
                        {/* Step indicator */}
                        <div className="onboarding-steps">
                            <div className="onboarding-step active" />
                            <div className="onboarding-step" />
                        </div>

                        <div className="onboarding-icon">
                            <Heart size={36} color="white" />
                        </div>
                        <h1 style={{ color: 'white', marginBottom: 8 }}>{t('onboarding.createSpace')}</h1>
                        <p style={{ color: '#94A3B8', marginBottom: 32 }}>
                            {t('onboarding.createSpaceSubtitle')}
                        </p>

                        <form onSubmit={handleCreateSpace}>
                            <div className="input-group" style={{ marginBottom: 20, textAlign: 'left' }}>
                                <label>{t('onboarding.spaceName')}</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder={t('onboarding.spaceNamePlaceholder')}
                                    value={spaceName}
                                    onChange={(e) => setSpaceName(e.target.value)}
                                    required
                                    maxLength={50}
                                />
                            </div>

                            {error && (
                                <div style={{
                                    background: 'rgba(239, 68, 68, 0.12)',
                                    color: '#F87171', padding: '10px 14px',
                                    borderRadius: 10, fontSize: '0.875rem', marginBottom: 16,
                                }}>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg w-full"
                                disabled={loading}
                            >
                                {loading ? t('onboarding.creating') : t('onboarding.createSpaceBtn')}
                                {!loading && <ArrowRight size={18} />}
                            </button>
                        </form>
                    </>
                )}

                {step === 2 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* Step indicator */}
                        <div className="onboarding-steps">
                            <div className="onboarding-step completed" />
                            <div className="onboarding-step active" />
                        </div>

                        <div className="onboarding-icon">
                            <Heart size={36} color="white" fill="white" />
                        </div>
                        <h1 style={{ color: 'white', marginBottom: 8 }}>{t('onboarding.invitePartner')}</h1>
                        <p style={{ color: '#94A3B8', marginBottom: 32 }}>
                            {t('onboarding.inviteSubtitle')}
                        </p>

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
                                {copied ? <><Check size={16} /> {t('onboarding.copied')}</> : <><Copy size={16} /> {t('onboarding.copy')}</>}
                            </button>
                        </div>

                        <button
                            onClick={() => router.push('/map')}
                            className="btn btn-primary btn-lg w-full"
                        >
                            {t('onboarding.goToMap')} <ArrowRight size={18} />
                        </button>

                        <p style={{ color: '#64748B', fontSize: '0.8125rem', marginTop: 16 }}>
                            {t('onboarding.linkNoExpire')}
                        </p>
                    </motion.div>
                )}
            </motion.div>
        </div>
    )
}
