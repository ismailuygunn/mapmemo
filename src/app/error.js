'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }) {
    useEffect(() => {
        console.error('Page error:', error)
    }, [error])

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '60vh', padding: 40,
        }}>
            <div style={{ textAlign: 'center', maxWidth: 420 }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>
                    Sayfa yüklenemedi
                </h2>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: 20 }}>
                    {error?.message || 'Beklenmeyen bir hata oluştu'}
                </p>
                <button
                    onClick={() => reset()}
                    style={{
                        padding: '10px 24px', borderRadius: 12, border: 'none',
                        background: 'linear-gradient(135deg, #0F2847, #1A3A5C)',
                        color: 'white', fontSize: '0.85rem', fontWeight: 700,
                        cursor: 'pointer',
                    }}
                >
                    🔄 Tekrar Dene
                </button>
            </div>
        </div>
    )
}
