'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Users, Check, X, Loader2 } from 'lucide-react'

export default function InvitePage() {
    const { code } = useParams()
    const supabase = createClient()
    const { user } = useAuth()
    const router = useRouter()
    const [space, setSpace] = useState(null)
    const [loading, setLoading] = useState(true)
    const [joining, setJoining] = useState(false)
    const [status, setStatus] = useState(null) // 'joined', 'already', 'error'

    useEffect(() => {
        const load = async () => {
            // Find space by invite_code
            const { data, error } = await supabase
                .from('spaces')
                .select('id, name, description, created_at')
                .eq('invite_code', code)
                .single()
            if (error || !data) {
                setStatus('notfound')
                setLoading(false)
                return
            }
            setSpace(data)

            // Check if already a member
            if (user) {
                const { data: membership } = await supabase
                    .from('space_members')
                    .select('id')
                    .eq('space_id', data.id)
                    .eq('user_id', user.id)
                    .single()
                if (membership) {
                    setStatus('already')
                }
            }
            setLoading(false)
        }
        load()
    }, [code, user])

    const handleJoin = async () => {
        if (!user) { router.push('/login'); return }
        if (!space) return
        setJoining(true)
        try {
            const { error } = await supabase
                .from('space_members')
                .insert({ space_id: space.id, user_id: user.id, role: 'viewer' })
            if (error) throw error
            setStatus('joined')
        } catch (err) {
            if (err.message?.includes('duplicate')) {
                setStatus('already')
            } else {
                setStatus('error')
            }
        }
        setJoining(false)
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-primary)', padding: 20,
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{
                    maxWidth: 440, width: '100%', textAlign: 'center',
                    background: 'var(--glass-bg)', backdropFilter: 'blur(20px)',
                    border: '1px solid var(--glass-border)', borderRadius: 24,
                    padding: '40px 32px', boxShadow: 'var(--shadow-xl)',
                }}
            >
                <Image src="/umae-icon.png" alt="UMAE" width={56} height={56} style={{ borderRadius: 14, marginBottom: 16 }} />

                {loading ? (
                    <div>
                        <Loader2 size={28} style={{ color: 'var(--primary-2)', animation: 'spin 1s linear infinite' }} />
                        <p style={{ color: 'var(--text-tertiary)', marginTop: 12, fontSize: '0.88rem' }}>Davet yükleniyor...</p>
                    </div>
                ) : status === 'notfound' ? (
                    <div>
                        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔗</div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Davet Bulunamadı</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 20 }}>Bu davet linki geçersiz veya süresi dolmuş.</p>
                        <button onClick={() => router.push('/map')} style={btnStyle}>Ana Sayfaya Dön</button>
                    </div>
                ) : status === 'joined' ? (
                    <div>
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15 }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <Check size={32} style={{ color: 'var(--success)' }} />
                            </div>
                        </motion.div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Ekibe Katıldın! 🎉</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 20 }}>
                            <strong>{space?.name}</strong> ekibine başarıyla katıldın.
                        </p>
                        <button onClick={() => router.push('/spaces')} style={btnStyle}>Ekibime Git</button>
                    </div>
                ) : status === 'already' ? (
                    <div>
                        <div style={{ fontSize: '2rem', marginBottom: 12 }}>✅</div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Zaten Üyesin</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 20 }}>
                            <strong>{space?.name}</strong> ekibinde zaten bulunuyorsun.
                        </p>
                        <button onClick={() => router.push('/spaces')} style={btnStyle}>Ekibime Git</button>
                    </div>
                ) : (
                    <div>
                        <div style={{
                            width: 64, height: 64, borderRadius: 18,
                            background: 'linear-gradient(135deg, var(--primary-1), var(--primary-2))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px', fontSize: '1.5rem',
                        }}>
                            <Users size={28} style={{ color: 'white' }} />
                        </div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Ekibe Davet</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 4 }}>
                            <strong>{space?.name}</strong> ekibine davet edildin.
                        </p>
                        {space?.description && (
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', marginBottom: 20, fontStyle: 'italic' }}>{space.description}</p>
                        )}
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
                            <button onClick={handleJoin} disabled={joining} style={btnStyle}>
                                {joining ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
                                {joining ? 'Katılınıyor...' : 'Katıl'}
                            </button>
                            <button onClick={() => router.push('/map')} style={{
                                ...btnStyle, background: 'var(--bg-tertiary)', color: 'var(--text-primary)',
                            }}>
                                <X size={16} /> Reddet
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    )
}

const btnStyle = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '12px 24px', borderRadius: 14, border: 'none',
    background: 'linear-gradient(135deg, #0F2847, #4285F4)', color: 'white',
    fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
    transition: 'all 0.15s ease',
}
