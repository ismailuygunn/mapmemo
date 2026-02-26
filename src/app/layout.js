import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { SpaceProvider } from '@/context/SpaceContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { LanguageProvider } from '@/context/LanguageContext'
import { ToastProvider } from '@/context/ToastContext'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'NAVISO — Travel Together',
  description: 'Pin your travel memories together. Explore, plan, and remember every moment.',
  manifest: '/manifest.json',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#4F46E5',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <LanguageProvider>
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <SpaceProvider>
                  {children}
                  <Toaster
                    theme="dark"
                    position="top-center"
                    richColors
                    toastOptions={{
                      style: {
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        borderRadius: '12px',
                        backdropFilter: 'blur(12px)',
                      }
                    }}
                  />
                </SpaceProvider>
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
