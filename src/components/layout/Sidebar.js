'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Map, Compass, Calendar, Settings, LogOut, Gift } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { signOut } = useAuth()
    const { t } = useLanguage()

    const navItems = [
        { icon: Map, label: t('nav.map'), href: '/map' },
        { icon: Compass, label: t('nav.cities'), href: '/cities' },
        { icon: Calendar, label: t('nav.planner'), href: '/planner' },
        { icon: Gift, label: t('nav.capsules'), href: '/capsules' },
        { icon: Settings, label: t('nav.settings'), href: '/settings' },
    ]

    const handleLogout = async () => {
        await signOut()
        router.push('/login')
    }

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">M</div>
                <nav className="sidebar-nav">
                    {navItems.map(({ icon: Icon, label, href }) => (
                        <button
                            key={href}
                            className={`sidebar-link ${pathname.startsWith(href) ? 'sidebar-link-active' : ''}`}
                            onClick={() => router.push(href)}
                            title={label}
                        >
                            <Icon size={22} />
                            <span className="sidebar-tooltip">{label}</span>
                        </button>
                    ))}
                </nav>
                <button
                    className="sidebar-link"
                    onClick={handleLogout}
                    title={t('nav.signOut')}
                    style={{ marginTop: 'auto' }}
                >
                    <LogOut size={20} />
                    <span className="sidebar-tooltip">{t('nav.signOut')}</span>
                </button>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="mobile-nav">
                <div className="mobile-nav-inner">
                    {navItems.map(({ icon: Icon, label, href }) => (
                        <button
                            key={href}
                            className={`mobile-nav-link ${pathname.startsWith(href) ? 'mobile-nav-link-active' : ''}`}
                            onClick={() => router.push(href)}
                        >
                            <Icon size={20} />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </>
    )
}
