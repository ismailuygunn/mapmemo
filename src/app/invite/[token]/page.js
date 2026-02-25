'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useSpace } from '@/context/SpaceContext'
import { Heart, Check, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function InvitePage() {
    const params = useParams()
    const token = params.token
    const { user, loading: authLoading } = useAuth()
    const { joinSpace } = useSpace()
    const router = useRouter()
    const [status, setStatus] = useState('loading') // loading | needsAuth | joining | success | error
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
                    <Heart size={36} color="white" fill="white" />
                </div>

                {status === 'loading' && (
                    <>
                        <h1 style={{ color: 'white' }}>Loading...</h1>
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                            <Loader2 size={32} color="#818CF8" style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                    </>
                )}

                {status === 'needsAuth' && (
                    <>
                        <h1 style={{ color: 'white', marginBottom: 8 }}>You're invited! 💕</h1>
                        <p style={{ color: '#94A3B8', marginBottom: 32 }}>
                            Someone special wants to share their travel map with you. Create an account or sign in to join.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <Link href={`/register?invite=${token}`} className="btn btn-primary btn-lg w-full" style={{ textAlign: 'center' }}>
                                Create account
                            </Link>
                            <Link href={`/login?invite=${token}`} className="btn btn-secondary btn-lg w-full" style={{ textAlign: 'center', color: 'white', borderColor: 'rgba(255,255,255,0.15)' }}>
                                I already have an account
                            </Link>
                        </div>
                    </>
                )}

                {status === 'joining' && (
                    <>
                        <h1 style={{ color: 'white' }}>Joining space...</h1>
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                            <Loader2 size={32} color="#818CF8" style={{ animation: 'spin 1s linear infinite' }} />
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
                        <h1 style={{ color: 'white', marginBottom: 8 }}>You're in! 🎉</h1>
                        <p style={{ color: '#94A3B8' }}>Redirecting to your shared map...</p>
                    </motion.div>
                )}

                {status === 'error' && (
                    <>
                        <h1 style={{ color: 'white', marginBottom: 8 }}>Oops!</h1>
                        <p style={{ color: '#F87171', marginBottom: 24 }}>{error}</p>
                        <Link href="/map" className="btn btn-primary btn-lg w-full" style={{ textAlign: 'center' }}>
                            Go to Map
                        </Link>
                    </>
                )}
            </motion.div>

            <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    )
}
