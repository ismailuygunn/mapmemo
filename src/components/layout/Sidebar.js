'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Map, Compass, Calendar, Settings, LogOut, Gift, ChevronLeft, ChevronRight, MapPin, CalendarDays, LayoutDashboard, Users, BarChart3, Shield, Plane, User, Ticket, Home, Zap, Newspaper, Search, UserPlus, Heart } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { signOut, profile } = useAuth()
    const { t } = useLanguage()
    const [collapsed, setCollapsed] = useState(false)

    // Persist collapse state
    useEffect(() => {
        const saved = localStorage.getItem('mapmemo-sidebar')
        if (saved === 'collapsed') setCollapsed(true)
    }, [])

    const toggleCollapse = () => {
        const next = !collapsed
        setCollapsed(next)
        localStorage.setItem('mapmemo-sidebar', next ? 'collapsed' : 'expanded')
    }

    const navItems = [
        { icon: LayoutDashboard, label: t('nav.dashboard') || 'Panel', href: '/dashboard' },
        { icon: Newspaper, label: 'Feed', href: '/feed' },
        { icon: Search, label: t('Gezginler', 'Travelers'), href: '/discover' },
        { icon: Heart, label: 'Arkadaşlar', href: '/friends' },
        { icon: Compass, label: 'Keşfet', href: '/explore' },
        { icon: Map, label: t('nav.map') || 'Harita', href: '/map' },
        { icon: Compass, label: t('nav.cities') || 'Şehirler', href: '/cities' },
        { icon: Calendar, label: t('nav.planner') || 'Planla', href: '/planner' },
        { icon: Plane, label: t('Uçuşlar', 'Flights'), href: '/flights' },
        { icon: Home, label: 'Konaklama', href: '/airbnb' },
        { icon: Zap, label: 'SOS Plan', href: '/meetups' },
        { icon: Ticket, label: 'Etkinlikler', href: '/events' },
        { icon: Users, label: 'Gruplar', href: '/spaces' },
        { icon: BarChart3, label: t('nav.stats') || 'İstatistik', href: '/stats' },
        { icon: Gift, label: t('nav.capsules') || 'Kapsüller', href: '/capsules' },
        { icon: User, label: 'Profil', href: '/profile' },
        { icon: Settings, label: t('nav.settings') || 'Ayarlar', href: '/settings' },
        ...(profile?.role === 'admin' ? [{ icon: Shield, label: 'Admin', href: '/admin' }] : []),
    ]

    const handleLogout = async () => {
        await signOut()
        router.push('/login')
    }

    return (
        <>
            {/* Desktop Sidebar */}
            <motion.aside
                className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}
                animate={{ width: collapsed ? 72 : 220 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
                {/* Logo */}
                <div className="sidebar-top">
                    <div className="sidebar-logo-area" onClick={() => router.push('/map')}>
                        <div className="sidebar-logo-icon">
                            <MapPin size={20} color="white" />
                        </div>
                        <AnimatePresence>
                            {!collapsed && (
                                <motion.span
                                    className="sidebar-logo-text"
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    NAVISO
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>
                    <button className="sidebar-collapse-btn" onClick={toggleCollapse}>
                        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                {/* Nav Items */}
                <nav className="sidebar-nav">
                    {navItems.map(({ icon: Icon, label, href }) => {
                        const isActive = pathname.startsWith(href)
                        return (
                            <button
                                key={href}
                                className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                                onClick={() => router.push(href)}
                                title={collapsed ? label : undefined}
                            >
                                <span className="sidebar-link-icon">
                                    <Icon size={20} />
                                </span>
                                <AnimatePresence>
                                    {!collapsed && (
                                        <motion.span
                                            className="sidebar-link-label"
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 'auto' }}
                                            exit={{ opacity: 0, width: 0 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            {label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        className="sidebar-active-indicator"
                                        layoutId="sidebar-indicator"
                                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                    />
                                )}
                            </button>
                        )
                    })}
                </nav>

                {/* Logout */}
                <button
                    className="sidebar-link sidebar-logout"
                    onClick={handleLogout}
                    title={collapsed ? t('nav.signOut') : undefined}
                >
                    <span className="sidebar-link-icon">
                        <LogOut size={20} />
                    </span>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span
                                className="sidebar-link-label"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                {t('nav.signOut')}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </motion.aside>

            {/* Mobile Bottom Nav — Floating Pill Style */}
            <nav className="mobile-nav">
                <div className="mobile-nav-pill">
                    {navItems.map(({ icon: Icon, label, href }) => {
                        const isActive = pathname.startsWith(href)
                        return (
                            <button
                                key={href}
                                className={`mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`}
                                onClick={() => router.push(href)}
                            >
                                <span className="mobile-nav-icon">
                                    <Icon size={20} />
                                </span>
                                {isActive && (
                                    <motion.span
                                        className="mobile-nav-label"
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                    >
                                        {label}
                                    </motion.span>
                                )}
                                {isActive && (
                                    <motion.div
                                        className="mobile-nav-active-dot"
                                        layoutId="mobile-nav-dot"
                                        transition={{ type: 'spring', damping: 25 }}
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>
            </nav>
        </>
    )
}
