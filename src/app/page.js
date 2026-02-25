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
        <div style={{
          width: 60, height: 60, borderRadius: 16,
          background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: '1.5rem'
        }}>
          📍
        </div>
        <h2 style={{ marginBottom: 8 }}>MapMemo</h2>
        <p style={{ color: '#94A3B8' }}>Loading...</p>
      </div>
    </div>
  )
}
