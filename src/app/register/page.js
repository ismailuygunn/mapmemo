'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { MapPin, Eye, EyeOff } from 'lucide-react'
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
    const router = useRouter()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await signUp(email, password, displayName)
            router.push('/onboarding')
        } catch (err) {
            setError(err.message || 'Something went wrong')
        }
        setLoading(false)
    }

    return (
        <div className="auth-bg">
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16,
                        background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 30px rgba(79, 70, 229, 0.3)',
                    }}>
                        <MapPin size={28} color="white" />
                    </div>
                </div>

                <h1 style={{ textAlign: 'center' }}>Create account</h1>
                <p style={{ textAlign: 'center' }}>Start your travel journey together</p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group" style={{ marginBottom: 16 }}>
                        <label>Your name</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Alex"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: 16 }}>
                        <label>Email</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: 8 }}>
                        <label>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPw ? 'text' : 'password'}
                                className="input"
                                placeholder="Min 6 characters"
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
                        {loading ? 'Creating account...' : 'Create account'}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account?{' '}
                    <Link href="/login">Sign in</Link>
                </div>
            </motion.div>
        </div>
    )
}
