import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { SpaceProvider } from '@/context/SpaceContext'
import { ThemeProvider } from '@/context/ThemeContext'

export const metadata = {
  title: 'MapMemo — Couple Travel Map',
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
        <ThemeProvider>
          <AuthProvider>
            <SpaceProvider>
              {children}
            </SpaceProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
