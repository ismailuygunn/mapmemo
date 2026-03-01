'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { Eye, EyeOff, Globe, ChevronRight, Users, MapPin, Compass } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
    return <Suspense><LoginInner /></Suspense>
}

function LoginInner() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signIn, signInWithGoogle } = useAuth()
    const { t, locale, setLocale } = useLanguage()
    const router = useRouter()
    const searchParams = useSearchParams()
    const inviteToken = searchParams.get('invite')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await signIn(email, password)
            router.push(inviteToken ? `/invite/${inviteToken}` : '/map')
        } catch (err) {
            const msg = err.message || ''
            if (msg.includes('Invalid login')) setError(locale === 'tr' ? 'E-posta veya şifre hatalı' : 'Invalid email or password')
            else if (msg.includes('Email not confirmed')) setError(locale === 'tr' ? 'E-postanı onaylaman gerekiyor' : 'Please confirm your email')
            else setError(msg || t('auth.invalidCredentials'))
        }
        setLoading(false)
    }

    const handleGoogle = async () => {
        try { await signInWithGoogle() } catch (err) { setError(err.message) }
    }

    return (
        <div className="auth-page">
            <div className="auth-bg-effects">
                <div className="auth-bg-orb auth-bg-orb-1" />
                <div className="auth-bg-orb auth-bg-orb-2" />
                <div className="auth-bg-orb auth-bg-orb-3" />
            </div>

            <motion.button
                className="auth-lang-btn"
                onClick={() => setLocale(locale === 'en' ? 'tr' : 'en')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            >
                <Globe size={14} />
                {locale === 'en' ? 'TR' : 'EN'}
            </motion.button>

            <div className="auth-layout">
                <motion.div className="auth-brand"
                    initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
                >
                    <div style={{ marginBottom: 24 }}>
                        <img src="/umae-logo-dark.png?v=2" alt="UMAE" width={180} height={180} style={{ objectFit: 'contain', borderRadius: 16 }} />
                    </div>
                    <p className="auth-brand-subtitle">
                        {locale === 'tr'
                            ? 'Seyahat grubunla giriş yap, planlamaya devam et.'
                            : 'Sign in to your travel group and keep planning.'}
                    </p>
                    <div className="auth-brand-features">
                        <div className="auth-feature"><Users size={16} /> {locale === 'tr' ? 'Grup seyahat planlaması' : 'Group trip planning'}</div>
                        <div className="auth-feature"><MapPin size={16} /> {locale === 'tr' ? 'Oteller, uçuşlar, Airbnb' : 'Hotels, flights, Airbnb'}</div>
                        <div className="auth-feature"><Compass size={16} /> {locale === 'tr' ? 'Harita üzerinde keşfet' : 'Explore on map'}</div>
                    </div>
                </motion.div>

                <motion.div className="auth-card"
                    initial={{ opacity: 0, y: 20, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    <h2 className="auth-card-title">{locale === 'tr' ? 'Tekrar Hoş Geldin' : 'Welcome Back'}</h2>
                    <p className="auth-card-subtitle">{locale === 'tr' ? 'Hesabına giriş yap 🌍' : 'Sign in to your account 🌍'}</p>

                    <button className="auth-google-btn" onClick={handleGoogle} type="button">
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        {locale === 'tr' ? 'Google ile giriş yap' : 'Sign in with Google'}
                    </button>

                    <div className="auth-divider">
                        <span>{locale === 'tr' ? 'veya e-posta ile' : 'or with email'}</span>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="auth-input-group">
                            <label>{locale === 'tr' ? 'E-posta' : 'Email'}</label>
                            <input
                                type="email" className="auth-input"
                                placeholder="hello@example.com"
                                value={email} onChange={e => setEmail(e.target.value)}
                                required autoComplete="email" autoFocus
                            />
                        </div>

                        <div className="auth-input-group">
                            <label>{locale === 'tr' ? 'Şifre' : 'Password'}</label>
                            <div className="auth-input-wrapper">
                                <input
                                    type={showPw ? 'text' : 'password'} className="auth-input"
                                    placeholder="••••••••"
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    required minLength={6} autoComplete="current-password"
                                />
                                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <motion.div className="auth-error" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                                {error}
                            </motion.div>
                        )}

                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? (locale === 'tr' ? 'Giriş yapılıyor...' : 'Signing in...') : (locale === 'tr' ? 'Giriş Yap' : 'Sign In')}
                            {!loading && <ChevronRight size={18} />}
                        </button>
                    </form>

                    <p className="auth-footer-text">
                        {locale === 'tr' ? 'Hesabın yok mu?' : "Don't have an account?"}{' '}
                        <Link href="/register">{locale === 'tr' ? 'Kayıt Ol' : 'Sign Up'}</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    )
}
