'use client'

export default function GlobalError({ error, reset }) {
    return (
        <html lang="en" data-theme="dark">
            <body style={{
                margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '100vh', background: '#0F172A', color: '#E2E8F0',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            }}>
                <div style={{ textAlign: 'center', padding: 40, maxWidth: 480 }}>
                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>😵</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>
                        Bir şeyler ters gitti
                    </h2>
                    <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>
                        Uygulama beklenmeyen bir hata ile karşılaştı.
                    </p>
                    <p style={{ color: '#64748B', fontSize: '0.75rem', marginBottom: 24, wordBreak: 'break-all' }}>
                        {error?.message || 'Bilinmeyen hata'}
                    </p>
                    <button
                        onClick={() => reset()}
                        style={{
                            padding: '12px 32px', borderRadius: 12, border: 'none',
                            background: 'linear-gradient(135deg, #0F2847, #1A3A5C)',
                            color: 'white', fontSize: '0.9rem', fontWeight: 700,
                            cursor: 'pointer', marginRight: 12,
                        }}
                    >
                        🔄 Tekrar Dene
                    </button>
                    <button
                        onClick={() => window.location.href = '/login'}
                        style={{
                            padding: '12px 32px', borderRadius: 12, border: '1px solid #334155',
                            background: 'transparent', color: '#94A3B8',
                            fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        🏠 Giriş Sayfası
                    </button>
                </div>
            </body>
        </html>
    )
}
