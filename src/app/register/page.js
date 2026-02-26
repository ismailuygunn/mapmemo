'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { MapPin, Eye, EyeOff, Globe } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function RegisterPage() {
    const [displayName, setDisplayName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signUp } = useAuth()
    const { t, locale, setLocale } = useLanguage()
    const router = useRouter()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await signUp(email, password, displayName)
            router.push('/onboarding')
        } catch (err) {
            setError(err.message || t('auth.somethingWrong'))
        }
        setLoading(false)
    }

    return (
        <div className="auth-bg">
            {/* Language Switcher */}
            <motion.button
                className="lang-switcher-float"
                onClick={() => setLocale(locale === 'en' ? 'tr' : 'en')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <Globe size={16} />
                {locale === 'en' ? '🇹🇷 Türkçe' : '🇬🇧 English'}
            </motion.button>

            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                    <motion.div
                        style={{
                            width: 56, height: 56, borderRadius: 16,
                            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 30px rgba(79, 70, 229, 0.3)',
                        }}
                        animate={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                    >
                        <MapPin size={28} color="white" />
                    </motion.div>
                </div>

                <h1 style={{ textAlign: 'center' }}>{t('auth.createAccount')}</h1>
                <p style={{ textAlign: 'center' }}>{t('auth.registerSubtitle')}</p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group" style={{ marginBottom: 16 }}>
                        <label>{t('auth.yourName')}</label>
                        <input
                            type="text"
                            className="input"
                            placeholder={t('auth.namePlaceholder')}
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: 16 }}>
                        <label>{t('auth.email')}</label>
                        <input
                            type="email"
                            className="input"
                            placeholder={t('auth.emailPlaceholder')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: 8 }}>
                        <label>{t('auth.password')}</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPw ? 'text' : 'password'}
                                className="input"
                                placeholder={t('auth.minChars')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(!showPw)}
                                style={{
                                    position: 'absolute', right: 12, top: '50%',
                                    transform: 'translateY(-50%)', background: 'none',
                                    border: 'none', cursor: 'pointer', color: '#64748B', padding: 4,
                                }}
                            >
                                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            style={{
                                background: 'rgba(239, 68, 68, 0.12)',
                                color: '#F87171',
                                padding: '10px 14px',
                                borderRadius: 10,
                                fontSize: '0.875rem',
                                marginBottom: 16,
                                marginTop: 8,
                            }}
                        >
                            {error}
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg w-full"
                        disabled={loading}
                        style={{ marginTop: 16 }}
                    >
                        {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
                    </button>
                </form>

                <div className="auth-footer">
                    {t('auth.hasAccount')}{' '}
                    <Link href="/login">{t('auth.signInLink')}</Link>
                </div>
            </motion.div>
        </div>
    )
}
