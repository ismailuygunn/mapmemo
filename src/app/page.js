'use client'

// Landing page — redirect to /map if logged in, else /login
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      router.replace(user ? '/map' : '/login')
    }
  }, [user, loading, router])

  return (
    <div className="auth-bg">
      <div style={{ color: 'white', textAlign: 'center' }}>
        <img src="/umae-icon.png" alt="UMAE" style={{
          width: 72, height: 72, borderRadius: 18,
          margin: '0 auto 16px', display: 'block',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }} />
        <h2 style={{ marginBottom: 8, letterSpacing: '0.15em', fontWeight: 700 }}>UMAE</h2>
        <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Loading...</p>
      </div>
    </div>
  )
}
