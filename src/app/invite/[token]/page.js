'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useSpace } from '@/context/SpaceContext'
import { useLanguage } from '@/context/LanguageContext'
import { Users, Check, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function InvitePage() {
    const params = useParams()
    const token = params.token
    const { user, loading: authLoading } = useAuth()
    const { joinSpace } = useSpace()
    const { t } = useLanguage()
    const router = useRouter()
    const [status, setStatus] = useState('loading')
    const [error, setError] = useState('')

    useEffect(() => {
        if (authLoading) return
        if (!user) {
            setStatus('needsAuth')
            return
        }
        handleJoin()
    }, [user, authLoading])

    const handleJoin = async () => {
        setStatus('joining')
        try {
            await joinSpace(token)
            setStatus('success')
            setTimeout(() => router.push('/map'), 2000)
        } catch (err) {
            setError(err.message)
            setStatus('error')
        }
    }

    return (
        <div className="onboarding-container">
            <motion.div
                className="auth-card onboarding-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="onboarding-icon">
                    <Users size={36} color="white" />
                </div>

                {status === 'loading' && (
                    <>
                        <h1 style={{ color: 'white' }}>{t('general.loading') || 'Loading...'}</h1>
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                            <Loader2 size={32} color="#D4A853" style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                    </>
                )}

                {status === 'needsAuth' && (
                    <>
                        <h1 style={{ color: 'white', marginBottom: 8 }}>
                            {t('invite.title') || "You're invited! 🎉"}
                        </h1>
                        <p style={{ color: '#94A3B8', marginBottom: 32 }}>
                            {t('invite.subtitle') || 'Join this group space and start exploring together.'}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <Link href={`/register?invite=${token}`} className="btn btn-primary btn-lg w-full" style={{ textAlign: 'center' }}>
                                {t('invite.createAccount') || 'Create account'}
                            </Link>
                            <Link href={`/login?invite=${token}`} className="btn btn-secondary btn-lg w-full" style={{ textAlign: 'center', color: 'white', borderColor: 'rgba(255,255,255,0.15)' }}>
                                {t('invite.haveAccount') || 'I already have an account'}
                            </Link>
                        </div>
                    </>
                )}

                {status === 'joining' && (
                    <>
                        <h1 style={{ color: 'white' }}>{t('invite.joining') || 'Joining space...'}</h1>
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                            <Loader2 size={32} color="#D4A853" style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                    </>
                )}

                {status === 'success' && (
                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: 32,
                            background: '#10B981', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px',
                        }}>
                            <Check size={32} color="white" />
                        </div>
                        <h1 style={{ color: 'white', marginBottom: 8 }}>
                            {t('invite.success') || "You're in! 🎉"}
                        </h1>
                        <p style={{ color: '#94A3B8' }}>
                            {t('invite.redirecting') || 'Redirecting to your shared map...'}
                        </p>
                    </motion.div>
                )}

                {status === 'error' && (
                    <>
                        <h1 style={{ color: 'white', marginBottom: 8 }}>Oops!</h1>
                        <p style={{ color: '#F87171', marginBottom: 24 }}>{error}</p>
                        <Link href="/map" className="btn btn-primary btn-lg w-full" style={{ textAlign: 'center' }}>
                            {t('invite.goToMap') || 'Go to Map'}
                        </Link>
                    </>
                )}
            </motion.div>

            <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
